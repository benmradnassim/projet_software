from datetime import date, timedelta
from io import StringIO

from django.core.management import call_command
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import (
    Campagne,
    DemandeParticipationCampagne,
    DemandeParticipationEvenement,
    Evenement,
    Utilisateur,
)


class ParticipationCrudTests(APITestCase):
    def setUp(self):
        self.organisateur = Utilisateur.objects.create_user(
            email="orga@test.tn",
            password="TestPassword2026!",
            role=Utilisateur.Role.ORGANISATEUR,
        )
        self.citoyen = Utilisateur.objects.create_user(
            email="citoyen@test.tn",
            password="TestPassword2026!",
            role=Utilisateur.Role.CITOYEN,
        )
        self.autre_citoyen = Utilisateur.objects.create_user(
            email="autre@test.tn",
            password="TestPassword2026!",
            role=Utilisateur.Role.CITOYEN,
        )
        self.campagne = Campagne.objects.create(
            organisateur=self.organisateur,
            titre="Campagne test",
            description="Description test",
            categorie="education",
            date_debut=date.today(),
            date_fin=date.today() + timedelta(days=30),
            objectif_montant=1000,
            statut=Campagne.Statut.EN_COURS,
        )
        self.evenement = Evenement.objects.create(
            organisateur=self.organisateur,
            campagne=self.campagne,
            titre="Événement test",
            description="Description test",
            date_evenement=timezone.now() + timedelta(days=7),
            lieu="Tunis",
            ville="Tunis",
            capacite=2,
            statut=Evenement.Statut.PLANIFIE,
        )

    def test_create_duplicate_campaign_participation(self):
        self.client.force_authenticate(self.citoyen)
        url = "/api/participations/campagnes/"
        payload = {
            "campagne": self.campagne.id,
            "type": "benevole",
            "motif": "Je souhaite aider régulièrement.",
            "nom": "Saada",
            "prenom": "Nour",
            "telephone": "+216 22 333 444",
            "cin": "12345678",
            "adresse": "12 rue Habib Bourguiba, Tunis",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        duplicate = self.client.post(url, {**payload, "motif": "Deuxième demande complète."}, format="json")
        self.assertEqual(duplicate.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(DemandeParticipationCampagne.objects.count(), 1)

    def test_organizer_can_accept_and_citizen_can_cancel_event_participation(self):
        participation = DemandeParticipationEvenement.objects.create(
            utilisateur=self.citoyen,
            evenement=self.evenement,
            type="benevole",
            motif="Disponible",
        )

        self.client.force_authenticate(self.organisateur)
        response = self.client.post(
            f"/api/participations/evenements/{participation.id}/traiter/",
            {"action": "accepter"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        participation.refresh_from_db()
        self.assertEqual(participation.statut, "acceptee")

        self.client.force_authenticate(self.citoyen)
        cancel = self.client.delete(f"/api/participations/evenements/{participation.id}/")
        self.assertEqual(cancel.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(DemandeParticipationEvenement.objects.filter(pk=participation.pk).exists())

    def test_campaign_organizer_can_accept_participation(self):
        participation = DemandeParticipationCampagne.objects.create(
            utilisateur=self.citoyen,
            campagne=self.campagne,
            type="benevole",
            motif="Disponible.",
        )
        self.client.force_authenticate(self.organisateur)

        response = self.client.post(
            f"/api/participations/campagnes/{participation.id}/traiter/",
            {"statut": "acceptee"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        participation.refresh_from_db()
        self.assertEqual(participation.statut, "acceptee")

    def test_campaign_organizer_sees_pending_participation(self):
        self.client.force_authenticate(self.citoyen)
        created = self.client.post(
            "/api/participations/campagnes/",
            {
                "campagne": self.campagne.id,
                "type": "benevole",
                "motif": "Disponible pour cette campagne.",
                "nom": "Saada",
                "prenom": "Nour",
                "telephone": "22333444",
                "cin": "12345678",
                "adresse": "12 rue Habib Bourguiba, Tunis",
            },
            format="json",
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.client.force_authenticate(self.organisateur)

        response = self.client.get(
            "/api/participations/campagnes/",
            {"statut": "en_attente"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rows = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual([row["id"] for row in rows], [created.data["id"]])

    def test_event_organizer_sees_pending_participation(self):
        self.client.force_authenticate(self.citoyen)
        created = self.client.post(
            "/api/participations/evenements/",
            {
                "evenement": self.evenement.id,
                "type": "benevole",
                "motif": "Disponible pour cet événement.",
                "nom": "Saada",
                "prenom": "Nour",
                "telephone": "22333444",
                "cin": "12345678",
                "adresse": "12 rue Habib Bourguiba, Tunis",
            },
            format="json",
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.client.force_authenticate(self.organisateur)

        response = self.client.get(
            "/api/participations/evenements/",
            {"statut": "en_attente"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rows = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual([row["id"] for row in rows], [created.data["id"]])

    def test_cancelled_participations_can_be_submitted_again(self):
        self.client.force_authenticate(self.citoyen)
        campaign_cancelled = DemandeParticipationCampagne.objects.create(
            utilisateur=self.citoyen,
            campagne=self.campagne,
            statut=DemandeParticipationCampagne.Statut.ANNULEE,
        )

        payload = {
            "type": "benevole",
            "motif": "Je souhaite aider pendant cette action.",
            "nom": "Saada",
            "prenom": "Nour",
            "telephone": "22333444",
            "cin": "12345678",
            "adresse": "12 rue Habib Bourguiba, Tunis",
        }
        campaign_response = self.client.post(
            "/api/participations/campagnes/",
            {**payload, "campagne": self.campagne.id},
            format="json",
        )

        self.assertEqual(campaign_response.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(campaign_response.data["id"], campaign_cancelled.id)

    def test_cancellation_removes_requests_from_organizer_pending_lists(self):
        event_participation = DemandeParticipationEvenement.objects.create(
            utilisateur=self.citoyen,
            evenement=self.evenement,
        )
        campaign_participation = DemandeParticipationCampagne.objects.create(
            utilisateur=self.citoyen,
            campagne=self.campagne,
        )

        self.client.force_authenticate(self.organisateur)
        event_list = self.client.get(
            "/api/participations/evenements/",
            {"evenement": self.evenement.id, "statut": "en_attente"},
        )
        campaign_list = self.client.get(
            "/api/participations/campagnes/",
            {"campagne": self.campagne.id, "statut": "en_attente"},
        )
        self.assertIn(event_participation.id, [row["id"] for row in event_list.data["results"]])
        self.assertIn(campaign_participation.id, [row["id"] for row in campaign_list.data["results"]])

        self.client.force_authenticate(self.citoyen)
        self.client.delete(f"/api/participations/evenements/{event_participation.id}/")
        self.client.post(f"/api/participations/campagnes/{campaign_participation.id}/annuler/", {}, format="json")

        self.client.force_authenticate(self.organisateur)
        event_list = self.client.get(
            "/api/participations/evenements/",
            {"evenement": self.evenement.id, "statut": "en_attente"},
        )
        campaign_list = self.client.get(
            "/api/participations/campagnes/",
            {"campagne": self.campagne.id, "statut": "en_attente"},
        )
        self.assertNotIn(event_participation.id, [row["id"] for row in event_list.data["results"]])
        self.assertNotIn(campaign_participation.id, [row["id"] for row in campaign_list.data["results"]])

    def test_demo_participation_targets_keep_their_organizers(self):
        call_command("seed_demo", stdout=StringIO())

        campaign = Campagne.objects.get(titre="Un toit sûr après les pluies")
        event = Evenement.objects.get(titre="Distribution de couvertures")
        self.assertEqual(campaign.organisateur.email, "hatem.jaziri@example.tn")
        self.assertEqual(event.campagne_id, campaign.id)
        self.assertEqual(event.organisateur_id, campaign.organisateur_id)

        cartable_event = Evenement.objects.get(titre="Un cartable, mille sourires")
        main_dans_la_main = Utilisateur.objects.get(email="contact@maindanslamain.tn")
        marwa = Utilisateur.objects.get(email="marwa.ltifi@example.tn")
        self.assertEqual(cartable_event.organisateur_id, main_dans_la_main.id)
        participation = DemandeParticipationEvenement.objects.create(
            utilisateur=self.citoyen,
            evenement=cartable_event,
            type="benevole",
            motif="Je souhaite aider pendant la distribution.",
        )

        self.client.force_authenticate(main_dans_la_main)
        response = self.client.get("/api/participations/evenements/", {"statut": "en_attente"})
        rows = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        self.assertIn(participation.id, [row["id"] for row in rows])

        self.client.force_authenticate(marwa)
        response = self.client.get("/api/participations/evenements/", {"statut": "en_attente"})
        rows = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        self.assertNotIn(participation.id, [row["id"] for row in rows])
    def test_other_citizen_cannot_view_or_cancel_participation(self):
        participation = DemandeParticipationCampagne.objects.create(
            utilisateur=self.citoyen,
            campagne=self.campagne,
            type="benevole",
        )

        self.client.force_authenticate(self.autre_citoyen)
        detail = self.client.get(f"/api/participations/campagnes/{participation.id}/")
        cancel = self.client.post(f"/api/participations/campagnes/{participation.id}/annuler/", {}, format="json")

        self.assertEqual(detail.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(cancel.status_code, status.HTTP_404_NOT_FOUND)

    def test_event_capacity_is_enforced_on_acceptance(self):
        first = DemandeParticipationEvenement.objects.create(utilisateur=self.citoyen, evenement=self.evenement)
        second = DemandeParticipationEvenement.objects.create(utilisateur=self.autre_citoyen, evenement=self.evenement)

        self.client.force_authenticate(self.organisateur)
        for participation in (first, second):
            response = self.client.post(
                f"/api/participations/evenements/{participation.id}/traiter/",
                {"action": "accepter"},
                format="json",
            )
            if response.status_code == status.HTTP_409_CONFLICT:
                break
            self.assertEqual(response.status_code, status.HTTP_200_OK)

        accepted_count = DemandeParticipationEvenement.objects.filter(evenement=self.evenement, statut="acceptee").count()
        self.assertLessEqual(accepted_count, self.evenement.capacite)


