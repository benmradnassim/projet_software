"""Django admin registration for Commentaire."""
from django.contrib import admin
from api.models import Commentaire
@admin.register(Commentaire)
class CommentaireAdmin(admin.ModelAdmin):
    list_display = tuple(field.name for field in Commentaire._meta.fields[:6])
    search_fields = tuple(field.name for field in Commentaire._meta.fields if field.get_internal_type() in {"CharField", "EmailField", "TextField"})[:4]
