from rest_framework import serializers

from api.models import Publication

class PublicationSerializer(serializers.ModelSerializer):
    auteur_nom = serializers.CharField(source="auteur.nom_complet", read_only=True)
    nb_like = serializers.IntegerField(source="likes.count", read_only=True)
    nb_commentaire = serializers.IntegerField(source="commentaires.count", read_only=True)

    class Meta:
        model = Publication
        fields = "__all__"
        read_only_fields = ["id", "auteur", "date_creation", "date_modification", "score_toxicite"]
