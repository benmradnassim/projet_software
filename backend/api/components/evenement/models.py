from django.db import models

class Evenement(models.Model):
    class Statut(models.TextChoices):
        PLANIFIE = "planifie", "Planifié"
        COMPLET = "complet", "Complet"
        ANNULE = "annule", "Annulé"
        TERMINE = "termine", "Terminé"

    organisateur = models.ForeignKey("api.Utilisateur", on_delete=models.PROTECT, related_name="evenements")
    campagne = models.ForeignKey("api.Campagne", on_delete=models.SET_NULL, null=True, blank=True, related_name="evenements")
    titre = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    date_evenement = models.DateTimeField()
    lieu = models.CharField(max_length=255)
    ville = models.CharField(max_length=100, blank=True)
    capacite = models.PositiveIntegerField()
    image = models.ImageField(upload_to="events/", blank=True, default="")
    statut = models.CharField(max_length=12, choices=Statut.choices, default=Statut.PLANIFIE)

    def __str__(self):
        return self.titre
