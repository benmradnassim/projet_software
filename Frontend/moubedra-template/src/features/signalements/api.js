/**
 * API du module Signalements.
 *
 * Backend :
 *   GET    /api/signalements/
 *   POST   /api/signalements/
 *   PATCH  /api/signalements/<id>/traiter/
 *   DELETE /api/signalements/<id>/
 *
 * Avec VITE_DEMO=true, les fonctions utilisent mockData.js.
 */
import { IS_DEMO, api, unwrapList } from '../../lib/api';
import { mockResponse, nextId } from '../../lib/mock';

import {
  MES_SIGNALEMENTS,
  MOTIFS,
  REGLE_42,
  SIGNALEMENTS_ADMIN,
  SIGNALEMENTS_ORGANISATEUR,
} from './mockData';

export const getMotifs = () => MOTIFS;

export const getRegle42 = () => REGLE_42;

/**
 * Transforme les données Django en données adaptées aux composants React.
 */
function versUI(s) {
  const date = s.date_signalement
    ? new Date(s.date_signalement)
    : null;

  const resultat = {
    en_attente: 'En attente',
    en_cours: 'En cours d’examen',
    resolu: 'Traité · retiré',
    rejete: 'Classé sans suite',
  };

  return {
    ...s,
    type_label: {
      publication: 'Publication',
      commentaire: 'Commentaire',
      campagne: 'Campagne',
      evenement: 'Événement',
      autre: 'Profil',
    }[s.type] || 'Signalement',

    motif: s.description || '',
    extrait: s.description || '',

    a_traiter: s.statut === 'en_attente' || s.statut === 'en_cours',
    reponse: s.reponse || '',
    resultat: resultat[s.statut] || '',
    quand: date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString('fr-FR')
      : '',

    nb_signalants: s.nb_signalants ?? 1,
    priorite: s.priorite || 'normale',
    auteur_nom: s.declarant_nom || '',
    regle: s.regle,
  };
}

/* ---------- Citoyen ---------- */

/**
 * Liste les signalements de l'utilisateur connecté.
 * Le backend filtre automatiquement selon l'utilisateur connecté.
 */
export async function listMesSignalements() {
  if (IS_DEMO) {
    return mockResponse(MES_SIGNALEMENTS);
  }

  const data = await api.get('/signalements/');
  return unwrapList(data).map(versUI);
}

/**
 * Crée un signalement.
 *
 * payload :
 * {
 *   type,
 *   publication?,
 *   commentaire?,
 *   campagne?,
 *   evenement?,
 *   description,
 *   localisation?
 * }
 *
 * Le déclarant est automatiquement associé côté Django.
 */
export async function creerSignalement(payload) {
  const description =
    (payload.description || payload.motif || '').trim() || 'Signalement de contenu';
  const cleanPayload = {
    ...payload,
    description,
  };

  if (IS_DEMO) {
    return mockResponse({
      id: nextId(),
      ...cleanPayload,
      statut: 'en_attente',
      date_signalement: new Date().toISOString(),
    }, 400);
  }

  const data = await api.post('/signalements/', cleanPayload);
  return versUI(data);
}

/* ---------- Organisateur ---------- */

export async function listSignalementsOrganisateur() {
  if (IS_DEMO) {
    return mockResponse(SIGNALEMENTS_ORGANISATEUR);
  }

  const data = await api.get('/signalements/');
  return unwrapList(data).map(versUI);
}

/* ---------- Administrateur ---------- */

/**
 * L'administrateur reçoit tous les signalements.
 */
export async function listSignalementsAdmin() {
  if (IS_DEMO) {
    return mockResponse(SIGNALEMENTS_ADMIN);
  }

  const data = await api.get('/signalements/');
  return unwrapList(data).map(versUI);
}

/**
 * Décision :
 * - retirer : statut resolu
 * - classer : statut rejete
 */
export async function traiterSignalement(id, decision) {
  if (IS_DEMO) {
    return mockResponse({
      id,
      statut: decision === 'retirer' ? 'resolu' : 'rejete',
    }, 200);
  }

  const data = await api.patch(`/signalements/${id}/traiter/`, { decision });
  return versUI(data);
}