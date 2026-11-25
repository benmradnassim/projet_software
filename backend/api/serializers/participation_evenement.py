from rest_framework import serializers

from api.models import DemandeParticipationEvenement


class DemandeParticipationEvenementSerializer(serializers.ModelSerializer):
    evenement_titre = serializers.CharField(source="evenement.titre", read_only=True)
    evenement_date = serializers.DateTimeField(source="evenement.date_evenement", read_only=True)
    evenement_lieu = serializers.CharField(source="evenement.lieu", read_only=True)
    utilisateur_nom = serializers.SerializerMethodField()

    class Meta:
        model = DemandeParticipationEvenement
        fields = [
            "id",
            "utilisateur",
            "evenement",
            "date_demande",
            "type",
            "motif",
            "statut",
            "code_qr",
            "evenement_titre",
            "evenement_date",
            "evenement_lieu",
            "utilisateur_nom",
        ]
        read_only_fields = ["id", "utilisateur", "date_demande", "statut", "code_qr"]

    def get_utilisateur_nom(self, obj):
        user = getattr(obj, "utilisateur", None)
        if not user:
            return ""
        full = getattr(user, "nom_complet", "") or ""
        if full.strip():
            return full.strip()
        return getattr(user, "email", "")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.statut != DemandeParticipationEvenement.Statut.ACCEPTEE:
            data["code_qr"] = None
        return data
