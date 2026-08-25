from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdministrateur, IsConsultant
from apps.campagnes.models import Campagne

from .services import GenerationRapportService

CAN_GENERATE_RAPPORT = [IsAuthenticated & (IsConsultant | IsAdministrateur)]


class RapportCampagneView(APIView):
    """GET /api/campagnes/<id>/rapport/ — génère et retourne à la demande un
    rapport PDF (score de vulnérabilité, taux détaillés, recommandations)."""

    permission_classes = CAN_GENERATE_RAPPORT

    def get(self, request, campagne_id):
        campagne = get_object_or_404(Campagne, pk=campagne_id)
        pdf_bytes = GenerationRapportService(campagne).generer_pdf()
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="rapport-campagne-{campagne.id}.pdf"'
        return response
