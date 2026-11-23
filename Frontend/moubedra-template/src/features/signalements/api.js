/**
 * API du module Signalements.
 * Données fictives de même forme que SignalementSerializer (+ champs UI, voir mockData.js).
 */
import { api, unwrapList } from '../../lib/api'; // eslint-disable-line no-unused-vars
import { mockResponse, nextId } from '../../lib/mock';
import { MES_SIGNALEMENTS, MOTIFS, REGLE_42, SIGNALEMENTS_ADMIN, SIGNALEMENTS_ORGANISATEUR } from './mockData';

export const getMotifs = () => MOTIFS;
export const getRegle42 = () => REGLE_42;

export function listMesSignalements() {
  // TODO(API): remplacer par GET /api/signalements/ — voir backend/api/components/signalement
  return mockResponse(MES_SIGNALEMENTS);
}

/** payload : { type, publication?, commentaire?, campagne?, evenement?, description } */
export function creerSignalement(payload) {
  // TODO(API): remplacer par POST /api/signalements/ — voir backend/api/components/signalement
  return mockResponse({ id: nextId(), ...payload, statut: 'en_attente', date_signalement: new Date().toISOString() }, 400);
}

export function listSignalementsOrganisateur() {
  // TODO(API): remplacer par GET /api/signalements/?campagne__organisateur=<moi> — voir backend/api/components/signalement
  return mockResponse(SIGNALEMENTS_ORGANISATEUR);
}

export function listSignalementsAdmin() {
  // TODO(API): remplacer par GET /api/signalements/?statut=en_attente — voir backend/api/components/signalement
  return mockResponse(SIGNALEMENTS_ADMIN);
}

/** decision : 'classer' (rejete) | 'retirer' (resolu) */
export function traiterSignalement(id, decision) {
  // TODO(API): remplacer par PATCH /api/signalements/<id>/ { statut: 'rejete' | 'resolu' } — voir backend/api/components/signalement
  return mockResponse({ id, statut: decision === 'retirer' ? 'resolu' : 'rejete' }, 200);
}
