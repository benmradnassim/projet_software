/**
 * Carte blanche bordée (« panel » de la maquette). Alias : Card.
 *   <Panel title="Mon activité" action={<Link className="lnk2" to="…">Tout voir</Link>}>…</Panel>
 */
export default function Panel({ as: Tag = 'div', title, action, className = '', children, ...rest }) {
  return (
    <Tag className={`panel ${className}`} {...rest}>
      {(title || action) && (
        <h3 className="h">
          <span>{title}</span>
          {action}
        </h3>
      )}
      {children}
    </Tag>
  );
}
