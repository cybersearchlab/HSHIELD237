from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils.text import slugify


class Statut(models.TextChoices):
    BROUILLON = "brouillon", "Brouillon"
    EN_ATTENTE = "en_attente", "En attente"
    ACTIVE = "active", "Active"
    TERMINEE = "terminee", "Terminée"


class Departement(models.TextChoices):
    """Constantes de commodité pour le code (tests, seed de migration,
    lisibilité). N'est plus branchée à `choices=` sur aucun champ depuis
    le 2026-08-27 (voir Departement, le modèle ci-dessous) — la liste
    réelle des départements est désormais gérée dynamiquement par
    l'administrateur, en base. Ces 10 valeurs restent le contenu du
    seed initial (migration 0006)."""

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


class DepartementConfigure(models.Model):
    """Registre autoritaire des départements de l'entreprise cliente,
    géré par l'administrateur (créer/renommer/supprimer). Remplace
    l'ancienne liste figée `Departement.choices` — les champs qui
    stockaient déjà un code de département (Campagne.departement,
    Destinataire.departement, ResponsableDepartement.departement,
    TemplateDepartement.departement) continuent de stocker ce même code
    en CharField libre (pas de ForeignKey — voir docs/CONTEXTE_PROJET.md,
    décision du 2026-08-27, pour la justification), mais sa validité et
    son libellé affiché sont désormais résolus par lecture live de cette
    table plutôt que par une énumération figée dans le code."""

    code = models.SlugField(max_length=30, unique=True, editable=False)
    nom = models.CharField(max_length=100, unique=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["nom"]

    def save(self, *args, **kwargs):
        if not self.code:
            base = slugify(self.nom)[:30] or "departement"
            code = base
            suffixe = 2
            while DepartementConfigure.objects.filter(code=code).exclude(pk=self.pk).exists():
                suffixe_str = f"-{suffixe}"
                code = f"{base[: 30 - len(suffixe_str)]}{suffixe_str}"
                suffixe += 1
            self.code = code
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nom


class Campagne(models.Model):
    departement = models.CharField(max_length=30)
    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.BROUILLON)
    date_creation = models.DateTimeField(auto_now_add=True)
    perimetre_valide = models.BooleanField(default=False)

    class Meta:
        ordering = ["-date_creation"]

    def __str__(self):
        from .services import departement_label

        return f"{departement_label(self.departement)} — {self.get_statut_display()}"


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
        models.CharField(max_length=30),
        default=list,
        blank=True,
        help_text=(
            "Départements ciblés par ce scénario au sein de sa campagne. "
            "Vide = scénario générique, utilisé par défaut pour tout "
            "destinataire dont le département n'est ciblé par aucun autre "
            "scénario de la campagne. Champ retiré de l'interface depuis "
            "le 2026-08-21 (voir docs/CONTEXTE_PROJET.md) — non concerné "
            "par le passage des départements en registre dynamique : les "
            "codes ici stockés ne sont plus validés contre la liste "
            "actuelle des départements."
        ),
    )
    # Fausse page de capture personnalisée (2026-09-02) : HTML fourni par le
    # consultant (collé ou importé depuis un fichier .html), imitant
    # l'apparence d'un service réel. Vide = page générique par défaut
    # (voir apps.simulation.views.CapturePageView, templates/simulation/
    # capture.html). Un script de suivi est injecté automatiquement au
    # moment de servir la page (voir apps.simulation.services.
    # construire_page_capture) — jamais stocké tel quel ici, pour que la
    # page reste éditable/relisible sans le script parasite le
    # contaminant. Validé à l'enregistrement : doit contenir un vrai
    # formulaire (voir apps.campagnes.validators.valider_page_capture_html)
    # — c'est le mécanisme qui « force » toute page importée à respecter le
    # minimum nécessaire au suivi de soumission.
    page_capture_html = models.TextField(blank=True, default="")
    page_capture_date_maj = models.DateTimeField(blank=True, null=True)

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
    departement = models.CharField(max_length=30)

    class Meta:
        ordering = ["email"]
        unique_together = ("campagne", "email")

    def __str__(self):
        from .services import departement_label

        return f"{self.email} ({departement_label(self.departement)})"
