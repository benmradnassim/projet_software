"""Tests du module « Gestion des publications » (feature 7) : au moins un test par user story."""
from rest_framework import status
from rest_framework.test import APITestCase

from api.models import Campagne, Commentaire, Like, Publication, Utilisateur

MDP = "MotDePasse-Solide-2026"
PUBLICATIONS = "/api/publications/"
COMMENTAIRES = "/api/commentaires/"
LIKES = "/api/likes/"
FILE = "/api/publications/moderation/"


def pub(pk, suffixe=""):
    return f"/api/publications/{pk}/{suffixe}"


def com(pk, suffixe=""):
    return f"/api/commentaires/{pk}/{suffixe}"


def creer(email, role=Utilisateur.Role.CITOYEN, **extra):
    return Utilisateur.objects.create_user(email=email, password=MDP, last_name="Nom", prenom="Prenom", role=role, **extra)


def resultats(response):
    return response.data["results"] if isinstance(response.data, dict) else response.data


class Base(APITestCase):
    def setUp(self):
        self.citoyen = creer("citoyen@test.tn")
        self.autre = creer("autre@test.tn")
        self.organisateur = creer("orga@test.tn", Utilisateur.Role.ORGANISATEUR)
        self.admin = creer("admin@test.tn", Utilisateur.Role.ADMIN)  # rôle admin, sans is_staff
        self.publication = Publication.objects.create(auteur=self.citoyen, contenu="Merci à tous les bénévoles !", type="thanks")

    def en_tant_que(self, user):
        self.client.force_authenticate(user)


class AjouterPublicationTests(Base):
    """US 7.1"""

    def test_ajout_reussi(self):
        self.en_tant_que(self.citoyen)
        r = self.client.post(PUBLICATIONS, {"contenu": "Belle journée de collecte", "type": "story"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.data["auteur"], self.citoyen.id)
        self.assertEqual(r.data["statut"], "publiee")
        self.assertEqual(r.data["nb_like"], 0)

    def test_ajout_refuse_sans_connexion(self):
        r = self.client.post(PUBLICATIONS, {"contenu": "x"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_message_vide_refuse(self):
        self.en_tant_que(self.citoyen)
        r = self.client.post(PUBLICATIONS, {"contenu": "   ", "titre": ""}, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("contenu", r.data)

    def test_question_avec_titre_seul_acceptee(self):
        self.en_tant_que(self.citoyen)
        r = self.client.post(PUBLICATIONS, {"titre": "Quelle action en décembre ?", "type": "poll"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_auteur_et_statut_imposes_par_le_serveur(self):
        self.en_tant_que(self.citoyen)
        r = self.client.post(
            PUBLICATIONS,
            {"contenu": "ok", "auteur": self.autre.id, "statut": "masquee", "score_toxicite": 0, "details": {"x": 1}},
            format="json",
        )
        self.assertEqual(r.data["auteur"], self.citoyen.id)
        self.assertEqual(r.data["statut"], "publiee")
        self.assertIsNone(r.data["details"])

    def test_type_organisateur_refuse_aux_citoyens(self):
        self.en_tant_que(self.citoyen)
        r = self.client.post(PUBLICATIONS, {"contenu": "Besoin urgent", "type": "urgent"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("type", r.data)

    def test_type_organisateur_accepte_pour_organisateur(self):
        self.en_tant_que(self.organisateur)
        r = self.client.post(PUBLICATIONS, {"contenu": "Besoin urgent", "type": "urgent"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)

    def test_campagne_brouillon_d_un_autre_refusee(self):
        from datetime import date
        campagne = Campagne.objects.create(
            organisateur=self.organisateur, titre="C", description="d", categorie="x",
            date_debut=date(2026, 1, 1), date_fin=date(2026, 12, 1), objectif_montant=100,
        )
        self.en_tant_que(self.citoyen)
        r = self.client.post(PUBLICATIONS, {"contenu": "ok", "campagne": campagne.id}, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)


class ConsulterPublicationsTests(Base):
    """US 7.2"""

    def setUp(self):
        super().setUp()
        self.masquee = Publication.objects.create(auteur=self.autre, contenu="caché", statut="masquee")
        self.en_attente = Publication.objects.create(auteur=self.citoyen, contenu="à revoir", statut="en_attente")

    def ids(self, url=PUBLICATIONS):
        return {p["id"] for p in resultats(self.client.get(url))}

    def test_visiteur_voit_seulement_les_publications_publiees(self):
        self.assertEqual(self.ids(), {self.publication.id})
        self.assertEqual(self.client.get(pub(self.masquee.id)).status_code, status.HTTP_404_NOT_FOUND)

    def test_auteur_voit_aussi_ses_publications_en_attente(self):
        self.en_tant_que(self.citoyen)
        self.assertEqual(self.ids(), {self.publication.id, self.en_attente.id})

    def test_admin_voit_tout(self):
        self.en_tant_que(self.admin)
        self.assertEqual(self.ids(), {self.publication.id, self.masquee.id, self.en_attente.id})

    def test_filtre_par_type(self):
        Publication.objects.create(auteur=self.autre, contenu="histoire", type="story")
        self.assertEqual(self.ids(PUBLICATIONS + "?type=thanks"), {self.publication.id})

    def test_compteurs_et_a_like(self):
        Like.objects.create(publication=self.publication, utilisateur=self.autre)
        Commentaire.objects.create(publication=self.publication, auteur=self.autre, contenu="bravo")
        Commentaire.objects.create(publication=self.publication, auteur=self.autre, contenu="caché", statut="masque")
        self.en_tant_que(self.autre)
        data = self.client.get(pub(self.publication.id)).data
        self.assertEqual(data["nb_like"], 1)
        self.assertEqual(data["nb_commentaire"], 1)
        self.assertTrue(data["a_like"])
        self.assertEqual(data["auteur_nom"], self.citoyen.nom_complet)


class ModifierPublicationTests(Base):
    """US 7.3"""

    def test_auteur_modifie_sa_publication(self):
        self.en_tant_que(self.citoyen)
        r = self.client.patch(pub(self.publication.id), {"contenu": "Merci encore !"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(r.data["contenu"], "Merci encore !")

    def test_modification_refusee_aux_autres(self):
        for user in (self.autre, self.admin):
            self.en_tant_que(user)
            r = self.client.patch(pub(self.publication.id), {"contenu": "pirate"}, format="json")
            self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_publication_masquee_non_modifiable(self):
        self.publication.statut = "masquee"
        self.publication.save()
        self.en_tant_que(self.citoyen)
        r = self.client.patch(pub(self.publication.id), {"contenu": "je republie"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.publication.refresh_from_db()
        self.assertEqual(self.publication.statut, "masquee")


class SupprimerPublicationTests(Base):
    """US 7.4 et 7.10"""

    def test_auteur_supprime_sa_publication(self):
        self.en_tant_que(self.citoyen)
        self.assertEqual(self.client.delete(pub(self.publication.id)).status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Publication.objects.filter(id=self.publication.id).exists())

    def test_suppression_refusee_aux_autres_utilisateurs(self):
        self.en_tant_que(self.autre)
        self.assertEqual(self.client.delete(pub(self.publication.id)).status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_supprime_une_publication_inappropriee(self):
        self.en_tant_que(self.admin)
        self.assertEqual(self.client.delete(pub(self.publication.id)).status_code, status.HTTP_204_NO_CONTENT)


class CommentaireTests(Base):
    """US 7.5, 7.7, 7.8 et 7.11"""

    def setUp(self):
        super().setUp()
        self.commentaire = Commentaire.objects.create(publication=self.publication, auteur=self.autre, contenu="Bravo !")

    def test_ajout_commentaire(self):
        self.en_tant_que(self.citoyen)
        r = self.client.post(COMMENTAIRES, {"publication": self.publication.id, "contenu": "Merci à vous"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.data["auteur"], self.citoyen.id)
        self.assertEqual(r.data["statut"], "publie")

    def test_commentaire_vide_refuse(self):
        self.en_tant_que(self.citoyen)
        r = self.client.post(COMMENTAIRES, {"publication": self.publication.id, "contenu": "  "}, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_commentaire_refuse_sur_publication_non_publiee(self):
        cachee = Publication.objects.create(auteur=self.citoyen, contenu="x", statut="masquee")
        self.en_tant_que(self.citoyen)
        r = self.client.post(COMMENTAIRES, {"publication": cachee.id, "contenu": "ok"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_liste_filtree_par_publication(self):
        autre_pub = Publication.objects.create(auteur=self.autre, contenu="autre")
        Commentaire.objects.create(publication=autre_pub, auteur=self.citoyen, contenu="ailleurs")
        ids = {c["id"] for c in resultats(self.client.get(COMMENTAIRES + f"?publication={self.publication.id}"))}
        self.assertEqual(ids, {self.commentaire.id})

    def test_auteur_modifie_son_commentaire(self):
        self.en_tant_que(self.autre)
        r = self.client.patch(com(self.commentaire.id), {"contenu": "Bravo à toute l'équipe !"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_200_OK)

    def test_commentaire_ne_change_pas_de_publication(self):
        autre_pub = Publication.objects.create(auteur=self.autre, contenu="autre")
        self.en_tant_que(self.autre)
        r = self.client.patch(com(self.commentaire.id), {"publication": autre_pub.id}, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_modification_refusee_aux_autres(self):
        self.en_tant_que(self.citoyen)
        r = self.client.patch(com(self.commentaire.id), {"contenu": "pirate"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

    def test_auteur_supprime_son_commentaire(self):
        self.en_tant_que(self.autre)
        self.assertEqual(self.client.delete(com(self.commentaire.id)).status_code, status.HTTP_204_NO_CONTENT)

    def test_suppression_refusee_aux_autres(self):
        self.en_tant_que(self.citoyen)
        self.assertEqual(self.client.delete(com(self.commentaire.id)).status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_supprime_un_commentaire_inapproprie(self):
        self.en_tant_que(self.admin)
        self.assertEqual(self.client.delete(com(self.commentaire.id)).status_code, status.HTTP_204_NO_CONTENT)


class ModerationIATests(Base):
    """US 7.6"""

    def test_publication_toxique_bloquee(self):
        self.en_tant_que(self.citoyen)
        r = self.client.post(PUBLICATIONS, {"contenu": "Espèce de connard"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("contenu", r.data)
        self.assertFalse(Publication.objects.filter(contenu__icontains="connard").exists())

    def test_arnaque_cumulant_plusieurs_indices_bloquee(self):
        self.en_tant_que(self.citoyen)
        r = self.client.post(PUBLICATIONS, {"contenu": "Envoyez directement au RIB suivant"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_detection_insensible_aux_accents_et_majuscules(self):
        self.en_tant_que(self.citoyen)
        r = self.client.post(PUBLICATIONS, {"contenu": "Ce sont des VOLEURS et des ESCROCS"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_contenu_douteux_mis_en_attente(self):
        self.en_tant_que(self.citoyen)
        r = self.client.post(PUBLICATIONS, {"contenu": "Je vous donne mon RIB en message privé"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.data["statut"], "en_attente")
        self.assertGreaterEqual(r.data["score_toxicite"], 0.3)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(pub(r.data["id"])).status_code, status.HTTP_404_NOT_FOUND)

    def test_pluriel_et_feminin_detectes(self):
        self.en_tant_que(self.citoyen)
        for texte in ("bande de connards", "quelle connarde", "des idiotes"):
            r = self.client.post(PUBLICATIONS, {"contenu": texte}, format="json")
            self.assertNotEqual(r.data.get("statut"), "publiee", texte)

    def test_pas_de_faux_positif_sur_un_mot_contenant_un_terme(self):
        self.en_tant_que(self.citoyen)
        r = self.client.post(PUBLICATIONS, {"contenu": "Nous avons ramassé des tributs de fleurs"}, format="json")
        self.assertEqual(r.data["statut"], "publiee")

    def test_modification_toxique_bloquee(self):
        self.en_tant_que(self.citoyen)
        r = self.client.patch(pub(self.publication.id), {"contenu": "ta gueule, connard"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)
        self.publication.refresh_from_db()
        self.assertEqual(self.publication.contenu, "Merci à tous les bénévoles !")

    def test_commentaire_toxique_bloque(self):
        self.en_tant_que(self.citoyen)
        r = self.client.post(COMMENTAIRES, {"publication": self.publication.id, "contenu": "fdp"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_commentaire_douteux_en_attente_et_dans_la_file(self):
        self.en_tant_que(self.citoyen)
        r = self.client.post(COMMENTAIRES, {"publication": self.publication.id, "contenu": "Quel idiot"}, format="json")
        self.assertEqual(r.data["statut"], "en_attente")
        self.en_tant_que(self.admin)
        file = self.client.get(FILE).data
        self.assertEqual([(e["objet"], e["id"]) for e in file], [("commentaire", r.data["id"])])
        self.assertEqual(file[0]["mots"], ["idiot"])

    def test_pre_verification_pendant_la_saisie(self):
        self.en_tant_que(self.citoyen)
        url = PUBLICATIONS + "verifier/"
        self.assertEqual(self.client.post(url, {"texte": "Merci à tous"}, format="json").data["verdict"], "ok")
        self.assertEqual(self.client.post(url, {"texte": "Quel idiot"}, format="json").data["verdict"], "revue")
        r = self.client.post(url, {"texte": "connard"}, format="json")
        self.assertEqual(r.data["verdict"], "bloque")
        self.assertEqual(r.data["motif"], "Insulte")
        self.assertEqual(Publication.objects.count(), 1)

    def test_file_reservee_aux_admins(self):
        self.en_tant_que(self.citoyen)
        self.assertEqual(self.client.get(FILE).status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_garde_ou_masque(self):
        p = Publication.objects.create(auteur=self.autre, contenu="RIB", statut="en_attente")
        self.en_tant_que(self.admin)
        r = self.client.post(pub(p.id, "moderer/"), {"decision": "garder"}, format="json")
        self.assertEqual(r.data["statut"], "publiee")
        r = self.client.post(pub(p.id, "moderer/"), {"decision": "masquer"}, format="json")
        self.assertEqual(r.data["statut"], "masquee")

    def test_moderer_refuse_aux_non_admins(self):
        self.en_tant_que(self.citoyen)
        r = self.client.post(pub(self.publication.id, "moderer/"), {"decision": "garder"}, format="json")
        self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)


class LikeTests(Base):
    """US 7.9"""

    def test_liker_puis_retirer(self):
        self.en_tant_que(self.autre)
        r = self.client.post(pub(self.publication.id, "like/"))
        self.assertEqual(r.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r.data, {"a_like": True, "nb_like": 1})
        r = self.client.delete(pub(self.publication.id, "like/"))
        self.assertEqual(r.data, {"a_like": False, "nb_like": 0})

    def test_double_like_sans_erreur_ni_doublon(self):
        self.en_tant_que(self.autre)
        self.client.post(pub(self.publication.id, "like/"))
        r = self.client.post(pub(self.publication.id, "like/"))
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(Like.objects.count(), 1)

    def test_double_like_via_likes_renvoie_400(self):
        self.en_tant_que(self.autre)
        self.client.post(LIKES, {"publication": self.publication.id}, format="json")
        r = self.client.post(LIKES, {"publication": self.publication.id}, format="json")
        self.assertEqual(r.status_code, status.HTTP_400_BAD_REQUEST)

    def test_like_refuse_sans_connexion(self):
        self.assertEqual(self.client.post(pub(self.publication.id, "like/")).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_like_refuse_sur_publication_en_attente(self):
        p = Publication.objects.create(auteur=self.autre, contenu="x", statut="en_attente")
        self.en_tant_que(self.autre)
        self.assertEqual(self.client.post(pub(p.id, "like/")).status_code, status.HTTP_400_BAD_REQUEST)

    def test_on_ne_supprime_pas_le_like_d_un_autre(self):
        like = Like.objects.create(publication=self.publication, utilisateur=self.autre)
        self.en_tant_que(self.citoyen)
        self.assertEqual(self.client.delete(f"{LIKES}{like.id}/").status_code, status.HTTP_403_FORBIDDEN)
