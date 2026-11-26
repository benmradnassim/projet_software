"""
Importe dans la base les publications et commentaires fictifs du front
(Frontend/moubedra-template/src/features/publications/mockData.js) pour le module « Gestion des publications ».

    python manage.py seed_demo           # d'abord : utilisateurs et campagnes
    python manage.py seed_publications   # ensuite : fil communautaire + file de modération

Relançable sans doublon (les contenus existants sont mis à jour, rien n'est supprimé).
Les comptes créés ici ont le mot de passe de démo de seed_demo.
"""
from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from api.models import Campagne, Commentaire, Publication, Utilisateur

MDP_DEMO = "MoubedraDemo2026!"

# Comptes absents de seed_demo : email -> (prénom, nom, rôle, ville, organisation)
NOUVEAUX_COMPTES = {
    "contact@croissantrouge-jendouba.tn": ("Croissant-Rouge", "Jendouba", "organisateur", "Jendouba", "Croissant-Rouge Jendouba"),
    "sana.kefi@example.tn": ("Sana", "Kefi", "citoyen", "Sfax", ""),
    "youssef.b@example.tn": ("Youssef", "B.", "citoyen", "Tunis", ""),
    "anonyme@example.tn": ("Anonyme", "", "citoyen", "", ""),
    "rim.m@example.tn": ("Rim", "M.", "citoyen", "Mahdia", ""),
}


def il_y_a(*, minutes=0, heures=0, jours=0):
    return timezone.now() - timedelta(minutes=minutes, hours=heures, days=jours)


# (clé, email de l'auteur, type, titre de campagne, titre, contenu, image, âge, détails)
PUBLICATIONS = [
    ("urgent", "contact@croissantrouge-jendouba.tn", "urgent", "Un toit sûr après les pluies",
     "Inondations à Jendouba : couvertures et bras nécessaires",
     "Une trentaine de familles ont été relogées à l’école Ibn Khaldoun. On collecte jusqu’à mercredi soir.",
     "", {"heures": 1},
     {"lieu": "Jendouba", "fin_dans_secondes": (2 * 24 + 14) * 3600 + 1520,
      "besoins": [{"libelle": "Couvertures", "recu": 26, "objectif": 40}, {"libelle": "Bénévoles", "recu": 9, "objectif": 15},
                  {"libelle": "Kits d’hygiène", "recu": 31, "objectif": 50}]}),
    ("event", "bonjour@vertmahdia.tn", "event", "Nos plages, notre héritage",
     "Nettoyons la plage de la Corniche", "", "", {"heures": 3},
     {"evenement": 1, "date": "2026-12-05T08:30:00+01:00", "horaire": "08:30 – 12:00",
      "lieu": "Plage de la Corniche, Mahdia", "inscrits": 21, "capacite": 40}),
    ("update", "marwa.ltifi@example.tn", "update", "Un cartable pour chaque rêve", "",
     "Aujourd’hui, 32 cartables ont trouvé leur chemin vers les élèves de l’école El Habib. Merci à chacune et chacun ! 💚",
     "/media/covers/education.webp", {"minutes": 20},
     {"collecte": 8450, "objectif": 12000, "semaine": 1200, "jours_restants": 9}),
    ("thanks", "nour.saada@example.tn", "thanks", None, "",
     "Hier soir, j’ai servi des repas avec l’équipe de la Banque Alimentaire. Je suis repartie avec plus que ce que j’ai donné. Merci de m’avoir accueillie.",
     "", {"heures": 2}, {"destinataire": "Banque Alimentaire Tunisienne"}),
    ("goal", "hello@liregrandir.tn", "goal", "Une bibliothèque au cœur du village",
     "Objectif atteint : la bibliothèque du village", "", "", {"jours": 1, "heures": 2},
     {"montant": 9500, "donateurs": 148, "benevoles": 12, "suite": "Les travaux commencent en janvier."}),
    ("beforeafter", "bonjour@vertmahdia.tn", "beforeafter", "Nos plages, notre héritage",
     "Plage de Salakta : 3 heures, 26 bénévoles", "", "", {"jours": 5},
     {"stats": [["38", "sacs ramassés"], ["26", "bénévoles"], ["1,2 km", "de plage"]]}),
    ("transparency", "contact@maindanslamain.tn", "transparency", "Un cartable pour chaque rêve", "",
     "Comme promis, voici l’utilisation des 4 750 premiers TND.", "", {"jours": 2},
     {"lignes": [["60 cartables complets", 3000], ["Fournitures et livres", 1450], ["Transport vers Sfax", 300]],
      "fichier": "facture_novembre.pdf", "taille": "240 Ko"}),
    ("poll", "yasmine.ayari@example.tn", "poll", None,
     "Quelle prochaine action organiser à Tunis en décembre ?", "", "", {"heures": 6},
     {"options": [["Collecte de vêtements d’hiver", 46], ["Soutien scolaire du samedi", 32], ["Jardin partagé à La Marsa", 22]],
      "votes": 214, "fin": "se termine dans 2 jours"}),
    ("entrante", "sana.kefi@example.tn", "thanks", None, "",
     "Mon fils a reçu son cartable ce matin. Il ne l’a plus lâché ! Merci du fond du cœur à tous les donateurs.",
     "", {"minutes": 5}, {"destinataire": "Main dans la Main"}),
]

# File de modération : contenus mis en attente par l'IA (clé, email, contenu, score)
PUBLICATIONS_A_MODERER = [
    ("anonyme@example.tn", "Don urgent ! Envoyez directement par virement au RIB 08 006 000… pas besoin de passer par l’appli.", 0.78),
    ("rim.m@example.tn", "Super journée à la plage, merci à toute l’équipe 💚 on a ramassé 38 sacs !", 0.12),
]

# (clé de la publication, email, contenu, âge, statut, score)
COMMENTAIRES = [
    ("thanks", "yasmine.ayari@example.tn", "Quelle belle soirée, bravo Nour !", {"heures": 1}, "publie", 0.0),
    ("thanks", "marwa.ltifi@example.tn", "Merci pour ton aide, à la semaine prochaine 💚", {"minutes": 40}, "publie", 0.0),
    ("urgent", "mehdi.bs@example.tn", "Je peux apporter 4 couvertures demain matin.", {"minutes": 30}, "publie", 0.0),
    ("transparency", "youssef.b@example.tn", "Ces associations volent l’argent, ce sont tous des voleurs !!", {"heures": 1}, "en_attente", 0.87),
]


class Command(BaseCommand):
    help = "Importe les publications et commentaires fictifs du front dans la base (relançable sans doublon)."

    def handle(self, *args, **options):
        comptes = {u.email: u for u in Utilisateur.objects.all()}
        for email, (prenom, nom, role, ville, organisation) in NOUVEAUX_COMPTES.items():
            if email not in comptes:
                user = Utilisateur.objects.create_user(
                    email=email, password=MDP_DEMO, first_name=prenom, prenom=prenom, last_name=nom,
                    role=role, ville=ville, nom_organisation=organisation,
                )
                comptes[email] = user

        manquants = {e for (_, e, *_rest) in PUBLICATIONS} - comptes.keys()
        if manquants:
            raise CommandError(f"Comptes introuvables : {', '.join(sorted(manquants))}. Lancez d'abord `python manage.py seed_demo`.")

        campagnes = {c.titre: c for c in Campagne.objects.all()}
        crees = maj = 0
        par_cle = {}
        for cle, email, type_, campagne, titre, contenu, image, age, details in PUBLICATIONS:
            pub, cree = Publication.objects.update_or_create(
                auteur=comptes[email], type=type_, titre=titre, contenu=contenu,
                defaults={"campagne": campagnes.get(campagne), "image": image, "details": details,
                          "statut": Publication.Statut.PUBLIEE, "score_toxicite": 0.0},
            )
            if cree:
                Publication.objects.filter(pk=pub.pk).update(date_creation=il_y_a(**age))  # auto_now_add
            par_cle[cle] = pub
            crees += cree
            maj += not cree

        for email, contenu, score in PUBLICATIONS_A_MODERER:
            _, cree = Publication.objects.get_or_create(
                auteur=comptes[email], contenu=contenu,
                defaults={"type": Publication.Type.STORY, "statut": Publication.Statut.EN_ATTENTE, "score_toxicite": score},
            )
            crees += cree

        com_crees = 0
        for cle, email, contenu, age, statut, score in COMMENTAIRES:
            com, cree = Commentaire.objects.get_or_create(
                publication=par_cle[cle], auteur=comptes[email], contenu=contenu,
                defaults={"statut": statut, "score_toxicite": score},
            )
            if cree:
                Commentaire.objects.filter(pk=com.pk).update(date_creation=il_y_a(**age), date_modification=il_y_a(**age))
            com_crees += cree

        self.stdout.write(self.style.SUCCESS(
            f"Publications : {crees} créée(s), {maj} mise(s) à jour · commentaires : {com_crees} créé(s)."
        ))
