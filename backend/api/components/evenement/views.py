"""API endpoints for Evenement."""
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.exceptions import PermissionDenied
from api.models import Evenement
from api.serializers import EvenementSerializer
from api.permissions import CanManageEvenement


class EvenementViewSet(viewsets.ModelViewSet):
    queryset = Evenement.objects.all()
    serializer_class = EvenementSerializer
    permission_classes = [CanManageEvenement]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["statut", "ville", "campagne"]
    search_fields = ["titre", "description", "lieu", "ville"]
    ordering_fields = ["date_evenement", "titre", "capacite"]
    ordering = ["date_evenement"]

    def get_queryset(self):
        qs = self.queryset
        user = self.request.user

        if not user.is_authenticated:
            return qs.filter(statut=Evenement.Statut.PLANIFIE)

        if user.is_staff or user.role == "admin":
            return qs

        if user.role == "organisateur":
            return qs.filter(
                models.Q(statut=Evenement.Statut.PLANIFIE) | models.Q(organisateur=user)
            )

        return qs.filter(statut=Evenement.Statut.PLANIFIE)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != "organisateur":
            raise PermissionDenied("Le r\u00f4le organisateur est requis pour cr\u00e9er cette ressource.")
        serializer.save(organisateur=user)

