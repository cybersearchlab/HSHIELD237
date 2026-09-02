#!/bin/sh
# Applique les migrations en attente avant de démarrer le serveur —
# aucune commande manuelle nécessaire au premier démarrage ni lors
# d'une mise à jour (voir docs/DEPLOIEMENT.md, section 5/9). `set -e` :
# un échec de migration bloque le démarrage plutôt que de laisser
# tourner un backend avec un schéma de base désynchronisé.
set -e

python manage.py migrate --noinput

exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
