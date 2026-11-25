"""API endpoints for DemandeParticipationEvenement."""
import uuid

from django.db import IntegrityError, transaction
from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from api.models import DemandeParticipationEvenement, Evenement
from api.permissions import CanManageParticipationEvenement
from api.serializers.participation_evenement import DemandeParticipationEvenementSerializer


class DemandeParticipationEvenementViewSet(viewsets.ModelViewSet):
    queryset = DemandeParticipationEvenement.objects.all()
    serializer_class = DemandeParticipationEvenementSerializer
    permission_classes = [CanManageParticipationEvenement]
    ordering = ["-date_demande"]

    def get_queryset(self):
        user = self.request.user
        qs = DemandeParticipationEvenement.objects.select_related("utilisateur", "evenement", "evenement__organisateur")
        if getattr(user, "role", None) == "organisateur":
            qs = qs.filter(Q(evenement__organisateur=user) | Q(utilisateur=user))
        elif getattr(user, "role", None) == "citoyen":
            qs = qs.filter(utilisateur=user)
        else:
            return qs.none()
        evenement_id = self.request.query_params.get("evenement")
        if evenement_id:
            qs = qs.filter(evenement_id=evenement_id)
        return qs.order_by("-date_demande")

    def perform_create(self, serializer):
        user = self.request.user
        evenement = serializer.validated_data.get("evenement")
        if not evenement:
            raise ValidationError({"evenement": "Cet événement est requis."})
        if getattr(user, "role", None) == "organisateur" and evenement.organisateur_id == user.id:
            raise ValidationError({"evenement": "Vous ne pouvez pas participer ? votre propre événement."})
        if getattr(user, "role", None) not in {"citoyen", "organisateur"}:
            raise PermissionDenied("Vous ne pouvez pas créer cette participation.")
        try:
            with transaction.atomic():
                event = Evenement.objects.select_for_update().get(pk=evenement.pk)
                if event.statut != Evenement.Statut.PLANIFIE:
                    raise ValidationError({"evenement": "Cet événement n'accepte pas de nouvelles participations."})
                accepted = DemandeParticipationEvenement.objects.filter(
                    evenement=event,
                    statut=DemandeParticipationEvenement.Statut.ACCEPTEE,
                ).count()
                if accepted >= event.capacite:
                    raise ValidationError({"evenement": "La capacité maximale de cet événement est atteinte."})
                serializer.save(utilisateur=user)
        except IntegrityError:
            raise ValidationError({"evenement": "Vous avez déjà une demande pour cet événement."})

    @action(detail=True, methods=["post"])
    def traiter(self, request, pk=None):
        participation = self.get_object()
        if participation.evenement.organisateur_id != request.user.id:
            return Response({"detail": "Seul l'organisateur de l'événement peut traiter cette demande."}, status=status.HTTP_403_FORBIDDEN)
        if participation.statut != DemandeParticipationEvenement.Statut.EN_ATTENTE:
            return Response({"detail": "Cette demande a déjà été traitée."}, status=status.HTTP_409_CONFLICT)

        action_value = request.data.get("action")
        if action_value not in {"accepter", "refuser"}:
            return Response({"action": "Utilisez 'accepter' ou 'refuser'."}, status=status.HTTP_400_BAD_REQUEST)

        if action_value == "refuser":
            participation.statut = DemandeParticipationEvenement.Statut.REFUSEE
            participation.save(update_fields=["statut"])
            return Response(DemandeParticipationEvenementSerializer(participation, context={"request": request}).data)

        with transaction.atomic():
            locked = DemandeParticipationEvenement.objects.select_for_update().select_related("evenement").get(pk=participation.pk)
            if locked.statut != DemandeParticipationEvenement.Statut.EN_ATTENTE:
                return Response({"detail": "Cette demande a déjà été traitée."}, status=status.HTTP_409_CONFLICT)
            event = Evenement.objects.select_for_update().get(pk=locked.evenement_id)
            if event.statut != Evenement.Statut.PLANIFIE:
                return Response({"detail": "Cet événement n'accepte pas de nouvelles participations."}, status=status.HTTP_409_CONFLICT)
            accepted = DemandeParticipationEvenement.objects.filter(
                evenement=event,
                statut=DemandeParticipationEvenement.Statut.ACCEPTEE,
            ).exclude(pk=locked.pk).count()
            if accepted >= event.capacite:
                return Response({"detail": "La capacité maximale de cet événement est atteinte."}, status=status.HTTP_409_CONFLICT)
            locked.statut = DemandeParticipationEvenement.Statut.ACCEPTEE
            if not locked.code_qr:
                locked.code_qr = uuid.uuid4()
            locked.save(update_fields=["statut", "code_qr"])
            participation = locked

        return Response(DemandeParticipationEvenementSerializer(participation, context={"request": request}).data)

    @action(detail=True, methods=["get"], url_path="qr_code")
    def qr_code(self, request, pk=None):
        participation = self.get_object()
        if participation.utilisateur_id != request.user.id:
            return Response({"detail": "Vous ne pouvez accéder qu'à votre propre QR code."}, status=status.HTTP_403_FORBIDDEN)
        if participation.statut != DemandeParticipationEvenement.Statut.ACCEPTEE or not participation.code_qr:
            return Response({"detail": "Le QR code n'est disponible que pour une participation acceptée."}, status=status.HTTP_400_BAD_REQUEST)
        participant = getattr(participation.utilisateur, "nom_complet", "") or participation.utilisateur.email
        return Response(
            {
                "code_qr": str(participation.code_qr),
                "evenement": participation.evenement.titre,
                "date_evenement": participation.evenement.date_evenement,
                "lieu": participation.evenement.lieu,
                "participant": participant,
            }
        )

    @action(detail=False, methods=["post"], url_path="verify-qr")
    def verify_qr(self, request):
        if getattr(request.user, "role", None) != "organisateur":
            return Response({"valide": False, "detail": "Seul un organisateur peut vérifier un QR code."}, status=status.HTTP_403_FORBIDDEN)
        raw_code = request.data.get("code_qr")
        try:
            code_qr = uuid.UUID(str(raw_code))
        except Exception:
            return Response({"valide": False, "detail": "Code QR invalide."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            participation = DemandeParticipationEvenement.objects.select_related("utilisateur", "evenement").get(code_qr=code_qr)
        except DemandeParticipationEvenement.DoesNotExist:
            return Response({"valide": False, "detail": "Code QR introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if participation.evenement.organisateur_id != request.user.id:
            return Response({"valide": False, "detail": "Ce QR code appartient ? un autre événement."}, status=status.HTTP_403_FORBIDDEN)
        if participation.statut != DemandeParticipationEvenement.Statut.ACCEPTEE:
            return Response({"valide": False, "detail": "Cette participation n'est pas acceptée."}, status=status.HTTP_400_BAD_REQUEST)

        participant = getattr(participation.utilisateur, "nom_complet", "") or participation.utilisateur.email
        return Response(
            {
                "valide": True,
                "participation": DemandeParticipationEvenementSerializer(participation, context={"request": request}).data,
                "message": f"Présence confirmée pour {participant}",
            }
        )
