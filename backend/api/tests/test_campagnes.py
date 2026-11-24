"""Tests du module « Gestion des campagnes » (backend/api/components/campagne)."""
from datetime import date, timedelta

from rest_framework import status
from rest_framework.test import APITestCase

from api.models import Campagne, Utilisateur

MDP = "MotDePasse2026!"
URL = "/api/campagnes/"


def donnees_campagne(**extra):
    debut = date.today()
    data = {
        "titre": "Un cartable pour chaque rêve",
        "description": "Fournitures scolaires pour 120 enfants.",
        "categorie": "Éducation",
        "ville": "Sfax",
        "date_debut": debut.isoformat(),
        "date_fin": (debut + timedelta(days=30)).isoformat(),
        "objectif_montant": "12000.000",
        "besoins": [["Cartables", "40"]],
        "point_collecte": "Local Main dans la Main, Sfax",
    }
    data.update(extra)
    return data


class CampagnesTests(APITestCase):
    def setUp(self):
        self.orga = Utilisateur.objects.create_user(email="orga@x.tn", password=MDP, role="organisateur")
        self.autre_orga = Utilisateur.objects.create_user(email="orga2@x.tn", password=MDP, role="organisateur")
        self.citoyen = Utilisateur.objects.create_user(email="cit@x.tn", password=MDP, role="citoyen")
        self.admin = Utilisateur.objects.create_user(email="admin@x.tn", password=MDP, role="admin")

    def creer(self, organisateur=None, statut=Campagne.Statut.BROUILLON, **extra):
        data = donnees_campagne(**extra)
        data.pop("besoins")
        return Campagne.objects.create(
            organisateur=organisateur or self.orga,
            statut=statut,
            besoins=[["Cartables", "40"]],
            **{**data, "date_debut": date.fromisoformat(data["date_debut"]), "date_fin": date.fromisoformat(data["date_fin"])},
        )

    # ---------- création ----------
    def test_organisateur_cree_un_brouillon(self):
        self.client.force_authenticate(self.orga)
        r = self.client.post(URL, donnees_campagne(statut="en_cours"), format="json")
        self.assertEqual(r.status_code, status.HTTP_201_CREATED, r.data)
        c = Campagne.objects.get(pk=r.data["id"])
        self.assertEqual(c.statut, Campagne.Statut.BROUILLON)  # le statut envoyé est ignoré
        self.assertEqual(c.organisateur, self.orga)
        self.assertEqual(c.besoins, [["Cartables", "40"]])
        self.assertEqual(c.ville, "Sfax")

    def test_citoyen_admin_et_visiteur_ne_creent_pas(self):
        for user in (self.citoyen, self.admin):
            self.client.force_authenticate(user)
            r = self.client.post(URL, donnees_campagne(), format="json")
            self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN, user.role)
        self.client.force_authenticate(None)
        r = self.client.post(URL, donnees_campagne(), format="json")
        self.assertIn(r.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_organisateur_suspendu_ne_cree_pas(self):
        self.orga.statut = "suspendu"
        self.orga.save()
        self.client.force_authenticate(self.orga)
        r = self.client.post(URL, donnees_campagne(), format="json")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_validations(self):
        self.client.force_authenticate(self.orga)
        r = self.client.post(URL, donnees_campagne(objectif_montant="0"), format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("objectif_montant", r.data)
        debut = date.today()
        r = self.client.post(URL, donnees_campagne(date_fin=(debut - timedelta(days=1)).isoformat()), format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("date_fin", r.data)
        r = self.client.post(URL, donnees_campagne(titre="   "), format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    # ---------- visibilité ----------
    def test_visiteur_ne_voit_que_les_campagnes_en_cours(self):
        self.creer(statut=Campagne.Statut.BROUILLON, titre="Brouillon")
        self.creer(statut=Campagne.Statut.EN_COURS, titre="Publiée")
        r = self.client.get(URL)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual([c["titre"] for c in r.data["results"]], ["Publiée"])

    def test_admin_voit_toutes_les_campagnes(self):
        self.creer(statut=Campagne.Statut.BROUILLON)
        self.creer(statut=Campagne.Statut.EN_COURS)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.get(URL).data["count"], 2)

    def test_mes_campagnes(self):
        self.creer(organisateur=self.orga, titre="À moi")
        self.creer(organisateur=self.autre_orga, statut=Campagne.Statut.EN_COURS, titre="Pas à moi")
        self.client.force_authenticate(self.orga)
        r = self.client.get(URL + "mes-campagnes/")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual([c["titre"] for c in r.data["results"]], ["À moi"])
        self.client.force_authenticate(self.citoyen)
        self.assertEqual(self.client.get(URL + "mes-campagnes/").status_code, status.HTTP_403_FORBIDDEN)

    def test_mes_campagnes_visiteur_refuse_proprement(self):
        r = self.client.get(URL + "mes-campagnes/")
        self.assertIn(r.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    # ---------- modification ----------
    def test_organisateur_modifie_sa_campagne_mais_pas_celle_des_autres(self):
        mienne = self.creer()
        autre = self.creer(organisateur=self.autre_orga, statut=Campagne.Statut.EN_COURS)
        self.client.force_authenticate(self.orga)
        r = self.client.patch(f"{URL}{mienne.id}/", {"titre": "Nouveau titre"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.data)
        mienne.refresh_from_db()
        self.assertEqual(mienne.titre, "Nouveau titre")
        r = self.client.patch(f"{URL}{autre.id}/", {"titre": "Piratage"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_modifie_une_campagne(self):
        c = self.creer(statut=Campagne.Statut.EN_COURS)
        self.client.force_authenticate(self.admin)
        r = self.client.patch(f"{URL}{c.id}/", {"ville": "Tunis"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.data)

    # ---------- publier / clôturer ----------
    def test_publier_puis_cloturer(self):
        c = self.creer()
        self.client.force_authenticate(self.orga)
        r = self.client.post(f"{URL}{c.id}/publier/")
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.data)
        c.refresh_from_db()
        self.assertEqual(c.statut, Campagne.Statut.EN_COURS)
        self.assertEqual(self.client.post(f"{URL}{c.id}/publier/").status_code, status.HTTP_400_BAD_REQUEST)
        r = self.client.post(f"{URL}{c.id}/cloturer/")
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.data)
        c.refresh_from_db()
        self.assertEqual(c.statut, Campagne.Statut.CLOTUREE)

    def test_cloturer_un_brouillon_est_refuse(self):
        c = self.creer()
        self.client.force_authenticate(self.orga)
        self.assertEqual(self.client.post(f"{URL}{c.id}/cloturer/").status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_et_autre_organisateur_ne_publient_pas(self):
        c = self.creer()
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post(f"{URL}{c.id}/publier/").status_code, status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(self.autre_orga)
        self.assertIn(self.client.post(f"{URL}{c.id}/publier/").status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))

    # ---------- suppression ----------
    def test_organisateur_supprime_seulement_ses_brouillons(self):
        brouillon = self.creer()
        en_cours = self.creer(statut=Campagne.Statut.EN_COURS)
        self.client.force_authenticate(self.orga)
        self.assertEqual(self.client.delete(f"{URL}{brouillon.id}/").status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.client.delete(f"{URL}{en_cours.id}/").status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Campagne.objects.filter(pk=en_cours.id).exists())

    def test_admin_supprime_une_campagne_en_cours(self):
        c = self.creer(statut=Campagne.Statut.EN_COURS)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.delete(f"{URL}{c.id}/").status_code, status.HTTP_204_NO_CONTENT)
