import { initials as toInitials } from '../../lib/format';

const PALETTE = ['#d9472b', '#1f3a6b', '#4f7f42', '#c98a3a', '#2f6f86', '#6b4f9a'];
const colorFor = (s = '') => PALETTE[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];

/**
 * Pastille d'avatar avec initiales.
 *   <Avatar name="Nour Saada" color="#d9472b" size={42} />
 */
export default function Avatar({ name = '', initials, color, size = 44, className = '', style, label }) {
  const ini = initials || toInitials(name);
  return (
    <span
      className={`avatar ${className}`}
      style={{ background: color || colorFor(name || ini), width: size, height: size, fontSize: size >= 50 ? 16 : size <= 36 ? 13 : 14, ...style }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {ini}
    </span>
  );
}

/**
 * Pile d'avatars qui se chevauchent.
 *   <AvatarStack people={[['SK', '#d9472b'], ['YA', '#1f3a6b']]} more={18} size="sm" />
 * Un 3e élément `true` anime l'arrivée (nouvel inscrit).
 */
export function AvatarStack({ people = [], more, size, label, className = '' }) {
  return (
    <div className={`av${size === 'sm' ? ' sm' : ''} ${className}`} role={label ? 'img' : undefined} aria-label={label}>
      {people.map(([ini, col, isNew], i) => (
        <span key={`${ini}-${i}`} className={isNew ? 'new' : undefined} style={{ background: col }} aria-hidden="true">
          {ini}
        </span>
      ))}
      {more > 0 && (
        <span style={{ background: '#c98a3a' }} aria-hidden="true">
          +{more}
        </span>
      )}
    </div>
  );
}
