# moubedra — front React

Interface de **moubedra**, la plateforme solidaire tunisienne : campagnes, événements bénévoles, dons en argent et en matériel, fil communautaire, modération. Elle reproduit la maquette de référence `docs/maquette/index.html` en React 18 + Vite 5.

Pour travailler en équipe (structure, règles, branchement de l'API, Git), lisez **[CONTRIBUTING.md](../../CONTRIBUTING.md)** à la racine du dépôt.

## Prérequis

- Node.js 18 ou plus récent (testé avec Node 22) et npm
- Pour le mode connecté : le back Django lancé (voir `backend/README.md`)

## Installation

```powershell
cd Frontend/moubedra-template
npm install
Copy-Item .env.example .env        # macOS / Linux : cp .env.example .env
```

## Configuration (`.env`)

| Variable | Exemple | Rôle |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000/api` | URL de l'API Django, sans slash final |
| `VITE_DEMO` | `true` | `true` : données fictives, connexion démo par rôle et sélecteur de rôle dans la barre latérale. `false` : vraie connexion JWT sur le back |

- Le fichier `.env` n'est pas versionné. Relancez `npm run dev` après l'avoir modifié.
- Avec `VITE_DEMO=false`, le back doit autoriser l'origine du front (`FRONTEND_URL=http://localhost:5173` dans le `.env` du back). Ouvrez bien **http://localhost:5173** et non `127.0.0.1:5173` : c'est l'origine autorisée par CORS.

## Modules branchés sur l'API

| Module | Avec `VITE_DEMO=false` |
|---|---|
| Auth | connexion JWT, inscription, profil courant (`/utilisateurs/moi/`), refus des comptes suspendus ou désactivés |
| Utilisateurs | « Mon compte » (profil + mot de passe), admin « Utilisateurs » (liste, suspension confirmée, réactivation, désactivation) |
| Autres modules | données fictives (voir les `TODO(API)`) |

Comptes de test créés par `python manage.py seed_demo` : `nour.saada@example.tn` / `MoubedraDemo2026!` (citoyenne), `admin@moubedra.tn` / `MoubedraAdmin2026!` (admin).

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | serveur de développement sur http://localhost:5173 |
| `npm run build` | build de production dans `dist/` |
| `npm run preview` | sert le build de `dist/` pour le vérifier |

## Essayer la démo

1. `VITE_DEMO=true` puis `npm run dev`.
2. Ouvrez http://localhost:5173/connexion et cliquez sur **Citoyen**, **Organisateur** ou **Admin** dans « Tester sans compte ».
3. Changez de rôle à tout moment avec le sélecteur en bas de la barre latérale.

| Rôle | Tableau de bord | À voir |
|---|---|---|
| Citoyen | `/espace` | campagnes, don en argent et en matériel, événements + QR code, mes dons, fil |
| Organisateur | `/organisateur` | mes campagnes, assistant de création, demandes, dons reçus, mode jour J |
| Admin | `/admin` | utilisateurs, demandes organisateur, revue des campagnes, modération IA, signalements |

Les actions sont simulées en mémoire. Un rechargement de la page remet les données fictives à zéro.

## Organisation du code

```
src/
  app/        coque : routes et barre latérale assemblées automatiquement, layouts, session, protection par rôle
  design/     design system : jetons, animations, composants, hooks
  lib/        client HTTP (api.js), formatage (format.js), useApi, outils de démo
  features/   un dossier par module : accueil, auth, utilisateurs, campagnes, evenements,
              dons, publications, signalements, notifications, admin
public/media/ images et vidéo de la maquette
```

Chaque module contient `routes.jsx`, `nav.js`, `api.js`, `mockData.js`, `index.js`, `pages/` et `components/`. Les appels à l'API sont isolés dans `api.js` et marqués `// TODO(API)` :

```powershell
git grep -n "TODO(API)" -- src/features
```

## Dépendances

React 18, React Router 6, Vite 5, `lucide-react` (icônes), `qrcode.react` (QR codes), `@fontsource/manrope` et `@fontsource/dm-sans` (polices servies localement). N'ajoutez pas de dépendance sans en parler à l'équipe.

## Accessibilité

Boutons et liens natifs, menus et fenêtres fermables avec `Échap`, focus visible, aucun texte sous 13 px, respect de `prefers-reduced-motion` (vidéo remplacée par son image, animations coupées). Les détails sont dans [CONTRIBUTING.md](../../CONTRIBUTING.md#6-design-system-et-accessibilité).
