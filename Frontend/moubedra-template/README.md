# moubedra — template React

Interface responsive en français pour une plateforme de campagnes solidaires en Tunisie. La page d’accueil conserve son bandeau partagé entre texte et photographie, son style chaleureux et ses cartes arrondies. Le template ajoute des espaces de démonstration pour les rôles Utilisateur, Citoyen, Organisateur et Admin.

Les pages comprennent l’authentification simulée, les campagnes, participations, dons, événements, publications et commentaires, signalements, notifications, profils et écrans d’administration. Les données réalistes sont centralisées dans `src/mockData.js`. Les actions sont simulées dans le navigateur et les confirmations apparaissent sous forme de toasts. Aucun backend ni paiement réel n’est utilisé. L’actualisation de la page réinitialise les modifications de démonstration.

## Démarrer

```bash
npm install
npm run dev
```

Les icônes proviennent de Lucide React. Les polices et photographies sont chargées depuis Google Fonts et Unsplash.

## Module « Gestion des utilisateurs » branché sur l'API

La connexion, l'inscription, la page « Mon compte » et l'écran Admin « Gestion des utilisateurs » appellent l'API Django (`src/api.js`, `src/users.jsx`). Les autres écrans restent en données de démonstration.

1. Démarrer le backend (`python manage.py runserver`, voir `backend/README.md`).
2. Lancer `npm run dev` et ouvrir **http://localhost:5173** (et non `127.0.0.1`, origine autorisée par CORS).

Le jeton JWT est conservé dans le `localStorage` et renouvelé automatiquement. L'URL de l'API peut être changée avec la variable `VITE_API_URL` (par défaut `http://127.0.0.1:8000/api`).
