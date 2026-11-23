/**
 * Données fictives — vue d'ensemble admin (agrégats, pas de modèle dédié côté back).
 */
export const VUE_ENSEMBLE = {
  a_faire: [
    { icone: 'user-check', fond: '#fff3dc', bord: '#f3dfb2', texte: '#7a5408', valeur: '3', libelle: 'demandes organisateur', to: '/admin/organisateurs' },
    { icone: 'megaphone', fond: '#e6edf8', bord: '#cfdbef', texte: '#1f3a6b', valeur: '2', libelle: 'campagnes à relire', to: '/admin/campagnes' },
    { icone: 'shield-check', fond: '#ffede7', bord: '#f6d4c8', texte: '#9b3420', valeur: '3', libelle: 'contenus signalés par l’IA', to: '/admin/moderation' },
    { icone: 'flag', fond: '#fde8e4', bord: '#f3c9bd', texte: '#b8371f', valeur: '4', libelle: 'signalements · 2 urgents', to: '/admin/signalements' },
  ],
  kpis: [
    { icone: 'users', libelle: 'Utilisateurs', valeur: 1284, tendance: '↑ 12 cette semaine' },
    { icone: 'megaphone', libelle: 'Campagnes actives', valeur: 8, tendance: '2 en revue' },
    { icone: 'wallet', libelle: 'Dons ce mois (TND)', valeur: 42680, tendance: '↑ 21 %' },
    { icone: 'package', libelle: 'Articles donnés', valeur: 1214, tendance: 'ce mois-ci' },
  ],
  graphique: { valeurs: [18, 22, 21, 27, 25, 31, 34, 41], semaines: ['S40', 'S41', 'S42', 'S43', 'S44', 'S45', 'S46', 'S47'], max: 44 },
  par_gouvernorat: [['Tunis', 38], ['Sfax', 22], ['Jendouba', 14], ['Sousse', 9], ['Mahdia', 7], ['Autres', 10]],
  journal: [
    { icone: 'shield-check', fond: '#e5f1e1', couleur: '#3d6d31', texte: 'Modération IA : 14 contenus analysés, 3 à revoir', quand: 'il y a 5 min' },
    { icone: 'badge-check', fond: '#e6edf8', couleur: '#1f3a6b', texte: 'Collectif Vert Mahdia vérifié par Salma (admin)', quand: 'il y a 2 h' },
    { icone: 'user-x', fond: '#fde8e4', couleur: '#b8371f', texte: 'Compte Youssef B. bloqué 7 jours (3 signalements)', quand: 'hier' },
    { icone: 'megaphone', fond: '#fff3dc', couleur: '#9a6a0b', texte: '« Kits d’hiver pour Sfax » envoyée en revue', quand: 'hier' },
  ],
};
