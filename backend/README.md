# Backend Moubedra (Django)

API Django REST Framework correspondant au diagramme global des classes. Chaque entité possède maintenant un module dédié dans `api/components/<composant>/` avec `models.py`, `views.py`, `serializers.py` et `admin.py`. Le projet utilise SQLite par défaut pour le développement et JWT pour l'authentification de l'API. Les paiements, la génération d'images de QR code et la modération automatisée restent à connecter à des services réels.

## Démarrage sous Windows

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python manage.py makemigrations api
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_demo
python manage.py runserver
```

API locale : `http://127.0.0.1:8000/api/`. Administration : `http://127.0.0.1:8000/admin/`.

## Authentification

- `POST /api/auth/inscription/` : inscription (e-mail, mot de passe, nom, prénom, téléphone, ville).
- `POST /api/auth/connexion/` : connexion JWT avec `email` et `password`.
- `POST /api/auth/renouveler/` : renouvellement du jeton avec `refresh`.
- Envoyer le jeton d'accès dans `Authorization: Bearer <access>`.
- `GET/PATCH /api/utilisateurs/moi/` : consulter ou modifier le profil courant (rôle, statut et date d'inscription non modifiables).
- `POST /api/utilisateurs/moi/mot-de-passe/` : `ancien_mot_de_passe`, `nouveau_mot_de_passe`, `confirmation`.

## Gestion des utilisateurs (administrateurs)

- `GET /api/utilisateurs/?role=&statut=` : liste des comptes, filtrable par rôle et statut.
- `GET /api/utilisateurs/{id}/` : fiche d'un compte (« Compte introuvable » si l'id n'existe pas).
- `POST /api/utilisateurs/{id}/statut/` : `statut` (`actif`, `suspendu`, `desactive`) ; une suspension exige `"confirmation": true`. Un admin ne peut pas modifier son propre statut.

Aucun compte n'est supprimé physiquement : la suppression est logique via le statut `desactive`. Un compte `suspendu` ou `desactive` ne peut plus se connecter et ses jetons existants sont refusés. Aucune réponse ne contient le mot de passe ni son hash.

Tests : `python manage.py test api`.

## Ressources

Les routes CRUD sont disponibles sous `/api/` : `campagnes`, `evenements`, `publications`, `commentaires`, `likes`, `dons`, `participations/campagnes`, `participations/evenements`, `demandes-organisateur`, `signalements`, `utilisateurs`. Les listes utilisent une pagination de 20 éléments et prennent en charge la recherche, le filtrage et le tri selon la ressource.

Les rôles et permissions sont vérifiés côté API : seuls les organisateurs gèrent leurs campagnes et événements, les citoyens ne voient que leurs dons et participations, et le traitement des signalements ou demandes d'organisateur est réservé aux administrateurs. Le navigateur ne doit jamais décider seul de ces permissions. Les actions dédiées sont `POST /api/participations/campagnes/{id}/traiter/`, `POST /api/participations/evenements/{id}/traiter/`, `POST /api/demandes-organisateur/{id}/traiter/`, `POST /api/signalements/{id}/traiter/` et `POST /api/dons/{id}/verifier/`. Le traitement de don met à jour le montant collecté de la campagne une seule fois par confirmation.

## Données de démonstration

`python manage.py seed_demo` ajoute des données fictives pour les entités du diagramme. La commande peut être relancée et n'efface aucune donnée existante. Elle crée des comptes citoyens et organisateurs avec le mot de passe initial `MoubedraDemo2026!`, ainsi qu'un compte administrateur (`admin@moubedra.tn`) avec le mot de passe initial `MoubedraAdmin2026!`. Réservés au développement local : change ces mots de passe avant tout déploiement.

## Configuration

Copier `.env.example` vers `.env`, puis définir `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS` et `FRONTEND_URL`. Les variables d'environnement doivent être chargées par le terminal ou l'outil de déploiement; le fichier `.env` n'est pas lu automatiquement.
