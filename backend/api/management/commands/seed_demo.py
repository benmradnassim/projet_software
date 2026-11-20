"""Create a reusable set of fictional Moubedra data for local testing."""
import uuid
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from api.models import (
    Campagne,
    Commentaire,
    DemandeOrganisateur,
    DemandeParticipationCampagne,
    DemandeParticipationEvenement,
    Don,
    Evenement,
    Like,
    Publication,
    Signalement,
)

User = get_user_model()


class Command(BaseCommand):
    help = "Ajoute des utilisateurs et des données de démonstration sans supprimer les données existantes."

    def handle(self, *args, **options):
        today = timezone.localdate()
        counts = {}

        users_data = [
            ("nour.saada@example.tn", "Nour", "Saada", "citoyen", "Tunis"),
            ("marwa.ltifi@example.tn", "Marwa", "Ltifi", "organisateur", "Sfax"),
            ("yasmine.ayari@example.tn", "Yasmine", "Ayari", "citoyen", "Tunis"),
            ("mehdi.bs@example.tn", "Mehdi", "Ben Salem", "citoyen", "Nabeul"),
            ("contact@maindanslamain.tn", "Association", "Main dans la Main", "organisateur", "Sfax"),
            ("bonjour@vertmahdia.tn", "Collectif Vert", "Mahdia", "organisateur", "Mahdia"),
            ("sana.k@example.tn", "Sana", "Khemiri", "citoyen", "Tunis"),
            ("amine.by@example.tn", "Amine", "Ben Youssef", "citoyen", "Jendouba"),
            ("contact@bat.tn", "Banque Alimentaire", "Tunisienne", "organisateur", "Tunis"),
            ("hello@liregrandir.tn", "Lire", "et Grandir", "organisateur", "Kairouan"),
            ("jardins@example.tn", "Jardins", "de quartier", "organisateur", "La Marsa"),
        ]
        people = {}
        created_users = 0
        for email, first, last, role, city in users_data:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    "first_name": first,
                    "last_name": last,
                    "prenom": first,
                    "role": role,
                    "ville": city,
                    "statut": User.Statut.ACTIF,
                },
            )
            if created:
                user.set_password("MoubedraDemo2026!")
                user.save(update_fields=["password"])
                created_users += 1
            people[email] = user

        admin, created = User.objects.get_or_create(
            email="admin@moubedra.tn",
            defaults={
                "first_name": "Admin",
                "last_name": "moubedra",
                "prenom": "Admin",
                "role": User.Role.ADMIN,
                "statut": User.Statut.ACTIF,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            admin.set_password("MoubedraAdmin2026!")
            admin.save(update_fields=["password"])
            created_users += 1
        people["admin@moubedra.tn"] = admin
        counts["utilisateurs"] = created_users

        campaigns_data = [
            ("Un cartable pour chaque rêve", "Éducation", "Sfax", "contact@maindanslamain.tn", 12000, 8450, 16, "Offrons aux enfants les fournitures et les cartables nécessaires pour commencer l'année avec confiance.", "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1000&q=85"),
            ("Des repas chauds, des cœurs légers", "Solidarité alimentaire", "Tunis", "contact@bat.tn", 8000, 5200, 13, "Un repas partagé est parfois le premier pas vers un quotidien plus serein.", "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1000&q=85"),
            ("Nos plages, notre héritage", "Environnement", "Mahdia", "bonjour@vertmahdia.tn", 6000, 3680, 21, "Des bénévoles se réunissent pour nettoyer, sensibiliser et protéger le littoral.", "https://images.unsplash.com/photo-1484291470158-b8f8d608850d?auto=format&fit=crop&w=1000&q=85"),
            ("Un jardin partagé pour tous", "Environnement", "La Marsa", "jardins@example.tn", 4000, 2150, 28, "Créons un lieu de rencontre où petits et grands cultivent ensemble.", "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1000&q=85"),
            ("Une bibliothèque au cœur du village", "Éducation", "Kairouan", "hello@liregrandir.tn", 9500, 7100, 12, "Aménageons un espace de lecture ouvert aux enfants et aux familles.", "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1000&q=85"),
            ("Des visites qui réchauffent", "Solidarité", "Nabeul", "contact@maindanslamain.tn", 3200, 1100, 32, "Des visites régulières et des moments partagés pour rompre l'isolement.", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1000&q=85"),
            ("Un toit sûr après les pluies", "Urgence", "Jendouba", "contact@maindanslamain.tn", 18000, 13700, 14, "Les dons financent les réparations urgentes pour des familles.", "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=1000&q=85"),
            ("Un vélo pour aller à l’école", "Éducation", "Gafsa", "hello@liregrandir.tn", 7500, 2600, 24, "Facilitons les trajets scolaires des jeunes des zones éloignées.", "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1000&q=85"),
        ]
        campaigns = []
        created_campaigns = 0
        for title, category, city, organizer_email, goal, raised, days, description, image in campaigns_data:
            campaign, created = Campagne.objects.get_or_create(
                titre=title,
                defaults={
                    "organisateur": people[organizer_email],
                    "description": description,
                    "categorie": category,
                    "date_debut": today - timedelta(days=days),
                    "date_fin": today + timedelta(days=30 + days),
                    "objectif_montant": Decimal(goal),
                    "montant_collecte": Decimal(raised),
                    "statut": Campagne.Statut.EN_COURS,
                    "image": image,
                },
            )
            campaigns.append(campaign)
            created_campaigns += int(created)
        counts["campagnes"] = created_campaigns

        events_data = [
            ("Cuisine solidaire : on met la main à la pâte", "Tunis", "Maison de quartier, Bab El Khadra", 1, 25, 18, 3),
            ("Un cartable, mille sourires", "Sfax", "École primaire El Habib", 0, 60, 42, 10),
            ("Nettoyons la plage de Mahdia", "Mahdia", "Plage de la Corniche", 2, 50, 31, 17),
            ("Plantation au jardin de quartier", "La Marsa", "Jardin partagé, Bhar Lazreg", 3, 35, 14, 23),
            ("Heure du conte en famille", "Kairouan", "Maison des jeunes", 4, 40, 26, 29),
            ("Un après-midi de jeux et de partage", "Nabeul", "Centre de quartier", 5, 30, 12, 34),
        ]
        events = []
        created_events = 0
        for title, city, venue, campaign_index, capacity, attendees, days in events_data:
            campaign = campaigns[campaign_index]
            event, created = Evenement.objects.get_or_create(
                titre=title,
                defaults={
                    "organisateur": campaign.organisateur,
                    "campagne": campaign,
                    "description": f"Retrouvons-nous pour soutenir la campagne « {campaign.titre} ».",
                    "date_evenement": timezone.now() + timedelta(days=days),
                    "lieu": venue,
                    "ville": city,
                    "capacite": capacity,
                    "statut": Evenement.Statut.PLANIFIE,
                },
            )
            events.append(event)
            created_events += int(created)
        counts["evenements"] = created_events

        posts_data = [
            ("marwa.ltifi@example.tn", 0, "Aujourd’hui, des cartables ont trouvé leur chemin vers les élèves. Merci à toute la communauté !"),
            ("yasmine.ayari@example.tn", 1, "Première matinée comme bénévole à la cuisine solidaire : une équipe formidable et beaucoup de sourires."),
            ("bonjour@vertmahdia.tn", 2, "Notre prochain rendez-vous plage est ouvert à toutes et à tous. Gants et bonne humeur fournis !"),
            ("jardins@example.tn", 3, "Le jardin partagé commence à prendre forme. Les enfants ont choisi les premières graines."),
            ("hello@liregrandir.tn", 4, "Un grand merci aux lectrices et lecteurs qui ont apporté des livres pour la bibliothèque."),
            ("nour.saada@example.tn", 0, "Un petit geste peut ouvrir une grande porte. Heureuse d’avoir contribué à la campagne des cartables."),
            ("contact@maindanslamain.tn", 5, "Cette semaine, nous avons partagé un goûter et beaucoup d’histoires avec les voisins."),
            ("amine.by@example.tn", 6, "Bravo aux équipes de Jendouba pour leur mobilisation après les pluies."),
            ("hello@liregrandir.tn", 7, "Chaque vélo remis apporte un peu plus d’autonomie aux jeunes. Le projet avance bien !"),
            ("sana.k@example.tn", 2, "Merci de nous aider à trouver des actions solidaires près de chez nous."),
        ]
        posts = []
        created_posts = 0
        for email, campaign_index, content in posts_data:
            post, created = Publication.objects.get_or_create(
                auteur=people[email], contenu=content,
                defaults={"campagne": campaigns[campaign_index], "statut": Publication.Statut.PUBLIEE},
            )
            posts.append(post)
            created_posts += int(created)
        counts["publications"] = created_posts

        comments_data = [
            (0, "sana.k@example.tn", "Un bel exemple de solidarité, bravo à toute l’équipe !"),
            (1, "nour.saada@example.tn", "Merci pour cette belle initiative."),
            (2, "mehdi.bs@example.tn", "Je serai là avec deux amis."),
            (3, "yasmine.ayari@example.tn", "Hâte de voir le jardin grandir !"),
            (4, "nour.saada@example.tn", "Les enfants vont adorer ce nouvel espace."),
        ]
        counts["commentaires"] = sum(
            Commentaire.objects.get_or_create(
                publication=posts[post_index], auteur=people[email], contenu=content,
            )[1]
            for post_index, email, content in comments_data
        )
        counts["likes"] = sum(
            Like.objects.get_or_create(publication=posts[i], utilisateur=people[email])[1]
            for i, email in [(0, "nour.saada@example.tn"), (0, "yasmine.ayari@example.tn"), (1, "marwa.ltifi@example.tn"), (2, "nour.saada@example.tn"), (4, "sana.k@example.tn")]
        )

        donations_data = [
            ("nour.saada@example.tn", 0, 50, Don.ModePaiement.CARTE, Don.Statut.CONFIRME),
            ("yasmine.ayari@example.tn", 1, 30, Don.ModePaiement.D17, Don.Statut.EN_ATTENTE),
            ("mehdi.bs@example.tn", 2, 25, Don.ModePaiement.CARTE, Don.Statut.CONFIRME),
            ("sana.k@example.tn", 0, 100, Don.ModePaiement.VIREMENT, Don.Statut.CONFIRME),
            ("nour.saada@example.tn", 3, 20, Don.ModePaiement.D17, Don.Statut.EN_ATTENTE),
            ("amine.by@example.tn", 6, 75, Don.ModePaiement.CARTE, Don.Statut.REFUSE),
            ("marwa.ltifi@example.tn", 4, 40, Don.ModePaiement.CARTE, Don.Statut.CONFIRME),
            ("sana.k@example.tn", 1, 60, Don.ModePaiement.D17, Don.Statut.CONFIRME),
        ]
        counts["dons"] = sum(
            Don.objects.get_or_create(
                donateur=people[email], campagne=campaigns[campaign_index], montant=Decimal(amount),
                defaults={"mode_paiement": method, "statut": donation_status},
            )[1]
            for email, campaign_index, amount, method, donation_status in donations_data
        )

        campaign_participations = [
            ("nour.saada@example.tn", 1, DemandeParticipationCampagne.Statut.ACCEPTEE),
            ("nour.saada@example.tn", 0, DemandeParticipationCampagne.Statut.EN_ATTENTE),
            ("yasmine.ayari@example.tn", 1, DemandeParticipationCampagne.Statut.EN_ATTENTE),
            ("mehdi.bs@example.tn", 1, DemandeParticipationCampagne.Statut.ACCEPTEE),
            ("sana.k@example.tn", 2, DemandeParticipationCampagne.Statut.REFUSEE),
            ("amine.by@example.tn", 3, DemandeParticipationCampagne.Statut.EN_ATTENTE),
            ("yasmine.ayari@example.tn", 0, DemandeParticipationCampagne.Statut.ACCEPTEE),
            ("sana.k@example.tn", 4, DemandeParticipationCampagne.Statut.EN_ATTENTE),
        ]
        counts["participations_campagnes"] = sum(
            DemandeParticipationCampagne.objects.get_or_create(
                utilisateur=people[email], campagne=campaigns[campaign_index],
                defaults={"statut": participation_status, "motif": "Je souhaite aider cette initiative."},
            )[1]
            for email, campaign_index, participation_status in campaign_participations
        )
        event_participations = [
            ("nour.saada@example.tn", 0),
            ("yasmine.ayari@example.tn", 0),
            ("mehdi.bs@example.tn", 1),
            ("sana.k@example.tn", 2),
            ("amine.by@example.tn", 3),
            ("nour.saada@example.tn", 4),
        ]
        created_event_participations = 0
        for index, (email, event_index) in enumerate(event_participations):
            participation, created = DemandeParticipationEvenement.objects.get_or_create(
                utilisateur=people[email],
                evenement=events[event_index],
                defaults={
                    "statut": (
                        DemandeParticipationEvenement.Statut.ACCEPTEE
                        if index % 2 == 0
                        else DemandeParticipationEvenement.Statut.EN_ATTENTE
                    ),
                    "motif": "Je souhaite participer à cet événement.",
                },
            )
            created_event_participations += int(created)
            if (
                participation.statut == DemandeParticipationEvenement.Statut.ACCEPTEE
                and participation.code_qr is None
            ):
                participation.code_qr = uuid.uuid4()
                participation.save(update_fields=["code_qr"])
        counts["participations_evenements"] = created_event_participations

        organizer_requests = [
            ("nour.saada@example.tn", "Je souhaite lancer des collectes et du soutien scolaire dans mon quartier."),
            ("yasmine.ayari@example.tn", "Nous voulons fédérer les initiatives écologiques locales."),
            ("mehdi.bs@example.tn", "Notre collectif accompagne les familles et les jeunes de la région."),
        ]
        counts["demandes_organisateur"] = sum(
            DemandeOrganisateur.objects.get_or_create(utilisateur=people[email], motif=reason)[1]
            for email, reason in organizer_requests
        )

        reports_data = [
            ("nour.saada@example.tn", "Commentaire sur la campagne des repas", "commentaire", Signalement.Statut.EN_ATTENTE),
            ("yasmine.ayari@example.tn", "Publication contenant une information à vérifier", "publication", Signalement.Statut.EN_COURS),
            ("sana.k@example.tn", "Campagne non vérifiée", "campagne", Signalement.Statut.RESOLU),
            ("mehdi.bs@example.tn", "Commentaire sur le fil communautaire", "commentaire", Signalement.Statut.REJETE),
            ("nour.saada@example.tn", "Publication de la communauté", "publication", Signalement.Statut.EN_ATTENTE),
        ]
        counts["signalements"] = sum(
            Signalement.objects.get_or_create(
                declarant=people[email], description=description,
                defaults={"type": report_type, "statut": report_status},
            )[1]
            for email, description, report_type, report_status in reports_data
        )

        self.stdout.write(self.style.SUCCESS("Données de démonstration prêtes (aucune donnée existante supprimée)."))
        for label, count in counts.items():
            self.stdout.write(f"  {label}: {count} créé(s)")
        self.stdout.write("Comptes de démo : nour.saada@example.tn / marwa.ltifi@example.tn / admin@moubedra.tn")
        self.stdout.write("Mot de passe initial des nouveaux comptes citoyens/organisateurs : MoubedraDemo2026!")
        self.stdout.write("Mot de passe initial du nouveau compte administrateur : MoubedraAdmin2026!")
