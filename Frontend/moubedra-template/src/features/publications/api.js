/**
 * API du module Publications (fil, likes « Merci », commentaires, modération).
 * Données fictives de même forme que PublicationSerializer (+ champs UI, voir mockData.js).
 */
import { api, unwrapList } from '../../lib/api'; // eslint-disable-line no-unused-vars
import { mockResponse, nextId } from '../../lib/mock';
import { FILE_MODERATION, FILTRES, PUBLICATIONS, PUBLICATION_ENTRANTE, RAIL, TYPES, TYPES_COMPOSER } from './mockData';

let publications = [...PUBLICATIONS];
let fileModeration = [...FILE_MODERATION];

export const getTypes = () => TYPES;
export const getTypesComposer = () => TYPES_COMPOSER;
export const getFiltres = () => FILTRES;

export function listPublications() {
  // TODO(API): remplacer par GET /api/publications/ — voir backend/api/components/publication
  return mockResponse(publications, 1000); // délai volontaire : montre les squelettes de chargement
}

/** Publication arrivée pendant la lecture (UI démo ; à remplacer par un rafraîchissement périodique). */
export function getPublicationEntrante() {
  return mockResponse(PUBLICATION_ENTRANTE, 0);
}

/** Aperçu « En direct de la communauté » de l'accueil : urgence, événement, objectif atteint. */
export function listApercuCommunaute() {
  // TODO(API): remplacer par GET /api/publications/?ordering=-nb_like&page_size=3 — voir backend/api/components/publication
  return mockResponse([1, 2, 5].map((id) => publications.find((p) => p.id === id)).filter(Boolean), 0);
}

/** payload : { type, contenu, auteur } */
export function creerPublication({ type, contenu, auteur }) {
  // TODO(API): remplacer par POST /api/publications/ { contenu, titre, campagne } — voir backend/api/components/publication
  const base = {
    id: nextId(), auteur: auteur.id, auteur_nom: auteur.nom_complet, auteur_initiales: auteur.initiales, auteur_couleur: auteur.couleur,
    auteur_verifie: auteur.role === 'organisateur', auteur_sous_titre: auteur.sous_titre, date_creation: new Date().toISOString(),
    statut: 'publiee', image: '', titre: '', nb_like: 0, nb_commentaire: 0, mine: true, campagne: null, score_toxicite: null,
  };
  const p =
    type === 'poll'
      ? { ...base, type, titre: contenu, contenu: '', details: { options: [['Oui', 0], ['Non', 0]], votes: 0, fin: 'se termine dans 7 jours' } }
      : type === 'story'
        ? { ...base, type, contenu, details: {} }
        : { ...base, type: 'thanks', contenu, details: { destinataire: 'la communauté' } };
  publications = [p, ...publications];
  return mockResponse(p, 900);
}

export function supprimerPublication(id) {
  // TODO(API): remplacer par DELETE /api/publications/<id>/ — voir backend/api/components/publication
  publications = publications.filter((p) => p.id !== id);
  return mockResponse({ id }, 200);
}

export function restaurerPublication(p) {
  // TODO(API): l'annulation se fait côté front en retardant le DELETE (pas d'endpoint de restauration)
  publications = [p, ...publications.filter((x) => x.id !== p.id)];
  return mockResponse(p, 100);
}

/** « Merci » (like). Renvoie l'état final. */
export function basculerMerci(publicationId, actif) {
  // TODO(API): remplacer par POST /api/likes/ { publication } ou DELETE /api/likes/<id>/ — voir backend/api/components/like
  return mockResponse({ publication: publicationId, actif }, 100);
}

/** Vote dans un sondage (UI : pas de modèle côté back). */
export function voter(publicationId, option) {
  // TODO(API): pas encore de modèle « sondage » côté back
  return mockResponse({ publication: publicationId, option }, 100);
}

/** Vérification IA du texte saisi (UI). */
export function verifierTexte(texte) {
  // TODO(API): le back calcule `score_toxicite` à la création ; pas d'endpoint de pré-vérification
  return mockResponse({ ok: true, texte }, 700);
}

export function getRail() {
  // TODO(API): « Votre impact » depuis GET /api/dons/ ; campagnes depuis GET /api/campagnes/?ordering=-montant_collecte
  return mockResponse(RAIL, 0);
}

/* ---------- modération admin ---------- */
export function listFileModeration() {
  // TODO(API): remplacer par GET /api/publications/?score_toxicite__gte=0.1 et GET /api/commentaires/?… — voir backend/api/components/publication
  return mockResponse(fileModeration);
}

/** decision : 'garder' | 'masquer' | 'supprimer' */
export function moderer(id, decision) {
  // TODO(API): remplacer par PATCH /api/publications/<id>/ (ou /api/commentaires/<id>/) { statut: 'publiee' | 'masquee' | 'supprimee' }
  fileModeration = fileModeration.filter((m) => m.id !== id);
  return mockResponse({ id, decision }, 200);
}
