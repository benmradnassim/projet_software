import { useEffect, useState } from 'react';
import { Check, CheckCheck, X } from 'lucide-react';
import { Avatar, Button, DataTable, EmptyState, PageHeader, Panel, SkeletonList, confetti, useToast } from '../../../design/components';
import { useApi } from '../../../lib/useApi';
import { deciderDemande, listDemandesRecues } from '../api';
import '../evenements.css';

/** Demandes de participation : accepter (QR code envoyé), refuser (annulable), tout accepter. */
export default function ParticipationRequestsPage() {
  const toast = useToast();
  const { data: rows, loading, error, reload, setData } = useApi(listDemandesRecues, [], []);
  const [flash, setFlash] = useState({});
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) reload();
    };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [reload]);

  const decide = async (d, ok, el) => {
    setProcessing((state) => ({ ...state, [d.id_liste]: true }));
    try {
      await deciderDemande(d.id, ok ? 'acceptee' : 'refusee', d.type_liste);
      if (ok && el) confetti(el);
      setFlash((state) => ({ ...state, [d.id_liste]: ok ? 'ok-flash' : 'no-flash' }));
      setTimeout(() => setFlash((state) => ({ ...state, [d.id_liste]: `${state[d.id_liste]} leaving` })), 250);
      setTimeout(() => setData((items) => items.filter((item) => item.id_liste !== d.id_liste)), 700);
      toast(ok ? 'Participation acceptée.' : 'Participation refusée.');
      return true;
    } catch (error) {
      toast(error.message || "Impossible d'enregistrer la décision.");
      return false;
    } finally {
      setProcessing((state) => ({ ...state, [d.id_liste]: false }));
    }
  };

  const acceptAll = async () => {
    const results = await Promise.all(rows.map((d) => decide(d, true)));
    if (results.every(Boolean)) toast('Toutes les demandes sont acceptées.');
  };

  return (
    <div className="pg">
      <PageHeader
        crumbs={['Mes actions', 'Demandes de participation']}
        title="Demandes de participation"
        subtitle="Consultez et traitez les demandes de participation à vos campagnes et événements."
        actions={
          <Button variant="navy" size="sm" icon={CheckCheck} onClick={acceptAll} disabled={!rows.length}>
            Tout accepter
          </Button>
        }
      />
      <Panel>
        {loading ? (
          <SkeletonList />
        ) : error ? (
          <EmptyState image="campagnes" title="Demandes indisponibles" text={error.message || 'Impossible de charger les demandes.'} />
        ) : rows.length ? (
          <DataTable
            caption="Demandes en attente"
            rows={rows}
            rowKey="id_liste"
            rowClassName={(d) => flash[d.id_liste]}
            columns={[
              {
                key: 'nom',
                header: 'Participant·e',
                render: (d) => (
                  <div className="row" style={{ gap: 10 }}>
                    <Avatar name={`${d.prenom || ''} ${d.nom || ''}`.trim()} color={d.couleur} size={36} />
                    <div>
                      <b style={{ color: 'var(--navy)' }}>{`${d.prenom || ''} ${d.nom || ''}`.trim() || `Participant #${d.utilisateur}`}</b>
                      <small style={{ display: 'block', color: 'var(--muted)' }}>{d.telephone}</small>
                    </div>
                  </div>
                ),
              },
              {
                key: 'objet',
                header: 'Demande pour',
                render: (d) => <span>{d.campagne_detail?.titre || d.evenement_detail?.titre || 'Objet introuvable'}</span>,
              },
              { key: 'type', header: 'Type', render: (d) => <span>{d.type || '—'}</span> },
              { key: 'motif', header: 'Message', render: (d) => <span style={{ color: 'var(--muted)', fontSize: 14 }}>{d.motif || '—'}</span> },
              { key: 'date', header: 'Demandé', render: (d) => <span className="muted">{new Date(d.date_demande).toLocaleDateString('fr-TN')}</span> },
              {
                key: 'actions',
                header: 'Décision',
                align: 'right',
                render: (d) => (
                  <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
                    <button
                      type="button"
                      className="kob"
                      aria-label={`Refuser ${d.prenom || ''} ${d.nom || ''}`}
                      disabled={processing[d.id_liste]}
                      onClick={() => decide(d, false)}
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="okb"
                      aria-label={`Accepter ${d.prenom || ''} ${d.nom || ''}`}
                      disabled={processing[d.id_liste]}
                      onClick={(e) => decide(d, true, e.currentTarget)}
                    >
                      <Check size={18} aria-hidden="true" />
                    </button>
                  </div>
                ),
              },
            ]}
          />
        ) : (
          <EmptyState image="campagnes" title="Aucune demande en attente" text="Les nouvelles demandes apparaîtront ici." />
        )}
      </Panel>
    </div>
  );
}
