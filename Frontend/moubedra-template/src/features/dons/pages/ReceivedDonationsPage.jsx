import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Package, PackageCheck, PackageOpen, Pencil, Smartphone, Wallet } from 'lucide-react';
import { Badge, Button, DataTable, PageHeader, Panel, SkeletonList, StatCard, Tabs, useToast } from '../../../design/components';
import { formatNumber, tnd } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import { NeedsList, getBesoins } from '../../campagnes';
import { confirmerDon, getModesPaiement, getResumeDonsRecus, listDepotsAttendus, listDonsRecus, receptionnerDepot } from '../api';
import '../dons.css';

const MODES = { ...getModesPaiement(), carte: 'Carte' };
const STATUTS = { confirme: ['ok', 'Confirmé'], en_attente: ['wait', 'À vérifier'] };

export default function ReceivedDonationsPage() {
  const toast = useToast();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('type') === 'materiel' ? 'mat' : 'money');
  // TODO(API): GET /api/dons/?campagne__organisateur=<moi> — voir features/dons/api.js (listDonsRecus, getResumeDonsRecus)
  const { data: dons, loading, setData } = useApi(listDonsRecus, [], []);
  const { data: resume } = useApi(getResumeDonsRecus, []);
  // TODO(API): dons matériels — voir features/dons/api.js (listDepotsAttendus) et features/campagnes/api.js (getBesoins)
  const { data: depots, setData: setDepots } = useApi(listDepotsAttendus, [], []);
  const { data: besoins } = useApi(() => getBesoins(1), []);
  const [flash, setFlash] = useState({});

  const verify = (d) => {
    // TODO(API): PATCH /api/dons/<id>/ — voir features/dons/api.js (confirmerDon)
    confirmerDon(d.id);
    setData((l) => l.map((x) => (x.id === d.id ? { ...x, statut: 'confirme' } : x)));
    setFlash((f) => ({ ...f, [d.id]: 'ok-flash' }));
    toast('Paiement D17 confirmé, reçu envoyé au donateur');
  };

  const receive = (m) => {
    receptionnerDepot(m.id);
    setDepots((l) => l.map((x) => (x.id === m.id ? { ...x, recu: true } : x)));
    toast('Réception confirmée, le donateur est prévenu');
  };

  return (
    <div className="pg">
      <PageHeader
        crumbs={['Mes actions', 'Dons reçus']}
        title="Dons reçus"
        subtitle="Argent et matériel, tout est tracé pour la transparence."
        actions={
          <Button variant="ghost" size="sm" icon={Download} onClick={() => toast('Export CSV en préparation')}>
            Exporter CSV
          </Button>
        }
      />
      {resume && (
        <div className="kpis2">
          <StatCard icon={Wallet} label="Collecté (total)" value={`${formatNumber(resume.collecte)} TND`} />
          <StatCard icon={Smartphone} label="D17 à vérifier" value={String(dons.filter((d) => d.statut === 'en_attente').length)} />
          <StatCard icon={Package} label="Articles reçus" value={String(resume.articles_recus)} />
          <StatCard icon={PackageOpen} label="Dépôts attendus" value={String(depots.filter((d) => !d.recu).length)} />
        </div>
      )}
      <Tabs
        label="Type de don"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'money', label: 'Argent', icon: Wallet },
          { key: 'mat', label: 'Matériel', icon: Package, count: depots.filter((d) => !d.recu).length },
        ]}
      >
        {tab === 'money' ? (
          <Panel>
            {loading ? (
              <SkeletonList />
            ) : (
              <DataTable
                caption="Dons en argent reçus"
                rows={dons}
                rowClassName={(d) => flash[d.id]}
                columns={[
                  { key: 'donateur', header: 'Donateur', render: (d) => <b style={{ color: 'var(--navy)' }}>{d.donateur_nom}</b> },
                  { key: 'campagne', header: 'Campagne', render: (d) => d.campagne_titre },
                  { key: 'mode', header: 'Mode', render: (d) => MODES[d.mode_paiement] },
                  { key: 'montant', header: 'Montant', render: (d) => <b>{tnd(d.montant)}</b> },
                  {
                    key: 'statut',
                    header: 'Statut',
                    render: (d) => {
                      const [tone, l] = d.mode_paiement === 'virement' && d.statut === 'confirme' ? ['ok', 'Reçu'] : STATUTS[d.statut] || ['grey', d.statut];
                      return (
                        <Badge tone={tone} key={d.statut} style={{ animation: flash[d.id] ? 'scale-in .3s' : undefined }}>
                          {l}
                        </Badge>
                      );
                    },
                  },
                  {
                    key: 'action',
                    header: <span className="sr-only">Action</span>,
                    align: 'right',
                    render: (d) =>
                      d.statut === 'en_attente' && (
                        <Button variant="navy" size="sm" onClick={() => verify(d)} aria-label={`Vérifier le don de ${d.donateur_nom}`}>
                          Vérifier
                        </Button>
                      ),
                  },
                ]}
              />
            )}
          </Panel>
        ) : (
          <div className="g2">
            <Panel title="Dépôts attendus" action={<Badge tone="wait">{depots.filter((d) => !d.recu).length}</Badge>}>
              <ul className="list">
                {depots.map((m) => (
                  <li className="it" key={m.id}>
                    <span className="ic2" style={{ background: 'var(--info-bg)', color: 'var(--navy)' }} aria-hidden="true">
                      <Package size={19} />
                    </span>
                    <div className="gw">
                      <h4>{m.articles}</h4>
                      <small>
                        {m.donateur_nom} · {m.quand} · {m.code}
                      </small>
                    </div>
                    {m.recu ? (
                      <Badge tone="ok">✓ Réceptionné</Badge>
                    ) : (
                      <Button variant="navy" size="sm" icon={PackageCheck} onClick={() => receive(m)}>
                        Réceptionner
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Besoins de « Cartable »">
              <NeedsList besoins={besoins} />
              <Button variant="ghost" size="sm" block icon={Pencil} style={{ marginTop: 12 }} onClick={() => toast('Modification des besoins : bientôt disponible')}>
                Modifier les besoins
              </Button>
            </Panel>
          </div>
        )}
      </Tabs>
    </div>
  );
}
