"""API endpoints for DemandeParticipationEvenement."""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from api.models import DemandeParticipationEvenement
from api.serializers import DemandeParticipationEvenementSerializer
from api.permissions import IsParticipationOwnerOrOrganizer


class DemandeParticipationEvenementViewSet(viewsets.ModelViewSet):
    queryset = DemandeParticipationEvenement.objects.all()
    serializer_class = DemandeParticipationEvenementSerializer
    permission_classes = [permissions.IsAuthenticated, IsParticipationOwnerOrOrganizer]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["evenement", "utilisateur", "statut", "type"]
    search_fields = ["motif", "type", "evenement__titre", "utilisateur__email"]
    ordering_fields = ["date_demande", "statut", "type"]
    ordering = ["-date_demande"]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role == "admin":
            return self.queryset.select_related("utilisateur", "evenement")
        if user.role == "organisateur":
            return self.queryset.filter(evenement__organisateur=user).select_related("utilisateur", "evenement")
        return self.queryset.filter(utilisateur=user).select_related("utilisateur", "evenement")

    def perform_create(self, serializer):
        serializer.save(utilisateur=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.statut != DemandeParticipationEvenement.Statut.EN_ATTENTE:
            raise serializers.ValidationError({"detail": "Seules les participations en attente peuvent être modifiées."})
        serializer.save()

    @action(detail=True, methods=["post"])
    def traiter(self, request, pk=None):
        participation = self.get_object()
        if not (request.user.is_staff or request.user.role == "admin" or participation.evenement.organisateur_id == request.user.id):
            return Response({"detail": "Seul l'organisateur de l'événement peut traiter cette demande."}, status=status.HTTP_403_FORBIDDEN)
        if participation.statut != DemandeParticipationEvenement.Statut.EN_ATTENTE:
            return Response({"detail": "Cette demande a déjà été traitée."}, status=status.HTTP_409_CONFLICT)

        statut = request.data.get("statut")
        if statut not in {DemandeParticipationEvenement.Statut.ACCEPTEE, DemandeParticipationEvenement.Statut.REFUSEE}:
            return Response({"statut": "Utilisez 'acceptee' ou 'refusee'."}, status=status.HTTP_400_BAD_REQUEST)

        if statut == DemandeParticipationEvenement.Statut.ACCEPTEE:
            accepted = DemandeParticipationEvenement.objects.filter(evenement=participation.evenement, statut="acceptee").count()
            if accepted >= participation.evenement.capacite:
                return Response({"detail": "La capacité maximale de cet événement est atteinte."}, status=status.HTTP_409_CONFLICT)

        participation.statut = statut
        participation.save(update_fields=["statut"])
        return Response(DemandeParticipationEvenementSerializer(participation, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def annuler(self, request, pk=None):
        participation = self.get_object()
        if participation.utilisateur_id != request.user.id and not (request.user.is_staff or request.user.role == "admin"):
            return Response({"detail": "Vous ne pouvez annuler que votre propre participation."}, status=status.HTTP_403_FORBIDDEN)
        if participation.statut == DemandeParticipationEvenement.Statut.ANNULEE:
            return Response({"detail": "Cette participation est déjà annulée."}, status=status.HTTP_409_CONFLICT)

        participation.statut = DemandeParticipationEvenement.Statut.ANNULEE
        participation.save(update_fields=["statut"])
        return Response(DemandeParticipationEvenementSerializer(participation, context={"request": request}).data)

