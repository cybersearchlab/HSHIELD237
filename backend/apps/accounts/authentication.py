"""Invalide les jetons JWT émis avant le dernier changement de mot de
passe d'un utilisateur — sans liste de révocation en base : chaque
jeton (access ou refresh) porte une date d'émission (claim `iat`),
comparée à `Utilisateur.date_changement_mot_de_passe`. Un jeton plus
ancien que le dernier changement est rejeté, qu'il ait ou non atteint sa
durée de vie normale (15 min pour un access token, 7 jours pour un
refresh token — voir SIMPLE_JWT dans settings/base.py).

Attention : ce module est importé au chargement de Django (référencé
par REST_FRAMEWORK["DEFAULT_AUTHENTICATION_CLASSES"], résolu très tôt —
y compris depuis l'intérieur même de `rest_framework.schemas`). Il doit
donc rester libre de tout import qui remonte à `rest_framework.views`
(directement ou via `rest_framework.generics`/`rest_framework_simplejwt.views`),
sous peine d'import circulaire. Voir `TokenRefreshViewAvecInvalidation`
dans `views.py`, qui réutilise `_jeton_perime_par_changement_mot_de_passe`
d'ici sans que ce module n'ait besoin d'importer `TokenRefreshView`."""

import datetime

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed


def jeton_perime_par_changement_mot_de_passe(utilisateur, validated_token):
    date_changement = getattr(utilisateur, "date_changement_mot_de_passe", None)
    iat = validated_token.get("iat")
    if not date_changement or iat is None:
        return False
    emis_le = datetime.datetime.fromtimestamp(iat, tz=datetime.timezone.utc)
    return emis_le < date_changement


class JWTAuthenticationAvecInvalidation(JWTAuthentication):
    """Authentification des requêtes (access token) — utilisée comme
    DEFAULT_AUTHENTICATION_CLASSES à la place de la classe SimpleJWT
    standard."""

    def get_user(self, validated_token):
        utilisateur = super().get_user(validated_token)
        if jeton_perime_par_changement_mot_de_passe(utilisateur, validated_token):
            raise AuthenticationFailed(
                "Ce jeton a été émis avant le dernier changement de mot de passe — reconnectez-vous.",
                code="token_not_valid",
            )
        return utilisateur
