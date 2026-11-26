from rest_framework import serializers

from api.components.publication.moderation import MESSAGE_BLOCAGE, analyser_contenu
from api.models import Commentaire, Publication


class CommentaireSerializer(serializers.ModelSerializer):
    auteur_nom = serializers.CharField(source="auteur.nom_complet", read_only=True)
    auteur_role = serializers.CharField(source="auteur.role", read_only=True)

    class Meta:
        model = Commentaire
        fields = "__all__"
        read_only_fields = ["id", "auteur", "statut", "date_creation", "date_modification", "score_toxicite"]

    def validate_publication(self, publication):
        if self.instance and publication != self.instance.publication:
            raise serializers.ValidationError("Un commentaire ne peut pas changer de publication.")
        if publication.statut != Publication.Statut.PUBLIEE:
            raise serializers.ValidationError("Cette publication n'accepte pas de commentaires.")
        return publication

    def validate_contenu(self, value):
        if not value.strip():
            raise serializers.ValidationError("Écrivez un commentaire.")
        return value.strip()

    def validate(self, attrs):
        if self.instance and self.instance.statut in (Commentaire.Statut.MASQUE, Commentaire.Statut.SUPPRIME):
            raise serializers.ValidationError("Ce commentaire a été masqué par la modération : il ne peut plus être modifié.")
        contenu = attrs.get("contenu", self.instance.contenu if self.instance else "")
        # US 7.6 : analyse avant ajout ou modification
        analyse = analyser_contenu(contenu)
        if analyse.bloque:
            raise serializers.ValidationError({"contenu": MESSAGE_BLOCAGE})
        attrs["score_toxicite"] = analyse.score
        attrs["statut"] = Commentaire.Statut.EN_ATTENTE if analyse.a_revoir else Commentaire.Statut.PUBLIE
        return attrs
