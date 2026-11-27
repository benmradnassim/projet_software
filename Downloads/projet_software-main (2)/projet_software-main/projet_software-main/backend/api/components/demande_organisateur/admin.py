"""Django admin registration for DemandeOrganisateur."""
from django.contrib import admin
from api.models import DemandeOrganisateur
@admin.register(DemandeOrganisateur)
class DemandeOrganisateurAdmin(admin.ModelAdmin):
    list_display = tuple(field.name for field in DemandeOrganisateur._meta.fields[:6])
    search_fields = tuple(field.name for field in DemandeOrganisateur._meta.fields if field.get_internal_type() in {"CharField", "EmailField", "TextField"})[:4]
