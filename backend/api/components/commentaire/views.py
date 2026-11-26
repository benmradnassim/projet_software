"""
API du module « Gestion des publications » — commentaires.

  GET    /api/commentaires/?publication=<id>      commentaires d'une publication
  POST   /api/commentaires/                       ajouter (US 7.5) — analysé par la modération IA (US 7.6)
  PATCH  /api/commentaires/<id>/                  modifier son commentaire (US 7.7) — ré-analysé (US 7.6)
  DELETE /api/commentaires/<id>/                  supprimer son commentaire (US 7.8) ou, admin, n'importe lequel (US 7.11)
  POST   /api/commentaires/<id>/moderer/          admin : { decision: garder | masquer | supprimer }
"""
from django.db.models import Q
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from api.components.publication.permissions import EstAdmin, EstAuteurOuAdmin, est_admin
from api.models import Commentaire, Publication
from api.serializers import CommentaireSerializer
from api.serializers.publication import DecisionModerationSerializer

STATUT_PAR_DECISION = {
    "garder": Commentaire.Statut.PUBLIE,
    "masquer": Commentaire.Statut.MASQUE,
    "supprimer": Commentaire.Statut.SUPPRIME,
}


class CommentaireViewSet(viewsets.ModelViewSet):
    queryset = Commentaire.objects.all()
    serializer_class = CommentaireSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, EstAuteurOuAdmin]
    filterset_fields = ["publication", "auteur", "statut"]
    ordering_fields = ["date_creation"]

    def get_queryset(self):
        user = self.request.user
        qs = Commentaire.objects.select_related("auteur").order_by("date_creation", "id")
        if est_admin(user):
            return qs
        visibles = Q(statut=Commentaire.Statut.PUBLIE, publication__statut=Publication.Statut.PUBLIEE)
        if user.is_authenticated:
            visibles |= Q(auteur=user) & ~Q(statut=Commentaire.Statut.SUPPRIME)
        return qs.filter(visibles)

    def perform_create(self, serializer):
        serializer.save(auteur=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[EstAdmin])
    def moderer(self, request, pk=None):
        commentaire = self.get_object()
        serializer = DecisionModerationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        commentaire.statut = STATUT_PAR_DECISION[serializer.validated_data["decision"]]
        commentaire.save(update_fields=["statut", "date_modification"])
        return Response({"id": commentaire.id, "statut": commentaire.statut})
