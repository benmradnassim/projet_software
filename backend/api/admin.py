"""Load per-component Django admin registrations."""
from .components.utilisateur import admin as utilisateur_admin
from .components.campagne import admin as campagne_admin
from .components.evenement import admin as evenement_admin
from .components.publication import admin as publication_admin
from .components.commentaire import admin as commentaire_admin
from .components.like import admin as like_admin
from .components.don import admin as don_admin
from .components.participation_campagne import admin as participation_campagne_admin
from .components.participation_evenement import admin as participation_evenement_admin
from .components.demande_organisateur import admin as demande_organisateur_admin
from .components.signalement import admin as signalement_admin
