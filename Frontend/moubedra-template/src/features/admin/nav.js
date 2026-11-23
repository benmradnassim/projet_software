import { LayoutDashboard } from 'lucide-react';

/** Entrées de la barre latérale du module — voir app/navigation.js pour le format. */
export default [{ to: '/admin', label: 'Vue d’ensemble', icon: LayoutDashboard, roles: ['admin'], group: 'Général', order: 0, end: true }];
