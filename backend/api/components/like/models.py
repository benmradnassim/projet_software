from django.db import models

class Like(models.Model):
    publication = models.ForeignKey("api.Publication", on_delete=models.CASCADE, related_name="likes")
    utilisateur = models.ForeignKey("api.Utilisateur", on_delete=models.CASCADE, related_name="likes")
    date_like = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["publication", "utilisateur"], name="unique_like_publication_utilisateur")]
