import { lazy } from 'react';

const MyReportsPage = lazy(() => import('./pages/MyReportsPage.jsx'));
const OrgReportsPage = lazy(() => import('./pages/OrgReportsPage.jsx'));
const AdminReportsPage = lazy(() => import('./pages/AdminReportsPage.jsx'));

/** Routes du module Signalements — voir app/routes.jsx pour le format. */
export default [
  { path: '/espace/signalements', element: <MyReportsPage />, access: 'auth' },
  { path: '/organisateur/signalements', element: <OrgReportsPage />, access: ['organisateur'] },
  { path: '/admin/signalements', element: <AdminReportsPage />, access: ['admin'] },
];
