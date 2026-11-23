import { ApiError, IS_DEMO, api, decodeJwt, getTokens } from '../../lib/api';
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

/**
 * Profil de l'utilisateur connecté.
 * Il n'existe pas encore d'endpoint « moi » sur main : on lit `user_id` dans le JWT puis
 * GET /api/utilisateurs/<id>/ — voir backend/api/components/utilisateur
 * TODO(API): passer à GET /api/utilisateurs/moi/ dès qu'il existe (annoncé dans backend/README.md)
 */
export function getProfil() {
  const payload = decodeJwt(getTokens()?.access || '');
  if (!payload?.user_id) return Promise.reject(new ApiError('Session invalide.', 401));
  return api.get(`/utilisateurs/${payload.user_id}/`);
}

/**
 * Inscription.
 * POST /api/auth/inscription/ { email, password, nom, prenom, telephone, ville }
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
