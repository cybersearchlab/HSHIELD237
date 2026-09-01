from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse

from apps.accounts.models import Role, Utilisateur

from .models import ParametreExterne
from .services import get_parametre, get_parametre_bool, get_parametre_int


class ParametreExterneCRUDTests(TestCase):
    """Étape 4 — CRUD admin-only, chiffrement au repos, masquage en
    lecture pour les paramètres secrets."""

    def setUp(self):
        self.admin = Utilisateur.objects.create_user(
            username="admin-param", email="admin-param@hshield237.local", password="Test1234!",
            role=Role.ADMINISTRATEUR,
        )
        self.consultant = Utilisateur.objects.create_user(
            username="consultant-param", email="consultant-param@hshield237.local", password="Test1234!",
            role=Role.CONSULTANT,
        )
        self.url = reverse("parametreexterne-list")

    def test_lecture_reservee_a_l_administrateur(self):
        self.client.force_login(self.consultant)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 403)

    def test_creation_reservee_a_l_administrateur(self):
        self.client.force_login(self.consultant)
        response = self.client.post(
            self.url, {"cle": "ANTHROPIC_API_KEY", "valeur": "sk-ant-test1234"}, content_type="application/json"
        )
        self.assertEqual(response.status_code, 403)

    def test_creation_chiffre_la_valeur_en_base(self):
        self.client.force_login(self.admin)
        response = self.client.post(
            self.url, {"cle": "ANTHROPIC_API_KEY", "valeur": "sk-ant-abcdef1234"}, content_type="application/json"
        )
        self.assertEqual(response.status_code, 201)

        parametre = ParametreExterne.objects.get(cle="ANTHROPIC_API_KEY")
        self.assertNotIn("sk-ant-abcdef1234", parametre.valeur_chiffree)
        self.assertEqual(parametre.get_valeur(), "sk-ant-abcdef1234")

    def test_valeur_secrete_masquee_en_lecture(self):
        self.client.force_login(self.admin)
        self.client.post(
            self.url, {"cle": "ANTHROPIC_API_KEY", "valeur": "sk-ant-abcdef1234"}, content_type="application/json"
        )
        response = self.client.get(self.url)
        entree = response.data[0]
        self.assertTrue(entree["est_secret"])
        self.assertNotIn("sk-ant-abcdef1234", entree["valeur_affichee"])
        self.assertTrue(entree["valeur_affichee"].endswith("1234"))
        self.assertNotIn("valeur", entree)  # write-only, jamais renvoyé

    def test_valeur_non_secrete_visible_en_lecture(self):
        self.client.force_login(self.admin)
        self.client.post(
            self.url, {"cle": "ANTHROPIC_MODEL", "valeur": "claude-opus-5"}, content_type="application/json"
        )
        response = self.client.get(self.url)
        entree = next(e for e in response.data if e["cle"] == "ANTHROPIC_MODEL")
        self.assertFalse(entree["est_secret"])
        self.assertEqual(entree["valeur_affichee"], "claude-opus-5")

    def test_cle_inconnue_refusee(self):
        self.client.force_login(self.admin)
        response = self.client.post(
            self.url, {"cle": "NIMPORTE_QUOI", "valeur": "x"}, content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)


class GetParametreTests(TestCase):
    """get_parametre() retombe sur .env/settings quand rien n'est
    configuré en base, et priorise la valeur DB sinon."""

    def test_retombe_sur_le_defaut_si_rien_en_base(self):
        self.assertEqual(get_parametre("ANTHROPIC_API_KEY", "defaut"), "defaut")

    def test_priorise_la_valeur_en_base(self):
        p = ParametreExterne(cle="ANTHROPIC_API_KEY")
        p.set_valeur("sk-ant-priorite")
        p.save()
        self.assertEqual(get_parametre("ANTHROPIC_API_KEY", "defaut"), "sk-ant-priorite")

    def test_get_parametre_int(self):
        self.assertEqual(get_parametre_int("EMAIL_PORT", 587), 587)
        p = ParametreExterne(cle="EMAIL_PORT")
        p.set_valeur("2525")
        p.save()
        self.assertEqual(get_parametre_int("EMAIL_PORT", 587), 2525)

    def test_get_parametre_bool(self):
        self.assertTrue(get_parametre_bool("EMAIL_USE_TLS", True))
        p = ParametreExterne(cle="EMAIL_USE_TLS")
        p.set_valeur("false")
        p.save()
        self.assertFalse(get_parametre_bool("EMAIL_USE_TLS", True))


class ClaudeGenerationServiceUtiliseParametreDBTests(TestCase):
    """La clé/le modèle saisis en base priment sur .env/settings."""

    def test_service_utilise_la_cle_configuree_en_base(self):
        from apps.generation.services import ClaudeGenerationService

        p = ParametreExterne(cle="ANTHROPIC_API_KEY")
        p.set_valeur("sk-ant-depuis-la-base")
        p.save()

        with patch("apps.generation.services.settings") as mock_settings:
            mock_settings.ANTHROPIC_API_KEY = "sk-ant-depuis-env"
            mock_settings.ANTHROPIC_MODEL = "modele-env"
            service = ClaudeGenerationService()
        self.assertEqual(service.api_key, "sk-ant-depuis-la-base")
