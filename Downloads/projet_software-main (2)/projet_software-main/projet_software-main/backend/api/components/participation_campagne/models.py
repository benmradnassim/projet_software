import uuid

from django.db import models

class DemandeParticipationCampagne(models.Model):
    class Statut(models.TextChoices):
        EN_ATTENTE = "en_attente", "En attente"
        ACCEPTEE = "acceptee", "Acceptée"
        REFUSEE = "refusee", "Refusée"
        ANNULEE = "annulee", "Annulée"

    utilisateur = models.ForeignKey("api.Utilisateur", on_delete=models.CASCADE, related_name="participations_campagnes")
    campagne = models.ForeignKey("api.Campagne", on_delete=models.CASCADE, related_name="demandes_participation")
    date_demande = models.DateTimeField(auto_now_add=True)
    type = models.CharField(max_length=50, default="benevole")
    motif = models.TextField(blank=True)
    statut = models.CharField(max_length=12, choices=Statut.choices, default=Statut.EN_ATTENTE)
    code_qr = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["utilisateur", "campagne"], name="unique_participation_campagne")]
