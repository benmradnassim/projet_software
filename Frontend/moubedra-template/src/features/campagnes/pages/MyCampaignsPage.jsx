import { useState } from 'react';
import { Copy, Eye, ImagePlus, Pencil, Plus } from 'lucide-react';
import { Badge, Button, PageHeader, ProgressBar, SkeletonList, Tabs, useToast } from '../../../design/components';
import { formatNumber } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import { listMesCampagnes } from '../api';
import { pctCampagne } from '../components/CampaignCard';
import '../campagnes.css';

const ETATS = { live: ['ok', 'En cours'], review: ['info', 'En revue admin'], draft: ['wait', 'Brouillon'], done: ['grey', 'Terminée'] };

function Row({ c, index }) {
  const toast = useToast();
  const p = pctCampagne(c);
  const [tone, label] = ETATS[c.etat];
  return (
    <div className="mc" style={{ animationDelay: `${index * 0.05}s` }}>
      {c.image ? (
        <img src={c.image} alt="" style={{ objectPosition: c.image_position || 'center' }} />
      ) : (
        <div className="noimg">
          <ImagePlus size={26} aria-label="Pas de photo" />
        </div>
      )}
      <div>
        <h3>{c.titre}</h3>
        <div className="meta2">
          {c.categorie} {c.etat === 'live' && `· ${c.nb_donateurs} donateurs · ${c.jours_restants} jours restants`}
        </div>
        <Badge tone={tone} style={{ marginTop: 6 }}>
          {label}
          {c.etat === 'draft' && ` · ${c.progression} %`}
        </Badge>
      </div>
      <div>
        {c.etat === 'draft' ? (
          <>
            <small className="muted">Il manque : {c.manque}</small>
            <ProgressBar value={c.progression} label={`Brouillon complété à ${c.progression} %`} />
          </>
        ) : c.etat === 'review' ? (
          <small className="muted">Envoyée il y a 1 j · réponse sous 48 h</small>
        ) : (
          <>
            <b style={{ font: '800 17px var(--display)', color: 'var(--navy)' }}>
              {formatNumber(c.montant_collecte)} / {formatNumber(c.objectif_montant)} TND
            </b>
            <ProgressBar value={Math.min(100, p)} label={`${p} % financé`} />
          </>
        )}
      </div>
      <div className="row" style={{ gap: 8 }}>
        {c.etat === 'draft' && (
          <Button size="sm" to="/organisateur/campagnes/nouvelle">
            Terminer
          </Button>
        )}
        {c.etat === 'live' && (
          <>
            <Button variant="soft" size="sm" icon={Eye} to={`/campagnes/${c.id}`}>
              Voir
            </Button>
            <Button variant="ghost" size="sm" icon={Pencil} to="/communaute">
              Publier une nouvelle
            </Button>
          </>
        )}
        {c.etat === 'done' && (
          <Button variant="ghost" size="sm" icon={Copy} onClick={() => toast('Campagne dupliquée en brouillon')}>
            Dupliquer
          </Button>
        )}
        {c.etat === 'review' && (
          <Button variant="ghost" size="sm" icon={Pencil} onClick={() => toast('Modification possible pendant la revue')}>
            Modifier
          </Button>
        )}
      </div>
    </div>
  );
}

export default function MyCampaignsPage() {
  // TODO(API): remplacer par GET /api/campagnes/?organisateur=<moi> — voir features/campagnes/api.js (listMesCampagnes)
  const { data, loading } = useApi(listMesCampagnes, [], []);
  const [tab, setTab] = useState('all');
  const count = (k) => data.filter((c) => c.etat === k).length;
  const tabs = [
    { key: 'all', label: 'Toutes', count: data.length },
    { key: 'live', label: 'En cours', count: count('live') },
    { key: 'draft', label: 'Brouillons', count: count('draft') },
    { key: 'review', label: 'En revue', count: count('review') },
    { key: 'done', label: 'Terminées', count: count('done') },
  ];
  const list = data.filter((c) => tab === 'all' || c.etat === tab);
  return (
    <div className="pg">
      <PageHeader
        crumbs={['Mes actions', 'Mes campagnes']}
        title="Mes campagnes"
        subtitle="Suivez, modifiez et publiez vos campagnes."
        actions={
          <Button to="/organisateur/campagnes/nouvelle" icon={Plus}>
            Nouvelle campagne
          </Button>
        }
      />
      <Tabs tabs={tabs} value={tab} onChange={setTab} label="Filtrer mes campagnes">
        {loading ? (
          <div className="panel">
            <SkeletonList />
          </div>
        ) : list.length ? (
          list.map((c, i) => <Row key={c.id} c={c} index={i} />)
        ) : (
          <p className="panel muted">Aucune campagne dans cette catégorie.</p>
        )}
      </Tabs>
    </div>
  );
}
