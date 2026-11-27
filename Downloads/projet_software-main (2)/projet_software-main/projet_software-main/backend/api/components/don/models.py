from django.db import models

class Don(models.Model):
    class Statut(models.TextChoices):
        EN_ATTENTE = "en_attente", "En attente"
        CONFIRME = "confirme", "Confirmé"
        REFUSE = "refuse", "Refusé"
        ANNULE = "annule", "Annulé"
        REMBOURSE = "rembourse", "Remboursé"

    class ModePaiement(models.TextChoices):
        CARTE = "carte", "Carte bancaire"
        VIREMENT = "virement", "Virement"
        D17 = "d17", "D17"
        ESPECES = "especes", "Espèces"

    donateur = models.ForeignKey("api.Utilisateur", on_delete=models.PROTECT, related_name="dons")
    campagne = models.ForeignKey("api.Campagne", on_delete=models.PROTECT, related_name="dons")
    montant = models.DecimalField(max_digits=12, decimal_places=3)
    date_don = models.DateTimeField(auto_now_add=True)
    mode_paiement = models.CharField(max_length=12, choices=ModePaiement.choices)
    statut = models.CharField(max_length=12, choices=Statut.choices, default=Statut.EN_ATTENTE)
    reference_paiement = models.CharField(max_length=100, blank=True)
