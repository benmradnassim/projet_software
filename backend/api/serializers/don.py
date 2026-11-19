from rest_framework import serializers

from api.models import Don

class DonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Don
        fields = "__all__"
        read_only_fields = ["id", "donateur", "statut", "date_don", "reference_paiement"]
