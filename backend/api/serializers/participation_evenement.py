from rest_framework import serializers

from api.models import DemandeParticipationEvenement

class DemandeParticipationEvenementSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandeParticipationEvenement
        fields = "__all__"
        read_only_fields = ["id", "utilisateur", "date_demande", "statut", "code_qr"]
