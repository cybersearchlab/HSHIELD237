from rest_framework import serializers

from .models import Campagne, Destinataire, ScenarioPhishing


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
            "departements_cibles",
        ]
        read_only_fields = ["id"]


class DestinataireSerializer(serializers.ModelSerializer):
    departement_display = serializers.CharField(source="get_departement_display", read_only=True)

    class Meta:
        model = Destinataire
        fields = ["id", "campagne", "email", "departement", "departement_display"]
        read_only_fields = ["id", "campagne"]


class CampagneSerializer(serializers.ModelSerializer):
    departement_display = serializers.CharField(source="get_departement_display", read_only=True)
    # Remonte l'état du consentement directement sur la campagne — un refus
    # doit être visible depuis l'onglet Campagnes, pas seulement depuis
    # Consentements (demande explicite de l'utilisateur, 2026-08-27).
    consentement_statut = serializers.SerializerMethodField()
    consentement_statut_display = serializers.SerializerMethodField()
    consentement_motifs_refus_display = serializers.SerializerMethodField()
    consentement_motif_refus_details = serializers.SerializerMethodField()

    class Meta:
        model = Campagne
        fields = [
            "id",
            "departement",
            "departement_display",
            "statut",
            "date_creation",
            "perimetre_valide",
            "consentement_statut",
            "consentement_statut_display",
            "consentement_motifs_refus_display",
            "consentement_motif_refus_details",
        ]
        read_only_fields = ["id", "date_creation"]

    def _consentement(self, obj):
        return getattr(obj, "consentement", None)

    def get_consentement_statut(self, obj):
        consentement = self._consentement(obj)
        return consentement.statut if consentement else None

    def get_consentement_statut_display(self, obj):
        consentement = self._consentement(obj)
        return consentement.get_statut_display() if consentement else None

    def get_consentement_motifs_refus_display(self, obj):
        consentement = self._consentement(obj)
        if not consentement:
            return []
        from apps.gouvernance.models import MotifRefus

        labels = dict(MotifRefus.choices)
        return [labels.get(m, m) for m in consentement.motifs_refus]

    def get_consentement_motif_refus_details(self, obj):
        consentement = self._consentement(obj)
        return consentement.motif_refus_details if consentement else ""
