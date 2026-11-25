from django.db import models

class Campagne(models.Model):
    class Statut(models.TextChoices):
        BROUILLON = "brouillon", "Brouillon"
        EN_COURS = "en_cours", "En cours"
        CLOTUREE = "cloturee", "Clôturée"
        ANNULEE = "annulee", "Annulée"

    organisateur = models.ForeignKey("api.Utilisateur", on_delete=models.PROTECT, related_name="campagnes")
    titre = models.CharField(max_length=200)
    description = models.TextField()
    categorie = models.CharField(max_length=100)
    date_debut = models.DateField()
    date_fin = models.DateField()
    objectif_montant = models.DecimalField(max_digits=12, decimal_places=3)
    montant_collecte = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    statut = models.CharField(max_length=12, choices=Statut.choices, default=Statut.BROUILLON)
    image = models.URLField(blank=True)
    # Photo envoyée par l'organisateur (POST /campagnes/<id>/photo/).
    # Quand elle existe, `image` contient son URL absolue : le front n'affiche que `image`.
    photo = models.ImageField(upload_to="campagnes/%Y/%m/", blank=True, null=True)

    ville = models.CharField(max_length=120, blank=True, default="")
    besoins = models.JSONField(default=list, blank=True)
    point_collecte = models.CharField(max_length=255, blank=True, default="")

    cree_le = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-cree_le"]

    def __str__(self):
        return self.titre
