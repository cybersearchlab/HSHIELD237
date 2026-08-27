import base64

from django.http import HttpResponse
from django.shortcuts import get_object_or_404, render
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdministrateur, IsConsultant
from apps.campagnes.models import Campagne

from .models import ConfigurationEnvoi, EnvoiTracking, Interaction, TypeInteraction
from .serializers import (
    ConfigurationEnvoiSerializer,
    EnvoiTrackingSerializer,
    EnvoyerCampagneRequestSerializer,
)
from .services import EnvoiCampagneError, EnvoiCampagneService

CAN_MANAGE_ENVOI = [IsAuthenticated & (IsConsultant | IsAdministrateur)]

# GIF transparent 1x1 — le pixel de suivi.
PIXEL_GIF = base64.b64decode("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==")


def _client_ip(request):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


class ConfigurationEnvoiView(APIView):
    """GET/PUT /api/simulation/campagnes/<id>/configuration/ — expéditeur
    affiché, Reply-To neutre et débit d'envoi propres à une campagne."""

    permission_classes = CAN_MANAGE_ENVOI

    def get_object(self, campagne_id):
        campagne = get_object_or_404(Campagne, pk=campagne_id)
        config, _ = ConfigurationEnvoi.objects.get_or_create(campagne=campagne)
        return config

    def get(self, request, campagne_id):
        config = self.get_object(campagne_id)
        return Response(ConfigurationEnvoiSerializer(config).data)

    def put(self, request, campagne_id):
        config = self.get_object(campagne_id)
        serializer = ConfigurationEnvoiSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class EnvoyerCampagneView(APIView):
    """POST /api/simulation/campagnes/<id>/envoyer/ — envoie la campagne.

    Avec `cible` ("tous" ou "un_employe"), envoie individuellement à
    l'annuaire des employés du département de la campagne (voir
    apps.employes) — c'est le chemin utilisé par la modale de lancement
    depuis le 2026-08-27. Sans `cible`, conserve le comportement
    historique (`destinataires` explicites, ou l'email de test de chaque
    scénario à défaut)."""

    permission_classes = CAN_MANAGE_ENVOI

    def post(self, request, campagne_id):
        campagne = get_object_or_404(Campagne, pk=campagne_id)
        request_serializer = EnvoyerCampagneRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)
        data = request_serializer.validated_data
        cible = data.get("cible")

        try:
            service = EnvoiCampagneService(campagne)
            if cible:
                trackings = service.envoyer_aux_employes(cible, data.get("employe_id"))
            else:
                destinataires = data.get("destinataires") or None
                trackings = service.envoyer_campagne(destinataires)
        except EnvoiCampagneError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(EnvoiTrackingSerializer(trackings, many=True).data, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name="dispatch")
class CapturePageView(View):
    """Vue publique (aucune authentification) servant la fausse page de
    capture. L'identifiant de tracking dans l'URL (UUID) identifie de façon
    unique le destinataire et le scénario concernés. Un accès (GET) enregistre
    un clic ; une soumission du formulaire (POST) enregistre une soumission —
    sans jamais conserver les identifiants saisis par la personne testée."""

    def get(self, request, tracking_id):
        tracking = get_object_or_404(EnvoiTracking, pk=tracking_id)
        Interaction.objects.create(envoi=tracking, type=TypeInteraction.CLIC, adresse_ip=_client_ip(request))
        return render(request, "simulation/capture.html", {"scenario": tracking.scenario})

    def post(self, request, tracking_id):
        tracking = get_object_or_404(EnvoiTracking, pk=tracking_id)
        Interaction.objects.create(envoi=tracking, type=TypeInteraction.SOUMISSION, adresse_ip=_client_ip(request))
        return render(request, "simulation/capture.html", {"scenario": tracking.scenario, "soumis": True})


class PixelTrackingView(View):
    """Vue publique servant un pixel de suivi (image 1x1 transparente) et
    enregistrant l'ouverture correspondante."""

    def get(self, request, tracking_id):
        tracking = get_object_or_404(EnvoiTracking, pk=tracking_id)
        Interaction.objects.create(envoi=tracking, type=TypeInteraction.OUVERTURE, adresse_ip=_client_ip(request))
        return HttpResponse(PIXEL_GIF, content_type="image/gif")
