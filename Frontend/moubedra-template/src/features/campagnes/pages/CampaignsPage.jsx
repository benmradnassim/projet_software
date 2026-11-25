import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bell, Heart, Package, Search } from 'lucide-react';
import { Button, Chip, EmptyState, PageHeader, Select, Skeleton, useToast } from '../../../design/components';
import { useApi } from '../../../lib/useApi';
import { categorieCode, getCategories, listBesoins, listCampagnes, listFavoris, toggleFavori } from '../api';
import CampaignCard, { isTerminee, pctCampagne } from '../components/CampaignCard';
import '../campagnes.css';

const CATS = getCategories();

export default function CampaignsPage() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  // TODO(API): remplacer par GET /api/campagnes/ — voir features/campagnes/api.js (listCampagnes)
  const { data: campagnes, loading } = useApi(listCampagnes, [], []);
  // TODO(API): besoins matériels et favoris — pas encore d'endpoint (voir features/campagnes/api.js)
  const { data: besoins } = useApi(listBesoins, [], {});
  const { data: favIds, setData: setFav } = useApi(listFavoris, [], []);

  const [q, setQ] = useState(params.get('q') || '');
  const [region, setRegion] = useState(params.get('ville') || '');
  const [sort, setSort] = useState('end');
  const [k, setK] = useState(params.get('categorie') || 'all');

  const regions = useMemo(() => [...new Set(campagnes.map((c) => c.ville))].sort().concat(['Tozeur']), [campagnes]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const L = campagnes.filter(
      (c) =>
        (k === 'all' || (k === 'fav' ? favIds.includes(c.id) : k === 'mat' ? besoins[c.id] && !isTerminee(c) : categorieCode(c.categorie) === k)) &&
        (!region || c.ville === region) &&
        (!s || `${c.titre} ${c.ville} ${c.organisation}`.toLowerCase().includes(s)),
    );
    return [...L].sort((a, b) =>
      sort === 'pct' ? pctCampagne(b) - pctCampagne(a) : sort === 'new' ? b.cree_le.localeCompare(a.cree_le) : Number(isTerminee(a)) - Number(isTerminee(b)) || a.jours_restants - b.jours_restants,
    );
  }, [campagnes, k, region, q, sort, favIds, besoins]);

  const reset = () => {
    setQ('');
    setRegion('');
    setK('all');
    setParams({}, { replace: true });
  };

  const onFav = async (c) => {
    const on = !favIds.includes(c.id);
    setFav((f) => (on ? [...f, c.id] : f.filter((x) => x !== c.id)));
    toast(on ? 'Campagne enregistrée' : 'Retirée des favoris');
    await toggleFavori(c.id);
  };

  return (
    <div className="pg">
      <PageHeader crumbs={['Agir', 'Campagnes']} title="Campagnes solidaires" subtitle={<span aria-live="polite">{loading ? '…' : list.length} initiatives partout en Tunisie</span>} />

      <div className="panel" style={{ padding: 16 }}>
        <div className="fbar2" role="search">
          <label className="srch">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Rechercher</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une campagne, une ville, une association…" />
          </label>
          <Select label="Région" hideLabel value={region} onChange={(e) => setRegion(e.target.value)} options={regions} placeholder="Toutes les régions" />
          <Select
            label="Trier"
            hideLabel
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            options={[
              { value: 'end', label: 'Se termine bientôt' },
              { value: 'pct', label: 'Presque financées' },
              { value: 'new', label: 'Plus récentes' },
            ]}
          />
        </div>
        <div className="chips" style={{ marginTop: 14 }} role="group" aria-label="Catégories">
          <Chip active={k === 'all'} onClick={() => setK('all')}>
            Toutes · {campagnes.length}
          </Chip>
          {CATS.map((c) => (
            <Chip key={c.code} active={k === c.code} onClick={() => setK(c.code)}>
              {c.label} · {campagnes.filter((x) => categorieCode(x.categorie) === c.code).length}
            </Chip>
          ))}
          <Chip active={k === 'mat'} icon={Package} onClick={() => setK('mat')}>
            Dons matériels ? </Chip>
          <Chip active={k === 'fav'} icon={Heart} onClick={() => setK('fav')}>
            Mes favoris ? </Chip>
        </div>
      </div>

      {loading ? (
        <div className="grid3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={360} radius={20} />
          ))}
        </div>
      ) : list.length ? (
        <div className="grid3">
          {list.map((c, i) => (
            <CampaignCard key={c.id} campagne={c} index={i} favori={favIds.includes(c.id)} onFavori={() => onFav(c)} materiel={!!besoins[c.id]} />
          ))}
        </div>
      ) : (
        <EmptyState
          image="campagnes"
          title={region ? `Pas encore de campagne à ${region}` : k === 'fav' ? 'Aucun favori pour l’instant' : 'Aucun résultat'}
          text={region ? 'Soyez prévenu·e dès qu’une association lance une action dans votre région.' : 'Essayez un autre mot-clé ou une autre catégorie.'}
          actions={
            <>
              <Button variant="navy" size="sm" icon={Bell} onClick={() => toast('Alerte créée : vous serez prévenu·e')}>
                Créer une alerte ? </Button>
              <Button variant="ghost" size="sm" onClick={reset}>
                Tout effacer ? </Button>
            </>
          }
        />
      )}
    </div>
  );
}
