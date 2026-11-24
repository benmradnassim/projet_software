import { Fragment } from 'react';
import { Link } from 'react-router-dom';

/**
 * En-tête de page : fil d'Ariane + titre + sous-titre + actions.
 *   <PageHeader crumbs={['Agir', 'Campagnes']} title="Campagnes solidaires" subtitle="8 initiatives…"
 *               actions={<Button size="sm">Exporter</Button>} />
 * crumbs : chaînes ou { label, to } ; le dernier est en gras.
 */
export function Breadcrumb({ items = [] }) {
  if (!items.length) return null;
  return (
    <nav className="crumb" aria-label="Fil d’Ariane">
      {items.map((c, i) => {
        const { label, to } = typeof c === 'object' ? c : { label: c };
        const last = i === items.length - 1;
        return (
          <Fragment key={`${label}-${i}`}>
            {i > 0 && ' / '}
            {last && items.length > 1 ? <b aria-current="page">{label}</b> : to ? <Link to={to}>{label}</Link> : label}
          </Fragment>
        );
      })}
    </nav>
  );
}

export default function PageHeader({ crumbs, title, subtitle, actions }) {
  return (
    <div className="pht">
      <div>
        <Breadcrumb items={crumbs} />
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && (
        <div className="row" style={{ gap: 8 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
