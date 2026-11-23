import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BadgeCheck, Download, Heart, Package, QrCode, Receipt, Wallet } from 'lucide-react';
import { Badge, Button, EmptyState, PageHeader, Panel, SkeletonList, StatCard, StatutBadge, Tabs, useToast } from '../../../design/components';
import { formatDate, tnd } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import { listBesoins, listCampagnes } from '../../campagnes';
import { getModesPaiement, getResumeMesDons, listMesDons, listMesDonsMateriels } from '../api';
import MaterialProgress from '../components/MaterialProgress';
import '../dons.css';

const MODES = getModesPaiement();
const REMISES = { point: 'point de collecte', event: 'à l’événement', post: 'Rapid-Poste' };

export default function MyDonationsPage() {
  const toast = useToast();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('onglet') === 'materiel' ? 'mat' : 'all');
  // TODO(API): GET /api/dons/ — voir features/dons/api.js (listMesDons, getResumeMesDons)
  const { data: dons, loading } = useApi(listMesDons, [], []);
  const { data: resume } = useApi(getResumeMesDons, []);
  // TODO(API): pas encore de modèle « don matériel » — voir features/dons/api.js (listMesDonsMateriels)
  const { data: mats } = useApi(listMesDonsMateriels, [], []);
  const { data: campagnes } = useApi(listCampagnes, [], []);
  const { data: besoins } = useApi(listBesoins, [], {});
  const camp = (id) => campagnes.find((c) => c.id === id);

  const list = dons.filter((d) => tab === 'all' || (tab === 'wait' && d.statut === 'en_attente') || (tab === 'rec' && d.recurrent));

  const label = (m) => {
    const B = besoins[m.campagne];
    if (!B) return 'Don matériel';
    return B.items
      .map((it, k) => (m.quantites[k] ? `${m.quantites[k]} ${m.quantites[k] > 1 ? it.libelle.toLowerCase() : it.singulier}` : null))
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="pg">
      <PageHeader
        crumbs={['Agir', 'Mes dons']}
        title="Mes dons"
        subtitle="Tous vos dons et vos reçus au même endroit."
        actions={
          <Button variant="ghost" size="sm" icon={Download} onClick={() => toast('Export de l’année 2026 en préparation')}>
            Exporter (année 2026)
          </Button>
        }
      />
      {resume && (
        <div className="kpis2">
          <StatCard icon={Wallet} label="Total donné en 2026" value={tnd(resume.total_annee)} />
          <StatCard icon={Heart} label="Dons" value={String(resume.nb_dons)} />
          <StatCard icon={BadgeCheck} label="Campagnes soutenues" value={String(resume.nb_campagnes)} />
          <StatCard icon={Receipt} label="Reçus disponibles" value={String(resume.nb_recus)} />
        </div>
      )}
      <Tabs
        label="Filtrer mes dons"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'all', label: 'Tous' },
          { key: 'wait', label: 'En attente' },
          { key: 'mat', label: 'Matériel', icon: Package, count: mats.length },
          { key: 'rec', label: 'Mensuels' },
        ]}
      >
        {loading ? (
          <Panel>
            <SkeletonList />
          </Panel>
        ) : tab === 'mat' ? (
          <Panel>
            <ul className="list">
              {mats.map((m) => {
                const c = camp(m.campagne);
                return (
                  <li className="it top" key={m.id}>
                    <img className="thumb" src={c?.image} alt="" style={{ objectPosition: c?.image_position }} />
                    <div className="gw">
                      <h4>{label(m)}</h4>
                      <small>
                        {c?.titre} · {REMISES[m.remise]}
                      </small>
                      <div style={{ maxWidth: 420, marginTop: 6 }}>
                        <MaterialProgress etape={m.etape} />
                      </div>
                    </div>
                    <Badge tone={m.etape ? 'ok' : 'wait'}>{m.etape ? 'Réceptionné' : 'À déposer'}</Badge>
                    {!m.etape && (
                      <Button variant="navy" size="sm" icon={QrCode} onClick={() => toast(`Code de dépôt : ${m.code}`)}>
                        Code de dépôt
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>
        ) : list.length ? (
          <Panel>
            <ul className="list">
              {list.map((d) => {
                const c = camp(d.campagne);
                return (
                  <li className="it" key={d.id}>
                    <img className="thumb" src={c?.image} alt="" style={{ objectPosition: c?.image_position }} />
                    <div className="gw">
                      <h4>{c?.titre}</h4>
                      <small>
                        {formatDate(d.date_don, { year: false })} · {MODES[d.mode_paiement]}
                      </small>
                    </div>
                    <b style={{ font: '800 18px var(--display)', color: 'var(--navy)' }}>{tnd(d.montant)}</b>
                    <StatutBadge statut={d.statut} />
                    {d.statut === 'confirme' ? (
                      <Button variant="ghost" size="sm" icon={Download} onClick={() => toast('Le reçu PDF sera disponible une fois l’API branchée')}>
                        Reçu
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => toast('Nouvelle demande de paiement envoyée à D17')}>
                        Relancer D17
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>
        ) : (
          <EmptyState
            image="dons"
            title={tab === 'rec' ? 'Pas encore de don mensuel' : 'Aucun don en attente'}
            text={tab === 'rec' ? 'Un petit don chaque mois aide les associations à prévoir leurs actions. Vous pouvez arrêter quand vous voulez.' : 'Tous vos dons sont confirmés.'}
            actions={
              <Button size="sm" icon={Heart} to="/campagnes">
                Choisir une campagne
              </Button>
            }
          />
        )}
      </Tabs>
    </div>
  );
}
