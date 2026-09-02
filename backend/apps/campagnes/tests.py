from django.test import TestCase
from django.urls import reverse

from apps.accounts.models import Role, Utilisateur
from apps.gouvernance.models import Consentement, MotifRefus, StatutConsentement
from apps.simulation.models import EnvoiTracking, Interaction, TypeInteraction

from .models import Campagne, Departement, DepartementConfigure, ScenarioPhishing


def _envoyer_et_interagir(scenario, email, types_interaction):
    tracking = EnvoiTracking.objects.create(scenario=scenario, destinataire_email=email)
    for type_ in types_interaction:
        Interaction.objects.create(envoi=tracking, type=type_)
    return tracking


class ScoreCampagneTests(TestCase):
    """Vérifie le calcul des taux et du score de vulnérabilité composite,
    y compris pour une campagne dont les scénarios sont répartis par
    département (jour 10)."""

    def setUp(self):
        self.consultant = Utilisateur.objects.create_user(
            username="consultant-score",
            email="consultant-score@hshield237.local",
            password="Test1234!",
            role=Role.CONSULTANT,
        )
        self.client.force_login(self.consultant)

        self.campagne = Campagne.objects.create(departement=Departement.IT)
        self.scenario_rh = ScenarioPhishing.objects.create(
            campagne=self.campagne,
            objet_email="Alerte RH",
            corps_email="Contenu RH.",
            url_fausse_page="https://exemple.cm/rh/",
            secteur_cible="Test",
            departements_cibles=[Departement.RH],
        )
        self.scenario_it = ScenarioPhishing.objects.create(
            campagne=self.campagne,
            objet_email="Alerte IT",
            corps_email="Contenu IT.",
            url_fausse_page="https://exemple.cm/it/",
            secteur_cible="Test",
            departements_cibles=[Departement.IT],
        )

    def test_score_sans_aucun_envoi(self):
        url = reverse("campagne-score", kwargs={"campagne_id": self.campagne.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total_envois"], 0)
        self.assertEqual(response.data["score_vulnerabilite"], 0.0)

    def test_score_agrege_sur_plusieurs_scenarios_departements(self):
        # RH : ouverture + clic + soumission (le pire des cas)
        _envoyer_et_interagir(
            self.scenario_rh,
            "rh1@entreprise.cm",
            [TypeInteraction.OUVERTURE, TypeInteraction.CLIC, TypeInteraction.SOUMISSION],
        )
        # RH : rien du tout (bonne vigilance)
        _envoyer_et_interagir(self.scenario_rh, "rh2@entreprise.cm", [])
        # IT : ouverture + signalement (vigilance malgré l'ouverture)
        _envoyer_et_interagir(
            self.scenario_it, "it1@entreprise.cm", [TypeInteraction.OUVERTURE, TypeInteraction.SIGNALEMENT]
        )
        # IT : pixel rechargé deux fois -> ne doit compter qu'une fois dans le taux
        tracking_it2 = EnvoiTracking.objects.create(scenario=self.scenario_it, destinataire_email="it2@entreprise.cm")
        Interaction.objects.create(envoi=tracking_it2, type=TypeInteraction.OUVERTURE)
        Interaction.objects.create(envoi=tracking_it2, type=TypeInteraction.OUVERTURE)

        url = reverse("campagne-score", kwargs={"campagne_id": self.campagne.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.data
        self.assertEqual(data["total_envois"], 4)
        self.assertEqual(data["nombre_scenarios"], 2)
        self.assertEqual(data["taux_ouverture"], 75.0)  # 3/4
        self.assertEqual(data["taux_clic"], 25.0)  # 1/4
        self.assertEqual(data["taux_soumission"], 25.0)  # 1/4
        self.assertEqual(data["taux_signalement"], 25.0)  # 1/4
        attendu = round(0.5 * 25.0 + 0.3 * 25.0 + 0.2 * 75.0 - 0.3 * 25.0, 1)
        self.assertEqual(data["score_vulnerabilite"], attendu)

    def test_score_borne_a_100(self):
        # Tous les destinataires soumettent : le score ne doit jamais dépasser 100.
        for i in range(3):
            _envoyer_et_interagir(
                self.scenario_rh,
                f"victime{i}@entreprise.cm",
                [TypeInteraction.OUVERTURE, TypeInteraction.CLIC, TypeInteraction.SOUMISSION],
            )
        url = reverse("campagne-score", kwargs={"campagne_id": self.campagne.id})
        response = self.client.get(url)
        self.assertLessEqual(response.data["score_vulnerabilite"], 100.0)


class ScoreParDepartementTests(TestCase):
    """Vérifie l'endpoint d'agrégation par département pour le tableau de
    bord global : une entrée par département, agrégée sur toutes les
    campagnes de ce département."""

    def setUp(self):
        self.consultant = Utilisateur.objects.create_user(
            username="consultant-dashboard",
            email="consultant-dashboard@hshield237.local",
            password="Test1234!",
            role=Role.CONSULTANT,
        )
        self.client.force_login(self.consultant)

    def test_une_entree_par_departement_avec_agregation_multi_campagnes(self):
        campagne_1 = Campagne.objects.create(departement=Departement.RH)
        campagne_2 = Campagne.objects.create(departement=Departement.RH)
        scenario_1 = ScenarioPhishing.objects.create(
            campagne=campagne_1,
            objet_email="Test 1",
            corps_email="Contenu.",
            url_fausse_page="https://exemple.cm/1/",
            secteur_cible="Test",
        )
        scenario_2 = ScenarioPhishing.objects.create(
            campagne=campagne_2,
            objet_email="Test 2",
            corps_email="Contenu.",
            url_fausse_page="https://exemple.cm/2/",
            secteur_cible="Test",
        )
        _envoyer_et_interagir(scenario_1, "a@entreprise.cm", [TypeInteraction.CLIC])
        _envoyer_et_interagir(scenario_2, "b@entreprise.cm", [])

        url = reverse("campagnes-score-departements")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        entree_rh = next(d for d in response.data if d["departement"] == Departement.RH)
        self.assertEqual(entree_rh["nombre_campagnes"], 2)
        self.assertEqual(entree_rh["total_envois"], 2)
        self.assertEqual(entree_rh["taux_clic"], 50.0)

        entree_marketing = next(d for d in response.data if d["departement"] == Departement.MARKETING)
        self.assertEqual(entree_marketing["nombre_campagnes"], 0)
        self.assertEqual(entree_marketing["total_envois"], 0)
        self.assertEqual(entree_marketing["score_vulnerabilite"], 0.0)

    def test_toutes_les_valeurs_de_departement_sont_representees(self):
        url = reverse("campagnes-score-departements")
        response = self.client.get(url)
        self.assertEqual(len(response.data), DepartementConfigure.objects.count())


class HistoriqueParDepartementTests(TestCase):
    """Contrairement à ScoreParDepartementView (un seul chiffre agrégé),
    HistoriqueParDepartementView doit garder une entrée distincte par
    campagne pour permettre d'afficher l'évolution du score dans le temps
    (jour 14)."""

    def setUp(self):
        self.consultant = Utilisateur.objects.create_user(
            username="consultant-historique",
            email="consultant-historique@hshield237.local",
            password="Test1234!",
            role=Role.CONSULTANT,
        )
        self.client.force_login(self.consultant)
        self.url = reverse("campagnes-historique-departements")

    def test_toutes_les_valeurs_de_departement_sont_representees(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), DepartementConfigure.objects.count())

    def test_departement_sans_campagne_a_une_liste_vide(self):
        response = self.client.get(self.url)
        entree = next(d for d in response.data if d["departement"] == Departement.JURIDIQUE)
        self.assertEqual(entree["nombre_campagnes"], 0)
        self.assertEqual(entree["campagnes"], [])

    def test_chaque_campagne_garde_son_propre_score_chronologique(self):
        campagne_1 = Campagne.objects.create(departement=Departement.IT)
        campagne_2 = Campagne.objects.create(departement=Departement.IT)
        scenario_1 = ScenarioPhishing.objects.create(
            campagne=campagne_1,
            objet_email="Test 1",
            corps_email="Contenu.",
            url_fausse_page="https://exemple.cm/1/",
            secteur_cible="Test",
        )
        scenario_2 = ScenarioPhishing.objects.create(
            campagne=campagne_2,
            objet_email="Test 2",
            corps_email="Contenu.",
            url_fausse_page="https://exemple.cm/2/",
            secteur_cible="Test",
        )
        _envoyer_et_interagir(scenario_1, "a@entreprise.cm", [TypeInteraction.CLIC])
        _envoyer_et_interagir(scenario_2, "b@entreprise.cm", [])

        response = self.client.get(self.url)
        entree = next(d for d in response.data if d["departement"] == Departement.IT)
        self.assertEqual(entree["nombre_campagnes"], 2)
        self.assertEqual(len(entree["campagnes"]), 2)
        # Ordonné chronologiquement (date_creation croissante)
        self.assertEqual(entree["campagnes"][0]["campagne_id"], campagne_1.id)
        self.assertEqual(entree["campagnes"][0]["taux_clic"], 100.0)
        self.assertEqual(entree["campagnes"][1]["campagne_id"], campagne_2.id)
        self.assertEqual(entree["campagnes"][1]["taux_clic"], 0.0)


class ConsentementSurCampagneTests(TestCase):
    """Le statut et le motif de refus du consentement doivent être visibles
    directement depuis l'onglet Campagnes (CampagneSerializer), pas
    seulement depuis Consentements."""

    def setUp(self):
        self.consultant = Utilisateur.objects.create_user(
            username="consultant-camp-consent",
            email="consultant-camp-consent@entreprise.cm",
            password="Consultant1234!",
            role=Role.CONSULTANT,
        )
        self.client.force_login(self.consultant)

    def test_campagne_sans_consentement(self):
        campagne = Campagne.objects.create(departement=Departement.IT)
        response = self.client.get(reverse("campagne-detail", kwargs={"pk": campagne.id}))
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.data["consentement_statut"])
        self.assertEqual(response.data["consentement_motifs_refus_display"], [])

    def test_campagne_avec_consentement_refuse(self):
        campagne = Campagne.objects.create(departement=Departement.IT)
        Consentement.objects.create(
            campagne=campagne,
            responsable_nom="Resp",
            responsable_email="resp@entreprise.cm",
            statut=StatutConsentement.REFUSE,
            motifs_refus=[MotifRefus.TIMING_INAPPROPRIE],
            motif_refus_details="Contexte particulier.",
        )
        response = self.client.get(reverse("campagne-detail", kwargs={"pk": campagne.id}))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["consentement_statut"], StatutConsentement.REFUSE)
        self.assertIn("n'est pas approprié", response.data["consentement_motifs_refus_display"][0])
        self.assertEqual(response.data["consentement_motif_refus_details"], "Contexte particulier.")


class VisualisationScenarioResponsableTests(TestCase):
    """Le responsable désigné doit pouvoir consulter le contenu de l'email
    de phishing avant de valider/refuser sa campagne — mais uniquement
    pour la campagne dont il est le responsable désigné."""

    def setUp(self):
        self.campagne = Campagne.objects.create(departement=Departement.RH)
        self.consentement = Consentement.objects.create(
            campagne=self.campagne, responsable_nom="Resp", responsable_email="resp-scenario@entreprise.cm"
        )
        ScenarioPhishing.objects.create(
            campagne=self.campagne,
            objet_email="Objet test",
            corps_email="Corps test",
            url_fausse_page="https://exemple.cm/",
            secteur_cible="Test",
        )
        self.responsable = Utilisateur.objects.create_user(
            username="resp-scenario",
            email="resp-scenario@entreprise.cm",
            password="Responsable1234!",
            role=Role.RESPONSABLE,
        )
        self.autre_responsable = Utilisateur.objects.create_user(
            username="autre-resp-scenario",
            email="autre-resp-scenario@entreprise.cm",
            password="Responsable1234!",
            role=Role.RESPONSABLE,
        )
        self.url = reverse("campagne-scenarios", kwargs={"campagne_id": self.campagne.id})

    def test_le_bon_responsable_peut_voir_le_scenario(self):
        self.client.force_login(self.responsable)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]["objet_email"], "Objet test")

    def test_un_autre_responsable_ne_peut_pas_voir_le_scenario(self):
        self.client.force_login(self.autre_responsable)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 403)

    def test_responsable_sans_consentement_assigne_refuse(self):
        campagne_orpheline = Campagne.objects.create(departement=Departement.JURIDIQUE)
        url = reverse("campagne-scenarios", kwargs={"campagne_id": campagne_orpheline.id})
        self.client.force_login(self.responsable)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 403)

    def test_plusieurs_scenarios_tries_du_plus_recent_au_plus_ancien(self):
        # Le responsable doit pouvoir distinguer plusieurs versions d'un
        # même email plutôt que de tout recevoir mélangé dans le désordre —
        # la liste doit toujours arriver classée par date, la plus récente
        # en premier, avec la date exposée pour l'affichage.
        ScenarioPhishing.objects.create(
            campagne=self.campagne,
            objet_email="Deuxième version",
            corps_email="Corps v2",
            url_fausse_page="https://exemple.cm/v2",
            secteur_cible="Test",
        )
        self.client.force_login(self.responsable)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)
        self.assertEqual(data[0]["objet_email"], "Deuxième version")
        self.assertEqual(data[1]["objet_email"], "Objet test")
        self.assertIn("date_creation", data[0])
        self.assertGreaterEqual(data[0]["date_creation"], data[1]["date_creation"])


class DepartementRegistryTests(TestCase):
    """Le registre des départements (DepartementConfigure) remplace
    l'ancienne liste figée — ajout/renommage/suppression gérés par
    l'administrateur, propagés immédiatement partout puisque le libellé
    est désormais résolu par lecture live (voir services.departement_label)."""

    def setUp(self):
        self.administrateur = Utilisateur.objects.create_user(
            username="admin-dept",
            email="admin-dept@hshield237.local",
            password="Test1234!",
            role=Role.ADMINISTRATEUR,
        )
        self.consultant = Utilisateur.objects.create_user(
            username="consultant-dept",
            email="consultant-dept@hshield237.local",
            password="Test1234!",
            role=Role.CONSULTANT,
        )

    def test_liste_accessible_a_un_consultant_en_lecture(self):
        self.client.force_login(self.consultant)
        response = self.client.get("/api/departements/")
        self.assertEqual(response.status_code, 200)
        data = response.data
        results = data["results"] if isinstance(data, dict) and "results" in data else data
        self.assertEqual(len(results), 10)

    def test_creation_reservee_a_l_administrateur(self):
        self.client.force_login(self.consultant)
        response = self.client.post("/api/departements/", {"nom": "Support technique"})
        self.assertEqual(response.status_code, 403)

    def test_administrateur_peut_creer_un_departement_avec_code_auto(self):
        self.client.force_login(self.administrateur)
        response = self.client.post("/api/departements/", {"nom": "Support technique"})
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["code"], "support-technique")
        self.assertEqual(response.data["nom"], "Support technique")

    def test_renommer_un_departement_met_a_jour_le_libelle_partout(self):
        self.client.force_login(self.administrateur)
        dept = DepartementConfigure.objects.get(code="it")
        campagne = Campagne.objects.create(departement="it")

        response = self.client.patch(
            f"/api/departements/{dept.id}/", {"nom": "Technologies de l'information"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)

        detail = self.client.get(f"/api/campagnes/{campagne.id}/")
        self.assertEqual(detail.data["departement_display"], "Technologies de l'information")

    def test_suppression_bloquee_si_departement_encore_utilise(self):
        self.client.force_login(self.administrateur)
        dept = DepartementConfigure.objects.get(code="rh")
        Campagne.objects.create(departement="rh")

        response = self.client.delete(f"/api/departements/{dept.id}/")
        self.assertEqual(response.status_code, 400)
        self.assertTrue(DepartementConfigure.objects.filter(code="rh").exists())

    def test_suppression_possible_si_departement_inutilise(self):
        self.client.force_login(self.administrateur)
        dept = DepartementConfigure.objects.create(nom="Département de test à supprimer")

        response = self.client.delete(f"/api/departements/{dept.id}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(DepartementConfigure.objects.filter(pk=dept.id).exists())

    def test_campagne_refuse_un_departement_inconnu(self):
        self.client.force_login(self.consultant)
        response = self.client.post("/api/campagnes/", {"departement": "inexistant"})
        self.assertEqual(response.status_code, 400)

    def test_suppression_bloquee_si_employe_encore_rattache(self):
        from apps.employes.models import Employe

        self.client.force_login(self.administrateur)
        dept = DepartementConfigure.objects.get(code="comptabilite")
        Employe.objects.create(nom="Test", email="employe-dept-test@entreprise.cm", departement="comptabilite")

        response = self.client.delete(f"/api/departements/{dept.id}/")
        self.assertEqual(response.status_code, 400)
        self.assertTrue(DepartementConfigure.objects.filter(code="comptabilite").exists())


class PageCapturePersonnaliseeTests(TestCase):
    """Personnalisation de la fausse page de capture d'un scénario
    (2026-09-02) — voir ScenarioPageCaptureView et
    apps.campagnes.validators.valider_page_capture_html."""

    HTML_VALIDE = (
        "<html><body><form><input name='email'><input name='password' "
        "type='password'></form></body></html>"
    )

    def setUp(self):
        self.consultant = Utilisateur.objects.create_user(
            username="consultant-capture",
            email="consultant-capture@hshield237.local",
            password="Test1234!",
            role=Role.CONSULTANT,
        )
        self.employe = Utilisateur.objects.create_user(
            username="employe-capture",
            email="employe-capture@hshield237.local",
            password="Test1234!",
            role=Role.EMPLOYE,
        )
        self.campagne = Campagne.objects.create(departement=Departement.IT)
        self.scenario = ScenarioPhishing.objects.create(
            campagne=self.campagne,
            objet_email="Vérification de compte",
            corps_email="Contenu.",
            url_fausse_page="https://exemple.cm/",
            secteur_cible="Test",
        )
        self.url = f"/api/campagnes/scenarios/{self.scenario.id}/page-capture/"

    def test_refuse_sans_authentification(self):
        response = self.client.put(self.url, {"html": self.HTML_VALIDE}, content_type="application/json")
        self.assertIn(response.status_code, (401, 403))

    def test_refuse_pour_un_role_non_autorise(self):
        self.client.force_login(self.employe)
        response = self.client.put(self.url, {"html": self.HTML_VALIDE}, content_type="application/json")
        self.assertEqual(response.status_code, 403)

    def test_page_sans_formulaire_refusee(self):
        self.client.force_login(self.consultant)
        response = self.client.put(
            self.url, {"html": "<html><body><p>Rien à suivre ici.</p></body></html>"}, content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        self.scenario.refresh_from_db()
        self.assertEqual(self.scenario.page_capture_html, "")

    def test_page_avec_formulaire_mais_sans_champ_refusee(self):
        self.client.force_login(self.consultant)
        response = self.client.put(
            self.url, {"html": "<html><body><form></form></body></html>"}, content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)

    def test_page_vide_refusee(self):
        self.client.force_login(self.consultant)
        response = self.client.put(self.url, {"html": "   "}, content_type="application/json")
        self.assertEqual(response.status_code, 400)

    def test_html_colle_accepte_et_enregistre(self):
        self.client.force_login(self.consultant)
        response = self.client.put(self.url, {"html": self.HTML_VALIDE}, content_type="application/json")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["personnalisee"])
        self.scenario.refresh_from_db()
        self.assertEqual(self.scenario.page_capture_html, self.HTML_VALIDE)
        self.assertIsNotNone(self.scenario.page_capture_date_maj)

    def test_fichier_html_accepte_et_enregistre(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        from django.test.client import BOUNDARY, MULTIPART_CONTENT, encode_multipart

        self.client.force_login(self.consultant)
        fichier = SimpleUploadedFile("page.html", self.HTML_VALIDE.encode("utf-8"), content_type="text/html")
        response = self.client.put(
            self.url, encode_multipart(BOUNDARY, {"fichier": fichier}), content_type=MULTIPART_CONTENT
        )
        self.assertEqual(response.status_code, 200)
        self.scenario.refresh_from_db()
        self.assertEqual(self.scenario.page_capture_html, self.HTML_VALIDE)

    def test_html_et_fichier_a_la_fois_refuse(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        from django.test.client import BOUNDARY, MULTIPART_CONTENT, encode_multipart

        self.client.force_login(self.consultant)
        fichier = SimpleUploadedFile("page.html", self.HTML_VALIDE.encode("utf-8"), content_type="text/html")
        response = self.client.put(
            self.url,
            encode_multipart(BOUNDARY, {"html": self.HTML_VALIDE, "fichier": fichier}),
            content_type=MULTIPART_CONTENT,
        )
        self.assertEqual(response.status_code, 400)

    def test_scenario_liste_indique_la_personnalisation(self):
        self.client.force_login(self.consultant)
        self.client.put(self.url, {"html": self.HTML_VALIDE}, content_type="application/json")
        response = self.client.get(f"/api/campagnes/{self.campagne.id}/scenarios/")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data[0]["page_capture_personnalisee"])
        # Le HTML complet n'est jamais renvoyé dans la liste.
        self.assertNotIn("page_capture_html", response.data[0])

    def test_suppression_revient_a_la_page_generique(self):
        self.client.force_login(self.consultant)
        self.client.put(self.url, {"html": self.HTML_VALIDE}, content_type="application/json")
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["personnalisee"])
        self.scenario.refresh_from_db()
        self.assertEqual(self.scenario.page_capture_html, "")
        self.assertIsNone(self.scenario.page_capture_date_maj)

    def test_lecture_retourne_le_html_complet(self):
        self.client.force_login(self.consultant)
        self.client.put(self.url, {"html": self.HTML_VALIDE}, content_type="application/json")
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["page_capture_html"], self.HTML_VALIDE)
