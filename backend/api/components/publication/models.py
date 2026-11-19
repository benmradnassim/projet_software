from django.db import models

class Publication(models.Model):
    class Statut(models.TextChoices):
        EN_ATTENTE = "en_attente", "En attente"
        PUBLIEE = "publiee", "Publiée"
        MASQUEE = "masquee", "Masquée"
        SUPPRIMEE = "supprimee", "Supprimée"

    auteur = models.ForeignKey("api.Utilisateur", on_delete=models.CASCADE, related_name="publications")
    campagne = models.ForeignKey("api.Campagne", on_delete=models.SET_NULL, null=True, blank=True, related_name="publications")
    titre = models.CharField(max_length=200, blank=True)
    contenu = models.TextField()
    image = models.URLField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    statut = models.CharField(max_length=12, choices=Statut.choices, default=Statut.PUBLIEE)
    score_toxicite = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ["-date_creation"]

    def __str__(self):
        return self.titre or f"Publication #{self.pk}"
