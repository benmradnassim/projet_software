"""
API du module « Gestion des publications » — publications.

  GET    /api/publications/                       fil (US 7.2) — filtres : type, campagne, auteur, statut ; search ; ordering
  POST   /api/publications/                       ajouter (US 7.1) — analysé par la modération IA (US 7.6)
  PATCH  /api/publications/<id>/                  modifier sa publication (US 7.3) — ré-analysée (US 7.6)
  DELETE /api/publications/<id>/                  supprimer sa publication (US 7.4) ou, admin, n'importe laquelle (US 7.10)
  POST   /api/publications/<id>/like/             liker (US 7.9)      DELETE : retirer son like
  POST   /api/publications/verifier/              { texte } -> verdict IA pendant la saisie (n'enregistre rien)
  GET    /api/publications/moderation/            admin : file de modération (publications + commentaires en attente)
  POST   /api/publications/<id>/moderer/          admin : { decision: garder | masquer | supprimer }

Visibilité : un visiteur ne voit que les publications publiées ; un utilisateur voit aussi les siennes
(en attente de modération) ; un admin voit tout.
"""
from django.db.models import Count, Exists, OuterRef, Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from api.models import Commentaire, Like, Publication
from api.serializers import PublicationSerializer
from api.serializers.publication import DecisionModerationSerializer

from .moderation import analyser_contenu
from .permissions import EstAdmin, EstAuteurOuAdmin, est_admin

STATUT_PAR_DECISION = {
    "garder": Publication.Statut.PUBLIEE,
    "masquer": Publication.Statut.MASQUEE,
    "supprimer": Publication.Statut.SUPPRIMEE,
}


class PublicationViewSet(viewsets.ModelViewSet):
    queryset = Publication.objects.all()
    serializer_class = PublicationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, EstAuteurOuAdmin]
    filterset_fields = ["type", "campagne", "auteur", "statut"]
    search_fields = ["titre", "contenu"]
    ordering_fields = ["date_creation", "nb_like", "nb_commentaire"]

    def get_queryset(self):
        user = self.request.user
        qs = Publication.objects.select_related("auteur", "campagne").annotate(
            nb_like=Count("likes", distinct=True),
            nb_commentaire=Count("commentaires", filter=Q(commentaires__statut=Commentaire.Statut.PUBLIE), distinct=True),
        ).order_by("-date_creation", "-id")  # Meta.ordering est ignoré avec un Count : tri explicite
        if user.is_authenticated:
            qs = qs.annotate(a_like=Exists(Like.objects.filter(publication=OuterRef("pk"), utilisateur=user)))
        if est_admin(user):
            return qs
        visibles = Q(statut=Publication.Statut.PUBLIEE)
        if user.is_authenticated:
            visibles |= Q(auteur=user) & ~Q(statut=Publication.Statut.SUPPRIMEE)
        return qs.filter(visibles)

    def perform_create(self, serializer):
        serializer.save(auteur=self.request.user)

    # ---------- likes (US 7.9) ----------
    @action(detail=True, methods=["post", "delete"], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        publication = self.get_object()
        if request.method == "DELETE":
            Like.objects.filter(publication=publication, utilisateur=request.user).delete()
            code = status.HTTP_200_OK
        else:
            if publication.statut != Publication.Statut.PUBLIEE:
                return Response({"detail": "Cette publication ne peut pas être likée."}, status=status.HTTP_400_BAD_REQUEST)
            _, cree = Like.objects.get_or_create(publication=publication, utilisateur=request.user)
            code = status.HTTP_201_CREATED if cree else status.HTTP_200_OK
        return Response(
            {"a_like": request.method == "POST", "nb_like": publication.likes.count()},
            status=code,
        )

    # ---------- pré-vérification pendant la saisie (US 7.6) ----------
    @action(detail=False, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def verifier(self, request):
        """{ texte } -> { verdict: ok | revue | bloque, score, motif } ; n'enregistre rien."""
        analyse = analyser_contenu(str(request.data.get("texte", ""))[:5000])
        verdict = "bloque" if analyse.bloque else "revue" if analyse.a_revoir else "ok"
        return Response({"verdict": verdict, "score": analyse.score, "motif": analyse.motif})

    # ---------- modération admin (US 7.6, 7.10) ----------
    @action(detail=True, methods=["post"], permission_classes=[EstAdmin])
    def moderer(self, request, pk=None):
        publication = self.get_object()
        serializer = DecisionModerationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        publication.statut = STATUT_PAR_DECISION[serializer.validated_data["decision"]]
        publication.save(update_fields=["statut", "date_modification"])
        return Response({"id": publication.id, "statut": publication.statut})

    @action(detail=False, methods=["get"], permission_classes=[EstAdmin])
    def moderation(self, request):
        """File de modération : contenus mis en attente par l'analyse automatique, plus toxiques d'abord."""
        elements = []
        for p in Publication.objects.filter(statut=Publication.Statut.EN_ATTENTE).select_related("auteur"):
            elements.append(_element_file("publication", p, p.titre, p.contenu))
        for c in Commentaire.objects.filter(statut=Commentaire.Statut.EN_ATTENTE).select_related("auteur"):
            element = _element_file("commentaire", c, "", c.contenu)
            element["publication"] = c.publication_id
            elements.append(element)
        elements.sort(key=lambda e: e["score_toxicite"] or 0, reverse=True)
        return Response(elements)


def _element_file(objet, obj, titre, contenu):
    analyse = analyser_contenu(titre, contenu)
    return {
        "id": obj.id,
        "objet": objet,
        "auteur": obj.auteur_id,
        "auteur_nom": obj.auteur.nom_complet,
        "contenu": " — ".join(t for t in (titre, contenu) if t),
        "score_toxicite": obj.score_toxicite,
        "motif_ia": analyse.motif,
        "mots": analyse.mots,
        "date_creation": obj.date_creation,
    }
