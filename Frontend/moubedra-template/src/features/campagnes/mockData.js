/**
 * Données fictives — campagnes.
 * Forme : CampagneSerializer (backend/api/serializers/campagne.py) :
 *   id, organisateur, organisateur_nom, titre, description, categorie, date_debut, date_fin,
 *   objectif_montant, montant_collecte (chaînes décimales "8450.000"), statut, image, cree_le, modifie_le
 * Champs marqués « UI » : absents du serializer aujourd'hui (à ajouter côté back ou à calculer).
 */

/** Catégories : libellé affiché, code de filtre, couverture par défaut. */
export const CATEGORIES = [
  { code: 'edu', label: 'Éducation', cover: 'education' },
  { code: 'food', label: 'Alimentaire', cover: 'alimentaire' },
  { code: 'env', label: 'Environnement', cover: 'environnement' },
  { code: 'urg', label: 'Urgence', cover: 'urgence' },
  { code: 'sol', label: 'Solidarité', cover: 'solidarite' },
  { code: 'sante', label: 'Santé', cover: 'sante' },
];

const base = (o) => ({
  statut: 'en_cours',
  cree_le: `${o.date_debut}T09:00:00+01:00`,
  modifie_le: `${o.date_debut}T09:00:00+01:00`,
  urgent: false, // UI
  ...o,
});

export const CAMPAGNES = [
  base({
    id: 1,
    organisateur: 2,
    organisateur_nom: 'Marwa Ltifi',
    organisation: 'Main dans la Main', // UI : nom de la structure affiché sur les cartes
    titre: 'Un cartable pour chaque rêve',
    description:
      'Offrons à **120 enfants** de Sfax les fournitures et les cartables qui leur permettront de commencer l’année avec confiance.\n\nChaque cartable contient : cahiers, trousse complète, calculatrice, gourde et un livre offert par une librairie partenaire.',
    categorie: 'Éducation',
    date_debut: '2026-11-01',
    date_fin: '2026-12-02',
    objectif_montant: '12000.000',
    montant_collecte: '8450.000',
    image: '/media/covers/education.webp',
    image_position: '30% 55%', // UI
    ville: 'Sfax', // UI
    nb_donateurs: 48, // UI
    jours_restants: 9, // UI (à calculer depuis date_fin une fois branché)
  }),
  base({
    id: 2,
    organisateur: 10,
    organisateur_nom: 'Leïla Ben Romdhane',
    organisation: 'Banque Alimentaire Tunisienne',
    titre: 'Des repas chauds, des cœurs légers',
    description:
      'Chaque soir, des familles de Tunis attendent un repas chaud. Vos dons financent les couffins et les repas servis à la cuisine solidaire de Bab El Khadra.\n\nUn repas partagé est parfois le premier pas vers un quotidien plus serein.',
    categorie: 'Alimentaire',
    date_debut: '2026-10-25',
    date_fin: '2026-11-29',
    objectif_montant: '8000.000',
    montant_collecte: '5200.000',
    image: '/media/covers/alimentaire.webp',
    image_position: '50% 60%',
    ville: 'Tunis',
    nb_donateurs: 63,
    jours_restants: 6,
  }),
  base({
    id: 3,
    organisateur: 11,
    organisateur_nom: 'Hatem Jaziri',
    organisation: 'Croissant-Rouge Jendouba',
    titre: 'Un toit sûr après les pluies',
    description:
      'Une trentaine de familles ont été relogées à l’école Ibn Khaldoun après les inondations. Les dons financent couvertures, kits d’hygiène et réparations urgentes.\n\nChaque dinar est suivi et publié dans l’onglet « Utilisation des fonds ».',
    categorie: 'Urgence',
    date_debut: '2026-10-18',
    date_fin: '2026-11-30',
    objectif_montant: '18000.000',
    montant_collecte: '13700.000',
    image: '/media/covers/urgence.webp',
    image_position: '50% 50%',
    ville: 'Jendouba',
    nb_donateurs: 89,
    jours_restants: 7,
    urgent: true,
  }),
  base({
    id: 4,
    organisateur: 6,
    organisateur_nom: 'Collectif Vert Mahdia',
    organisation: 'Collectif Vert Mahdia',
    titre: 'Nos plages, notre héritage',
    description:
      'Des bénévoles se réunissent chaque mois pour nettoyer, sensibiliser et protéger le littoral de Mahdia.\n\nLes dons financent le matériel de ramassage, les bennes de tri et les ateliers dans les écoles.',
    categorie: 'Environnement',
    date_debut: '2026-11-05',
    date_fin: '2026-12-07',
    objectif_montant: '6000.000',
    montant_collecte: '3680.000',
    image: '/media/covers/environnement.webp',
    image_position: '62% 70%',
    ville: 'Mahdia',
    nb_donateurs: 31,
    jours_restants: 14,
  }),
  base({
    id: 5,
    organisateur: 12,
    organisateur_nom: 'Rania Mabrouk',
    organisation: 'Association Ennour',
    titre: 'Thé et compagnie pour nos aînés',
    description:
      'Des visites régulières, des jeux et des moments partagés pour rompre l’isolement des aînés de Sousse.\n\nLes dons financent le transport des bénévoles, le goûter et le matériel d’animation.',
    categorie: 'Solidarité',
    date_debut: '2026-11-02',
    date_fin: '2026-12-13',
    objectif_montant: '4000.000',
    montant_collecte: '2100.000',
    image: '/media/covers/solidarite.webp',
    image_position: '50% 55%',
    ville: 'Sousse',
    nb_donateurs: 37,
    jours_restants: 20,
  }),
  base({
    id: 6,
    organisateur: 13,
    organisateur_nom: 'Dr Sami Chaabane',
    organisation: 'Médecins Solidaires',
    titre: 'Caravane de dépistage gratuit',
    description:
      'Une caravane médicale parcourt les villages de Siliana pour dépister gratuitement le diabète et l’hypertension.\n\nLes dons financent les tensiomètres, les bandelettes et le carburant de la caravane.',
    categorie: 'Santé',
    date_debut: '2026-11-10',
    date_fin: '2026-12-18',
    objectif_montant: '7000.000',
    montant_collecte: '1200.000',
    image: '/media/covers/sante.webp',
    image_position: 'center',
    ville: 'Siliana',
    nb_donateurs: 15,
    jours_restants: 25,
  }),
  base({
    id: 7,
    organisateur: 14,
    organisateur_nom: 'Ines Gharbi',
    organisation: 'Les Racines Vertes',
    titre: 'Un jardin partagé pour tous',
    description:
      'Créons à Ariana un lieu de rencontre où petits et grands cultivent ensemble.\n\nLes dons financent les outils, les graines et le système d’arrosage goutte à goutte.',
    categorie: 'Environnement',
    date_debut: '2026-10-29',
    date_fin: '2026-12-23',
    objectif_montant: '5000.000',
    montant_collecte: '1900.000',
    image: '/media/covers/environnement.webp',
    image_position: '30% 80%',
    ville: 'Ariana',
    nb_donateurs: 22,
    jours_restants: 30,
  }),
  base({
    id: 8,
    organisateur: 15,
    organisateur_nom: 'Lire et Grandir',
    organisation: 'Lire et Grandir',
    titre: 'Une bibliothèque au cœur du village',
    description:
      'Aménageons un espace de lecture ouvert aux enfants et aux familles de Kairouan.\n\nGrâce à 148 donateurs, l’objectif est atteint : les travaux commencent en janvier.',
    categorie: 'Éducation',
    date_debut: '2026-09-15',
    date_fin: '2026-11-15',
    objectif_montant: '9500.000',
    montant_collecte: '9500.000',
    statut: 'cloturee',
    image: '/media/covers/education.webp',
    image_position: '75% 60%',
    ville: 'Kairouan',
    nb_donateurs: 148,
    jours_restants: 0,
  }),
];

/** Favoris de l'utilisateur connecté (UI : pas encore de modèle côté back). */
export const FAVORIS = [2];

/**
 * Besoins matériels par campagne (UI : pas encore de modèle côté back).
 * item = { icone (nom lucide), libelle, recu, objectif, precision, singulier }
 */
export const BESOINS = {
  1: {
    items: [
      { icone: 'backpack', libelle: 'Cartables', recu: 34, objectif: 60, precision: 'neufs ou très bon état', singulier: 'cartable' },
      { icone: 'pencil', libelle: 'Trousses complètes', recu: 41, objectif: 80, precision: 'stylos, crayons, gomme, règle', singulier: 'trousse complète' },
      { icone: 'book-open', libelle: 'Cahiers (lot de 5)', recu: 120, objectif: 200, precision: 'grand format, 96 pages', singulier: 'lot de 5 cahiers' },
    ],
    point_collecte: 'Local Main dans la Main, 14 rue Habib Thameur, Sfax',
    horaires: 'Lun. – sam., 9 h – 17 h',
    evenement: 3,
  },
  2: {
    items: [
      { icone: 'shopping-basket', libelle: 'Couffins alimentaires', recu: 48, objectif: 120, precision: 'semoule, pâtes, huile, sucre', singulier: 'couffin alimentaire' },
      { icone: 'milk', libelle: 'Briques de lait', recu: 210, objectif: 400, precision: 'UHT, non entamées', singulier: 'brique de lait' },
      { icone: 'wheat', libelle: 'Sacs de semoule 5 kg', recu: 35, objectif: 80, precision: 'date limite > 3 mois', singulier: 'sac de semoule' },
    ],
    point_collecte: 'Banque Alimentaire, 3 rue de Rome, Tunis',
    horaires: 'Lun. – ven., 8 h – 16 h',
    evenement: 3,
  },
  3: {
    items: [
      { icone: 'package', libelle: 'Couvertures', recu: 26, objectif: 40, precision: 'propres, en bon état', singulier: 'couverture' },
      { icone: 'package-check', libelle: 'Kits d’hygiène', recu: 31, objectif: 50, precision: 'savon, dentifrice, serviettes', singulier: 'kit d’hygiène' },
      { icone: 'shirt', libelle: 'Vêtements chauds enfants', recu: 58, objectif: 120, precision: 'taille 4 à 12 ans', singulier: 'vêtement chaud' },
    ],
    point_collecte: 'École Ibn Khaldoun, Jendouba',
    horaires: 'Tous les jours, 9 h – 18 h',
    evenement: 2,
  },
  4: {
    items: [
      { icone: 'hand', libelle: 'Paires de gants', recu: 62, objectif: 150, precision: 'jardinage ou nitrile', singulier: 'paire de gants' },
      { icone: 'trash-2', libelle: 'Sacs-poubelle 100 L', recu: 90, objectif: 300, precision: 'résistants', singulier: 'sac-poubelle' },
      { icone: 'shovel', libelle: 'Pinces de ramassage', recu: 12, objectif: 40, precision: 'neuves ou bon état', singulier: 'pince de ramassage' },
    ],
    point_collecte: 'Maison des jeunes, Mahdia',
    horaires: 'Mer. – sam., 10 h – 18 h',
    evenement: 1,
  },
  5: {
    items: [
      { icone: 'gamepad-2', libelle: 'Jeux de société', recu: 9, objectif: 25, precision: 'complets, en arabe ou français', singulier: 'jeu de société' },
      { icone: 'package', libelle: 'Couvertures', recu: 14, objectif: 40, precision: 'propres, chaudes', singulier: 'couverture' },
      { icone: 'coffee', libelle: 'Paquets de thé', recu: 30, objectif: 60, precision: 'non entamés', singulier: 'paquet de thé' },
    ],
    point_collecte: 'Maison des aînés, Sousse',
    horaires: 'Tous les jours, 9 h – 17 h',
    evenement: 5,
  },
  6: {
    items: [
      { icone: 'activity', libelle: 'Tensiomètres', recu: 2, objectif: 6, precision: 'neufs uniquement', singulier: 'tensiomètre' },
      { icone: 'droplets', libelle: 'Boîtes de bandelettes glycémie', recu: 18, objectif: 60, precision: 'date limite > 6 mois', singulier: 'boîte de bandelettes' },
      { icone: 'package-check', libelle: 'Kits de premiers secours', recu: 7, objectif: 20, precision: 'complets et scellés', singulier: 'kit de premiers secours' },
    ],
    point_collecte: 'Croissant-Rouge, Siliana',
    horaires: 'Lun. – ven., 9 h – 15 h',
    evenement: 5,
  },
  7: {
    items: [
      { icone: 'shovel', libelle: 'Outils de jardin', recu: 11, objectif: 30, precision: 'bêches, râteaux, binettes', singulier: 'outil de jardin' },
      { icone: 'sprout', libelle: 'Sachets de graines', recu: 40, objectif: 100, precision: 'potagères de saison', singulier: 'sachet de graines' },
      { icone: 'droplets', libelle: 'Arrosoirs', recu: 5, objectif: 20, precision: '10 L de préférence', singulier: 'arrosoir' },
    ],
    point_collecte: 'Jardin Ennasr, Ariana',
    horaires: 'Sam. et dim., 9 h – 13 h',
    evenement: 4,
  },
  8: {
    items: [
      { icone: 'book-open', libelle: 'Livres jeunesse', recu: 640, objectif: 800, precision: 'arabe ou français, bon état', singulier: 'livre jeunesse' },
      { icone: 'armchair', libelle: 'Coussins de lecture', recu: 22, objectif: 40, precision: 'housse lavable', singulier: 'coussin de lecture' },
      { icone: 'sofa', libelle: 'Étagères', recu: 4, objectif: 10, precision: 'bois, solides', singulier: 'étagère' },
    ],
    point_collecte: 'Lire et Grandir, Kairouan',
    horaires: 'Mar. – sam., 10 h – 17 h',
    evenement: 3,
  },
};

/** Onglets du détail (UI). La maquette affiche le même contenu pour toutes les campagnes. */
export const DETAILS = {
  avancement: [
    { titre: 'Campagne lancée', info: '1 nov. · objectif {objectif}' },
    { titre: '50 % atteint, commande des 60 premiers cartables', info: '12 nov. · facture publiée' },
    { titre: '32 cartables distribués à l’école El Habib', info: 'Il y a 20 min · 4 photos' },
    { titre: 'Distribution finale', info: '28 nov. · ouvert aux bénévoles', futur: true },
  ],
  nouvelles: [
    { titre: '32 cartables distribués !', date: 'il y a 20 min' },
    { titre: 'Commande des 60 premiers cartables', date: '12 nov.' },
    { titre: 'Merci pour les 100 premiers donateurs', date: '8 nov.' },
    { titre: 'Lancement de la campagne', date: '1 nov.' },
  ],
  fonds: [
    { libelle: 'Cartables & fournitures', part: 72, couleur: '#4f7f42' },
    { libelle: 'Livres offerts', part: 18, couleur: '#c98a3a' },
    { libelle: 'Transport & logistique', part: 10, couleur: '#1f3a6b' },
  ],
  justificatif: 'facture_novembre.pdf',
  galerie: ['/media/covers/solidarite.webp', '/media/covers/urgence.webp'],
  photos_supplementaires: 12,
  impact: { 20: '= 1 trousse complète', 50: '= 1 cartable complet pour un enfant', 100: '= 2 cartables complets' },
};

/* ---------------- espace organisateur ---------------- */

/**
 * Campagnes de l'organisatrice connectée (Marwa).
 * `etat` (UI) : live | review | draft | done — le back n'a pas encore d'état « en revue ».
 */
export const MES_CAMPAGNES = [
  { id: 1, etat: 'live' },
  { id: 9, titre: 'Kits d’hiver pour Sfax', categorie: 'Solidarité', image: '/media/covers/solidarite.webp', montant_collecte: '0.000', objectif_montant: '9000.000', statut: 'brouillon', etat: 'review' },
  { id: 10, titre: 'Rentrée solidaire 2027', categorie: 'Éducation', image: '', montant_collecte: '0.000', objectif_montant: '15000.000', statut: 'brouillon', etat: 'draft', progression: 80, manque: 'photo de couverture' },
  { id: 11, titre: 'Couffins du Ramadan 2026', categorie: 'Alimentaire', image: '/media/covers/alimentaire.webp', montant_collecte: '6200.000', objectif_montant: '6000.000', statut: 'cloturee', etat: 'done' },
];

export const ORG_DASHBOARD = {
  a_faire: [
    { icone: 'users', fond: '#fff3dc', bord: '#f3dfb2', texte: '#7a5408', valeur: '4', libelle: 'demandes à valider', to: '/organisateur/demandes' },
    { icone: 'smartphone', fond: '#ffede7', bord: '#f6d4c8', texte: '#9b3420', valeur: '2', libelle: 'dons D17 à vérifier', to: '/organisateur/dons' },
    { icone: 'package', fond: '#e6edf8', bord: '#cfdbef', texte: '#1f3a6b', valeur: '3', libelle: 'dépôts de matériel attendus', to: '/organisateur/dons?type=materiel' },
    { icone: 'clock-3', fond: '#e5f1e1', bord: '#cfe3c9', texte: '#2f5426', valeur: '9 j', libelle: 'avant la fin de « Cartable »', to: '/organisateur/campagnes' },
  ],
  kpis: [
    { icone: 'wallet', libelle: 'Collecté ce mois', valeur: 14230, unite: 'TND', tendance: '↑ 18 % vs octobre' },
    { icone: 'users', libelle: 'Bénévoles actifs', valeur: 126, unite: '', tendance: '↑ 9 nouveaux' },
    { icone: 'heart', libelle: 'Donateurs uniques', valeur: 311, unite: '', tendance: '↑ 24 %' },
    { icone: 'package', libelle: 'Articles reçus', valeur: 195, unite: '', tendance: 'cartables, trousses, cahiers' },
  ],
  graphique: { valeurs: [1.1, 1.6, 1.4, 2.1, 1.8, 2.5, 2.7, 3.4], semaines: ['S40', 'S41', 'S42', 'S43', 'S44', 'S45', 'S46', 'S47'], max: 3.6, badge: '+3 400 TND cette semaine' },
};

/* ---------------- revue admin ---------------- */

/** Campagnes en attente de relecture. `controles` (UI) : [photo, objectif, organisateur, fonds] */
export const CAMPAGNES_EN_REVUE = [
  { id: 9, titre: 'Kits d’hiver pour Sfax', organisation: 'Main dans la Main', categorie: 'Solidarité', image: '/media/covers/solidarite.webp', objectif_montant: '9000.000', montant_collecte: '0.000', ville: 'Sfax', jours_restants: 45, envoyee: 'il y a 1 j', controles: [true, true, true, false] },
  { id: 12, titre: 'Des lunettes pour mieux apprendre', organisation: 'Main dans la Main', categorie: 'Santé', image: '/media/covers/sante.webp', objectif_montant: '5000.000', montant_collecte: '0.000', ville: 'Sfax', jours_restants: 45, envoyee: 'il y a 2 j', controles: [true, true, false, true] },
];

export const POINTS_DE_CONTROLE = [
  'Photo conforme (pas de visage d’enfant)',
  'Objectif et durée réalistes',
  'Organisateur vérifié',
  'Utilisation des fonds expliquée',
];
