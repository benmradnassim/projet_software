import { lazy } from 'react';

const HomePage = lazy(() => import('./pages/HomePage.jsx'));

/** Routes du module Accueil — voir app/routes.jsx pour le format. */
export default [{ path: '/', element: <HomePage />, layout: 'public' }];
