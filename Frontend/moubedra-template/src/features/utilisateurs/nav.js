import { Building2, LayoutDashboard, User, UserCheck, UserPlus, Users } from 'lucide-react';

/** Entrées de la barre latérale du module — voir app/navigation.js pour le format. */
export default [
  { to: '/espace', label: 'Tableau de bord', icon: LayoutDashboard, roles: ['citoyen'], group: 'Général', order: 0, end: true },
  { to: '/espace/compte', label: 'Mon compte', icon: User, roles: ['citoyen', 'admin'], group: 'Compte', order: 0 },
  { to: '/espace/compte', label: 'Profil de l’association', icon: Building2, roles: ['organisateur'], group: 'Compte', order: 0 },
  { to: '/espace/devenir-organisateur', label: 'Devenir organisateur', icon: UserPlus, roles: ['citoyen'], group: 'Compte', order: 1 },
  // TODO(API): compteur = demandes organisateur en attente
  { to: '/admin/organisateurs', label: 'Organisateurs', icon: UserCheck, roles: ['admin'], group: 'File d’attente', order: 0, badge: 3 },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users, roles: ['admin'], group: 'Plateforme', order: 0 },
];
