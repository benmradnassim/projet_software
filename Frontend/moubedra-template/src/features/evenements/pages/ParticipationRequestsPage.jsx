import { useState } from 'react';
import { Check, CheckCheck, X } from 'lucide-react';
import { Avatar, Button, DataTable, DateBadge, EmptyState, PageHeader, Panel, ProgressBar, SkeletonList, confetti, useToast } from '../../../design/components';
import { percent } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import { deciderDemande, getEvenement, listDemandesRecues } from '../api';
import '../evenements.css';

/** Demandes de participation : accepter (QR code envoyé), refuser (annulable), tout accepter. */
export default function ParticipationRequestsPage() {
  const toast = useToast();
  // TODO(API): GET /api/participations/evenements/?statut=en_attente — voir features/evenements/api.js (listDemandesRecues)
  const { data: rows, loading, setData } = useApi(listDemandesRecues, [], []);
  const { data: ev } = useApi(() => getEvenement(3), []);
  const [accepted, setAccepted] = useState(0);
  const [flash, setFlash] = useState({});

  const decide = (d, ok, el) => {
    if (ok && el) confetti(el);
    setFlash((f) => ({ ...f, [d.id]: ok ? 'ok-flash' : 'no-flash' }));
    // TODO(API): PATCH du statut — voir features/evenements/api.js (deciderDemande)
    deciderDemande(d.id, ok ? 'acceptee' : 'refusee');
    setTimeout(() => setFlash((f) => ({ ...f, [d.id]: `${f[d.id]} leaving` })), 250);
    setTimeout(() => {
      setData((l) => l.filter((x) => x.id !== d.id));
      if (ok) setAccepted((a) => a + 1);
    }, 700);
  };

  const acceptAll = () => {
    rows.forEach((d, i) => setTimeout(() => decide(d, true), i * 150));
    setTimeout(() => toast('Toutes les demandes sont acceptées'), 700);
  };

  const cap = (ev?.nb_participants ?? 0) + accepted;

  return (
    <div className="pg">
      <PageHeader
        crumbs={['Mes actions', 'Demandes de participation']}
        title="Demandes de participation"
        subtitle="Acceptez les bénévoles : ils reçoivent automatiquement leur QR code."
        actions={
          <Button variant="navy" size="sm" icon={CheckCheck} onClick={acceptAll} disabled={!rows.length}>
            Tout accepter
          </Button>
        }
      />
      {ev && (
        <Panel style={{ marginBottom: 16 }}>
          <div className="row" style={{ gap: 16 }}>
            <DateBadge date={ev.date_evenement} />
            <div className="gw">
              <h4 style={{ font: '700 17px var(--display)', color: 'var(--navy)' }}>{ev.titre}</h4>
              <small className="muted" aria-live="polite">
                <b style={{ color: 'var(--navy)' }}>{cap}</b> / {ev.capacite} inscrits · {rows.length} en attente
              </small>
              <ProgressBar value={percent(cap, ev.capacite)} label={`${cap} inscrits sur ${ev.capacite}`} />
            </div>
          </div>
        </Panel>
      )}
      <Panel>
        {loading ? (
          <SkeletonList />
        ) : rows.length ? (
          <DataTable
            caption="Demandes en attente"
            rows={rows}
            rowClassName={(d) => flash[d.id]}
            columns={[
              {
                key: 'nom',
                header: 'Bénévole',
                render: (d) => (
                  <div className="row" style={{ gap: 10 }}>
                    <Avatar name={d.utilisateur_nom} color={d.couleur} size={36} />
                    <b style={{ color: 'var(--navy)' }}>{d.utilisateur_nom}</b>
                  </div>
                ),
              },
              { key: 'experience', header: 'Expérience' },
              { key: 'motif', header: 'Message', render: (d) => <span style={{ color: 'var(--muted)', fontSize: 14 }}>{d.motif || '—'}</span> },
              { key: 'date', header: 'Demandé', render: (d) => <span className="muted">{d.date_demande}</span> },
              {
                key: 'actions',
                header: 'Décision',
                align: 'right',
                render: (d) => (
                  <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
                    <button
                      type="button"
                      className="kob"
                      aria-label={`Refuser ${d.utilisateur_nom}`}
                      onClick={() => {
                        decide(d, false);
                        toast('Demande refusée', {
                          undo: () => {
                            setFlash((f) => ({ ...f, [d.id]: undefined }));
                            setData((l) => [d, ...l]);
                          },
                        });
                      }}
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="okb"
                      aria-label={`Accepter ${d.utilisateur_nom}`}
                      onClick={(e) => {
                        decide(d, true, e.currentTarget);
                        toast('Accepté·e : QR code envoyé par e-mail');
                      }}
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
