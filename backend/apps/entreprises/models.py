from django.db import models


class Entreprise(models.Model):
    nom = models.CharField(max_length=255)
    secteur = models.CharField(max_length=255)
    taille = models.CharField(max_length=100)
    contexte_additionnel = models.TextField(blank=True)
    contact_nom = models.CharField(max_length=255)
    contact_email = models.EmailField()
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_creation"]

    def __str__(self):
        return self.nom
