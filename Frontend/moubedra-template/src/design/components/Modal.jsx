import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Fenêtre modale accessible : role="dialog", focus piégé, Échap ou clic sur le fond pour fermer,
 * focus rendu à l'élément d'origine.
 *
 *   <Modal open={open} onClose={() => setOpen(false)} title="Supprimer mon compte ?"
 *          actions={<><Button variant="ghost" onClick={…}>Annuler</Button><Button>Confirmer</Button></>}>
 *     <p>…</p>
 *   </Modal>
 */
export default function Modal({ open, onClose, title, children, actions, width }) {
  const ref = useRef(null);
  const id = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => (ref.current?.querySelector('[autofocus]') || ref.current?.querySelector(FOCUSABLE))?.focus());

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
      }
      if (e.key === 'Tab' && ref.current) {
        const els = [...ref.current.querySelectorAll(FOCUSABLE)];
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className="modal" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} style={width ? { width: `min(${width}px, 100%)` } : undefined}>
        <button type="button" className="close" onClick={onClose} aria-label="Fermer">
          <X size={18} aria-hidden="true" />
        </button>
        <h2 id={`${id}-title`}>{title}</h2>
        {children}
        {actions && <div className="actions">{actions}</div>}
      </div>
    </div>,
    document.body,
  );
}
