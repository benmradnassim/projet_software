import { Fragment } from 'react';
import { Check } from 'lucide-react';

const ETAPES = ['Promis', 'Déposé', 'Réceptionné', 'Remis'];

/** Suivi d'un don matériel : Promis → Déposé → Réceptionné → Remis. `etape` = dernière étape franchie (0 à 3). */
export default function MaterialProgress({ etape = 0 }) {
  return (
    <div role="img" aria-label={`Suivi du don : ${ETAPES[etape]}${etape < 3 ? `, prochaine étape : ${ETAPES[etape + 1]}` : ''}`}>
      <div className="mst" aria-hidden="true">
        {ETAPES.map((l, i) => (
          <Fragment key={l}>
            <i className={i <= etape ? 'ok' : i === etape + 1 ? 'cur' : undefined}>{i <= etape && <Check size={12} />}</i>
            {i < 3 && <b className={i < etape ? 'ok' : undefined} />}
          </Fragment>
        ))}
      </div>
      <div className="mstl" aria-hidden="true">
        {ETAPES.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}
