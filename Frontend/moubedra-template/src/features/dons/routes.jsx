import { lazy } from 'react';

const DonatePage = lazy(() => import('./pages/DonatePage.jsx'));
const MyDonationsPage = lazy(() => import('./pages/MyDonationsPage.jsx'));
const ReceivedDonationsPage = lazy(() => import('./pages/ReceivedDonationsPage.jsx'));

/** Routes du module Dons — voir app/routes.jsx pour le format. */
export default [
  // /campagnes/:id/don (argent) et /campagnes/:id/don?type=materiel&q=1.1.0 (matériel)
  { path: '/campagnes/:id/don', element: <DonatePage />, access: 'auth' },
  { path: '/espace/dons', element: <MyDonationsPage />, access: 'auth' },
  { path: '/organisateur/dons', element: <ReceivedDonationsPage />, access: ['organisateur'] },
];
