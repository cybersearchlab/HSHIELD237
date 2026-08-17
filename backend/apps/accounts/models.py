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

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.get_full_name() or self.email
