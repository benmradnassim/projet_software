"""Tests du module « Gestion des utilisateurs » : un test (au moins) par critère d'acceptation."""
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import Utilisateur

MDP = "MotDePasse-Solide-2026"
INSCRIPTION = "/api/auth/inscription/"
CONNEXION = "/api/auth/connexion/"
RENOUVELER = "/api/auth/renouveler/"
LISTE = "/api/utilisateurs/"
MOI = "/api/utilisateurs/moi/"
MOT_DE_PASSE = "/api/utilisateurs/moi/mot-de-passe/"


def detail(pk):
    return f"/api/utilisateurs/{pk}/"


def statut(pk):
    return f"/api/utilisateurs/{pk}/statut/"


def creer(email, role=Utilisateur.Role.CITOYEN, statut_compte=Utilisateur.Statut.ACTIF, **extra):
    return Utilisateur.objects.create_user(
        email=email, password=MDP, last_name="Nom", prenom="Prenom", role=role, statut=statut_compte, **extra
    )


def sans_mot_de_passe(test, payload):
    """Vérifie récursivement qu'aucune clé ni valeur ne contient le mot de passe ou son hash."""
    texte = str(payload)
    test.assertNotIn("password", texte)
    test.assertNotIn("pbkdf2", texte)
    test.assertNotIn(MDP, texte)


class InscriptionTests(APITestCase):
    """US-UTIL-01 Créer un compte."""

    donnees = {"email": "nour@example.tn", "password": MDP, "nom": "Saada", "prenom": "Nour", "telephone": "+216 20 000 000"}

    def test_creation_reussie_avec_message_role_citoyen_statut_actif_mdp_hache(self):
        reponse = self.client.post(INSCRIPTION, self.donnees, format="json")
        self.assertEqual(reponse.status_code, status.HTTP_201_CREATED)
        self.assertEqual(reponse.data["message"], "Votre compte a été créé avec succès.")
        sans_mot_de_passe(self, reponse.data)
        user = Utilisateur.objects.get(email="nour@example.tn")
        self.assertEqual(user.role, Utilisateur.Role.CITOYEN)
        self.assertEqual(user.statut, Utilisateur.Statut.ACTIF)
        self.assertNotEqual(user.password, MDP)
        self.assertTrue(user.check_password(MDP))
        self.assertEqual(user.telephone, "+216 20 000 000")

    def test_telephone_optionnel(self):
        donnees = {k: v for k, v in self.donnees.items() if k != "telephone"}
        self.assertEqual(self.client.post(INSCRIPTION, donnees, format="json").status_code, status.HTTP_201_CREATED)

    def test_champs_obligatoires(self):
        reponse = self.client.post(INSCRIPTION, {}, format="json")
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)
        for champ in ("email", "password", "nom", "prenom"):
            self.assertIn(champ, reponse.data)

    def test_email_format_invalide(self):
        reponse = self.client.post(INSCRIPTION, {**self.donnees, "email": "pas-un-email"}, format="json")
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", reponse.data)

    def test_email_deja_utilise(self):
        creer("nour@example.tn")
        reponse = self.client.post(INSCRIPTION, {**self.donnees, "email": "Nour@Example.tn"}, format="json")
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(str(reponse.data["email"][0]), "Adresse e-mail déjà utilisée")

    def test_role_et_statut_imposes_par_le_serveur(self):
        reponse = self.client.post(INSCRIPTION, {**self.donnees, "role": "admin", "statut": "suspendu"}, format="json")
        self.assertEqual(reponse.status_code, status.HTTP_201_CREATED)
        user = Utilisateur.objects.get(email="nour@example.tn")
        self.assertEqual(user.role, Utilisateur.Role.CITOYEN)
        self.assertEqual(user.statut, Utilisateur.Statut.ACTIF)

    def test_mot_de_passe_trop_faible_refuse(self):
        reponse = self.client.post(INSCRIPTION, {**self.donnees, "password": "123"}, format="json")
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", reponse.data)


class ProfilTests(APITestCase):
    """US-UTIL-04 Consulter son profil / US-UTIL-05 Modifier son profil."""

    def setUp(self):
        self.user = creer("moi@example.tn")
        self.autre = creer("autre@example.tn")
        self.client.force_authenticate(self.user)

    def test_consulter_son_profil_sans_mot_de_passe(self):
        reponse = self.client.get(MOI)
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(reponse.data["email"], "moi@example.tn")
        for champ in ("nom", "prenom", "telephone", "role", "statut", "date_inscription"):
            self.assertIn(champ, reponse.data)
        sans_mot_de_passe(self, reponse.data)

    def test_profil_refuse_sans_authentification(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(MOI).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_acces_refuse_au_profil_d_un_autre_utilisateur(self):
        self.assertEqual(self.client.get(detail(self.autre.pk)).status_code, status.HTTP_403_FORBIDDEN)

    def test_modifier_son_profil_avec_message(self):
        reponse = self.client.patch(MOI, {"nom": "Ben Ali", "prenom": "Sami", "telephone": "55 555 555", "email": "nouveau@example.tn"}, format="json")
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(reponse.data["message"], "Profil mis à jour avec succès.")
        sans_mot_de_passe(self, reponse.data)
        self.user.refresh_from_db()
        self.assertEqual((self.user.last_name, self.user.prenom, self.user.email), ("Ben Ali", "Sami", "nouveau@example.tn"))

    def test_role_statut_date_inscription_non_modifiables(self):
        date_avant = self.user.date_inscription
        self.client.patch(MOI, {"role": "admin", "statut": "desactive", "date_inscription": "2000-01-01T00:00:00Z", "is_staff": True}, format="json")
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, Utilisateur.Role.CITOYEN)
        self.assertEqual(self.user.statut, Utilisateur.Statut.ACTIF)
        self.assertEqual(self.user.date_inscription, date_avant)
        self.assertFalse(self.user.is_staff)

    def test_nouvel_email_deja_utilise_refuse(self):
        reponse = self.client.patch(MOI, {"email": "autre@example.tn"}, format="json")
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(str(reponse.data["email"][0]), "Adresse e-mail déjà utilisée")

    def test_conserver_son_propre_email_accepte(self):
        self.assertEqual(self.client.patch(MOI, {"email": "moi@example.tn"}, format="json").status_code, status.HTTP_200_OK)


class MotDePasseTests(APITestCase):
    """US-UTIL-06 Modifier son mot de passe."""

    nouveau = "Nouveau-Secret-2027"

    def setUp(self):
        self.user = creer("moi@example.tn")
        self.client.force_authenticate(self.user)

    def envoyer(self, ancien=MDP, nouveau=None, confirmation=None):
        nouveau = nouveau or self.nouveau
        return self.client.post(MOT_DE_PASSE, {"ancien_mot_de_passe": ancien, "nouveau_mot_de_passe": nouveau, "confirmation": confirmation or nouveau}, format="json")

    def test_changement_reussi(self):
        reponse = self.envoyer()
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(reponse.data["message"], "Mot de passe modifié avec succès.")
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(self.nouveau))

    def test_ancien_mot_de_passe_obligatoire(self):
        reponse = self.client.post(MOT_DE_PASSE, {"nouveau_mot_de_passe": self.nouveau, "confirmation": self.nouveau}, format="json")
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("ancien_mot_de_passe", reponse.data)

    def test_ancien_mot_de_passe_faux(self):
        reponse = self.envoyer(ancien="faux")
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("ancien_mot_de_passe", reponse.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(MDP))

    def test_confirmation_differente(self):
        reponse = self.envoyer(confirmation="Autre-Chose-2027")
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("confirmation", reponse.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(MDP))

    def test_nouveau_mot_de_passe_non_conforme(self):
        reponse = self.envoyer(nouveau="1234", confirmation="1234")
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("nouveau_mot_de_passe", reponse.data)


class AdministrationTests(APITestCase):
    """US-UTIL-16 Liste des comptes / US-UTIL-17 Détail d'un compte (Admin)."""

    def setUp(self):
        self.admin = creer("admin@example.tn", role=Utilisateur.Role.ADMIN)
        self.citoyen = creer("citoyen@example.tn")
        self.orga = creer("orga@example.tn", role=Utilisateur.Role.ORGANISATEUR)
        self.suspendu = creer("suspendu@example.tn", statut_compte=Utilisateur.Statut.SUSPENDU)

    def emails(self, reponse):
        return {u["email"] for u in reponse.data["results"]}

    def test_liste_admin_sans_mot_de_passe(self):
        self.client.force_authenticate(self.admin)
        reponse = self.client.get(LISTE)
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(reponse.data["count"], 4)
        sans_mot_de_passe(self, reponse.data)

    def test_liste_filtree_par_role(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.emails(self.client.get(LISTE, {"role": "organisateur"})), {"orga@example.tn"})

    def test_liste_filtree_par_statut(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.emails(self.client.get(LISTE, {"statut": "suspendu"})), {"suspendu@example.tn"})

    def test_liste_filtree_par_role_et_statut(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.emails(self.client.get(LISTE, {"role": "citoyen", "statut": "actif"})), {"citoyen@example.tn"})

    def test_liste_refusee_aux_non_admins(self):
        for user in (self.citoyen, self.orga):
            self.client.force_authenticate(user)
            self.assertEqual(self.client.get(LISTE).status_code, status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(LISTE).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_staff_considere_comme_admin(self):
        staff = creer("staff@example.tn", is_staff=True)
        self.client.force_authenticate(staff)
        self.assertEqual(self.client.get(LISTE).status_code, status.HTTP_200_OK)

    def test_detail_admin_sans_mot_de_passe(self):
        self.client.force_authenticate(self.admin)
        reponse = self.client.get(detail(self.citoyen.pk))
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(reponse.data["email"], "citoyen@example.tn")
        sans_mot_de_passe(self, reponse.data)

    def test_detail_compte_introuvable(self):
        self.client.force_authenticate(self.admin)
        reponse = self.client.get(detail(999999))
        self.assertEqual(reponse.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(str(reponse.data["detail"]), "Compte introuvable")

    def test_detail_refuse_aux_non_admins(self):
        self.client.force_authenticate(self.citoyen)
        self.assertEqual(self.client.get(detail(self.orga.pk)).status_code, status.HTTP_403_FORBIDDEN)

    def test_aucune_suppression_physique(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.delete(detail(self.citoyen.pk)).status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertTrue(Utilisateur.objects.filter(pk=self.citoyen.pk).exists())


class StatutTests(APITestCase):
    """US-UTIL-18 Changer le statut d'un compte (suspension, réactivation, désactivation logique)."""

    def setUp(self):
        self.admin = creer("admin@example.tn", role=Utilisateur.Role.ADMIN)
        self.cible = creer("cible@example.tn")
        self.client.force_authenticate(self.admin)

    def changer(self, pk, statut_compte, confirmation=None):
        donnees = {"statut": statut_compte}
        if confirmation is not None:
            donnees["confirmation"] = confirmation
        return self.client.post(statut(pk), donnees, format="json")

    def connexion(self, email="cible@example.tn"):
        self.client.force_authenticate(None)
        return self.client.post(CONNEXION, {"email": email, "password": MDP}, format="json")

    def test_suspension_exige_une_confirmation(self):
        reponse = self.changer(self.cible.pk, "suspendu")
        self.assertEqual(reponse.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("confirmation", reponse.data)
        self.cible.refresh_from_db()
        self.assertEqual(self.cible.statut, Utilisateur.Statut.ACTIF)

    def test_suspension_confirmee(self):
        reponse = self.changer(self.cible.pk, "suspendu", confirmation=True)
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(reponse.data["message"], "Compte suspendu.")
        sans_mot_de_passe(self, reponse.data)
        self.cible.refresh_from_db()
        self.assertEqual(self.cible.statut, Utilisateur.Statut.SUSPENDU)
        self.assertFalse(self.cible.is_active)

    def test_compte_suspendu_ne_peut_plus_se_connecter(self):
        self.changer(self.cible.pk, "suspendu", confirmation=True)
        reponse = self.connexion()
        self.assertEqual(reponse.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("suspendu", str(reponse.data["detail"]))
        self.assertNotIn("access", reponse.data)

    def test_compte_desactive_ne_peut_plus_se_connecter_et_reste_en_base(self):
        self.assertEqual(self.changer(self.cible.pk, "desactive").status_code, status.HTTP_200_OK)
        self.assertTrue(Utilisateur.objects.filter(pk=self.cible.pk).exists())
        reponse = self.connexion()
        self.assertEqual(reponse.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("désactivé", str(reponse.data["detail"]))

    def test_jetons_existants_rejetes_apres_suspension(self):
        jetons = self.connexion().data
        self.client.force_authenticate(self.admin)
        self.changer(self.cible.pk, "suspendu", confirmation=True)
        self.client.force_authenticate(None)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {jetons['access']}")
        self.assertEqual(self.client.get(MOI).status_code, status.HTTP_401_UNAUTHORIZED)
        self.client.credentials()
        self.assertEqual(self.client.post(RENOUVELER, {"refresh": jetons["refresh"]}, format="json").status_code, status.HTTP_401_UNAUTHORIZED)

    def test_mauvais_mot_de_passe_sur_compte_suspendu_ne_revele_pas_le_statut(self):
        self.changer(self.cible.pk, "suspendu", confirmation=True)
        self.client.force_authenticate(None)
        reponse = self.client.post(CONNEXION, {"email": "cible@example.tn", "password": "faux"}, format="json")
        self.assertEqual(reponse.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertNotIn("suspendu", str(reponse.data["detail"]))

    def test_reactivation(self):
        self.changer(self.cible.pk, "suspendu", confirmation=True)
        reponse = self.changer(self.cible.pk, "actif")
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertEqual(reponse.data["message"], "Compte réactivé.")
        reponse = self.connexion()
        self.assertEqual(reponse.status_code, status.HTTP_200_OK)
        self.assertIn("access", reponse.data)

    def test_admin_ne_peut_pas_modifier_son_propre_statut(self):
        reponse = self.changer(self.admin.pk, "desactive")
        self.assertEqual(reponse.status_code, status.HTTP_403_FORBIDDEN)
        self.admin.refresh_from_db()
        self.assertEqual(self.admin.statut, Utilisateur.Statut.ACTIF)

    def test_statut_invalide(self):
        self.assertEqual(self.changer(self.cible.pk, "inconnu").status_code, status.HTTP_400_BAD_REQUEST)

    def test_compte_introuvable(self):
        reponse = self.changer(999999, "actif")
        self.assertEqual(reponse.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(str(reponse.data["detail"]), "Compte introuvable")

    def test_changement_de_statut_refuse_aux_non_admins(self):
        autre = creer("autre@example.tn", role=Utilisateur.Role.ORGANISATEUR)
        self.client.force_authenticate(autre)
        self.assertEqual(self.changer(self.cible.pk, "desactive").status_code, status.HTTP_403_FORBIDDEN)
        self.cible.refresh_from_db()
        self.assertEqual(self.cible.statut, Utilisateur.Statut.ACTIF)
