import { lazy } from 'react';

const AuthPage = lazy(() => import('./pages/AuthPage.jsx'));

/** Routes du module Auth — voir app/routes.jsx pour le format. */
export default [
  { path: '/connexion', element: <AuthPage mode="login" />, layout: 'auth' },
  { path: '/inscription', element: <AuthPage mode="signup" />, layout: 'auth' },
];
