from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.accounts.permissions import IsAdministrateur

from .models import ParametreExterne
from .serializers import ParametreExterneSerializer

# Réservé à l'administrateur, en lecture comme en écriture — les clés
# API/identifiants SMTP ne sont pas une donnée à exposer même en lecture
# aux autres rôles (contrairement à apps.employes/apps.campagnes où la
# lecture est ouverte au consultant).
CAN_MANAGE_PARAMETRES = [IsAuthenticated & IsAdministrateur]


class ParametreExterneViewSet(ModelViewSet):
    queryset = ParametreExterne.objects.all()
    serializer_class = ParametreExterneSerializer
    permission_classes = CAN_MANAGE_PARAMETRES
    # Au plus 8 lignes possibles (voir CLES_CONNUES) — pagination
    # désactivée pour renvoyer une liste plate simple, cohérent avec
    # ResponsableDepartement (motif paired-APIView, jamais paginé).
    pagination_class = None
