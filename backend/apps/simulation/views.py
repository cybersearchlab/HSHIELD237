from django.shortcuts import get_object_or_404, render
from django.views import View
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdministrateur, IsConsultant
from apps.campagnes.models import Campagne

from .models import ConfigurationEnvoi, EnvoiTracking
from .serializers import (
    ConfigurationEnvoiSerializer,
    EnvoiTrackingSerializer,
    EnvoyerCampagneRequestSerializer,
)
from .services import EnvoiCampagneError, EnvoiCampagneService

CAN_MANAGE_ENVOI = [IsAuthenticated & (IsConsultant | IsAdministrateur)]


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
    """POST /api/simulation/campagnes/<id>/envoyer/ — envoie chaque scénario
    de la campagne aux destinataires fournis, ou à défaut à l'email de test
    de chaque scénario."""

    permission_classes = CAN_MANAGE_ENVOI

    def post(self, request, campagne_id):
        campagne = get_object_or_404(Campagne, pk=campagne_id)
        request_serializer = EnvoyerCampagneRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)
        destinataires = request_serializer.validated_data.get("destinataires") or None

        try:
            trackings = EnvoiCampagneService(campagne).envoyer_campagne(destinataires)
        except EnvoiCampagneError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(EnvoiTrackingSerializer(trackings, many=True).data, status=status.HTTP_201_CREATED)


class CapturePageView(View):
    """Vue publique (aucune authentification) servant la fausse page de
    capture. L'identifiant de tracking dans l'URL (UUID) identifie de façon
    unique le destinataire et le scénario concernés."""

    def get(self, request, tracking_id):
        tracking = get_object_or_404(EnvoiTracking, pk=tracking_id)
        return render(request, "simulation/capture.html", {"scenario": tracking.scenario})
