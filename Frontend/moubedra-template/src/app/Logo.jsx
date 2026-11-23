const HEART =
  'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z';

/** Pictogramme : cercle + cœur qui se dessinent (classes .mark de layout.css). */
export function LogoMark() {
  return (
    <span className="mark" aria-hidden="true">
      <svg className="ring" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r="20" />
      </svg>
      <svg width="24" height="24" viewBox="0 0 24 24" style={{ position: 'relative' }}>
        <path className="hfill" d={HEART} />
        <path className="hp" d={HEART} />
      </svg>
      <span className="ripple" />
    </span>
  );
}

/** « moubedra. » lettre par lettre (montée décalée puis point orange). */
export function LogoWord({ text = 'moubedra' }) {
  return (
    <span className="word" aria-hidden="true">
      {[...text].map((c, i) => (
        <span key={i} style={{ animationDelay: `${0.55 + i * 0.045}s` }}>
          {c}
        </span>
      ))}
      <span className="dot" style={{ animationDelay: `${0.6 + text.length * 0.045}s` }}>
        .
      </span>
    </span>
  );
}
