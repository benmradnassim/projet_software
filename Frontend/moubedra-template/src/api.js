const API_BASE = 'http://127.0.0.1:8000/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('access_token');
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Erreur serveur' }));
    const message = err.detail || Object.values(err).flat().join(' ') || `Erreur ${res.status}`;
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  auth: {
    login: (email, password) => request('/auth/connexion/', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (data) => request('/auth/inscription/', { method: 'POST', body: JSON.stringify(data) }),
    refresh: (refresh) => request('/auth/renouveler/', { method: 'POST', body: JSON.stringify({ refresh }) }),
    me: () => request('/utilisateurs/moi/'),
  },
  events: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/evenements/${qs ? `?${qs}` : ''}`);
    },
    get: (id) => request(`/evenements/${id}/`),
    create: (data) => request('/evenements/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/evenements/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/evenements/${id}/`, { method: 'DELETE' }),
  },
  participations: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/participations/evenements/${qs ? `?${qs}` : ''}`);
    },
    get: (id) => request(`/participations/evenements/${id}/`),
    create: (data) => request('/participations/evenements/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/participations/evenements/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/participations/evenements/${id}/`, { method: 'DELETE' }),
    traiter: (id, action) => request(`/participations/evenements/${id}/traiter/`, { method: 'POST', body: JSON.stringify({ action }) }),
    qrCode: (id) => request(`/participations/evenements/${id}/qr_code/`),
    verifyQr: (codeQr) => request('/participations/evenements/verify-qr/', { method: 'POST', body: JSON.stringify({ code_qr: codeQr }) }),
  },
  campaigns: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/campagnes/${qs ? `?${qs}` : ''}`);
    },
    get: (id) => request(`/campagnes/${id}/`),
  },
  users: {
    me: () => request('/utilisateurs/moi/'),
  },
};