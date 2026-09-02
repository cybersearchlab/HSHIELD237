import uuid

from django.db import models

from apps.campagnes.models import Campagne, ScenarioPhishing


class ConfigurationEnvoi(models.Model):
    """Configuration d'envoi propre à une campagne : expéditeur affiché
    (distinct du compte SMTP authentifié), adresse de réponse neutre et
    débit d'envoi, pour préserver la réputation du domaine et éviter
    qu'une réponse d'un employé ne parte vers une adresse non maîtrisée."""

    campagne = models.OneToOneField(Campagne, on_delete=models.CASCADE, related_name="configuration_envoi")
    expediteur_nom = models.CharField(max_length=255, blank=True, default="")
    expediteur_email = models.EmailField(blank=True, default="")
    reply_to = models.EmailField(blank=True, default="")
    delai_entre_envois = models.PositiveIntegerField(
        default=2, help_text="Secondes minimales entre deux envois consécutifs"
    )

    def __str__(self):
        return f"Configuration d'envoi — {self.campagne}"


class EnvoiTracking(models.Model):
    """Trace un envoi individuel (un scénario vers un destinataire) et sert
    d'identifiant de tracking unique encodé dans l'URL de la fausse page
    de capture."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scenario = models.ForeignKey(ScenarioPhishing, on_delete=models.CASCADE, related_name="envois")
    destinataire_email = models.EmailField()
    date_envoi = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_envoi"]

    def __str__(self):
        return f"{self.destinataire_email} — {self.scenario}"


class TypeInteraction(models.TextChoices):
    OUVERTURE = "ouverture", "Ouverture"
    CLIC = "clic", "Clic"
    SOUMISSION = "soumission", "Soumission"
    SIGNALEMENT = "signalement", "Signalement"


class Interaction(models.Model):
    """Événement enregistré pour un envoi donné (identifié par le même
    tracking utilisé dans l'URL de la fausse page et du pixel de suivi)."""

    envoi = models.ForeignKey(EnvoiTracking, on_delete=models.CASCADE, related_name="interactions")
    type = models.CharField(max_length=20, choices=TypeInteraction.choices)
    horodatage = models.DateTimeField(auto_now_add=True)
    adresse_ip = models.GenericIPAddressField(blank=True, null=True)
    # Pour une SOUMISSION : quels champs du formulaire (générique ou page
    # personnalisée, voir apps.campagnes.ScenarioPhishing.page_capture_html)
    # contenaient une valeur au moment de l'envoi — uniquement des booléens
    # (ex. {"email": true, "password": true}), jamais le contenu saisi
    # lui-même (voir REQ-F-04 du cahier des charges : aucune donnée
    # sensible réelle n'est stockée). Rempli par
    # apps.simulation.views._champs_renseignes_depuis_requete.
    champs_renseignes = models.JSONField(blank=True, null=True)

    class Meta:
        ordering = ["-horodatage"]

    def __str__(self):
        return f"{self.get_type_display()} — {self.envoi}"
