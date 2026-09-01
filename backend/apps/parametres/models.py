from django.db import models

from .crypto import chiffrer, dechiffrer

# Les 8 réglages actuellement lus uniquement depuis .env/settings (voir
# config/settings/base.py) — seuls ces identifiants sont acceptés comme
# `cle`, pour éviter un magasin clé-valeur arbitraire sans rapport avec
# l'application.
CLES_CONNUES = [
    "ANTHROPIC_API_KEY",
    "ANTHROPIC_MODEL",
    "EMAIL_HOST",
    "EMAIL_PORT",
    "EMAIL_HOST_USER",
    "EMAIL_HOST_PASSWORD",
    "EMAIL_USE_TLS",
    "SIMULATION_BASE_URL",
]

# Clés dont la valeur est masquée en lecture (jamais renvoyée en clair
# par l'API après enregistrement) — les identifiants de connexion, pas
# les réglages neutres (modèle, port, URL).
CLES_SECRETES = {"ANTHROPIC_API_KEY", "EMAIL_HOST_PASSWORD"}


class ParametreExterne(models.Model):
    """Un réglage externe (clé API, identifiants SMTP...) saisi par
    l'administrateur depuis l'application plutôt que dans `.env` — voir
    apps.parametres.services.get_parametre(), qui retombe sur
    `.env`/`settings` si rien n'est configuré ici."""

    cle = models.CharField(max_length=50, unique=True, choices=[(c, c) for c in CLES_CONNUES])
    valeur_chiffree = models.TextField(blank=True)
    date_maj = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["cle"]

    def __str__(self):
        return self.cle

    @property
    def est_secret(self):
        return self.cle in CLES_SECRETES

    def set_valeur(self, valeur_claire):
        self.valeur_chiffree = chiffrer(valeur_claire) if valeur_claire else ""

    def get_valeur(self):
        if not self.valeur_chiffree:
            return ""
        return dechiffrer(self.valeur_chiffree)

    def valeur_masquee(self):
        try:
            valeur = self.get_valeur()
        except Exception:
            return ""
        if not valeur:
            return ""
        if len(valeur) <= 4:
            return "••••"
        return f"••••{valeur[-4:]}"
