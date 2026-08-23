from django.test import TestCase
from django.urls import reverse

from apps.accounts.models import Role, Utilisateur
from apps.simulation.models import EnvoiTracking, Interaction, TypeInteraction

from .models import Campagne, Departement, ScenarioPhishing


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
        self.assertEqual(len(response.data), len(Departement.choices))
