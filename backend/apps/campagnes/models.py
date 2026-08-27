from django.contrib.postgres.fields import ArrayField
from django.db import models


class Statut(models.TextChoices):
    BROUILLON = "brouillon", "Brouillon"
    EN_ATTENTE = "en_attente", "En attente"
    ACTIVE = "active", "Active"
    TERMINEE = "terminee", "Terminée"


class Departement(models.TextChoices):
    DIRECTION = "direction", "Direction générale"
    RH = "rh", "Ressources humaines"
    COMPTABILITE = "comptabilite", "Comptabilité / Finance"
    IT = "it", "Informatique"
    COMMERCIAL = "commercial", "Commercial / Ventes"
    JURIDIQUE = "juridique", "Juridique"
    MARKETING = "marketing", "Marketing / Communication"
    PRODUCTION = "production", "Production / Opérations"
    ACHATS = "achats", "Achats / Logistique"
    AUTRE = "autre", "Autre"


class Campagne(models.Model):
    departement = models.CharField(max_length=20, choices=Departement.choices)
    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.BROUILLON)
    date_creation = models.DateTimeField(auto_now_add=True)
    perimetre_valide = models.BooleanField(default=False)

    class Meta:
        ordering = ["-date_creation"]

    def __str__(self):
        return f"{self.get_departement_display()} — {self.get_statut_display()}"


class ScenarioPhishing(models.Model):
    campagne = models.ForeignKey(Campagne, on_delete=models.CASCADE, related_name="scenarios")
    objet_email = models.CharField(max_length=255)
    corps_email = models.TextField()
    url_fausse_page = models.URLField()
    secteur_cible = models.CharField(max_length=255)
    piece_jointe = models.FileField(upload_to="scenarios/%Y/%m/", blank=True, null=True)
    expediteur_nom = models.CharField(max_length=255, blank=True, default="")
    expediteur_email = models.EmailField(blank=True, default="")
    destinataire_email = models.EmailField(blank=True, default="")
    est_html = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)
    departements_cibles = ArrayField(
        models.CharField(max_length=20, choices=Departement.choices),
        default=list,
        blank=True,
        help_text=(
            "Départements ciblés par ce scénario au sein de sa campagne. "
            "Vide = scénario générique, utilisé par défaut pour tout "
            "destinataire dont le département n'est ciblé par aucun autre "
            "scénario de la campagne."
        ),
    )

    class Meta:
        ordering = ["-date_creation"]

    def __str__(self):
        return self.objet_email


class Destinataire(models.Model):
    """Un employé destinataire d'une campagne, rattaché à un département —
    utilisé pour sélectionner automatiquement le bon scénario au moment de
    l'envoi (voir apps.simulation.EnvoiCampagneService)."""

    campagne = models.ForeignKey(Campagne, on_delete=models.CASCADE, related_name="destinataires")
    email = models.EmailField()
    departement = models.CharField(max_length=20, choices=Departement.choices)

    class Meta:
        ordering = ["email"]
        unique_together = ("campagne", "email")

    def __str__(self):
        return f"{self.email} ({self.get_departement_display()})"
