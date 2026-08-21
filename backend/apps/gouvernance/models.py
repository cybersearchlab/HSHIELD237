from django.conf import settings
from django.db import models

from apps.campagnes.models import Campagne


class StatutConsentement(models.TextChoices):
    EN_ATTENTE = "en_attente", "En attente"
    VALIDE = "valide", "Validé"
    REFUSE = "refuse", "Refusé"


class Consentement(models.Model):
    """Autorisation explicite d'un responsable habilité, obligatoire avant
    tout lancement de campagne. La validation ne peut être effectuée que
    par un utilisateur authentifié du rôle Responsable, depuis
    l'application, dont l'email correspond à responsable_email — jamais
    par simple déclaration du consultant."""

    campagne = models.OneToOneField(Campagne, on_delete=models.CASCADE, related_name="consentement")
    responsable_nom = models.CharField(max_length=255)
    responsable_email = models.EmailField()
    statut = models.CharField(
        max_length=20, choices=StatutConsentement.choices, default=StatutConsentement.EN_ATTENTE
    )
    date_validation = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Consentement — {self.campagne} ({self.get_statut_display()})"


class JournalAudit(models.Model):
    """Trace chaque action sensible (demande, validation, refus de
    consentement) de façon horodatée."""

    action = models.CharField(max_length=255)
    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="actions_audit"
    )
    horodatage = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-horodatage"]

    def __str__(self):
        return f"{self.action} — {self.horodatage:%Y-%m-%d %H:%M}"
