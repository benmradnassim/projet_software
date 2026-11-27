"""API endpoints for DemandeOrganisateur."""
from rest_framework import permissions, viewsets
from api.models import DemandeOrganisateur
from api.serializers import DemandeOrganisateurSerializer
from api.permissions import IsOwnerOrReadOnly


class DemandeOrganisateurViewSet(viewsets.ModelViewSet):
    queryset = DemandeOrganisateur.objects.all()
    serializer_class = DemandeOrganisateurSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        if self.request.user.is_staff or self.request.user.role == "admin":
            return self.queryset
        return self.queryset.filter(utilisateur=self.request.user)
    def perform_create(self, serializer):
        serializer.save(utilisateur=self.request.user)

