"""API endpoints for DemandeParticipationEvenement."""
from rest_framework import permissions, viewsets
from api.models import DemandeParticipationEvenement
from api.serializers import DemandeParticipationEvenementSerializer
from api.permissions import IsOwnerOrReadOnly


class DemandeParticipationEvenementViewSet(viewsets.ModelViewSet):
    queryset = DemandeParticipationEvenement.objects.all()
    serializer_class = DemandeParticipationEvenementSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role == "admin":
            return self.queryset
        if user.role == "organisateur":
            return self.queryset.filter(evenement__organisateur=user)
        return self.queryset.filter(utilisateur=user)
    def perform_create(self, serializer):
        serializer.save(utilisateur=self.request.user)

