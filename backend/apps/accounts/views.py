from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from apps.gouvernance.views import enregistrer_audit

from .authentication import jeton_perime_par_changement_mot_de_passe
from .models import DemandeReinitialisation, StatutDemande, Utilisateur
from .notifications import (
    envoyer_mot_de_passe_temporaire,
    generer_mot_de_passe_temporaire,
    notifier_administrateurs,
)
from .permissions import IsAdministrateur
from .serializers import (
    ChangerRoleSerializer,
    CreerUtilisateurSerializer,
    DemandeReinitialisationSerializer,
    MotDePasseOublieSerializer,
    ProfilSerializer,
    UtilisateurSerializer,
)

CAN_MANAGE_UTILISATEURS = [IsAuthenticated & IsAdministrateur]


class MeView(RetrieveUpdateAPIView):
    """GET /api/auth/me/ — profil complet de l'utilisateur connecté.
    PATCH /api/auth/me/ — met à jour son propre nom/email uniquement
    (voir ProfilSerializer) ; la réponse renvoie tout de même le profil
    complet (UtilisateurSerializer), pas seulement les champs modifiés."""

    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return ProfilSerializer
        return UtilisateurSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UtilisateurSerializer(instance).data)


class ChangerMotDePasseView(APIView):
    """POST /api/auth/mot-de-passe/ — changement de mot de passe par
    l'utilisateur connecté lui-même. Exige l'ancien mot de passe. Les
    jetons JWT (access et refresh) déjà émis avant ce changement sont
    invalidés immédiatement — voir apps.accounts.authentication, qui
    compare leur date d'émission à `date_changement_mot_de_passe`
    plutôt que de nécessiter une liste de révocation en base."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        ancien = request.data.get("ancien_mot_de_passe", "")
        nouveau = request.data.get("nouveau_mot_de_passe", "")
        user = request.user

        if not user.check_password(ancien):
            return Response(
                {"ancien_mot_de_passe": ["L'ancien mot de passe est incorrect."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            validate_password(nouveau, user=user)
        except DjangoValidationError as exc:
            return Response({"nouveau_mot_de_passe": exc.messages}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(nouveau)
        user.date_changement_mot_de_passe = timezone.now()
        user.save(update_fields=["password", "date_changement_mot_de_passe"])
        return Response({"detail": "Mot de passe mis à jour. Vos connexions sur d'autres appareils devront se reconnecter."})


class UtilisateurListCreateView(APIView):
    """GET /api/accounts/utilisateurs/ — liste tous les comptes
    (administrateur uniquement — gestion de l'équipe, Paramètres).
    POST /api/accounts/utilisateurs/ — crée un compte avec un rôle
    (consultant/responsable/administrateur). Aucun mot de passe n'est
    demandé à l'administrateur : un mot de passe temporaire est généré
    et envoyé par email au titulaire du compte, jamais connu de la
    personne qui crée le compte."""

    permission_classes = CAN_MANAGE_UTILISATEURS

    def get(self, request):
        utilisateurs = Utilisateur.objects.all().order_by("email")
        return Response(UtilisateurSerializer(utilisateurs, many=True).data)

    def post(self, request):
        serializer = CreerUtilisateurSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        mot_de_passe = generer_mot_de_passe_temporaire()
        utilisateur = Utilisateur.objects.create_user(
            username=email,
            email=email,
            first_name=serializer.validated_data.get("first_name", ""),
            last_name=serializer.validated_data.get("last_name", ""),
            role=serializer.validated_data["role"],
            password=mot_de_passe,
        )
        enregistrer_audit(
            "creation_utilisateur",
            request.user,
            {"utilisateur_id": utilisateur.id, "email": email, "role": utilisateur.role},
        )
        try:
            envoyer_mot_de_passe_temporaire(utilisateur, mot_de_passe, cree=True)
            email_envoye = True
        except Exception:
            email_envoye = False

        data = UtilisateurSerializer(utilisateur).data
        data["email_envoye"] = email_envoye
        return Response(data, status=status.HTTP_201_CREATED)


class UtilisateurRoleView(APIView):
    """PATCH /api/accounts/utilisateurs/<id>/role/ — change uniquement
    le rôle d'un compte existant (administrateur uniquement)."""

    permission_classes = CAN_MANAGE_UTILISATEURS

    def patch(self, request, utilisateur_id):
        utilisateur = get_object_or_404(Utilisateur, pk=utilisateur_id)
        serializer = ChangerRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ancien_role = utilisateur.role
        utilisateur.role = serializer.validated_data["role"]
        utilisateur.save(update_fields=["role"])
        enregistrer_audit(
            "changement_role_utilisateur",
            request.user,
            {
                "utilisateur_id": utilisateur.id,
                "email": utilisateur.email,
                "ancien_role": ancien_role,
                "nouveau_role": utilisateur.role,
            },
        )
        return Response(UtilisateurSerializer(utilisateur).data)


def _reinitialiser(utilisateur, admin, action, details_extra=None):
    """Génère un nouveau mot de passe temporaire, l'applique, l'envoie
    par email au titulaire du compte, et journalise — cœur commun à la
    réinitialisation directe par l'administrateur et au traitement d'une
    demande. Retourne True si l'email a bien pu être envoyé."""
    mot_de_passe = generer_mot_de_passe_temporaire()
    utilisateur.set_password(mot_de_passe)
    utilisateur.date_changement_mot_de_passe = timezone.now()
    utilisateur.save(update_fields=["password", "date_changement_mot_de_passe"])
    enregistrer_audit(action, admin, {"utilisateur_id": utilisateur.id, "email": utilisateur.email, **(details_extra or {})})
    try:
        envoyer_mot_de_passe_temporaire(utilisateur, mot_de_passe, cree=False)
        return True
    except Exception:
        return False


class MotDePasseOublieView(APIView):
    """POST /api/auth/mot-de-passe-oublie/ — endpoint public (sans
    authentification), déclenché par les liens « Mot de passe oublié ? »
    et « Contacter l'administrateur » de la page de connexion. Aucun
    lien de réinitialisation n'est envoyé à l'utilisateur : la demande
    est enregistrée et l'administrateur est notifié par email, à lui de
    déclencher la réinitialisation depuis Paramètres > Équipe. Réponse
    toujours identique, qu'un compte existe ou non pour cet email — ne
    jamais révéler côté client si une adresse est enregistrée."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = MotDePasseOublieSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        utilisateur = Utilisateur.objects.filter(email__iexact=email).first()
        demande = DemandeReinitialisation.objects.create(email_saisi=email, utilisateur=utilisateur)
        try:
            notifier_administrateurs(demande)
        except Exception:
            pass

        return Response(
            {
                "detail": (
                    "Si cette adresse correspond à un compte, l'administrateur a été "
                    "notifié et vous contactera pour réinitialiser votre mot de passe."
                )
            }
        )


class DemandeReinitialisationListView(APIView):
    """GET /api/accounts/demandes-reinitialisation/ — liste des demandes
    (administrateur uniquement), les plus récentes d'abord."""

    permission_classes = CAN_MANAGE_UTILISATEURS

    def get(self, request):
        demandes = DemandeReinitialisation.objects.select_related("utilisateur", "traite_par").all()
        return Response(DemandeReinitialisationSerializer(demandes, many=True).data)


class DemandeReinitialisationTraiterView(APIView):
    """POST /api/accounts/demandes-reinitialisation/<id>/traiter/ —
    traite une demande : génère et envoie un nouveau mot de passe au
    titulaire du compte associé, marque la demande traitée."""

    permission_classes = CAN_MANAGE_UTILISATEURS

    def post(self, request, demande_id):
        demande = get_object_or_404(DemandeReinitialisation, pk=demande_id)
        if demande.utilisateur_id is None:
            return Response(
                {"detail": "Cette demande ne correspond à aucun compte connu — rien à réinitialiser."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if demande.statut == StatutDemande.TRAITEE:
            return Response({"detail": "Cette demande a déjà été traitée."}, status=status.HTTP_400_BAD_REQUEST)

        email_envoye = _reinitialiser(
            demande.utilisateur, request.user, "traitement_demande_reinitialisation", {"demande_id": demande.id}
        )
        demande.statut = StatutDemande.TRAITEE
        demande.date_traitement = timezone.now()
        demande.traite_par = request.user
        demande.save(update_fields=["statut", "date_traitement", "traite_par"])

        data = DemandeReinitialisationSerializer(demande).data
        data["email_envoye"] = email_envoye
        return Response(data)


class UtilisateurReinitialiserMotDePasseView(APIView):
    """POST /api/accounts/utilisateurs/<id>/reinitialiser-mot-de-passe/ —
    réinitialisation directe par l'administrateur, sans demande
    préalable (« réinitialiser le mot de passe de n'importe qui »)."""

    permission_classes = CAN_MANAGE_UTILISATEURS

    def post(self, request, utilisateur_id):
        utilisateur = get_object_or_404(Utilisateur, pk=utilisateur_id)
        email_envoye = _reinitialiser(utilisateur, request.user, "reinitialisation_directe_admin")
        return Response({"detail": "Mot de passe réinitialisé.", "email_envoye": email_envoye})


class TokenRefreshViewAvecInvalidation(TokenRefreshView):
    """POST /api/auth/refresh/ — refuse de délivrer un nouvel access
    token à partir d'un refresh token émis avant le dernier changement
    de mot de passe de son titulaire (sinon, un jeton renouvelé après
    coup porterait un `iat` récent et échapperait à la vérification
    faite par JWTAuthenticationAvecInvalidation sur les requêtes
    suivantes — voir apps.accounts.authentication)."""

    def post(self, request, *args, **kwargs):
        refresh_str = request.data.get("refresh")
        if refresh_str:
            try:
                refresh_token = RefreshToken(refresh_str)
            except Exception:
                # Jeton illisible/invalide : laisser TokenRefreshView produire
                # sa propre erreur standard plutôt que d'en fabriquer une ici.
                refresh_token = None
            if refresh_token is not None:
                utilisateur = Utilisateur.objects.filter(pk=refresh_token.get("user_id")).first()
                if utilisateur and jeton_perime_par_changement_mot_de_passe(utilisateur, refresh_token):
                    raise AuthenticationFailed(
                        "Ce jeton a été émis avant le dernier changement de mot de passe — reconnectez-vous.",
                        code="token_not_valid",
                    )
        return super().post(request, *args, **kwargs)
