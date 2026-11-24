// src/signalementApi.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const ENDPOINT = '/signalements'; // Match the prefix where signalement urls.py is included

const STATUT_TO_LABEL = {
  en_attente: 'En attente',
  en_cours: 'Pris en charge',
  resolu: 'Résolu',
  rejete: 'Rejeté',
};

const LABEL_TO_STATUT = {
  'En attente': 'en_attente',
  'Pris en charge': 'en_cours',
  'Résolu': 'resolu',
  'Rejeté': 'rejete',
};

const REASON_TO_TYPE = {
  'Contenu inapproprié': 'publication',
  'Harcèlement': 'commentaire',
  'Information trompeuse': 'campagne',
  'Autre': 'autre',
};

const TYPE_TO_REASON = {
  publication: 'Contenu inapproprié',
  commentaire: 'Harcèlement',
  campagne: 'Information trompeuse',
  evenement: 'Événement',
  autre: 'Autre',
};

function getAuthHeaders() {
  const token =
    localStorage.getItem('moubedra_token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}), // change "Bearer" en "Token" si besoin
  };
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || `Erreur HTTP ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export function inferSignalementType({ target = '', reason = '', publication, commentaire, campagne, evenement }) {
  if (publication) return 'publication';
  if (commentaire) return 'commentaire';
  if (campagne) return 'campagne';
  if (evenement) return 'evenement';

  const normalizedTarget = target.toLowerCase();
  if (normalizedTarget.includes('commentaire')) return 'commentaire';
  if (normalizedTarget.includes('publication')) return 'publication';
  if (normalizedTarget.includes('campagne')) return 'campagne';
  if (normalizedTarget.includes('événement') || normalizedTarget.includes('evenement')) return 'evenement';

  return REASON_TO_TYPE[reason] || 'autre';
}

export function toSignalementCreatePayload(report) {
  const type = report.type || inferSignalementType(report);
  const detailsPart = report.details ? report.details.trim() : '';
  const targetPart = report.target ? `Cible : ${report.target.trim()}` : '';
  const reasonPart = report.reason ? `Motif : ${report.reason}` : '';

  const composedDescription = [reasonPart, targetPart, detailsPart]
    .filter(Boolean)
    .join(' — ');

  return {
    type,
    description: composedDescription || detailsPart || targetPart || 'Signalement',
    localisation: report.localisation || '',
    ...(report.publication ? { publication: report.publication } : {}),
    ...(report.commentaire ? { commentaire: report.commentaire } : {}),
    ...(report.campagne ? { campagne: report.campagne } : {}),
    ...(report.evenement ? { evenement: report.evenement } : {}),
  };
}

export function fromSignalement(item, fallbackReporter = 'Utilisateur') {
  const rawDate = item.date_signalement || item.date || new Date().toISOString();
  const formattedDate = String(rawDate).slice(0, 10);

  return {
    id: item.id,
    reporter:
      item.declarant_nom ||
      item.declarant_username ||
      (typeof item.declarant === 'string' ? item.declarant : null) ||
      fallbackReporter,
    declarantId: typeof item.declarant === 'number' ? item.declarant : null,
    type: item.type || 'autre',
    target: item.localisation || item.target || `Signalement #${item.id}`,
    reason: item.reason || TYPE_TO_REASON[item.type] || 'Autre',
    details: item.description || item.details || '',
    localisation: item.localisation || '',
    status: STATUT_TO_LABEL[item.statut] || item.status || 'En attente',
    rawStatut: item.statut || 'en_attente',
    date: formattedDate,
    dateTraitement: item.date_traitement || null,
    traitePar: item.traite_par || null,
  };
}

export const signalementApi = {
  async list(fallbackReporter) {
    const data = await apiRequest(`${ENDPOINT}/`);
   const rows = Array.isArray(data)
  ? data
  : data.results || data.signalements || data.data || [];
    return rows.map((row) => fromSignalement(row, fallbackReporter));
  },

  async create(report, fallbackReporter) {
    const payload = toSignalementCreatePayload(report);
    const created = await apiRequest(`${ENDPOINT}/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return fromSignalement(created, fallbackReporter);
  },
  async update(id, report, fallbackReporter) {
    const payload = toSignalementCreatePayload({
      ...report,
      localisation: report.target?.trim() || report.localisation || '',
    });
    const updated = await apiRequest(`${ENDPOINT}/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return fromSignalement(updated, fallbackReporter);
  },

  async updateStatut(id, statusLabel) {
    const statut = LABEL_TO_STATUT[statusLabel] || statusLabel;
    const updated = await apiRequest(`${ENDPOINT}/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ statut }),
    });
    return fromSignalement(updated);
  },

  async remove(id) {
    return apiRequest(`${ENDPOINT}/${id}/`, {
      method: 'DELETE',
    });
  },
};