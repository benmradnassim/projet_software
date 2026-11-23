import { useEffect } from 'react';

/**
 * Ferme un élément ouvert (menu, popover) sur `Échap` ou clic à l'extérieur.
 *   useDismiss(open, () => setOpen(false), [wrapperRef]);
 */
export function useDismiss(open, onClose, refs = []) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose('escape');
    };
    const onDown = (e) => {
      if (refs.some((r) => r.current?.contains(e.target))) return;
      onClose('outside');
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose]);
}
