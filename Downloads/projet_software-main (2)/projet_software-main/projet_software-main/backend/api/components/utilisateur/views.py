"""API endpoints for Utilisateur."""
from rest_framework import permissions, viewsets
from api.models import Utilisateur
from api.serializers import UtilisateurSerializer
from api.permissions import IsOwnerOrReadOnly


class UtilisateurViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        if self.request.user.is_staff or self.request.user.role == Utilisateur.Role.ADMIN:
            return self.queryset
        return self.queryset.filter(pk=self.request.user.pk)

