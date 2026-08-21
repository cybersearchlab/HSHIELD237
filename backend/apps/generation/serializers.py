from rest_framework import serializers

from apps.campagnes.models import Campagne


class GenerationAPIRequestSerializer(serializers.Serializer):
    campagne = serializers.PrimaryKeyRelatedField(queryset=Campagne.objects.all())
    contexte_additionnel = serializers.CharField(required=False, allow_blank=True, default="")
    expediteur_nom = serializers.CharField(required=False, allow_blank=True, default="")
    expediteur_email = serializers.CharField(required=False, allow_blank=True, default="")
    destinataire_email = serializers.CharField(required=False, allow_blank=True, default="")
