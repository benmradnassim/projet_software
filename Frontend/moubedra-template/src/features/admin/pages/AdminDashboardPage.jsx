import { Download } from 'lucide-react';
import { BarChart, Button, Icon, PageHeader, Panel, ProgressBar, SkeletonList, StatCard, TodoCards, useToast } from '../../../design/components';
import { useApi } from '../../../lib/useApi';
import { getVueEnsemble } from '../api';

const today = () => new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

/** Vue d'ensemble admin : files d'attente, indicateurs, activité, dons par gouvernorat, journal. */
export default function AdminDashboardPage() {
  const toast = useToast();
  // TODO(API): agrégats — voir features/admin/api.js (getVueEnsemble)
  const { data, loading } = useApi(getVueEnsemble, []);

  return (
    <div className="pg">
      <PageHeader
        crumbs={['Administration']}
        title="Vue d’ensemble"
        subtitle={`La plateforme en un coup d’œil · ${today()}`}
        actions={
          <Button variant="ghost" size="sm" icon={Download} onClick={() => toast('Rapport mensuel en préparation')}>
            Rapport mensuel ? </Button>
        }
      />
      {loading || !data ? (
        <Panel>
          <SkeletonList rows={4} />
        </Panel>
      ) : (
        <>
          <TodoCards items={data.a_faire} />
          <div className="kpis2">
            {data.kpis.map((k) => (
              <StatCard key={k.libelle} icon={(p) => <Icon name={k.icone} {...p} />} label={k.libelle} value={k.valeur} trend={k.tendance} />
            ))}
          </div>
          <div className="g2">
            <Panel title="Activité des 8 dernières semaines">
              <BarChart title="Dons par semaine en milliers de TND" values={data.graphique.valeurs} labels={data.graphique.semaines} max={data.graphique.max} format={(v) => `${v}k`} />
            </Panel>
            <Panel title="Dons par gouvernorat">
              {data.par_gouvernorat.map(([g, p]) => (
                <div className="fr2" style={{ gridTemplateColumns: '90px 1fr 44px' }} key={g}>
                  <span>{g}</span>
                  <ProgressBar value={p * 2.5} label={`${g} : ${p} % des dons`} />
                  <b>{p} %</b>
                </div>
              ))}
            </Panel>
          </div>
          <Panel title="Journal d’activité" style={{ marginTop: 20 }}>
            <ul className="list">
              {data.journal.map((a) => (
                <li className="it" key={a.texte}>
                  <span className="ic2" style={{ background: a.fond, color: a.couleur }} aria-hidden="true">
                    <Icon name={a.icone} size={19} />
                  </span>
                  <div className="gw">
                    <h4>{a.texte}</h4>
                    <small>{a.quand}</small>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </>
      )}
    </div>
  );
}
