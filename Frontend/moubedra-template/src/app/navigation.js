/**
 * Assemble la barre latérale à partir des `features/<module>/nav.js`.
 * NE PAS MODIFIER pour ajouter une entrée : déclarez-la dans le nav.js de votre feature.
 *
 * Format d'une entrée de nav.js :
 *   {
 *     to: '/organisateur/campagnes',
 *     label: 'Mes campagnes',
 *     icon: Megaphone,            // composant lucide-react
 *     roles: ['organisateur'],    // rôles qui voient l'entrée
 *     group: 'Mes actions',       // doit être l'un des groupes du rôle (voir GROUPS ci-dessous)
 *     order: 0,                   // ordre dans le groupe
 *     badge: 4,                   // compteur facultatif
 *     pulse: true,                // compteur qui pulse (facultatif)
 *     end: true,                  // actif uniquement sur l'URL exacte (tableaux de bord)
 *   }
 */
const modules = import.meta.glob('../features/*/nav.js', { eager: true });
const ENTRIES = Object.values(modules).flatMap((m) => m.default || []);

/** Groupes de la barre latérale, dans l'ordre, pour chaque rôle. */
export const GROUPS = {
  citoyen: ['Général', 'Agir', 'Communauté', 'Compte'],
  organisateur: ['Général', 'Mes actions', 'Communauté', 'Compte'],
  admin: ['Général', 'File d’attente', 'Plateforme', 'Compte'],
};

/** Carte d'aide en bas de la barre latérale. */
export const HELP = {
  citoyen: { title: 'Une idée solidaire ?', text: 'Lancez-la en devenant organisateur.', to: '/espace/devenir-organisateur', cta: 'Découvrir' },
  organisateur: { title: 'Nouvelle campagne', text: 'Un brouillon est à 80 %, terminez-le !', to: '/organisateur/campagnes/nouvelle', cta: 'Créer' },
  admin: { title: 'Règles de la communauté', text: 'Mises à jour le 15 nov. 2026', to: '/admin/signalements', cta: 'Relire' },
};

/** [{ label: 'Agir', items: [...] }, …] pour un rôle donné. */
export function getNavigation(role) {
  const groups = GROUPS[role] || [];
  const visible = ENTRIES.filter((e) => e.roles?.includes(role));
  if (import.meta.env.DEV) {
    visible
      .filter((e) => !groups.includes(e.group))
      .forEach((e) => console.warn(`[nav] Groupe inconnu « ${e.group} » pour le rôle ${role} (${e.to}).`));
  }
  return groups
    .map((label) => ({
      label,
      items: visible.filter((e) => e.group === label).sort((a, b) => (a.order ?? 99) - (b.order ?? 99)),
    }))
    .filter((g) => g.items.length);
}
