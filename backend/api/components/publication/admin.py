"""Django admin registration for Publication."""
from django.contrib import admin
from api.models import Publication


@admin.register(Publication)
class PublicationAdmin(admin.ModelAdmin):
    list_display = ("id", "auteur", "type", "titre", "statut", "score_toxicite", "date_creation")
    list_filter = ("statut", "type")
    search_fields = ("titre", "contenu", "auteur__email")
    raw_id_fields = ("auteur", "campagne")
