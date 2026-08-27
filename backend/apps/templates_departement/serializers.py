from rest_framework import serializers

from apps.campagnes.models import DepartementConfigure
from apps.campagnes.services import departement_label

from .models import TemplateDepartement


class TemplateDepartementSerializer(serializers.ModelSerializer):
    departement_display = serializers.SerializerMethodField()

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

    def get_departement_display(self, obj):
        return departement_label(obj.departement)

    def validate_departement(self, value):
        if not DepartementConfigure.objects.filter(code=value).exists():
            raise serializers.ValidationError(
                "Département inconnu — configurez-le d'abord dans Départements."
            )
        return value
