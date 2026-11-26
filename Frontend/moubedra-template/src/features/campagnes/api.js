/**
 * API du module Campagnes.
 *
 * Branché sur le back (backend/api/components/campagne) quand VITE_DEMO=false :
 *   GET    /api/campagnes/                 liste (publique : campagnes en cours)
 *   GET    /api/campagnes/<id>/            détail
 *   GET    /api/campagnes/mes-campagnes/   campagnes de l'organisateur connecté
 *   POST   /api/campagnes/                 création (brouillon)
 *   PATCH  /api/campagnes/<id>/            modification
 *   DELETE /api/campagnes/<id>/            suppression
 *   POST   /api/campagnes/<id>/publier/    brouillon -> en cours
 *   POST   /api/campagnes/<id>/cloturer/   en cours -> clôturée
 *   POST   /api/campagnes/<id>/photo/      envoi de la photo (multipart, champ `photo`)
 * Avec VITE_DEMO=true, les mêmes fonctions travaillent sur une copie des données fictives (mockData.js).
 * Les participations aux campagnes sont branchées sur /api/participations/campagnes/.
 */
import { api, IS_DEMO, unwrapList } from '../../lib/api';
import { daysLeft } from '../../lib/format';
import { mockResponse, nextId } from '../../lib/mock';
import { BESOINS, CAMPAGNES, CAMPAGNES_EN_REVUE, CATEGORIES, DETAILS, FAVORIS, MES_CAMPAGNES, ORG_DASHBOARD, POINTS_DE_CONTROLE } from './mockData';

const favoris = new Set(FAVORIS);
let enRevue = [...CAMPAGNES_EN_REVUE];

/* ---------- données de démo modifiables (VITE_DEMO=true) ---------- */
let campagnes = CAMPAGNES.map((c) => ({ ...c }));
let mesCampagnes = MES_CAMPAGNES.map((o) => (o.etat === 'live' ? { ...CAMPAGNES.find((c) => c.id === o.id), etat: 'live' } : { ...o }));

const trouver = (id) => campagnes.find((c) => c.id === Number(id)) || mesCampagnes.find((c) => c.id === Number(id)) || null;
const majDemo = (id, patch) => {
  const maj = (c) => (c.id === Number(id) ? { ...c, ...patch } : c);
  campagnes = campagnes.map(maj);
  mesCampagnes = mesCampagnes.map(maj);
  return trouver(id);
};

/**
 * Complète une campagne du back avec les champs d'affichage absents du serializer.
 * `image` n'est volontairement pas modifiée : les pages d'édition la renvoient telle quelle au back.
 */
export const versUI = (c) =>
  c && {
    ...c,
    organisation: c.organisation || c.organisateur_nom,
    nb_donateurs: c.nb_donateurs ?? 0,
    jours_restants: c.jours_restants ?? (c.date_fin ? daysLeft(c.date_fin) : null),
    ville: c.ville ?? '',
    image_position: c.image_position || 'center',
  };

export const categorieCode = (label) => CATEGORIES.find((c) => c.label === label)?.code || 'sol';
export const getCategories = () => CATEGORIES;
export const getPointsDeControle = () => POINTS_DE_CONTROLE;

/** Liste publique des campagnes publiées (statut « en cours »). */
export async function listCampagnes() {
  if (IS_DEMO) return mockResponse(campagnes);
  const data = await api.get('/campagnes/');
  // TODO(équipe): les campagnes clôturées (« Objectif atteint ») sont exclues de la liste publique — à confirmer
  return unwrapList(data)
    .filter((campagne) => campagne.statut === 'en_cours')
    .map(versUI);
}

/** Détail d'une campagne (null si introuvable). */
export async function getCampagne(id) {
  if (IS_DEMO) return mockResponse(trouver(id));
  try {
    return versUI(await api.get(`/campagnes/${id}/`));
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

/**
 * Identifiant Django d'une campagne pour les participations.
 * Les campagnes viennent maintenant du back : l'identifiant affiché est déjà le bon.
 */
async function resolveCampagneId(campagneId) {
  return Number(campagneId);
}

/** Onglets Histoire / Nouvelles / Utilisation des fonds du détail (UI). */
export function getCampagneDetails(id) {
  // TODO(API): pas encore d'endpoint — les nouvelles viendront de GET /api/publications/?campagne=<id>
  //   (voir backend/api/components/publication) ; les fonds nécessitent un modèle côté back.
  return mockResponse({ campagne: Number(id), ...DETAILS });
}

/** Besoins matériels d'une campagne (null si la campagne n'accepte pas de matériel). */
export function getBesoins(id) {
  // TODO(API): le back stocke `besoins` sur la campagne ([libellé, quantité]) ; le format de l'interface
  //   (reçus, objectif, icône, point de collecte) reste à aligner — voir backend/api/components/campagne
  return mockResponse(BESOINS[Number(id)] || null, 120);
}

/* ---------- participations aux campagnes ---------- */
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

/** Organisateur : demandes de participation reçues sur ses campagnes (en attente). */
export function listDemandesRecuesCampagnes() {
  if (IS_DEMO) return mockResponse([]);
  return api.get('/participations/campagnes/', { params: { statut: 'en_attente' } }).then((data) =>
    Promise.all(unwrapList(data).map(async (p) => {
      try {
        return { ...p, type_liste: 'campagne', campagne_detail: await api.get(`/campagnes/${p.campagne}/`) };
      } catch {
        return { ...p, type_liste: 'campagne' };
      }
    })),
  );
}

/** decision : 'acceptee' | 'refusee' */
export function traiterParticipationCampagne(id, decision) {
  if (IS_DEMO) return mockResponse({ id, statut: decision }, 200);
  return api.post(`/participations/campagnes/${id}/traiter/`, { statut: decision });
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

/** Campagnes de l'organisateur connecté. */
export async function listMesCampagnes() {
  if (IS_DEMO) return mockResponse(mesCampagnes);
  const data = await api.get('/campagnes/mes-campagnes/');
  return unwrapList(data).map(versUI);
}

/** Création d'une campagne (statut « brouillon »). data : champs du formulaire de l'assistant. */
export async function createCampagne(data) {
  if (IS_DEMO) {
    const creee = { ...data, id: nextId(), montant_collecte: '0.000', objectif_montant: String(data.objectif_montant), statut: 'brouillon', etat: 'draft', nb_donateurs: 0 };
    mesCampagnes = [creee, ...mesCampagnes];
    return mockResponse(creee, 900);
  }
  return api.post('/campagnes/', data);
}

export async function updateCampagne(id, data) {
  if (IS_DEMO) return mockResponse(majDemo(id, data), 500);
  return api.patch(`/campagnes/${id}/`, data);
}

/** Formats et taille acceptés pour la photo d'une campagne (mêmes règles que le back). */
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const PHOTO_TAILLE_MAX = 5 * 1024 * 1024;

/** Message d'erreur si le fichier ne convient pas, sinon ''. */
export function verifierPhoto(file) {
  if (!file) return 'Aucun fichier sélectionné.';
  if (!PHOTO_TYPES.includes(file.type)) return 'Formats acceptés : JPG, PNG ou WebP.';
  if (file.size > PHOTO_TAILLE_MAX) return 'La photo ne doit pas dépasser 5 Mo.';
  return '';
}

/** Envoie (ou remplace) la photo d'une campagne. Renvoie la campagne mise à jour (`image` = URL de la photo). */
export async function uploadPhotoCampagne(id, file) {
  if (IS_DEMO) return mockResponse(majDemo(id, { image: URL.createObjectURL(file) }), 700);
  const form = new FormData();
  form.append('photo', file);
  return api.post(`/campagnes/${id}/photo/`, form);
}

export async function deleteCampagne(id) {
  if (IS_DEMO) {
    campagnes = campagnes.filter((c) => c.id !== Number(id));
    mesCampagnes = mesCampagnes.filter((c) => c.id !== Number(id));
    return mockResponse(null, 300);
  }
  return api.delete(`/campagnes/${id}/`);
}

export async function publierCampagne(id) {
  if (IS_DEMO) return mockResponse(majDemo(id, { statut: 'en_cours' }), 300);
  return api.post(`/campagnes/${id}/publier/`, {});
}

export async function cloturerCampagne(id) {
  if (IS_DEMO) return mockResponse(majDemo(id, { statut: 'cloturee' }), 300);
  return api.post(`/campagnes/${id}/cloturer/`, {});
}

export function getOrgDashboard() {
  // TODO(API): agrégats à calculer depuis GET /api/dons/, /api/participations/evenements/ — pas d'endpoint dédié
  return mockResponse(ORG_DASHBOARD);
}

/* ---------- administration ---------- */

/** Toutes les campagnes, tous statuts confondus (page admin « Gestion des campagnes »). */
export async function listToutesCampagnes() {
  if (IS_DEMO) {
    const ids = new Set(campagnes.map((c) => c.id));
    return mockResponse([...campagnes, ...mesCampagnes.filter((c) => !ids.has(c.id))]);
  }
  const data = await api.get('/campagnes/');
  return unwrapList(data).map(versUI);
}

export function listCampagnesEnRevue() {
  // TODO(API): remplacer par GET /api/campagnes/?statut=brouillon — voir backend/api/components/campagne
  return mockResponse(enRevue);
}

/** decision : 'publier' | 'corriger' | 'refuser' */
export function deciderRevue(id, decision) {
  // TODO(API): remplacer par POST /api/campagnes/<id>/publier/ (publier) — voir backend/api/components/campagne
  enRevue = enRevue.filter((c) => c.id !== id);
  return mockResponse({ id, decision }, 400);
}
