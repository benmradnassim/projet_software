export const INITIAL_DATA = {
  users: [
    { id: 'u1', name: 'Sophie Martin', email: 'sophie.martin@example.com', role: 'Citoyen', status: 'Actif', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', joinedDate: '12/01/2024' },
    { id: 'u2', name: 'Association Vert Demain', email: 'contact@vertdemain.org', role: 'Organisateur', status: 'Actif', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', joinedDate: '05/11/2023' },
    { id: 'u3', name: 'Thomas Dubois', email: 'thomas.dubois@example.com', role: 'Citoyen', status: 'Actif', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', joinedDate: '20/02/2024' },
    { id: 'u4', name: 'Fondation Restos Solidaires', email: 'admin@restossolidaires.fr', role: 'Organisateur', status: 'Actif', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', joinedDate: '10/08/2023' },
    { id: 'u5', name: 'Camille Admin', email: 'admin@solidarite-ensemble.fr', role: 'Admin', status: 'Actif', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', joinedDate: '01/01/2023' },
    { id: 'u6', name: 'Marc Dufour', email: 'marc.d@example.com', role: 'Citoyen', status: 'Bloqué', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150', joinedDate: '04/03/2024' },
  ],
  campaigns: [
    {
      id: 'c1',
      title: 'Des repas chauds pour l’hiver',
      category: 'Humanitaire',
      goal: 15000,
      raised: 11250,
      image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800',
      startDate: '2024-11-01',
      endDate: '2024-12-31',
      location: 'Paris (75010)',
      organizerId: 'u4',
      organizerName: 'Fondation Restos Solidaires',
      organizerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      status: 'Active',
      description: 'Collecte de fonds pour financer la distribution quotidienne de 500 repas chauds et kits de hygiène aux personnes en situation de grande précarité durant la période hivernale.'
    },
    {
      id: 'c2',
      title: 'Reboisement de la forêt départementale',
      category: 'Écologie',
      goal: 8000,
      raised: 8400,
      image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
      startDate: '2024-10-15',
      endDate: '2024-12-15',
      location: 'Aix-en-Provence (13)',
      organizerId: 'u2',
      organizerName: 'Association Vert Demain',
      organizerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      status: 'Active',
      description: 'Plantation de 3 000 arbres d’espèces locales pour restaurer une zone dégradée par les incendies et sensibiliser les écoles aux enjeux de la biodiversité.'
    },
    {
      id: 'c3',
      title: 'Fournitures scolaires pour enfants défavorisés',
      category: 'Éducation',
      goal: 5000,
      raised: 3200,
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800',
      startDate: '2024-09-01',
      endDate: '2024-12-01',
      location: 'Lyon (69003)',
      organizerId: 'u2',
      organizerName: 'Association Vert Demain',
      organizerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      status: 'Active',
      description: 'Achat et distribution de cartables, livres et outils numériques pour 250 enfants scolarisés issus de familles à faibles revenus.'
    },
    {
      id: 'c4',
      title: 'Équipement d’un centre de soin mobile',
      category: 'Santé',
      goal: 25000,
      raised: 18900,
      image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800',
      startDate: '2024-08-01',
      endDate: '2024-12-20',
      location: 'Lille (59000)',
      organizerId: 'u4',
      organizerName: 'Fondation Restos Solidaires',
      organizerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      status: 'Active',
      description: 'Aménagement d’un camion médicalisé itinérant permettant d’apporter un suivi médical de premier recours et de la prévention dans les zones isolées.'
    },
    {
      id: 'c5',
      title: 'Un toit et un accompagnement pour les jeunes sans-abri',
      category: 'Social',
      goal: 12000,
      raised: 12000,
      image: 'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=800',
      startDate: '2024-06-01',
      endDate: '2024-10-31',
      location: 'Bordeaux (33000)',
      organizerId: 'u4',
      organizerName: 'Fondation Restos Solidaires',
      organizerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      status: 'Clôturée',
      description: 'Campagne visant à loger temporairement 20 jeunes en rupture familiale tout en leur proposant un parcours d insertion professionnelle personnalisé.'
    },
    {
      id: 'c6',
      title: 'Ateliers numériques pour seniors',
      category: 'Éducation',
      goal: 4000,
      raised: 1500,
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
      startDate: '2024-11-10',
      endDate: '2025-01-31',
      location: 'Nantes (44000)',
      organizerId: 'u2',
      organizerName: 'Association Vert Demain',
      organizerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      status: 'Active',
      description: 'Financement de tablettes adaptées et organisation de sessions hebdomadaires de formation à l utilisation des outils en ligne et démarches administratives.'
    },
    {
      id: 'c7',
      title: 'Nettoyage des berges de la Loire',
      category: 'Écologie',
      goal: 3000,
      raised: 2800,
      image: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800',
      startDate: '2024-10-01',
      endDate: '2024-11-25',
      location: 'Tours (37000)',
      organizerId: 'u2',
      organizerName: 'Association Vert Demain',
      organizerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      status: 'Active',
      description: 'Achat de matériel de ramassage de déchets, gants et contenants recyclables pour de grandes journées citoyennes d éco-nettoyage.'
    },
    {
      id: 'c8',
      title: 'Soutien aux refuges animaliers régionaux',
      category: 'Humanitaire',
      goal: 6000,
      raised: 900,
      image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800',
      startDate: '2024-11-15',
      endDate: '2025-02-15',
      location: 'Toulouse (31000)',
      organizerId: 'u4',
      organizerName: 'Fondation Restos Solidaires',
      organizerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      status: 'Active',
      description: 'Financement de nourriture, soins vétérinaires d urgence et travaux de rénovation de box pour héberger dignement les animaux abandonnés.'
    }
  ],
  events: [
    {
      id: 'e1',
      title: 'Grande Maraude Solidaire du Samedi',
      date: '2024-11-30T19:00',
      location: 'Place de la République, Paris',
      campaignId: 'c1',
      campaignTitle: 'Des repas chauds pour l’hiver',
      capacity: 30,
      registeredCount: 18,
      organizerId: 'u4',
      description: 'Rejoignez-nous pour la préparation des soupes thermos et la distribution dans le 10ème et 11ème arrondissements.'
    },
    {
      id: 'e2',
      title: 'Journée de Plantation d’Arbres',
      date: '2024-12-07T09:30',
      location: 'Forêt Sainte-Victoire, Aix-en-Provence',
      campaignId: 'c2',
      campaignTitle: 'Reboisement de la forêt départementale',
      capacity: 50,
      registeredCount: 42,
      organizerId: 'u2',
      description: 'Mise en terre de baliveaux. Matériel fourni. Prévoir des bottes et des vêtements chauds. Repas convivial offert à midi.'
    },
    {
      id: 'e3',
      title: 'Collecte de fournitures en supermarché',
      date: '2024-11-23T10:00',
      location: 'Centre Commercial Part-Dieu, Lyon',
      campaignId: 'c3',
      campaignTitle: 'Fournitures scolaires pour enfants défavorisés',
      capacity: 15,
      registeredCount: 12,
      organizerId: 'u2',
      description: 'Animation du stand de collecte et sensibilisation des clients venus effectuer leurs achats.'
    },
    {
      id: 'e4',
      title: 'Inauguration du Camion Santé',
      date: '2024-12-12T14:00',
      location: 'Grand Place, Lille',
      campaignId: 'c4',
      campaignTitle: 'Équipement d’un centre de soin mobile',
      capacity: 100,
      registeredCount: 65,
      organizerId: 'u4',
      description: 'Présentation officielle du véhicule réaménagé, démonstration des équipements et verre de l amitié.'
    },
    {
      id: 'e5',
      title: 'Grand Nettoyage d Automne des Bords de Loire',
      date: '2024-11-24T14:00',
      location: 'Quai de la Loire, Tours',
      campaignId: 'c7',
      campaignTitle: 'Nettoyage des berges de la Loire',
      capacity: 40,
      registeredCount: 39,
      organizerId: 'u2',
      description: 'Distribution des sacs et pesée finale des déchets ramassés. Sensibilisation au tri sélectif.'
    },
    {
      id: 'e6',
      title: 'Atelier d initiation à l informatique',
      date: '2024-12-02T15:00',
      location: 'Maison des Associations, Nantes',
      campaignId: 'c6',
      campaignTitle: 'Ateliers numériques pour seniors',
      capacity: 10,
      registeredCount: 8,
      organizerId: 'u2',
      description: 'Accompagnement individuel (1 bénévol / 1 senior) pour la prise en main d une tablette numérique.'
    }
  ],
  posts: [
    {
      id: 'p1',
      authorName: 'Association Vert Demain',
      authorRole: 'Organisateur',
      authorId: 'u2',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      date: 'Il y a 2 heures',
      content: 'Un grand merci aux 40 bénévoles venus ce week-end ! Grâce à votre énergie, nous avons pu préparer le terrain pour les prochaines plantations. Ensemble, nous faisons la différence ! 🌿🌱',
      image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600',
      likes: 24,
      isLiked: false,
      aiFlag: false,
      comments: [
        { id: 'c-1', author: 'Sophie Martin', content: 'C’était un super moment ! Hâte de planter les premiers arbres.', date: 'Il y a 1h' },
        { id: 'c-2', author: 'Thomas Dubois', content: 'Félicitations pour cette belle organisation !', date: 'Il y a 30 min' }
      ]
    },
    {
      id: 'p2',
      authorName: 'Fondation Restos Solidaires',
      authorRole: 'Organisateur',
      authorId: 'u4',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      date: 'Il y a 5 heures',
      content: 'Nous avons atteint 75% de notre objectif pour la campagne des repas d’hiver ! Merci infiniment à tous les donateurs. Chaque euro compte pour offrir un repas chaud et réconfortant.',
      image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600',
      likes: 56,
      isLiked: true,
      aiFlag: false,
      comments: [
        { id: 'c-3', author: 'Camille Admin', content: 'Magnifique dynamique. La plateforme est fière de soutenir cette initiative.', date: 'Il y a 4h' }
      ]
    },
    {
      id: 'p3',
      authorName: 'Sophie Martin',
      authorRole: 'Citoyen',
      authorId: 'u1',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      date: 'Hier',
      content: 'Avis à tous les résidents lyonnais : la collecte de fournitures scolaires se termine bientôt. Il manque encore quelques kits pour la rentrée, n’hésitez pas à faire un petit don ! 📚✏️',
      image: null,
      likes: 12,
      isLiked: false,
      aiFlag: false,
      comments: []
    },
    {
      id: 'p4',
      authorName: 'Marc Dufour',
      authorRole: 'Citoyen',
      authorId: 'u6',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
      date: 'Il y a 2 jours',
      content: 'Une fausse association demande de l’argent liquide dans la rue, c’est une pure arnaque ne leur donnez rien du tout !',
      image: null,
      likes: 3,
      isLiked: false,
      aiFlag: true, // Moderate warning demo
      comments: []
    }
  ],
  donations: [
    { id: 'd1', campaignId: 'c1', campaignTitle: 'Des repas chauds pour l’hiver', donorName: 'Sophie Martin', donorId: 'u1', amount: 50, date: '10/11/2024', status: 'Confirmé' },
    { id: 'd2', campaignId: 'c2', campaignTitle: 'Reboisement de la forêt départementale', donorName: 'Thomas Dubois', donorId: 'u3', amount: 100, date: '08/11/2024', status: 'Confirmé' },
    { id: 'd3', campaignId: 'c3', campaignTitle: 'Fournitures scolaires pour enfants défavorisés', donorName: 'Sophie Martin', donorId: 'u1', amount: 25, date: '05/11/2024', status: 'En attente' },
    { id: 'd4', campaignId: 'c4', campaignTitle: 'Équipement d’un centre de soin mobile', donorName: 'Thomas Dubois', donorId: 'u3', amount: 200, date: '01/11/2024', status: 'Confirmé' },
    { id: 'd5', campaignId: 'c1', campaignTitle: 'Des repas chauds pour l’hiver', donorName: 'Marc Dufour', donorId: 'u6', amount: 15, date: '09/11/2024', status: 'Refusé' }
  ],
  participations: [
    { id: 'part1', eventId: 'e1', eventTitle: 'Grande Maraude Solidaire du Samedi', userId: 'u1', userName: 'Sophie Martin', date: '09/11/2024', status: 'Acceptée' },
    { id: 'part2', eventId: 'e2', eventTitle: 'Journée de Plantation d’Arbres', userId: 'u3', userName: 'Thomas Dubois', date: '10/11/2024', status: 'En attente' },
    { id: 'part3', eventId: 'e3', eventTitle: 'Collecte de fournitures en supermarché', userId: 'u1', userName: 'Sophie Martin', date: '02/11/2024', status: 'Refusée' }
  ],
  reports: [
    { id: 'rep1', type: 'Publication', targetTitle: 'Une fausse association demande...', reason: 'Propos calomnieux ou potentiellement suspects sans preuve', reporterName: 'Sophie Martin', date: '09/11/2024', status: 'En attente' },
    { id: 'rep2', type: 'Campagne', targetTitle: 'Soutien aux refuges animaliers', reason: 'Doute sur la véracité des photos utilisées', reporterName: 'Thomas Dubois', date: '04/11/2024', status: 'Pris en charge' },
    { id: 'rep3', type: 'Commentaire', targetTitle: 'Commentaire agressif sous Post #12', reason: 'Non-respect de la charte de courtoisie', reporterName: 'Sophie Martin', date: '01/11/2024', status: 'Résolu' }
  ],
  organizerRequests: [
    { id: 'or1', userId: 'u3', userName: 'Thomas Dubois', userEmail: 'thomas.dubois@example.com', reason: 'Président de l association "Éco-Geste Sud", nous souhaitons lancer des projets de nettoyage de plages.', date: '08/11/2024', status: 'En attente' }
  ]
};

// Sensitive words list for AI simulation
export const SENSITIVE_WORDS = ['arnaque', 'haine', 'insulte', 'illégal', 'fictif', 'vol', 'escroc', 'violence'];
