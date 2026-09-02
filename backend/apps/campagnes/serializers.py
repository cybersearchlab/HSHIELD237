from rest_framework import serializers

from .models import Campagne, DepartementConfigure, Destinataire, ScenarioPhishing
from .services import departement_label


def validate_departement_existe(value):
    if not DepartementConfigure.objects.filter(code=value).exists():
        raise serializers.ValidationError(
            "Département inconnu — configurez-le d'abord dans Départements."
        )
    return value


class DepartementSerializer(serializers.ModelSerializer):
    class Meta:
        model = DepartementConfigure
        fields = ["id", "code", "nom", "date_creation"]
        read_only_fields = ["id", "code", "date_creation"]


class ScenarioPhishingSerializer(serializers.ModelSerializer):
    # Le HTML complet de la page personnalisée n'est volontairement pas
    # exposé ici (peut peser jusqu'à 2 Mo — voir apps.campagnes.validators)
    # : seul un indicateur et sa date sont utiles à la liste des scénarios
    # d'une campagne. Le contenu complet se récupère via
    # GET /api/campagnes/scenarios/<id>/page-capture/ (ScenarioPageCaptureView).
    page_capture_personnalisee = serializers.SerializerMethodField()

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
            "date_creation",
            "departements_cibles",
            "page_capture_personnalisee",
            "page_capture_date_maj",
        ]
        read_only_fields = ["id", "date_creation", "page_capture_personnalisee", "page_capture_date_maj"]

    def get_page_capture_personnalisee(self, obj):
        return bool(obj.page_capture_html)


class PageCaptureUploadSerializer(serializers.Serializer):
    """Accepte soit du HTML collé directement, soit un fichier .html
    importé — jamais les deux à la fois (voir ScenarioPageCaptureView)."""

    html = serializers.CharField(required=False, allow_blank=True)
    fichier = serializers.FileField(required=False)

    def validate(self, data):
        html = data.get("html")
        fichier = data.get("fichier")
        if not html and not fichier:
            raise serializers.ValidationError("Fournissez le code HTML de la page, ou importez un fichier .html.")
        if html and fichier:
            raise serializers.ValidationError("Fournissez soit le code HTML collé, soit un fichier — pas les deux.")
        return data


class DestinataireSerializer(serializers.ModelSerializer):
    departement_display = serializers.SerializerMethodField()

    class Meta:
        model = Destinataire
        fields = ["id", "campagne", "email", "departement", "departement_display"]
        read_only_fields = ["id", "campagne"]

    def get_departement_display(self, obj):
        return departement_label(obj.departement)

    def validate_departement(self, value):
        return validate_departement_existe(value)


class CampagneSerializer(serializers.ModelSerializer):
    departement_display = serializers.SerializerMethodField()
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

    def get_departement_display(self, obj):
        return departement_label(obj.departement)

    def validate_departement(self, value):
        return validate_departement_existe(value)

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
