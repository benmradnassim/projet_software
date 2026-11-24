/**
 * API du module Utilisateurs (compte, tableau de bord citoyen, demandes organisateur, admin utilisateurs).
 *
 * Branché sur le back (backend/api/components/utilisateur) quand VITE_DEMO=false :
 *   PATCH /api/utilisateurs/moi/                 profil (US-UTIL-04/05)
 *   POST  /api/utilisateurs/moi/mot-de-passe/    mot de passe (US-UTIL-06)
 *   GET   /api/utilisateurs/?role=&statut=&search=   liste admin (US-UTIL-16/17)
 *   POST  /api/utilisateurs/<id>/statut/         actif | suspendu | desactive (US-UTIL-18)
 * Avec VITE_DEMO=true, les mêmes fonctions renvoient les données fictives de mockData.js.
 */
import { IS_DEMO, api, unwrapList } from '../../lib/api';
import { mockError, mockResponse, nextId } from '../../lib/mock';
import { DEMANDES_ORGANISATEUR, PREFERENCES, RESUME_UTILISATEURS, TABLEAU_DE_BORD, UTILISATEURS, VERIFICATIONS } from './mockData';

let utilisateurs = [...UTILISATEURS];
let demandes = [...DEMANDES_ORGANISATEUR];

export const getVerifications = () => VERIFICATIONS;

/** Statuts d'un compte (Utilisateur.Statut côté back). */
export const STATUTS_COMPTE = {
  actif: { label: 'Actif', tone: 'ok' },
  suspendu: { label: 'Suspendu', tone: 'no' },
  desactive: { label: 'Désactivé', tone: 'grey' },
};

/** Ajoute les champs d'affichage absents du serializer. */
const versUI = (u) => ({
  ...u,
  nom_complet: u.nom_complet || [u.prenom || u.first_name, u.nom || u.last_name].filter(Boolean).join(' ') || u.email,
  activite: u.activite ?? '',
});

/* ---------- citoyen ---------- */
export function getTableauDeBord() {
  // TODO(API): agrégats à calculer depuis GET /api/dons/ et /api/participations/evenements/ — pas d'endpoint dédié
  return mockResponse(TABLEAU_DE_BORD);
}

/**
 * Mise à jour du profil courant.
 * patch : prenom, nom, email, telephone, ville, adresse, date_naissance (rôle et statut non modifiables).
 * Renvoie l'utilisateur à jour. En cas d'erreur de validation : ApiError avec `fields`.
 */
export async function modifierProfil(id, patch) {
  if (IS_DEMO) return mockResponse({ id, ...patch }, 400);
  const body = { ...patch, date_naissance: patch.date_naissance || null };
  const data = await api.patch('/utilisateurs/moi/', body);
  return data.utilisateur;
}

/** { ancien_mot_de_passe, nouveau_mot_de_passe, confirmation } */
export function changerMotDePasse(payload) {
  if (IS_DEMO) {
    if (payload.nouveau_mot_de_passe !== payload.confirmation) {
      return mockError('La confirmation ne correspond pas au nouveau mot de passe.');
    }
    return mockResponse({ message: 'Mot de passe modifié avec succès.' }, 600);
  }
  return api.post('/utilisateurs/moi/mot-de-passe/', payload);
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

/** params : { role, statut, search } */
export async function listUtilisateurs(params = {}) {
  if (IS_DEMO) return mockResponse(utilisateurs);
  // TODO(API): la liste est paginée (20 par page) : ajouter une pagination si l'équipe dépasse 20 comptes de test
  const data = await api.get('/utilisateurs/', { params });
  return unwrapList(data).map(versUI);
}

export async function getResumeUtilisateurs() {
  if (IS_DEMO) return mockResponse(RESUME_UTILISATEURS, 50);
  const data = await api.get('/utilisateurs/');
  // TODO(API): « nouveaux cette semaine » nécessite un filtre date_inscription côté back
  return { total: data?.count ?? unwrapList(data).length, nouveaux_semaine: null };
}

/**
 * statut : 'actif' | 'suspendu' | 'desactive'.
 * La suspension exige `confirmation: true` (US-UTIL-18) ; un admin ne peut pas changer son propre statut.
 */
export async function changerStatutUtilisateur(id, statut, confirmation = false) {
  if (IS_DEMO) {
    utilisateurs = utilisateurs.map((u) => (u.id === id ? { ...u, statut } : u));
    return mockResponse({ message: 'ok', utilisateur: utilisateurs.find((u) => u.id === id) }, 150);
  }
  const data = await api.post(`/utilisateurs/${id}/statut/`, { statut, confirmation });
  return { ...data, utilisateur: versUI(data.utilisateur) };
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
