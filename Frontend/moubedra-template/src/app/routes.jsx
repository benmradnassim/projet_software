import { useRoutes } from 'react-router-dom';
import Layout from './Layout';
import PublicLayout from './PublicLayout';
import RequireRole from './RequireRole';
import NotFound from './NotFound';

/**
 * Assemble automatiquement les routes de toutes les features.
 * NE PAS MODIFIER pour ajouter une page : déclarez-la dans `features/<module>/routes.jsx`.
 *
 * Format d'une route de feature :
 *   {
 *     path: '/campagnes/:id',
 *     element: <CampaignDetailPage />,      // page chargée en lazy() dans routes.jsx
 *     layout: 'app' | 'public' | 'auth',    // défaut : 'app'
 *     access: 'public' | 'auth' | ['organisateur', 'admin'],  // défaut : 'public'
 *   }
 *
 * Layouts :
 *   - 'public' : en-tête seul, pleine largeur (accueil)
 *   - 'auth'   : sans en-tête (connexion, inscription)
 *   - 'app'    : en-tête + barre latérale si connecté
 */
const modules = import.meta.glob('../features/*/routes.jsx', { eager: true });

const featureRoutes = Object.entries(modules).flatMap(([file, mod]) => {
  if (!Array.isArray(mod.default)) {
    console.warn(`[routes] ${file} doit exporter par défaut un tableau de routes.`);
    return [];
  }
  return mod.default;
});

if (import.meta.env.DEV) {
  const seen = new Set();
  for (const r of featureRoutes) {
    if (seen.has(r.path)) console.warn(`[routes] Route déclarée deux fois : ${r.path}`);
    seen.add(r.path);
  }
}

function protect(route) {
  const { access = 'public', element } = route;
  if (access === 'public') return element;
  return <RequireRole roles={Array.isArray(access) ? access : undefined}>{element}</RequireRole>;
}

const byLayout = (layout) =>
  featureRoutes
    .filter((r) => (r.layout || 'app') === layout)
    .map((r) => ({ path: r.path, element: protect(r) }));

const tree = [
  { element: <PublicLayout />, children: byLayout('public') },
  { element: <PublicLayout bare />, children: byLayout('auth') },
  { element: <Layout />, children: [...byLayout('app'), { path: '*', element: <NotFound /> }] },
];

export default function AppRoutes() {
  return useRoutes(tree);
}
