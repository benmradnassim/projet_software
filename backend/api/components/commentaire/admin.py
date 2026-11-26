"""Django admin registration for Commentaire."""
from django.contrib import admin
from api.models import Commentaire


@admin.register(Commentaire)
class CommentaireAdmin(admin.ModelAdmin):
    list_display = ("id", "publication", "auteur", "statut", "score_toxicite", "date_creation")
    list_filter = ("statut",)
    search_fields = ("contenu", "auteur__email")
    raw_id_fields = ("publication", "auteur")
