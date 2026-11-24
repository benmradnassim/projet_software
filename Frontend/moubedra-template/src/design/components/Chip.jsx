/**
 * Puce de filtre : bouton à bascule (`active`) ou étiquette statique (`isStatic`).
 *   <Chip active={k === 'edu'} onClick={() => setK('edu')}>Éducation · 2</Chip>
 */
export default function Chip({ active, icon: IconCmp, isStatic, className = '', children, ...rest }) {
  const content = (
    <>
      {IconCmp && <IconCmp size={14} aria-hidden="true" />}
      {children}
    </>
  );
  if (isStatic) return <span className={`chip ${className}`}>{content}</span>;
  return (
    <button type="button" className={`chip${active ? ' on' : ''} ${className}`} aria-pressed={!!active} {...rest}>
      {content}
    </button>
  );
}
