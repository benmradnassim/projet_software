from rest_framework import serializers

from api.models import Don

class DonSerializer(serializers.ModelSerializer):
    donateur_nom = serializers.CharField(source="donateur.nom_complet", read_only=True)
    campagne_titre = serializers.CharField(source="campagne.titre", read_only=True)

    class Meta:
        model = Don
        fields = "__all__"
        read_only_fields = ["id", "donateur", "statut", "date_don", "reference_paiement"]

    def validate_montant(self, value):
        if value <= 0:
            raise serializers.ValidationError("Le montant du don doit être supérieur à zéro.")
        return value
