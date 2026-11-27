"""Django admin registration for DemandeParticipationCampagne."""
from django.contrib import admin
from api.models import DemandeParticipationCampagne
@admin.register(DemandeParticipationCampagne)
class DemandeParticipationCampagneAdmin(admin.ModelAdmin):
    list_display = tuple(field.name for field in DemandeParticipationCampagne._meta.fields[:6])
    search_fields = tuple(field.name for field in DemandeParticipationCampagne._meta.fields if field.get_internal_type() in {"CharField", "EmailField", "TextField"})[:4]
