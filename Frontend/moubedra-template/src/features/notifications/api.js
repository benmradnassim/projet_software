/**
 * API du module Notifications.
 * Pas encore de modèle côté back : la forme est proposée dans mockData.js.
 */
import { mockResponse } from '../../lib/mock';
import { NON_LUES_PAR_ROLE, NOTIFICATIONS } from './mockData';

let notifications = [...NOTIFICATIONS];

export function listNotifications() {
  // TODO(API): pas encore d'endpoint — à créer (ex. GET /api/notifications/ dans backend/api/components/notification)
  return mockResponse(notifications);
}

export function marquerToutLu() {
  // TODO(API): pas encore d'endpoint — ex. POST /api/notifications/tout-lu/
  notifications = notifications.map((n) => ({ ...n, lu: true }));
  return mockResponse({ ok: true }, 150);
}

/** Compteur synchrone pour l'en-tête (démo). */
export const nonLues = (role) => NON_LUES_PAR_ROLE[role] ?? 0;
