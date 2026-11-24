from django.contrib import admin
from api.models import Signalement


@admin.register(Signalement)
class SignalementAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'declarant',
        'type',
        'statut',
        'date_signalement',
    )

    list_filter = (
        'type',
        'statut',
        'date_signalement',
    )

    search_fields = (
        'description',
        'localisation',
        'declarant__username',
    )