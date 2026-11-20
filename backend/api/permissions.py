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


class CanManageEvenement(BasePermission):
    """Publicly readable events; organizers may manage only their own."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.role == "organisateur"
        )

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.role == "organisateur"
            and obj.organisateur_id == user.id
        )


class CanManageParticipationEvenement(BasePermission):
    """Keep requests private while allowing event owners to review them."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.role in {"citoyen", "organisateur"}
        )

    def has_object_permission(self, request, view, obj):
        user = request.user
        if getattr(view, "action", None) == "traiter":
            return user.role == "organisateur" and obj.evenement.organisateur_id == user.id
        if user.role == "organisateur":
            if obj.utilisateur_id == user.id:
                return request.method in SAFE_METHODS or request.method == "DELETE"
            return request.method in SAFE_METHODS and obj.evenement.organisateur_id == user.id
        return obj.utilisateur_id == user.id and (
            request.method in SAFE_METHODS or request.method == "DELETE"
        )
