from .models import Consentement, ResponsableDepartement


def creer_consentement_auto(campagne):
    """Crée automatiquement la demande de consentement d'une campagne à
    partir du registre des responsables tenu par l'administrateur —
    aucune saisie libre du nom/email par la personne qui crée la
    campagne. Ne fait rien si un consentement existe déjà pour cette
    campagne, ou si aucun responsable n'est encore configuré pour son
    département (l'administrateur pourra le générer plus tard une fois
    le registre complété)."""
    if hasattr(campagne, "consentement"):
        return None
    responsable = ResponsableDepartement.objects.filter(departement=campagne.departement).first()
    if responsable is None:
        return None
    return Consentement.objects.create(
        campagne=campagne,
        responsable_nom=responsable.nom,
        responsable_email=responsable.email,
    )
