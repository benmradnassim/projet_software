import { useEffect, useRef, useState } from 'react';

/**
 * Tableau avec sélection multiple et barre d'actions groupées.
 *
 *   <DataTable
 *     caption="Utilisateurs"
 *     columns={[
 *       { key: 'nom', header: 'Utilisateur', render: (u) => <b>{u.nom_complet}</b> },
 *       { key: 'actions', header: '', align: 'right', render: (u) => <Menu … /> },
 *     ]}
 *     rows={users}
 *     selectable
 *     bulkActions={(ids, clear) => <Button size="sm" onClick={() => { bloquer(ids); clear(); }}>Bloquer</Button>}
 *     rowClassName={(u) => (u.flash ? 'ok-flash' : '')}
 *   />
 */
export default function DataTable({ columns, rows, rowKey = 'id', selectable, bulkActions, rowClassName, caption, empty, className = '' }) {
  const [selected, setSelected] = useState(() => new Set());
  const allRef = useRef(null);
  const ids = rows.map((r) => r[rowKey]);

  // purge la sélection quand des lignes disparaissent (filtre, suppression)
  useEffect(() => {
    setSelected((s) => {
      const next = new Set([...s].filter((id) => ids.includes(id)));
      return next.size === s.size ? s : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join('|')]);

  const count = selected.size;
  const all = count > 0 && count === ids.length;
  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = count > 0 && !all;
  }, [count, all]);

  const toggle = (id) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const clear = () => setSelected(new Set());

  return (
    <>
      {selectable && (
        <div className={`bulk2${count ? ' on' : ''}`} aria-hidden={!count} role="region" aria-label="Actions groupées">
          <span aria-live="polite">{count} sélectionné(s)</span>
          {count > 0 && bulkActions?.([...selected], clear)}
          <button type="button" className="btn sm" style={{ marginLeft: 'auto' }} onClick={clear} tabIndex={count ? 0 : -1}>
            Annuler
          </button>
        </div>
      )}
      <div className={`table-wrap ${className}`}>
        <table className="t2">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {selectable && (
                <th style={{ width: 36 }}>
                  <input ref={allRef} type="checkbox" checked={all} onChange={(e) => setSelected(e.target.checked ? new Set(ids) : new Set())} aria-label="Tout sélectionner" />
                </th>
              )}
              {columns.map((c) => (
                <th key={c.key} scope="col" style={{ textAlign: c.align || 'left', width: c.width }}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const id = r[rowKey];
              const sel = selected.has(id);
              return (
                <tr key={id} className={[sel && 'selr', rowClassName?.(r)].filter(Boolean).join(' ') || undefined}>
                  {selectable && (
                    <td>
                      <input type="checkbox" checked={sel} onChange={() => toggle(id)} aria-label={`Sélectionner la ligne ${id}`} />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td key={c.key} style={{ textAlign: c.align || 'left', position: c.relative ? 'relative' : undefined }}>
                      {c.render ? c.render(r) : r[c.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && empty}
      </div>
    </>
  );
}
