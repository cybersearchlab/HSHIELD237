from rest_framework import serializers

from .models import Entreprise


class EntrepriseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Entreprise
        fields = [
            "id",
            "nom",
            "secteur",
            "taille",
            "contexte_additionnel",
            "contact_nom",
            "contact_email",
            "date_creation",
        ]
        read_only_fields = ["id", "date_creation"]
