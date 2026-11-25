"""API endpoints for Evenement."""
from django.db.models import Count, Prefetch, Q
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from api.models import DemandeParticipationEvenement, Evenement
from api.permissions import CanManageEvenement
from api.serializers.evenement import EvenementSerializer


class EvenementViewSet(viewsets.ModelViewSet):
    queryset = Evenement.objects.all()
    serializer_class = EvenementSerializer
    permission_classes = [CanManageEvenement]
    filterset_fields = ["statut", "ville", "campagne"]
    search_fields = ["titre", "description", "lieu", "ville"]
    ordering_fields = ["date_evenement", "titre", "capacite"]
    ordering = ["date_evenement"]

    def get_queryset(self):
        user = self.request.user
        qs = Evenement.objects.select_related("organisateur", "campagne").annotate(
            nb_participants_ann=Count(
                "demandes_participation",
                filter=Q(demandes_participation__statut=DemandeParticipationEvenement.Statut.ACCEPTEE),
                distinct=True,
            )
        )
        if user.is_authenticated:
            qs = qs.prefetch_related(
                Prefetch(
                    "demandes_participation",
                    queryset=DemandeParticipationEvenement.objects.filter(utilisateur=user),
                    to_attr="ma_participation_ann",
                )
            )
        if not user.is_authenticated or getattr(user, "role", None) == "citoyen":
            return qs.filter(statut=Evenement.Statut.PLANIFIE)
        if getattr(user, "role", None) == "admin" or user.is_staff:
            return qs
        if getattr(user, "role", None) == "organisateur":
            return qs.filter(Q(statut=Evenement.Statut.PLANIFIE) | Q(organisateur=user))
        return qs.filter(statut=Evenement.Statut.PLANIFIE)

    def perform_create(self, serializer):
        if getattr(self.request.user, "role", None) != "organisateur":
            raise PermissionDenied("Le rôle organisateur est requis pour créer cette ressource.")
        serializer.save(organisateur=self.request.user)
