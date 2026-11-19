from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from api.models import Utilisateur

class UtilisateurSerializer(serializers.ModelSerializer):
    nom = serializers.CharField(source="last_name", required=False)
    prenom = serializers.CharField(required=False, allow_blank=True)
    nom_complet = serializers.ReadOnlyField()

    class Meta:
        model = Utilisateur
        exclude = ["password", "is_superuser", "groups", "user_permissions"]
        read_only_fields = ["id", "email", "role", "date_inscription", "date_validation", "is_staff", "is_active", "last_login"]

class InscriptionSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    nom = serializers.CharField(source="last_name")

    class Meta:
        model = Utilisateur
        fields = ["id", "email", "password", "nom", "prenom", "telephone", "ville"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        return Utilisateur.objects.create_user(**validated_data, role=Utilisateur.Role.CITOYEN)
