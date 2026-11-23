import { Badge, EmptyState, PageHeader, Panel, SkeletonList } from '../../../design/components';
import { useApi } from '../../../lib/useApi';
import { listMesSignalements } from '../api';
import ReportItem from '../components/ReportItem';

const STATUTS = { en_attente: ['wait', 'En attente'], en_cours: ['wait', 'En cours d’examen'], resolu: ['ok', 'Traité · retiré'], rejete: ['grey', 'Classé sans suite'] };

export default function MyReportsPage() {
  // TODO(API): remplacer par GET /api/signalements/ — voir features/signalements/api.js (listMesSignalements)
  const { data, loading } = useApi(listMesSignalements, [], []);
  return (
    <div className="pg">
      <PageHeader crumbs={['Communauté', 'Mes signalements']} title="Mes signalements" subtitle="Suivez ce que vous avez signalé à l’équipe de modération." />
      <Panel>
        {loading ? (
          <SkeletonList />
        ) : data.length ? (
          <ul className="list">
            {data.map((s) => {
              const [tone, label] = STATUTS[s.statut];
              return (
                <ReportItem
                  key={s.id}
                  s={s}
                  aside={
                    <div style={{ textAlign: 'right' }}>
                      <Badge tone={tone}>{s.resultat || label}</Badge>
                      <small style={{ display: 'block', marginTop: 6 }}>{s.quand}</small>
                    </div>
                  }
                />
              );
            })}
          </ul>
        ) : (
          <EmptyState image="fil" title="Aucun signalement" text="Utilisez le menu ⋯ d’une publication pour signaler un contenu." />
        )}
      </Panel>
    </div>
  );
}
