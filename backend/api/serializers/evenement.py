from rest_framework import serializers

from api.models import Evenement, DemandeParticipationEvenement


class EvenementSerializer(serializers.ModelSerializer):
    organisateur_nom = serializers.CharField(source="organisateur.nom_complet", read_only=True)
    campagne_titre = serializers.CharField(source="campagne.titre", read_only=True)
    nb_participants = serializers.SerializerMethodField()
    ma_participation = serializers.SerializerMethodField()

    class Meta:
        model = Evenement
        fields = "__all__"
        read_only_fields = ["id", "organisateur"]

    def get_nb_participants(self, obj):
        return obj.demandes_participation.filter(statut=DemandeParticipationEvenement.Statut.ACCEPTEE).count()

    def validate_image(self, image):
        if image and image.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("La photo ne peut pas dépasser 5 Mo.")
        return image

    def get_ma_participation(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        try:
            participation = obj.demandes_participation.get(utilisateur=request.user)
            return {
                "id": participation.id,
                "statut": participation.statut,
                "code_qr": str(participation.code_qr) if participation.statut == DemandeParticipationEvenement.Statut.ACCEPTEE else None,
            }
        except DemandeParticipationEvenement.DoesNotExist:
            return None
