from django.test import TestCase, override_settings
from django.urls import reverse

from apps.accounts.models import Role, Utilisateur
from apps.campagnes.models import Campagne, Departement, Destinataire, ScenarioPhishing
from apps.employes.models import Employe
from apps.gouvernance.models import Consentement, StatutConsentement

from .models import ConfigurationEnvoi, EnvoiTracking, TypeInteraction
from .services import EnvoiCampagneError, EnvoiCampagneService


class TrackingInteractionTests(TestCase):
    """Simule le parcours d'un employé testé : ouverture du pixel, clic sur
    le lien de la fausse page, soumission du formulaire. Vérifie que les
    3 types d'interaction sont enregistrés, dans le bon ordre, sans jamais
    conserver les identifiants saisis."""

    def setUp(self):
        self.campagne = Campagne.objects.create(departement=Departement.IT)
        self.scenario = ScenarioPhishing.objects.create(
            campagne=self.campagne,
            objet_email="Test de suivi",
            corps_email="Corps de test.",
            url_fausse_page="https://exemple.cm/",
            secteur_cible="Test",
        )
        self.tracking = EnvoiTracking.objects.create(
            scenario=self.scenario,
            destinataire_email="employe-test@entreprise.cm",
        )
        self.pixel_url = reverse("simulation-pixel", kwargs={"tracking_id": self.tracking.id})
        self.capture_url = reverse("simulation-capture", kwargs={"tracking_id": self.tracking.id})

    def test_parcours_ouverture_clic_soumission(self):
        response = self.client.get(self.pixel_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "image/gif")

        response = self.client.get(self.capture_url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Vérification de compte requise")

        response = self.client.post(self.capture_url, {"email": "x@y.cm", "password": "secret"})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Merci, vos informations ont été transmises")

        interactions = list(self.tracking.interactions.order_by("horodatage"))
        self.assertEqual(len(interactions), 3)
        self.assertEqual(
            [i.type for i in interactions],
            [TypeInteraction.OUVERTURE, TypeInteraction.CLIC, TypeInteraction.SOUMISSION],
        )
        for interaction in interactions:
            self.assertIsNotNone(interaction.horodatage)

    def test_pixel_et_clic_inconnus_renvoient_404(self):
        faux_id = "00000000-0000-0000-0000-000000000000"
        self.assertEqual(
            self.client.get(reverse("simulation-pixel", kwargs={"tracking_id": faux_id})).status_code, 404
        )
        self.assertEqual(
            self.client.get(reverse("simulation-capture", kwargs={"tracking_id": faux_id})).status_code, 404
        )

    def test_soumission_ne_stocke_aucun_identifiant_saisi(self):
        self.client.post(self.capture_url, {"email": "victime@entreprise.cm", "password": "MotDePasseSecret123"})
        interaction = self.tracking.interactions.get(type=TypeInteraction.SOUMISSION)
        champs = {f.name for f in interaction._meta.get_fields()}
        self.assertNotIn("email", champs)
        self.assertNotIn("password", champs)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class SegmentationDepartementTests(TestCase):
    """Une campagne avec plusieurs scénarios, chacun ciblant un département
    différent : chaque destinataire doit recevoir le scénario de son propre
    département (jour 10)."""

    def setUp(self):
        self.campagne = Campagne.objects.create(departement=Departement.IT)
        Consentement.objects.create(
            campagne=self.campagne,
            responsable_nom="Responsable Test",
            responsable_email="responsable-test@entreprise.cm",
            statut=StatutConsentement.VALIDE,
        )
        ConfigurationEnvoi.objects.create(
            campagne=self.campagne,
            expediteur_nom="Portail Test",
            expediteur_email="noreply@test.cm",
            reply_to="reponses-test@hshield237.local",
            delai_entre_envois=0,
        )
        self.scenario_rh = ScenarioPhishing.objects.create(
            campagne=self.campagne,
            objet_email="Alerte RH",
            corps_email="Contenu RH.",
            url_fausse_page="https://exemple.cm/rh/",
            secteur_cible="Test",
            departements_cibles=[Departement.RH],
        )
        self.scenario_compta = ScenarioPhishing.objects.create(
            campagne=self.campagne,
            objet_email="Facture fournisseur",
            corps_email="Contenu comptabilité.",
            url_fausse_page="https://exemple.cm/compta/",
            secteur_cible="Test",
            departements_cibles=[Departement.COMPTABILITE],
        )
        Destinataire.objects.create(campagne=self.campagne, email="rh@entreprise.cm", departement=Departement.RH)
        Destinataire.objects.create(
            campagne=self.campagne, email="compta@entreprise.cm", departement=Departement.COMPTABILITE
        )

    def test_chaque_destinataire_recoit_le_scenario_de_son_departement(self):
        trackings = EnvoiCampagneService(self.campagne).envoyer_campagne()
        self.assertEqual(len(trackings), 2)
        scenario_par_email = {t.destinataire_email: t.scenario_id for t in trackings}
        self.assertEqual(scenario_par_email["rh@entreprise.cm"], self.scenario_rh.id)
        self.assertEqual(scenario_par_email["compta@entreprise.cm"], self.scenario_compta.id)

    def test_destinataire_sans_scenario_correspondant_leve_une_erreur_claire(self):
        Destinataire.objects.create(
            campagne=self.campagne, email="marketing@entreprise.cm", departement=Departement.MARKETING
        )
        with self.assertRaises(EnvoiCampagneError):
            EnvoiCampagneService(self.campagne).envoyer_campagne()

    def test_scenario_generique_recu_par_defaut(self):
        Destinataire.objects.create(
            campagne=self.campagne, email="marketing@entreprise.cm", departement=Departement.MARKETING
        )
        scenario_generique = ScenarioPhishing.objects.create(
            campagne=self.campagne,
            objet_email="Générique",
            corps_email="Contenu générique.",
            url_fausse_page="https://exemple.cm/generique/",
            secteur_cible="Test",
        )
        trackings = EnvoiCampagneService(self.campagne).envoyer_campagne()
        scenario_par_email = {t.destinataire_email: t.scenario_id for t in trackings}
        self.assertEqual(scenario_par_email["marketing@entreprise.cm"], scenario_generique.id)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class EnvoiAuxEmployesTests(TestCase):
    """Le lancement d'une campagne peut désormais cibler l'annuaire des
    employés (apps.employes) plutôt qu'une adresse de diffusion — soit
    tout le département de la campagne, soit un seul employé (2026-08-27)."""

    def setUp(self):
        self.campagne = Campagne.objects.create(departement=Departement.IT)
        Consentement.objects.create(
            campagne=self.campagne,
            responsable_nom="Responsable Test",
            responsable_email="responsable-employes@entreprise.cm",
            statut=StatutConsentement.VALIDE,
        )
        ConfigurationEnvoi.objects.create(
            campagne=self.campagne,
            expediteur_nom="Portail Test",
            expediteur_email="noreply@test.cm",
            reply_to="reponses-test@hshield237.local",
            delai_entre_envois=0,
        )
        self.scenario = ScenarioPhishing.objects.create(
            campagne=self.campagne,
            objet_email="Alerte sécurité",
            corps_email="Contenu.",
            url_fausse_page="https://exemple.cm/",
            secteur_cible="Test",
        )
        self.employe_it_1 = Employe.objects.create(
            nom="Employé IT 1", email="it1@entreprise.cm", departement=Departement.IT
        )
        self.employe_it_2 = Employe.objects.create(
            nom="Employé IT 2", email="it2@entreprise.cm", departement=Departement.IT
        )
        self.employe_rh = Employe.objects.create(
            nom="Employé RH", email="rh@entreprise.cm", departement=Departement.RH
        )
        self.consultant = Utilisateur.objects.create_user(
            username="consultant-envoi-employes",
            email="consultant-envoi-employes@hshield237.local",
            password="Test1234!",
            role=Role.CONSULTANT,
        )
        self.url = reverse("simulation-envoyer", kwargs={"campagne_id": self.campagne.id})

    def test_tous_les_employes_du_departement_recoivent_un_email_chacun(self):
        trackings = EnvoiCampagneService(self.campagne).envoyer_aux_employes("tous")
        emails = {t.destinataire_email for t in trackings}
        self.assertEqual(emails, {"it1@entreprise.cm", "it2@entreprise.cm"})
        # Le RH n'est pas du bon département : jamais sollicité.
        self.assertNotIn("rh@entreprise.cm", emails)

    def test_un_seul_employe_en_particulier(self):
        trackings = EnvoiCampagneService(self.campagne).envoyer_aux_employes(
            "un_employe", self.employe_it_1.id
        )
        self.assertEqual(len(trackings), 1)
        self.assertEqual(trackings[0].destinataire_email, "it1@entreprise.cm")

    def test_employe_d_un_autre_departement_refuse(self):
        with self.assertRaises(EnvoiCampagneError):
            EnvoiCampagneService(self.campagne).envoyer_aux_employes("un_employe", self.employe_rh.id)

    def test_annuaire_vide_pour_ce_departement_leve_une_erreur_claire(self):
        campagne_juridique = Campagne.objects.create(departement=Departement.JURIDIQUE)
        Consentement.objects.create(
            campagne=campagne_juridique,
            responsable_nom="Resp",
            responsable_email="resp-juridique@entreprise.cm",
            statut=StatutConsentement.VALIDE,
        )
        ConfigurationEnvoi.objects.create(
            campagne=campagne_juridique,
            expediteur_nom="Portail Test",
            expediteur_email="noreply@test.cm",
            reply_to="reponses-test@hshield237.local",
        )
        ScenarioPhishing.objects.create(
            campagne=campagne_juridique,
            objet_email="Test",
            corps_email="Contenu.",
            url_fausse_page="https://exemple.cm/",
            secteur_cible="Test",
        )
        with self.assertRaises(EnvoiCampagneError):
            EnvoiCampagneService(campagne_juridique).envoyer_aux_employes("tous")

    def test_endpoint_envoyer_avec_cible_tous(self):
        self.client.force_login(self.consultant)
        response = self.client.post(self.url, {"cible": "tous"}, content_type="application/json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(response.json()), 2)

    def test_endpoint_envoyer_avec_cible_un_employe_sans_id_refuse(self):
        self.client.force_login(self.consultant)
        response = self.client.post(self.url, {"cible": "un_employe"}, content_type="application/json")
        self.assertEqual(response.status_code, 400)
