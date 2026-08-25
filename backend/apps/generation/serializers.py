from rest_framework import serializers

from apps.campagnes.models import Campagne
from apps.templates_departement.models import TemplateDepartement


class GenerationAPIRequestSerializer(serializers.Serializer):
    campagne = serializers.PrimaryKeyRelatedField(queryset=Campagne.objects.all())
    contexte_additionnel = serializers.CharField(required=False, allow_blank=True, default="")
    expediteur_nom = serializers.CharField(required=False, allow_blank=True, default="")
    expediteur_email = serializers.CharField(required=False, allow_blank=True, default="")
    destinataire_email = serializers.CharField(required=False, allow_blank=True, default="")
    template = serializers.PrimaryKeyRelatedField(
        queryset=TemplateDepartement.objects.all(), required=False, allow_null=True, default=None
    )
