from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.views import MeView
from apps.campagnes.views import (
    CampagneScoreView,
    CampagneViewSet,
    DestinataireDetailView,
    DestinataireListCreateView,
    HistoriqueParDepartementView,
    ScenarioListView,
    ScoreParDepartementView,
)
from apps.generation.views import GenerationAPIView, GenerationManuelView
from apps.gouvernance.urls import urlpatterns as gouvernance_urls
from apps.rapports.views import RapportCampagneView
from apps.simulation.urls import api_urlpatterns as simulation_api_urls
from apps.simulation.urls import public_urlpatterns as simulation_public_urls
from apps.templates_departement.views import TemplateDepartementViewSet


def health(request):
    return JsonResponse({"status": "ok"})


router = DefaultRouter()
router.register("campagnes", CampagneViewSet, basename="campagne")
router.register("templates-departement", TemplateDepartementViewSet, basename="templatedepartement")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health),
    path("api-auth/", include("rest_framework.urls")),
    path("api/auth/login/", TokenObtainPairView.as_view(), name="auth-login"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("api/auth/me/", MeView.as_view(), name="auth-me"),
    path("api/generation/api/", GenerationAPIView.as_view(), name="generation-api"),
    path("api/generation/manuel/", GenerationManuelView.as_view(), name="generation-manuel"),
    path("api/simulation/", include(simulation_api_urls)),
    path("simulation/", include(simulation_public_urls)),
    path("api/gouvernance/", include(gouvernance_urls)),
    path(
        "api/campagnes/<int:campagne_id>/scenarios/",
        ScenarioListView.as_view(),
        name="campagne-scenarios",
    ),
    path(
        "api/campagnes/<int:campagne_id>/destinataires/",
        DestinataireListCreateView.as_view(),
        name="campagne-destinataires",
    ),
    path(
        "api/campagnes/<int:campagne_id>/destinataires/<int:destinataire_id>/",
        DestinataireDetailView.as_view(),
        name="campagne-destinataire-detail",
    ),
    path(
        "api/campagnes/departements/score/",
        ScoreParDepartementView.as_view(),
        name="campagnes-score-departements",
    ),
    path(
        "api/campagnes/departements/historique/",
        HistoriqueParDepartementView.as_view(),
        name="campagnes-historique-departements",
    ),
    path(
        "api/campagnes/<int:campagne_id>/score/",
        CampagneScoreView.as_view(),
        name="campagne-score",
    ),
    path(
        "api/campagnes/<int:campagne_id>/rapport/",
        RapportCampagneView.as_view(),
        name="campagne-rapport",
    ),
    path("api/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
