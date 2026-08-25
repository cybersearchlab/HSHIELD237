from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.db import models

from apps.campagnes.models import Campagne, Departement


class StatutConsentement(models.TextChoices):
    EN_ATTENTE = "en_attente", "En attente"
    VALIDE = "valide", "Validé"
    REFUSE = "refuse", "Refusé"


class MotifRefus(models.TextChoices):
    PERIMETRE_TROP_LARGE = "perimetre_trop_large", "Le périmètre testé est trop large"
    TIMING_INAPPROPRIE = "timing_inapproprie", "Le moment choisi n'est pas approprié"
    SCENARIO_INADAPTE = "scenario_inadapte", "Le scénario n'est pas adapté à ce département"
    INFOS_INSUFFISANTES = "infos_insuffisantes", "Informations insuffisantes pour valider en connaissance de cause"
    AUTRE = "autre", "Autre motif (préciser)"


class ResponsableDepartement(models.Model):
    """Registre géré exclusivement par l'administrateur : un seul
    responsable désigné par département. Alimente automatiquement la
    demande de consentement de toute nouvelle campagne pour ce
    département — ce n'est plus le consultant qui initie la campagne qui
    saisit librement un nom/email de responsable, par souci de sécurité."""

    departement = models.CharField(max_length=20, choices=Departement.choices, unique=True)
    nom = models.CharField(max_length=255)
    email = models.EmailField()
    date_maj = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_departement_display()} — {self.nom}"


class Consentement(models.Model):
    """Autorisation explicite d'un responsable habilité, obligatoire avant
    tout lancement de campagne. La validation ne peut être effectuée que
    par un utilisateur authentifié du rôle Responsable, depuis
    l'application, dont l'email correspond à responsable_email — jamais
    par simple déclaration du consultant. responsable_nom/responsable_email
    sont désormais renseignés automatiquement depuis ResponsableDepartement
    au moment de la création de la campagne, jamais saisis librement."""

    campagne = models.OneToOneField(Campagne, on_delete=models.CASCADE, related_name="consentement")
    responsable_nom = models.CharField(max_length=255)
    responsable_email = models.EmailField()
    statut = models.CharField(
        max_length=20, choices=StatutConsentement.choices, default=StatutConsentement.EN_ATTENTE
    )
    date_validation = models.DateTimeField(blank=True, null=True)
    motifs_refus = ArrayField(
        models.CharField(max_length=30, choices=MotifRefus.choices), default=list, blank=True
    )
    motif_refus_details = models.TextField(blank=True)

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
