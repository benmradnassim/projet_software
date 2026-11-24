import { useEffect, useState } from 'react';
import { useInView } from '../hooks/useInView';

/**
 * Barre de progression qui se remplit quand elle devient visible.
 *   <ProgressBar value={70} />             dégradé vert
 *   <ProgressBar value={65} tone="warm" />  dégradé orange
 *   <ProgressBar value={72} color="#c98a3a" height={10} />
 */
export default function ProgressBar({ value = 0, tone, color, height, delay = 120, label, className = '', style }) {
  const [ref, visible] = useInView({ threshold: 0.1 });
  const [w, setW] = useState(0);
  const v = Math.max(0, Math.min(100, Math.round(value)));

  useEffect(() => {
    if (!visible) return undefined;
    const t = setTimeout(() => setW(v), delay);
    return () => clearTimeout(t);
  }, [visible, v, delay]);

  const cls = ['bar', tone, height === 10 && 'b10', height === 6 && 'b6', className].filter(Boolean).join(' ');
  const customHeight = height && height !== 10 && height !== 6 ? { height } : {};
  return (
    <div
      ref={ref}
      className={cls}
      style={{ ...customHeight, ...style }}
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `${v} %`}
    >
      <span style={{ width: `${w}%`, ...(color ? { background: color } : {}) }} />
    </div>
  );
}
