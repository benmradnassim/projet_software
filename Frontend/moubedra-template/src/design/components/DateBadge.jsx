import { dateParts, formatDate } from '../../lib/format';

/** Pastille de date d'événement : SAM. / 05 / DÉC. */
export default function DateBadge({ date, light, className = '', style }) {
  const [wd, day, month] = dateParts(date);
  return (
    <div className={`dt2${light ? ' light' : ''} ${className}`} style={style}>
      <span className="sr-only">{formatDate(date, { weekday: true })}</span>
      <small aria-hidden="true">{wd}</small>
      <b aria-hidden="true">{day}</b>
      <small aria-hidden="true">{month}</small>
    </div>
  );
}
