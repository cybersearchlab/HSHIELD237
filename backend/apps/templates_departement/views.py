from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.accounts.permissions import IsAdministrateur, IsConsultant

from .models import TemplateDepartement
from .serializers import TemplateDepartementSerializer

CAN_MANAGE_TEMPLATES = [IsAuthenticated & (IsConsultant | IsAdministrateur)]


class TemplateDepartementViewSet(ModelViewSet):
    queryset = TemplateDepartement.objects.all()
    serializer_class = TemplateDepartementSerializer
    permission_classes = CAN_MANAGE_TEMPLATES
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["departement"]
