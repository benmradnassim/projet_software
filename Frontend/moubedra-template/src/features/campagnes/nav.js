import { LayoutDashboard, Megaphone } from 'lucide-react';

/** Entrées de la barre latérale du module — voir app/navigation.js pour le format. */
export default [
  { to: '/campagnes', label: 'Campagnes', icon: Megaphone, roles: ['citoyen'], group: 'Agir', order: 0 },
  { to: '/organisateur', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['organisateur'], group: 'Général', order: 0, end: true },
  { to: '/organisateur/campagnes', label: 'Mes campagnes', icon: Megaphone, roles: ['organisateur'], group: 'Mes actions', order: 0 },
  // TODO(API): compteur = nombre de campagnes en revue (GET /api/campagnes/?statut=brouillon)
  { to: '/admin/campagnes', label: 'Campagnes', icon: Megaphone, roles: ['admin'], group: 'File d’attente', order: 1, badge: 2 },
];
