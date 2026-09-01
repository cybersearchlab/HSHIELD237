from rest_framework import serializers

from .models import DemandeReinitialisation, Role, Utilisateur

# Rôles qu'un administrateur peut attribuer depuis Paramètres > Équipe —
# demande explicite de l'utilisateur : "employe" n'en fait pas partie
# (rôle historique, voir docs/CONTEXTE_PROJET.md, non touché ici).
ROLES_ATTRIBUABLES = [Role.CONSULTANT, Role.RESPONSABLE, Role.ADMINISTRATEUR]
_ROLE_CHOICES_ATTRIBUABLES = [(r.value, r.label) for r in ROLES_ATTRIBUABLES]


class UtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_staff",
            "is_superuser",
        ]
        read_only_fields = fields


class ProfilSerializer(serializers.ModelSerializer):
    """Mise à jour de son propre profil — volontairement restreint à
    l'identité (nom, email) : `role`/`is_staff`/`is_superuser` n'existent
    même pas dans ce serializer, un utilisateur ne peut jamais se
    promouvoir lui-même (voir UtilisateurRoleView, réservée à
    l'administrateur, pour tout changement de rôle)."""

    class Meta:
        model = Utilisateur
        fields = ["first_name", "last_name", "email"]


class CreerUtilisateurSerializer(serializers.ModelSerializer):
    """Création d'un compte par l'administrateur — jamais de mot de
    passe en entrée : un mot de passe temporaire est généré et envoyé
    automatiquement (voir notifications.envoyer_mot_de_passe_temporaire),
    l'administrateur ne le choisit ni ne le connaît."""

    role = serializers.ChoiceField(choices=_ROLE_CHOICES_ATTRIBUABLES)

    class Meta:
        model = Utilisateur
        fields = ["first_name", "last_name", "email", "role"]


class ChangerRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=_ROLE_CHOICES_ATTRIBUABLES)


class MotDePasseOublieSerializer(serializers.Serializer):
    email = serializers.EmailField()


class DemandeReinitialisationSerializer(serializers.ModelSerializer):
    statut_display = serializers.CharField(source="get_statut_display", read_only=True)
    utilisateur_email = serializers.CharField(source="utilisateur.email", read_only=True, default=None)
    traite_par_email = serializers.CharField(source="traite_par.email", read_only=True, default=None)

    class Meta:
        model = DemandeReinitialisation
        fields = [
            "id",
            "email_saisi",
            "utilisateur",
            "utilisateur_email",
            "statut",
            "statut_display",
            "date_demande",
            "date_traitement",
            "traite_par",
            "traite_par_email",
        ]
        read_only_fields = fields
