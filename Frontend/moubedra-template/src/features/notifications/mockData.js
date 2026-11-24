/**
 * Données fictives — notifications.
 * Il n'existe pas encore de modèle Notification côté back : forme proposée
 *   { id, icone, fond, couleur, titre, message, date, lu, lien }
 */
import { ago } from '../../lib/mock';

export const NOTIFICATIONS = [
  { id: 1, icone: 'check', fond: '#e5f1e1', couleur: '#3d6d31', titre: 'Participation acceptée', message: 'Le Collectif Vert Mahdia a accepté votre demande pour samedi. Votre QR code est prêt.', date: ago({ min: 20 }), lu: false, lien: '/evenements/1' },
  { id: 2, icone: 'message-circle', fond: '#e6edf8', couleur: '#1f3a6b', titre: 'Marwa a répondu à votre commentaire', message: '« Merci Nour, à samedi ! »', date: ago({ h: 3 }), lu: false, lien: '/communaute' },
  { id: 3, icone: 'siren', fond: '#fde8e4', couleur: '#b8371f', titre: 'Appel urgent près de chez vous', message: 'Inondations à Jendouba : 6 bénévoles recherchés.', date: ago({ h: 5 }), lu: false, lien: '/campagnes/3' },
  { id: 4, icone: 'heart', fond: '#ffede7', couleur: '#d9472b', titre: 'Votre don a été confirmé', message: '50 TND pour « Un cartable pour chaque rêve ». Reçu disponible.', date: ago({ d: 2 }), lu: true, lien: '/espace/dons' },
  { id: 5, icone: 'trending-up', fond: '#e5f1e1', couleur: '#3d6d31', titre: 'La campagne que vous suivez a passé 65 %', message: 'Des repas chauds, des cœurs légers', date: ago({ d: 3 }), lu: true, lien: '/campagnes/2' },
];

/** Nombre de non lues affiché dans la cloche et la barre latérale, par rôle. */
export const NON_LUES_PAR_ROLE = { citoyen: 3, organisateur: 2, admin: 0 };
