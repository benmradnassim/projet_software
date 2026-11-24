import { Flag, Info } from 'lucide-react';

const TYPES = { publication: 'Publication', commentaire: 'Commentaire', campagne: 'Campagne', evenement: 'Événement', autre: 'Profil' };

/** Ligne de signalement : type · motif, extrait, réponse de la modération, statut à droite. */
export default function ReportItem({ s, tone = ['#f1f3ef', '#33435a'], aside, children, signale = true }) {
  return (
    <li className="it top">
      <span className="ic2" style={{ background: tone[0], color: tone[1] }} aria-hidden="true">
        <Flag size={19} />
      </span>
      <div className="gw">
        <h4>
          {s.type_label || TYPES[s.type]}
          {signale && s.type !== 'autre' ? ' signalé' + (s.type === 'publication' ? 'e' : '') : ''} · <span style={{ fontWeight: 500, color: 'var(--muted)' }}>{s.motif}</span>
        </h4>
        <small>{s.extrait}</small>
        <p className="note">
          <Info size={14} aria-hidden="true" /> {s.reponse}
        </p>
        {children}
      </div>
      {aside}
    </li>
  );
}
