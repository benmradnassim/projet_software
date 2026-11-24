from rest_framework import viewsets, permissions

from api.models import Signalement
from api.serializers import SignalementSerializer
from rest_framework.exceptions import PermissionDenied

class SignalementViewSet(viewsets.ModelViewSet):

    serializer_class = SignalementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Signalement.objects.filter(
            declarant=self.request.user
        )

    def perform_create(self, serializer):
        serializer.save(declarant=self.request.user)

# À ajouter dans SignalementViewSet (views.py) :
def perform_destroy(self, instance):
    if instance.statut != Signalement.Statut.EN_ATTENTE:
        raise PermissionDenied("Vous ne pouvez annuler qu'un signalement en attente.")
    instance.delete()