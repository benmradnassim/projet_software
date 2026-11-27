from django.db import models

class Signalement(models.Model):
    class Statut(models.TextChoices):
        EN_ATTENTE = "en_attente", "En attente"
        EN_COURS = "en_cours", "Pris en charge"
        RESOLU = "resolu", "Résolu"
        REJETE = "rejete", "Rejeté"

    class Type(models.TextChoices):
        PUBLICATION = "publication", "Publication"
        COMMENTAIRE = "commentaire", "Commentaire"
        CAMPAGNE = "campagne", "Campagne"
        EVENEMENT = "evenement", "Événement"
        AUTRE = "autre", "Autre"

    declarant = models.ForeignKey("api.Utilisateur", on_delete=models.CASCADE, related_name="signalements")
    publication = models.ForeignKey("api.Publication", on_delete=models.SET_NULL, null=True, blank=True, related_name="signalements")
    commentaire = models.ForeignKey("api.Commentaire", on_delete=models.SET_NULL, null=True, blank=True, related_name="signalements")
    campagne = models.ForeignKey("api.Campagne", on_delete=models.SET_NULL, null=True, blank=True, related_name="signalements")
    evenement = models.ForeignKey("api.Evenement", on_delete=models.SET_NULL, null=True, blank=True, related_name="signalements")
    type = models.CharField(max_length=12, choices=Type.choices, default=Type.AUTRE)
    description = models.TextField()
    localisation = models.CharField(max_length=255, blank=True)
    date_signalement = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=12, choices=Statut.choices, default=Statut.EN_ATTENTE)
    traite_par = models.ForeignKey("api.Utilisateur", on_delete=models.SET_NULL, null=True, blank=True, related_name="signalements_traites")
    date_traitement = models.DateTimeField(null=True, blank=True)
