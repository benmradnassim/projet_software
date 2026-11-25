import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Badge, Button, DataTable, PageHeader, Panel, SkeletonList, useToast } from '../../../design/components';
import { useApi } from '../../../lib/useApi';
import { getRegle42, listSignalementsAdmin, traiterSignalement } from '../api';
import '../signalements.css';

const REGLE = getRegle42();
const TYPES = { publication: 'Publication', commentaire: 'Commentaire', autre: 'Profil' };

/** File des signalements (priorité, nombre de personnes) + rappel de la règle 4.2. */
export default function AdminReportsPage() {
  const toast = useToast();
  // TODO(API): remplacer par GET /api/signalements/?statut=en_attente — voir features/signalements/api.js
  const { data, loading } = useApi(listSignalementsAdmin, [], []);
  const [done, setDone] = useState({});

const act = async (s, decision) => {
    try {
      await traiterSignalement(s.id, decision);
      const label = decision === 'retirer' ? 'Retiré · auteur averti' : 'Classé sans suite';
      setDone((d) => ({ ...d, [s.id]: label }));
      toast(label);
    } catch (err) {
      toast(err?.message || 'Erreur lors du traitement du signalement');
    }
  };

  return (
    <div className="pg">
      <PageHeader crumbs={['File d’attente', 'Signalements']} title="Signalements" subtitle="Triés par priorité et par nombre de personnes qui signalent." />
      <Panel>
        {loading ? (
          <SkeletonList />
        ) : (
          <DataTable
            caption="Signalements à traiter"
            rows={data}
            rowClassName={(s) => (done[s.id] ? 'done-row' : undefined)}
            columns={[
              {
                key: 'contenu',
                header: 'Contenu',
                render: (s) => (
                  <>
                    <b style={{ color: 'var(--navy)' }}>{s.type_label || TYPES[s.type]}</b>
                    <br />
                    <small className="muted">{s.extrait}</small>
                  </>
                ),
              },
              {
                key: 'motif',
                header: 'Motif',
                render: (s) => (
                  <>
                    {s.motif}{' '}
                    {s.regle && (
                      <Badge tone="info" title="Règle de la communauté">
                        Règle {s.regle}
                      </Badge>
                    )}
                  </>
                ),
              },
              { key: 'nb', header: 'Signalé par', render: (s) => `${s.nb_signalants} personne${s.nb_signalants > 1 ? 's' : ''}` },
              { key: 'prio', header: 'Priorité', render: (s) => <Badge tone={s.priorite === 'haute' ? 'no' : 'wait'}>{s.priorite}</Badge> },
              { key: 'auteur', header: 'Auteur', render: (s) => s.auteur_nom },
              {
                key: 'action',
                header: 'Action',
                align: 'right',
                render: (s) =>
                  done[s.id] ? (
                    <span style={{ display: 'inline-block', animation: 'scale-in .3s var(--out)' }}>
                      <Badge tone={done[s.id].startsWith('Retiré') ? 'ok' : 'grey'}>{done[s.id]}</Badge>
                    </span>
                  ) : (
                    <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
                      <Button variant="ghost" size="sm" onClick={() => act(s, 'classer')}>
                        Classer ? </Button>
                      <Button variant="navy" size="sm" onClick={() => act(s, 'retirer')}>
                        Retirer ? </Button>
                    </div>
                  ),
              },
            ]}
          />
        )}
      </Panel>
      <Panel style={{ marginTop: 16, background: 'var(--mint-l)', border: 0 }} aria-labelledby="regle42">
        <h3 id="regle42" style={{ fontSize: 20, display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <ShieldCheck size={18} aria-hidden="true" /> {REGLE.titre}
        </h3>
        <p style={{ color: '#2f5426', fontSize: 15 }}>{REGLE.texte}</p>
      </Panel>
    </div>
  );
}
