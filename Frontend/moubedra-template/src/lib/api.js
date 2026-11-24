/**
 * Client HTTP unique de l'application.
 *
 * - baseURL = VITE_API_URL (ex. http://localhost:8000/api)
 * - ajoute `Authorization: Bearer <access>` si l'utilisateur est connecté
 * - sur 401 : renouvelle le jeton via POST /auth/renouveler/ puis rejoue la requête une fois
 * - toutes les erreurs sont normalisées en `ApiError` (message lisible en français + erreurs par champ)
 *
 * Usage dans une feature :
 *   import { api, unwrapList } from '../../lib/api';
 *   const data = await api.get('/campagnes/', { params: { statut: 'en_cours' } });
 *   return unwrapList(data);
 */

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '');
export const IS_DEMO = import.meta.env.VITE_DEMO === 'true';

const TOKENS_KEY = 'moubedra.tokens';

/* ---------- jetons ---------- */
function readTokens() {
  try {
    return JSON.parse(localStorage.getItem(TOKENS_KEY)) || null;
  } catch {
    return null;
  }
}

let tokens = readTokens();

export function getTokens() {
  return tokens;
}

export function setTokens(next) {
  tokens = next ? { ...tokens, ...next } : null;
  try {
    if (tokens) localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
    else localStorage.removeItem(TOKENS_KEY);
  } catch {
    /* stockage indisponible (navigation privée) : on garde les jetons en mémoire */
  }
}

export function clearTokens() {
  setTokens(null);
}

/** Lit la charge utile d'un JWT (sans vérifier la signature). */
export function decodeJwt(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(payload))));
  } catch {
    return null;
  }
}

/* ---------- erreurs ---------- */
export class ApiError extends Error {
  /**
   * @param {string} message  message lisible, prêt à afficher
   * @param {number} status   code HTTP (0 = réseau)
   * @param {object} fields   erreurs par champ : { email: 'Un compte existe déjà…' }
   * @param {any}    data     corps brut de la réponse
   */
  constructor(message, status = 0, fields = {}, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
    this.data = data;
  }
}

const STATUS_MESSAGES = {
  400: 'Certaines informations ne sont pas valides.',
  401: 'Votre session a expiré. Reconnectez-vous.',
  403: 'Vous n’avez pas l’autorisation de faire cette action.',
  404: 'Élément introuvable.',
  409: 'Cette action entre en conflit avec des données existantes.',
  429: 'Trop de tentatives. Réessayez dans un instant.',
  500: 'Le serveur a rencontré une erreur. Réessayez plus tard.',
};

const firstString = (v) => (Array.isArray(v) ? firstString(v[0]) : typeof v === 'string' ? v : v && typeof v === 'object' ? firstString(Object.values(v)[0]) : '');

function normalizeError(status, data) {
  const fields = {};
  let message = '';
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    for (const [key, value] of Object.entries(data)) {
      if (key === 'detail' || key === 'non_field_errors') message = message || firstString(value);
      else fields[key] = firstString(value);
    }
  } else if (typeof data === 'string' && data.length < 300) {
    message = data;
  }
  if (!message) message = Object.values(fields)[0] || STATUS_MESSAGES[status] || STATUS_MESSAGES[status >= 500 ? 500 : 400];
  return new ApiError(message, status, fields, data);
}

/* ---------- renouvellement du jeton (une seule requête à la fois) ---------- */
let refreshing = null;

async function refreshAccess() {
  if (!tokens?.refresh) return false;
  refreshing ??= fetch(`${API_URL}/auth/renouveler/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refresh: tokens.refresh }),
  })
    .then(async (res) => {
      if (!res.ok) return false;
      const data = await res.json();
      setTokens({ access: data.access, ...(data.refresh ? { refresh: data.refresh } : {}) });
      return true;
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/* ---------- requête ---------- */
function buildUrl(path, params) {
  const url = new URL(path.startsWith('http') ? path : `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

/**
 * @param {string} path  chemin relatif à VITE_API_URL, ex. '/campagnes/'
 * @param {{method?: string, body?: any, params?: object, auth?: boolean, signal?: AbortSignal}} options
 */
export async function request(path, { method = 'GET', body, params, auth = true, signal } = {}, retried = false) {
  const headers = { Accept: 'application/json' };
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  if (auth && tokens?.access) headers.Authorization = `Bearer ${tokens.access}`;

  let res;
  try {
    res = await fetch(buildUrl(path, params), {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError('Impossible de joindre le serveur. Vérifiez votre connexion.', 0);
  }

  if (res.status === 401 && auth && !retried && tokens?.refresh) {
    if (await refreshAccess()) return request(path, { method, body, params, auth, signal }, true);
    clearTokens();
    window.dispatchEvent(new CustomEvent('moubedra:session-expiree'));
  }

  if (res.status === 204) return null;
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) throw normalizeError(res.status, data);
  return data;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

/** Les listes DRF sont paginées ({ count, next, previous, results }) : renvoie toujours un tableau. */
export function unwrapList(data) {
  return Array.isArray(data) ? data : data?.results ?? [];
}
