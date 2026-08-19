from rest_framework import serializers

from .models import Campagne, ScenarioPhishing


class ScenarioPhishingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScenarioPhishing
        fields = [
            "id",
            "campagne",
            "objet_email",
            "corps_email",
            "url_fausse_page",
            "secteur_cible",
            "piece_jointe",
            "expediteur_nom",
            "expediteur_email",
            "destinataire_email",
            "est_html",
        ]
        read_only_fields = ["id"]


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
