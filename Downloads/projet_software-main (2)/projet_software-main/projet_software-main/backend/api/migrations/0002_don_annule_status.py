from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="don",
            name="statut",
            field=models.CharField(
                choices=[
                    ("en_attente", "En attente"),
                    ("confirme", "Confirmé"),
                    ("refuse", "Refusé"),
                    ("annule", "Annulé"),
                    ("rembourse", "Remboursé"),
                ],
                default="en_attente",
                max_length=12,
            ),
        ),
    ]
