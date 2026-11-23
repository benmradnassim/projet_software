import { useEffect, useRef, useState } from 'react';

/**
 * Indique si l'élément est visible à l'écran (révélations au défilement, compteurs…).
 *   const [ref, visible] = useInView({ threshold: 0.2 });
 * `once` (défaut) : reste vrai après la première apparition.
 */
export function useInView({ threshold = 0.2, once = true, rootMargin = '0px' } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) io.disconnect();
        } else if (!once) setVisible(false);
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once, rootMargin]);

  return [ref, visible];
}
