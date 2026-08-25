from rest_framework import serializers

from .models import TemplateDepartement


class TemplateDepartementSerializer(serializers.ModelSerializer):
    departement_display = serializers.CharField(source="get_departement_display", read_only=True)

    class Meta:
        model = TemplateDepartement
        fields = [
            "id",
            "nom",
            "departement",
            "departement_display",
            "prompt_structure",
            "nombre_utilisations",
            "date_creation",
        ]
        read_only_fields = ["id", "nombre_utilisations", "date_creation"]
