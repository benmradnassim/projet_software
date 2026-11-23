import { useMemo, useState } from 'react';
import { Map as MapIcon } from 'lucide-react';
import { Button, Chip, EmptyState, PageHeader, Select, SkeletonList, useToast } from '../../../design/components';
import { daysLeft } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import { listEvenements } from '../api';
import EventRow from '../components/EventRow';
import '../evenements.css';

const FILTRES = [
  ['all', 'Tous'],
  ['week', 'Cette semaine'],
  ['month', 'Ce mois-ci'],
  ['urgent', 'Urgents'],
];

export default function EventsPage() {
  const toast = useToast();
  // TODO(API): remplacer par GET /api/evenements/ — voir features/evenements/api.js (listEvenements)
  const { data, loading } = useApi(() => listEvenements(), [], []);
  const [k, setK] = useState('all');
  const [region, setRegion] = useState('');
  const regions = useMemo(() => [...new Set(data.map((e) => e.ville))].sort(), [data]);

  const list = data.filter((e) => {
    const d = daysLeft(e.date_evenement);
    const okK = k === 'all' || (k === 'urgent' ? e.urgent : k === 'week' ? d <= 7 : d <= 31);
    return okK && (!region || e.ville === region);
  });

  return (
    <div className="pg">
      <PageHeader
        crumbs={['Agir', 'Événements']}
        title="Événements bénévoles"
        subtitle="Donnez quelques heures, près de chez vous."
        actions={
          <Button variant="ghost" size="sm" icon={MapIcon} onClick={() => toast('La vue carte arrive bientôt')}>
            Carte
          </Button>
        }
      />
      <div className="row" style={{ marginBottom: 16, gap: 8, flexWrap: 'wrap' }} role="group" aria-label="Filtrer les événements">
        {FILTRES.map(([key, l]) => (
          <Chip key={key} active={k === key} onClick={() => setK(key)}>
            {l}
          </Chip>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <Select label="Région" hideLabel size="sm" value={region} onChange={(e) => setRegion(e.target.value)} options={regions} placeholder="Toutes les régions" />
        </div>
      </div>
      <div className="evl" aria-live="polite" aria-busy={loading}>
        {loading ? (
          <div className="panel">
            <SkeletonList />
          </div>
        ) : list.length ? (
          list.map((e, i) => <EventRow key={e.id} evenement={e} index={i} />)
        ) : (
          <EmptyState image="campagnes" title="Aucun événement ici pour le moment" text="Activez une alerte pour être prévenu·e." />
        )}
      </div>
    </div>
  );
}
