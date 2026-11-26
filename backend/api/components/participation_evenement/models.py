import uuid

from django.core.validators import RegexValidator
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
    nom = models.CharField(max_length=100, blank=True, default="")
    prenom = models.CharField(max_length=100, blank=True, default="")
    telephone = models.CharField(
        max_length=30,
        validators=[RegexValidator(r"^(?:\+216\s*)?(?:\d{2}\s?\d{3}\s?\d{3})$", "Numéro tunisien invalide.")],
        blank=True,
        default="",
    )
    cin = models.CharField(
        max_length=8,
        validators=[RegexValidator(r"^\d{8}$", "Le CIN doit contenir exactement 8 chiffres.")],
        blank=True,
        default="",
    )
    adresse = models.CharField(max_length=255, blank=True, default="")
    statut = models.CharField(max_length=12, choices=Statut.choices, default=Statut.EN_ATTENTE)
    code_qr = models.UUIDField(null=True, blank=True, default=None, unique=True, editable=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["utilisateur", "evenement"],
                name="unique_participation_evenement",
            )
        ]
