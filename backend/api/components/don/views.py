"""API endpoints for Don."""
from rest_framework import permissions, viewsets
from api.models import Don
from api.serializers import DonSerializer
from api.permissions import IsOwnerOrReadOnly


class DonViewSet(viewsets.ModelViewSet):
    queryset = Don.objects.all()
    serializer_class = DonSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role == "admin":
            return self.queryset
        if user.role == "organisateur":
            return self.queryset.filter(campagne__organisateur=user)
        return self.queryset.filter(donateur=user)
    def perform_create(self, serializer):
        serializer.save(donateur=self.request.user)

