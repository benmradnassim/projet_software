"""API endpoints for Like."""
from rest_framework import permissions, viewsets
from api.models import Like
from api.serializers import LikeSerializer
from api.permissions import IsOwnerOrReadOnly


class LikeViewSet(viewsets.ModelViewSet):
    queryset = Like.objects.all()
    serializer_class = LikeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    def perform_create(self, serializer):
        serializer.save(utilisateur=self.request.user)

