"""API endpoints for DemandeParticipationCampagne."""
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from api.models import DemandeParticipationCampagne
from api.serializers import DemandeParticipationCampagneSerializer
from api.permissions import IsParticipationOwnerOrOrganizer


class DemandeParticipationCampagneViewSet(viewsets.ModelViewSet):
    queryset = DemandeParticipationCampagne.objects.all()
    serializer_class = DemandeParticipationCampagneSerializer
    permission_classes = [permissions.IsAuthenticated, IsParticipationOwnerOrOrganizer]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["campagne", "utilisateur", "statut", "type"]
    search_fields = ["motif", "type", "campagne__titre", "utilisateur__email"]
    ordering_fields = ["date_demande", "statut", "type"]
    ordering = ["-date_demande"]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role == "admin":
            return self.queryset.select_related("utilisateur", "campagne")
        if user.role == "organisateur":
            return self.queryset.filter(campagne__organisateur=user).select_related("utilisateur", "campagne")
        return self.queryset.filter(utilisateur=user).select_related("utilisateur", "campagne")

    def perform_create(self, serializer):
        serializer.save(utilisateur=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.statut != DemandeParticipationCampagne.Statut.EN_ATTENTE:
            raise serializers.ValidationError({"detail": "Seules les participations en attente peuvent être modifiées."})
        serializer.save()

    @action(detail=True, methods=["post"])
    def traiter(self, request, pk=None):
        participation = self.get_object()
        if not (request.user.is_staff or request.user.role == "admin" or participation.campagne.organisateur_id == request.user.id):
            return Response({"detail": "Seul l'organisateur de la campagne peut traiter cette demande."}, status=status.HTTP_403_FORBIDDEN)
        if participation.statut != DemandeParticipationCampagne.Statut.EN_ATTENTE:
            return Response({"detail": "Cette demande a déjà été traitée."}, status=status.HTTP_409_CONFLICT)

        statut = request.data.get("statut")
        if statut not in {DemandeParticipationCampagne.Statut.ACCEPTEE, DemandeParticipationCampagne.Statut.REFUSEE}:
            return Response({"statut": "Utilisez 'acceptee' ou 'refusee'."}, status=status.HTTP_400_BAD_REQUEST)

        participation.statut = statut
        participation.save(update_fields=["statut"])
        return Response(DemandeParticipationCampagneSerializer(participation, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def annuler(self, request, pk=None):
        participation = self.get_object()
        if participation.utilisateur_id != request.user.id and not (request.user.is_staff or request.user.role == "admin"):
            return Response({"detail": "Vous ne pouvez annuler que votre propre participation."}, status=status.HTTP_403_FORBIDDEN)
        if participation.statut == DemandeParticipationCampagne.Statut.ANNULEE:
            return Response({"detail": "Cette participation est déjà annulée."}, status=status.HTTP_409_CONFLICT)

        participation.statut = DemandeParticipationCampagne.Statut.ANNULEE
        participation.save(update_fields=["statut"])
        return Response(DemandeParticipationCampagneSerializer(participation, context={"request": request}).data)

