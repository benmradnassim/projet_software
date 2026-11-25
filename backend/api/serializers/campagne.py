
from rest_framework import serializers
from api.models import Campagne


class CampagneSerializer(serializers.ModelSerializer):
    organisateur_nom = serializers.CharField(
        source="organisateur.nom_complet",
        read_only=True
    )

    class Meta:
        model = Campagne
        fields = "__all__"

        read_only_fields = [
            "id",
            "organisateur",
            "organisateur_nom",
            "montant_collecte",
            "statut",
            "cree_le",
            "modifie_le",
            "photo",
        ]

    # Validation du titre
    def validate_titre(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le titre de la campagne est obligatoire."
            )

        return value

    # Validation de la description
    def validate_description(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "La description est obligatoire."
            )

        return value

    # Validation de la catégorie
    def validate_categorie(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "La catégorie est obligatoire."
            )

        return value

    # Validation de l'objectif financier
    def validate_objectif_montant(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "L'objectif financier doit être supérieur à zéro."
            )

        return value

    # Validation des dates
    def validate(self, attrs):
        instance = self.instance

        date_debut = attrs.get(
            "date_debut",
            instance.date_debut if instance else None
        )

        date_fin = attrs.get(
            "date_fin",
            instance.date_fin if instance else None
        )

        if date_debut and date_fin and date_fin < date_debut:
            raise serializers.ValidationError({
                "date_fin": (
                    "La date de fin doit être postérieure "
                    "ou égale à la date de début."
                )
            })

        return attrs


class CampagnePhotoSerializer(serializers.Serializer):
    """Envoi de la photo d'une campagne (multipart/form-data, champ `photo`)."""

    TAILLE_MAX = 5 * 1024 * 1024  # 5 Mo
    FORMATS = {"JPEG", "PNG", "WEBP"}

    photo = serializers.ImageField()

    def validate_photo(self, value):
        if value.size > self.TAILLE_MAX:
            raise serializers.ValidationError("La photo ne doit pas dépasser 5 Mo.")
        # `image` est l'objet Pillow ouvert pendant la validation de l'ImageField.
        fmt = getattr(getattr(value, "image", None), "format", None)
        if fmt not in self.FORMATS:
            raise serializers.ValidationError("Formats acceptés : JPG, PNG ou WebP.")
        return value
