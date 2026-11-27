"""Django admin registration for Don."""
from django.contrib import admin
from api.models import Don
@admin.register(Don)
class DonAdmin(admin.ModelAdmin):
    list_display = tuple(field.name for field in Don._meta.fields[:6])
    search_fields = tuple(field.name for field in Don._meta.fields if field.get_internal_type() in {"CharField", "EmailField", "TextField"})[:4]
