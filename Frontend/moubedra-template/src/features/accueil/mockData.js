/**
 * Données fictives — page d'accueil (contenus éditoriaux et compteurs).
 * Les cartes de campagnes et l'aperçu du fil viennent des features campagnes et publications.
 */

export const STATISTIQUES = [
  { valeur: 128, libelle: 'campagnes solidaires' },
  { valeur: 342680, libelle: 'TND de dons collectés' },
  { valeur: 8540, libelle: 'participants engagés' },
  { valeur: 24, libelle: 'gouvernorats couverts' },
];

/** Pouls du jour (popover du logo et colonne de l'écran de connexion). */
export const POULS = {
  dons: 37,
  montant: 1240,
  benevoles: 12,
  fil: [
    '💬 Sana a donné 50 TND à « Un cartable pour chaque rêve »',
    '🙌 Yacine a rejoint « Nettoyons la plage de Mahdia »',
    '💚 La campagne « Repas chauds » vient de passer 65 %',
    '✨ Nouvelle campagne à Kairouan : « Une bibliothèque au village »',
  ],
};

export const RECHERCHES_SUGGEREES = ['Une cause, une ville…', 'Éducation à Sfax', 'Repas solidaires Tunis', 'Nettoyage de plage Mahdia'];

export const DONATEURS_RECENTS = [['Sana', '50 TND'], ['Youssef', '20 TND'], ['Amel', '100 TND'], ['Karim', '30 TND'], ['Rim', '50 TND']];

export const BANDEAU = [
  ['Sana', '50 TND', 'Un cartable pour chaque rêve'],
  ['Yacine', 'bénévole', 'Plage de Mahdia'],
  ['Amel', '100 TND', 'Un toit sûr'],
  ['Karim', '30 TND', 'Repas chauds'],
  ['Rim', 'bénévole', 'Jardin partagé'],
  ['Hichem', '20 TND', 'Bibliothèque Kairouan'],
];

/** Carte « Urgence » du hero. */
export const CAMPAGNE_A_LA_UNE = { id: 3, titre: 'Un toit sûr après les pluies', ville: 'Jendouba', collecte: 13700, objectif: 18000, donateurs: 89, jours: 7 };

export const ENGAGES = { nombre: 8540, avatars: [['NS', '#d9472b'], ['YA', '#1f3a6b'], ['MB', '#4f7f42'], ['SK', '#c98a3a']] };
