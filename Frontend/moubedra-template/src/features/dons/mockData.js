/**
 * Données fictives — dons.
 * Don en argent : DonSerializer (backend/api/serializers/don.py)
 *   id, donateur, campagne, montant ("50.000"), date_don, mode_paiement ('carte'|'d17'|'virement'|'especes'),
 *   statut ('en_attente'|'confirme'|'refuse'|'rembourse'), reference_paiement
 * Don matériel : pas de modèle côté back (UI uniquement).
 */

export const MODES_PAIEMENT = {
  carte: 'Carte bancaire',
  d17: 'D17',
  virement: 'Virement',
  especes: 'Espèces',
};

/** Dons de l'utilisateur connecté (Nour). */
export const MES_DONS = [
  { id: 1, donateur: 1, campagne: 1, montant: '50.000', date_don: '2026-11-21T18:20:00+01:00', mode_paiement: 'carte', statut: 'confirme', reference_paiement: 'MBD-2111-4821', recurrent: false },
  { id: 2, donateur: 1, campagne: 3, montant: '100.000', date_don: '2026-11-18T09:10:00+01:00', mode_paiement: 'carte', statut: 'confirme', reference_paiement: 'MBD-1811-3310', recurrent: false },
  { id: 3, donateur: 1, campagne: 7, montant: '20.000', date_don: '2026-11-22T12:00:00+01:00', mode_paiement: 'd17', statut: 'en_attente', reference_paiement: '', recurrent: false },
];

export const RESUME_MES_DONS = { total_annee: 170, nb_dons: 3, nb_campagnes: 3, nb_recus: 2 };

/** Derniers donateurs d'une campagne (onglet « Donateurs »). UI : nom/initiales/couleur. */
export const DONATEURS_CAMPAGNE = [
  { id: 31, donateur_nom: 'Sana K.', initiales: 'SK', couleur: '#c98a3a', montant: '100.000', quand: 'il y a 2 h' },
  { id: 32, donateur_nom: 'Anonyme', initiales: 'AN', couleur: '#1f3a6b', montant: '50.000', quand: 'hier' },
  { id: 33, donateur_nom: 'Youssef B.', initiales: 'YB', couleur: '#4f7f42', montant: '20.000', quand: 'hier' },
  { id: 34, donateur_nom: 'Rim M.', initiales: 'RM', couleur: '#d9472b', montant: '50.000', quand: 'lun.' },
];

/** Dons reçus par l'organisatrice. */
export const DONS_RECUS = [
  { id: 41, donateur_nom: 'Sana K.', campagne: 1, campagne_titre: 'Un cartable pour chaque rêve', montant: '100.000', mode_paiement: 'carte', statut: 'confirme' },
  { id: 42, donateur_nom: 'Anonyme', campagne: 1, campagne_titre: 'Un cartable pour chaque rêve', montant: '50.000', mode_paiement: 'carte', statut: 'confirme' },
  { id: 43, donateur_nom: 'Nour S.', campagne: 1, campagne_titre: 'Un cartable pour chaque rêve', montant: '20.000', mode_paiement: 'd17', statut: 'en_attente' },
  { id: 44, donateur_nom: 'Rim M.', campagne: 1, campagne_titre: 'Un cartable pour chaque rêve', montant: '35.000', mode_paiement: 'd17', statut: 'en_attente' },
  { id: 45, donateur_nom: 'Youssef B.', campagne: 1, campagne_titre: 'Un cartable pour chaque rêve', montant: '200.000', mode_paiement: 'virement', statut: 'confirme' },
];

export const RESUME_DONS_RECUS = { collecte: 14230, d17_a_verifier: 2, articles_recus: 195, depots_attendus: 3 };

/**
 * Dons matériels de l'utilisateur (UI).
 * quantites[k] = quantité de l'article k des besoins de la campagne ; etape : 0 promis, 1 déposé, 2 réceptionné, 3 remis.
 */
export const MES_DONS_MATERIELS = [{ id: 51, campagne: 1, quantites: [1, 1, 0], remise: 'point', etape: 1, code: 'MAT-SFX-0482' }];

/** Dépôts attendus par l'organisatrice (UI). */
export const DEPOTS_ATTENDUS = [
  { id: 61, donateur_nom: 'Nour S.', articles: '1 cartable, 1 trousse', quand: 'Sam. 28 nov.', code: 'MAT-SFX-0482' },
  { id: 62, donateur_nom: 'Karim T.', articles: '5 lots de cahiers', quand: 'Ven. 27 nov.', code: 'MAT-SFX-0479' },
  { id: 63, donateur_nom: 'Amel H.', articles: '2 cartables', quand: 'À l’événement', code: 'MAT-SFX-0477' },
];

/** Créneaux de dépôt proposés au point de collecte (UI). */
export const CRENEAUX = ['Jeu. 26 nov.', 'Ven. 27 nov.', 'Sam. 28 nov.', 'Lun. 30 nov.'];
