// Client minimal de l'API Django (module « Gestion des utilisateurs »).
// Le jeton JWT est conservé dans le localStorage et renouvelé automatiquement.

export const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const STORAGE_KEY = 'moubedra.jetons';

export const ROLE_LABELS = { utilisateur: 'Utilisateur', citoyen: 'Citoyen', organisateur: 'Organisateur', admin: 'Admin' };
export const STATUT_LABELS = { actif: 'Actif', suspendu: 'Suspendu', desactive: 'Désactivé' };

export class ApiError extends Error {
  constructor(status, data) {
    super(messageFromData(data) || `Erreur ${status}`);
    this.status = status;
    this.data = data;
    this.fields = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  }
}

function messageFromData(data) {
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) return messageFromData(data[0]);
  if (data.detail) return String(data.detail);
  const first = Object.values(data)[0];
  return messageFromData(first);
}

export function fieldError(error, field) {
  const value = error?.fields?.[field];
  return value ? messageFromData(value) : '';
}

function readTokens() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; }
}
function writeTokens(tokens) {
  try { tokens ? localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens)) : localStorage.removeItem(STORAGE_KEY); } catch { /* stockage indisponible */ }
}
export const hasTokens = () => !!readTokens()?.access;
export const clearTokens = () => writeTokens(null);

async function rawRequest(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const tokens = readTokens();
  if (auth && tokens?.access) headers.Authorization = `Bearer ${tokens.access}`;
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, { detail: 'Serveur injoignable. Vérifiez que le backend est démarré.' });
  }
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { detail: text }; }
  return { response, data };
}

async function refreshAccess() {
  const refresh = readTokens()?.refresh;
  if (!refresh) return false;
  const { response, data } = await rawRequest('/auth/renouveler/', { method: 'POST', body: { refresh }, auth: false });
  if (!response.ok) { clearTokens(); return false; }
  writeTokens({ ...readTokens(), access: data.access, ...(data.refresh ? { refresh: data.refresh } : {}) });
  return true;
}

export async function request(path, options = {}) {
  let { response, data } = await rawRequest(path, options);
  if (response.status === 401 && options.auth !== false && readTokens()?.refresh && await refreshAccess()) {
    ({ response, data } = await rawRequest(path, options));
  }
  if (!response.ok) throw new ApiError(response.status, data);
  return data;
}

const qs = (params) => {
  const entries = Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined);
  return entries.length ? `?${new URLSearchParams(entries)}` : '';
};

export const api = {
  async connexion(email, password) {
    const data = await request('/auth/connexion/', { method: 'POST', body: { email, password }, auth: false });
    writeTokens({ access: data.access, refresh: data.refresh });
    return api.moi();
  },
  inscription: (donnees) => request('/auth/inscription/', { method: 'POST', body: donnees, auth: false }),
  moi: () => request('/utilisateurs/moi/'),
  modifierProfil: (donnees) => request('/utilisateurs/moi/', { method: 'PATCH', body: donnees }),
  changerMotDePasse: (donnees) => request('/utilisateurs/moi/mot-de-passe/', { method: 'POST', body: donnees }),
  listeUtilisateurs: ({ role, statut, search, page }) => request(`/utilisateurs/${qs({ role, statut, search, page })}`),
  detailUtilisateur: (id) => request(`/utilisateurs/${id}/`),
  changerStatut: (id, statut, confirmation = false) => request(`/utilisateurs/${id}/statut/`, { method: 'POST', body: { statut, confirmation } }),
};

export const nomAffiche = (u) => [u?.prenom, u?.nom].filter(Boolean).join(' ') || u?.email || '';
export const sessionFromUser = (u) => ({ name: nomAffiche(u), email: u.email, role: ROLE_LABELS[u.role] || 'Utilisateur', user: u, real: true });
