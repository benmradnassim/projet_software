import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeCheck, Heart, ImagePlus, MapPin, Package } from 'lucide-react';
import { Button, ProgressBar } from '../../../design/components';
import { formatNumber, percent } from '../../../lib/format';
import '../campagnes.css';

/** Pourcentage financé (plafonné à l'affichage de la barre, pas du texte). */
export const pctCampagne = (c) => percent(c.montant_collecte, c.objectif_montant);
export const isTerminee = (c) => c.statut === 'cloturee';
function calculerJoursRestants(dateFin) {
  if (!dateFin) return null;

  const fin = new Date(`${dateFin}T23:59:59`);

  if (Number.isNaN(fin.getTime())) return null;

  return Math.max(
    0,
    Math.ceil((fin.getTime() - Date.now()) / 86400000)
  );
}
/**
 * Carte de campagne de la maquette (« cc »).
 *   <CampaignCard campagne={c} favori={fav.has(c.id)} onFavori={() => …} materiel />
 * `preview` : aperçu statique (assistant de création, revue admin) sans liens ni actions.
 */
export default function CampaignCard({ campagne: c, favori, onFavori, materiel, preview, index = 0 }) {
  const navigate = useNavigate();
  const [pop, setPop] = useState(0);
  const p = pctCampagne(c);
  const done = isTerminee(c);
  const joursRestants = c.jours_restants ?? calculerJoursRestants(c.date_fin);
  return (
    <article className={`cc${preview ? ' static' : ''}`} style={{ animationDelay: `${index * 0.05}s` }}>
      <div className="im">
        {c.image ? (
          <img src={c.image} alt="" loading="lazy" style={{ objectPosition: c.image_position || 'center' }} />
        ) : (
          <div className="noimg">
            <ImagePlus size={26} aria-hidden="true" />
          </div>
        )}
        <span className="tg">{c.categorie}</span>
        {c.urgent && <span className="urg2">● Urgent</span>}
        {!preview && onFavori && (
          <button
            type="button"
            key={pop}
            className={`fv${pop ? ' pop' : ''}`}
            aria-pressed={!!favori}
            aria-label={favori ? `Retirer « ${c.titre} » des favoris` : `Enregistrer « ${c.titre} »`}
            onClick={() => {
              setPop((x) => x + 1);
              onFavori();
            }}
          >
            <Heart size={18} aria-hidden="true" />
          </button>
        )}
        {done && <span className="done">✓ Objectif atteint</span>}
      </div>
      <div className="bd">
        {materiel && (
          <span className="matb">
            <Package size={13} aria-hidden="true" /> Matériel accepté
          </span>
        )}
       {c.ville && (
  <div className="meta2">
    <MapPin size={14} aria-hidden="true" /> {c.ville}
  </div>
)}
        <h3>{preview ? c.titre : <Link to={`/campagnes/${c.id}`}>{c.titre}</Link>}</h3>
        <div className="meta2">
          <BadgeCheck size={14} aria-hidden="true" /> {c.organisation || c.organisateur_nom}
        </div>
        <div className="amt2">
          <b>{formatNumber(c.montant_collecte)} TND</b>
          <span>sur {formatNumber(c.objectif_montant)}</span>
        </div>
        <ProgressBar value={Math.min(100, p)} label={`${p} % financé`} />
        <div className="ft2">
          <span>
            {p} % · {c.nb_donateurs ?? 0} donateurs ? </span>
         {done ? (
  <span>Clôturée</span>
) : joursRestants !== null ? (
  <b>{joursRestants === 0 ? 'Date dépassée' : `${joursRestants} jours`}</b>
) : null}
        </div>
        {!preview && !done && (
          <div className="qa">
            <Button size="sm" onClick={() => navigate(`/campagnes/${c.id}/don`)}>
              Donner ? </Button>
            <Button size="sm" variant="ghost" to={`/campagnes/${c.id}`} tabIndex={-1}>
              Voir ? </Button>
          </div>
        )}
      </div>
    </article>
  );
}
