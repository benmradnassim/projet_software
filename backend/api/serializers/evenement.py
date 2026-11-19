from rest_framework import serializers

from api.models import Evenement

class EvenementSerializer(serializers.ModelSerializer):
    organisateur_nom = serializers.CharField(source="organisateur.nom_complet", read_only=True)

    class Meta:
        model = Evenement
        fields = "__all__"
        read_only_fields = ["id", "organisateur"]
