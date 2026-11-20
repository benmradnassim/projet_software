from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from api.views import (
    CampagneViewSet,
    CommentaireViewSet,
    DemandeOrganisateurViewSet,
    DemandeParticipationCampagneViewSet,
    DemandeParticipationEvenementViewSet,
    DonViewSet,
    EvenementViewSet,
    LikeViewSet,
    PublicationViewSet,
    SignalementViewSet,
    UtilisateurViewSet,
    health,
    register,
)

router = DefaultRouter()
router.register("utilisateurs", UtilisateurViewSet)
router.register("campagnes", CampagneViewSet)
router.register("evenements", EvenementViewSet)
router.register("publications", PublicationViewSet)
router.register("commentaires", CommentaireViewSet)
router.register("likes", LikeViewSet)
router.register("dons", DonViewSet)
router.register("participations/campagnes", DemandeParticipationCampagneViewSet)
router.register("participations/evenements", DemandeParticipationEvenementViewSet)
router.register("demandes-organisateur", DemandeOrganisateurViewSet)
router.register("signalements", SignalementViewSet)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health, name="health"),
    path("api/auth/inscription/", register, name="register"),
    path("api/auth/connexion/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/renouveler/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
