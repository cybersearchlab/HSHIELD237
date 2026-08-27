from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from apps.accounts.models import Role
from apps.accounts.permissions import IsAdministrateur, IsConsultant, IsResponsable

from .models import Campagne, DepartementConfigure, Destinataire
from .serializers import CampagneSerializer, DepartementSerializer, DestinataireSerializer, ScenarioPhishingSerializer
from .services import historique_par_departement, score_campagne, score_par_departement

CAN_MANAGE_CAMPAGNE = [IsAuthenticated & (IsConsultant | IsAdministrateur)]
CAN_VIEW_SCENARIOS = [IsAuthenticated & (IsConsultant | IsAdministrateur | IsResponsable)]
CAN_VIEW_DEPARTEMENTS = [IsAuthenticated & (IsConsultant | IsAdministrateur | IsResponsable)]
CAN_MANAGE_DEPARTEMENTS = [IsAuthenticated & IsAdministrateur]


class DepartementViewSet(ModelViewSet):
    """CRUD du registre des départements de l'entreprise, géré par
    l'administrateur (voir docs/CONTEXTE_PROJET.md, décision du
    2026-08-27) — remplace l'ancienne liste figée de 10 départements.
    Lecture ouverte à tout rôle métier (les formulaires de campagne,
    génération, responsables, templates en ont besoin), écriture réservée
    à l'administrateur."""

    queryset = DepartementConfigure.objects.all()
    serializer_class = DepartementSerializer

    def get_permissions(self):
        permission_classes = CAN_VIEW_DEPARTEMENTS if self.action in ("list", "retrieve") else CAN_MANAGE_DEPARTEMENTS
        return [perm() for perm in permission_classes]

    def destroy(self, request, *args, **kwargs):
        dept = self.get_object()
        # Suppression bloquée si des données existantes référencent encore
        # ce département — évite de laisser des campagnes/destinataires/
        # responsables/templates orphelins avec un code qui ne résout plus
        # à rien de configuré.
        from apps.employes.models import Employe
        from apps.gouvernance.models import ResponsableDepartement
        from apps.templates_departement.models import TemplateDepartement

        references = []
        if Campagne.objects.filter(departement=dept.code).exists():
            references.append("des campagnes")
        if Destinataire.objects.filter(departement=dept.code).exists():
            references.append("des destinataires")
        if ResponsableDepartement.objects.filter(departement=dept.code).exists():
            references.append("un responsable désigné")
        if TemplateDepartement.objects.filter(departement=dept.code).exists():
            references.append("des templates")
        if Employe.objects.filter(departement=dept.code).exists():
            references.append("des employés")
        if references:
            return Response(
                {
                    "detail": (
                        f"Impossible de supprimer « {dept.nom} » : "
                        f"{', '.join(references)} y font encore référence."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)


class CampagneViewSet(ModelViewSet):
    # select_related("consentement") évite une requête par campagne pour
    # exposer consentement_statut/motifs_refus dans CampagneSerializer.
    queryset = Campagne.objects.select_related("consentement").all()
    serializer_class = CampagneSerializer
    permission_classes = CAN_MANAGE_CAMPAGNE
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["statut", "departement"]

    def perform_create(self, serializer):
        campagne = serializer.save()
        # Génère automatiquement la demande de consentement à partir du
        # registre des responsables tenu par l'administrateur — ce n'est
        # plus la personne qui crée la campagne qui saisit elle-même le
        # nom/email du responsable habilité à la valider (voir
        # apps.gouvernance.services.creer_consentement_auto).
        from apps.gouvernance.services import creer_consentement_auto

        creer_consentement_auto(campagne)


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
    dernier scénario généré (voir apps.simulation.ConfigurationEnvoi), et
    par le responsable désigné pour visualiser l'email de phishing avant
    de valider ou refuser son département — voir ConsentementsPage."""

    permission_classes = CAN_VIEW_SCENARIOS

    def get(self, request, campagne_id):
        campagne = get_object_or_404(Campagne, pk=campagne_id)
        if request.user.role == Role.RESPONSABLE:
            consentement = getattr(campagne, "consentement", None)
            if not consentement or consentement.responsable_email.lower() != request.user.email.lower():
                return Response(
                    {"detail": "Vous n'êtes pas le responsable désigné pour cette campagne."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        scenarios = campagne.scenarios.order_by("-date_creation")
        return Response(ScenarioPhishingSerializer(scenarios, many=True).data)


class CampagneScoreView(APIView):
    """GET /api/campagnes/<id>/score/ — taux d'ouverture/clic/soumission/
    signalement et score de vulnérabilité composite (0-100), agrégés sur
    tous les scénarios de la campagne (utile même sans segmentation par
    département, voir jour 10)."""

    permission_classes = CAN_MANAGE_CAMPAGNE

    def get(self, request, campagne_id):
        campagne = get_object_or_404(Campagne, pk=campagne_id)
        return Response(score_campagne(campagne))


class ScoreParDepartementView(APIView):
    """GET /api/campagnes/departements/score/ — agrégation du score de
    vulnérabilité par département, toutes campagnes confondues, pour le
    tableau de bord global."""

    permission_classes = CAN_MANAGE_CAMPAGNE

    def get(self, request):
        return Response(score_par_departement())


class HistoriqueParDepartementView(APIView):
    """GET /api/campagnes/departements/historique/ — historique campagne
    par campagne pour chaque département, avec le score de vulnérabilité
    de chacune, pour visualiser son évolution dans le temps (jour 14).
    Contrairement à ScoreParDepartementView, qui condense tout en un seul
    chiffre global, chaque campagne garde ici son propre point."""

    permission_classes = CAN_MANAGE_CAMPAGNE

    def get(self, request):
        return Response(historique_par_departement())


class DestinataireDetailView(APIView):
    """DELETE /api/campagnes/<id>/destinataires/<destinataire_id>/"""

    permission_classes = CAN_MANAGE_CAMPAGNE

    def delete(self, request, campagne_id, destinataire_id):
        destinataire = get_object_or_404(Destinataire, pk=destinataire_id, campagne_id=campagne_id)
        destinataire.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
