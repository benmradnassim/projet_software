/**
 * API du module Publications (fil, likes « Merci », commentaires, modération).
 *
 * Branché sur le back quand VITE_DEMO=false (backend/api/components/publication, commentaire, like) :
 *   GET    /api/publications/?statut=publiee            fil (US 7.2)
 *   POST   /api/publications/                           ajouter (US 7.1)
 *   PATCH  /api/publications/<id>/                      modifier (US 7.3)
 *   DELETE /api/publications/<id>/                      supprimer (US 7.4 ; admin : US 7.10)
 *   POST / DELETE /api/publications/<id>/like/          Merci (US 7.9)
 *   POST   /api/publications/verifier/                  verdict IA pendant la saisie (US 7.6)
 *   GET    /api/commentaires/?publication=<id>          commentaires ; POST / PATCH / DELETE (US 7.5, 7.7, 7.8, 7.11)
 *   GET    /api/publications/moderation/                file de modération (admin)
 *   POST   /api/{publications|commentaires}/<id>/moderer/  { decision }
 * Avec VITE_DEMO=true, les mêmes fonctions renvoient les données fictives de mockData.js.
 */
import { IS_DEMO, api, unwrapList } from '../../lib/api';
import { initials } from '../../lib/format';
import { ago, mockError, mockResponse, nextId } from '../../lib/mock';
import { FILE_MODERATION, FILTRES, PUBLICATIONS, PUBLICATION_ENTRANTE, RAIL, TYPES, TYPES_COMPOSER } from './mockData';

let publications = [...PUBLICATIONS];
let fileModeration = [...FILE_MODERATION];
let commentairesDemo = [
  { id: 501, publication: 4, auteur: 4, auteur_nom: 'Yasmine Ayari', contenu: 'Quelle belle soirée, bravo Nour !', statut: 'publie', date_creation: ago({ h: 1 }), date_modification: ago({ h: 1 }) },
  { id: 502, publication: 4, auteur: 2, auteur_nom: 'Marwa Ltifi', contenu: 'Merci pour ton aide, à la semaine prochaine 💚', statut: 'publie', date_creation: ago({ min: 40 }), date_modification: ago({ min: 40 }) },
];

export const getTypes = () => TYPES;
export const getTypesComposer = () => TYPES_COMPOSER;
export const getFiltres = () => FILTRES;

/* ---------- adaptation des données du back à l'interface ---------- */

const SOUS_TITRE_ROLE = { organisateur: 'Organisateur', admin: 'Équipe Moubedra', citoyen: 'Citoyen·ne', utilisateur: 'Citoyen·ne' };

/** Ajoute les champs d'affichage absents du serializer (initiales, sous-titre, badge vérifié, détails de carte). */
export const publicationVersUI = (p) => ({
  ...p,
  auteur_initiales: p.auteur_initiales ?? initials(p.auteur_nom || ''),
  auteur_verifie: p.auteur_verifie ?? p.auteur_role === 'organisateur',
  auteur_sous_titre: p.auteur_sous_titre ?? [p.auteur_organisation || SOUS_TITRE_ROLE[p.auteur_role], p.auteur_ville].filter(Boolean).join(' · '),
  // Les cartes riches (sondage, avancement…) ont besoin de `details`, que le back ne stocke pas encore :
  // sans détails, PostCard affiche la carte au format « Histoire » en gardant l'étiquette du type.
  details: p.details ?? (p.type === 'thanks' ? { destinataire: p.campagne_titre || 'la communauté' } : null),
});

/* ---------- fil ---------- */

export async function listPublications(params = {}) {
  if (IS_DEMO) return mockResponse(publications, 1000); // délai volontaire : montre les squelettes de chargement
  const data = await api.get('/publications/', { params: { statut: 'publiee', ...params } });
  return unwrapList(data).map(publicationVersUI);
}

/**
 * Nouvelles publications parues depuis le chargement du fil (pastille « N nouvelles publications »).
 * idsConnus : identifiants déjà affichés.
 */
export async function listPublicationsEntrantes(idsConnus) {
  if (IS_DEMO) return idsConnus.has(PUBLICATION_ENTRANTE.id) ? [] : mockResponse([PUBLICATION_ENTRANTE], 0);
  const recentes = await listPublications();
  return recentes.filter((p) => !idsConnus.has(p.id));
}

/** Aperçu « En direct de la communauté » de l'accueil : les 3 publications les plus remerciées. */
export async function listApercuCommunaute() {
  if (IS_DEMO) return mockResponse([1, 2, 5].map((id) => publications.find((p) => p.id === id)).filter(Boolean), 0);
  return (await listPublications({ ordering: '-nb_like' })).slice(0, 3);
}

/**
 * Ajouter une publication (US 7.1). payload : { type, contenu, titre?, campagne?, auteur }
 * Renvoie la publication ; `statut` vaut 'en_attente' si la modération IA veut la revoir.
 * Contenu bloqué par l'IA : ApiError (400) avec `fields.contenu`.
 */
export async function creerPublication({ type, contenu, titre = '', campagne = null, auteur }) {
  if (IS_DEMO) {
    const base = {
      id: nextId(), auteur: auteur.id, auteur_nom: auteur.nom_complet, auteur_initiales: auteur.initiales, auteur_couleur: auteur.couleur,
      auteur_verifie: auteur.role === 'organisateur', auteur_sous_titre: auteur.sous_titre, date_creation: new Date().toISOString(),
      statut: 'publiee', image: '', titre, nb_like: 0, nb_commentaire: 0, mine: true, campagne: null, score_toxicite: null,
    };
    const p =
      type === 'poll'
        ? { ...base, type, titre: contenu, contenu: '', details: { options: [['Oui', 0], ['Non', 0]], votes: 0, fin: 'se termine dans 7 jours' } }
        : type === 'thanks'
          ? { ...base, type, contenu, details: { destinataire: 'la communauté' } }
          : { ...base, type, contenu, details: null };
    publications = [p, ...publications];
    return mockResponse(p, 900);
  }
  // Une question (sondage) est portée par le titre.
  const body = type === 'poll' ? { type, titre: contenu, contenu: '' } : { type, titre, contenu };
  return publicationVersUI(await api.post('/publications/', { ...body, campagne }));
}

/** Modifier sa publication (US 7.3). patch : { contenu?, titre? } */
export async function modifierPublication(id, patch) {
  if (IS_DEMO) {
    publications = publications.map((p) => (p.id === id ? { ...p, ...patch, date_modification: new Date().toISOString() } : p));
    return mockResponse(publications.find((p) => p.id === id), 500);
  }
  return publicationVersUI(await api.patch(`/publications/${id}/`, patch));
}

/** Supprimer sa publication (US 7.4) ou, admin, une publication inappropriée (US 7.10). */
export async function supprimerPublication(id) {
  if (IS_DEMO) {
    publications = publications.filter((p) => p.id !== id);
    return mockResponse({ id }, 200);
  }
  await api.delete(`/publications/${id}/`);
  return { id };
}

/** « Merci » (like, US 7.9). Renvoie { a_like, nb_like }. */
export async function basculerMerci(publicationId, actif) {
  if (IS_DEMO) return mockResponse({ a_like: actif }, 100);
  const url = `/publications/${publicationId}/like/`;
  return actif ? api.post(url) : api.delete(url);
}

/** Vote dans un sondage (UI : pas de modèle côté back). */
export function voter(publicationId, option) {
  // TODO(API): pas encore de modèle « sondage » côté back
  return mockResponse({ publication: publicationId, option }, 100);
}

/**
 * Vérification IA du texte pendant la saisie (US 7.6).
 * Renvoie { verdict: 'ok' | 'revue' | 'bloque', motif }.
 */
export async function verifierTexte(texte, { signal } = {}) {
  if (IS_DEMO) return mockResponse({ verdict: 'ok', motif: '' }, 700);
  return api.post('/publications/verifier/', { texte }, { signal });
}

export function getRail() {
  // TODO(API): « Votre impact » depuis GET /api/dons/ ; campagnes depuis GET /api/campagnes/?ordering=-montant_collecte
  return mockResponse(RAIL, 0);
}

/* ---------- commentaires (US 7.5, 7.7, 7.8, 7.11) ---------- */

export async function listCommentaires(publicationId) {
  if (IS_DEMO) return mockResponse(commentairesDemo.filter((c) => c.publication === publicationId), 300);
  return unwrapList(await api.get('/commentaires/', { params: { publication: publicationId } }));
}

/** Renvoie le commentaire ; `statut` vaut 'en_attente' s'il doit être revu par la modération. */
export async function ajouterCommentaire(publicationId, contenu, auteur) {
  if (IS_DEMO) {
    if (!contenu.trim()) return mockError('Écrivez un commentaire.');
    const now = new Date().toISOString();
    const c = { id: nextId(), publication: publicationId, auteur: auteur?.id, auteur_nom: auteur?.nom_complet, contenu: contenu.trim(), statut: 'publie', date_creation: now, date_modification: now };
    commentairesDemo = [...commentairesDemo, c];
    return mockResponse(c, 400);
  }
  return api.post('/commentaires/', { publication: publicationId, contenu });
}

export async function modifierCommentaire(id, contenu) {
  if (IS_DEMO) {
    commentairesDemo = commentairesDemo.map((c) => (c.id === id ? { ...c, contenu, date_modification: new Date().toISOString() } : c));
    return mockResponse(commentairesDemo.find((c) => c.id === id), 400);
  }
  return api.patch(`/commentaires/${id}/`, { contenu });
}

export async function supprimerCommentaire(id) {
  if (IS_DEMO) {
    commentairesDemo = commentairesDemo.filter((c) => c.id !== id);
    return mockResponse({ id }, 200);
  }
  await api.delete(`/commentaires/${id}/`);
  return { id };
}

/* ---------- modération admin ---------- */

export async function listFileModeration() {
  if (IS_DEMO) return mockResponse(fileModeration);
  const file = await api.get('/publications/moderation/');
  return file.map((m) => ({ ...m, auteur_initiales: initials(m.auteur_nom || '') }));
}

/** item : élément de la file ({ id, objet }) ; decision : 'garder' | 'masquer' | 'supprimer' */
export async function moderer(item, decision) {
  if (IS_DEMO) {
    fileModeration = fileModeration.filter((m) => !(m.id === item.id && m.objet === item.objet));
    return mockResponse({ id: item.id, decision }, 200);
  }
  const ressource = item.objet === 'commentaire' ? 'commentaires' : 'publications';
  return api.post(`/${ressource}/${item.id}/moderer/`, { decision });
}
