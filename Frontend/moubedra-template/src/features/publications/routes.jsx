import { lazy } from 'react';

const FeedPage = lazy(() => import('./pages/FeedPage.jsx'));
const ModerationPage = lazy(() => import('./pages/ModerationPage.jsx'));

/** Routes du module Publications — voir app/routes.jsx pour le format. */
export default [
  { path: '/communaute', element: <FeedPage /> },
  { path: '/admin/moderation', element: <ModerationPage />, access: ['admin'] },
];
