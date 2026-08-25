from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Role
from apps.accounts.permissions import IsAdministrateur, IsConsultant, IsResponsable
from apps.campagnes.models import Campagne

from .models import Consentement, JournalAudit, MotifRefus, ResponsableDepartement, StatutConsentement
from .serializers import ConsentementSerializer, JournalAuditSerializer, ResponsableDepartementSerializer
from .services import creer_consentement_auto

CAN_VIEW_CONSENTEMENT = [IsAuthenticated & (IsConsultant | IsAdministrateur)]
CAN_TRIGGER_CONSENTEMENT = [IsAuthenticated & IsAdministrateur]
CAN_VALIDER_CONSENTEMENT = [IsAuthenticated & IsResponsable]
CAN_VIEW_CONSENTEMENTS = [IsAuthenticated & (IsConsultant | IsAdministrateur | IsResponsable)]
CAN_MANAGE_RESPONSABLES = [IsAuthenticated & IsAdministrateur]


def enregistrer_audit(action, auteur, details=None):
    return JournalAudit.objects.create(action=action, auteur=auteur, details=details or {})


class ConsentementCampagneView(APIView):
    """GET /api/gouvernance/campagnes/<id>/consentement/ — consultable par
    le consultant ou l'administrateur.

    POST — réservé à l'administrateur : génère manuellement la demande de
    consentement d'une campagne dont le département n'avait pas encore de
    responsable configuré au moment de sa création (voir
    ResponsableDepartement). Le nom/email du responsable ne sont jamais
    acceptés depuis le corps de la requête — toujours dérivés du registre,
    par souci de sécurité : ce n'est plus la personne qui crée la
    campagne qui désigne elle-même le responsable chargé de la valider."""

    def get_permissions(self):
        classes = CAN_TRIGGER_CONSENTEMENT if self.request.method == "POST" else CAN_VIEW_CONSENTEMENT
        return [perm() for perm in classes]

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
        if not ResponsableDepartement.objects.filter(departement=campagne.departement).exists():
            return Response(
                {
                    "detail": "Aucun responsable n'est configuré pour ce département. "
                    "Configurez-le d'abord dans Responsables."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        consentement = creer_consentement_auto(campagne)
        enregistrer_audit(
            "Demande de consentement générée",
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
    """POST /api/gouvernance/consentements/<id>/refuser/ — un refus doit
    être justifié : au moins un motif coché parmi une liste prédéfinie,
    ou un motif texte libre si « Autre » est sélectionné."""

    permission_classes = CAN_VALIDER_CONSENTEMENT

    def post(self, request, consentement_id):
        consentement = get_object_or_404(Consentement, pk=consentement_id)
        if request.user.email.lower() != consentement.responsable_email.lower():
            return Response(
                {"detail": "Seul le responsable désigné pour cette campagne peut la refuser."},
                status=status.HTTP_403_FORBIDDEN,
            )
        motifs = request.data.get("motifs") or []
        details = (request.data.get("details") or "").strip()
        motifs_valides = {choice for choice, _ in MotifRefus.choices}
        motifs = [m for m in motifs if m in motifs_valides]
        if not motifs:
            return Response(
                {"detail": "Sélectionnez au moins un motif de refus."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if MotifRefus.AUTRE in motifs and not details:
            return Response(
                {"detail": "Précisez le motif dans le champ de texte pour « Autre »."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        consentement.statut = StatutConsentement.REFUSE
        consentement.date_validation = timezone.now()
        consentement.motifs_refus = motifs
        consentement.motif_refus_details = details
        consentement.save(
            update_fields=["statut", "date_validation", "motifs_refus", "motif_refus_details"]
        )
        enregistrer_audit(
            "Consentement refusé",
            request.user,
            {
                "campagne": consentement.campagne_id,
                "consentement": consentement.id,
                "motifs": motifs,
                "details": details,
            },
        )
        return Response(ConsentementSerializer(consentement).data)


class JournalAuditListView(APIView):
    """GET /api/gouvernance/journal-audit/ — lecture seule, réservée aux
    administrateurs."""

    permission_classes = [IsAuthenticated & IsAdministrateur]

    def get(self, request):
        entries = JournalAudit.objects.select_related("auteur").order_by("-horodatage")[:200]
        return Response(JournalAuditSerializer(entries, many=True).data)


class ResponsableDepartementListCreateView(APIView):
    """GET/POST /api/gouvernance/responsables/ — registre des responsables
    par département, géré exclusivement par l'administrateur. Un seul
    responsable par département (contrainte d'unicité en base)."""

    permission_classes = CAN_MANAGE_RESPONSABLES

    def get(self, request):
        responsables = ResponsableDepartement.objects.order_by("departement")
        return Response(ResponsableDepartementSerializer(responsables, many=True).data)

    def post(self, request):
        if ResponsableDepartement.objects.filter(departement=request.data.get("departement")).exists():
            return Response(
                {"detail": "Un responsable est déjà configuré pour ce département — modifiez-le plutôt."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = ResponsableDepartementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        responsable = serializer.save()
        enregistrer_audit(
            "Responsable de département configuré",
            request.user,
            {"departement": responsable.departement, "email": responsable.email},
        )
        return Response(ResponsableDepartementSerializer(responsable).data, status=status.HTTP_201_CREATED)


class ResponsableDepartementDetailView(APIView):
    """PATCH/DELETE /api/gouvernance/responsables/<id>/"""

    permission_classes = CAN_MANAGE_RESPONSABLES

    def patch(self, request, responsable_id):
        responsable = get_object_or_404(ResponsableDepartement, pk=responsable_id)
        serializer = ResponsableDepartementSerializer(responsable, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        enregistrer_audit(
            "Responsable de département modifié",
            request.user,
            {"departement": responsable.departement, "email": responsable.email},
        )
        return Response(ResponsableDepartementSerializer(responsable).data)

    def delete(self, request, responsable_id):
        responsable = get_object_or_404(ResponsableDepartement, pk=responsable_id)
        enregistrer_audit(
            "Responsable de département retiré",
            request.user,
            {"departement": responsable.departement, "email": responsable.email},
        )
        responsable.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
