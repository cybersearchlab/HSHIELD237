from django.test import TestCase

from apps.accounts.models import Role, Utilisateur
from apps.campagnes.models import Departement

from .models import Employe


class EmployeViewSetTests(TestCase):
    """Annuaire des employés, géré par l'administrateur — lecture ouverte
    au consultant (il en a besoin pour choisir un destinataire au
    lancement d'une campagne), écriture réservée à l'administrateur."""

    def setUp(self):
        self.administrateur = Utilisateur.objects.create_user(
            username="admin-employes",
            email="admin-employes@hshield237.local",
            password="Test1234!",
            role=Role.ADMINISTRATEUR,
        )
        self.consultant = Utilisateur.objects.create_user(
            username="consultant-employes",
            email="consultant-employes@hshield237.local",
            password="Test1234!",
            role=Role.CONSULTANT,
        )
        Employe.objects.create(nom="Alice", email="alice@entreprise.cm", departement=Departement.IT)
        Employe.objects.create(nom="Bob", email="bob@entreprise.cm", departement=Departement.RH)

    def _results(self, response):
        data = response.data
        return data["results"] if isinstance(data, dict) and "results" in data else data

    def test_consultant_peut_lister(self):
        self.client.force_login(self.consultant)
        response = self.client.get("/api/employes/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(self._results(response)), 2)

    def test_filtre_par_departement(self):
        self.client.force_login(self.consultant)
        response = self.client.get("/api/employes/", {"departement": Departement.IT})
        results = self._results(response)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["email"], "alice@entreprise.cm")

    def test_creation_reservee_a_l_administrateur(self):
        self.client.force_login(self.consultant)
        response = self.client.post(
            "/api/employes/",
            {"nom": "Charlie", "email": "charlie@entreprise.cm", "departement": Departement.IT},
        )
        self.assertEqual(response.status_code, 403)

    def test_administrateur_peut_creer(self):
        self.client.force_login(self.administrateur)
        response = self.client.post(
            "/api/employes/",
            {"nom": "Charlie", "email": "charlie@entreprise.cm", "departement": Departement.IT},
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Employe.objects.count(), 3)

    def test_email_deja_utilise_refuse(self):
        self.client.force_login(self.administrateur)
        response = self.client.post(
            "/api/employes/",
            {"nom": "Doublon", "email": "alice@entreprise.cm", "departement": Departement.RH},
        )
        self.assertEqual(response.status_code, 400)

    def test_departement_inconnu_refuse(self):
        self.client.force_login(self.administrateur)
        response = self.client.post(
            "/api/employes/",
            {"nom": "Charlie", "email": "charlie2@entreprise.cm", "departement": "inexistant"},
        )
        self.assertEqual(response.status_code, 400)

    def test_suppression_reservee_a_l_administrateur(self):
        alice = Employe.objects.get(email="alice@entreprise.cm")
        self.client.force_login(self.consultant)
        response = self.client.delete(f"/api/employes/{alice.id}/")
        self.assertEqual(response.status_code, 403)

        self.client.force_login(self.administrateur)
        response = self.client.delete(f"/api/employes/{alice.id}/")
        self.assertEqual(response.status_code, 204)
