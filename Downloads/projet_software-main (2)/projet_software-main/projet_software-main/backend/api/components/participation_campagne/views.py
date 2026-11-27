"""API endpoints for DemandeParticipationCampagne."""
from rest_framework import permissions, viewsets
from api.models import DemandeParticipationCampagne
from api.serializers import DemandeParticipationCampagneSerializer
from api.permissions import IsOwnerOrReadOnly


class DemandeParticipationCampagneViewSet(viewsets.ModelViewSet):
    queryset = DemandeParticipationCampagne.objects.all()
    serializer_class = DemandeParticipationCampagneSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role == "admin":
            return self.queryset
        if user.role == "organisateur":
            return self.queryset.filter(campagne__organisateur=user)
        return self.queryset.filter(utilisateur=user)
    def perform_create(self, serializer):
        serializer.save(utilisateur=self.request.user)

