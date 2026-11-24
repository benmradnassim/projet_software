import { lazy } from 'react';

const EventsPage = lazy(() => import('./pages/EventsPage.jsx'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage.jsx'));
const MyParticipationsPage = lazy(() => import('./pages/MyParticipationsPage.jsx'));
const MyEventsPage = lazy(() => import('./pages/MyEventsPage.jsx'));
const ParticipationRequestsPage = lazy(() => import('./pages/ParticipationRequestsPage.jsx'));

/** Routes du module Événements — voir app/routes.jsx pour le format. */
export default [
  { path: '/evenements', element: <EventsPage /> },
  { path: '/evenements/:id', element: <EventDetailPage /> },
  { path: '/espace/participations', element: <MyParticipationsPage />, access: 'auth' },
  { path: '/organisateur/evenements', element: <MyEventsPage />, access: ['organisateur'] },
  { path: '/organisateur/demandes', element: <ParticipationRequestsPage />, access: ['organisateur'] },
];
