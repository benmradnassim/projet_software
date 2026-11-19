"""Django admin registration for Campagne."""
from django.contrib import admin
from api.models import Campagne
@admin.register(Campagne)
class CampagneAdmin(admin.ModelAdmin):
    list_display = tuple(field.name for field in Campagne._meta.fields[:6])
    search_fields = tuple(field.name for field in Campagne._meta.fields if field.get_internal_type() in {"CharField", "EmailField", "TextField"})[:4]
