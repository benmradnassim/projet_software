import { Flag } from 'lucide-react';

/** Entrées de la barre latérale du module — voir app/navigation.js pour le format. */
export default [
  { to: '/espace/signalements', label: 'Mes signalements', icon: Flag, roles: ['citoyen'], group: 'Communauté', order: 2 },
  // TODO(API): compteurs = signalements à traiter
  { to: '/organisateur/signalements', label: 'Signalements', icon: Flag, roles: ['organisateur'], group: 'Communauté', order: 2, badge: 1 },
  { to: '/admin/signalements', label: 'Signalements', icon: Flag, roles: ['admin'], group: 'File d’attente', order: 3, badge: 4 },
];
