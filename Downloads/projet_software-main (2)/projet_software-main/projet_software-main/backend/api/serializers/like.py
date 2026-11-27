from rest_framework import serializers

from api.models import Like

class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ["id", "publication", "utilisateur", "date_like"]
        read_only_fields = ["id", "utilisateur", "date_like"]
