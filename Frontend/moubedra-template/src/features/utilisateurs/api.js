/**
 * API du module Utilisateurs (compte, tableau de bord citoyen, demandes organisateur, admin utilisateurs).
 * Données fictives de même forme que UtilisateurSerializer / DemandeOrganisateurSerializer.
 */
import { api, unwrapList } from '../../lib/api'; // eslint-disable-line no-unused-vars
import { mockResponse, nextId } from '../../lib/mock';
import { DEMANDES_ORGANISATEUR, PREFERENCES, RESUME_UTILISATEURS, TABLEAU_DE_BORD, UTILISATEURS, VERIFICATIONS } from './mockData';

let utilisateurs = [...UTILISATEURS];
let demandes = [...DEMANDES_ORGANISATEUR];

export const getVerifications = () => VERIFICATIONS;

/* ---------- citoyen ---------- */
export function getTableauDeBord() {
  // TODO(API): agrégats à calculer depuis GET /api/dons/ et /api/participations/evenements/ — pas d'endpoint dédié
  return mockResponse(TABLEAU_DE_BORD);
}

/** Mise à jour du profil. patch : champs de UtilisateurSerializer (prenom, nom, telephone, ville, adresse, date_naissance…) */
export function modifierProfil(id, patch) {
  // TODO(API): remplacer par PATCH /api/utilisateurs/<id>/ — voir backend/api/components/utilisateur
  //   (UtilisateurViewSet est en lecture seule sur main ; PATCH /api/utilisateurs/moi/ est annoncé dans backend/README.md)
  return mockResponse({ id, ...patch }, 400);
}

export function getPreferences() {
  // TODO(API): pas encore de champs de préférences côté back
  return mockResponse(PREFERENCES, 50);
}

/** Demande pour devenir organisateur. payload : { nom_structure, motif } */
export function demanderOrganisateur({ nom_structure, motif }) {
  // TODO(API): remplacer par POST /api/demandes-organisateur/ { motif } — voir backend/api/components/demande_organisateur
  //   (le nom de la structure peut aller dans `nom_organisation` de l'utilisateur)
  return mockResponse({ id: nextId(), motif, nom_structure, statut: 'en_attente', date_demande: new Date().toISOString() }, 900);
}

/* ---------- admin ---------- */
export function listUtilisateurs() {
  // TODO(API): remplacer par GET /api/utilisateurs/ — voir backend/api/components/utilisateur
  return mockResponse(utilisateurs);
}

export function getResumeUtilisateurs() {
  // TODO(API): utiliser `count` de GET /api/utilisateurs/ — voir backend/api/components/utilisateur
  return mockResponse(RESUME_UTILISATEURS, 50);
}

/** statut : 'actif' | 'bloque' */
export function changerStatutUtilisateur(id, statut) {
  // TODO(API): remplacer par PATCH /api/utilisateurs/<id>/ { statut } — voir backend/api/components/utilisateur
  utilisateurs = utilisateurs.map((u) => (u.id === id ? { ...u, statut } : u));
  return mockResponse({ id, statut }, 150);
}

export function listDemandesOrganisateur() {
  // TODO(API): remplacer par GET /api/demandes-organisateur/?statut=en_attente — voir backend/api/components/demande_organisateur
  return mockResponse(demandes);
}

/** decision : 'acceptee' | 'refusee' | 'infos' ; message facultatif */
export function traiterDemandeOrganisateur(id, decision, message = '') { // eslint-disable-line no-unused-vars
  // TODO(API): remplacer par PATCH /api/demandes-organisateur/<id>/ { statut } — voir backend/api/components/demande_organisateur
  //   (`statut` est en lecture seule : utiliser POST /api/demandes-organisateur/<id>/traiter/ annoncé dans backend/README.md)
  demandes = demandes.map((d) => (d.id === id ? { ...d, statut: decision } : d));
  return mockResponse({ id, statut: decision }, 300);
}
