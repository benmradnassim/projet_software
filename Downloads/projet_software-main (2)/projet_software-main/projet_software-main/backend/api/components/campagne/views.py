"""API endpoints for Campagne."""
from rest_framework import permissions, viewsets
from django.db.models import Q
from api.models import Campagne
from api.serializers import CampagneSerializer
from api.permissions import IsOwnerOrReadOnly


class CampagneViewSet(viewsets.ModelViewSet):
    queryset = Campagne.objects.all()
    serializer_class = CampagneSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    def get_queryset(self):
        qs = self.queryset
        if not self.request.user.is_authenticated or not (self.request.user.is_staff or self.request.user.role == "admin"):
            if self.request.user.is_authenticated:
                qs = qs.filter(Q(organisateur=self.request.user) | ~Q(statut="brouillon"))
            else:
                qs = qs.exclude(statut="brouillon")
        return qs

    def perform_create(self, serializer):
        if self.request.user.role not in ["organisateur", "admin"] and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Le r?le organisateur est requis pour cr?er cette ressource.")
        serializer.save(organisateur=self.request.user)

