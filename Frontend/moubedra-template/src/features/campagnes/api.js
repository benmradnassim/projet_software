/**
 * API du module Campagnes.
 * Les listes restent celles de la maquette; les participations sont enregistrées dans Django.
 */
import { api, IS_DEMO, unwrapList } from '../../lib/api';
import { mockResponse, nextId } from '../../lib/mock';
import { BESOINS, CAMPAGNES, CAMPAGNES_EN_REVUE, CATEGORIES, DETAILS, FAVORIS, MES_CAMPAGNES, ORG_DASHBOARD, POINTS_DE_CONTROLE } from './mockData';

const favoris = new Set(FAVORIS);
const mesCampagnes = [...MES_CAMPAGNES];
let enRevue = [...CAMPAGNES_EN_REVUE];

export const categorieCode = (label) => CATEGORIES.find((c) => c.label === label)?.code || 'sol';
export const getCategories = () => CATEGORIES;
export const getPointsDeControle = () => POINTS_DE_CONTROLE;

/** Liste publique. params : { search, categorie, ville, ordering } */
export function listCampagnes() {
  return mockResponse(CAMPAGNES);
}

/** Détail d'une campagne. */
export function getCampagne(id) {
  return mockResponse(CAMPAGNES.find((c) => c.id === Number(id)) || null);
}

async function resolveCampagneId(campagneId) {
  const displayedCampaign = CAMPAGNES.find((campaign) => campaign.id === Number(campagneId));
  if (!displayedCampaign) throw new Error('Campagne introuvable.');

  const campaigns = unwrapList(await api.get('/campagnes/'));
  const storedCampaign = campaigns.find((campaign) => campaign.titre === displayedCampaign.titre);
  if (!storedCampaign) throw new Error(`Aucune campagne Django ne correspond à « ${displayedCampaign.titre} ».`);
  return storedCampaign.id;
}

/** Onglets Histoire / Nouvelles / Utilisation des fonds du détail (UI). */
export function getCampagneDetails(id) {
  // TODO(API): pas encore d'endpoint — les nouvelles viendront de GET /api/publications/?campagne=<id>
  //   (voir backend/api/components/publication) ; les fonds nécessitent un modèle côté back.
  return mockResponse({ campagne: Number(id), ...DETAILS });
}

/** Besoins matériels d'une campagne (null si la campagne n'accepte pas de matériel). */
export function getBesoins(id) {
  // TODO(API): pas encore de modèle « besoin matériel » côté back (à créer dans backend/api/components/campagne)
  return mockResponse(BESOINS[Number(id)] || null, 120);
}

export function demanderParticipationCampagne(campagneId, formulaire) {
  if (!IS_DEMO) {
    return resolveCampagneId(campagneId).then((storedCampaignId) => api.post('/participations/campagnes/', {
      campagne: storedCampaignId,
      type: formulaire.type,
      motif: formulaire.motif,
      nom: formulaire.nom,
      prenom: formulaire.prenom,
      telephone: formulaire.telephone,
      cin: formulaire.cin,
      adresse: formulaire.adresse,
    }));
  }
  return mockResponse({
    id: nextId(),
    utilisateur: 1,
    campagne: Number(campagneId),
    date_demande: new Date().toISOString(),
    type: formulaire.type,
    motif: formulaire.motif,
    nom: formulaire.nom,
    prenom: formulaire.prenom,
    telephone: formulaire.telephone,
    cin: formulaire.cin,
    adresse: formulaire.adresse,
    statut: 'en_attente',
  }, 700);
}

export function getMaParticipationCampagne(campagneId) {
  if (!IS_DEMO) {
    return resolveCampagneId(campagneId).then((storedCampaignId) => api.get('/participations/campagnes/', {
      params: { campagne: storedCampaignId },
    }).then((data) => unwrapList(data).find((p) => p.statut !== 'annulee') || null));
  }
  return mockResponse(null, 80);
}

export function annulerParticipationCampagne(id) {
  if (!IS_DEMO) {
    return api.post(`/participations/campagnes/${id}/annuler/`);
  }
  return mockResponse({ id, statut: 'annulee' }, 300);
}

export function modifierParticipationCampagne(id, formulaire) {
  if (!IS_DEMO) {
    return api.patch(`/participations/campagnes/${id}/`, formulaire);
  }
  return mockResponse({ id, ...formulaire }, 300);
}

export function listMesParticipationsCampagnes() {
  if (!IS_DEMO) {
    return api.get('/participations/campagnes/').then(async (data) => {
      const rows = unwrapList(data);
      return Promise.all(rows.map(async (p) => {
        try {
          const campagne = await api.get(`/campagnes/${p.campagne}/`);
          return { ...p, type_liste: 'campagne', evenement_detail: {
            id: campagne.id,
            titre: campagne.titre,
            lieu: campagne.ville || 'Lieu à confirmer',
            date_evenement: campagne.date_fin,
            statut: campagne.statut,
          } };
        } catch {
          return { ...p, type_liste: 'campagne' };
        }
      }));
    });
  }
  return mockResponse([]);
}

/** Toutes les campagnes qui acceptent du matériel → { [id]: besoins } */
export function listBesoins() {
  // TODO(API): idem getBesoins
  return mockResponse(BESOINS, 120);
}

/* ---------- favoris (UI) ---------- */
export function listFavoris() {
  // TODO(API): pas encore d'endpoint favoris côté back
  return mockResponse([...favoris], 50);
}
export function toggleFavori(id) {
  // TODO(API): pas encore d'endpoint favoris côté back
  favoris.has(id) ? favoris.delete(id) : favoris.add(id);
  return mockResponse(favoris.has(id), 50);
}

/* ---------- espace organisateur ---------- */
export function listMesCampagnes() {
  // TODO(API): remplacer par GET /api/campagnes/?organisateur=<moi> — voir backend/api/components/campagne
  return mockResponse(
    mesCampagnes.map((o) => (o.etat === 'live' ? { ...CAMPAGNES.find((c) => c.id === o.id), etat: 'live' } : o)),
  );
}

/** Création d'une campagne (envoyée en revue). data : champs du formulaire de l'assistant. */
export function createCampagne(data) {
  // TODO(API): remplacer par POST /api/campagnes/ — voir backend/api/components/campagne
  //   (statut 'brouillon' ; les besoins matériels et la revue nécessitent des champs côté back)
  const created = {
    id: nextId(),
    titre: data.titre,
    description: data.description,
    categorie: data.categorie,
    date_debut: data.date_debut,
    date_fin: data.date_fin,
    objectif_montant: String(data.objectif_montant),
    montant_collecte: '0.000',
    image: data.image,
    statut: 'brouillon',
    etat: 'review',
  };
  mesCampagnes.splice(1, 0, created);
  return mockResponse(created, 900);
}

export function getOrgDashboard() {
  // TODO(API): agrégats à calculer depuis GET /api/dons/, /api/participations/evenements/ — pas d'endpoint dédié
  return mockResponse(ORG_DASHBOARD);
}

/* ---------- revue admin ---------- */
export function listCampagnesEnRevue() {
  // TODO(API): remplacer par GET /api/campagnes/?statut=brouillon — voir backend/api/components/campagne
  return mockResponse(enRevue);
}

/** decision : 'publier' | 'corriger' | 'refuser' */
export function deciderRevue(id, decision) {
  // TODO(API): remplacer par PATCH /api/campagnes/<id>/ { statut: 'en_cours' | 'annulee' } — voir backend/api/components/campagne
  enRevue = enRevue.filter((c) => c.id !== id);
  return mockResponse({ id, decision }, 400);
}
