/**
 * API du module Dons (argent + matériel).
 * Données fictives de même forme que DonSerializer ; le don matériel n'a pas encore de modèle côté back.
 */
import { api, unwrapList } from '../../lib/api'; // eslint-disable-line no-unused-vars
import { mockResponse, nextId } from '../../lib/mock';
import {
  CRENEAUX,
  DEPOTS_ATTENDUS,
  DONATEURS_CAMPAGNE,
  DONS_RECUS,
  MES_DONS,
  MES_DONS_MATERIELS,
  MODES_PAIEMENT,
  RESUME_DONS_RECUS,
  RESUME_MES_DONS,
} from './mockData';

let mesDons = [...MES_DONS];
let mesDonsMateriels = [...MES_DONS_MATERIELS];
let donsRecus = [...DONS_RECUS];

export const getModesPaiement = () => MODES_PAIEMENT;
export const getCreneaux = () => CRENEAUX;

/* ---------- don en argent ---------- */

/** payload : { campagne, montant, mode_paiement, anonyme, recurrent, frais } */
export function creerDon(payload) {
  // TODO(API): remplacer par POST /api/dons/ { campagne, montant, mode_paiement } — voir backend/api/components/don
  const don = {
    id: nextId(),
    donateur: 1,
    campagne: payload.campagne,
    montant: Number(payload.montant).toFixed(3),
    date_don: new Date().toISOString(),
    mode_paiement: payload.mode_paiement,
    statut: payload.mode_paiement === 'carte' ? 'confirme' : 'en_attente',
    reference_paiement: 'MBD-2611-4821',
    recurrent: !!payload.recurrent,
  };
  mesDons = [don, ...mesDons];
  return mockResponse(don, 1100);
}

export function listMesDons() {
  // TODO(API): remplacer par GET /api/dons/ — voir backend/api/components/don (le back filtre sur l'utilisateur connecté)
  return mockResponse(mesDons);
}

export function getResumeMesDons() {
  // TODO(API): à calculer depuis GET /api/dons/ — voir backend/api/components/don
  return mockResponse(RESUME_MES_DONS, 80);
}

/** Derniers donateurs d'une campagne. */
export function listDonateursCampagne(campagneId) { // eslint-disable-line no-unused-vars
  // TODO(API): remplacer par GET /api/dons/?campagne=<id> — voir backend/api/components/don
  return mockResponse(DONATEURS_CAMPAGNE);
}

/* ---------- don matériel (UI) ---------- */

/** payload : { campagne, quantites, etat, remise, creneau } */
export function creerDonMateriel(payload) {
  // TODO(API): pas encore de modèle « don matériel » côté back (à créer dans backend/api/components/don)
  const don = { id: nextId(), campagne: payload.campagne, quantites: payload.quantites, remise: payload.remise, etape: 0, code: 'MAT-SFX-0482' };
  mesDonsMateriels = [don, ...mesDonsMateriels];
  return mockResponse(don, 900);
}

export function listMesDonsMateriels() {
  // TODO(API): pas encore d'endpoint — voir creerDonMateriel
  return mockResponse(mesDonsMateriels);
}

/* ---------- espace organisateur ---------- */

export function listDonsRecus() {
  // TODO(API): remplacer par GET /api/dons/?campagne__organisateur=<moi> — voir backend/api/components/don
  return mockResponse(donsRecus);
}

export function getResumeDonsRecus() {
  // TODO(API): agrégats à calculer depuis GET /api/dons/ — voir backend/api/components/don
  return mockResponse(RESUME_DONS_RECUS, 80);
}

/** Confirme un paiement D17 reçu. */
export function confirmerDon(id) {
  // TODO(API): remplacer par PATCH /api/dons/<id>/ { statut: 'confirme' } — voir backend/api/components/don
  //   (`statut` est en lecture seule : utiliser POST /api/dons/<id>/verifier/ annoncé dans backend/README.md)
  donsRecus = donsRecus.map((d) => (d.id === id ? { ...d, statut: 'confirme' } : d));
  return mockResponse({ id, statut: 'confirme' }, 300);
}

export function listDepotsAttendus() {
  // TODO(API): pas encore d'endpoint — voir creerDonMateriel
  return mockResponse(DEPOTS_ATTENDUS);
}

export function receptionnerDepot(id) {
  // TODO(API): pas encore d'endpoint — voir creerDonMateriel
  return mockResponse({ id }, 300);
}
