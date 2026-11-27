"""API endpoints for Signalement."""
from rest_framework import permissions, viewsets
from api.models import Signalement
from api.serializers import SignalementSerializer
from api.permissions import IsOwnerOrReadOnly


class SignalementViewSet(viewsets.ModelViewSet):
    queryset = Signalement.objects.all()
    serializer_class = SignalementSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        if self.request.user.is_staff or self.request.user.role == "admin":
            return self.queryset
        return self.queryset.filter(declarant=self.request.user)
    def perform_create(self, serializer):
        serializer.save(declarant=self.request.user)

