"""Django admin registration for Signalement."""
from django.contrib import admin
from api.models import Signalement
@admin.register(Signalement)
class SignalementAdmin(admin.ModelAdmin):
    list_display = tuple(field.name for field in Signalement._meta.fields[:6])
    search_fields = tuple(field.name for field in Signalement._meta.fields if field.get_internal_type() in {"CharField", "EmailField", "TextField"})[:4]
