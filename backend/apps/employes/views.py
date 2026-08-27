from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.accounts.permissions import IsAdministrateur, IsConsultant

from .models import Employe
from .serializers import EmployeSerializer

# Lecture ouverte au consultant : il en a besoin pour choisir un
# destinataire au lancement d'une campagne (voir CampagnesPage.jsx).
# Écriture (créer/modifier/supprimer l'annuaire) réservée à
# l'administrateur, comme le registre des responsables et des
# départements.
CAN_VIEW_EMPLOYES = [IsAuthenticated & (IsConsultant | IsAdministrateur)]
CAN_MANAGE_EMPLOYES = [IsAuthenticated & IsAdministrateur]


class EmployeViewSet(ModelViewSet):
    queryset = Employe.objects.all()
    serializer_class = EmployeSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["departement"]

    def get_permissions(self):
        permission_classes = CAN_VIEW_EMPLOYES if self.action in ("list", "retrieve") else CAN_MANAGE_EMPLOYES
        return [perm() for perm in permission_classes]
