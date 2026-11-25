from rest_framework import serializers

from api.models import DemandeParticipationEvenement, Evenement


class EvenementSerializer(serializers.ModelSerializer):
    organisateur_nom = serializers.SerializerMethodField()
    campagne_titre = serializers.CharField(source="campagne.titre", read_only=True, default=None)
    nb_participants = serializers.SerializerMethodField()
    ma_participation = serializers.SerializerMethodField()

    class Meta:
        model = Evenement
        fields = "__all__"
        read_only_fields = ["id", "organisateur"]

    def get_organisateur_nom(self, obj):
        org = getattr(obj, "organisateur", None)
        if not org:
            return ""
        full = getattr(org, "nom_complet", "") or ""
        if full.strip():
            return full.strip()
        return getattr(org, "email", "")

    def get_nb_participants(self, obj):
        annotated = getattr(obj, "nb_participants_ann", None)
        if annotated is not None:
            return annotated
        return obj.demandes_participation.filter(statut=DemandeParticipationEvenement.Statut.ACCEPTEE).count()

    def get_ma_participation(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return None
        participation = None
        mine = getattr(obj, "ma_participation_ann", None)
        if mine is not None:
            participation = mine[0] if mine else None
        else:
            participation = obj.demandes_participation.filter(utilisateur=user).first()
        if not participation:
            return None
        return {
            "id": participation.id,
            "statut": participation.statut,
            "code_qr": str(participation.code_qr) if participation.statut == DemandeParticipationEvenement.Statut.ACCEPTEE and participation.code_qr else None,
        }

    def validate_image(self, value):
        if value and getattr(value, "size", 0) > 5 * 1024 * 1024:
            raise serializers.ValidationError("La photo ne peut pas dépasser 5 Mo.")
        return value
