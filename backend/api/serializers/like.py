from rest_framework import serializers

from api.models import Like, Publication


class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ["id", "publication", "utilisateur", "date_like"]
        read_only_fields = ["id", "utilisateur", "date_like"]

    def validate_publication(self, publication):
        if publication.statut != Publication.Statut.PUBLIEE:
            raise serializers.ValidationError("Cette publication ne peut pas être likée.")
        user = self.context["request"].user
        if Like.objects.filter(publication=publication, utilisateur=user).exists():
            raise serializers.ValidationError("Vous avez déjà liké cette publication.")
        return publication
