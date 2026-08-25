from rest_framework import serializers

from .models import Consentement, JournalAudit, MotifRefus, ResponsableDepartement


class ResponsableDepartementSerializer(serializers.ModelSerializer):
    departement_display = serializers.CharField(source="get_departement_display", read_only=True)

    class Meta:
        model = ResponsableDepartement
        fields = ["id", "departement", "departement_display", "nom", "email", "date_maj"]
        read_only_fields = ["id", "date_maj"]


class ConsentementSerializer(serializers.ModelSerializer):
    statut_display = serializers.CharField(source="get_statut_display", read_only=True)
    campagne_departement_display = serializers.CharField(
        source="campagne.get_departement_display", read_only=True
    )
    motifs_refus_display = serializers.SerializerMethodField()

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
            "motifs_refus",
            "motifs_refus_display",
            "motif_refus_details",
        ]
        # responsable_nom/responsable_email ne sont plus jamais saisis par le
        # client : ils sont renseignés côté serveur depuis
        # ResponsableDepartement (voir services.creer_consentement_auto).
        read_only_fields = [
            "id",
            "campagne",
            "responsable_nom",
            "responsable_email",
            "statut",
            "date_validation",
            "motifs_refus",
            "motif_refus_details",
        ]

    def get_motifs_refus_display(self, obj):
        labels = dict(MotifRefus.choices)
        return [labels.get(m, m) for m in obj.motifs_refus]


class JournalAuditSerializer(serializers.ModelSerializer):
    auteur_email = serializers.CharField(source="auteur.email", read_only=True, default="")

    class Meta:
        model = JournalAudit
        fields = ["id", "action", "auteur", "auteur_email", "horodatage", "details"]
        read_only_fields = fields
