import { lazy } from 'react';

const NotificationsPage = lazy(() => import('./pages/NotificationsPage.jsx'));

/** Routes du module Notifications — voir app/routes.jsx pour le format. */
export default [{ path: '/espace/notifications', element: <NotificationsPage />, access: 'auth' }];
