"""Django admin registration for Like."""
from django.contrib import admin
from api.models import Like
@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = tuple(field.name for field in Like._meta.fields[:6])
    search_fields = tuple(field.name for field in Like._meta.fields if field.get_internal_type() in {"CharField", "EmailField", "TextField"})[:4]
