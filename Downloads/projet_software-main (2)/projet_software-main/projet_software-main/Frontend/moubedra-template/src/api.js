const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export async function apiRequest(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error("Impossible de joindre l'API. Vérifiez que Django tourne sur le port 8000.");
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload?.detail || Object.values(payload || {}).flat()[0];
    throw new Error(detail || `Erreur API (${response.status}).`);
  }
  return payload;
}

export function mapCampaign(campaign) {
  const statuses = {
    brouillon: 'Brouillon',
    en_cours: 'En cours',
    cloturee: 'Clôturée',
    annulee: 'Annulée',
  };
  return {
    id: campaign.id,
    title: campaign.titre,
    description: campaign.description,
    category: campaign.categorie,
    region: campaign.ville || 'Tunisie',
    organizer: campaign.organisateur_nom,
    goal: Number(campaign.objectif_montant),
    raised: Number(campaign.montant_collecte),
    status: statuses[campaign.statut] || campaign.statut,
    start: campaign.date_debut,
    end: campaign.date_fin,
    participants: 0,
    image: campaign.image,
  };
}

export function mapDonation(donation) {
  const statuses = {
    en_attente: 'En attente',
    confirme: 'Confirmé',
    refuse: 'Refusé',
    annule: 'Annulé',
    rembourse: 'Remboursé',
  };
  const methods = {
    carte: 'Carte bancaire',
    virement: 'Virement',
    d17: 'D17',
    especes: 'Espèces',
  };
  return {
    id: donation.id,
    donor: donation.donateur_nom || `Donateur #${donation.donateur}`,
    campaignId: donation.campagne,
    campaignTitle: donation.campagne_titre,
    amount: Number(donation.montant),
    method: methods[donation.mode_paiement] || donation.mode_paiement,
    status: statuses[donation.statut] || donation.statut,
    date: donation.date_don?.slice(0, 10),
  };
}
