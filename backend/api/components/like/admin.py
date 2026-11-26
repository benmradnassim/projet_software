"""Django admin registration for Like."""
from django.contrib import admin
from api.models import Like


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ("id", "publication", "utilisateur", "date_like")
    raw_id_fields = ("publication", "utilisateur")
