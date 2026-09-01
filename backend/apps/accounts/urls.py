from django.urls import path

from .views import (
    DemandeReinitialisationListView,
    DemandeReinitialisationTraiterView,
    UtilisateurListCreateView,
    UtilisateurReinitialiserMotDePasseView,
    UtilisateurRoleView,
)

# Monté sous /api/accounts/ (voir config/urls.py) — distinct de /api/auth/,
# réservé aux endpoints d'authentification propres (login/refresh/me/
# changement de mot de passe/mot de passe oublié).
urlpatterns = [
    path("utilisateurs/", UtilisateurListCreateView.as_view(), name="accounts-utilisateurs"),
    path(
        "utilisateurs/<int:utilisateur_id>/role/",
        UtilisateurRoleView.as_view(),
        name="accounts-utilisateur-role",
    ),
    path(
        "utilisateurs/<int:utilisateur_id>/reinitialiser-mot-de-passe/",
        UtilisateurReinitialiserMotDePasseView.as_view(),
        name="accounts-utilisateur-reinitialiser",
    ),
    path(
        "demandes-reinitialisation/",
        DemandeReinitialisationListView.as_view(),
        name="accounts-demandes-reinitialisation",
    ),
    path(
        "demandes-reinitialisation/<int:demande_id>/traiter/",
        DemandeReinitialisationTraiterView.as_view(),
        name="accounts-demande-reinitialisation-traiter",
    ),
]
