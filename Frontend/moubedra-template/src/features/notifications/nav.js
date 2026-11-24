import { Bell } from 'lucide-react';

/** Entrées de la barre latérale du module — voir app/navigation.js pour le format. */
// TODO(API): compteurs = notifications non lues
export default [
  { to: '/espace/notifications', label: 'Notifications', icon: Bell, roles: ['citoyen'], group: 'Communauté', order: 1, badge: 3 },
  { to: '/espace/notifications', label: 'Notifications', icon: Bell, roles: ['organisateur'], group: 'Communauté', order: 1, badge: 2 },
  { to: '/espace/notifications', label: 'Notifications', icon: Bell, roles: ['admin'], group: 'Plateforme', order: 2 },
];
