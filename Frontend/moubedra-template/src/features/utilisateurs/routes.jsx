import { lazy } from 'react';

const CitizenDashboardPage = lazy(() => import('./pages/CitizenDashboardPage.jsx'));
const AccountPage = lazy(() => import('./pages/AccountPage.jsx'));
const OrganizerRequestPage = lazy(() => import('./pages/OrganizerRequestPage.jsx'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage.jsx'));
const AdminOrganizerRequestsPage = lazy(() => import('./pages/AdminOrganizerRequestsPage.jsx'));

/** Routes du module Utilisateurs — voir app/routes.jsx pour le format. */
export default [
  { path: '/espace', element: <CitizenDashboardPage />, access: ['citoyen'] },
  { path: '/espace/compte', element: <AccountPage />, access: 'auth' },
  { path: '/espace/devenir-organisateur', element: <OrganizerRequestPage />, access: ['citoyen'] },
  { path: '/admin/utilisateurs', element: <AdminUsersPage />, access: ['admin'] },
  { path: '/admin/organisateurs', element: <AdminOrganizerRequestsPage />, access: ['admin'] },
];
