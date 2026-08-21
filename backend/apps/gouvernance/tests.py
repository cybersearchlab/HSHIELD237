from django.test import TestCase, override_settings
from django.urls import reverse

from apps.accounts.models import Role, Utilisateur
from apps.campagnes.models import Campagne, Departement, ScenarioPhishing
from apps.simulation.models import ConfigurationEnvoi
from apps.simulation.services import EnvoiCampagneError, EnvoiCampagneService

from .models import Consentement, JournalAudit, StatutConsentement


def _creer_campagne_prete_a_envoyer():
    """Campagne avec configuration d'envoi et un scénario, mais sans
    consentement — utilisée pour vérifier le blocage."""
    campagne = Campagne.objects.create(departement=Departement.IT)
    ConfigurationEnvoi.objects.create(
        campagne=campagne,
        expediteur_nom="Portail Test",
        expediteur_email="noreply@test.cm",
        reply_to="reponses-test@hshield237.local",
        delai_entre_envois=0,
    )
    ScenarioPhishing.objects.create(
        campagne=campagne,
        objet_email="Test",
        corps_email="Contenu.",
        url_fausse_page="https://exemple.cm/",
        secteur_cible="Test",
        destinataire_email="employe-test@entreprise.cm",
    )
    return campagne


class BlocageLancementSansConsentementTests(TestCase):
    """Le service d'envoi doit refuser de lancer une campagne tant qu'aucun
    consentement au statut « valide » n'existe."""

    def test_lancement_bloque_sans_consentement(self):
        campagne = _creer_campagne_prete_a_envoyer()
        with self.assertRaises(EnvoiCampagneError):
            EnvoiCampagneService(campagne)

    def test_lancement_bloque_avec_consentement_en_attente(self):
        campagne = _creer_campagne_prete_a_envoyer()
        Consentement.objects.create(
            campagne=campagne, responsable_nom="Resp Test", responsable_email="resp@entreprise.cm"
        )
        with self.assertRaises(EnvoiCampagneError):
            EnvoiCampagneService(campagne)

    def test_lancement_bloque_avec_consentement_refuse(self):
        campagne = _creer_campagne_prete_a_envoyer()
        Consentement.objects.create(
            campagne=campagne,
            responsable_nom="Resp Test",
            responsable_email="resp@entreprise.cm",
            statut=StatutConsentement.REFUSE,
        )
        with self.assertRaises(EnvoiCampagneError):
            EnvoiCampagneService(campagne)

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_lancement_autorise_apres_validation(self):
        campagne = _creer_campagne_prete_a_envoyer()
        Consentement.objects.create(
            campagne=campagne,
            responsable_nom="Resp Test",
            responsable_email="resp@entreprise.cm",
            statut=StatutConsentement.VALIDE,
        )
        trackings = EnvoiCampagneService(campagne).envoyer_campagne()
        self.assertEqual(len(trackings), 1)


class ValidationConsentementTests(TestCase):
    """La validation/refus d'un consentement n'est possible que par le
    responsable désigné, authentifié depuis l'application, et crée une
    entrée dans le journal d'audit."""

    def setUp(self):
        self.campagne = Campagne.objects.create(departement=Departement.RH)
        self.consentement = Consentement.objects.create(
            campagne=self.campagne,
            responsable_nom="Jeanne Responsable",
            responsable_email="jeanne.responsable@entreprise.cm",
        )
        self.responsable = Utilisateur.objects.create_user(
            username="jeanne",
            email="jeanne.responsable@entreprise.cm",
            password="Responsable1234!",
            role=Role.RESPONSABLE,
        )
        self.valider_url = reverse("gouvernance-consentement-valider", kwargs={"consentement_id": self.consentement.id})
        self.refuser_url = reverse("gouvernance-consentement-refuser", kwargs={"consentement_id": self.consentement.id})

    def test_validation_par_le_bon_responsable(self):
        self.client.force_login(self.responsable)
        response = self.client.post(self.valider_url)
        self.assertEqual(response.status_code, 200)

        self.consentement.refresh_from_db()
        self.assertEqual(self.consentement.statut, StatutConsentement.VALIDE)
        self.assertIsNotNone(self.consentement.date_validation)

        self.campagne.refresh_from_db()
        self.assertTrue(self.campagne.perimetre_valide)

        entree = JournalAudit.objects.filter(action="Consentement validé").first()
        self.assertIsNotNone(entree)
        self.assertEqual(entree.auteur, self.responsable)

    def test_refus_par_le_bon_responsable(self):
        self.client.force_login(self.responsable)
        response = self.client.post(self.refuser_url)
        self.assertEqual(response.status_code, 200)
        self.consentement.refresh_from_db()
        self.assertEqual(self.consentement.statut, StatutConsentement.REFUSE)

    def test_validation_refusee_par_un_autre_responsable(self):
        autre = Utilisateur.objects.create_user(
            username="autre",
            email="autre-responsable@entreprise.cm",
            password="Responsable1234!",
            role=Role.RESPONSABLE,
        )
        self.client.force_login(autre)
        response = self.client.post(self.valider_url)
        self.assertEqual(response.status_code, 403)
        self.consentement.refresh_from_db()
        self.assertEqual(self.consentement.statut, StatutConsentement.EN_ATTENTE)

    def test_validation_refusee_pour_un_role_non_responsable(self):
        consultant = Utilisateur.objects.create_user(
            username="consultant1",
            email="consultant-test@entreprise.cm",
            password="Consultant1234!",
            role=Role.CONSULTANT,
        )
        self.client.force_login(consultant)
        response = self.client.post(self.valider_url)
        self.assertEqual(response.status_code, 403)


class ListeConsentementsTests(TestCase):
    """Un consultant voit toutes les demandes ; un responsable ne voit que
    celles qui lui sont désignées."""

    def setUp(self):
        self.campagne_a = Campagne.objects.create(departement=Departement.RH)
        self.campagne_b = Campagne.objects.create(departement=Departement.COMPTABILITE)
        Consentement.objects.create(
            campagne=self.campagne_a, responsable_nom="Jeanne", responsable_email="jeanne@entreprise.cm"
        )
        Consentement.objects.create(
            campagne=self.campagne_b, responsable_nom="Paul", responsable_email="paul@entreprise.cm"
        )
        self.consultant = Utilisateur.objects.create_user(
            username="consultant2", email="consultant2@entreprise.cm", password="Consultant1234!", role=Role.CONSULTANT
        )
        self.jeanne = Utilisateur.objects.create_user(
            username="jeanne2", email="jeanne@entreprise.cm", password="Responsable1234!", role=Role.RESPONSABLE
        )
        self.list_url = reverse("gouvernance-consentements")

    def test_consultant_voit_toutes_les_demandes(self):
        self.client.force_login(self.consultant)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 2)

    def test_responsable_ne_voit_que_ses_propres_demandes(self):
        self.client.force_login(self.jeanne)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["responsable_email"], "jeanne@entreprise.cm")
