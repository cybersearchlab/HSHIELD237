from rest_framework import serializers

from .models import Campagne


class CampagneSerializer(serializers.ModelSerializer):
    departement_display = serializers.CharField(source="get_departement_display", read_only=True)

    class Meta:
        model = Campagne
        fields = [
            "id",
            "departement",
            "departement_display",
            "statut",
            "date_creation",
            "perimetre_valide",
        ]
        read_only_fields = ["id", "date_creation"]
