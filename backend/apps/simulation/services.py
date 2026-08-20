import logging
import time

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils.html import escape

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
    trafic massif par le relais SMTP du client.
    """

    def __init__(self, campagne, delai_entre_envois=None):
        self.campagne = campagne
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
        )
        message.attach_alternative(corps_html, "text/html")

        try:
            message.send(fail_silently=False)
        except Exception as exc:  # erreurs réseau/SMTP
            raise EnvoiCampagneError(f"Envoi impossible vers {destinataire_email} : {exc}") from exc

        logger.info("Scénario #%s envoyé à %s (tracking %s)", scenario.id, destinataire_email, tracking.id)
        return tracking

    def envoyer_campagne(self, destinataires_par_email=None):
        """Envoie chaque scénario de la campagne aux destinataires fournis
        (liste d'emails) ou, à défaut, à l'email de test du scénario s'il en
        possède un. Respecte le délai configuré entre deux envois."""
        scenarios = list(self.campagne.scenarios.all())
        if not scenarios:
            raise EnvoiCampagneError("Cette campagne ne contient aucun scénario à envoyer.")

        trackings = []
        premier_envoi = True
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
