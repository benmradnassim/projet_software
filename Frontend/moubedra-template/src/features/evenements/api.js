/**
 * API du module Événements (+ participations aux événements).
 * Données fictives de même forme que EvenementSerializer / DemandeParticipationEvenementSerializer.
 */
import { api, unwrapList } from '../../lib/api'; // eslint-disable-line no-unused-vars
import { mockResponse, nextId } from '../../lib/mock';
import {
  A_PREVOIR,
  DEMANDES_RECUES,
  EN_ATTENTE_PAR_EVENEMENT,
  EVENEMENTS,
  MES_EVENEMENTS,
  MES_PARTICIPATIONS,
  PROGRAMME,
  SCANS_INITIAUX,
  SCANS_SIMULES,
} from './mockData';

let participations = [...MES_PARTICIPATIONS];
let demandes = [...DEMANDES_RECUES];

/** Événements à venir (les événements terminés sont exclus). params : { ville, campagne } */
export function listEvenements(params = {}) {
  // TODO(API): remplacer par GET /api/evenements/?statut=planifie — voir backend/api/components/evenement
  let list = EVENEMENTS.filter((e) => e.statut !== 'termine');
  if (params.campagne) list = list.filter((e) => e.campagne === Number(params.campagne));
  return mockResponse(list);
}

export function getEvenement(id) {
  // TODO(API): remplacer par GET /api/evenements/<id>/ — voir backend/api/components/evenement
  return mockResponse(EVENEMENTS.find((e) => e.id === Number(id)) || null);
}

/** Programme et liste « à prévoir » (UI : pas encore de champ côté back). */
export function getProgramme() {
  // TODO(API): champs à ajouter sur Evenement (backend/api/components/evenement)
  return mockResponse({ programme: PROGRAMME, a_prevoir: A_PREVOIR }, 50);
}

/* ---------- participations du citoyen ---------- */

/** Mes demandes, avec l'événement imbriqué (UI : le back renvoie seulement l'id). */
export function listMesParticipations() {
  // TODO(API): remplacer par GET /api/participations/evenements/ — voir backend/api/components/participation_evenement
  return mockResponse(participations.map((p) => ({ ...p, evenement_detail: EVENEMENTS.find((e) => e.id === p.evenement) })));
}

/** Ma participation à un événement (ou null). */
export function getMaParticipation(evenementId) {
  // TODO(API): remplacer par GET /api/participations/evenements/?evenement=<id> — voir backend/api/components/participation_evenement
  return mockResponse(participations.find((p) => p.evenement === Number(evenementId) && p.statut !== 'annulee') || null, 80);
}

export function demanderParticipation(evenementId, motif = '') {
  // TODO(API): remplacer par POST /api/participations/evenements/ { evenement, motif } — voir backend/api/components/participation_evenement
  const p = { id: nextId(), utilisateur: 1, evenement: Number(evenementId), date_demande: new Date().toISOString(), type: 'benevole', motif, statut: 'en_attente', code_qr: crypto.randomUUID?.() || String(Date.now()) };
  participations = [p, ...participations];
  return mockResponse(p, 800);
}

export function annulerParticipation(id) {
  // TODO(API): remplacer par DELETE /api/participations/evenements/<id>/ — voir backend/api/components/participation_evenement
  participations = participations.map((p) => (p.id === id ? { ...p, statut: 'annulee' } : p));
  return mockResponse({ id }, 300);
}

/* ---------- espace organisateur ---------- */

export function listMesEvenements() {
  // TODO(API): remplacer par GET /api/evenements/?organisateur=<moi> — voir backend/api/components/evenement
  return mockResponse(
    MES_EVENEMENTS.map((id) => ({ ...EVENEMENTS.find((e) => e.id === id), nb_en_attente: EN_ATTENTE_PAR_EVENEMENT[id] })),
  );
}

export function listDemandesRecues() {
  // TODO(API): remplacer par GET /api/participations/evenements/?statut=en_attente — voir backend/api/components/participation_evenement
  return mockResponse(demandes.filter((d) => d.statut === 'en_attente'));
}

/** decision : 'acceptee' | 'refusee' */
export function deciderDemande(id, decision) {
  // TODO(API): remplacer par PATCH /api/participations/evenements/<id>/ { statut } — voir backend/api/components/participation_evenement
  //   (`statut` est en lecture seule : utiliser POST /api/participations/evenements/<id>/traiter/ annoncé dans backend/README.md)
  demandes = demandes.map((d) => (d.id === id ? { ...d, statut: decision } : d));
  return mockResponse({ id, statut: decision }, 200);
}

/** Mode jour J : journal des scans. */
export function getScans() {
  // TODO(API): pas encore d'endpoint de pointage — à créer (scan du code_qr d'une participation)
  return mockResponse({ initiaux: SCANS_INITIAUX, simules: SCANS_SIMULES }, 50);
}
