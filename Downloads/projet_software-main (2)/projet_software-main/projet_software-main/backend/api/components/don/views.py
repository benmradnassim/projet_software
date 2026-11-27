"""API endpoints for donations."""
from django.db import transaction
from django.db.models import F
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.response import Response

from api.models import Campagne, Don
from api.serializers import DonSerializer


class DonViewSet(viewsets.ModelViewSet):
    queryset = Don.objects.all()
    serializer_class = DonSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role == "admin":
            return self.queryset
        if user.role == "organisateur":
            return self.queryset.filter(campagne__organisateur=user)
        return self.queryset.filter(donateur=user)

    def perform_create(self, serializer):
        serializer.save(donateur=self.request.user)

    @action(detail=True, methods=["post"])
    def annuler(self, request, pk=None):
        """Let a donor cancel a donation that is still awaiting confirmation."""
        with transaction.atomic():
            don = self.get_queryset().select_related("campagne").filter(pk=pk).first()
            if don is None:
                raise NotFound()
            if don.donateur_id != request.user.pk and not request.user.is_staff:
                raise PermissionDenied("Seul le donateur peut annuler ce don.")
            updated = Don.objects.filter(pk=don.pk, statut=Don.Statut.EN_ATTENTE).update(
                statut=Don.Statut.ANNULE
            )
            if not updated:
                raise ValidationError("Seul un don en attente peut être annulé.")
            don.statut = Don.Statut.ANNULE

        return Response(self.get_serializer(don).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def verifier(self, request, pk=None):
        """Let the campaign organizer confirm or refuse a pending donation."""
        decision = request.data.get("statut")
        if decision not in {Don.Statut.CONFIRME, Don.Statut.REFUSE}:
            raise ValidationError({"statut": "Valeurs acceptées : 'confirme' ou 'refuse'."})

        with transaction.atomic():
            don = self.get_queryset().select_related("campagne").filter(pk=pk).first()
            if don is None:
                raise NotFound()
            is_admin = request.user.is_staff or request.user.role == "admin"
            if not is_admin and don.campagne.organisateur_id != request.user.pk:
                raise PermissionDenied("Seul l'organisateur de la campagne peut vérifier ce don.")
            updated = Don.objects.filter(pk=don.pk, statut=Don.Statut.EN_ATTENTE).update(
                statut=decision
            )
            if not updated:
                raise ValidationError("Ce don a déjà été traité.")

            don.statut = decision
            if decision == Don.Statut.CONFIRME:
                Campagne.objects.filter(pk=don.campagne_id).update(
                    montant_collecte=F("montant_collecte") + don.montant
                )

        return Response(self.get_serializer(don).data, status=status.HTTP_200_OK)

