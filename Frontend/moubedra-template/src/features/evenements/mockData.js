/**
 * Données fictives — événements et participations.
 * Événement : EvenementSerializer (backend/api/serializers/evenement.py)
 *   id, organisateur, organisateur_nom, campagne, titre, description, date_evenement, lieu, ville, capacite, statut
 * Participation : DemandeParticipationEvenementSerializer
 *   id, utilisateur, evenement, date_demande, type, motif, statut, code_qr
 * Champs « UI » : absents du serializer aujourd'hui.
 */

export const EVENEMENTS = [
  {
    id: 1,
    organisateur: 6,
    organisateur_nom: 'Collectif Vert Mahdia',
    campagne: 4,
    titre: 'Nettoyons la plage de la Corniche',
    description: 'Ramassage, tri et pesée des déchets sur la plage de la Corniche.',
    date_evenement: '2026-12-05T08:30:00+01:00',
    heure_fin: '12:00', // UI
    lieu: 'Plage de la Corniche, Mahdia',
    ville: 'Mahdia',
    capacite: 40,
    statut: 'planifie',
    nb_participants: 21, // UI (nombre de demandes acceptées)
    image: '/media/covers/environnement.webp', // UI
    image_position: '62% 70%', // UI
    urgent: false, // UI
  },
  {
    id: 2,
    organisateur: 11,
    organisateur_nom: 'Croissant-Rouge Jendouba',
    campagne: 3,
    titre: 'Distribution de couvertures',
    description: 'Distribution de couvertures et de kits d’hygiène aux familles relogées.',
    date_evenement: '2026-11-25T14:00:00+01:00',
    heure_fin: '18:00',
    lieu: 'École Ibn Khaldoun, Jendouba',
    ville: 'Jendouba',
    capacite: 15,
    statut: 'planifie',
    nb_participants: 9,
    image: '/media/covers/urgence.webp',
    image_position: '50% 50%',
    urgent: true,
  },
  {
    id: 3,
    organisateur: 2,
    organisateur_nom: 'Main dans la Main',
    campagne: 1,
    titre: 'Un cartable, mille sourires',
    description: 'Distribution des cartables aux élèves de l’école El Habib.',
    date_evenement: '2026-11-28T10:00:00+01:00',
    heure_fin: '13:00',
    lieu: 'École El Habib, Sfax',
    ville: 'Sfax',
    capacite: 40,
    statut: 'planifie',
    nb_participants: 22,
    image: '/media/covers/education.webp',
    image_position: '30% 55%',
    urgent: false,
  },
  {
    id: 4,
    organisateur: 14,
    organisateur_nom: 'Les Racines Vertes',
    campagne: 7,
    titre: 'Plantation au jardin de quartier',
    description: 'Préparation des parcelles et plantation des premiers semis.',
    date_evenement: '2026-12-11T09:30:00+01:00',
    heure_fin: '12:30',
    lieu: 'Jardin Ennasr, Ariana',
    ville: 'Ariana',
    capacite: 40,
    statut: 'planifie',
    nb_participants: 19,
    image: '/media/covers/environnement.webp',
    image_position: '30% 80%',
    urgent: false,
  },
  {
    id: 5,
    organisateur: 12,
    organisateur_nom: 'Association Ennour',
    campagne: 5,
    titre: 'Après-midi jeux avec les aînés',
    description: 'Jeux de société, thé et musique à la maison des aînés.',
    date_evenement: '2026-12-13T15:00:00+01:00',
    heure_fin: '18:00',
    lieu: 'Maison des aînés, Sousse',
    ville: 'Sousse',
    capacite: 12,
    statut: 'planifie',
    nb_participants: 8,
    image: '/media/covers/solidarite.webp',
    image_position: '50% 55%',
    urgent: false,
  },
  {
    id: 6,
    organisateur: 12,
    organisateur_nom: 'Association Ennour',
    campagne: 5,
    titre: 'Après-midi jeux avec les aînés',
    description: 'Édition d’octobre.',
    date_evenement: '2026-10-18T15:00:00+01:00',
    heure_fin: '18:00',
    lieu: 'Maison des aînés, Sousse',
    ville: 'Sousse',
    capacite: 12,
    statut: 'termine',
    nb_participants: 12,
    image: '/media/covers/solidarite.webp',
    image_position: '50% 55%',
    urgent: false,
  },
];

/** Programme et « à prévoir » du détail (UI : pas de modèle côté back). */
export const PROGRAMME = [
  { heure: '08:30', texte: 'Accueil, café et distribution des gants' },
  { heure: '09:00', texte: 'Ramassage par équipes de 5' },
  { heure: '11:00', texte: 'Tri et pesée des déchets' },
  { heure: '12:00', texte: 'Photo de groupe et goûter' },
];
export const A_PREVOIR = ['Chapeau et crème solaire', 'Gourde', 'Chaussures fermées', 'Bonne humeur 🙂'];

/** Participations de l'utilisateur connecté (Nour, id 1). */
export const MES_PARTICIPATIONS = [
  { id: 1, utilisateur: 1, evenement: 1, date_demande: '2026-11-20T10:00:00+01:00', type: 'benevole', motif: '', statut: 'acceptee', code_qr: '6f1c2a9e-7d3b-4f0a-9c1e-2b5d8a7f3e10' },
  { id: 2, utilisateur: 1, evenement: 3, date_demande: '2026-11-18T10:00:00+01:00', type: 'benevole', motif: 'Je peux venir avec 2 amis', statut: 'acceptee', code_qr: '0b9d4e3a-1c2f-4a5b-8e7d-6c5b4a3f2e1d' },
  { id: 3, utilisateur: 1, evenement: 4, date_demande: '2026-11-22T10:00:00+01:00', type: 'benevole', motif: '', statut: 'en_attente', code_qr: '9a8b7c6d-5e4f-4a3b-9c2d-1e0f9a8b7c6d' },
  { id: 4, utilisateur: 1, evenement: 6, date_demande: '2026-10-10T10:00:00+01:00', type: 'benevole', motif: '', statut: 'acceptee', code_qr: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d' },
  { id: 5, utilisateur: 1, evenement: 2, date_demande: '2026-11-19T10:00:00+01:00', type: 'benevole', motif: '', statut: 'refusee', code_qr: '5d4c3b2a-1f0e-4d9c-8b7a-6f5e4d3c2b1a', raison: 'complet' },
];

/** Demandes reçues par l'organisatrice pour « Un cartable, mille sourires » (id 3). */
export const DEMANDES_RECUES = [
  { id: 21, utilisateur: 1, utilisateur_nom: 'Nour Saada', couleur: '#d9472b', evenement: 3, date_demande: 'il y a 1 h', statut: 'en_attente', motif: '« Je peux venir avec 2 amis »', experience: '1ʳᵉ participation' },
  { id: 22, utilisateur: 4, utilisateur_nom: 'Yasmine Ayari', couleur: '#1f3a6b', evenement: 3, date_demande: 'il y a 2 h', statut: 'en_attente', motif: '« Disponible toute la matinée »', experience: '3 actions' },
  { id: 23, utilisateur: 9, utilisateur_nom: 'Amine Ben Ali', couleur: '#c98a3a', evenement: 3, date_demande: 'il y a 3 h', statut: 'en_attente', motif: '', experience: '1 action' },
  { id: 24, utilisateur: 8, utilisateur_nom: 'Sana Kefi', couleur: '#6b4f9a', evenement: 3, date_demande: 'il y a 4 h', statut: 'en_attente', motif: '« Je peux aider au tri »', experience: '5 actions' },
];

/** Événements gérés par l'organisatrice + journal du mode jour J. */
export const MES_EVENEMENTS = [3, 1];
export const EN_ATTENTE_PAR_EVENEMENT = { 3: 4, 1: 0 };
export const SCANS_INITIAUX = [{ nom: 'Yasmine Ayari', detail: 'Bénévole · arrivée 09:58' }];
export const SCANS_SIMULES = [
  { nom: 'Amine Ben Ali', detail: 'Bénévole' },
  { nom: 'Nour Saada', detail: 'Dépôt : 1 cartable, 1 trousse' },
  { nom: 'Sana Kefi', detail: 'Bénévole' },
];
