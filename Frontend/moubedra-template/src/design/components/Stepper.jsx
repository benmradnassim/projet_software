import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

/**
 * Sélecteur de quantité +/-.
 *   <Stepper value={q} onChange={setQ} min={0} max={20} label="Cartables" />
 */
export default function Stepper({ value = 0, onChange, min = 0, max = 20, label }) {
  const [bump, setBump] = useState(0);
  const set = (v) => {
    const next = Math.max(min, Math.min(max, v));
    if (next !== value) {
      onChange?.(next);
      setBump((b) => b + 1);
    }
  };
  return (
    <div className={`stepper${value > 0 ? ' has' : ''}`} role="group" aria-label={label ? `Quantité : ${label}` : 'Quantité'}>
      <button type="button" onClick={() => set(value - 1)} disabled={value <= min} aria-label={label ? `Moins de ${label}` : 'Moins'}>
        <Minus size={15} aria-hidden="true" />
      </button>
      <output key={bump} className={bump ? 'bump' : ''} aria-live="polite">
        {value}
      </output>
      <button type="button" onClick={() => set(value + 1)} disabled={value >= max} aria-label={label ? `Plus de ${label}` : 'Plus'}>
        <Plus size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
