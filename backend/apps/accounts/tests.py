from django.core import mail
from django.test import TestCase, override_settings
from django.urls import reverse

from .models import Role, Utilisateur


class ProfilTests(TestCase):
    """Étape 1 — mise à jour de son propre profil (nom, email). Le rôle
    ne doit jamais être modifiable par cette voie, même si envoyé dans
    le payload."""

    def setUp(self):
        self.user = Utilisateur.objects.create_user(
            username="profil-test",
            email="profil-test@hshield237.local",
            password="Test1234!",
            role=Role.CONSULTANT,
            first_name="Ancien",
            last_name="Nom",
        )
        self.client.force_login(self.user)
        self.url = reverse("auth-me")

    def test_lecture_du_profil(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["email"], "profil-test@hshield237.local")
        self.assertEqual(response.data["role"], Role.CONSULTANT)

    def test_mise_a_jour_du_nom_et_email(self):
        response = self.client.patch(
            self.url,
            {"first_name": "Nouveau", "last_name": "Nom", "email": "nouveau-email@hshield237.local"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Nouveau")
        self.assertEqual(self.user.email, "nouveau-email@hshield237.local")

    def test_role_non_modifiable_via_le_profil(self):
        response = self.client.patch(
            self.url,
            {"role": Role.ADMINISTRATEUR},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, Role.CONSULTANT)

    def test_email_deja_utilise_refuse(self):
        Utilisateur.objects.create_user(
            username="autre", email="deja-pris@hshield237.local", password="Test1234!"
        )
        response = self.client.patch(
            self.url, {"email": "deja-pris@hshield237.local"}, content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)


class ChangerMotDePasseTests(TestCase):
    """Étape 1 — changement de mot de passe self-service."""

    def setUp(self):
        self.user = Utilisateur.objects.create_user(
            username="motdepasse-test",
            email="motdepasse-test@hshield237.local",
            password="AncienMotDePasse1234!",
            role=Role.CONSULTANT,
        )
        self.client.force_login(self.user)
        self.url = reverse("auth-changer-mot-de-passe")

    def test_changement_reussi(self):
        response = self.client.post(
            self.url,
            {"ancien_mot_de_passe": "AncienMotDePasse1234!", "nouveau_mot_de_passe": "NouveauMotDePasse5678!"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NouveauMotDePasse5678!"))

    def test_ancien_mot_de_passe_incorrect(self):
        response = self.client.post(
            self.url,
            {"ancien_mot_de_passe": "MauvaisMotDePasse", "nouveau_mot_de_passe": "NouveauMotDePasse5678!"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("ancien_mot_de_passe", response.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("AncienMotDePasse1234!"))

    def test_nouveau_mot_de_passe_trop_faible_refuse(self):
        response = self.client.post(
            self.url,
            {"ancien_mot_de_passe": "AncienMotDePasse1234!", "nouveau_mot_de_passe": "1234"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("nouveau_mot_de_passe", response.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("AncienMotDePasse1234!"))

    def test_non_authentifie_refuse(self):
        self.client.logout()
        response = self.client.post(
            self.url,
            {"ancien_mot_de_passe": "AncienMotDePasse1234!", "nouveau_mot_de_passe": "NouveauMotDePasse5678!"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class GestionEquipeTests(TestCase):
    """Étape 2 — liste, création avec rôle, changement de rôle. Réservé
    à l'administrateur."""

    def setUp(self):
        self.admin = Utilisateur.objects.create_user(
            username="admin-equipe", email="admin-equipe@hshield237.local", password="Test1234!",
            role=Role.ADMINISTRATEUR,
        )
        self.consultant = Utilisateur.objects.create_user(
            username="consultant-equipe", email="consultant-equipe@hshield237.local", password="Test1234!",
            role=Role.CONSULTANT,
        )
        self.list_url = reverse("accounts-utilisateurs")

    def test_liste_reservee_a_l_administrateur(self):
        self.client.force_login(self.consultant)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, 403)

    def test_administrateur_peut_lister(self):
        self.client.force_login(self.admin)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    def test_creation_avec_role_valide_envoie_un_mot_de_passe_temporaire(self):
        self.client.force_login(self.admin)
        response = self.client.post(
            self.list_url,
            {"first_name": "Nouveau", "last_name": "Consultant", "email": "nouveau-consultant@hshield237.local",
             "role": Role.CONSULTANT},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["email_envoye"])
        nouvel_utilisateur = Utilisateur.objects.get(email="nouveau-consultant@hshield237.local")
        self.assertEqual(nouvel_utilisateur.role, Role.CONSULTANT)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("nouveau-consultant@hshield237.local", mail.outbox[0].to)
        # Le mot de passe envoyé par email doit être le vrai mot de passe du compte.
        mot_de_passe_envoye = mail.outbox[0].body.split("Mot de passe temporaire : ")[1].split("\n")[0]
        self.assertTrue(nouvel_utilisateur.check_password(mot_de_passe_envoye))

    def test_creation_avec_role_hors_perimetre_refusee(self):
        self.client.force_login(self.admin)
        response = self.client.post(
            self.list_url,
            {"first_name": "X", "last_name": "Y", "email": "employe-test@hshield237.local", "role": Role.EMPLOYE},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)

    def test_non_administrateur_ne_peut_pas_creer(self):
        self.client.force_login(self.consultant)
        response = self.client.post(
            self.list_url,
            {"first_name": "X", "last_name": "Y", "email": "x@hshield237.local", "role": Role.CONSULTANT},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_changement_de_role_journalise(self):
        from apps.gouvernance.models import JournalAudit

        self.client.force_login(self.admin)
        url = reverse("accounts-utilisateur-role", kwargs={"utilisateur_id": self.consultant.id})
        response = self.client.patch(url, {"role": Role.RESPONSABLE}, content_type="application/json")
        self.assertEqual(response.status_code, 200)
        self.consultant.refresh_from_db()
        self.assertEqual(self.consultant.role, Role.RESPONSABLE)
        self.assertTrue(JournalAudit.objects.filter(action="changement_role_utilisateur").exists())

    def test_changement_de_role_reserve_a_l_administrateur(self):
        self.client.force_login(self.consultant)
        url = reverse("accounts-utilisateur-role", kwargs={"utilisateur_id": self.admin.id})
        response = self.client.patch(url, {"role": Role.CONSULTANT}, content_type="application/json")
        self.assertEqual(response.status_code, 403)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class ReinitialisationMotDePasseTests(TestCase):
    """Étape 3 — 'mot de passe oublié' notifie l'administrateur (jamais
    de lien envoyé au demandeur) ; l'administrateur traite la demande ou
    réinitialise directement n'importe quel compte."""

    def setUp(self):
        from .models import DemandeReinitialisation

        self.DemandeReinitialisation = DemandeReinitialisation
        self.admin = Utilisateur.objects.create_user(
            username="admin-reset", email="admin-reset@hshield237.local", password="Test1234!",
            role=Role.ADMINISTRATEUR,
        )
        self.employe = Utilisateur.objects.create_user(
            username="employe-reset", email="employe-reset@hshield237.local", password="AncienMotDePasse1234!",
            role=Role.CONSULTANT,
        )
        self.oubli_url = reverse("auth-mot-de-passe-oublie")

    def test_demande_pour_email_existant_notifie_l_administrateur(self):
        response = self.client.post(
            self.oubli_url, {"email": "employe-reset@hshield237.local"}, content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        demande = self.DemandeReinitialisation.objects.get()
        self.assertEqual(demande.utilisateur, self.employe)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("admin-reset@hshield237.local", mail.outbox[0].to)

    def test_demande_pour_email_inexistant_reponse_identique_sans_indice(self):
        response_existant = self.client.post(
            self.oubli_url, {"email": "employe-reset@hshield237.local"}, content_type="application/json"
        )
        response_inexistant = self.client.post(
            self.oubli_url, {"email": "personne@hshield237.local"}, content_type="application/json"
        )
        self.assertEqual(response_existant.status_code, 200)
        self.assertEqual(response_inexistant.status_code, 200)
        self.assertEqual(response_existant.data, response_inexistant.data)
        demande_orpheline = self.DemandeReinitialisation.objects.get(email_saisi="personne@hshield237.local")
        self.assertIsNone(demande_orpheline.utilisateur)

    def test_liste_des_demandes_reservee_a_l_administrateur(self):
        self.client.post(self.oubli_url, {"email": "employe-reset@hshield237.local"}, content_type="application/json")
        response_non_admin = self.client.get(reverse("accounts-demandes-reinitialisation"))
        self.assertEqual(response_non_admin.status_code, 401)  # non authentifié

        self.client.force_login(self.admin)
        response = self.client.get(reverse("accounts-demandes-reinitialisation"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_traitement_change_effectivement_le_mot_de_passe(self):
        self.client.post(self.oubli_url, {"email": "employe-reset@hshield237.local"}, content_type="application/json")
        demande = self.DemandeReinitialisation.objects.get()
        mail.outbox = []

        self.client.force_login(self.admin)
        url = reverse("accounts-demande-reinitialisation-traiter", kwargs={"demande_id": demande.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["email_envoye"])

        demande.refresh_from_db()
        self.assertEqual(demande.statut, "traitee")
        self.assertEqual(demande.traite_par, self.admin)

        self.employe.refresh_from_db()
        self.assertFalse(self.employe.check_password("AncienMotDePasse1234!"))
        nouveau_mot_de_passe = mail.outbox[0].body.split("Mot de passe temporaire : ")[1].split("\n")[0]
        self.assertTrue(self.employe.check_password(nouveau_mot_de_passe))

    def test_reinitialisation_directe_par_administrateur(self):
        self.client.force_login(self.admin)
        url = reverse("accounts-utilisateur-reinitialiser", kwargs={"utilisateur_id": self.employe.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)
        self.employe.refresh_from_db()
        self.assertFalse(self.employe.check_password("AncienMotDePasse1234!"))

    def test_reinitialisation_directe_reservee_a_l_administrateur(self):
        self.client.force_login(self.employe)
        url = reverse("accounts-utilisateur-reinitialiser", kwargs={"utilisateur_id": self.admin.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, 403)
