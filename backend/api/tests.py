from datetime import timedelta
from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import DemandeParticipationEvenement, Evenement, Utilisateur


class EvenementCrudPermissionTests(APITestCase):
    def setUp(self):
        self.citizen = self.make_user("citizen@example.test", "citoyen")
        self.other_citizen = self.make_user("other@example.test", "citoyen")
        self.organizer = self.make_user("organizer@example.test", "organisateur")
        self.other_organizer = self.make_user("other-organizer@example.test", "organisateur")
        self.admin = self.make_user("admin@example.test", "admin")
        self.published = self.make_event(self.organizer, "Published")
        self.other_published = self.make_event(self.other_organizer, "Other public event")
        self.own_cancelled = self.make_event(
            self.organizer, "Own cancelled", Evenement.Statut.ANNULE
        )
        self.other_cancelled = self.make_event(
            self.other_organizer, "Other cancelled", Evenement.Statut.ANNULE
        )

    def make_user(self, email, role):
        return Utilisateur.objects.create_user(
            email=email,
            password="M0ubedra-Test-Password!",
            role=role,
        )

    def make_event(self, organizer, title, event_status=Evenement.Statut.PLANIFIE, capacity=2):
        return Evenement.objects.create(
            organisateur=organizer,
            titre=title,
            description="Description",
            date_evenement=timezone.now() + timedelta(days=2),
            lieu="Tunis",
            capacite=capacity,
            statut=event_status,
        )

    def test_organizer_can_upload_event_image(self):
        self.client.force_authenticate(self.organizer)
        image_content = BytesIO()
        Image.new("RGB", (1, 1), color="green").save(image_content, format="PNG")
        image_content.seek(0)

        response = self.client.post(
            "/api/evenements/",
            {
                "titre": "Atelier de jardinage",
                "description": "Apprendre à planter un arbre.",
                "date_evenement": (timezone.now() + timedelta(days=3)).isoformat(),
                "lieu": "Tunis",
                "capacite": 12,
                "image": SimpleUploadedFile(
                    "atelier.png", image_content.read(), content_type="image/png"
                ),
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        event = Evenement.objects.get(pk=response.data["id"])
        self.addCleanup(event.image.delete, save=False)
        self.assertTrue(event.image.storage.exists(event.image.name))
        self.assertTrue(response.data["image"].endswith(event.image.name))

    def test_public_and_citizen_lists_only_published_events(self):
        response = self.client.get("/api/evenements/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            {event["id"] for event in response.data["results"]},
            {self.published.id, self.other_published.id},
        )

        self.client.force_authenticate(self.citizen)
        response = self.client.get("/api/evenements/")
        self.assertEqual(
            {event["id"] for event in response.data["results"]},
            {self.published.id, self.other_published.id},
        )
        self.assertEqual(
            self.client.get(f"/api/evenements/{self.own_cancelled.id}/").status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_citizen_cannot_create_edit_or_delete_events(self):
        self.client.force_authenticate(self.citizen)
        payload = {
            "titre": "Citizen event",
            "description": "Not allowed",
            "date_evenement": (timezone.now() + timedelta(days=3)).isoformat(),
            "lieu": "Sfax",
            "capacite": 10,
        }
        self.assertEqual(
            self.client.post("/api/evenements/", payload).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.patch(
                f"/api/evenements/{self.published.id}/", {"titre": "Changed"}
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.delete(f"/api/evenements/{self.published.id}/").status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_organizer_manages_only_owned_events_and_search_works(self):
        self.client.force_authenticate(self.organizer)
        response = self.client.get("/api/evenements/?search=Published")
        self.assertEqual(
            {event["id"] for event in response.data["results"]},
            {self.published.id},
        )
        response = self.client.get("/api/evenements/?statut=annule")
        self.assertEqual(
            {event["id"] for event in response.data["results"]},
            {self.own_cancelled.id},
        )
        response = self.client.get("/api/evenements/")
        self.assertEqual(
            {event["id"] for event in response.data["results"]},
            {self.published.id, self.other_published.id, self.own_cancelled.id},
        )

        payload = {
            "titre": "Organizer event",
            "description": "Created by organizer",
            "date_evenement": (timezone.now() + timedelta(days=3)).isoformat(),
            "lieu": "Sousse",
            "capacite": 12,
            "organisateur": self.other_organizer.id,
        }
        created = self.client.post("/api/evenements/", payload)
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        created_event = Evenement.objects.get(pk=created.data["id"])
        self.assertEqual(created_event.organisateur_id, self.organizer.id)

        updated = self.client.patch(
            f"/api/evenements/{self.own_cancelled.id}/", {"titre": "Updated"}
        )
        self.assertEqual(updated.status_code, status.HTTP_200_OK)
        self.own_cancelled.refresh_from_db()
        self.assertEqual(self.own_cancelled.titre, "Updated")
        self.assertEqual(
            self.client.patch(
                f"/api/evenements/{self.other_cancelled.id}/", {"titre": "Changed"}
            ).status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(
            self.client.patch(
                f"/api/evenements/{self.other_published.id}/", {"titre": "Changed"}
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.delete(f"/api/evenements/{self.other_cancelled.id}/").status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(
            self.client.delete(f"/api/evenements/{self.other_published.id}/").status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.delete(f"/api/evenements/{created_event.id}/").status_code,
            status.HTTP_204_NO_CONTENT,
        )

    def test_admin_can_view_events_but_cannot_manage_them(self):
        self.client.force_authenticate(self.admin)
        listed = self.client.get("/api/evenements/")
        self.assertEqual(listed.status_code, status.HTTP_200_OK)
        self.assertEqual(
            {event["id"] for event in listed.data["results"]},
            {self.published.id, self.other_published.id, self.own_cancelled.id, self.other_cancelled.id},
        )
        self.assertEqual(
            self.client.patch(
                f"/api/evenements/{self.other_cancelled.id}/", {"statut": "termine"}
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.delete(f"/api/evenements/{self.own_cancelled.id}/").status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.post(
                "/api/evenements/",
                {
                    "titre": "Admin event",
                    "description": "Not allowed",
                    "date_evenement": (timezone.now() + timedelta(days=3)).isoformat(),
                    "lieu": "Tunis",
                    "capacite": 10,
                },
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_authenticated_user_endpoint_supports_frontend_session(self):
        response = self.client.post(
            "/api/auth/connexion/",
            {"email": self.citizen.email, "password": "M0ubedra-Test-Password!"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        profile = self.client.get("/api/utilisateurs/moi/")
        self.assertEqual(profile.status_code, status.HTTP_200_OK)
        self.assertEqual(profile.data["id"], self.citizen.id)


class EvenementParticipationTests(APITestCase):
    def setUp(self):
        self.citizen = Utilisateur.objects.create_user(
            email="participant@example.test", password="M0ubedra-Test-Password!", role="citoyen"
        )
        self.second_citizen = Utilisateur.objects.create_user(
            email="participant2@example.test", password="M0ubedra-Test-Password!", role="citoyen"
        )
        self.organizer = Utilisateur.objects.create_user(
            email="event-organizer@example.test",
            password="M0ubedra-Test-Password!",
            role="organisateur",
        )
        self.admin = Utilisateur.objects.create_user(
            email="event-admin@example.test",
            password="M0ubedra-Test-Password!",
            role="admin",
        )
        self.other_organizer = Utilisateur.objects.create_user(
            email="other-event-organizer@example.test",
            password="M0ubedra-Test-Password!",
            role="organisateur",
        )
        self.unrelated_organizer = Utilisateur.objects.create_user(
            email="unrelated-event-organizer@example.test",
            password="M0ubedra-Test-Password!",
            role="organisateur",
        )
        self.event = Evenement.objects.create(
            organisateur=self.organizer,
            titre="Accessible walk",
            description="",
            date_evenement=timezone.now() + timedelta(days=2),
            lieu="Tunis",
            capacite=1,
        )
        self.other_event = Evenement.objects.create(
            organisateur=self.other_organizer,
            titre="Community garden",
            description="",
            date_evenement=timezone.now() + timedelta(days=3),
            lieu="Sfax",
            capacite=2,
        )

    def test_qr_is_created_only_on_acceptance_and_capacity_is_enforced(self):
        self.client.force_authenticate(self.citizen)
        first = self.client.post(
            "/api/participations/evenements/",
            {"evenement": self.event.id, "type": "benevole"},
        )
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        first_id = first.data["id"]
        first_record = DemandeParticipationEvenement.objects.get(pk=first_id)
        self.assertIsNone(first_record.code_qr)
        self.assertIsNone(first.data["code_qr"])

        self.client.force_authenticate(self.second_citizen)
        second = self.client.post(
            "/api/participations/evenements/",
            {"evenement": self.event.id, "type": "benevole"},
        )
        self.assertEqual(second.status_code, status.HTTP_201_CREATED)

        self.client.force_authenticate(self.organizer)
        accepted = self.client.post(
            f"/api/participations/evenements/{first_id}/traiter/",
            {"action": "accepter"},
        )
        self.assertEqual(accepted.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(accepted.data["code_qr"])
        first_record.refresh_from_db()
        self.assertEqual(first_record.statut, DemandeParticipationEvenement.Statut.ACCEPTEE)
        self.assertIsNotNone(first_record.code_qr)

        self.assertEqual(
            self.client.post(
                f"/api/participations/evenements/{second.data['id']}/traiter/",
                {"action": "accepter"},
            ).status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.client.force_authenticate(self.citizen)
        qr_response = self.client.get(
            f"/api/participations/evenements/{first_id}/qr_code/"
        )
        self.assertEqual(qr_response.status_code, status.HTTP_200_OK)
        self.assertEqual(qr_response.data["code_qr"], str(first_record.code_qr))
        self.client.force_authenticate(self.second_citizen)
        self.assertEqual(
            self.client.get(f"/api/participations/evenements/{first_id}/").status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.client.force_authenticate(self.second_citizen)
        self.assertEqual(
            self.client.get(
                f"/api/participations/evenements/{second.data['id']}/qr_code/"
            ).status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.client.force_authenticate(self.organizer)
        verified = self.client.post(
            "/api/participations/evenements/verify-qr/",
            {"code_qr": str(first_record.code_qr)},
        )
        self.assertEqual(verified.status_code, status.HTTP_200_OK)
        self.assertTrue(verified.data["valide"])

    def test_organizers_can_join_other_events_but_not_their_own(self):
        self.client.force_authenticate(self.organizer)
        own_request = self.client.post(
            "/api/participations/evenements/",
            {"evenement": self.event.id, "type": "benevole"},
        )
        self.assertEqual(own_request.status_code, status.HTTP_403_FORBIDDEN)

        other_request = self.client.post(
            "/api/participations/evenements/",
            {"evenement": self.other_event.id, "type": "benevole"},
        )
        self.assertEqual(other_request.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            self.client.get(
                f"/api/participations/evenements/{other_request.data['id']}/"
            ).status_code,
            status.HTTP_200_OK,
        )

        self.client.force_authenticate(self.other_organizer)
        self.assertEqual(
            self.client.get(
                f"/api/participations/evenements/{other_request.data['id']}/"
            ).status_code,
            status.HTTP_200_OK,
        )

        self.client.force_authenticate(self.unrelated_organizer)
        self.assertEqual(
            self.client.get(
                f"/api/participations/evenements/{other_request.data['id']}/"
            ).status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_event_organizer_can_still_review_requests_for_their_events(self):
        self.client.force_authenticate(self.citizen)
        request = self.client.post(
            "/api/participations/evenements/",
            {"evenement": self.event.id, "type": "benevole"},
        )
        self.assertEqual(request.status_code, status.HTTP_201_CREATED)

        self.client.force_authenticate(self.organizer)
        response = self.client.get(
            f"/api/participations/evenements/{request.data['id']}/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_cannot_manage_event_participations_or_qr_codes(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(
            self.client.get("/api/participations/evenements/").status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.post(
                "/api/participations/evenements/verify-qr/",
                {"code_qr": "00000000-0000-0000-0000-000000000000"},
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )
