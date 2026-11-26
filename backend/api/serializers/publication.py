from rest_framework import serializers

from api.components.publication.moderation import MESSAGE_BLOCAGE, analyser_contenu
from api.components.publication.permissions import est_admin
from api.models import Campagne, Publication


class PublicationSerializer(serializers.ModelSerializer):
    auteur_nom = serializers.CharField(source="auteur.nom_complet", read_only=True)
    auteur_role = serializers.CharField(source="auteur.role", read_only=True)
    auteur_ville = serializers.CharField(source="auteur.ville", read_only=True)
    auteur_organisation = serializers.CharField(source="auteur.nom_organisation", read_only=True)
    campagne_titre = serializers.CharField(source="campagne.titre", read_only=True, default=None)
    contenu = serializers.CharField(required=False, allow_blank=True)
    nb_like = serializers.SerializerMethodField()
    nb_commentaire = serializers.SerializerMethodField()
    a_like = serializers.SerializerMethodField()

    class Meta:
        model = Publication
        fields = "__all__"
        read_only_fields = ["id", "auteur", "statut", "details", "date_creation", "date_modification", "score_toxicite"]

    # Les compteurs sont annotés par le viewset (une seule requête) ; repli si l'instance vient d'être créée.
    def get_nb_like(self, obj):
        return obj.nb_like if hasattr(obj, "nb_like") else obj.likes.count()

    def get_nb_commentaire(self, obj):
        if hasattr(obj, "nb_commentaire"):
            return obj.nb_commentaire
        return obj.commentaires.filter(statut="publie").count()

    def get_a_like(self, obj):
        if hasattr(obj, "a_like"):
            return bool(obj.a_like)
        user = getattr(self.context.get("request"), "user", None)
        return bool(user and user.is_authenticated and obj.likes.filter(utilisateur=user).exists())

    def validate(self, attrs):
        user = self.context["request"].user
        instance = self.instance

        if instance and instance.statut in (Publication.Statut.MASQUEE, Publication.Statut.SUPPRIMEE):
            raise serializers.ValidationError("Cette publication a été masquée par la modération : elle ne peut plus être modifiée.")

        titre = attrs.get("titre", instance.titre if instance else "")
        contenu = attrs.get("contenu", instance.contenu if instance else "")
        if not (titre or "").strip() and not (contenu or "").strip():
            raise serializers.ValidationError({"contenu": "Écrivez un message avant de publier."})

        type_ = attrs.get("type", instance.type if instance else Publication.Type.STORY)
        if type_ in Publication.TYPES_ORGANISATEUR and user.role != "organisateur" and not est_admin(user):
            raise serializers.ValidationError({"type": "Ce type de publication est réservé aux organisateurs."})

        campagne = attrs.get("campagne")
        if campagne and campagne.statut == Campagne.Statut.BROUILLON and campagne.organisateur_id != user.id:
            raise serializers.ValidationError({"campagne": "Cette campagne n'est pas encore publiée."})

        # US 7.6 : analyse avant ajout ou modification
        analyse = analyser_contenu(titre, contenu)
        if analyse.bloque:
            raise serializers.ValidationError({"contenu": MESSAGE_BLOCAGE})
        attrs["score_toxicite"] = analyse.score
        attrs["statut"] = Publication.Statut.EN_ATTENTE if analyse.a_revoir else Publication.Statut.PUBLIEE
        return attrs


class DecisionModerationSerializer(serializers.Serializer):
    """Décision d'un admin sur un contenu de la file de modération."""

    decision = serializers.ChoiceField(choices=["garder", "masquer", "supprimer"])
