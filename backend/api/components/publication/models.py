from django.db import models


class Publication(models.Model):
    class Statut(models.TextChoices):
        EN_ATTENTE = "en_attente", "En attente"
        PUBLIEE = "publiee", "Publiée"
        MASQUEE = "masquee", "Masquée"
        SUPPRIMEE = "supprimee", "Supprimée"

    class Type(models.TextChoices):
        # Accessibles à tous les utilisateurs
        THANKS = "thanks", "Merci"
        STORY = "story", "Histoire"
        POLL = "poll", "Question"
        # Réservés aux organisateurs (et admins)
        UPDATE = "update", "Avancement"
        URGENT = "urgent", "Appel urgent"
        EVENT = "event", "Événement"
        GOAL = "goal", "Objectif atteint"
        TRANSPARENCY = "transparency", "Transparence"
        BEFOREAFTER = "beforeafter", "Avant / Après"

    TYPES_ORGANISATEUR = {
        Type.UPDATE, Type.URGENT, Type.EVENT, Type.GOAL, Type.TRANSPARENCY, Type.BEFOREAFTER,
    }

    auteur = models.ForeignKey("api.Utilisateur", on_delete=models.CASCADE, related_name="publications")
    campagne = models.ForeignKey("api.Campagne", on_delete=models.SET_NULL, null=True, blank=True, related_name="publications")
    type = models.CharField(max_length=12, choices=Type.choices, default=Type.STORY)
    titre = models.CharField(max_length=200, blank=True)
    contenu = models.TextField(blank=True)
    image = models.URLField(blank=True)
    # Contenu propre à chaque type de carte (besoins d'un appel urgent, options d'un sondage, lignes de dépenses…).
    # Lecture seule dans l'API pour l'instant : rempli par les données de démo ou l'admin Django.
    details = models.JSONField(null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    statut = models.CharField(max_length=12, choices=Statut.choices, default=Statut.PUBLIEE)
    score_toxicite = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ["-date_creation"]

    def __str__(self):
        return self.titre or f"Publication #{self.pk}"
