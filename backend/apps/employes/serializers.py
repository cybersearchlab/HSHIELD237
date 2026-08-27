from rest_framework import serializers

from apps.campagnes.models import DepartementConfigure
from apps.campagnes.services import departement_label

from .models import Employe


class EmployeSerializer(serializers.ModelSerializer):
    departement_display = serializers.SerializerMethodField()

    class Meta:
        model = Employe
        fields = ["id", "nom", "email", "departement", "departement_display", "date_creation"]
        read_only_fields = ["id", "date_creation"]

    def get_departement_display(self, obj):
        return departement_label(obj.departement)

    def validate_departement(self, value):
        if not DepartementConfigure.objects.filter(code=value).exists():
            raise serializers.ValidationError(
                "Département inconnu — configurez-le d'abord dans Départements."
            )
        return value
