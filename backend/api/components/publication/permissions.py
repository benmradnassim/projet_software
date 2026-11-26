"""Permissions du module « Gestion des publications » (publications, commentaires, likes)."""
from rest_framework.permissions import SAFE_METHODS, BasePermission


def est_admin(user):
    return bool(user and user.is_authenticated and user.est_admin)


class EstAuteurOuAdmin(BasePermission):
    """
    Lecture : tout le monde.
    Modification : l'auteur uniquement (US 7.3, 7.7).
    Suppression : l'auteur ou un admin (US 7.4, 7.8, 7.10, 7.11).
    """

    message = "Vous ne pouvez modifier que vos propres contenus."

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        proprietaire = getattr(obj, "auteur", None) or getattr(obj, "utilisateur", None)
        if proprietaire == request.user:
            return True
        return request.method == "DELETE" and est_admin(request.user)


class EstAdmin(BasePermission):
    message = "Accès réservé aux administrateurs."

    def has_permission(self, request, view):
        return est_admin(request.user)
