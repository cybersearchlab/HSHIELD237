from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.views import MeView
from apps.campagnes.views import CampagneViewSet


def health(request):
    return JsonResponse({"status": "ok"})


router = DefaultRouter()
router.register("campagnes", CampagneViewSet, basename="campagne")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health),
    path("api-auth/", include("rest_framework.urls")),
    path("api/auth/login/", TokenObtainPairView.as_view(), name="auth-login"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("api/auth/me/", MeView.as_view(), name="auth-me"),
    path("api/", include(router.urls)),
]
