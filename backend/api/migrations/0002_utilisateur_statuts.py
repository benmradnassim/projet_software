from django.db import migrations, models

ANCIENS_VERS_NOUVEAUX = {"bloque": "suspendu", "inactif": "desactive"}


def convertir_statuts(apps, schema_editor):
    Utilisateur = apps.get_model("api", "Utilisateur")
    for ancien, nouveau in ANCIENS_VERS_NOUVEAUX.items():
        Utilisateur.objects.filter(statut=ancien).update(statut=nouveau, is_active=False)


def restaurer_statuts(apps, schema_editor):
    Utilisateur = apps.get_model("api", "Utilisateur")
    for ancien, nouveau in ANCIENS_VERS_NOUVEAUX.items():
        Utilisateur.objects.filter(statut=nouveau).update(statut=ancien)


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="utilisateur",
            name="statut",
            field=models.CharField(
                choices=[("actif", "Actif"), ("suspendu", "Suspendu"), ("desactive", "Désactivé")],
                default="actif",
                max_length=12,
            ),
        ),
        migrations.RunPython(convertir_statuts, restaurer_statuts),
    ]
