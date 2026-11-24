import { Link } from 'react-router-dom';
import { BadgeCheck, Clock3, MapPin } from 'lucide-react';
import { Badge, DateBadge, ProgressBar } from '../../../design/components';
import { formatTime, percent } from '../../../lib/format';
import '../evenements.css';

/** Heure de début – heure de fin. */
export const horaire = (e) => `${formatTime(e.date_evenement)} – ${e.heure_fin}`;

/** Ligne d'événement (« evc ») : image, date, titre, lieu, places. */
export default function EventRow({ evenement: e, index = 0 }) {
  const left = e.capacite - e.nb_participants;
  return (
    <article className="evc link" style={{ animationDelay: `${index * 0.05}s` }}>
      <img src={e.image} alt="" loading="lazy" style={{ objectPosition: e.image_position }} />
      <DateBadge date={e.date_evenement} />
      <div className="gw">
        <h3>
          <Link to={`/evenements/${e.id}`}>{e.titre}</Link>
          {e.urgent && <Badge tone="no">Urgent</Badge>}
        </h3>
        <div className="meta2">
          <Clock3 size={14} aria-hidden="true" /> {horaire(e)} · <MapPin size={14} aria-hidden="true" /> {e.lieu}
        </div>
        <div className="meta2" style={{ marginTop: 4 }}>
          <BadgeCheck size={14} aria-hidden="true" /> {e.organisateur_nom}
        </div>
      </div>
      <div className="pl">
        <small className="muted">
          <b style={{ color: 'var(--navy)' }}>{e.nb_participants}</b> / {e.capacite} participants
        </small>
        <ProgressBar value={percent(e.nb_participants, e.capacite)} label={`${e.nb_participants} participants sur ${e.capacite}`} />
        <small style={{ color: left < 8 ? 'var(--orange)' : 'var(--muted)', fontWeight: 700 }}>{left} places restantes</small>
      </div>
    </article>
  );
}
