/**
 * API du module Événements (+ participations aux événements).
 * Les listes restent celles de la maquette; les participations sont enregistrées dans Django.
 */
import { api, IS_DEMO, unwrapList } from '../../lib/api';
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
  let list = EVENEMENTS.filter((e) => e.statut !== 'termine');
  if (params.campagne) list = list.filter((e) => e.campagne === Number(params.campagne));
  return mockResponse(list);
}

export function getEvenement(id) {
  return mockResponse(EVENEMENTS.find((e) => e.id === Number(id)) || null);
}

async function resolveEvenementId(evenementId) {
  const displayedEvent = EVENEMENTS.find((event) => event.id === Number(evenementId));
  if (!displayedEvent) throw new Error('Événement introuvable.');
  if (displayedEvent.statut === 'termine') return null;

  const events = unwrapList(await api.get('/evenements/'));
  const storedEvent = events.find((event) => event.titre === displayedEvent.titre);
  if (!storedEvent) throw new Error(`Aucun événement Django ne correspond à « ${displayedEvent.titre} ».`);
  return storedEvent.id;
}

/** Programme et liste « à prévoir » (UI : pas encore de champ côté back). */
export function getProgramme() {
  // TODO(API): champs à ajouter sur Evenement (backend/api/components/evenement)
  return mockResponse({ programme: PROGRAMME, a_prevoir: A_PREVOIR }, 50);
}

/* ---------- participations du citoyen ---------- */

/** Mes demandes, avec l'événement imbriqué (UI : le back renvoie seulement l'id). */
export function listMesParticipations() {
  if (!IS_DEMO) {
    return api.get('/participations/evenements/').then(async (data) => {
      const rows = unwrapList(data);
      return Promise.all(rows.map(async (p) => {
        try {
          const evenement_detail = await api.get(`/evenements/${p.evenement}/`);
          return { ...p, type_liste: 'evenement', evenement_detail };
        } catch {
          return { ...p, type_liste: 'evenement' };
        }
      }));
    });
  }
  return mockResponse(participations.map((p) => ({ ...p, type_liste: 'evenement', evenement_detail: EVENEMENTS.find((e) => e.id === p.evenement) })));
}

/** Ma participation à un événement (ou null). */
export function getMaParticipation(evenementId) {
  if (!IS_DEMO) {
    return resolveEvenementId(evenementId).then((storedEventId) => {
      if (!storedEventId) return null;
      return api.get('/participations/evenements/', {
        params: { evenement: storedEventId },
      }).then((data) => unwrapList(data).find((p) => p.statut !== 'annulee') || null);
    });
  }
  return mockResponse(participations.find((p) => p.evenement === Number(evenementId) && p.statut !== 'annulee') || null, 80);
}

export function demanderParticipation(evenementId, formulaire) {
  if (!IS_DEMO) {
    return resolveEvenementId(evenementId).then((storedEventId) => {
      if (!storedEventId) throw new Error('Cet événement est terminé.');
      return api.post('/participations/evenements/', {
        evenement: storedEventId,
        type: formulaire.type,
        motif: formulaire.motif,
        nom: formulaire.nom,
        prenom: formulaire.prenom,
        telephone: formulaire.telephone,
        cin: formulaire.cin,
        adresse: formulaire.adresse,
      });
    });
  }
  const p = {
    id: nextId(),
    utilisateur: 1,
    evenement: Number(evenementId),
    date_demande: new Date().toISOString(),
    type: formulaire.type,
    motif: formulaire.motif,
    nom: formulaire.nom,
    prenom: formulaire.prenom,
    telephone: formulaire.telephone,
    cin: formulaire.cin,
    adresse: formulaire.adresse,
    statut: 'en_attente',
    code_qr: crypto.randomUUID?.() || String(Date.now()),
  };
  participations = [p, ...participations];
  return mockResponse(p, 800);
}

export function annulerParticipation(id) {
  if (!IS_DEMO) {
    return api.post(`/participations/evenements/${id}/annuler/`);
  }
  participations = participations.map((p) => (p.id === id ? { ...p, statut: 'annulee' } : p));
  return mockResponse({ id }, 300);
}

export function modifierParticipation(id, formulaire) {
  if (!IS_DEMO) {
    return api.patch(`/participations/evenements/${id}/`, formulaire);
  }
  participations = participations.map((participation) => (
    participation.id === id ? { ...participation, ...formulaire } : participation
  ));
  return mockResponse(participations.find((participation) => participation.id === id), 300);
}

/* ---------- espace organisateur ---------- */

export function listMesEvenements() {
  // TODO(API): remplacer par GET /api/evenements/?organisateur=<moi> — voir backend/api/components/evenement
  return mockResponse(
    MES_EVENEMENTS.map((id) => ({ ...EVENEMENTS.find((e) => e.id === id), nb_en_attente: EN_ATTENTE_PAR_EVENEMENT[id] })),
  );
}

export function listDemandesRecues() {
  if (!IS_DEMO) {
    return Promise.all([
      api.get('/participations/evenements/', { params: { statut: 'en_attente' } }).then(async (data) => {
        const rows = unwrapList(data);
        return Promise.all(rows.map(async (participation) => {
          try {
            const evenement = await api.get(`/evenements/${participation.evenement}/`);
            return { ...participation, type_liste: 'evenement', evenement_detail: evenement };
          } catch {
            return { ...participation, type_liste: 'evenement' };
          }
        }));
      }),
      api.get('/participations/campagnes/', { params: { statut: 'en_attente' } }).then(async (data) => {
        const rows = unwrapList(data);
        return Promise.all(rows.map(async (participation) => {
          try {
            const campagne = await api.get(`/campagnes/${participation.campagne}/`);
            return { ...participation, type_liste: 'campagne', campagne_detail: campagne };
          } catch {
            return { ...participation, type_liste: 'campagne' };
          }
        }));
      }),
    ]).then(([evenements, campagnes]) => [...evenements, ...campagnes].map((row) => ({
      ...row,
      id_liste: `${row.type_liste}-${row.id}`,
    })));
  }
  return mockResponse(demandes.filter((d) => d.statut === 'en_attente').map((row) => ({
    ...row,
    type_liste: 'evenement',
    id_liste: `evenement-${row.id}`,
  })));
}

/** decision : 'acceptee' | 'refusee' */
export function deciderDemande(id, decision, type = 'evenement') {
  if (!IS_DEMO) {
    const resource = type === 'campagne' ? 'campagnes' : 'evenements';
    return api.post(`/participations/${resource}/${id}/traiter/`, { statut: decision });
  }
  demandes = demandes.map((d) => (d.id === id ? { ...d, statut: decision } : d));
  return mockResponse({ id, statut: decision }, 200);
}

/** Mode jour J : journal des scans. */
export function getScans() {
  // TODO(API): pas encore d'endpoint de pointage — à créer (scan du code_qr d'une participation)
  return mockResponse({ initiaux: SCANS_INITIAUX, simules: SCANS_SIMULES }, 50);
}
