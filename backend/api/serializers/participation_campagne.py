from rest_framework import serializers

from api.models import DemandeParticipationCampagne

class DemandeParticipationCampagneSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandeParticipationCampagne
        fields = "__all__"
        read_only_fields = ["id", "utilisateur", "date_demande", "statut", "code_qr"]
