/**
 * Données fictives — utilisateurs, compte, demandes organisateur.
 * Utilisateur : UtilisateurSerializer (backend/api/serializers/utilisateur.py)
 * Demande : DemandeOrganisateurSerializer
 *   id, utilisateur, motif, date_demande, statut ('en_attente'|'acceptee'|'refusee'), date_traitement, traite_par
 * Champs « UI » : couleur, activite, nom_structure, verifications…
 */

/** Liste admin. statut : 'actif' | 'bloque' | 'inactif' (affiché « À vérifier »). */
export const UTILISATEURS = [
  { id: 1, nom_complet: 'Nour Saada', email: 'nour.saada@example.tn', role: 'citoyen', ville: 'Tunis', date_inscription: '2026-09-12T10:00:00+01:00', statut: 'actif', couleur: '#d9472b', activite: '3 dons · 2 actions' },
  { id: 2, nom_complet: 'Marwa Ltifi', email: 'marwa@mainmain.tn', role: 'organisateur', ville: 'Sfax', date_inscription: '2026-05-03T10:00:00+01:00', statut: 'actif', couleur: '#4f7f42', activite: '4 campagnes' },
  { id: 4, nom_complet: 'Yasmine Ayari', email: 'yasmine.ayari@example.tn', role: 'citoyen', ville: 'Tunis', date_inscription: '2026-06-21T10:00:00+01:00', statut: 'actif', couleur: '#1f3a6b', activite: '1 don · 3 actions' },
  { id: 5, nom_complet: 'Youssef B.', email: 'youssef.b@example.tn', role: 'citoyen', ville: 'Ariana', date_inscription: '2026-10-02T10:00:00+01:00', statut: 'bloque', couleur: '#c98a3a', activite: '3 signalements reçus' },
  { id: 6, nom_complet: 'Collectif Vert Mahdia', email: 'bonjour@vertmahdia.tn', role: 'organisateur', ville: 'Mahdia', date_inscription: '2026-04-14T10:00:00+01:00', statut: 'actif', couleur: '#2f6f86', activite: '2 campagnes' },
  { id: 7, nom_complet: 'don_rapide_tn', email: 'contact@donrapide.biz', role: 'citoyen', ville: '—', date_inscription: '2026-11-20T10:00:00+01:00', statut: 'inactif', couleur: '#888888', activite: '1 signalement' },
];

export const RESUME_UTILISATEURS = { total: 1284, nouveaux_semaine: 12 };

/** Demandes organisateur en attente. verifications : [e-mail vérifié, pas de doublon, justificatif] */
export const DEMANDES_ORGANISATEUR = [
  { id: 1, utilisateur: 16, utilisateur_nom: 'Karim Trabelsi', couleur: '#2f6f86', nom_structure: 'Association Sabil Ettadhamon', ville: 'Tozeur', motif: 'Distribution de repas pendant le Ramadan et soutien scolaire depuis 2018, 35 bénévoles réguliers.', date_demande: 'il y a 1 j', statut: 'en_attente', verifications: [true, true, false] },
  { id: 2, utilisateur: 17, utilisateur_nom: 'Hela Ben Salem', couleur: '#6b4f9a', nom_structure: 'Club Environnement Bizerte', ville: 'Bizerte', motif: 'Nettoyage des plages et ateliers de recyclage dans 6 écoles. Récépissé de 2021 joint.', date_demande: 'il y a 2 j', statut: 'en_attente', verifications: [true, true, true] },
  { id: 3, utilisateur: 18, utilisateur_nom: 'Mehdi Zouari', couleur: '#c98a3a', nom_structure: '', ville: 'Sfax', motif: 'Je veux aider les gens de mon quartier.', date_demande: 'il y a 3 j', statut: 'en_attente', verifications: [true, false, false] },
];

export const VERIFICATIONS = ['Adresse e-mail vérifiée', 'Aucun doublon de structure', 'Justificatif (récépissé / JORT) fourni'];

/** Tableau de bord citoyen (UI : agrégats). */
export const TABLEAU_DE_BORD = {
  impact: [
    { valeur: '170', libelle: 'TND donnés', compteur: true },
    { valeur: '2', libelle: 'actions bénévoles', compteur: true },
    { valeur: '≈ 3', libelle: 'enfants équipés' },
    { valeur: '6 h', libelle: 'de bénévolat' },
  ],
  nb_causes: 3,
  prochain_rdv: { evenement: 1 },
  activite: [
    { icone: 'check', fond: '#e5f1e1', couleur: '#3d6d31', titre: 'Participation acceptée', info: 'Nettoyons la plage · il y a 20 min', badge: { ton: 'ok', texte: 'Acceptée' } },
    { icone: 'heart', fond: '#ffede7', couleur: '#d9472b', titre: 'Don de 50 TND confirmé', info: 'Un cartable pour chaque rêve · reçu disponible', action: 'recu' },
    { icone: 'clock-3', fond: '#fff3dc', couleur: '#9a6a0b', titre: 'Don D17 en attente', info: 'Un jardin partagé · 20 TND', badge: { ton: 'wait', texte: 'En attente' } },
    { icone: 'message-circle', fond: '#e6edf8', couleur: '#1f3a6b', titre: 'Marwa a répondu à votre commentaire', info: 'Le fil · il y a 3 h' },
  ],
  suivies: [1, 2],
  pour_vous: [3, 5, 7, 6],
};

/** Préférences du compte (UI : pas de champ côté back). */
export const PREFERENCES = {
  notifications: [
    { cle: 'reponses', libelle: 'Réponses à mes demandes', actif: true },
    { cle: 'nouvelles', libelle: 'Nouvelles des campagnes suivies', actif: true },
    { cle: 'urgences', libelle: 'Appels urgents dans ma ville', actif: true },
    { cle: 'lettre', libelle: 'Lettre mensuelle', actif: false },
  ],
  confidentialite: [
    { cle: 'nom_dons', libelle: 'Afficher mon nom sur les dons', actif: false },
    { cle: 'profil_fil', libelle: 'Profil visible dans le fil', actif: true },
  ],
};
