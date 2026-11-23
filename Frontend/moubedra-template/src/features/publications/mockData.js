/**
 * Données fictives — fil communautaire et modération.
 * Forme : PublicationSerializer (backend/api/serializers/publication.py)
 *   id, auteur, auteur_nom, campagne, titre, contenu, image, date_creation, date_modification,
 *   statut, score_toxicite, nb_like, nb_commentaire
 * Champs « UI » (absents du back) : type, auteur_initiales, auteur_couleur, auteur_verifie,
 *   auteur_sous_titre, campagne_titre, details (contenu propre à chaque type de carte), mine.
 */
import { ago } from '../../lib/mock';

/** Types de cartes : libellé, icône lucide, couleurs, onglet de filtre, réservé aux organisateurs. */
export const TYPES = {
  urgent: { label: 'Appel urgent', icon: 'siren', color: '#b8371f', bg: '#fde8e4', group: 'urgent', organisateur: true },
  event: { label: 'Événement', icon: 'calendar-days', color: '#1f3a6b', bg: '#e6edf8', group: 'event', organisateur: true },
  update: { label: 'Avancement', icon: 'trending-up', color: '#3d6d31', bg: '#e5f1e1', group: 'camp', organisateur: true },
  goal: { label: 'Objectif atteint', icon: 'trophy', color: '#fff', bg: '#ffffff1f', group: 'camp', organisateur: true },
  transparency: { label: 'Transparence', icon: 'receipt', color: '#6b4f9a', bg: '#efe9f7', group: 'camp', organisateur: true },
  beforeafter: { label: 'Avant / Après', icon: 'images', color: '#2f6f86', bg: '#e2f1f2', group: 'comm', organisateur: true },
  thanks: { label: 'Merci', icon: 'heart', color: '#d9472b', bg: '#ffede7', group: 'comm' },
  story: { label: 'Histoire', icon: 'camera', color: '#4f7f42', bg: '#e5f1e1', group: 'comm' },
  poll: { label: 'Question', icon: 'vote', color: '#1f3a6b', bg: '#e6edf8', group: 'comm' },
};

/** Types proposés dans la zone de publication (dans l'ordre). */
export const TYPES_COMPOSER = [
  { type: 'thanks', label: 'Merci', icon: 'heart', placeholder: 'Dites merci à une association, un bénévole, un voisin…' },
  { type: 'story', label: 'Photo / histoire', icon: 'camera', placeholder: 'Racontez ce que vous avez vécu sur le terrain…' },
  { type: 'poll', label: 'Question', icon: 'vote', placeholder: 'Posez une question à la communauté…' },
  { type: 'update', label: 'Avancement', icon: 'trending-up', placeholder: 'Partagez l’avancement de votre campagne…', organisateur: true },
  { type: 'urgent', label: 'Appel urgent', icon: 'siren', placeholder: 'Décrivez le besoin urgent…', organisateur: true },
  { type: 'event', label: 'Événement', icon: 'calendar-days', placeholder: 'Annoncez votre événement…', organisateur: true },
];

export const FILTRES = [
  { key: 'all', label: 'Tout' },
  { key: 'urgent', label: 'Urgences', icon: 'siren' },
  { key: 'event', label: 'Événements', icon: 'calendar-days' },
  { key: 'camp', label: 'Campagnes', icon: 'trending-up' },
  { key: 'comm', label: 'Communauté', icon: 'users' },
];

const pub = (o) => ({ statut: 'publiee', image: '', titre: '', score_toxicite: null, campagne: null, nb_commentaire: 0, mine: false, ...o, date_modification: o.date_creation });

export const PUBLICATIONS = [
  pub({
    id: 1, type: 'urgent', auteur: 11, auteur_nom: 'Croissant-Rouge Jendouba', auteur_initiales: 'CR', auteur_couleur: '#b8371f', auteur_verifie: true, auteur_sous_titre: 'Organisateur',
    date_creation: ago({ h: 1 }), campagne: 3,
    titre: 'Inondations à Jendouba : couvertures et bras nécessaires',
    contenu: 'Une trentaine de familles ont été relogées à l’école Ibn Khaldoun. On collecte jusqu’à mercredi soir.',
    nb_like: 57, nb_commentaire: 12,
    details: { lieu: 'Jendouba', fin_dans_secondes: (2 * 24 + 14) * 3600 + 1520, besoins: [{ libelle: 'Couvertures', recu: 26, objectif: 40 }, { libelle: 'Bénévoles', recu: 9, objectif: 15 }, { libelle: 'Kits d’hygiène', recu: 31, objectif: 50 }] },
  }),
  pub({
    id: 2, type: 'event', auteur: 6, auteur_nom: 'Collectif Vert Mahdia', auteur_initiales: 'CV', auteur_couleur: '#2f6f86', auteur_verifie: true, auteur_sous_titre: 'Organisateur',
    date_creation: ago({ h: 3 }), campagne: 4,
    titre: 'Nettoyons la plage de la Corniche', contenu: '',
    nb_like: 33, nb_commentaire: 5,
    details: { evenement: 1, date: '2026-12-05T08:30:00+01:00', horaire: '08:30 – 12:00', lieu: 'Plage de la Corniche, Mahdia', inscrits: 21, capacite: 40 },
  }),
  pub({
    id: 3, type: 'update', auteur: 2, auteur_nom: 'Marwa Ltifi', auteur_initiales: 'ML', auteur_couleur: '#4f7f42', auteur_verifie: true, auteur_sous_titre: 'Main dans la Main',
    date_creation: ago({ min: 20 }), campagne: 1, campagne_titre: 'Un cartable pour chaque rêve',
    contenu: 'Aujourd’hui, 32 cartables ont trouvé leur chemin vers les élèves de l’école El Habib. Merci à chacune et chacun ! 💚',
    image: '/media/covers/education.webp',
    nb_like: 49, nb_commentaire: 8,
    details: { collecte: 8450, objectif: 12000, semaine: 1200, jours_restants: 9 },
  }),
  pub({
    id: 4, type: 'thanks', auteur: 1, auteur_nom: 'Nour Saada', auteur_initiales: 'NS', auteur_couleur: '#d9472b', auteur_verifie: false, auteur_sous_titre: 'Citoyenne · Tunis',
    date_creation: ago({ h: 2 }),
    contenu: 'Hier soir, j’ai servi des repas avec l’équipe de la Banque Alimentaire. Je suis repartie avec plus que ce que j’ai donné. Merci de m’avoir accueillie.',
    nb_like: 41, nb_commentaire: 6, mine: true,
    details: { destinataire: 'Banque Alimentaire Tunisienne' },
  }),
  pub({
    id: 5, type: 'goal', auteur: 15, auteur_nom: 'Lire et Grandir', auteur_initiales: 'LG', auteur_couleur: '#c98a3a', auteur_verifie: true, auteur_sous_titre: 'Organisateur',
    date_creation: ago({ d: 1, h: 2 }), campagne: 8, campagne_titre: 'Une bibliothèque au cœur du village',
    contenu: '', nb_like: 120, nb_commentaire: 22,
    details: { montant: 9500, donateurs: 148, benevoles: 12, suite: 'Les travaux commencent en janvier.' },
  }),
  pub({
    id: 6, type: 'beforeafter', auteur: 6, auteur_nom: 'Collectif Vert Mahdia', auteur_initiales: 'CV', auteur_couleur: '#2f6f86', auteur_verifie: true, auteur_sous_titre: 'Organisateur',
    date_creation: ago({ d: 5 }), campagne: 4,
    titre: 'Plage de Salakta : 3 heures, 26 bénévoles', contenu: '',
    nb_like: 88, nb_commentaire: 14,
    details: { stats: [['38', 'sacs ramassés'], ['26', 'bénévoles'], ['1,2 km', 'de plage']] },
  }),
  pub({
    id: 7, type: 'transparency', auteur: 2, auteur_nom: 'Main dans la Main', auteur_initiales: 'ML', auteur_couleur: '#4f7f42', auteur_verifie: true, auteur_sous_titre: 'Organisateur',
    date_creation: ago({ d: 2 }), campagne: 1, campagne_titre: 'Un cartable pour chaque rêve',
    contenu: 'Comme promis, voici l’utilisation des 4 750 premiers TND.',
    nb_like: 21, nb_commentaire: 3,
    details: { lignes: [['60 cartables complets', 3000], ['Fournitures et livres', 1450], ['Transport vers Sfax', 300]], fichier: 'facture_novembre.pdf', taille: '240 Ko' },
  }),
  pub({
    id: 8, type: 'poll', auteur: 4, auteur_nom: 'Yasmine Ayari', auteur_initiales: 'YA', auteur_couleur: '#1f3a6b', auteur_verifie: false, auteur_sous_titre: 'Bénévole · Tunis',
    date_creation: ago({ h: 6 }),
    titre: 'Quelle prochaine action organiser à Tunis en décembre ?', contenu: '',
    nb_like: 18, nb_commentaire: 9,
    details: { options: [['Collecte de vêtements d’hiver', 46], ['Soutien scolaire du samedi', 32], ['Jardin partagé à La Marsa', 22]], votes: 214, fin: 'se termine dans 2 jours' },
  }),
];

/** Publication qui « arrive » pendant la lecture du fil (pastille « 1 nouvelle publication »). */
export const PUBLICATION_ENTRANTE = pub({
  id: 9, type: 'thanks', auteur: 8, auteur_nom: 'Sana Kefi', auteur_initiales: 'SK', auteur_couleur: '#c98a3a', auteur_verifie: false, auteur_sous_titre: 'Citoyenne · Sfax',
  date_creation: ago({}),
  contenu: 'Mon fils a reçu son cartable ce matin. Il ne l’a plus lâché ! Merci du fond du cœur à tous les donateurs.',
  nb_like: 3, details: { destinataire: 'Main dans la Main' },
});

/** Colonne de droite du fil. */
export const RAIL = {
  impact: { montant: '170 TND · 2 actions', prochain: 'Prochain rendez-vous : samedi 5 déc., plage de Mahdia' },
  campagnes: [
    { id: 3, titre: 'Un toit sûr après les pluies', info: 'Jendouba · 76 %', image: '/media/covers/solidarite.webp', position: '50% 55%', urgent: true },
    { id: 2, titre: 'Des repas chauds', info: 'Tunis · 65 %', image: '/media/covers/alimentaire.webp', position: '50% 60%' },
    { id: 4, titre: 'Nos plages, notre héritage', info: 'Mahdia · 61 %', image: '/media/covers/environnement.webp', position: '62% 70%' },
  ],
};

/** File de modération IA (commentaires et publications avec score_toxicite). */
export const FILE_MODERATION = [
  { id: 101, objet: 'commentaire', auteur_initiales: 'YB', auteur_nom: 'Youssef B.', contenu: 'Ces associations volent l’argent, ce sont tous des voleurs !!', motif_ia: 'Insulte / accusation', score_toxicite: 0.87, mots: ['voleurs', 'volent'] },
  { id: 102, objet: 'publication', auteur_initiales: 'AN', auteur_nom: 'Anonyme', contenu: 'Don urgent ! Envoyez directement par virement au RIB 08 006 000… pas besoin de passer par l’appli.', motif_ia: 'Arnaque possible', score_toxicite: 0.78, mots: ['RIB', 'directement'] },
  { id: 103, objet: 'publication', auteur_initiales: 'RM', auteur_nom: 'Rim M.', contenu: 'Super journée à la plage, merci à toute l’équipe 💚 on a ramassé 38 sacs !', motif_ia: 'Faux positif probable', score_toxicite: 0.12, mots: [] },
];
