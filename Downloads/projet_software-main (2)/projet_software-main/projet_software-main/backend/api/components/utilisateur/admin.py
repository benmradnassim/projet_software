"""Django admin configuration for users."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from api.models import Utilisateur
@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    ordering = ("email",)
    list_display = ("email", "first_name", "last_name", "role", "statut", "is_staff")
    search_fields = ("email", "first_name", "last_name", "ville")
    fieldsets = ((None, {"fields": ("email", "password")}), ("Identit?", {"fields": ("first_name", "last_name", "prenom", "telephone", "date_naissance", "adresse", "ville")}), ("Organisation", {"fields": ("nom_organisation", "date_validation", "role", "statut", "niveau_acces")}), ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}), ("Dates", {"fields": ("last_login", "date_inscription")}))
    add_fieldsets = ((None, {"classes": ("wide",), "fields": ("email", "first_name", "last_name", "password1", "password2")}),)
