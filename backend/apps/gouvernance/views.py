from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Role
from apps.accounts.permissions import IsAdministrateur, IsConsultant, IsResponsable
from apps.campagnes.models import Campagne

from .models import Consentement, JournalAudit, StatutConsentement
from .serializers import ConsentementSerializer, JournalAuditSerializer

CAN_MANAGE_CONSENTEMENT = [IsAuthenticated & (IsConsultant | IsAdministrateur)]
CAN_VALIDER_CONSENTEMENT = [IsAuthenticated & IsResponsable]
CAN_VIEW_CONSENTEMENTS = [IsAuthenticated & (IsConsultant | IsAdministrateur | IsResponsable)]


def enregistrer_audit(action, auteur, details=None):
    return JournalAudit.objects.create(action=action, auteur=auteur, details=details or {})


class ConsentementCampagneView(APIView):
    """GET/POST /api/gouvernance/campagnes/<id>/consentement/ — demande de
    consentement pour une campagne, créée par le consultant, à valider
    ensuite par le responsable désigné."""

    permission_classes = CAN_MANAGE_CONSENTEMENT

    def get(self, request, campagne_id):
        campagne = get_object_or_404(Campagne, pk=campagne_id)
        consentement = getattr(campagne, "consentement", None)
        if consentement is None:
            return Response(None, status=status.HTTP_204_NO_CONTENT)
        return Response(ConsentementSerializer(consentement).data)

    def post(self, request, campagne_id):
        campagne = get_object_or_404(Campagne, pk=campagne_id)
        if hasattr(campagne, "consentement"):
            return Response(
                {"detail": "Une demande de consentement existe déjà pour cette campagne."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = ConsentementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        consentement = serializer.save(campagne=campagne)
        enregistrer_audit(
            "Demande de consentement créée",
            request.user,
            {"campagne": campagne.id, "responsable_email": consentement.responsable_email},
        )
        return Response(ConsentementSerializer(consentement).data, status=status.HTTP_201_CREATED)


class ConsentementListView(APIView):
    """GET /api/gouvernance/consentements/?statut=en_attente — liste
    filtrable par statut, pour la page Consentements. Un consultant ou
    administrateur voit toutes les demandes ; un responsable ne voit que
    celles qui lui sont désignées (son propre email)."""

    permission_classes = CAN_VIEW_CONSENTEMENTS

    def get(self, request):
        queryset = Consentement.objects.select_related("campagne").order_by("-id")
        if request.user.role == Role.RESPONSABLE:
            queryset = queryset.filter(responsable_email__iexact=request.user.email)
        statut = request.query_params.get("statut")
        if statut:
            queryset = queryset.filter(statut=statut)
        return Response(ConsentementSerializer(queryset, many=True).data)


class ConsentementValiderView(APIView):
    """POST /api/gouvernance/consentements/<id>/valider/ — réservé au
    responsable désigné (email correspondant), authentifié avec le rôle
    Responsable. C'est cette validation, faite depuis l'application, qui
    autorise le lancement de la campagne."""

    permission_classes = CAN_VALIDER_CONSENTEMENT

    def post(self, request, consentement_id):
        consentement = get_object_or_404(Consentement, pk=consentement_id)
        if request.user.email.lower() != consentement.responsable_email.lower():
            return Response(
                {"detail": "Seul le responsable désigné pour cette campagne peut la valider."},
                status=status.HTTP_403_FORBIDDEN,
            )
        consentement.statut = StatutConsentement.VALIDE
        consentement.date_validation = timezone.now()
        consentement.save(update_fields=["statut", "date_validation"])
        consentement.campagne.perimetre_valide = True
        consentement.campagne.save(update_fields=["perimetre_valide"])
        enregistrer_audit(
            "Consentement validé",
            request.user,
            {"campagne": consentement.campagne_id, "consentement": consentement.id},
        )
        return Response(ConsentementSerializer(consentement).data)


class ConsentementRefuserView(APIView):
    """POST /api/gouvernance/consentements/<id>/refuser/"""

    permission_classes = CAN_VALIDER_CONSENTEMENT

    def post(self, request, consentement_id):
        consentement = get_object_or_404(Consentement, pk=consentement_id)
        if request.user.email.lower() != consentement.responsable_email.lower():
            return Response(
                {"detail": "Seul le responsable désigné pour cette campagne peut la refuser."},
                status=status.HTTP_403_FORBIDDEN,
            )
        consentement.statut = StatutConsentement.REFUSE
        consentement.date_validation = timezone.now()
        consentement.save(update_fields=["statut", "date_validation"])
        enregistrer_audit(
            "Consentement refusé",
            request.user,
            {"campagne": consentement.campagne_id, "consentement": consentement.id},
        )
        return Response(ConsentementSerializer(consentement).data)


class JournalAuditListView(APIView):
    """GET /api/gouvernance/journal-audit/ — lecture seule, réservée aux
    administrateurs."""

    permission_classes = [IsAuthenticated & IsAdministrateur]

    def get(self, request):
        entries = JournalAudit.objects.select_related("auteur").order_by("-horodatage")[:200]
        return Response(JournalAuditSerializer(entries, many=True).data)
