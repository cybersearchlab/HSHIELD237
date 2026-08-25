from django.test import TestCase
from django.urls import reverse

from apps.accounts.models import Role, Utilisateur
from apps.campagnes.models import Departement

from .models import TemplateDepartement


class TemplateDepartementCRUDTests(TestCase):
    """CRUD réservé aux rôles consultant/administrateur, comme le reste
    de la gestion des campagnes (CAN_MANAGE_CAMPAGNE)."""

    def setUp(self):
        self.consultant = Utilisateur.objects.create_user(
            username="consultant-tpl", email="consultant-tpl@entreprise.cm", password="Consultant1234!",
            role=Role.CONSULTANT,
        )
        self.employe = Utilisateur.objects.create_user(
            username="employe-tpl", email="employe-tpl@entreprise.cm", password="Employe1234!", role=Role.EMPLOYE
        )
        self.list_url = reverse("templatedepartement-list")

    def test_consultant_peut_creer_un_template(self):
        self.client.force_login(self.consultant)
        response = self.client.post(
            self.list_url,
            {
                "nom": "Facture fournisseur",
                "departement": Departement.COMPTABILITE,
                "prompt_structure": "Un email imitant une relance de facture impayée par un fournisseur habituel.",
            },
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(TemplateDepartement.objects.count(), 1)
        self.assertEqual(response.json()["nombre_utilisations"], 0)

    def test_employe_ne_peut_pas_creer_un_template(self):
        self.client.force_login(self.employe)
        response = self.client.post(
            self.list_url,
            {"nom": "X", "departement": Departement.IT, "prompt_structure": "Y"},
        )
        self.assertEqual(response.status_code, 403)

    def test_filtre_par_departement(self):
        TemplateDepartement.objects.create(nom="A", departement=Departement.IT, prompt_structure="...")
        TemplateDepartement.objects.create(nom="B", departement=Departement.RH, prompt_structure="...")
        self.client.force_login(self.consultant)
        response = self.client.get(self.list_url, {"departement": Departement.IT})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        results = data["results"] if isinstance(data, dict) and "results" in data else data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["nom"], "A")

    def test_modification_et_suppression(self):
        template = TemplateDepartement.objects.create(
            nom="A", departement=Departement.IT, prompt_structure="..."
        )
        self.client.force_login(self.consultant)
        detail_url = reverse("templatedepartement-detail", kwargs={"pk": template.id})
        response = self.client.patch(detail_url, {"nom": "A modifié"}, content_type="application/json")
        self.assertEqual(response.status_code, 200)
        template.refresh_from_db()
        self.assertEqual(template.nom, "A modifié")

        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, 204)
        self.assertEqual(TemplateDepartement.objects.count(), 0)

    def test_nombre_utilisations_non_modifiable_directement(self):
        self.client.force_login(self.consultant)
        response = self.client.post(
            self.list_url,
            {
                "nom": "A",
                "departement": Departement.IT,
                "prompt_structure": "...",
                "nombre_utilisations": 99,
            },
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["nombre_utilisations"], 0)
