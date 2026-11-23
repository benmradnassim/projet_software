/**
 * Chronologie verticale.
 *   <Timeline items={[{ title: 'Campagne lancée', info: '1 nov.' }, { title: '…', future: true }]} />
 */
export default function Timeline({ items = [] }) {
  return (
    <ol className="tl2">
      {items.map((it, i) => (
        <li key={i} className={it.future ? 'fut' : undefined} style={{ listStyle: 'none' }}>
          <b>{it.title}</b>
          {it.info && <small>{it.info}</small>}
        </li>
      ))}
    </ol>
  );
}
