"""API endpoints for Campagne."""

from django.db.models import Q
from django.db.models.deletion import ProtectedError

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from api.models import Campagne
from api.serializers.campagne import CampagnePhotoSerializer, CampagneSerializer
from api.components.campagne.permissions import CampagnePermission


class CampagneViewSet(viewsets.ModelViewSet):
    queryset = Campagne.objects.all()
    serializer_class = CampagneSerializer
    permission_classes = [CampagnePermission]

    def get_queryset(self):
        user = self.request.user

        qs = Campagne.objects.select_related("organisateur")

        # Administrateur : toutes les campagnes
        if user.is_authenticated and (
            user.role == "admin" or user.is_staff
        ):
            return qs

        # Organisateur : ses campagnes et les campagnes publiques
        if user.is_authenticated and user.role == "organisateur":
            return qs.filter(
                Q(organisateur=user) |
                Q(statut=Campagne.Statut.EN_COURS)
            )

        # Citoyen ou visiteur : uniquement les campagnes publiées
        return qs.filter(statut=Campagne.Statut.EN_COURS)

    def perform_create(self, serializer):
        # Le propriétaire est automatiquement l'utilisateur connecté.
        serializer.save(
            organisateur=self.request.user,
            statut=Campagne.Statut.BROUILLON
        )

    def perform_destroy(self, instance):
        user = self.request.user
        is_admin = user.role == "admin" or user.is_staff

        # L'organisateur supprime uniquement ses brouillons.
        if not is_admin and instance.statut != Campagne.Statut.BROUILLON:
            raise ValidationError({
                "statut": "Seules les campagnes en brouillon peuvent être supprimées."
            })

        # Les dons associés peuvent protéger la campagne.
        try:
            instance.delete()
        except ProtectedError:
            raise ValidationError({
                "detail": (
                    "Impossible de supprimer cette campagne : "
                    "des dons y sont associés."
                )
            })

    @action(
        detail=False,
        methods=["get"],
        url_path="mes-campagnes"
    )
    def mes_campagnes(self, request):
        # Réservé aux organisateurs (un visiteur anonyme n'a pas d'attribut `role`)
        if getattr(request.user, "role", None) != "organisateur":
            return Response(
                {"detail": "Accès réservé aux organisateurs."},
                status=status.HTTP_403_FORBIDDEN
            )

        qs = Campagne.objects.filter(
            organisateur=request.user
        ).order_by("-cree_le")

        page = self.paginate_queryset(qs)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(
        detail=True,
        methods=["post"],
        url_path="publier"
    )
    def publier(self, request, pk=None):
        campagne = self.get_object()

        if campagne.statut != Campagne.Statut.BROUILLON:
            raise ValidationError({
                "statut": "Seule une campagne en brouillon peut être publiée."
            })

        campagne.statut = Campagne.Statut.EN_COURS
        campagne.save(update_fields=["statut", "modifie_le"])

        return Response({
            "message": "Campagne publiée avec succès.",
            "campagne": self.get_serializer(campagne).data
        })

    @action(
        detail=True,
        methods=["post"],
        url_path="cloturer"
    )
    def cloturer(self, request, pk=None):
        campagne = self.get_object()

        if campagne.statut != Campagne.Statut.EN_COURS:
            raise ValidationError({
                "statut": "Seule une campagne en cours peut être clôturée."
            })

        campagne.statut = Campagne.Statut.CLOTUREE
        campagne.save(update_fields=["statut", "modifie_le"])

        return Response({
            "message": "Campagne clôturée avec succès.",
            "campagne": self.get_serializer(campagne).data
        })

    @action(
        detail=True,
        methods=["post"],
        url_path="photo",
        parser_classes=[MultiPartParser, FormParser],
    )
    def photo(self, request, pk=None):
        """Envoie (ou remplace) la photo de la campagne : multipart, champ `photo`."""
        campagne = self.get_object()

        serializer = CampagnePhotoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ancienne = campagne.photo.name if campagne.photo else None
        campagne.photo = serializer.validated_data["photo"]
        campagne.save(update_fields=["photo", "modifie_le"])

        # `image` reste le seul champ lu par le front : il reçoit l'URL de la photo.
        campagne.image = request.build_absolute_uri(campagne.photo.url)
        campagne.save(update_fields=["image", "modifie_le"])

        if ancienne and ancienne != campagne.photo.name:
            campagne.photo.storage.delete(ancienne)

        return Response(self.get_serializer(campagne).data)
