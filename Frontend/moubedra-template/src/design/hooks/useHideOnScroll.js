import { useEffect, useState } from 'react';

/**
 * En-tête « intelligent » : se cache au défilement vers le bas, réapparaît vers le haut.
 * - seuil de 6 px entre deux images, toujours visible dans les 90 premiers pixels
 * - met à jour la variable CSS --hdr (hauteur visible de l'en-tête) utilisée par la
 *   barre latérale et les panneaux collants (`top: var(--hdr)`)
 * - `locked` force l'affichage (ex. popover ouvert)
 * Renvoie { hidden, shadow } ; l'en-tête doit aussi se réafficher au focus clavier.
 */
export function useHideOnScroll({ threshold = 6, height = 78, locked = false } = {}) {
  const [state, setState] = useState({ hidden: false, shadow: false });

  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      const d = y - last;
      setState((s) => {
        let hidden = s.hidden;
        if (y < 90 || locked) hidden = false;
        else if (d > threshold) hidden = true;
        else if (d < -threshold) hidden = false;
        const shadow = y > 10;
        return hidden === s.hidden && shadow === s.shadow ? s : { hidden, shadow };
      });
      last = y;
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold, locked]);

  const hidden = state.hidden && !locked;

  useEffect(() => {
    document.documentElement.style.setProperty('--hdr', hidden ? '0px' : `${height}px`);
  }, [hidden, height]);

  const show = () => setState((s) => (s.hidden ? { ...s, hidden: false } : s));
  return { hidden, shadow: state.shadow, show };
}
