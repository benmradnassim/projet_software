from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from api.models import Signalement
from api.serializers import SignalementSerializer


class SignalementViewSet(viewsets.ModelViewSet):

    serializer_class = SignalementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        # L'administrateur voit tous les signalements
        if getattr(user, "est_admin", False):
            return Signalement.objects.all().order_by("-date_signalement")

        # L'organisateur voit ses propres signalements + ceux liés à ses campagnes / événements
        est_org = getattr(user, "est_organisateur", False) or getattr(user, "role", None) == "organisateur"
        if est_org:
            return (
                Signalement.objects.filter(
                    Q(declarant=user)
                    | Q(campagne__organisateur=user)
                    | Q(evenement__organisateur=user)
                )
                .distinct()
                .order_by("-date_signalement")
            )

        # Les autres utilisateurs voient uniquement leurs signalements
        return Signalement.objects.filter(
            declarant=user
        ).order_by("-date_signalement")

    def perform_create(self, serializer):
        serializer.save(declarant=self.request.user)

    def perform_destroy(self, instance):
        user = self.request.user

        # Vérifier que le signalement est encore en attente
        if instance.statut != Signalement.Statut.EN_ATTENTE:
            raise PermissionDenied(
                "Vous ne pouvez annuler qu'un signalement en attente."
            )

        # Vérifier que l'utilisateur est propriétaire ou administrateur
        if instance.declarant != user and not getattr(user, "est_admin", False):
            raise PermissionDenied(
                "Vous ne pouvez pas annuler ce signalement."
            )

        instance.delete()

    @action(detail=True, methods=["patch", "post"], permission_classes=[permissions.IsAuthenticated])
    def traiter(self, request, pk=None):
        user = request.user
        if not getattr(user, "est_admin", False):
            raise PermissionDenied("Seul un administrateur peut traiter un signalement.")

        signalement = self.get_object()
        decision = request.data.get("decision")

        if decision == "retirer":
            signalement.statut = Signalement.Statut.RESOLU
        elif decision == "classer":
            signalement.statut = Signalement.Statut.REJETE
        else:
            return Response(
                {"detail": "Décision invalide. Utilisez 'retirer' ou 'classer'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        signalement.traite_par = user
        signalement.date_traitement = timezone.now()
        signalement.save(update_fields=["statut", "traite_par", "date_traitement"])

        serializer = self.get_serializer(signalement)
        return Response(serializer.data, status=status.HTTP_200_OK)