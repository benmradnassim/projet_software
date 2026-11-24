import { useEffect, useState } from 'react';
import { useInView } from '../hooks/useInView';

/**
 * Histogramme simple (barres qui montent une à une ; la dernière est mise en avant).
 *   <BarChart values={[1.1, 1.6, 3.4]} labels={['S40', 'S41', 'S47']} max={3.6} format={(v) => `${v}k`} title="Dons par semaine" />
 */
export default function BarChart({ values, labels, max, format = String, title }) {
  const [ref, visible] = useInView({ threshold: 0.2 });
  const [shown, setShown] = useState(0);
  const top = max || Math.max(...values);

  useEffect(() => {
    if (!visible) return undefined;
    const timers = values.map((_, i) => setTimeout(() => setShown((n) => Math.max(n, i + 1)), 200 + i * 70));
    return () => timers.forEach(clearTimeout);
  }, [visible, values]);

  return (
    <figure ref={ref} style={{ margin: 0 }}>
      <figcaption className="sr-only">
        {title} : {values.map((v, i) => `${labels[i]} ${format(v)}`).join(', ')}
      </figcaption>
      <div className="chart2" aria-hidden="true">
        {values.map((v, i) => (
          <div key={labels[i]} className={i === values.length - 1 ? 'on' : undefined} style={{ height: i < shown ? `${Math.round((v / top) * 100)}%` : 0 }}>
            <span>{format(v)}</span>
          </div>
        ))}
      </div>
      <div className="xl2" aria-hidden="true">
        {labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </figure>
  );
}
