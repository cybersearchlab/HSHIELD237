from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.accounts.permissions import IsAdministrateur, IsConsultant

from .models import Entreprise
from .serializers import EntrepriseSerializer


class EntrepriseViewSet(ModelViewSet):
    queryset = Entreprise.objects.all()
    serializer_class = EntrepriseSerializer
    permission_classes = [IsAuthenticated & (IsConsultant | IsAdministrateur)]
