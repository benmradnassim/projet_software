/**
 * API du module Accueil.
 */
import { mockResponse } from '../../lib/mock';
import { BANDEAU, CAMPAGNE_A_LA_UNE, DONATEURS_RECENTS, ENGAGES, POULS, RECHERCHES_SUGGEREES, STATISTIQUES } from './mockData';

export function getStatistiques() {
  // TODO(API): agrégats à calculer depuis GET /api/campagnes/ et /api/dons/ (champ `count`) — pas d'endpoint dédié
  return mockResponse(STATISTIQUES, 0);
}

export function getPouls() {
  // TODO(API): activité du jour — pas d'endpoint dédié (GET /api/dons/?date_don__gte=<aujourd'hui>)
  return mockResponse(POULS, 0);
}

export function getContenusAccueil() {
  // TODO(API): donateurs récents depuis GET /api/dons/?ordering=-date_don — voir backend/api/components/don
  return mockResponse({ recherches: RECHERCHES_SUGGEREES, donateurs: DONATEURS_RECENTS, bandeau: BANDEAU, a_la_une: CAMPAGNE_A_LA_UNE, engages: ENGAGES }, 0);
}

/** Version synchrone pour le popover du logo (en-tête). */
export const POULS_DU_JOUR = POULS;
