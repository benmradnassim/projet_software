import { lazy } from 'react';

const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage.jsx'));

/** Routes du module Admin — voir app/routes.jsx pour le format. */
export default [{ path: '/admin', element: <AdminDashboardPage />, access: ['admin'] }];
