"""Chiffrement symétrique des valeurs de ParametreExterne (clés API,
mots de passe SMTP...) — jamais stockées en clair en base. La clé Fernet
est dérivée de SECRET_KEY plutôt que d'exiger une variable
d'environnement supplémentaire à provisionner."""

import base64
import hashlib

from cryptography.fernet import Fernet
from django.conf import settings


def _fernet():
    digest = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    cle = base64.urlsafe_b64encode(digest)
    return Fernet(cle)


def chiffrer(valeur_claire):
    return _fernet().encrypt(valeur_claire.encode()).decode()


def dechiffrer(valeur_chiffree):
    return _fernet().decrypt(valeur_chiffree.encode()).decode()
