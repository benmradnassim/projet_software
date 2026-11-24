import { MessageCircle, ShieldCheck } from 'lucide-react';

/** Entrées de la barre latérale du module — voir app/navigation.js pour le format. */
export default [
  { to: '/communaute', label: 'Le fil', icon: MessageCircle, roles: ['citoyen', 'organisateur'], group: 'Communauté', order: 0 },
  { to: '/communaute', label: 'Le fil', icon: MessageCircle, roles: ['admin'], group: 'Plateforme', order: 1 },
  // TODO(API): compteur = contenus en file de modération
  { to: '/admin/moderation', label: 'Modération IA', icon: ShieldCheck, roles: ['admin'], group: 'File d’attente', order: 2, badge: 3 },
];
