import { Link } from 'react-router-dom';
import { BadgeCheck, Heart, MapPin } from 'lucide-react';
import { Button, ProgressBar } from '../../../design/components';
import { tnd, formatNumber } from '../../../lib/format';
import { pctCampagne } from '../../campagnes';

/** Grande carte de campagne de l'accueil (« card » de la maquette). */
export default function HomeCampaignCard({ campagne: c, favori, onFavori, hidden, delay = 0 }) {
  const p = pctCampagne(c);
  return (
    <article className="card" style={{ transitionDelay: `${delay}s` }} hidden={hidden}>
      <button type="button" className="fav" aria-pressed={!!favori} aria-label={favori ? `Retirer « ${c.titre} » des favoris` : `Enregistrer « ${c.titre} »`} onClick={onFavori}>
        <Heart size={18} aria-hidden="true" />
      </button>
      <div className="ph">
        <img src={c.image} alt="" loading="lazy" style={{ objectPosition: c.image_position }} />
        <span className="tag">{c.categorie}</span>
      </div>
      <div className="c">
        <div className="meta">
          <MapPin size={15} aria-hidden="true" /> {c.ville}
        </div>
        <h3>
          <Link to={`/campagnes/${c.id}`}>{c.titre}</Link>
        </h3>
        <div className="org">
          <BadgeCheck size={15} aria-hidden="true" /> {c.organisation}
        </div>
        <div className="amt">
          <b>{tnd(c.montant_collecte)}</b>
          <span>sur {formatNumber(c.objectif_montant)}</span>
        </div>
        <ProgressBar value={p} delay={300} label={`${p} % financé`} />
        <div className="foot">
          <span>
            {p} % · {c.nb_donateurs} donateurs
          </span>
          <span className="left">{c.jours_restants} jours</span>
        </div>
        <div className="acts">
          <Button size="sm" to={`/campagnes/${c.id}/don`}>
            Donner
          </Button>
          <Button size="sm" variant="ghost" to="/evenements">
            Participer
          </Button>
        </div>
      </div>
    </article>
  );
}
