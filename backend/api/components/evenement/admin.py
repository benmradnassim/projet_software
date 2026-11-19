"""Django admin registration for Evenement."""
from django.contrib import admin
from api.models import Evenement
@admin.register(Evenement)
class EvenementAdmin(admin.ModelAdmin):
    list_display = tuple(field.name for field in Evenement._meta.fields[:6])
    search_fields = tuple(field.name for field in Evenement._meta.fields if field.get_internal_type() in {"CharField", "EmailField", "TextField"})[:4]
