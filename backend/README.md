# Backend Moubedra (Django)

API Django REST Framework correspondant au diagramme global des classes. Chaque entité possède maintenant un module dédié dans `api/components/<composant>/` avec `models.py`, `views.py`, `serializers.py` et `admin.py`. Le projet utilise SQLite par défaut pour le développement et JWT pour l'authentification de l'API. Les paiements et la modération automatisée restent à connecter à des services réels. Les codes QR des participations aux événements sont créés uniquement après acceptation.

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
- `GET/PATCH /api/utilisateurs/moi/` : consulter ou modifier le profil courant.

## Ressources

Les routes CRUD sont disponibles sous `/api/` : `campagnes`, `evenements`, `publications`, `commentaires`, `likes`, `dons`, `participations/campagnes`, `participations/evenements`, `demandes-organisateur`, `signalements`, `utilisateurs`. Les événements peuvent être recherchés avec `search` et filtrés par `statut`, `ville` ou `campagne`. Les listes utilisent une pagination de 20 éléments.

Le modèle `Evenement` reprend les attributs du diagramme (`id`, `titre`, `description`, `dateEvenement`, `lieu`, `capacite`, `statut`). En Python et dans l’API, le nom date est écrit `date_evenement`, conformément aux conventions Django; il s’agit du même attribut, pas d’un deuxième champ. Les champs relationnels `organisateur` (propriétaire) et `campagne`, ainsi que `ville`, sont des extensions déjà présentes dans le projet; ils ne remplacent pas les attributs du diagramme. L’interface de gestion traite les événements comme des activités autonomes et ne demande pas de campagne liée; le champ relationnel existant est conservé pour ne pas modifier les données enregistrées. Chaque événement peut aussi avoir une image facultative, téléversée dans `MEDIA_ROOT/events/` et limitée à 5 Mo. Les requêtes de création ou modification avec image utilisent `multipart/form-data`; l’API renvoie l’URL de l’image et Django la sert en développement depuis `MEDIA_URL`. Les demandes de participation restent séparées dans `DemandeParticipationEvenement` et sont reliées à leur événement par une clé étrangère.

Les rôles et permissions sont vérifiés côté API : les citoyens voient les événements planifiés; les organisateurs voient les événements planifiés et tous les leurs, et créent, modifient ou suppriment uniquement leurs propres événements. Un organisateur peut demander à participer à un événement planifié d’un autre organisateur. Les administrateurs peuvent consulter les événements mais ne les créent, ne les modifient, ne les suppriment et ne gèrent ni leurs participations ni leurs QR codes. Une demande de participation reste en attente; le QR code unique est créé uniquement après acceptation. Un organisateur vérifie les QR codes uniquement pour ses événements via `POST /api/participations/evenements/verify-qr/`. Le navigateur ne décide jamais seul des permissions API. Les autres actions dédiées sont `POST /api/participations/campagnes/{id}/traiter/`, `POST /api/participations/evenements/{id}/traiter/`, `POST /api/demandes-organisateur/{id}/traiter/`, `POST /api/signalements/{id}/traiter/` et `POST /api/dons/{id}/verifier/`.

## Données de démonstration

`python manage.py seed_demo` ajoute des données fictives pour les entités du diagramme. La commande peut être relancée et n'efface aucune donnée existante. Elle crée des comptes citoyens et organisateurs avec le mot de passe initial `MoubedraDemo2026!`, ainsi qu'un compte administrateur (`admin@moubedra.tn`) avec le mot de passe initial `MoubedraAdmin2026!`. Réservés au développement local : change ces mots de passe avant tout déploiement.

## Configuration

Copier `.env.example` vers `.env`, puis définir `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS` et `FRONTEND_URL`. Les variables d'environnement doivent être chargées par le terminal ou l'outil de déploiement; le fichier `.env` n'est pas lu automatiquement.
