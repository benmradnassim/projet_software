from django.db import models

class DemandeParticipationEvenement(models.Model):
    class Statut(models.TextChoices):
        EN_ATTENTE = "en_attente", "En attente"
        ACCEPTEE = "acceptee", "Acceptée"
        REFUSEE = "refusee", "Refusée"
        ANNULEE = "annulee", "Annulée"

    utilisateur = models.ForeignKey("api.Utilisateur", on_delete=models.CASCADE, related_name="participations_evenements")
    evenement = models.ForeignKey("api.Evenement", on_delete=models.CASCADE, related_name="demandes_participation")
    date_demande = models.DateTimeField(auto_now_add=True)
    type = models.CharField(max_length=50, default="benevole")
    motif = models.TextField(blank=True)
    statut = models.CharField(max_length=12, choices=Statut.choices, default=Statut.EN_ATTENTE)
    code_qr = models.UUIDField(null=True, blank=True, default=None, unique=True, editable=False)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["utilisateur", "evenement"], name="unique_participation_evenement")]
