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
