from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class Role(models.TextChoices):
    CONSULTANT = "consultant", "Consultant"
    RESPONSABLE = "responsable", "Responsable"
    EMPLOYE = "employe", "Employé"
    ADMINISTRATEUR = "administrateur", "Administrateur"


class Utilisateur(AbstractUser):
    email = models.EmailField("adresse e-mail", unique=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.EMPLOYE,
    )
    # Horodatage du dernier changement de mot de passe (self-service,
    # réinitialisation admin directe, ou traitement d'une demande) — sert
    # à invalider les jetons JWT émis avant ce changement, sans passer
    # par une liste de révocation en base (voir
    # apps.accounts.authentication). `null` tant qu'aucun changement n'a
    # eu lieu depuis la création du compte.
    date_changement_mot_de_passe = models.DateTimeField(blank=True, null=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.get_full_name() or self.email


class StatutDemande(models.TextChoices):
    EN_ATTENTE = "en_attente", "En attente"
    TRAITEE = "traitee", "Traitée"


class DemandeReinitialisation(models.Model):
    """Trace une demande « mot de passe oublié » / « contacter
    l'administrateur » depuis la page de connexion — jamais de lien de
    réinitialisation auto-envoyé à l'utilisateur : c'est l'administrateur,
    notifié par email, qui déclenche la réinitialisation depuis
    l'application (voir apps.accounts.views). `utilisateur` reste `null`
    si l'email saisi ne correspond à aucun compte — conservé pour
    information côté administrateur, sans jamais le révéler côté client
    (la réponse de l'API est toujours la même, qu'un compte existe ou
    non)."""

    email_saisi = models.EmailField()
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name="demandes_reinitialisation"
    )
    statut = models.CharField(max_length=20, choices=StatutDemande.choices, default=StatutDemande.EN_ATTENTE)
    date_demande = models.DateTimeField(auto_now_add=True)
    date_traitement = models.DateTimeField(blank=True, null=True)
    traite_par = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="demandes_traitees"
    )

    class Meta:
        ordering = ["-date_demande"]

    def __str__(self):
        return f"{self.email_saisi} — {self.get_statut_display()}"
