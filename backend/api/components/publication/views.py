"""API endpoints for Publication."""
from rest_framework import permissions, viewsets
from api.models import Publication
from api.serializers import PublicationSerializer
from api.permissions import IsOwnerOrReadOnly


class PublicationViewSet(viewsets.ModelViewSet):
    queryset = Publication.objects.all()
    serializer_class = PublicationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    def perform_create(self, serializer):
        serializer.save(auteur=self.request.user)

