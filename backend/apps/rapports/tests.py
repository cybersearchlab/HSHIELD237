from django.test import TestCase
from django.urls import reverse

from apps.accounts.models import Role, Utilisateur
from apps.campagnes.models import Campagne, Departement, ScenarioPhishing
from apps.simulation.models import EnvoiTracking, Interaction, TypeInteraction


class RapportCampagneTests(TestCase):
    """Vérifie que le rapport PDF est généré correctement à partir des
    données réelles d'une campagne, et que l'accès reste réservé aux rôles
    consultant/administrateur."""

    def setUp(self):
        self.consultant = Utilisateur.objects.create_user(
            username="consultant-rapport",
            email="consultant-rapport@hshield237.local",
            password="Test1234!",
            role=Role.CONSULTANT,
        )
        self.employe = Utilisateur.objects.create_user(
            username="employe-rapport",
            email="employe-rapport@hshield237.local",
            password="Test1234!",
            role=Role.EMPLOYE,
        )
        self.campagne = Campagne.objects.create(departement=Departement.IT)
        self.url = reverse("campagne-rapport", kwargs={"campagne_id": self.campagne.id})

    def test_acces_refuse_sans_authentification(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 401)

    def test_acces_refuse_pour_un_role_non_autorise(self):
        self.client.force_login(self.employe)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 403)

    def test_rapport_genere_pour_une_campagne_sans_aucun_envoi(self):
        self.client.force_login(self.consultant)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertTrue(response.content.startswith(b"%PDF"))

    def test_rapport_reflete_les_interactions_reelles(self):
        scenario = ScenarioPhishing.objects.create(
            campagne=self.campagne,
            objet_email="Test",
            corps_email="Contenu.",
            url_fausse_page="https://exemple.cm/",
            secteur_cible="Test",
        )
        tracking = EnvoiTracking.objects.create(scenario=scenario, destinataire_email="employe-test@entreprise.cm")
        Interaction.objects.create(envoi=tracking, type=TypeInteraction.OUVERTURE)
        Interaction.objects.create(envoi=tracking, type=TypeInteraction.CLIC)
        Interaction.objects.create(envoi=tracking, type=TypeInteraction.SOUMISSION)

        self.client.force_login(self.consultant)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.content.startswith(b"%PDF"))
        self.assertGreater(len(response.content), 500)
