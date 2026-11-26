import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, CheckCheck, QrCode, X } from 'lucide-react';
import { Avatar, Badge, Button, DataTable, EmptyState, Input, PageHeader, Panel, SkeletonList, confetti, useToast } from '../../../design/components';
import { useApi } from '../../../lib/useApi';
import { deciderDemande, listDemandesRecues, verifyParticipationQr } from '../api';
import '../evenements.css';

const TYPES = { benevole: 'Bénévole', don_materiel: 'Don matériel', accompagnement: 'Accompagnement', autre: 'Autre' };
const nomComplet = (d) => `${d.prenom || ''} ${d.nom || ''}`.trim() || d.utilisateur_nom || `Participant #${d.utilisateur}`;

/**
 * Demandes de participation reçues (événements et campagnes) :
 * accepter (le QR code est généré), refuser, tout accepter, et vérifier un QR code le jour J.
 * `?evenement=<id>` limite la liste aux demandes d'un événement.
 */
export default function ParticipationRequestsPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const eventFilter = searchParams.get('evenement') || '';
  const { data: rows, loading, error, reload, setData } = useApi(
    () => listDemandesRecues(eventFilter ? { evenement: eventFilter } : {}),
    [eventFilter],
    [],
  );
  const [flash, setFlash] = useState({});
  const [processing, setProcessing] = useState({});
  const [qrCode, setQrCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);

  // Les demandes arrivent pendant que l'onglet est ouvert : on recharge au retour sur la page.
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
    } catch (err) {
      toast(err.message || "Impossible d'enregistrer la décision.");
      return false;
    } finally {
      setProcessing((state) => ({ ...state, [d.id_liste]: false }));
    }
  };

  const acceptAll = async () => {
    const results = await Promise.all(rows.map((d) => decide(d, true)));
    if (results.every(Boolean)) toast('Toutes les demandes sont acceptées.');
  };

  const onVerify = async (e) => {
    e.preventDefault();
    if (!qrCode.trim()) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await verifyParticipationQr(qrCode.trim());
      if (res?.valide && eventFilter && String(res.participation?.evenement) !== String(eventFilter)) {
        setVerifyResult({ valide: false, detail: 'Ce QR code appartient à un autre événement.' });
        return;
      }
      setVerifyResult(res);
      if (res?.valide) toast(res.message || 'Présence confirmée.');
    } catch (err) {
      setVerifyResult({ valide: false, detail: err.message || 'Vérification impossible.' });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="pg">
      <PageHeader
        crumbs={['Mes actions', 'Demandes de participation']}
        title="Demandes de participation"
        subtitle={eventFilter
          ? 'Demandes en attente pour cet événement.'
          : 'Consultez et traitez les demandes de participation à vos campagnes et événements.'}
        actions={
          <>
            {eventFilter && <Button variant="ghost" size="sm" to="/organisateur/demandes">Toutes les demandes</Button>}
            <Button variant="navy" size="sm" icon={CheckCheck} onClick={acceptAll} disabled={!rows.length}>
              Tout accepter
            </Button>
          </>
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
                    <Avatar name={nomComplet(d)} color={d.couleur} size={36} />
                    <div>
                      <b style={{ color: 'var(--navy)' }}>{nomComplet(d)}</b>
                      <small style={{ display: 'block', color: 'var(--muted)' }}>{d.telephone}</small>
                    </div>
                  </div>
                ),
              },
              {
                key: 'objet',
                header: 'Demande pour',
                render: (d) => (
                  <span>
                    {d.campagne_detail?.titre || d.evenement_detail?.titre || 'Objet introuvable'}
                    <small style={{ display: 'block', color: 'var(--muted)' }}>{d.type_liste === 'campagne' ? 'Campagne' : 'Événement'}</small>
                  </span>
                ),
              },
              { key: 'type', header: 'Type', render: (d) => <span>{TYPES[d.type] || d.type || '—'}</span> },
              { key: 'motif', header: 'Message', render: (d) => <span style={{ color: 'var(--muted)', fontSize: 14 }}>{d.motif || '—'}</span> },
              { key: 'date', header: 'Demandé', render: (d) => <span className="muted">{d.date_demande ? new Date(d.date_demande).toLocaleDateString('fr-TN') : '—'}</span> },
              {
                key: 'actions',
                header: 'Décision',
                align: 'right',
                render: (d) => (
                  <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
                    <button type="button" className="kob" aria-label={`Refuser ${nomComplet(d)}`} disabled={processing[d.id_liste]} onClick={() => decide(d, false)}>
                      <X size={18} aria-hidden="true" />
                    </button>
                    <button type="button" className="okb" aria-label={`Accepter ${nomComplet(d)}`} disabled={processing[d.id_liste]} onClick={(e) => decide(d, true, e.currentTarget)}>
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

      <Panel style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 20, display: 'flex', gap: 8, alignItems: 'center' }}>
          <QrCode size={20} aria-hidden="true" /> Vérifier un QR code
        </h2>
        <p className="muted" style={{ marginTop: 4 }}>Le jour J, saisissez le code présenté par le participant pour confirmer sa présence.</p>
        <form className="row" style={{ gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', marginTop: 10 }} onSubmit={onVerify}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <Input label="Code QR" value={qrCode} onChange={(e) => setQrCode(e.target.value)} placeholder="Collez le code QR" />
          </div>
          <Button type="submit" icon={QrCode} loading={verifying} loadingText="Vérification…">
            Vérifier
          </Button>
        </form>
        {verifyResult && (
          <div style={{ marginTop: 12 }} role="status">
            <Badge tone={verifyResult.valide ? 'ok' : 'no'}>{verifyResult.valide ? 'Valide' : 'Invalide'}</Badge>
            <p style={{ marginTop: 8 }}>{verifyResult.message || verifyResult.detail}</p>
          </div>
        )}
      </Panel>
    </div>
  );
}
