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
    destinataires = serializers.ListField(child=serializers.EmailField(), required=False, allow_empty=True)
