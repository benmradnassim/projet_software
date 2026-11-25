"""Tests de l'envoi de photo d'une campagne (POST /api/campagnes/<id>/photo/)."""
import io
import shutil
import tempfile
from datetime import date, timedelta

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import Campagne, Utilisateur
from api.serializers.campagne import CampagnePhotoSerializer

MDP = "MotDePasse2026!"
MEDIA_TEST = tempfile.mkdtemp(prefix="moubedra-media-")


def image(nom="photo.jpg", fmt="JPEG", taille=(40, 30)):
    buf = io.BytesIO()
    Image.new("RGB", taille, (200, 120, 40)).save(buf, fmt)
    return SimpleUploadedFile(nom, buf.getvalue(), content_type=f"image/{fmt.lower()}")


@override_settings(MEDIA_ROOT=MEDIA_TEST)
class CampagnePhotoTests(APITestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA_TEST, ignore_errors=True)

    def setUp(self):
        self.orga = Utilisateur.objects.create_user(email="orga@x.tn", password=MDP, role="organisateur")
        self.autre_orga = Utilisateur.objects.create_user(email="orga2@x.tn", password=MDP, role="organisateur")
        self.citoyen = Utilisateur.objects.create_user(email="cit@x.tn", password=MDP, role="citoyen")
        self.admin = Utilisateur.objects.create_user(email="admin@x.tn", password=MDP, role="admin")
        self.campagne = Campagne.objects.create(
            organisateur=self.orga,
            titre="Campagne",
            description="Description",
            categorie="Éducation",
            date_debut=date.today(),
            date_fin=date.today() + timedelta(days=30),
            objectif_montant="1000.000",
            image="http://localhost:5173/media/covers/education.webp",
        )
        self.url = f"/api/campagnes/{self.campagne.id}/photo/"

    def envoyer(self, user, fichier):
        self.client.force_authenticate(user)
        return self.client.post(self.url, {"photo": fichier}, format="multipart")

    def test_organisateur_envoie_une_photo(self):
        r = self.envoyer(self.orga, image())
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.data)
        self.campagne.refresh_from_db()
        self.assertTrue(self.campagne.photo.name.startswith("campagnes/"))
        # `image` (lu par le front) pointe maintenant vers la photo envoyée
        self.assertTrue(r.data["image"].startswith("http://testserver/media/campagnes/"), r.data["image"])
        self.assertEqual(self.campagne.image, r.data["image"])

    def test_png_et_webp_acceptes(self):
        for nom, fmt in (("a.png", "PNG"), ("b.webp", "WEBP")):
            r = self.envoyer(self.orga, image(nom, fmt))
            self.assertEqual(r.status_code, status.HTTP_200_OK, (fmt, r.data))

    def test_remplacement_supprime_l_ancien_fichier(self):
        self.envoyer(self.orga, image("un.jpg"))
        self.campagne.refresh_from_db()
        ancien = self.campagne.photo.name
        storage = self.campagne.photo.storage
        self.assertTrue(storage.exists(ancien))
        self.envoyer(self.orga, image("deux.jpg"))
        self.campagne.refresh_from_db()
        self.assertNotEqual(self.campagne.photo.name, ancien)
        self.assertFalse(storage.exists(ancien))

    def test_fichier_qui_n_est_pas_une_image(self):
        faux = SimpleUploadedFile("photo.jpg", b"pas une image", content_type="image/jpeg")
        r = self.envoyer(self.orga, faux)
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("photo", r.data)

    def test_format_refuse(self):
        r = self.envoyer(self.orga, image("photo.gif", "GIF"))
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("photo", r.data)

    def test_taille_maximale(self):
        ancien = CampagnePhotoSerializer.TAILLE_MAX
        CampagnePhotoSerializer.TAILLE_MAX = 100  # octets : l'image de test est plus grande
        try:
            r = self.envoyer(self.orga, image())
        finally:
            CampagnePhotoSerializer.TAILLE_MAX = ancien
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("5 Mo", str(r.data["photo"]))

    def test_photo_manquante(self):
        self.client.force_authenticate(self.orga)
        r = self.client.post(self.url, {}, format="multipart")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_seul_le_proprietaire_ou_l_admin(self):
        r = self.envoyer(self.citoyen, image())
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)
        r = self.envoyer(self.autre_orga, image())
        # la campagne (brouillon) d'un autre organisateur n'est même pas visible
        self.assertIn(r.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))
        self.client.force_authenticate(None)
        r = self.client.post(self.url, {"photo": image()}, format="multipart")
        self.assertIn(r.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))
        r = self.envoyer(self.admin, image())
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.data)

    def test_photo_non_modifiable_par_le_patch_json(self):
        self.client.force_authenticate(self.orga)
        r = self.client.patch(f"/api/campagnes/{self.campagne.id}/", {"photo": "x.jpg", "titre": "Nouveau"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.data)
        self.campagne.refresh_from_db()
        self.assertFalse(self.campagne.photo)
        self.assertEqual(self.campagne.titre, "Nouveau")
