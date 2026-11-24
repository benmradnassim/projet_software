"""Tests du module « Signalements » (backend/api/components/signalement)."""
from datetime import date, timedelta

from rest_framework import status
from rest_framework.test import APITestCase

from api.models import Campagne, Signalement, Utilisateur

MDP = "MotDePasse2026!"
URL = "/api/signalements/"


class SignalementsTests(APITestCase):
    def setUp(self):
        self.citoyen = Utilisateur.objects.create_user(email="cit@x.tn", password=MDP, role="citoyen")
        self.autre_citoyen = Utilisateur.objects.create_user(email="cit2@x.tn", password=MDP, role="citoyen")
        self.orga = Utilisateur.objects.create_user(email="orga@x.tn", password=MDP, role="organisateur")
        self.autre_orga = Utilisateur.objects.create_user(email="orga2@x.tn", password=MDP, role="organisateur")
        self.admin = Utilisateur.objects.create_user(email="admin@x.tn", password=MDP, role="admin")
        self.campagne_orga = self.campagne(self.orga)
        self.campagne_autre = self.campagne(self.autre_orga)

    def campagne(self, organisateur):
        return Campagne.objects.create(
            organisateur=organisateur,
            titre="Campagne",
            description="Description",
            categorie="Éducation",
            date_debut=date.today(),
            date_fin=date.today() + timedelta(days=30),
            objectif_montant="1000.000",
            statut=Campagne.Statut.EN_COURS,
        )

    def signalement(self, declarant, **extra):
        return Signalement.objects.create(declarant=declarant, type="campagne", description="Contenu trompeur", **extra)

    # ---------- création ----------
    def test_citoyen_cree_un_signalement(self):
        self.client.force_authenticate(self.citoyen)
        r = self.client.post(
            URL,
            {"type": "campagne", "campagne": self.campagne_orga.id, "description": "Demande de virement hors plateforme.", "statut": "resolu", "declarant": self.autre_citoyen.id},
            format="json",
        )
        self.assertEqual(r.status_code, status.HTTP_201_CREATED, r.data)
        s = Signalement.objects.get(pk=r.data["id"])
        self.assertEqual(s.declarant, self.citoyen)  # le déclarant est imposé par le serveur
        self.assertEqual(s.statut, Signalement.Statut.EN_ATTENTE)  # le statut envoyé est ignoré
        self.assertEqual(r.data["declarant_nom"], "cit@x.tn")

    def test_visiteur_ne_peut_ni_lire_ni_creer(self):
        self.assertIn(self.client.get(URL).status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))
        r = self.client.post(URL, {"type": "autre", "description": "x"}, format="json")
        self.assertIn(r.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    # ---------- visibilité ----------
    def test_citoyen_ne_voit_que_ses_signalements(self):
        mien = self.signalement(self.citoyen)
        self.signalement(self.autre_citoyen)
        self.client.force_authenticate(self.citoyen)
        ids = [s["id"] for s in self.client.get(URL).data["results"]]
        self.assertEqual(ids, [mien.id])

    def test_admin_voit_tous_les_signalements(self):
        self.signalement(self.citoyen)
        self.signalement(self.autre_citoyen)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.get(URL).data["count"], 2)

    def test_organisateur_voit_les_signalements_sur_ses_contenus(self):
        sur_ma_campagne = self.signalement(self.citoyen, campagne=self.campagne_orga)
        self.signalement(self.citoyen, campagne=self.campagne_autre)
        declare_par_moi = self.signalement(self.orga)
        self.client.force_authenticate(self.orga)
        ids = {s["id"] for s in self.client.get(URL).data["results"]}
        self.assertEqual(ids, {sur_ma_campagne.id, declare_par_moi.id})

    # ---------- modification / annulation ----------
    def test_statut_non_modifiable_par_le_declarant(self):
        s = self.signalement(self.citoyen)
        self.client.force_authenticate(self.citoyen)
        r = self.client.patch(f"{URL}{s.id}/", {"statut": "resolu", "description": "Précision"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.data)
        s.refresh_from_db()
        self.assertEqual(s.statut, Signalement.Statut.EN_ATTENTE)
        self.assertEqual(s.description, "Précision")

    def test_annulation_d_un_signalement_en_attente(self):
        s = self.signalement(self.citoyen)
        self.client.force_authenticate(self.citoyen)
        self.assertEqual(self.client.delete(f"{URL}{s.id}/").status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Signalement.objects.filter(pk=s.id).exists())

    def test_annulation_refusee_si_deja_traite(self):
        s = self.signalement(self.citoyen, statut=Signalement.Statut.RESOLU)
        self.client.force_authenticate(self.citoyen)
        self.assertEqual(self.client.delete(f"{URL}{s.id}/").status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Signalement.objects.filter(pk=s.id).exists())

    def test_on_ne_peut_pas_annuler_le_signalement_d_un_autre(self):
        s = self.signalement(self.autre_citoyen)
        self.client.force_authenticate(self.citoyen)
        self.assertEqual(self.client.delete(f"{URL}{s.id}/").status_code, status.HTTP_404_NOT_FOUND)

    # ---------- traitement par l'admin ----------
    def test_admin_retire_un_contenu(self):
        s = self.signalement(self.citoyen)
        self.client.force_authenticate(self.admin)
        r = self.client.post(f"{URL}{s.id}/traiter/", {"decision": "retirer"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.data)
        s.refresh_from_db()
        self.assertEqual(s.statut, Signalement.Statut.RESOLU)
        self.assertEqual(s.traite_par, self.admin)
        self.assertIsNotNone(s.date_traitement)

    def test_admin_classe_sans_suite(self):
        s = self.signalement(self.citoyen)
        self.client.force_authenticate(self.admin)
        r = self.client.patch(f"{URL}{s.id}/traiter/", {"decision": "classer"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_200_OK, r.data)
        s.refresh_from_db()
        self.assertEqual(s.statut, Signalement.Statut.REJETE)

    def test_decision_invalide(self):
        s = self.signalement(self.citoyen)
        self.client.force_authenticate(self.admin)
        r = self.client.post(f"{URL}{s.id}/traiter/", {"decision": "supprimer"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_seul_l_admin_traite(self):
        s = self.signalement(self.citoyen, campagne=self.campagne_orga)
        for user in (self.citoyen, self.orga):
            self.client.force_authenticate(user)
            r = self.client.post(f"{URL}{s.id}/traiter/", {"decision": "retirer"}, format="json")
            self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN, user.role)
        s.refresh_from_db()
        self.assertEqual(s.statut, Signalement.Statut.EN_ATTENTE)
