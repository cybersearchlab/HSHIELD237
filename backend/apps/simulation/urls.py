from django.urls import path

from .views import CapturePageView, ConfigurationEnvoiView, EnvoyerCampagneView

# Inclus sous /api/simulation/ — nécessite une authentification (consultant/administrateur).
api_urlpatterns = [
    path("campagnes/<int:campagne_id>/configuration/", ConfigurationEnvoiView.as_view(), name="simulation-configuration"),
    path("campagnes/<int:campagne_id>/envoyer/", EnvoyerCampagneView.as_view(), name="simulation-envoyer"),
]

# Inclus sous /simulation/ — page publique, aucune authentification.
public_urlpatterns = [
    path("capture/<uuid:tracking_id>/", CapturePageView.as_view(), name="simulation-capture"),
]
