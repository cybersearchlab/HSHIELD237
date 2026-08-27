from rest_framework import serializers

from .models import ConfigurationEnvoi, EnvoiTracking


class ConfigurationEnvoiSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfigurationEnvoi
        fields = [
            "id",
            "campagne",
            "expediteur_nom",
            "expediteur_email",
            "reply_to",
            "delai_entre_envois",
        ]
        read_only_fields = ["id", "campagne"]


class EnvoiTrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = EnvoiTracking
        fields = ["id", "scenario", "destinataire_email", "date_envoi"]
        read_only_fields = fields


class EnvoyerCampagneRequestSerializer(serializers.Serializer):
    # "cible" pilote l'envoi individuel à l'annuaire des employés
    # (apps.employes) — "tous" (département de la campagne) ou
    # "un_employe" (employe_id requis). Laissé vide, le comportement
    # historique est conservé (destinataires explicites, ou email de test
    # de chaque scénario à défaut) pour ne rien casser.
    cible = serializers.ChoiceField(choices=["tous", "un_employe"], required=False, allow_null=True, default=None)
    employe_id = serializers.IntegerField(required=False, allow_null=True, default=None)
    destinataires = serializers.ListField(child=serializers.EmailField(), required=False, allow_empty=True)

    def validate(self, data):
        if data.get("cible") == "un_employe" and not data.get("employe_id"):
            raise serializers.ValidationError(
                {"employe_id": "Sélectionnez un employé."}
            )
        return data
