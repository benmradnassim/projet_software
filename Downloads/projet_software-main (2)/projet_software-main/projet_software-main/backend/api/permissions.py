from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsOwnerOrReadOnly(BasePermission):
    """Allow edits only to an object's author/owner, except for staff."""

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if request.user and request.user.is_staff:
            return True
        owner = (
            getattr(obj, "auteur", None)
            or getattr(obj, "organisateur", None)
            or getattr(obj, "utilisateur", None)
            or getattr(obj, "donateur", None)
            or getattr(obj, "declarant", None)
        )
        if owner is None and hasattr(obj, "publication"):
            owner = obj.publication.auteur
        return owner == request.user


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS or bool(request.user and request.user.is_staff)
