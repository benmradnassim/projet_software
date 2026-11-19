"""Aggregate imports for URL configuration; each view is defined by its component."""
from .components.utilisateur.views import UtilisateurViewSet
from .components.campagne.views import CampagneViewSet
from .components.evenement.views import EvenementViewSet
from .components.publication.views import PublicationViewSet
from .components.commentaire.views import CommentaireViewSet
from .components.like.views import LikeViewSet
from .components.don.views import DonViewSet
from .components.participation_campagne.views import DemandeParticipationCampagneViewSet
from .components.participation_evenement.views import DemandeParticipationEvenementViewSet
from .components.demande_organisateur.views import DemandeOrganisateurViewSet
from .components.signalement.views import SignalementViewSet
from .views_common import health, register
