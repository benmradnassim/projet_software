import { lazy } from 'react';

const CampaignsPage = lazy(() => import('./pages/CampaignsPage.jsx'));
const CampaignDetailPage = lazy(() => import('./pages/CampaignDetailPage.jsx'));
const OrgDashboardPage = lazy(() => import('./pages/OrgDashboardPage.jsx'));
const MyCampaignsPage = lazy(() => import('./pages/MyCampaignsPage.jsx'));
const NewCampaignPage = lazy(() => import('./pages/NewCampaignPage.jsx'));
const AdminCampaignsPage = lazy(() => import('./pages/AdminCampaignsPage.jsx'));

/** Routes du module Campagnes — voir app/routes.jsx pour le format. */
export default [
  { path: '/campagnes', element: <CampaignsPage /> },
  { path: '/campagnes/:id', element: <CampaignDetailPage /> },
  { path: '/organisateur', element: <OrgDashboardPage />, access: ['organisateur'] },
  { path: '/organisateur/campagnes', element: <MyCampaignsPage />, access: ['organisateur'] },
  { path: '/organisateur/campagnes/nouvelle', element: <NewCampaignPage />, access: ['organisateur'] },
  { path: '/admin/campagnes', element: <AdminCampaignsPage />, access: ['admin'] },
];
