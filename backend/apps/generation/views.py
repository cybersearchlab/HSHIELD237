from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdministrateur, IsConsultant
from apps.campagnes.serializers import ScenarioPhishingSerializer

from .serializers import GenerationAPIRequestSerializer
from .services import ClaudeGenerationError, ClaudeGenerationService

CAN_GENERATE = [IsAuthenticated & (IsConsultant | IsAdministrateur)]


class GenerationAPIView(APIView):
    """POST /api/generation/api/ — génère un scénario via l'API Claude
    à partir du département ciblé par la campagne."""

    permission_classes = CAN_GENERATE

    def post(self, request):
        request_serializer = GenerationAPIRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)
        campagne = request_serializer.validated_data["campagne"]
        contexte_additionnel = request_serializer.validated_data["contexte_additionnel"]
        template = request_serializer.validated_data.get("template")

        try:
            scenario_data = ClaudeGenerationService().generate(
                departement=campagne.departement,
                contexte_additionnel=contexte_additionnel,
                template=template,
            )
        except ClaudeGenerationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        output_serializer = ScenarioPhishingSerializer(
            data={
                "campagne": campagne.id,
                "expediteur_nom": request_serializer.validated_data["expediteur_nom"],
                "expediteur_email": request_serializer.validated_data["expediteur_email"],
                "destinataire_email": request_serializer.validated_data["destinataire_email"],
                **scenario_data,
            }
        )
        output_serializer.is_valid(raise_exception=True)
        output_serializer.save()

        if template is not None:
            template.nombre_utilisations += 1
            template.save(update_fields=["nombre_utilisations"])

        return Response(output_serializer.data, status=status.HTTP_201_CREATED)


class GenerationManuelView(APIView):
    """POST /api/generation/manuel/ — crée directement un ScenarioPhishing
    à partir d'un contenu rédigé à la main par le consultant. Produit une
    structure strictement identique à celle du mode API, pour rester
    interchangeable avec le reste de l'application."""

    permission_classes = CAN_GENERATE
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        serializer = ScenarioPhishingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
