"""API endpoints for Commentaire."""
from rest_framework import permissions, viewsets
from api.models import Commentaire
from api.serializers import CommentaireSerializer
from api.permissions import IsOwnerOrReadOnly


class CommentaireViewSet(viewsets.ModelViewSet):
    queryset = Commentaire.objects.all()
    serializer_class = CommentaireSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    def perform_create(self, serializer):
        serializer.save(auteur=self.request.user)

