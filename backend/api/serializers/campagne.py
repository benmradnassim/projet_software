from rest_framework import serializers

from api.models import Campagne

class CampagneSerializer(serializers.ModelSerializer):
    organisateur_nom = serializers.CharField(source="organisateur.nom_complet", read_only=True)

    class Meta:
        model = Campagne
        fields = "__all__"
        read_only_fields = ["id", "organisateur", "montant_collecte", "cree_le", "modifie_le"]
