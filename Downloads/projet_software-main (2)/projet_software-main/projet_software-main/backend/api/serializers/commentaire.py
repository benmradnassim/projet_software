from rest_framework import serializers

from api.models import Commentaire

class CommentaireSerializer(serializers.ModelSerializer):
    auteur_nom = serializers.CharField(source="auteur.nom_complet", read_only=True)

    class Meta:
        model = Commentaire
        fields = "__all__"
        read_only_fields = ["id", "auteur", "date_creation", "date_modification", "score_toxicite"]
