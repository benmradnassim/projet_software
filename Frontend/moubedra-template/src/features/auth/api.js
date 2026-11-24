import { ApiError, IS_DEMO, api, getTokens } from '../../lib/api';
import { mockResponse } from '../../lib/mock';
import { EMAIL_EXISTANT, GOUVERNORATS, PRES_DE_CHEZ_VOUS } from './mockData';

/**
 * Connexion JWT.
 * POST /api/auth/connexion/  { email, password }  ->  { access, refresh }
 * Voir backend/config/urls.py (TokenObtainPairView).
 */
export function connexion({ email, password }) {
  return api.post('/auth/connexion/', { email, password }, { auth: false });
}

const ROLE_SOUS_TITRE = { citoyen: 'Citoyen·ne', utilisateur: 'Citoyen·ne', organisateur: 'Organisateur', admin: 'Administrateur' };

/** Complète le profil renvoyé par le back avec les champs d'affichage de l'interface. */
export const profilVersUI = (u) => ({
  ...u,
  prenom: u.prenom || u.first_name,
  nom_complet: u.nom_complet || [u.prenom || u.first_name, u.nom || u.last_name].filter(Boolean).join(' ') || u.email,
  sous_titre: u.sous_titre || [u.nom_organisation || ROLE_SOUS_TITRE[u.role], u.ville].filter(Boolean).join(' · '),
});

/**
 * Profil de l'utilisateur connecté.
 * GET /api/utilisateurs/moi/ — voir backend/api/components/utilisateur (ProfilSerializer)
 */
export async function getProfil() {
  if (!getTokens()?.access) throw new ApiError('Session invalide.', 401);
  return profilVersUI(await api.get('/utilisateurs/moi/'));
}

/**
 * Inscription.
 * POST /api/auth/inscription/ { email, password, nom, prenom, telephone, ville }
 *   -> { message, utilisateur } ; e-mail déjà utilisé : erreur 400 sur le champ `email`.
 * Voir backend/api/views_common.py (register) et InscriptionSerializer.
 * Le compte « Association » crée en plus une demande organisateur (POST /api/demandes-organisateur/).
 */
export function inscription(payload) {
  if (IS_DEMO) {
    // TODO(API): remplacer par POST /api/auth/inscription/ — voir backend/api/views_common.py
    if (payload.email?.toLowerCase() === EMAIL_EXISTANT) {
      return Promise.reject(new ApiError('Un compte existe déjà avec cet e-mail.', 400, { email: 'Un compte existe déjà avec cet e-mail.' }));
    }
    return mockResponse({ id: 99, email: payload.email, nom: payload.nom, prenom: payload.prenom, ville: payload.ville }, 1000);
  }
  return api.post('/auth/inscription/', payload, { auth: false });
}

/** Vérifie si un e-mail est déjà utilisé (démo uniquement ; le back renvoie l'erreur à l'inscription). */
export const emailDejaUtilise = (email) => email.toLowerCase() === EMAIL_EXISTANT;

/** Listes de référence pour les formulaires (statiques). */
export const getGouvernorats = () => GOUVERNORATS;
export const getPresDeChezVous = (ville) => PRES_DE_CHEZ_VOUS[ville];
