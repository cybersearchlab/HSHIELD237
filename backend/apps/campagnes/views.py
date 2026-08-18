from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.accounts.permissions import IsAdministrateur, IsConsultant

from .models import Campagne
from .serializers import CampagneSerializer


class CampagneViewSet(ModelViewSet):
    queryset = Campagne.objects.all()
    serializer_class = CampagneSerializer
    permission_classes = [IsAuthenticated & (IsConsultant | IsAdministrateur)]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["statut", "departement"]
