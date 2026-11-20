"""API endpoints for DemandeParticipationEvenement."""
import uuid

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from api.models import DemandeParticipationEvenement, Evenement
from api.permissions import CanManageParticipationEvenement
from api.serializers import DemandeParticipationEvenementSerializer


class DemandeParticipationEvenementViewSet(viewsets.ModelViewSet):
    queryset = DemandeParticipationEvenement.objects.order_by("-date_demande")
    serializer_class = DemandeParticipationEvenementSerializer
    permission_classes = [CanManageParticipationEvenement]

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset

        if user.role == "organisateur":
            qs = qs.filter(Q(evenement__organisateur=user) | Q(utilisateur=user))
        else:
            qs = qs.filter(utilisateur=user)

        evenement_id = self.request.query_params.get("evenement")
        if evenement_id:
            qs = qs.filter(evenement_id=evenement_id)

        return qs

    def perform_create(self, serializer):
        user = self.request.user
        evenement = serializer.validated_data["evenement"]
        if user.role == "organisateur":
            if evenement.organisateur_id == user.id:
                raise PermissionDenied("Vous ne pouvez pas participer à votre propre événement.")
        elif user.role != "citoyen":
            raise PermissionDenied("Seuls les citoyens et les organisateurs peuvent demander à participer.")

        if evenement.statut != Evenement.Statut.PLANIFIE:
            raise ValidationError({"evenement": "Cet événement n'accepte plus de demandes."})
        accepted = evenement.demandes_participation.filter(
            statut=DemandeParticipationEvenement.Statut.ACCEPTEE
        ).count()
        if accepted >= evenement.capacite:
            raise ValidationError({"evenement": "La capacité de cet événement est atteinte."})
        serializer.save(utilisateur=user)

    @action(detail=True, methods=["post"])
    def traiter(self, request, pk=None):
        participation = self.get_object()
        user = request.user

        if user.role != "organisateur":
            raise PermissionDenied("Seul l'organisateur de l'événement peut traiter cette demande.")
        if participation.evenement.organisateur_id != user.id:
            raise PermissionDenied("Vous n'êtes pas l'organisateur de cet événement.")

        if participation.statut != DemandeParticipationEvenement.Statut.EN_ATTENTE:
            return Response({"detail": "Cette demande a déjà été traitée."}, status=400)

        decision = request.data.get("action")
        if decision == "accepter":
            with transaction.atomic():
                evenement = Evenement.objects.select_for_update().get(pk=participation.evenement_id)
                if evenement.statut != Evenement.Statut.PLANIFIE:
                    return Response(
                        {"detail": "Cet événement n'accepte plus de demandes."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                accepted = evenement.demandes_participation.filter(
                    statut=DemandeParticipationEvenement.Statut.ACCEPTEE
                ).count()
                if accepted >= evenement.capacite:
                    return Response(
                        {"detail": "La capacité de cet événement est atteinte."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                participation.statut = DemandeParticipationEvenement.Statut.ACCEPTEE
                if participation.code_qr is None:
                    participation.code_qr = uuid.uuid4()
                participation.save(update_fields=["statut", "code_qr"])
        elif decision == "refuser":
            participation.statut = DemandeParticipationEvenement.Statut.REFUSEE
            participation.save(update_fields=["statut"])
        else:
            return Response(
                {"detail": "Action invalide. Utilisez 'accepter' ou 'refuser'."},
                status=400,
            )

        return Response(DemandeParticipationEvenementSerializer(participation).data)

    @action(detail=True, methods=["get"])
    def qr_code(self, request, pk=None):
        participation = self.get_object()
        user = request.user

        if participation.utilisateur != user:
            raise PermissionDenied("Vous ne pouvez accéder qu'à vos propres codes QR.")
        if participation.statut != DemandeParticipationEvenement.Statut.ACCEPTEE:
            return Response(
                {"detail": "Le code QR n'est disponible qu'après acceptation de la demande."},
                status=400,
            )
        if participation.code_qr is None:
            return Response(
                {"detail": "Aucun code QR n'est associé à cette participation."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            "code_qr": str(participation.code_qr),
            "evenement": participation.evenement.titre,
            "date_evenement": participation.evenement.date_evenement,
            "lieu": participation.evenement.lieu,
            "participant": participation.utilisateur.nom_complet,
        })

    @action(detail=False, methods=["post"], url_path="verify-qr")
    def verify_qr(self, request):
        user = request.user
        if user.role != "organisateur":
            raise PermissionDenied("Seul un organisateur peut vérifier un code QR.")

        code_qr = request.data.get("code_qr")
        if not code_qr:
            return Response({"detail": "Le code QR est requis."}, status=400)

        try:
            code_qr = uuid.UUID(str(code_qr))
            participation = DemandeParticipationEvenement.objects.get(code_qr=code_qr)
        except (
            ValueError,
            TypeError,
            DjangoValidationError,
            DemandeParticipationEvenement.DoesNotExist,
        ):
            return Response(
                {"detail": "Code QR invalide.", "valide": False},
                status=status.HTTP_404_NOT_FOUND,
            )

        if participation.evenement.organisateur_id != user.id:
            return Response(
                {"detail": "Cet événement ne vous appartient pas.", "valide": False},
                status=status.HTTP_403_FORBIDDEN,
            )
        if participation.statut != DemandeParticipationEvenement.Statut.ACCEPTEE:
            return Response(
                {
                    "detail": "Cette participation n'est pas acceptée.",
                    "valide": False,
                    "statut": participation.statut,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            "valide": True,
            "participation": DemandeParticipationEvenementSerializer(participation).data,
            "message": f"Présence confirmée pour {participation.utilisateur.nom_complet}",
        })

