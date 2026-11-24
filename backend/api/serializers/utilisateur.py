from django.contrib.auth.password_validation import validate_password
from rest_framework import exceptions, serializers
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from api.models import Utilisateur

EMAIL_DEJA_UTILISE = "Adresse e-mail déjà utilisée"


def email_unique():
    return UniqueValidator(queryset=Utilisateur.objects.all(), message=EMAIL_DEJA_UTILISE, lookup="iexact")


class UtilisateurSerializer(serializers.ModelSerializer):
    """Fiche complète d'un compte, sans mot de passe (profil personnel et vues admin)."""

    nom = serializers.CharField(source="last_name", required=False)
    prenom = serializers.CharField(required=False, allow_blank=True)
    nom_complet = serializers.ReadOnlyField()

    class Meta:
        model = Utilisateur
        exclude = ["password", "is_superuser", "groups", "user_permissions"]
        read_only_fields = ["id", "email", "role", "statut", "date_inscription", "date_validation", "is_staff", "is_active", "last_login"]


class InscriptionSerializer(serializers.ModelSerializer):
    """US-UTIL-01 : création de compte par un visiteur."""

    email = serializers.EmailField(validators=[email_unique()])
    password = serializers.CharField(write_only=True, validators=[validate_password], style={"input_type": "password"})
    nom = serializers.CharField(source="last_name", max_length=150)
    prenom = serializers.CharField(max_length=100)
    telephone = serializers.CharField(max_length=30, required=False, allow_blank=True)

    class Meta:
        model = Utilisateur
        fields = ["id", "email", "password", "nom", "prenom", "telephone", "ville"]
        read_only_fields = ["id"]

    def validate_email(self, value):
        return Utilisateur.objects.normalize_email(value).lower()

    def create(self, validated_data):
        # Rôle et statut imposés côté serveur, quelles que soient les données envoyées.
        validated_data["first_name"] = validated_data["prenom"]
        return Utilisateur.objects.create_user(
            **validated_data, role=Utilisateur.Role.CITOYEN, statut=Utilisateur.Statut.ACTIF
        )


class ProfilSerializer(UtilisateurSerializer):
    """US-UTIL-04 / 05 : profil personnel ; rôle, statut et date d'inscription non modifiables."""

    email = serializers.EmailField(required=False, validators=[email_unique()])

    class Meta(UtilisateurSerializer.Meta):
        read_only_fields = [f for f in UtilisateurSerializer.Meta.read_only_fields if f != "email"] + [
            "niveau_acces", "nom_organisation",
        ]

    def validate_email(self, value):
        return Utilisateur.objects.normalize_email(value).lower()


class ChangementMotDePasseSerializer(serializers.Serializer):
    """US-UTIL-06 : ancien mot de passe vérifié, nouveau conforme et confirmé."""

    ancien_mot_de_passe = serializers.CharField(write_only=True)
    nouveau_mot_de_passe = serializers.CharField(write_only=True)
    confirmation = serializers.CharField(write_only=True)

    def validate_ancien_mot_de_passe(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Ancien mot de passe incorrect.")
        return value

    def validate(self, attrs):
        if attrs["nouveau_mot_de_passe"] != attrs["confirmation"]:
            raise serializers.ValidationError({"confirmation": "La confirmation ne correspond pas au nouveau mot de passe."})
        try:
            validate_password(attrs["nouveau_mot_de_passe"], self.context["request"].user)
        except Exception as exc:  # DjangoValidationError
            raise serializers.ValidationError({"nouveau_mot_de_passe": list(getattr(exc, "messages", [str(exc)]))})
        return attrs

    def save(self):
        user = self.context["request"].user
        user.set_password(self.validated_data["nouveau_mot_de_passe"])
        user.save(update_fields=["password"])
        return user


class ChangementStatutSerializer(serializers.Serializer):
    """US-UTIL-18 : suspendre (avec confirmation), réactiver ou désactiver un compte."""

    statut = serializers.ChoiceField(choices=Utilisateur.Statut.choices)
    confirmation = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        if attrs["statut"] == Utilisateur.Statut.SUSPENDU and not attrs["confirmation"]:
            raise serializers.ValidationError({"confirmation": "Confirmez la suspension du compte."})
        return attrs


class ConnexionSerializer(TokenObtainPairSerializer):
    """Connexion JWT : refuse explicitement les comptes suspendus ou désactivés."""

    messages_statut = {
        Utilisateur.Statut.SUSPENDU: "Compte suspendu : connexion impossible.",
        Utilisateur.Statut.DESACTIVE: "Compte désactivé : connexion impossible.",
    }

    def validate(self, attrs):
        user = Utilisateur.objects.filter(email__iexact=attrs.get(self.username_field, "")).first()
        if user and user.statut != Utilisateur.Statut.ACTIF and user.check_password(attrs.get("password", "")):
            raise exceptions.AuthenticationFailed(self.messages_statut[user.statut], code="compte_inactif")
        return super().validate(attrs)
