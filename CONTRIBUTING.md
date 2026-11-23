# Contribuer à moubedra

Ce guide explique comment travailler à six sur le dépôt sans se marcher dessus. Il couvre le front React (`Frontend/moubedra-template/`) et le back Django (`backend/`).

**La règle d'or : chacun ne modifie que le dossier de son module.**

- Front : `Frontend/moubedra-template/src/features/<mon-module>/`
- Back : `backend/api/components/<mon-composant>/`

Tout le reste (structure, design system, client HTTP) est partagé. On le modifie uniquement par une PR dédiée, relue par le responsable du projet.

---

## Sommaire

1. [Démarrer en local](#1-démarrer-en-local)
2. [Structure du front](#2-structure-du-front)
3. [Qui possède quel dossier](#3-qui-possède-quel-dossier)
4. [Ajouter une page, une route, une entrée de menu](#4-ajouter-une-page-une-route-une-entrée-de-menu)
5. [Brancher une API (exemple complet)](#5-brancher-une-api-exemple-complet)
6. [Design system et accessibilité](#6-design-system-et-accessibilité)
7. [Conventions de commit](#7-conventions-de-commit)
8. [Workflow Git](#8-workflow-git)
9. [Écarts connus entre le front et le back](#9-écarts-connus-entre-le-front-et-le-back)
10. [Checklist avant d'ouvrir une PR](#10-checklist-avant-douvrir-une-pr)

---

## 1. Démarrer en local

**Back** (voir aussi `backend/README.md`) :

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver        # http://127.0.0.1:8000/api/
```

**Front** (voir aussi `Frontend/moubedra-template/README.md`) :

```powershell
cd Frontend/moubedra-template
npm install
Copy-Item .env.example .env       # VITE_API_URL et VITE_DEMO
npm run dev                       # http://localhost:5173
```

Avec `VITE_DEMO=true`, le front fonctionne sans back : données fictives, connexion démo par rôle (« Tester sans compte » sur `/connexion`) et sélecteur Citoyen / Organisateur / Admin en bas de la barre latérale. Pour tester avec le vrai back, passez `VITE_DEMO=false`.

La maquette de référence est dans `docs/maquette/index.html`. Ouvrez-la dans un navigateur pour comparer : l'interface doit rester identique.

---

## 2. Structure du front

```
src/
  main.jsx              point d'entrée (Router + AuthProvider + ToastProvider)
  app/                  PARTAGÉ : coque de l'application
    routes.jsx          assemble AUTOMATIQUEMENT les routes de toutes les features
    navigation.js       assemble AUTOMATIQUEMENT la barre latérale (groupes par rôle, carte d'aide)
    Layout.jsx          en-tête + barre latérale (si connecté) + <Outlet/>
    PublicLayout.jsx    en-tête seul (accueil) ou sans en-tête (connexion)
    AuthContext.jsx     utilisateur, rôle, login / logout, connexion démo
    RequireRole.jsx     protection des routes par rôle
    Header.jsx, Sidebar.jsx, PulsePopover.jsx, Logo.jsx, layout.css
  design/               PARTAGÉ : design system
    tokens.css          couleurs, polices, reset (utilisez les variables : var(--navy), var(--orange)…)
    animations.css      keyframes de la maquette + prefers-reduced-motion
    components.css      styles des composants partagés
    components/         Button, Panel, Badge, Chip, Input, Select, Toggle, Stepper, Tabs, Modal, Menu,
                        Toast, EmptyState, PageHeader, DataTable, ProgressBar, StatCard, Avatar,
                        Skeleton, Timeline, StepsBar, DateBadge, MapPreview, BarChart, TodoCards, Icon, confetti
    hooks/              useHideOnScroll, useCountUp, useInView, useReducedMotion, useDismiss
  lib/                  PARTAGÉ : utilitaires
    api.js              LE client HTTP (JWT, renouvellement sur 401, erreurs normalisées)
    format.js           montants TND, dates en français, pluriels
    useApi.js           hook de chargement de données
    mock.js             outils pour les données fictives
  features/<module>/    À VOUS : un dossier par module
    routes.jsx          les routes du module
    nav.js              les entrées de la barre latérale du module
    api.js              les appels HTTP du module (aujourd'hui : données fictives)
    mockData.js         les données fictives (même forme que les serializers Django)
    index.js            l'API publique du module pour les autres features
    pages/              une page = un fichier
    components/         les composants propres au module
    <module>.css        les styles propres au module
```

### Imports entre features

Une feature peut utiliser une autre feature **uniquement via son `index.js`** :

```js
import { listCampagnes, CampaignCard } from '../../campagnes';                 // ✅
import CampaignCard from '../../campagnes/components/CampaignCard';            // ❌ interdit
```

Ce que votre `index.js` exporte, c'est votre contrat avec les autres. Si vous changez la signature d'une fonction exportée, prévenez les modules qui l'utilisent (`git grep "from '../../<module>'"`).

---

## 3. Qui possède quel dossier

| Module | Front (`src/features/…`) | Back (`backend/api/components/…`) | Pages principales | Responsable |
|---|---|---|---|---|
| Auth & utilisateurs | `auth/`, `utilisateurs/` | `utilisateur/`, `demande_organisateur/` | connexion, inscription, tableau de bord citoyen, mon compte, devenir organisateur, admin utilisateurs et organisateurs | _à compléter_ |
| Campagnes | `campagnes/` | `campagne/`, `participation_campagne/` | liste, détail, espace organisateur, assistant de création, revue admin | _à compléter_ |
| Événements | `evenements/` | `evenement/`, `participation_evenement/` | liste, détail + QR, mes participations, jour J, demandes | _à compléter_ |
| Dons | `dons/` | `don/` | don argent et matériel, mes dons, dons reçus | _à compléter_ |
| Communauté | `publications/`, `notifications/` | `publication/`, `commentaire/`, `like/` | fil, modération IA, notifications | _à compléter_ |
| Modération & admin | `signalements/`, `admin/` | `signalement/` | signalements (3 vues), vue d'ensemble admin | _à compléter_ |
| Socle | `accueil/`, `app/`, `design/`, `lib/` | `config/`, `api/permissions.py`, `api/views_common.py` | accueil, en-tête, barre latérale, design system | responsable du projet |

> Remplissez la colonne « Responsable » lors de la première réunion d'équipe.

---

## 4. Ajouter une page, une route, une entrée de menu

Tout se fait dans **votre** dossier. `app/routes.jsx` et `app/navigation.js` découvrent automatiquement vos fichiers : n'y touchez pas.

### a) Créer la page

`src/features/evenements/pages/EventEditPage.jsx` :

```jsx
import { PageHeader, Panel } from '../../../design/components';

export default function EventEditPage() {
  return (
    <div className="pg">
      <PageHeader crumbs={['Mes actions', 'Modifier un événement']} title="Modifier l’événement" />
      <Panel>…</Panel>
    </div>
  );
}
```

La classe `pg` donne l'animation d'entrée de page de la maquette.

### b) Déclarer la route

`src/features/evenements/routes.jsx` :

```jsx
const EventEditPage = lazy(() => import('./pages/EventEditPage.jsx'));

export default [
  // …routes existantes
  { path: '/organisateur/evenements/:id/modifier', element: <EventEditPage />, access: ['organisateur'] },
];
```

| Champ | Valeurs | Défaut |
|---|---|---|
| `layout` | `'app'` (en-tête + barre latérale si connecté), `'public'` (en-tête seul, pleine largeur), `'auth'` (sans en-tête) | `'app'` |
| `access` | `'public'`, `'auth'` (tout utilisateur connecté), `['organisateur']`, `['admin']`, `['citoyen', 'organisateur']`… | `'public'` |

Un visiteur non connecté est envoyé sur `/connexion`, puis ramené à la page demandée. Un utilisateur qui n'a pas le bon rôle est renvoyé vers son tableau de bord.

### c) Ajouter une entrée dans la barre latérale (si besoin)

`src/features/evenements/nav.js` :

```js
import { CalendarDays } from 'lucide-react';

export default [
  { to: '/organisateur/evenements', label: 'Mes événements', icon: CalendarDays, roles: ['organisateur'], group: 'Mes actions', order: 1 },
];
```

- `group` doit être l'un des groupes du rôle :
  - citoyen : `Général`, `Agir`, `Communauté`, `Compte` ;
  - organisateur : `Général`, `Mes actions`, `Communauté`, `Compte` ;
  - admin : `Général`, `File d’attente`, `Plateforme`, `Compte`.
- `order` trie les entrées dans le groupe.
- Champs facultatifs : `badge: 4` (compteur), `pulse: true` (compteur qui pulse), `end: true` (actif seulement sur l'URL exacte, pour un tableau de bord).

En développement, la console signale une route déclarée deux fois ou un groupe inconnu.

---

## 5. Brancher une API (exemple complet)

Les pages n'appellent **jamais** `fetch` directement. Elles appellent les fonctions de `features/<module>/api.js`. Aujourd'hui, ces fonctions renvoient des données fictives de la même forme que les serializers Django. Brancher le back, c'est **changer le corps de ces fonctions, sans changer leur signature** : les pages continuent de fonctionner.

Chaque fonction à brancher porte un commentaire `// TODO(API): …` qui indique l'endpoint et le dossier back concerné :

```powershell
git grep -n "TODO(API)" -- Frontend/moubedra-template/src/features/campagnes
```

### Exemple : le module Campagnes

**Avant** (`src/features/campagnes/api.js`) :

```js
export function listCampagnes() {
  // TODO(API): remplacer par GET /api/campagnes/ — voir backend/api/components/campagne
  return mockResponse(CAMPAGNES);
}

export function getCampagne(id) {
  // TODO(API): remplacer par GET /api/campagnes/<id>/ — voir backend/api/components/campagne
  return mockResponse(CAMPAGNES.find((c) => c.id === Number(id)) || null);
}

export function createCampagne(data) {
  // TODO(API): remplacer par POST /api/campagnes/ — voir backend/api/components/campagne
  …
}
```

**Après** :

```js
import { api, unwrapList } from '../../lib/api';
import { daysLeft } from '../../lib/format';

/**
 * Le serializer ne renvoie pas encore certains champs affichés par l'interface
 * (ville, nb_donateurs, jours_restants…). On les complète ici, à un seul endroit,
 * tant que le back ne les fournit pas.
 */
const versUI = (c) => ({
  ...c,
  organisation: c.organisation || c.organisateur_nom,
  jours_restants: c.jours_restants ?? daysLeft(c.date_fin),
  nb_donateurs: c.nb_donateurs ?? 0,
  ville: c.ville ?? '',
  image: c.image || '/media/covers/autre.webp',
});

export async function listCampagnes(params = {}) {
  const data = await api.get('/campagnes/', { params });   // liste paginée DRF
  return unwrapList(data).map(versUI);                      // -> toujours un tableau
}

export async function getCampagne(id) {
  try {
    return versUI(await api.get(`/campagnes/${id}/`));
  } catch (err) {
    if (err.status === 404) return null;                    // la page affiche « Campagne introuvable »
    throw err;
  }
}

export async function createCampagne(data) {
  return api.post('/campagnes/', {
    titre: data.titre,
    description: data.description,
    categorie: data.categorie,
    date_debut: data.date_debut,
    date_fin: data.date_fin,
    objectif_montant: data.objectif_montant,
    image: data.image,
  });
}
```

Ce que fait `lib/api.js` pour vous :

- préfixe avec `VITE_API_URL` et ajoute `Authorization: Bearer <access>` ;
- sur une erreur 401, renouvelle le jeton (`POST /auth/renouveler/`) puis rejoue la requête une fois. Si le renouvellement échoue, l'utilisateur est déconnecté ;
- transforme toute erreur en `ApiError` :
  - `err.message` est un message lisible en français ;
  - `err.fields` contient les erreurs par champ (`{ email: 'Un compte existe déjà…' }`) ;
  - `err.status` est le code HTTP, ou `0` en cas de problème réseau.

Côté page, rien ne change. `useApi` gère le chargement et les erreurs :

```jsx
const { data, loading, error, reload, setData } = useApi(() => listCampagnes({ ville }), [ville], []);
```

Pour afficher les erreurs de validation d'un formulaire :

```jsx
try {
  await createCampagne(form);
} catch (err) {
  setErrors(err.fields);   // { titre: 'Ce champ est obligatoire.' }
  toast(err.message);
}
```

Une fois tout le module branché :

- supprimez `mockData.js` et les imports de `lib/mock` dans votre `api.js` ;
- retirez les commentaires `TODO(API)` traités ;
- testez avec `VITE_DEMO=false` et le back lancé.

---

## 6. Design system et accessibilité

- **Réutilisez** `design/components` (importés depuis `design/components/index.js`) avant de créer un composant. S'il en manque un qui servirait à plusieurs modules, proposez-le dans une PR séparée sur `design/`.
- **Couleurs et polices** : uniquement via les variables de `tokens.css` (`var(--navy)`, `var(--orange)`, `var(--green)`, `var(--muted)`…). Pas de nouvelle police, pas de nouvelle dépendance npm sans accord.
- **Icônes** : `lucide-react`, avec les mêmes noms que dans la maquette (`<Heart size={18} aria-hidden="true" />`). Si l'icône vient des données, utilisez `<Icon name="hand-heart" />`.
- **Textes** : en français, avec les espaces insécables gérés par `lib/format.js` (`tnd(8450)` donne « 8 450 TND »).

Règles d'accessibilité, non négociables :

- Une action est un `<button type="button">`, une navigation est un `<Link>` ou un `<a>`. Jamais de `div` cliquable.
- **Aucun texte en dessous de 13 px.**
- Chaque champ a un `<label>`. Les erreurs passent par `error` sur `Input` / `FloatingField` (reliées par `aria-describedby`).
- Les menus et fenêtres se ferment avec `Échap` : `Menu` et `Modal` le font déjà, réutilisez-les.
- Une icône seule a un `aria-label`. Une icône décorative a `aria-hidden="true"`.
- Les animations respectent `prefers-reduced-motion` : c'est géré globalement par `animations.css`. Pour une animation en JavaScript, utilisez `useReducedMotion()`.
- Le focus doit rester visible : ne supprimez jamais l'`outline` sans le remplacer.

---

## 7. Conventions de commit

Format [Conventional Commits](https://www.conventionalcommits.org/fr/), en français :

```
<type>(<module>): <résumé à l'impératif, en minuscules>

<détail facultatif : pourquoi, ce qui change>
```

| Type | Usage |
|---|---|
| `feat` | nouvelle fonctionnalité (`feat(dons): branchement de l'API des dons`) |
| `fix` | correction de bug (`fix(campagnes): le tri par pourcentage ignorait les campagnes clôturées`) |
| `refactor` | restructuration sans changement de comportement |
| `style` | mise en forme, CSS sans changement fonctionnel |
| `test` | ajout ou correction de tests |
| `docs` | documentation |
| `chore` | outillage, dépendances, configuration |

Le module entre parenthèses est le nom de votre dossier (`campagnes`, `evenements`, `dons`…), ou `ui` pour le socle front.

---

## 8. Workflow Git

1. **Une branche par module**, créée depuis `main` à jour :
   ```bash
   git switch main
   git pull origin main
   git switch -c feat/dons-api
   ```
2. **Chaque jour**, remettez votre branche à jour :
   ```bash
   git pull --rebase origin main
   ```
   En cas de conflit, résolvez-le, puis `git rebase --continue`. Si le conflit touche un dossier qui n'est pas le vôtre, c'est le signe que vous êtes sorti de votre périmètre : parlez-en à l'équipe avant de forcer quoi que ce soit.
3. **Des PR petites et fréquentes** vers `main` : une fonctionnalité ou une page à la fois. Une PR relue vaut mieux qu'une PR énorme.
4. **Migrations Django** :
   - **une seule migration par PR** : regroupez vos changements de modèle avant de lancer `makemigrations` ;
   - **ne modifiez jamais une migration déjà fusionnée dans `main`**. Pour corriger, créez une nouvelle migration ;
   - si deux PR créent chacune une migration en parallèle, la seconde à fusionner fait `python manage.py makemigrations --merge` après son rebase.
5. **Ne poussez jamais** directement sur `main`, ne réécrivez pas l'historique de `main` et ne touchez pas aux branches des autres.
6. **Ne commitez jamais** `.env`, `node_modules/`, `dist/`, `db.sqlite3` ni de secrets.

---

## 9. Écarts connus entre le front et le back

Le front affiche déjà des fonctionnalités que le back ne fournit pas encore. À traiter par le module concerné :

| Sujet | État sur `main` | Ce que le front attend |
|---|---|---|
| Profil courant | pas d'endpoint « moi » : le front lit `user_id` dans le JWT | `GET/PATCH /api/utilisateurs/moi/` (annoncé dans `backend/README.md`) |
| Modifier son profil | `UtilisateurViewSet` est en lecture seule | `PATCH` du profil |
| Accepter / refuser (participations, demandes organisateur, signalements) et vérifier un don | `statut` en lecture seule dans les serializers | actions `…/traiter/` et `dons/<id>/verifier/` (annoncées dans `backend/README.md`) |
| Champs d'affichage des campagnes | `ville`, `nb_donateurs`, `jours_restants`, organisation absents du serializer | voir `versUI` dans l'exemple ci-dessus, ou les ajouter au serializer |
| Besoins et dons matériels | aucun modèle | nouveau modèle (module Campagnes / Dons) |
| Types de publication, sondages | `Publication` n'a pas de `type` | champ `type` + détails par type |
| Notifications | aucun modèle | nouveau composant `notification` |
| Favoris, préférences du compte | aucun modèle | à définir |

Dans `mockData.js`, les champs qui n'existent pas encore côté back sont marqués `// UI`.

---

## 10. Checklist avant d'ouvrir une PR

- [ ] Je n'ai modifié que mon dossier `features/<mon-module>/` (et/ou `backend/api/components/<mon-composant>/`).
- [ ] `npm run build` passe sans erreur.
- [ ] J'ai testé dans les 3 rôles concernés (sélecteur démo), avec `VITE_DEMO=true` et, si j'ai branché l'API, `VITE_DEMO=false`.
- [ ] L'écran correspond toujours à la maquette (`docs/maquette/index.html`).
- [ ] Navigation au clavier : Tab, Entrée, `Échap` sur les menus et fenêtres ; focus visible.
- [ ] Pas de texte sous 13 px, pas de couleur codée en dur hors `tokens.css`.
- [ ] Les `TODO(API)` traités sont retirés ; ceux qui restent sont à jour.
- [ ] Migrations : une seule, aucune migration fusionnée modifiée.
- [ ] Messages de commit au format conventionnel.
