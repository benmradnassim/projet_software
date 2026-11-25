import uuid
from datetime import timedelta
from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import DemandeParticipationEvenement, Evenement, Utilisateur


def make_image(name="test.png", size=(10, 10)):
    buf = BytesIO()
    Image.new("RGB", size, color="red").save(buf, format="PNG")
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type="image/png")


class EvenementSpecTests(APITestCase):
    def setUp(self):
        self.organisateur = Utilisateur.objects.create_user(email="orga@test.tn", password="TestPassword2026!", role=Utilisateur.Role.ORGANISATEUR, prenom="Orga", last_name="Nisateur")
        self.other_organisateur = Utilisateur.objects.create_user(email="orga2@test.tn", password="TestPassword2026!", role=Utilisateur.Role.ORGANISATEUR, prenom="Autre", last_name="Orga")
        self.citoyen = Utilisateur.objects.create_user(email="citoyen@test.tn", password="TestPassword2026!", role=Utilisateur.Role.CITOYEN, prenom="Cit", last_name="Oyen")
        self.autre_citoyen = Utilisateur.objects.create_user(email="autre@test.tn", password="TestPassword2026!", role=Utilisateur.Role.CITOYEN)
        self.admin = Utilisateur.objects.create_user(email="admin@test.tn", password="TestPassword2026!", role=Utilisateur.Role.ADMIN, is_staff=True)
        self.event = Evenement.objects.create(
            organisateur=self.organisateur,
            titre="Event planifié",
            description="Desc",
            date_evenement=timezone.now() + timedelta(days=7),
            lieu="Tunis",
            ville="Tunis",
            capacite=2,
            statut=Evenement.Statut.PLANIFIE,
        )

    def test_image_upload_and_size_validation(self):
        self.client.force_authenticate(self.organisateur)
        img = make_image()
        res = self.client.post("/api/evenements/", {
            "titre": "Avec image",
            "description": "d",
            "date_evenement": (timezone.now() + timedelta(days=2)).isoformat(),
            "lieu": "Tunis",
            "ville": "Tunis",
            "capacite": 10,
            "statut": "planifie",
            "image": img,
        }, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data["image"])

        # >5MB valid image
        buf = BytesIO()
        Image.new("RGB", (3000, 3000), color=(255, 0, 0)).save(buf, format="BMP")
        big_content = buf.getvalue()
        if len(big_content) <= 5 * 1024 * 1024:
            big_content = big_content + b"0" * (5 * 1024 * 1024 + 1 - len(big_content))
        big = SimpleUploadedFile("big.bmp", big_content, content_type="image/bmp")
        res2 = self.client.post("/api/evenements/", {
            "titre": "Trop gros",
            "description": "d",
            "date_evenement": (timezone.now() + timedelta(days=2)).isoformat(),
            "lieu": "Tunis",
            "ville": "Tunis",
            "capacite": 10,
            "image": big,
        }, format="multipart")
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("La photo ne peut pas dépasser 5 Mo.", str(res2.data))

    def test_visibility_by_role_and_status(self):
        Evenement.objects.create(organisateur=self.organisateur, titre="Annulé", description="", date_evenement=timezone.now()+timedelta(days=1), lieu="Tunis", ville="Tunis", capacite=5, statut=Evenement.Statut.ANNULE)
        other = Evenement.objects.create(organisateur=self.other_organisateur, titre="Autre org", description="", date_evenement=timezone.now()+timedelta(days=1), lieu="Tunis", ville="Tunis", capacite=5, statut=Evenement.Statut.ANNULE)

        # anonymous sees only planifie
        res = self.client.get("/api/evenements/")
        titles = [r["titre"] for r in res.data["results"]]
        self.assertIn("Event planifié", titles)
        self.assertNotIn("Annulé", titles)

        # citizen sees only planifie
        self.client.force_authenticate(self.citoyen)
        res = self.client.get("/api/evenements/")
        titles = [r["titre"] for r in res.data["results"]]
        self.assertEqual(titles, ["Event planifié"])

        # organizer sees planifie or own
        self.client.force_authenticate(self.organisateur)
        res = self.client.get("/api/evenements/")
        titles = [r["titre"] for r in res.data["results"]]
        self.assertIn("Annulé", titles)
        self.assertNotIn("Autre org", titles)

        # admin sees all
        self.client.force_authenticate(self.admin)
        res = self.client.get("/api/evenements/")
        titles = [r["titre"] for r in res.data["results"]]
        self.assertIn("Autre org", titles)

    def test_citizen_cannot_manage_event(self):
        self.client.force_authenticate(self.citoyen)
        res = self.client.post("/api/evenements/", {
            "titre": "Nope", "description": "", "date_evenement": (timezone.now()+timedelta(days=1)).isoformat(),
            "lieu": "Tunis", "ville": "Tunis", "capacite": 5,
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        res = self.client.patch(f"/api/evenements/{self.event.id}/", {"titre": "X"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_organizer_create_forced_owner_and_search_filter(self):
        self.client.force_authenticate(self.organisateur)
        payload = {
            "titre": "Mon event", "description": "special keyword", "date_evenement": (timezone.now()+timedelta(days=3)).isoformat(),
            "lieu": "Sousse", "ville": "Sousse", "capacite": 20, "organisateur": self.citoyen.id,
        }
        res = self.client.post("/api/evenements/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["organisateur"], self.organisateur.id)

        res = self.client.get("/api/evenements/", {"search": "special"})
        self.assertTrue(any(r["titre"] == "Mon event" for r in res.data["results"]))
        res = self.client.get("/api/evenements/", {"ville": "Sousse"})
        self.assertTrue(all(r["ville"] == "Sousse" for r in res.data["results"]))

    def test_admin_read_only(self):
        self.client.force_authenticate(self.admin)
        res = self.client.get("/api/evenements/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        res = self.client.post("/api/evenements/", {
            "titre": "Admin", "description": "", "date_evenement": (timezone.now()+timedelta(days=1)).isoformat(),
            "lieu": "Tunis", "ville": "Tunis", "capacite": 5,
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        res = self.client.delete(f"/api/evenements/{self.event.id}/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_jwt_me_endpoint(self):
        res = self.client.post("/api/auth/connexion/", {"email": self.citoyen.email, "password": "TestPassword2026!"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        token = res.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        me = self.client.get("/api/utilisateurs/moi/")
        self.assertEqual(me.status_code, status.HTTP_200_OK)
        self.assertEqual(me.data["email"], self.citoyen.email)

    def test_qr_only_on_accept_and_access_verify_rules(self):
        # create participation
        self.client.force_authenticate(self.citoyen)
        res = self.client.post("/api/participations/evenements/", {"evenement": self.event.id, "type": "benevole", "motif": ""}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        pid = res.data["id"]
        self.assertIsNone(res.data["code_qr"])
        p = DemandeParticipationEvenement.objects.get(pk=pid)
        self.assertIsNone(p.code_qr)

        # participant cannot get qr before accept
        res = self.client.get(f"/api/participations/evenements/{pid}/qr_code/")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # accept
        self.client.force_authenticate(self.organisateur)
        res = self.client.post(f"/api/participations/evenements/{pid}/traiter/", {"action": "accepter"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(res.data["code_qr"])
        code = res.data["code_qr"]

        # only participant owner can get QR
        self.client.force_authenticate(self.autre_citoyen)
        res = self.client.get(f"/api/participations/evenements/{pid}/qr_code/")
        self.assertIn(res.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

        self.client.force_authenticate(self.citoyen)
        res = self.client.get(f"/api/participations/evenements/{pid}/qr_code/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["code_qr"], code)
        self.assertEqual(res.data["evenement"], self.event.titre)

        # verify QR owner only
        self.client.force_authenticate(self.other_organisateur)
        res = self.client.post("/api/participations/evenements/verify-qr/", {"code_qr": code}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(res.data["valide"])

        self.client.force_authenticate(self.organisateur)
        res = self.client.post("/api/participations/evenements/verify-qr/", {"code_qr": code}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["valide"])
        self.assertIn("Présence confirmée", res.data["message"])

    def test_organizer_join_other_not_own_and_capacity_atomic(self):
        self.client.force_authenticate(self.organisateur)
        # cannot join own
        res = self.client.post("/api/participations/evenements/", {"evenement": self.event.id, "type": "benevole", "motif": ""}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # can join other's event
        other_event = Evenement.objects.create(organisateur=self.other_organisateur, titre="Autre", description="", date_evenement=timezone.now()+timedelta(days=2), lieu="Sfax", ville="Sfax", capacite=1, statut=Evenement.Statut.PLANIFIE)
        res = self.client.post("/api/participations/evenements/", {"evenement": other_event.id, "type": "benevole", "motif": ""}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # capacity enforced
        self.client.force_authenticate(self.citoyen)
        res = self.client.post("/api/participations/evenements/", {"evenement": other_event.id, "type": "benevole", "motif": ""}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        pid2 = res.data["id"]

        self.client.force_authenticate(self.other_organisateur)
        # accept first (organisateur as participant) - already exists as p1
        p1 = DemandeParticipationEvenement.objects.get(evenement=other_event, utilisateur=self.organisateur)
        res = self.client.post(f"/api/participations/evenements/{p1.id}/traiter/", {"action": "accepter"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        res = self.client.post(f"/api/participations/evenements/{pid2}/traiter/", {"action": "accepter"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_409_CONFLICT)

    def test_admin_denied_on_participations_and_verify(self):
        self.client.force_authenticate(self.citoyen)
        res = self.client.post("/api/participations/evenements/", {"evenement": self.event.id, "type": "benevole", "motif": ""}, format="json")
        pid = res.data["id"]
        self.client.force_authenticate(self.organisateur)
        self.client.post(f"/api/participations/evenements/{pid}/traiter/", {"action": "accepter"}, format="json")
        p = DemandeParticipationEvenement.objects.get(pk=pid)

        self.client.force_authenticate(self.admin)
        res = self.client.get("/api/participations/evenements/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        res = self.client.post("/api/participations/evenements/verify-qr/", {"code_qr": str(p.code_qr)}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_review_permissions(self):
        # citizen sees only own participation
        self.client.force_authenticate(self.citoyen)
        r1 = self.client.post("/api/participations/evenements/", {"evenement": self.event.id, "type": "benevole", "motif": ""}, format="json")
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        pid = r1.data["id"]
        self.client.force_authenticate(self.autre_citoyen)
        r2 = self.client.post("/api/participations/evenements/", {"evenement": self.event.id, "type": "benevole", "motif": ""}, format="json")
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED)

        self.client.force_authenticate(self.citoyen)
        res = self.client.get("/api/participations/evenements/")
        ids = [r["id"] for r in res.data["results"]]
        self.assertEqual(ids, [pid])
        # owner can delete own
        res = self.client.delete(f"/api/participations/evenements/{pid}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        # organizer can safe-read requests for events they own
        self.client.force_authenticate(self.organisateur)
        res = self.client.get("/api/participations/evenements/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(any(r["id"] == r2.data["id"] for r in res.data["results"]))

