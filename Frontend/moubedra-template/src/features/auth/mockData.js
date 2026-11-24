/**
 * Comptes de démonstration (VITE_DEMO=true).
 * Forme : UtilisateurSerializer (backend/api/serializers/utilisateur.py)
 * + champs UI : `couleur` (pastille d'avatar), `sous_titre` (ligne sous le nom).
 */
export const DEMO_USERS = {
  citoyen: {
    id: 1,
    email: 'nour.saada@example.tn',
    first_name: 'Nour',
    last_name: 'Saada',
    prenom: 'Nour',
    nom: 'Saada',
    nom_complet: 'Nour Saada',
    telephone: '+216 22 123 456',
    ville: 'Tunis',
    adresse: '12 rue de Marseille, Tunis',
    date_naissance: '1998-04-12',
    date_inscription: '2026-09-12T10:00:00+01:00',
    statut: 'actif',
    role: 'citoyen',
    nom_organisation: '',
    date_validation: null,
    couleur: '#d9472b', // UI
    sous_titre: 'Citoyenne · Tunis', // UI
  },
  organisateur: {
    id: 2,
    email: 'marwa@mainmain.tn',
    first_name: 'Marwa',
    last_name: 'Ltifi',
    prenom: 'Marwa',
    nom: 'Ltifi',
    nom_complet: 'Marwa Ltifi',
    telephone: '+216 98 456 210',
    ville: 'Sfax',
    adresse: '14 rue Habib Thameur, Sfax',
    date_naissance: '1990-02-03',
    date_inscription: '2026-05-03T10:00:00+01:00',
    statut: 'actif',
    role: 'organisateur',
    nom_organisation: 'Main dans la Main',
    date_validation: '2026-05-05',
    couleur: '#4f7f42',
    sous_titre: 'Main dans la Main · Sfax',
  },
  admin: {
    id: 3,
    email: 'admin@moubedra.tn',
    first_name: 'Admin',
    last_name: 'moubedra',
    prenom: 'Admin',
    nom: 'moubedra',
    nom_complet: 'Admin moubedra',
    telephone: '',
    ville: 'Tunis',
    adresse: '',
    date_naissance: null,
    date_inscription: '2026-01-10T10:00:00+01:00',
    statut: 'actif',
    role: 'admin',
    nom_organisation: '',
    date_validation: null,
    couleur: '#1f3a6b',
    sous_titre: 'Équipe de modération',
  },
};

/** Les 24 gouvernorats tunisiens. */
export const GOUVERNORATS = [
  'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa', 'Jendouba', 'Kairouan', 'Kasserine', 'Kébili', 'Le Kef', 'Mahdia',
  'La Manouba', 'Médenine', 'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan',
];

/** Message « près de chez vous » affiché à l'inscription selon le gouvernorat. */
export const PRES_DE_CHEZ_VOUS = {
  Tunis: '3 campagnes actives et 2 événements ce mois-ci à Tunis',
  Sfax: '« Un cartable pour chaque rêve » et 1 événement samedi à Sfax',
  Mahdia: 'Nettoyage de la plage de la Corniche, samedi 5 déc.',
  Jendouba: 'Appel urgent : inondations, 6 bénévoles recherchés',
};

/** E-mail déjà utilisé (pour montrer l'erreur « compte existant » en démo). */
export const EMAIL_EXISTANT = 'nour.saada@example.tn';
