import { Icon, ProgressBar, Stepper } from '../../../design/components';
import { percent } from '../../../lib/format';
import '../campagnes.css';

/** Nombre total d'articles encore attendus. */
export const articlesManquants = (besoins) => (besoins ? besoins.items.reduce((a, i) => a + (i.objectif - i.recu), 0) : 0);

/**
 * Liste des besoins matériels d'une campagne.
 *   <NeedsList besoins={b} />                                         affiche ce qu'il manque
 *   <NeedsList besoins={b} quantites={q} onChange={(k, v) => …} />    avec sélecteurs +/-
 */
export default function NeedsList({ besoins, quantites, onChange }) {
  if (!besoins) return null;
  const selectable = !!onChange;
  return (
    <div>
      {besoins.items.map((it, k) => (
        <div className="need2" key={it.libelle}>
          <span className="ni" aria-hidden="true">
            <Icon name={it.icone} size={20} />
          </span>
          <div>
            <b>{it.libelle}</b>
            <small>
              {it.recu} / {it.objectif} reçus · {it.precision}
            </small>
            <ProgressBar value={percent(it.recu, it.objectif)} tone="warm" height={6} label={`${it.libelle} : ${it.recu} reçus sur ${it.objectif}`} />
          </div>
          {selectable ? (
            <Stepper value={quantites[k] || 0} onChange={(v) => onChange(k, v)} label={it.libelle} />
          ) : (
            <b className="left" aria-label={`${it.objectif - it.recu} manquants`}>
              {it.objectif - it.recu}
            </b>
          )}
        </div>
      ))}
    </div>
  );
}
