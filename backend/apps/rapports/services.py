from django.template.loader import render_to_string
from django.utils import timezone
from weasyprint import HTML

from apps.campagnes.services import score_campagne


def niveau_risque(score):
    if score >= 50:
        return "risk-eleve", "Élevé"
    if score >= 25:
        return "risk-modere", "Modéré"
    return "risk-faible", "Faible"


class GenerationRapportService:
    """Génère à la demande un rapport PDF pour une campagne — score de
    vulnérabilité, détail des taux d'interaction et recommandations. Rien
    n'est stocké : le PDF est produit à chaque appel à partir des données
    réelles (apps.campagnes.services.score_campagne)."""

    def __init__(self, campagne):
        self.campagne = campagne

    def generer_recommandations(self, score):
        if score["total_envois"] == 0:
            return [
                "Aucun email n'a encore été envoyé pour cette campagne : lancez-la pour obtenir des "
                "résultats exploitables et des recommandations personnalisées."
            ]

        recommandations = []
        if score["taux_soumission"] >= 25:
            recommandations.append(
                "Une part significative des employés testés a transmis des informations à la fausse "
                "page : organiser une formation ciblée en priorité pour ce département."
            )
        elif score["taux_clic"] >= 50:
            recommandations.append(
                "Le taux de clic est élevé : sensibiliser les employés à vérifier l'expéditeur et l'URL "
                "avant de cliquer sur un lien reçu par email."
            )
        elif score["score_vulnerabilite"] < 25:
            recommandations.append(
                "Le niveau de vigilance observé est bon : maintenir des campagnes de sensibilisation "
                "régulières pour le conserver dans la durée."
            )
        else:
            recommandations.append(
                "Le niveau de risque est modéré : une session de sensibilisation générale est "
                "recommandée dans les prochains mois."
            )

        if score["taux_signalement"] >= 20:
            recommandations.append(
                "Un bon taux de signalement montre une vigilance réelle d'une partie des employés — "
                "valoriser ce comportement auprès des équipes pour l'encourager davantage."
            )
        else:
            recommandations.append(
                "Peu ou aucun signalement n'a été enregistré : rappeler aux employés la procédure à "
                "suivre en cas d'email suspect (qui contacter, ne pas cliquer, ne pas répondre)."
            )
        return recommandations

    def generer_pdf(self):
        score = score_campagne(self.campagne)
        classe_risque, libelle_risque = niveau_risque(score["score_vulnerabilite"])
        contexte = {
            "campagne": self.campagne,
            "score": score,
            "classe_risque": classe_risque,
            "libelle_risque": libelle_risque,
            "recommandations": self.generer_recommandations(score),
            "date_generation": timezone.now(),
        }
        html_content = render_to_string("rapports/rapport.html", contexte)
        return HTML(string=html_content).write_pdf()
