from rest_framework import serializers

from .models import Consentement, JournalAudit


class ConsentementSerializer(serializers.ModelSerializer):
    statut_display = serializers.CharField(source="get_statut_display", read_only=True)
    campagne_departement_display = serializers.CharField(
        source="campagne.get_departement_display", read_only=True
    )

    class Meta:
        model = Consentement
        fields = [
            "id",
            "campagne",
            "campagne_departement_display",
            "responsable_nom",
            "responsable_email",
            "statut",
            "statut_display",
            "date_validation",
        ]
        read_only_fields = ["id", "campagne", "statut", "date_validation"]


class JournalAuditSerializer(serializers.ModelSerializer):
    auteur_email = serializers.CharField(source="auteur.email", read_only=True, default="")

    class Meta:
        model = JournalAudit
        fields = ["id", "action", "auteur", "auteur_email", "horodatage", "details"]
        read_only_fields = fields
