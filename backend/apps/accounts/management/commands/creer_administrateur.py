"""Commande de gestion dédiée à la création du tout premier compte
administrateur d'un déploiement (Jour 20 du plan) — évite de devoir le
créer manuellement en base de données, et évite le piège de
`manage.py createsuperuser` seul : cette commande native Django crée un
compte technique (`is_staff`/`is_superuser`) mais ne positionne jamais le
champ applicatif `role` utilisé par les permissions H-SHIELD237
(`IsAdministrateur` ne regarde que `role`, pas `is_superuser`) — voir
docs/DEPLOIEMENT.md. `creer_administrateur` fait les deux d'un coup.

Usage interactif :
    python manage.py creer_administrateur

Usage non interactif (scripts de déploiement) :
    python manage.py creer_administrateur --noinput \\
        --email admin@exemple.cm --password "..." \\
        --first-name Prenom --last-name Nom
ou, mot de passe fourni par variable d'environnement plutôt qu'en clair
dans une commande (visible dans l'historique du shell) :
    DJANGO_ADMIN_PASSWORD="..." python manage.py creer_administrateur \\
        --noinput --email admin@exemple.cm
"""

import getpass
import os

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.management.base import BaseCommand, CommandError
from django.core.validators import validate_email

from apps.accounts.models import Role, Utilisateur


class Command(BaseCommand):
    help = (
        "Crée un compte administrateur H-SHIELD237 — à la fois un compte "
        "technique Django (accès à /admin/) et un compte applicatif avec "
        "le rôle « administrateur » (accès aux endpoints réservés à ce "
        "rôle, ex. Paramètres > Équipe). Remplace le besoin de créer ce "
        "premier compte manuellement en base de données."
    )

    def add_arguments(self, parser):
        parser.add_argument("--email", help="Adresse email du compte (identifiant de connexion).")
        parser.add_argument("--password", help="Mot de passe — évitez cette option en scripté (visible dans l'historique du shell), préférez DJANGO_ADMIN_PASSWORD.")
        parser.add_argument("--first-name", dest="first_name", default="", help="Prénom (optionnel).")
        parser.add_argument("--last-name", dest="last_name", default="", help="Nom (optionnel).")
        parser.add_argument(
            "--noinput",
            "--no-input",
            dest="interactive",
            action="store_false",
            default=True,
            help="Ne pose aucune question — --email est alors requis, et le mot de passe doit venir de --password ou de la variable d'environnement DJANGO_ADMIN_PASSWORD.",
        )

    def handle(self, *args, **options):
        interactive = options["interactive"]
        email = options.get("email")
        password = options.get("password") or os.environ.get("DJANGO_ADMIN_PASSWORD")
        first_name = options.get("first_name") or ""
        last_name = options.get("last_name") or ""

        if interactive:
            if not email:
                email = input("Email : ").strip()
            if not first_name:
                first_name = input("Prénom (optionnel) : ").strip()
            if not last_name:
                last_name = input("Nom (optionnel) : ").strip()
            if not password:
                while True:
                    password = getpass.getpass("Mot de passe : ")
                    confirmation = getpass.getpass("Confirmer le mot de passe : ")
                    if password != confirmation:
                        self.stderr.write(self.style.ERROR("Les deux mots de passe ne correspondent pas — réessayez."))
                        continue
                    break
        else:
            if not email:
                raise CommandError("--email est requis avec --noinput.")
            if not password:
                raise CommandError(
                    "Un mot de passe est requis avec --noinput : utilisez --password ou la "
                    "variable d'environnement DJANGO_ADMIN_PASSWORD."
                )

        email = (email or "").strip().lower()
        try:
            validate_email(email)
        except DjangoValidationError as exc:
            raise CommandError(f"Adresse email invalide : {exc.messages[0]}") from exc

        if Utilisateur.objects.filter(email__iexact=email).exists():
            raise CommandError(f"Un compte existe déjà avec l'email {email}.")

        try:
            validate_password(password)
        except DjangoValidationError as exc:
            raise CommandError("Mot de passe invalide : " + " ".join(exc.messages)) from exc

        utilisateur = Utilisateur.objects.create_user(
            username=email,
            email=email,
            first_name=first_name,
            last_name=last_name,
            password=password,
            role=Role.ADMINISTRATEUR,
            is_staff=True,
            is_superuser=True,
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Compte administrateur créé : {utilisateur.email} "
                f"(role={utilisateur.role}, is_staff={utilisateur.is_staff}, "
                f"is_superuser={utilisateur.is_superuser})."
            )
        )
