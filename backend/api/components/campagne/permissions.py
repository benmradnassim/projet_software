
from rest_framework.permissions import BasePermission, SAFE_METHODS


class CampagnePermission(BasePermission):
    message = "Vous n'avez pas la permission d'effectuer cette action."

    def has_permission(self, request, view):
        # Consultation autorisée.
        # Le ViewSet filtrera les campagnes visibles selon le rôle.
        if request.method in SAFE_METHODS:
            return True

        user = request.user

        if not user or not user.is_authenticated:
            return False

        if not user.is_active or user.statut != "actif":
            return False

        # L'administrateur peut modifier et supprimer,
        # mais ne peut pas créer, publier ou clôturer.
        if user.role == "admin" or user.is_staff:
            return view.action in [
                "update",
                "partial_update",
                "destroy",
                "photo",
            ]

        # L'organisateur peut gérer ses campagnes.
        if user.role == "organisateur":
            return view.action in [
                "create",
                "update",
                "partial_update",
                "destroy",
                "publier",
                "cloturer",
                "photo",
            ]

        return False

    def has_object_permission(self, request, view, obj):
        # Les lectures restent contrôlées par get_queryset().
        if request.method in SAFE_METHODS:
            return True

        user = request.user

        if user.role == "admin" or user.is_staff:
            return view.action in [
                "update",
                "partial_update",
                "destroy",
                "photo",
            ]

        if user.role == "organisateur":
            return obj.organisateur_id == user.id

        return False
