from rest_framework import serializers

from api.models import DemandeParticipationEvenement


class DemandeParticipationEvenementSerializer(serializers.ModelSerializer):
    evenement_titre = serializers.CharField(source="evenement.titre", read_only=True)
    evenement_date = serializers.DateTimeField(source="evenement.date_evenement", read_only=True)
    evenement_lieu = serializers.CharField(source="evenement.lieu", read_only=True)
    utilisateur_nom = serializers.CharField(source="utilisateur.nom_complet", read_only=True)
    code_qr = serializers.SerializerMethodField()

    class Meta:
        model = DemandeParticipationEvenement
        fields = "__all__"
        read_only_fields = ["id", "utilisateur", "date_demande", "statut"]

    def get_code_qr(self, obj):
        if obj.statut != DemandeParticipationEvenement.Statut.ACCEPTEE or not obj.code_qr:
            return None
        return str(obj.code_qr)
