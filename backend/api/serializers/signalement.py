from rest_framework import serializers

from api.models import Signalement

class SignalementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Signalement
        fields = "__all__"
        read_only_fields = ["id", "declarant", "statut", "date_signalement", "traite_par", "date_traitement"]
