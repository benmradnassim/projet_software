"""API endpoints for Utilisateur (module « Gestion des utilisateurs »)."""
from django.http import Http404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.response import Response

from api.models import Utilisateur
from api.permissions import IsAdminRole
from api.serializers import (
    ChangementMotDePasseSerializer,
    ChangementStatutSerializer,
    ProfilSerializer,
    UtilisateurSerializer,
)


class UtilisateurViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Liste et détail : administrateurs uniquement (US-UTIL-16, US-UTIL-17).
    `moi/` : profil courant (US-UTIL-04, US-UTIL-05) ; `moi/mot-de-passe/` (US-UTIL-06).
    `{id}/statut/` : changement de statut par un admin (US-UTIL-18).
    Aucune suppression physique : la désactivation passe par le statut.
    """

    queryset = Utilisateur.objects.all().order_by("id")
    serializer_class = UtilisateurSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]
    filterset_fields = ["role", "statut"]
    search_fields = ["email", "first_name", "last_name", "prenom"]
    ordering_fields = ["date_inscription", "email", "last_name"]

    def get_object(self):
        try:
            return super().get_object()
        except Http404:
            raise NotFound("Compte introuvable")

    @action(detail=False, methods=["get", "patch"], url_path="moi", permission_classes=[permissions.IsAuthenticated])
    def moi(self, request):
        if request.method == "GET":
            return Response(ProfilSerializer(request.user).data)
        serializer = ProfilSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Profil mis à jour avec succès.", "utilisateur": serializer.data})

    @action(detail=False, methods=["post"], url_path="moi/mot-de-passe", permission_classes=[permissions.IsAuthenticated])
    def mot_de_passe(self, request):
        serializer = ChangementMotDePasseSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Mot de passe modifié avec succès."})

    @action(detail=True, methods=["post"], url_path="statut")
    def statut(self, request, pk=None):
        compte = self.get_object()
        if compte.pk == request.user.pk:
            raise PermissionDenied("Vous ne pouvez pas modifier le statut de votre propre compte.")
        serializer = ChangementStatutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        compte.statut = serializer.validated_data["statut"]
        compte.save(update_fields=["statut"])
        messages = {
            Utilisateur.Statut.ACTIF: "Compte réactivé.",
            Utilisateur.Statut.SUSPENDU: "Compte suspendu.",
            Utilisateur.Statut.DESACTIVE: "Compte désactivé.",
        }
        return Response(
            {"message": messages[compte.statut], "utilisateur": UtilisateurSerializer(compte).data},
            status=status.HTTP_200_OK,
        )
