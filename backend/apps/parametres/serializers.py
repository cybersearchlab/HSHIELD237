from rest_framework import serializers

from .models import ParametreExterne


class ParametreExterneSerializer(serializers.ModelSerializer):
    # `valeur` : write-only, jamais renvoyée telle quelle par l'API.
    # `valeur_affichee` : masquée pour les clés secrètes (4 derniers
    # caractères visibles), en clair sinon (ex. ANTHROPIC_MODEL, un nom
    # de modèle n'a rien de sensible).
    valeur = serializers.CharField(write_only=True, required=False, allow_blank=True)
    valeur_affichee = serializers.SerializerMethodField()
    est_secret = serializers.BooleanField(read_only=True)

    class Meta:
        model = ParametreExterne
        fields = ["id", "cle", "valeur", "valeur_affichee", "est_secret", "date_maj"]
        read_only_fields = ["id", "date_maj"]

    def get_valeur_affichee(self, obj):
        if obj.est_secret:
            return obj.valeur_masquee()
        try:
            return obj.get_valeur()
        except Exception:
            return ""

    def create(self, validated_data):
        valeur = validated_data.pop("valeur", "")
        instance = ParametreExterne(cle=validated_data["cle"])
        instance.set_valeur(valeur)
        instance.save()
        return instance

    def update(self, instance, validated_data):
        valeur = validated_data.pop("valeur", None)
        if valeur is not None:
            instance.set_valeur(valeur)
        instance.save()
        return instance
