"""
API du module « Gestion des publications » — likes (US 7.9).

Le front utilise plutôt POST/DELETE /api/publications/<id>/like/ (bascule en un appel).
Ces routes restent disponibles : liste (filtre publication, utilisateur), création, suppression de son like.
Un like ne se modifie pas.
"""
from django.db.models import Q
from rest_framework import mixins, permissions, viewsets

from api.components.publication.permissions import EstAuteurOuAdmin, est_admin
from api.models import Like, Publication
from api.serializers import LikeSerializer


class LikeViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Like.objects.all()
    serializer_class = LikeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, EstAuteurOuAdmin]
    filterset_fields = ["publication", "utilisateur"]

    def get_queryset(self):
        user = self.request.user
        if est_admin(user):
            return self.queryset
        visibles = Q(publication__statut=Publication.Statut.PUBLIEE)
        if user.is_authenticated:
            visibles |= Q(utilisateur=user)
        return self.queryset.filter(visibles)

    def perform_create(self, serializer):
        serializer.save(utilisateur=self.request.user)
