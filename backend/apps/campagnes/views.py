from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from apps.accounts.permissions import IsAdministrateur, IsConsultant

from .models import Campagne, Destinataire
from .serializers import CampagneSerializer, DestinataireSerializer, ScenarioPhishingSerializer

CAN_MANAGE_CAMPAGNE = [IsAuthenticated & (IsConsultant | IsAdministrateur)]


class CampagneViewSet(ModelViewSet):
    queryset = Campagne.objects.all()
    serializer_class = CampagneSerializer
    permission_classes = CAN_MANAGE_CAMPAGNE
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["statut", "departement"]


class DestinataireListCreateView(APIView):
    """GET/POST /api/campagnes/<id>/destinataires/ — liste des destinataires
    d'une campagne (email + département), utilisée par EnvoiCampagneService
    pour sélectionner le bon scénario par département au moment de l'envoi."""

    permission_classes = CAN_MANAGE_CAMPAGNE

    def get(self, request, campagne_id):
        campagne = get_object_or_404(Campagne, pk=campagne_id)
        destinataires = campagne.destinataires.all()
        return Response(DestinataireSerializer(destinataires, many=True).data)

    def post(self, request, campagne_id):
        campagne = get_object_or_404(Campagne, pk=campagne_id)
        serializer = DestinataireSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(campagne=campagne)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ScenarioListView(APIView):
    """GET /api/campagnes/<id>/scenarios/ — liste des scénarios d'une
    campagne, du plus récent au plus ancien. Utilisée notamment pour
    préremplir l'expéditeur affiché de la modale de lancement à partir du
    dernier scénario généré (voir apps.simulation.ConfigurationEnvoi)."""

    permission_classes = CAN_MANAGE_CAMPAGNE

    def get(self, request, campagne_id):
        campagne = get_object_or_404(Campagne, pk=campagne_id)
        scenarios = campagne.scenarios.order_by("-id")
        return Response(ScenarioPhishingSerializer(scenarios, many=True).data)


class DestinataireDetailView(APIView):
    """DELETE /api/campagnes/<id>/destinataires/<destinataire_id>/"""

    permission_classes = CAN_MANAGE_CAMPAGNE

    def delete(self, request, campagne_id, destinataire_id):
        destinataire = get_object_or_404(Destinataire, pk=destinataire_id, campagne_id=campagne_id)
        destinataire.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
