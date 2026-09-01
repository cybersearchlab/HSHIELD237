"""Résolution des réglages externes — priorité au registre en base
(`ParametreExterne`, géré par l'administrateur), repli sur
`.env`/`settings` sinon. Jamais de substitution automatique en variable
d'environnement : le code applicatif appelle explicitement ces
fonctions (voir apps.generation.services.ClaudeGenerationService,
apps.simulation.services.EnvoiCampagneService)."""


def get_parametre(cle, defaut=""):
    from .models import ParametreExterne

    try:
        parametre = ParametreExterne.objects.get(cle=cle)
    except ParametreExterne.DoesNotExist:
        return defaut
    valeur = parametre.get_valeur()
    return valeur if valeur else defaut


def get_parametre_int(cle, defaut):
    valeur = get_parametre(cle, None)
    if not valeur:
        return defaut
    try:
        return int(valeur)
    except (TypeError, ValueError):
        return defaut


def get_parametre_bool(cle, defaut):
    valeur = get_parametre(cle, None)
    if valeur is None or valeur == "":
        return defaut
    return str(valeur).strip().lower() in ("1", "true", "vrai", "oui", "yes", "on")
