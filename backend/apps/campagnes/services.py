from apps.simulation.models import EnvoiTracking, Interaction, TypeInteraction

from .models import Campagne, DepartementConfigure, ScenarioPhishing

# Le signalement traduit une vigilance réelle de l'employé : il atténue le
# score plutôt que de l'aggraver, contrairement aux 3 autres taux.
POIDS_SOUMISSION = 0.5
POIDS_CLIC = 0.3
POIDS_OUVERTURE = 0.2
POIDS_SIGNALEMENT = 0.3


def departement_label(code):
    """Libellé affiché d'un code de département, résolu par lecture live du
    registre DepartementConfigure (géré par l'administrateur) plutôt que
    par l'ancienne énumération figée Departement.choices (voir décision du
    2026-08-27, docs/CONTEXTE_PROJET.md). Si le code ne correspond à aucun
    département configuré (département supprimé depuis, ou donnée
    historique), le code brut est retourné tel quel plutôt que de lever
    une erreur — un affichage dégradé mais sans casser la page."""
    nom = DepartementConfigure.objects.filter(code=code).values_list("nom", flat=True).first()
    return nom or code


def _taux(interactions_qs, type_interaction, total_envois):
    if total_envois == 0:
        return 0.0
    # Compté par envoi distinct (pas par événement brut) pour qu'un pixel
    # rechargé plusieurs fois, par exemple, ne fasse pas dépasser 100 %.
    nb = interactions_qs.filter(type=type_interaction).values("envoi_id").distinct().count()
    return round(nb / total_envois * 100, 1)


def calculer_score(envois_qs):
    """Calcule les taux d'interaction et le score de vulnérabilité composite
    (0-100) à partir d'un queryset d'EnvoiTracking, quel que soit le nombre
    de scénarios ou de départements ciblés à l'origine de ces envois."""
    total_envois = envois_qs.count()
    interactions = Interaction.objects.filter(envoi__in=envois_qs)

    taux_ouverture = _taux(interactions, TypeInteraction.OUVERTURE, total_envois)
    taux_clic = _taux(interactions, TypeInteraction.CLIC, total_envois)
    taux_soumission = _taux(interactions, TypeInteraction.SOUMISSION, total_envois)
    taux_signalement = _taux(interactions, TypeInteraction.SIGNALEMENT, total_envois)

    score = (
        POIDS_SOUMISSION * taux_soumission
        + POIDS_CLIC * taux_clic
        + POIDS_OUVERTURE * taux_ouverture
        - POIDS_SIGNALEMENT * taux_signalement
    )
    score = max(0.0, min(100.0, round(score, 1)))

    return {
        "total_envois": total_envois,
        "taux_ouverture": taux_ouverture,
        "taux_clic": taux_clic,
        "taux_soumission": taux_soumission,
        "taux_signalement": taux_signalement,
        "score_vulnerabilite": score,
    }


def score_campagne(campagne):
    """Score d'une campagne, agrégé sur l'ensemble de ses scénarios — y
    compris quand ceux-ci sont répartis par département (jour 10)."""
    scenarios = campagne.scenarios.all()
    envois = EnvoiTracking.objects.filter(scenario__in=scenarios)
    resultat = calculer_score(envois)
    resultat["campagne_id"] = campagne.id
    resultat["nombre_scenarios"] = scenarios.count()
    return resultat


def score_par_departement():
    """Agrégation pour le tableau de bord global : un score par département,
    calculé sur l'ensemble des campagnes de ce département (toutes campagnes
    et tous scénarios confondus)."""
    resultats = []
    for dept in DepartementConfigure.objects.all():
        campagnes = Campagne.objects.filter(departement=dept.code)
        scenarios = ScenarioPhishing.objects.filter(campagne__in=campagnes)
        envois = EnvoiTracking.objects.filter(scenario__in=scenarios)
        resultat = calculer_score(envois)
        resultat["departement"] = dept.code
        resultat["departement_libelle"] = dept.nom
        resultat["nombre_campagnes"] = campagnes.count()
        resultats.append(resultat)
    return resultats


def historique_par_departement():
    """Historique détaillé, campagne par campagne, pour chaque département —
    contrairement à score_par_departement() qui agrège tout en un seul
    chiffre, ici chaque campagne garde sa propre entrée chronologique pour
    permettre d'afficher l'évolution du score dans le temps (jour 14)."""
    resultats = []
    for dept in DepartementConfigure.objects.all():
        campagnes = Campagne.objects.filter(departement=dept.code).order_by("date_creation")
        historique = []
        for campagne in campagnes:
            score = score_campagne(campagne)
            historique.append(
                {
                    "campagne_id": campagne.id,
                    "date_creation": campagne.date_creation,
                    "statut": campagne.statut,
                    "total_envois": score["total_envois"],
                    "taux_ouverture": score["taux_ouverture"],
                    "taux_clic": score["taux_clic"],
                    "taux_soumission": score["taux_soumission"],
                    "taux_signalement": score["taux_signalement"],
                    "score_vulnerabilite": score["score_vulnerabilite"],
                }
            )
        resultats.append(
            {
                "departement": dept.code,
                "departement_libelle": dept.nom,
                "nombre_campagnes": campagnes.count(),
                "campagnes": historique,
            }
        )
    return resultats
