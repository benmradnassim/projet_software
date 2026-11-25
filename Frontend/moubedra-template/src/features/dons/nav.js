import { Wallet } from 'lucide-react';

/** Entrées de la barre latérale du module — voir app/navigation.js pour le format. */
export default [
  { to: '/espace/dons', label: 'Mes dons', icon: Wallet, roles: ['citoyen'], group: 'Agir', order: 3 },
  // TODO(API): compteur = dons en attente de vérification ? { to: '/organisateur/dons', label: 'Dons reçus', icon: Wallet, roles: ['organisateur'], group: 'Mes actions', order: 3, badge: 5 },
];
