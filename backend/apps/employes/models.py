from django.db import models


class Employe(models.Model):
    """Annuaire des employés réels de l'entreprise cliente, géré par
    l'administrateur — remplace l'adresse de diffusion unique utilisée
    jusqu'ici pour l'envoi d'une campagne. Chaque employé appartient à un
    seul département (code, validé en live contre
    apps.campagnes.DepartementConfigure — pas de ForeignKey, voir la
    décision documentée dans docs/CONTEXTE_PROJET.md, 2026-08-27).

    Au lancement d'une campagne, le consultant peut choisir d'envoyer à
    tous les employés du département de la campagne, ou à un seul en
    particulier — chacun reçoit un message individuel (voir
    apps.simulation.EnvoiCampagneService.envoyer_aux_employes), jamais une
    adresse de diffusion visible par les autres destinataires."""

    nom = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    departement = models.CharField(max_length=30)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["nom"]

    def __str__(self):
        from apps.campagnes.services import departement_label

        return f"{self.nom} ({departement_label(self.departement)})"
