import { formatNumber } from '../../lib/format';
import { useCountUp } from '../hooks/useCountUp';
import { useInView } from '../hooks/useInView';

/** Nombre qui s'anime de 0 à `value` quand il devient visible. */
export function CountUp({ value, duration = 1400, decimals = 0 }) {
  const [ref, visible] = useInView({ threshold: 0.2 });
  const n = useCountUp(value, { start: visible, duration });
  return (
    <span ref={ref}>
      <span aria-hidden="true">{formatNumber(n, decimals)}</span>
      <span className="sr-only">{formatNumber(value, decimals)}</span>
    </span>
  );
}

/**
 * Indicateur chiffré (« kpi2 »).
 *   <StatCard icon={Wallet} label="Total donné en 2026" value="170 TND" />
 *   <StatCard icon={Users} label="Bénévoles actifs" value={126} trend="↑ 9 nouveaux" />  (nombre -> compteur animé)
 */
export default function StatCard({ icon: IconCmp, label, value, suffix, trend }) {
  return (
    <div className="kpi2">
      <small>
        {IconCmp && <IconCmp size={15} aria-hidden="true" />} {label}
      </small>
      <b>
        {typeof value === 'number' ? <CountUp value={value} duration={1300} /> : value}
        {suffix ? ` ${suffix}` : ''}
      </b>
      {trend && <small className="trend">{trend}</small>}
    </div>
  );
}
