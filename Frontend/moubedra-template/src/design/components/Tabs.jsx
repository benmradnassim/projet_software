import { useId, useLayoutEffect, useRef, useState } from 'react';

/**
 * Onglets accessibles (role="tablist", flèches ←/→, Début/Fin).
 *
 *   <Tabs tabs={[{ key: 'all', label: 'Tous', count: 3, icon: Package }]} value={tab} onChange={setTab}>
 *     …contenu de l'onglet actif (facultatif)…
 *   </Tabs>
 *
 * variant :
 *  - 'underline' (défaut) : soulignement orange animé (« tabs3 »)
 *  - 'boxed'              : soulignement dans un cadre (filtres de rôle)
 *  - 'pill'               : pastille bleu marine qui glisse (filtres du fil, « ftabs »)
 */
export default function Tabs({ tabs, value, onChange, variant = 'underline', label = 'Onglets', className = '', children, style }) {
  const id = useId();
  const refs = useRef({});
  const [ind, setInd] = useState(null);

  useLayoutEffect(() => {
    if (variant !== 'pill') return undefined;
    const measure = () => {
      const el = refs.current[value];
      if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener('resize', measure);
  }, [value, variant, tabs.length]);

  const onKeyDown = (e) => {
    const i = tabs.findIndex((t) => t.key === value);
    let next = null;
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
    if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = tabs.length - 1;
    if (next === null) return;
    e.preventDefault();
    const key = tabs[next].key;
    onChange(key);
    refs.current[key]?.focus();
  };

  const listCls = variant === 'pill' ? 'ftabs' : `tabs3${variant === 'boxed' ? ' boxed' : ''}`;

  return (
    <>
      <div role="tablist" aria-label={label} className={`${listCls} ${className}`} onKeyDown={onKeyDown} style={style}>
        {variant === 'pill' && <span className="ind" style={ind || { opacity: 0 }} aria-hidden="true" />}
        {tabs.map((t) => {
          const selected = t.key === value;
          const TabIcon = t.icon;
          return (
            <button
              key={t.key}
              ref={(el) => {
                refs.current[t.key] = el;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${t.key}`}
              aria-selected={selected}
              aria-controls={children ? `${id}-panel` : undefined}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(t.key)}
            >
              {TabIcon && <TabIcon size={15} aria-hidden="true" />}
              {t.label}
              {t.count !== undefined && t.count !== null && <span className={variant === 'pill' ? 'n' : 'c'}>{t.count}</span>}
            </button>
          );
        })}
      </div>
      {children && (
        <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${value}`} key={value} className="tabc" tabIndex={-1}>
          {children}
        </div>
      )}
    </>
  );
}
