import json
from unittest.mock import MagicMock, patch

from django.test import TestCase
from django.urls import reverse

from apps.accounts.models import Role, Utilisateur
from apps.campagnes.models import Campagne, Departement
from apps.templates_departement.models import TemplateDepartement

from .services import ClaudeGenerationService


class BuildPromptTemplateTests(TestCase):
    """La structure d'un template doit être injectée dans le prompt envoyé
    à l'API Claude, en plus du département et du contexte additionnel."""

    def test_prompt_sans_template(self):
        prompt = ClaudeGenerationService()._build_prompt(Departement.IT)
        self.assertIn("Informatique", prompt)
        self.assertNotIn("structure de scénario", prompt)

    def test_prompt_avec_template(self):
        template = TemplateDepartement(
            nom="Facture", departement=Departement.COMPTABILITE,
            prompt_structure="Un email imitant une relance de facture impayée.",
        )
        prompt = ClaudeGenerationService()._build_prompt(Departement.COMPTABILITE, template=template)
        self.assertIn("Un email imitant une relance de facture impayée.", prompt)
        self.assertIn("adapte-la", prompt)


def _fake_claude_response():
    payload = {
        "objet_email": "Objet test",
        "corps_email": "Corps test",
        "url_fausse_page": "https://exemple.hshield237.local",
        "secteur_cible": "Comptabilité",
    }
    block = MagicMock()
    block.text = json.dumps(payload)
    response = MagicMock()
    response.content = [block]
    return response


class GenerationAvecTemplateViewTests(TestCase):
    """L'utilisation d'un template lors de la génération via l'API doit
    incrémenter son compteur nombre_utilisations."""

    def setUp(self):
        self.consultant = Utilisateur.objects.create_user(
            username="consultant-gen", email="consultant-gen@entreprise.cm", password="Consultant1234!",
            role=Role.CONSULTANT,
        )
        self.campagne = Campagne.objects.create(departement=Departement.COMPTABILITE)
        self.template = TemplateDepartement.objects.create(
            nom="Facture", departement=Departement.COMPTABILITE,
            prompt_structure="Un email imitant une relance de facture impayée.",
        )
        self.client.force_login(self.consultant)

    @patch("apps.generation.services.ClaudeGenerationService._client")
    def test_utilisation_du_template_incremente_le_compteur(self, mock_client):
        mock_client.return_value.messages.create.return_value = _fake_claude_response()
        response = self.client.post(
            reverse("generation-api"),
            {"campagne": self.campagne.id, "template": self.template.id},
        )
        self.assertEqual(response.status_code, 201)
        self.template.refresh_from_db()
        self.assertEqual(self.template.nombre_utilisations, 1)

    @patch("apps.generation.services.ClaudeGenerationService._client")
    def test_generation_sans_template_ne_touche_aucun_compteur(self, mock_client):
        mock_client.return_value.messages.create.return_value = _fake_claude_response()
        response = self.client.post(reverse("generation-api"), {"campagne": self.campagne.id})
        self.assertEqual(response.status_code, 201)
        self.template.refresh_from_db()
        self.assertEqual(self.template.nombre_utilisations, 0)
