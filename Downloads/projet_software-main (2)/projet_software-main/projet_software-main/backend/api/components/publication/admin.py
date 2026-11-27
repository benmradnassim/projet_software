"""Django admin registration for Publication."""
from django.contrib import admin
from api.models import Publication
@admin.register(Publication)
class PublicationAdmin(admin.ModelAdmin):
    list_display = tuple(field.name for field in Publication._meta.fields[:6])
    search_fields = tuple(field.name for field in Publication._meta.fields if field.get_internal_type() in {"CharField", "EmailField", "TextField"})[:4]
