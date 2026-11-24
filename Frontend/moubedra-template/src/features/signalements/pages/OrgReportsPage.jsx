import { Image } from 'lucide-react';
import { Badge, Button, PageHeader, Panel, SkeletonList, useToast } from '../../../design/components';
import { useApi } from '../../../lib/useApi';
import { listSignalementsOrganisateur } from '../api';
import ReportItem from '../components/ReportItem';

export default function OrgReportsPage() {
  const toast = useToast();
  // TODO(API): remplacer par GET /api/signalements/?campagne__organisateur=<moi> — voir features/signalements/api.js
  const { data, loading } = useApi(listSignalementsOrganisateur, [], []);
  return (
    <div className="pg">
      <PageHeader crumbs={['Communauté', 'Signalements']} title="Signalements sur mes contenus" subtitle="Répondez avant la décision de la modération." />
<Panel>
        {loading ? (
          <SkeletonList />
        ) : data.length ? (
          <ul className="list">
            {data.map((s) => (
              <ReportItem
                key={s.id}
                s={s}
                signale={false}
                tone={s.a_traiter ? ['#fde8e4', '#b8371f'] : ['#e5f1e1', '#3d6d31']}
                aside={<Badge tone={s.a_traiter ? 'wait' : 'ok'}>{s.a_traiter ? 'À traiter' : 'Résolu'}</Badge>}
              >
                {s.a_traiter && (
                  <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <Button variant="navy" size="sm" icon={Image} onClick={() => toast('Remplacement de photo : bientôt disponible')}>
                      Remplacer la photo
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toast('Réponse envoyée à la modération')}>
                      Répondre à la modération
                    </Button>
                  </div>
                )}
              </ReportItem>
            ))}
          </ul>
        ) : (
          <p className="muted">Aucun signalement enregistré sur vos contenus pour le moment.</p>
        )}
      </Panel>
    </div>
  );
}
