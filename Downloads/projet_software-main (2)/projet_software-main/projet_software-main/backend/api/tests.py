from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from api.components.don.views import DonViewSet
from api.models import Campagne, Don, Utilisateur


class DonCrudTest(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.donor = Utilisateur.objects.create_user(
            email="donateur-test@example.test",
            password="TestPassword123!",
            first_name="Test",
            last_name="Donateur",
            role="citoyen",
        )
        self.organizer = Utilisateur.objects.create_user(
            email="organisateur-test@example.test",
            password="TestPassword123!",
            first_name="Test",
            last_name="Organisateur",
            role="organisateur",
        )
        self.campaign = Campagne.objects.create(
            organisateur=self.organizer,
            titre="Campagne de test",
            description="Campagne utilisée pour tester les dons",
            categorie="Test",
            date_debut="2026-11-26",
            date_fin="2026-12-31",
            objectif_montant=Decimal("1000.000"),
        )

    def create_donation(self, amount="50.500", method="carte"):
        view = DonViewSet.as_view({"post": "create"})
        request = self.factory.post(
            "/api/dons/",
            {
                "campagne": self.campaign.pk,
                "montant": amount,
                "mode_paiement": method,
            },
            format="json",
        )
        force_authenticate(request, user=self.donor)
        return view(request)

    def test_create_and_cancel_pending_donation(self):
        response = self.create_donation()
        self.assertEqual(response.status_code, 201)

        donation = Don.objects.get(pk=response.data["id"])
        self.assertEqual(donation.statut, Don.Statut.EN_ATTENTE)

        view = DonViewSet.as_view({"post": "annuler"})
        request = self.factory.post(
            f"/api/dons/{donation.pk}/annuler/", {}, format="json"
        )
        force_authenticate(request, user=self.donor)
        response = view(request, pk=donation.pk)

        self.assertEqual(response.status_code, 200)
        donation.refresh_from_db()
        self.assertEqual(donation.statut, Don.Statut.ANNULE)

    def test_confirmation_updates_campaign_amount_once(self):
        response = self.create_donation(amount="125.750", method="d17")
        self.assertEqual(response.status_code, 201)
        donation = Don.objects.get(pk=response.data["id"])

        view = DonViewSet.as_view({"post": "verifier"})
        request = self.factory.post(
            f"/api/dons/{donation.pk}/verifier/",
            {"statut": "confirme"},
            format="json",
        )
        force_authenticate(request, user=self.organizer)
        response = view(request, pk=donation.pk)

        self.assertEqual(response.status_code, 200)
        donation.refresh_from_db()
        self.campaign.refresh_from_db()
        self.assertEqual(donation.statut, Don.Statut.CONFIRME)
        self.assertEqual(self.campaign.montant_collecte, Decimal("125.750"))

    def test_refused_donation_does_not_update_campaign_amount(self):
        response = self.create_donation(amount="75.000", method="especes")
        self.assertEqual(response.status_code, 201)
        donation = Don.objects.get(pk=response.data["id"])

        view = DonViewSet.as_view({"post": "verifier"})
        request = self.factory.post(
            f"/api/dons/{donation.pk}/verifier/",
            {"statut": "refuse"},
            format="json",
        )
        force_authenticate(request, user=self.organizer)
        response = view(request, pk=donation.pk)

        self.assertEqual(response.status_code, 200)
        donation.refresh_from_db()
        self.campaign.refresh_from_db()
        self.assertEqual(donation.statut, Don.Statut.REFUSE)
        self.assertEqual(self.campaign.montant_collecte, Decimal("0.000"))
