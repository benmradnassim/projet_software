/**
 * API du module Admin (vue d'ensemble).
 * Les files d'attente (utilisateurs, organisateurs, campagnes, modération, signalements) sont
 * dans les features correspondantes.
 */
import { mockResponse } from '../../lib/mock';
import { VUE_ENSEMBLE } from './mockData';

export function getVueEnsemble() {
  // TODO(API): agrégats à calculer depuis GET /api/utilisateurs/, /api/campagnes/, /api/dons/, /api/signalements/
  //   (utiliser `count` des réponses paginées) — pas d'endpoint dédié côté back
  return mockResponse(VUE_ENSEMBLE);
}
