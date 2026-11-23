import { useState } from 'react';
import { QrCode } from 'lucide-react';
import { Badge, Button, DateBadge, EmptyState, PageHeader, SkeletonList, Tabs, useToast } from '../../../design/components';
import { useApi } from '../../../lib/useApi';
import { annulerParticipation, listMesParticipations } from '../api';
import { horaire } from '../components/EventRow';
import '../evenements.css';

/** Onglet d'une participation : à venir, en attente ou passée. */
function bucket(p) {
  const e = p.evenement_detail;
  if (p.statut === 'en_attente') return 'wait';
  if (p.statut === 'acceptee' && e.statut !== 'termine' && new Date(e.date_evenement) > new Date()) return 'up';
  if (p.statut === 'annulee') return null;
  return 'past';
}

function badge(p) {
  if (p.statut === 'en_attente') return ['wait', 'En attente'];
  if (p.statut === 'refusee') return ['no', `Refusée${p.raison ? ` · ${p.raison}` : ''}`];
  if (p.evenement_detail.statut === 'termine') return ['grey', 'Terminée · merci !'];
  return ['ok', 'Acceptée'];
}

export default function MyParticipationsPage() {
  const toast = useToast();
  // TODO(API): remplacer par GET /api/participations/evenements/ — voir features/evenements/api.js (listMesParticipations)
  const { data, loading, setData } = useApi(listMesParticipations, [], []);
  const [tab, setTab] = useState('up');
  const [cancelled, setCancelled] = useState(() => new Set());
  const count = (k) => data.filter((p) => bucket(p) === k).length;
  const list = data.filter((p) => bucket(p) === tab);

  const cancel = (p) => {
    setCancelled((s) => new Set(s).add(p.id));
    const t = setTimeout(() => {
      // TODO(API): DELETE /api/participations/evenements/<id>/ — voir features/evenements/api.js (annulerParticipation)
      annulerParticipation(p.id);
      setData((l) => l.map((x) => (x.id === p.id ? { ...x, statut: 'annulee' } : x)));
    }, 5300);
    toast('Demande annulée', {
      undo: () => {
        clearTimeout(t);
        setCancelled((s) => {
          const n = new Set(s);
          n.delete(p.id);
          return n;
        });
      },
    });
  };

  return (
    <div className="pg">
      <PageHeader crumbs={['Agir', 'Mes participations']} title="Mes participations" subtitle="Vos demandes de bénévolat et vos accès aux événements." />
      <Tabs
        label="Mes participations"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'up', label: 'À venir', count: count('up') },
          { key: 'wait', label: 'En attente', count: count('wait') },
          { key: 'past', label: 'Passées', count: count('past') },
        ]}
      >
        <div className="panel">
          {loading ? (
            <SkeletonList />
          ) : list.length ? (
            <ul className="list">
              {list.map((p) => {
                const e = p.evenement_detail;
                const [tone, label] = badge(p);
                if (cancelled.has(p.id)) {
                  return (
                    <li key={p.id} className="it">
                      <div className="gw muted">Demande annulée.</div>
                    </li>
                  );
                }
                return (
                  <li key={p.id} className="it">
                    <DateBadge date={e.date_evenement} />
                    <div className="gw">
                      <h4>{e.titre}</h4>
                      <small>
                        {horaire(e)} · {e.lieu}
                      </small>
                    </div>
                    <Badge tone={tone}>{label}</Badge>
                    {tab === 'up' && (
                      <Button variant="navy" size="sm" icon={QrCode} to={`/evenements/${e.id}`}>
                        QR code
                      </Button>
                    )}
                    {tab === 'wait' && (
                      <Button variant="ghost" size="sm" onClick={() => cancel(p)}>
                        Annuler
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState image="campagnes" title="Rien ici pour le moment" text="Inscrivez-vous à un événement près de chez vous." actions={<Button to="/evenements" size="sm">Voir les événements</Button>} />
          )}
        </div>
      </Tabs>
    </div>
  );
}
