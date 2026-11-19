"""API endpoints for Evenement."""
from rest_framework import permissions, viewsets
from api.models import Evenement
from api.serializers import EvenementSerializer
from api.permissions import IsOwnerOrReadOnly


class EvenementViewSet(viewsets.ModelViewSet):
    queryset = Evenement.objects.all()
    serializer_class = EvenementSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    def get_queryset(self):
        qs = self.queryset
        if not self.request.user.is_authenticated or not (self.request.user.is_staff or self.request.user.role == "admin"):
            qs = qs.exclude(statut="brouillon") if self.basename == "campagne" else qs
        return qs

    def perform_create(self, serializer):
        if self.request.user.role not in ["organisateur", "admin"] and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Le r?le organisateur est requis pour cr?er cette ressource.")
        serializer.save(organisateur=self.request.user)

