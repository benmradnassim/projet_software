from rest_framework import serializers
from api.models import Signalement


class SignalementSerializer(serializers.ModelSerializer):
    declarant_nom = serializers.SerializerMethodField()

    class Meta:
        model = Signalement
        fields = "__all__"
        read_only_fields = [
            "id",
            "declarant",
            "statut",
            "date_signalement",
            "traite_par",
            "date_traitement",
        ]

    def get_declarant_nom(self, obj):
        if not obj.declarant:
            return "Utilisateur"
        full_name = f"{getattr(obj.declarant, 'first_name', '')} {getattr(obj.declarant, 'last_name', '')}".strip()
        return (
            full_name
            or getattr(obj.declarant, "nom", None)
            or getattr(obj.declarant, "username", None)
            or getattr(obj.declarant, "email", "Utilisateur")
        )