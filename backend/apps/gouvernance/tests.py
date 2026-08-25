from django.test import TestCase, override_settings
from django.urls import reverse

from apps.accounts.models import Role, Utilisateur
from apps.campagnes.models import Campagne, Departement, ScenarioPhishing
from apps.simulation.models import ConfigurationEnvoi
from apps.simulation.services import EnvoiCampagneError, EnvoiCampagneService

from .models import Consentement, JournalAudit, MotifRefus, ResponsableDepartement, StatutConsentement
from .services import creer_consentement_auto


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
        response = self.client.post(
            self.refuser_url, {"motifs": [MotifRefus.TIMING_INAPPROPRIE]}, content_type="application/json"
        )
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


class RegistreResponsablesTests(TestCase):
    """Le registre des responsables par département n'est gérable que par
    un administrateur — un seul responsable par département."""

    def setUp(self):
        self.admin = Utilisateur.objects.create_user(
            username="admin1", email="admin1@entreprise.cm", password="Admin1234!", role=Role.ADMINISTRATEUR
        )
        self.consultant = Utilisateur.objects.create_user(
            username="consultant3", email="consultant3@entreprise.cm", password="Consultant1234!", role=Role.CONSULTANT
        )
        self.list_url = reverse("gouvernance-responsables")

    def test_admin_peut_creer_un_responsable(self):
        self.client.force_login(self.admin)
        response = self.client.post(
            self.list_url,
            {"departement": Departement.IT, "nom": "Awa NKOLO", "email": "awa.nkolo@entreprise.cm"},
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ResponsableDepartement.objects.count(), 1)

    def test_consultant_ne_peut_pas_creer_un_responsable(self):
        self.client.force_login(self.consultant)
        response = self.client.post(
            self.list_url,
            {"departement": Departement.IT, "nom": "Awa NKOLO", "email": "awa.nkolo@entreprise.cm"},
        )
        self.assertEqual(response.status_code, 403)

    def test_un_seul_responsable_par_departement(self):
        ResponsableDepartement.objects.create(departement=Departement.IT, nom="Awa", email="awa@entreprise.cm")
        self.client.force_login(self.admin)
        response = self.client.post(
            self.list_url,
            {"departement": Departement.IT, "nom": "Autre", "email": "autre@entreprise.cm"},
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(ResponsableDepartement.objects.count(), 1)

    def test_admin_peut_modifier_et_supprimer(self):
        responsable = ResponsableDepartement.objects.create(
            departement=Departement.IT, nom="Awa", email="awa@entreprise.cm"
        )
        self.client.force_login(self.admin)
        detail_url = reverse("gouvernance-responsable-detail", kwargs={"responsable_id": responsable.id})
        response = self.client.patch(
            detail_url, {"nom": "Awa NKOLO"}, content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        responsable.refresh_from_db()
        self.assertEqual(responsable.nom, "Awa NKOLO")

        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, 204)
        self.assertEqual(ResponsableDepartement.objects.count(), 0)


class ConsentementAutomatiqueTests(TestCase):
    """Une nouvelle campagne doit générer automatiquement sa demande de
    consentement à partir du registre — plus de saisie libre du
    responsable par la personne qui crée la campagne."""

    def test_creation_automatique_si_responsable_configure(self):
        ResponsableDepartement.objects.create(
            departement=Departement.IT, nom="Awa NKOLO", email="awa.nkolo@entreprise.cm"
        )
        campagne = Campagne.objects.create(departement=Departement.IT)
        consentement = creer_consentement_auto(campagne)
        # deuxième appel (simulateur du hook perform_create) : idempotent
        self.assertIsNone(creer_consentement_auto(campagne))
        self.assertIsNotNone(consentement)
        campagne.refresh_from_db()
        self.assertEqual(campagne.consentement.responsable_nom, "Awa NKOLO")
        self.assertEqual(campagne.consentement.responsable_email, "awa.nkolo@entreprise.cm")
        self.assertEqual(campagne.consentement.statut, StatutConsentement.EN_ATTENTE)

    def test_aucune_creation_si_responsable_non_configure(self):
        campagne = Campagne.objects.create(departement=Departement.JURIDIQUE)
        self.assertIsNone(creer_consentement_auto(campagne))
        self.assertFalse(hasattr(campagne, "consentement"))

    def test_creation_via_api_campagnes(self):
        ResponsableDepartement.objects.create(
            departement=Departement.RH, nom="Paul ETOUNDI", email="paul.etoundi@entreprise.cm"
        )
        admin = Utilisateur.objects.create_user(
            username="admin2", email="admin2@entreprise.cm", password="Admin1234!", role=Role.ADMINISTRATEUR
        )
        self.client.force_login(admin)
        response = self.client.post("/api/campagnes/", {"departement": Departement.RH})
        self.assertEqual(response.status_code, 201)
        campagne = Campagne.objects.get(pk=response.json()["id"])
        self.assertTrue(hasattr(campagne, "consentement"))
        self.assertEqual(campagne.consentement.responsable_email, "paul.etoundi@entreprise.cm")


class GenerationManuelleConsentementTests(TestCase):
    """POST /api/gouvernance/campagnes/<id>/consentement/ reste disponible
    en secours (département sans responsable au moment de la création de
    la campagne) mais réservé à l'administrateur, et dérive toujours le
    nom/email depuis le registre — jamais depuis le corps de la requête."""

    def setUp(self):
        self.admin = Utilisateur.objects.create_user(
            username="admin3", email="admin3@entreprise.cm", password="Admin1234!", role=Role.ADMINISTRATEUR
        )
        self.consultant = Utilisateur.objects.create_user(
            username="consultant4", email="consultant4@entreprise.cm", password="Consultant1234!", role=Role.CONSULTANT
        )
        self.campagne = Campagne.objects.create(departement=Departement.MARKETING)
        self.url = reverse("gouvernance-consentement-campagne", kwargs={"campagne_id": self.campagne.id})

    def test_consultant_ne_peut_plus_generer_la_demande(self):
        self.client.force_login(self.consultant)
        response = self.client.post(self.url, {"responsable_nom": "X", "responsable_email": "x@entreprise.cm"})
        self.assertEqual(response.status_code, 403)

    def test_400_sans_responsable_configure(self):
        self.client.force_login(self.admin)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, 400)

    def test_ignore_les_valeurs_du_corps_de_la_requete(self):
        ResponsableDepartement.objects.create(
            departement=Departement.MARKETING, nom="Vraie Personne", email="vraie@entreprise.cm"
        )
        self.client.force_login(self.admin)
        response = self.client.post(
            self.url, {"responsable_nom": "Faux nom injecté", "responsable_email": "faux@pirate.cm"}
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["responsable_nom"], "Vraie Personne")
        self.assertEqual(response.json()["responsable_email"], "vraie@entreprise.cm")


class RefusJustifieTests(TestCase):
    """Un refus doit être justifié par au moins un motif, avec un texte
    obligatoire si le motif « Autre » est sélectionné."""

    def setUp(self):
        self.campagne = Campagne.objects.create(departement=Departement.ACHATS)
        self.consentement = Consentement.objects.create(
            campagne=self.campagne, responsable_nom="Resp", responsable_email="resp@entreprise.cm"
        )
        self.responsable = Utilisateur.objects.create_user(
            username="resp1", email="resp@entreprise.cm", password="Responsable1234!", role=Role.RESPONSABLE
        )
        self.refuser_url = reverse("gouvernance-consentement-refuser", kwargs={"consentement_id": self.consentement.id})
        self.client.force_login(self.responsable)

    def test_refus_sans_motif_rejete(self):
        response = self.client.post(self.refuser_url, {}, content_type="application/json")
        self.assertEqual(response.status_code, 400)

    def test_refus_avec_motif_predefini(self):
        response = self.client.post(
            self.refuser_url,
            {"motifs": [MotifRefus.TIMING_INAPPROPRIE]},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.consentement.refresh_from_db()
        self.assertEqual(self.consentement.motifs_refus, [MotifRefus.TIMING_INAPPROPRIE])

    def test_refus_autre_sans_details_rejete(self):
        response = self.client.post(
            self.refuser_url, {"motifs": [MotifRefus.AUTRE]}, content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)

    def test_refus_autre_avec_details_accepte(self):
        response = self.client.post(
            self.refuser_url,
            {"motifs": [MotifRefus.AUTRE], "details": "Contexte particulier à préciser."},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.consentement.refresh_from_db()
        self.assertEqual(self.consentement.motif_refus_details, "Contexte particulier à préciser.")
