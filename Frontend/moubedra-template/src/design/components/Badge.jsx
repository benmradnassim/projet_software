/** Pastille d'état. tone : ok | wait | no | info | grey */
export default function Badge({ tone = 'info', icon: IconCmp, className = '', children, ...rest }) {
  return (
    <span className={`badge ${tone} ${className}`} {...rest}>
      {IconCmp && <IconCmp size={13} aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Correspondance statut du backend -> [ton, libellé]. */
export const STATUT_BADGES = {
  en_attente: ['wait', 'En attente'],
  en_cours: ['ok', 'En cours'],
  acceptee: ['ok', 'Acceptée'],
  confirme: ['ok', 'Confirmé'],
  resolu: ['ok', 'Résolu'],
  refusee: ['no', 'Refusée'],
  refuse: ['no', 'Refusé'],
  rejete: ['grey', 'Classé sans suite'],
  annulee: ['grey', 'Annulée'],
  cloturee: ['grey', 'Terminée'],
  brouillon: ['wait', 'Brouillon'],
  actif: ['ok', 'Actif'],
  suspendu: ['no', 'Suspendu'],
  desactive: ['grey', 'Désactivé'],
};

/** Pastille calculée depuis un statut du backend. */
export function StatutBadge({ statut, label }) {
  const [tone, text] = STATUT_BADGES[statut] || ['grey', statut];
  return <Badge tone={tone}>{label || text}</Badge>;
}
