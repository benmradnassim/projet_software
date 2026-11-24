import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useDismiss } from '../hooks/useDismiss';

/**
 * Menu déroulant accessible (bouton ⋯ par défaut).
 *
 *   <Menu
 *     label="Plus d’options"
 *     items={[
 *       { icon: Link, label: 'Copier le lien', onSelect: () => … },
 *       null,                                            // séparateur
 *       { icon: Trash2, label: 'Supprimer…', danger: true, onSelect: … },
 *     ]}
 *   />
 *
 * Clavier : Entrée/Espace/↓ ouvre, ↑/↓/Début/Fin naviguent, Échap ferme et rend le focus au bouton,
 * Tab ferme. Clic extérieur ferme.
 * `renderTrigger(props)` remplace le bouton ⋯ (ex. menu de l'avatar) ; `header` s'affiche en haut du menu.
 */
export default function Menu({ items, label = 'Plus d’options', onDark, renderTrigger, header, menuClassName = 'menu', menuStyle, className = '' }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const id = useId();

  const close = useCallback((reason) => {
    setOpen(false);
    if (reason === 'escape') triggerRef.current?.focus();
  }, []);
  useDismiss(open, close, [wrapRef]);

  const buttons = () => [...(menuRef.current?.querySelectorAll('[role="menuitem"]') || [])];

  useEffect(() => {
    if (open) requestAnimationFrame(() => buttons()[0]?.focus());
  }, [open]);

  const onMenuKey = (e) => {
    const bs = buttons();
    const i = bs.indexOf(document.activeElement);
    const go = (n) => {
      e.preventDefault();
      bs[(n + bs.length) % bs.length]?.focus();
    };
    if (e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(bs.length - 1);
    else if (e.key === 'Tab') setOpen(false);
  };

  const triggerProps = {
    ref: triggerRef,
    type: 'button',
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': `${id}-menu`,
    onClick: (e) => {
      e.stopPropagation();
      setOpen((o) => !o);
    },
    onKeyDown: (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
    },
  };

  let n = 0;
  return (
    <div className={`menu-wrap ${className}`} ref={wrapRef}>
      {renderTrigger ? (
        renderTrigger(triggerProps)
      ) : (
        <button {...triggerProps} className={`dots${onDark ? ' on-dark' : ''}`} aria-label={label}>
          <MoreHorizontal size={18} aria-hidden="true" />
        </button>
      )}
      <div
        id={`${id}-menu`}
        ref={menuRef}
        role="menu"
        aria-label={label}
        className={`${menuClassName}${open ? ' open' : ''}`}
        style={menuStyle}
        onKeyDown={onMenuKey}
        aria-hidden={!open}
      >
        {header}
        {items.filter((it) => it !== false && it !== undefined).map((it, i) => {
          if (it === null) return <hr key={`sep-${i}`} />;
          const ItemIcon = it.icon;
          const delay = n++ * 0.035;
          return (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              tabIndex={-1}
              className={it.danger ? 'danger' : undefined}
              style={{ animationDelay: `${delay}s` }}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                it.onSelect?.();
              }}
            >
              {ItemIcon && <ItemIcon size={16} aria-hidden="true" />}
              {it.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
