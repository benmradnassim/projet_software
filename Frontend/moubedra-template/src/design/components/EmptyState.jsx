/**
 * État vide illustré.
 *   <EmptyState image="campagnes" title="Aucun résultat" text="Essayez un autre mot-clé."
 *               actions={<Button size="sm">Tout effacer</Button>} />
 * image : campagnes | dons | fil (illustrations de public/media/empty/)
 * `large` : variante plus grande de l'accueil.
 */
export default function EmptyState({ image = 'campagnes', title, text, actions, large, className = '' }) {
  return (
    <div className={`empty2${large ? ' large' : ''} ${className}`} role="status">
      <img src={`/media/empty/${image}.webp`} alt="" width={large ? 180 : 170} height={large ? 180 : 170} loading="lazy" />
      <div>
        <h3>{title}</h3>
        {text && <p>{text}</p>}
        {actions && <div className="actions">{actions}</div>}
      </div>
    </div>
  );
}
