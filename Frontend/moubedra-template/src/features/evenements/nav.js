import { CalendarDays, HandHeart, Users } from 'lucide-react';

/** Entrées de la barre latérale du module — voir app/navigation.js pour le format. */
export default [
  { to: '/evenements', label: 'Événements', icon: CalendarDays, roles: ['citoyen'], group: 'Agir', order: 1 },
  // TODO(API): compteur = participations à venir
  { to: '/espace/participations', label: 'Mes participations', icon: HandHeart, roles: ['citoyen'], group: 'Agir', order: 2, badge: 2 },
  { to: '/organisateur/evenements', label: 'Mes événements', icon: CalendarDays, roles: ['organisateur'], group: 'Mes actions', order: 1 },
  // TODO(API): compteur = demandes en attente
  { to: '/organisateur/demandes', label: 'Demandes', icon: Users, roles: ['organisateur'], group: 'Mes actions', order: 2, badge: 4, pulse: true },
];
