# Generated manually for events/participation spec alignment.
from django.db import migrations, models


def dedupe_and_null_qr(apps, schema_editor):
    Participation = apps.get_model("api", "DemandeParticipationEvenement")
    # Null QR codes for non-accepted participations (spec: QR generated only on acceptance).
    Participation.objects.exclude(statut="acceptee").update(code_qr=None)

    # Deduplicate (utilisateur, evenement) before adding strict unique constraint.
    seen = {}
    priority = {"acceptee": 0, "en_attente": 1, "refusee": 2, "annulee": 3}
    for p in Participation.objects.all().order_by("-date_demande", "-id"):
        key = (p.utilisateur_id, p.evenement_id)
        if key not in seen:
            seen[key] = p
            continue
        keep = seen[key]
        if priority.get(p.statut, 9) < priority.get(keep.statut, 9):
            # Replace keep with p: delete old keep
            keep.delete()
            seen[key] = p
        else:
            p.delete()


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0006_publications_type_moderation"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="demandeparticipationevenement",
            name="unique_participation_evenement",
        ),
        migrations.AddField(
            model_name="evenement",
            name="image",
            field=models.ImageField(blank=True, default="", upload_to="events/"),
        ),
        migrations.AlterField(
            model_name="demandeparticipationevenement",
            name="cin",
            field=models.CharField(blank=True, default="", max_length=8),
        ),
        migrations.AlterField(
            model_name="demandeparticipationevenement",
            name="code_qr",
            field=models.UUIDField(blank=True, default=None, editable=False, null=True, unique=True),
        ),
        migrations.AlterField(
            model_name="demandeparticipationevenement",
            name="statut",
            field=models.CharField(choices=[("en_attente", "En attente"), ("acceptee", "Acceptée"), ("refusee", "Refusée"), ("annulee", "Annulée")], default="en_attente", max_length=12),
        ),
        migrations.AlterField(
            model_name="demandeparticipationevenement",
            name="telephone",
            field=models.CharField(blank=True, default="", max_length=30),
        ),
        migrations.AlterField(
            model_name="evenement",
            name="statut",
            field=models.CharField(choices=[("planifie", "Planifié"), ("complet", "Complet"), ("annule", "Annulé"), ("termine", "Terminé")], default="planifie", max_length=12),
        ),
        migrations.RunPython(dedupe_and_null_qr, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name="demandeparticipationevenement",
            constraint=models.UniqueConstraint(fields=("utilisateur", "evenement"), name="unique_participation_evenement"),
        ),
    ]
