from django.db import models

class Commentaire(models.Model):
    class Statut(models.TextChoices):
        EN_ATTENTE = "en_attente", "En attente"
        PUBLIE = "publie", "Publié"
        MASQUE = "masque", "Masqué"
        SUPPRIME = "supprime", "Supprimé"

    publication = models.ForeignKey("api.Publication", on_delete=models.CASCADE, related_name="commentaires")
    auteur = models.ForeignKey("api.Utilisateur", on_delete=models.CASCADE, related_name="commentaires")
    contenu = models.TextField()
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    statut = models.CharField(max_length=12, choices=Statut.choices, default=Statut.PUBLIE)
    score_toxicite = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ["date_creation"]

    def __str__(self):
        return f"Commentaire #{self.pk}"
