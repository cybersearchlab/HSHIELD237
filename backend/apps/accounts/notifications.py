"""Emails internes liés aux comptes — création d'un compte par
l'administrateur, réinitialisation de mot de passe (directe ou via une
demande). Aucun modèle de notification in-app n'existe dans ce projet ;
l'email (déjà configuré pour les campagnes de simulation, voir
apps.simulation) est le seul canal disponible."""

import secrets

from django.conf import settings
from django.core.mail import send_mail


def generer_mot_de_passe_temporaire():
    """Mot de passe temporaire aléatoire — assez long et non numérique
    pour passer d'office les validateurs Django déjà configurés
    (AUTH_PASSWORD_VALIDATORS)."""
    return secrets.token_urlsafe(12)


def _expediteur():
    return getattr(settings, "DEFAULT_FROM_EMAIL", None) or settings.EMAIL_HOST_USER or "no-reply@hshield237.local"


def envoyer_mot_de_passe_temporaire(utilisateur, mot_de_passe, cree=False):
    """Envoie le mot de passe temporaire au titulaire du compte — jamais
    affiché ni connu de l'administrateur qui a déclenché l'action
    (création de compte ou réinitialisation)."""
    sujet = (
        "Votre compte H-SHIELD237 a été créé"
        if cree
        else "Votre mot de passe H-SHIELD237 a été réinitialisé"
    )
    corps = (
        f"Bonjour {utilisateur.first_name or utilisateur.email},\n\n"
        + (
            "Un compte a été créé pour vous sur H-SHIELD237 par un administrateur.\n\n"
            if cree
            else "Votre mot de passe H-SHIELD237 vient d'être réinitialisé par un administrateur.\n\n"
        )
        + f"Email de connexion : {utilisateur.email}\n"
        f"Mot de passe temporaire : {mot_de_passe}\n\n"
        "Nous vous recommandons de le changer dès votre première connexion "
        "(Paramètres > Sécurité).\n\n"
        "— H-SHIELD237"
    )
    send_mail(sujet, corps, _expediteur(), [utilisateur.email], fail_silently=False)


def notifier_administrateurs(demande):
    """Notifie tous les comptes `role=administrateur` d'une nouvelle
    demande de réinitialisation ('mot de passe oublié' / 'contacter
    l'administrateur' depuis la page de connexion)."""
    from .models import Role, Utilisateur

    destinataires = list(
        Utilisateur.objects.filter(role=Role.ADMINISTRATEUR).values_list("email", flat=True)
    )
    if not destinataires:
        return
    correspond = "un compte existant" if demande.utilisateur_id else "aucun compte connu"
    sujet = "H-SHIELD237 — Demande de réinitialisation de mot de passe"
    corps = (
        f"Une demande de réinitialisation de mot de passe a été soumise depuis la page de "
        f"connexion pour l'adresse : {demande.email_saisi}\n\n"
        f"Cette adresse correspond à {correspond}.\n\n"
        "Rendez-vous dans Paramètres > Équipe pour traiter cette demande.\n\n"
        "— H-SHIELD237"
    )
    send_mail(sujet, corps, _expediteur(), destinataires, fail_silently=False)
