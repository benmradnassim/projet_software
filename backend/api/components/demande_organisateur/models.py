from django.db import models

class DemandeOrganisateur(models.Model):
    class Statut(models.TextChoices):
        EN_ATTENTE = "en_attente", "En attente"
        ACCEPTEE = "acceptee", "Acceptée"
        REFUSEE = "refusee", "Refusée"

    utilisateur = models.ForeignKey("api.Utilisateur", on_delete=models.CASCADE, related_name="demandes_organisateur")
    motif = models.TextField()
    date_demande = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=12, choices=Statut.choices, default=Statut.EN_ATTENTE)
    date_traitement = models.DateTimeField(null=True, blank=True)
    traite_par = models.ForeignKey("api.Utilisateur", on_delete=models.SET_NULL, null=True, blank=True, related_name="demandes_organisateur_traitees")
