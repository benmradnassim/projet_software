/**
 * Données fictives — signalements.
 * Forme : SignalementSerializer (backend/api/serializers/signalement.py)
 *   id, declarant, publication, commentaire, campagne, evenement, type ('publication'|'commentaire'|'campagne'|'evenement'|'autre'),
 *   description, localisation, date_signalement, statut ('en_attente'|'en_cours'|'resolu'|'rejete'), traite_par, date_traitement
 * Champs « UI » : motif, extrait, reponse, nb_signalants, priorite, auteur_nom, resultat.
 */

export const MOTIFS = ['Contenu trompeur', 'Propos haineux', 'Photo d’enfant identifiable', 'Spam', 'Usurpation possible', 'Autre'];

/** Signalements envoyés par l'utilisateur connecté. */
export const MES_SIGNALEMENTS = [
  { id: 1, declarant: 1, publication: 102, type: 'publication', description: 'Demande de virement direct hors plateforme.', localisation: '', date_signalement: '2026-11-21T10:00:00+01:00', statut: 'en_cours', traite_par: null, date_traitement: null, motif: 'Contenu trompeur', extrait: '« Don urgent, envoyez par virement à ce RIB… »', reponse: 'Notre équipe vérifie la publication. Délai habituel : 24 h.', quand: 'il y a 2 jours' },
  { id: 2, declarant: 1, commentaire: 101, type: 'commentaire', description: '', localisation: '', date_signalement: '2026-11-12T10:00:00+01:00', statut: 'resolu', traite_par: 3, date_traitement: '2026-11-12T18:00:00+01:00', motif: 'Propos haineux', extrait: 'Commentaire insultant sous « Repas chauds »', reponse: 'Merci ! Le commentaire a été supprimé et l’auteur averti.', resultat: 'Traité · retiré', quand: '12 nov.' },
  { id: 3, declarant: 1, publication: 6, type: 'publication', description: '', localisation: '', date_signalement: '2026-11-03T10:00:00+01:00', statut: 'rejete', traite_par: 3, date_traitement: '2026-11-04T10:00:00+01:00', motif: 'Autre', extrait: 'Photo floue d’un événement', reponse: 'La publication respecte les règles de la communauté.', resultat: 'Classé sans suite', quand: '3 nov.' },
];

/** Signalements visant les contenus de l'organisatrice. */
export const SIGNALEMENTS_ORGANISATEUR = [
  { id: 11, type: 'publication', statut: 'en_attente', motif: 'Photo d’enfant identifiable', extrait: '« 32 cartables distribués… »', reponse: 'Floutez le visage ou remplacez la photo pour garder la publication.', a_traiter: true },
  { id: 12, type: 'commentaire', statut: 'resolu', motif: 'Spam', extrait: 'Sous « Un cartable pour chaque rêve »', reponse: 'Le commentaire a été retiré par la modération.', a_traiter: false },
];

/** File des signalements côté admin, triée par priorité. */
export const SIGNALEMENTS_ADMIN = [
  { id: 21, type: 'publication', statut: 'en_attente', extrait: '« Don urgent, envoyez par virement… »', motif: 'Contenu trompeur', nb_signalants: 5, priorite: 'haute', auteur_nom: 'Anonyme' },
  { id: 22, type: 'publication', statut: 'en_attente', extrait: 'Photo de la distribution de cartables', motif: 'Photo d’enfant identifiable', nb_signalants: 2, priorite: 'haute', auteur_nom: 'Main dans la Main', regle: '4.2' },
  { id: 23, type: 'commentaire', statut: 'en_attente', extrait: '« Ces associations volent… »', motif: 'Propos haineux', nb_signalants: 3, priorite: 'moyenne', auteur_nom: 'Youssef B.' },
  { id: 24, type: 'autre', statut: 'en_attente', extrait: 'Compte « don_rapide_tn »', motif: 'Usurpation possible', nb_signalants: 1, priorite: 'moyenne', auteur_nom: 'don_rapide_tn', type_label: 'Profil' },
];

export const REGLE_42 = {
  titre: 'Règle 4.2 · Protection des mineurs',
  texte:
    'Pas de visage d’enfant reconnaissable sans accord écrit des parents. Les photos sont floutées ou remplacées avant publication. Les mains, le dos ou les objets sont toujours acceptés.',
};
