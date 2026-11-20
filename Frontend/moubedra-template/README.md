# moubedra — template React

Interface responsive en français pour AccessiCity. Les campagnes et les événements sont des espaces distincts : un événement présente une activité concrète (atelier, rencontre ou action), avec son propre lieu, sa date, sa capacité et sa description. La page d’accueil conserve son bandeau partagé entre texte et photographie, son style chaleureux et ses cartes arrondies. Le template ajoute des espaces de démonstration pour les rôles Utilisateur, Citoyen, Organisateur et Admin.

Les espaces de démonstration des campagnes, dons, publications et profils utilisent les données centralisées dans `src/mockData.js`. En mode démo Organisateur, les événements sont simulés localement : vous pouvez essayer de créer, modifier et supprimer vos propres événements sans compte serveur; ces changements ne sont pas enregistrés dans SQLite. Le formulaire événement accepte une photo (5 Mo maximum); en mode connecté, Django la conserve dans `backend/media/events/`. Les événements plus anciens sans photo utilisent des visuels de remplacement variés. En mode connecté, l’API Django applique les permissions : les organisateurs gèrent uniquement leurs événements, et l’administrateur ne dispose pas de gestion des événements. Les citoyens et les organisateurs peuvent demander à participer à un événement planifié qui ne leur appartient pas. La demande reste en attente jusqu’à acceptation; le QR code est alors créé pour cette participation. Aucun paiement réel n’est effectué.

## Démarrer

```bash
npm install
npm run dev
```

Le backend doit être démarré séparément depuis `backend` avec `python manage.py runserver`.

Les icônes proviennent de Lucide React. Les polices et photographies sont chargées depuis Google Fonts et Unsplash.
