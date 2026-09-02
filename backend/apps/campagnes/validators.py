"""Validation de la fausse page de capture personnalisée (voir
ScenarioPhishing.page_capture_html) — c'est ici que se joue la contrainte
demandée par l'utilisateur : « forcer chaque page HTML de fausse capture à
respecter certains paramètres utiles au suivi de la soumission ». Plutôt que
d'imposer une convention manuelle (ex. un attribut ou un endpoint précis que
le consultant devrait connaître et respecter lui-même), la page n'a besoin
de contenir qu'un vrai formulaire HTML standard — un script de suivi est
ensuite injecté automatiquement au moment de servir la page (voir
apps.simulation.services.construire_page_capture) et intercepte lui-même
n'importe quel formulaire présent. Le consultant n'a donc rien de
particulier à coder ; seule l'absence totale de formulaire est refusée,
puisqu'aucune soumission ne pourrait alors être détectée."""

import re

from django.core.exceptions import ValidationError

# Une page HTML réaliste dépasse rarement quelques centaines de Ko même
# avec du CSS/JS embarqué — 2 Mo laisse une marge très confortable tout en
# évitant qu'un import abusif ne gonfle la base de données.
TAILLE_MAX_OCTETS = 2 * 1024 * 1024

_RE_FORM = re.compile(r"<form\b", re.IGNORECASE)
_RE_CHAMP = re.compile(r"<(input|textarea|select)\b", re.IGNORECASE)
_RE_BODY_FERMANT = re.compile(r"</body\s*>", re.IGNORECASE)


def valider_page_capture_html(contenu):
    """Valide et normalise le HTML d'une fausse page de capture. Lève une
    ValidationError (message en français, destiné à être renvoyé tel quel
    au consultant) si la page ne peut pas être suivie. Retourne le contenu
    nettoyé (espaces superflus en tête/queue retirés) prêt à être stocké."""
    if contenu is None:
        contenu = ""
    contenu = contenu.strip()

    if not contenu:
        raise ValidationError("Le contenu HTML de la page est vide.")

    if len(contenu.encode("utf-8", errors="ignore")) > TAILLE_MAX_OCTETS:
        raise ValidationError("Cette page dépasse la taille maximale autorisée (2 Mo).")

    if not _RE_FORM.search(contenu):
        raise ValidationError(
            "Cette page ne contient aucun formulaire (balise <form>) — sans "
            "formulaire, aucune soumission ne peut être suivie. Ajoutez un "
            "<form> autour des champs à surveiller."
        )

    if not _RE_CHAMP.search(contenu):
        raise ValidationError(
            "Le formulaire de cette page ne contient aucun champ de saisie "
            "(<input>, <textarea> ou <select>) — rien à suivre."
        )

    return contenu
