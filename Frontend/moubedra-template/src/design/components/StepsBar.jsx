import { Fragment } from 'react';
import { Check } from 'lucide-react';

/**
 * Étapes numérotées 1-2-3 reliées par un trait qui se remplit.
 *   <StepsBar steps={['Montant', 'Paiement', 'Confirmation']} current={2} />
 * `compact` : variante des écrans d'inscription ; `lastIsCheck` : dernière pastille = coche.
 */
export default function StepsBar({ steps, current, compact, lastIsCheck }) {
  return (
    <ol className={`steps4${compact ? ' compact' : ''}`} aria-label="Étapes">
      {steps.map((label, i) => {
        const n = i + 1;
        const state = n === current ? 'on' : n < current ? 'done' : '';
        return (
          <Fragment key={`${label}-${n}`}>
            <li className={`st4 ${state}`} aria-current={n === current ? 'step' : undefined} style={{ listStyle: 'none' }}>
              <i aria-hidden="true">{lastIsCheck && n === steps.length ? <Check size={14} /> : n}</i>
              <span>{label}</span>
              {n < current && <span className="sr-only"> (terminée)</span>}
            </li>
            {n < steps.length && (
              <li className={`ln4${n < current ? ' ok' : ''}`} aria-hidden="true" style={{ listStyle: 'none' }}>
                <b />
              </li>
            )}
          </Fragment>
        );
      })}
    </ol>
  );
}
