"""Django admin registration for DemandeParticipationEvenement."""
from django.contrib import admin
from api.models import DemandeParticipationEvenement
@admin.register(DemandeParticipationEvenement)
class DemandeParticipationEvenementAdmin(admin.ModelAdmin):
    list_display = tuple(field.name for field in DemandeParticipationEvenement._meta.fields[:6])
    search_fields = tuple(field.name for field in DemandeParticipationEvenement._meta.fields if field.get_internal_type() in {"CharField", "EmailField", "TextField"})[:4]
