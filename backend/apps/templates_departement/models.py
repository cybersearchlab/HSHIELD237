from django.db import models


class TemplateDepartement(models.Model):
    """Structure de scénario réutilisable pour un département donné —
    remplace le concept de « template sectoriel » du plan d'origine
    (plusieurs entreprises clientes, un secteur chacune), abandonné dès
    le jour 6 : l'application sert une seule entreprise, segmentée par
    département interne, pas par secteur d'activité de client. Permet à
    un consultant de repartir d'une base déjà rédigée plutôt que de
    resaisir un scénario depuis zéro pour un département testé
    régulièrement (nom : voir apps.gouvernance.ResponsableDepartement,
    apps.campagnes.services.score_par_departement — même convention de
    nommage dans tout le projet)."""

    nom = models.CharField(max_length=255)
    departement = models.CharField(max_length=30)
    prompt_structure = models.TextField(
        help_text="Base de structure fournie à l'API Claude au moment de la génération — "
        "pas un email déjà rédigé, un guide de contenu à adapter."
    )
    nombre_utilisations = models.PositiveIntegerField(default=0)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_creation"]

    def __str__(self):
        from apps.campagnes.services import departement_label

        return f"{self.nom} — {departement_label(self.departement)}"
