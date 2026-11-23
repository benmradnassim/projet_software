import { useEffect, useState } from 'react';
import { prefersReducedMotion } from './useReducedMotion';

/**
 * Compteur animé de 0 à `target` (easing cubique, comme la maquette).
 *   const n = useCountUp(342680, { start: visible, duration: 1400 });
 * Renvoie un nombre ; formatez-le avec lib/format (formatNumber).
 */
export function useCountUp(target, { start = true, duration = 1400 } = {}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return undefined;
    const to = Number(target) || 0;
    if (prefersReducedMotion()) {
      setValue(to);
      return undefined;
    }
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      setValue(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start, duration]);

  return value;
}
