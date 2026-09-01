import logging
import time

from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.utils.html import escape

from apps.campagnes.services import departement_label
from apps.gouvernance.models import StatutConsentement

from .models import ConfigurationEnvoi, EnvoiTracking

logger = logging.getLogger(__name__)


class EnvoiCampagneError(Exception):
    """Levée quand l'envoi d'une campagne (ou d'un scénario) ne peut pas aboutir."""


class EnvoiCampagneService:
    """Envoie les scénarios d'une campagne par email, via le backend SMTP
    natif de Django (EMAIL_HOST/EMAIL_PORT/EMAIL_HOST_USER/EMAIL_HOST_PASSWORD
    — jamais un serveur SMTP auto-hébergé). L'expéditeur affiché (From) et le
    Reply-To sont ceux configurés sur la campagne, distincts du compte SMTP
    authentifié. Le débit d'envoi est limité pour éviter d'être signalé comme
    trafic massif par le relais SMTP du client. Aucun envoi n'a lieu tant que
    le responsable désigné n'a pas validé la campagne depuis l'application
    (voir apps.gouvernance.Consentement).
    """

    def __init__(self, campagne, delai_entre_envois=None):
        self.campagne = campagne

        consentement = getattr(campagne, "consentement", None)
        if consentement is None or consentement.statut != StatutConsentement.VALIDE:
            raise EnvoiCampagneError(
                "Cette campagne ne peut pas être lancée : aucun consentement "
                "validé n'existe. Le responsable désigné doit d'abord valider "
                "la campagne depuis l'application."
            )

        try:
            self.config = campagne.configuration_envoi
        except ConfigurationEnvoi.DoesNotExist as exc:
            raise EnvoiCampagneError(
                "Aucune configuration d'envoi (expéditeur affiché, Reply-To) "
                "n'est définie pour cette campagne."
            ) from exc
        if not self.config.expediteur_email or not self.config.reply_to:
            raise EnvoiCampagneError(
                "La configuration d'envoi de cette campagne est incomplète "
                "(expéditeur affiché et Reply-To requis)."
            )
        self.delai_entre_envois = (
            delai_entre_envois if delai_entre_envois is not None else self.config.delai_entre_envois
        )

        # Connexion SMTP construite explicitement à partir des réglages
        # saisis par l'administrateur (Paramètres > API & IA), avec repli
        # sur .env/settings — plutôt que de dépendre implicitement des
        # réglages globaux Django, pour que la valeur admin prime
        # réellement (voir apps.parametres.services).
        from apps.parametres.services import get_parametre, get_parametre_bool, get_parametre_int

        self.connection = get_connection(
            host=get_parametre("EMAIL_HOST", settings.EMAIL_HOST),
            port=get_parametre_int("EMAIL_PORT", settings.EMAIL_PORT),
            username=get_parametre("EMAIL_HOST_USER", settings.EMAIL_HOST_USER),
            password=get_parametre("EMAIL_HOST_PASSWORD", settings.EMAIL_HOST_PASSWORD),
            use_tls=get_parametre_bool("EMAIL_USE_TLS", settings.EMAIL_USE_TLS),
        )

    def _construire_url_capture(self, tracking_id):
        base = settings.SIMULATION_BASE_URL.rstrip("/")
        return f"{base}/simulation/capture/{tracking_id}/"

    def _construire_url_pixel(self, tracking_id):
        base = settings.SIMULATION_BASE_URL.rstrip("/")
        return f"{base}/simulation/pixel/{tracking_id}/"

    def envoyer_scenario(self, scenario, destinataire_email):
        """Envoie un scénario à un destinataire donné et retourne le
        EnvoiTracking créé (dont l'id sert d'identifiant de tracking)."""
        tracking = EnvoiTracking.objects.create(scenario=scenario, destinataire_email=destinataire_email)
        url_capture = self._construire_url_capture(tracking.id)
        url_pixel = self._construire_url_pixel(tracking.id)

        # Le corps texte reste lisible tel quel dans un client sans HTML.
        corps_texte = scenario.corps_email
        if url_capture not in corps_texte:
            corps_texte = f"{corps_texte}\n\n{url_capture}"

        # Une alternative HTML est toujours jointe : le pixel de suivi (image
        # invisible) ne peut être chargé que par un client capable d'afficher
        # du HTML, quel que soit le mode (texte ou HTML) choisi pour le
        # scénario lui-même.
        if scenario.est_html:
            corps_html = scenario.corps_email
        else:
            corps_html = escape(scenario.corps_email).replace("\n", "<br>")
        if url_capture not in corps_html:
            corps_html = f'{corps_html}<br><br><a href="{url_capture}">{url_capture}</a>'
        corps_html += f'<img src="{url_pixel}" width="1" height="1" alt="" style="display:none" />'

        message = EmailMultiAlternatives(
            subject=scenario.objet_email,
            body=corps_texte,
            from_email=f"{self.config.expediteur_nom} <{self.config.expediteur_email}>".strip(),
            to=[destinataire_email],
            reply_to=[self.config.reply_to],
            connection=self.connection,
        )
        message.attach_alternative(corps_html, "text/html")

        try:
            message.send(fail_silently=False)
        except Exception as exc:  # erreurs réseau/SMTP
            raise EnvoiCampagneError(f"Envoi impossible vers {destinataire_email} : {exc}") from exc

        logger.info("Scénario #%s envoyé à %s (tracking %s)", scenario.id, destinataire_email, tracking.id)
        return tracking

    def _scenario_pour_departement(self, departement):
        """Sélectionne le scénario de la campagne ciblant explicitement ce
        département ; à défaut, le scénario générique (aucun département
        ciblé) s'il en existe un."""
        scenarios = list(self.campagne.scenarios.all())
        for scenario in scenarios:
            if departement in scenario.departements_cibles:
                return scenario
        for scenario in scenarios:
            if not scenario.departements_cibles:
                return scenario
        return None

    def envoyer_campagne(self, destinataires_par_email=None):
        """Envoie la campagne à ses destinataires.

        Si la campagne possède une liste de `Destinataire` (jour 10), chacun
        reçoit le scénario ciblant son département (ou le scénario générique
        à défaut). Sinon, retombe sur le comportement des jours 8-9 : la
        liste d'emails fournie (ou l'email de test de chaque scénario) reçoit
        chaque scénario indistinctement. Respecte le délai configuré entre
        deux envois."""
        scenarios = list(self.campagne.scenarios.all())
        if not scenarios:
            raise EnvoiCampagneError("Cette campagne ne contient aucun scénario à envoyer.")

        trackings = []
        premier_envoi = True

        destinataires_campagne = list(self.campagne.destinataires.all())
        if destinataires_campagne and destinataires_par_email is None:
            for destinataire in destinataires_campagne:
                scenario = self._scenario_pour_departement(destinataire.departement)
                if scenario is None:
                    raise EnvoiCampagneError(
                        f"Aucun scénario ne cible le département "
                        f"« {departement_label(destinataire.departement)} » et aucun scénario "
                        f"générique n'est défini sur cette campagne."
                    )
                if not premier_envoi and self.delai_entre_envois:
                    time.sleep(self.delai_entre_envois)
                premier_envoi = False
                trackings.append(self.envoyer_scenario(scenario, destinataire.email))
            return trackings

        for scenario in scenarios:
            destinataires = destinataires_par_email or (
                [scenario.destinataire_email] if scenario.destinataire_email else []
            )
            for destinataire_email in destinataires:
                if not premier_envoi and self.delai_entre_envois:
                    time.sleep(self.delai_entre_envois)
                premier_envoi = False
                trackings.append(self.envoyer_scenario(scenario, destinataire_email))

        if not trackings:
            raise EnvoiCampagneError(
                "Aucun destinataire fourni et aucun scénario de cette campagne "
                "ne possède d'email de destinataire de test."
            )
        return trackings

    def envoyer_aux_employes(self, cible, employe_id=None):
        """Envoie la campagne à un ou plusieurs employés réels de
        l'annuaire (apps.employes.Employe), plutôt qu'à une adresse de
        diffusion — chacun reçoit un message individuel (voir
        envoyer_scenario, qui ne place jamais qu'un seul destinataire dans
        l'en-tête). `cible` vaut "tous" (tous les employés du département
        de la campagne) ou "un_employe" (un seul, désigné par employe_id).
        """
        from apps.employes.models import Employe

        if cible == "un_employe":
            if not employe_id:
                raise EnvoiCampagneError("Aucun employé sélectionné.")
            try:
                employes = [Employe.objects.get(pk=employe_id, departement=self.campagne.departement)]
            except Employe.DoesNotExist as exc:
                raise EnvoiCampagneError(
                    "Cet employé n'existe pas ou n'appartient pas au département de cette campagne."
                ) from exc
        else:
            employes = list(Employe.objects.filter(departement=self.campagne.departement))
            if not employes:
                raise EnvoiCampagneError(
                    "Aucun employé n'est enregistré pour ce département — configurez "
                    "l'annuaire des employés (voir Employés) avant de lancer la campagne."
                )

        trackings = []
        premier_envoi = True
        for employe in employes:
            scenario = self._scenario_pour_departement(employe.departement)
            if scenario is None:
                raise EnvoiCampagneError(
                    f"Aucun scénario ne cible le département "
                    f"« {departement_label(employe.departement)} » et aucun scénario "
                    f"générique n'est défini sur cette campagne."
                )
            if not premier_envoi and self.delai_entre_envois:
                time.sleep(self.delai_entre_envois)
            premier_envoi = False
            trackings.append(self.envoyer_scenario(scenario, employe.email))
        return trackings
