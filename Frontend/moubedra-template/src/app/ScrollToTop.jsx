import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Remonte en haut de page à chaque changement de route (comme `window.scrollTo` dans la maquette). */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}
