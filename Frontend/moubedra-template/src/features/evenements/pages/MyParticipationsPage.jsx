import { useState } from 'react';
import { Eye, Pencil, QrCode } from 'lucide-react';
import { Badge, Button, DateBadge, EmptyState, PageHeader, SkeletonList, Tabs, useToast } from '../../../design/components';
import { formatTime } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import { annulerParticipation, listMesParticipations, modifierParticipation } from '../api';
import { annulerParticipationCampagne, listMesParticipationsCampagnes, modifierParticipationCampagne } from '../../campagnes';
import ParticipationFormModal from '../components/ParticipationFormModal';
import QrCodeModal from '../components/QrCodeModal';
import '../evenements.css';

const horaire = (e) => (e?.date_evenement ? (e.heure_fin ? `${formatTime(e.date_evenement)} – ${e.heure_fin}` : formatTime(e.date_evenement)) : '');

/** Onglet d'une participation : à venir, en attente ou passée. */
function bucket(p) {
  const e = p.evenement_detail || {};
  if (p.statut === 'en_attente') return 'wait';
  if (p.statut === 'annulee') return null;
  if (p.statut === 'acceptee' && e.statut !== 'termine' && (!e.date_evenement || new Date(e.date_evenement) > new Date())) return 'up';
  return 'past';
}

function badge(p) {
  if (p.statut === 'en_attente') return ['wait', 'En attente'];
  if (p.statut === 'refusee') return ['no', `Refusée${p.raison ? ` · ${p.raison}` : ''}`];
  if (p.evenement_detail?.statut === 'termine') return ['grey', 'Terminée · merci !'];
  return ['ok', 'Acceptée'];
}

/** Mes demandes de participation aux événements et aux campagnes. */
export default function MyParticipationsPage() {
  const toast = useToast();
  const { data, loading, setData } = useApi(async () => {
    const [evenements, campagnes] = await Promise.all([listMesParticipations(), listMesParticipationsCampagnes()]);
    return [...evenements, ...campagnes];
  }, [], []);
  const [tab, setTab] = useState('up');
  const [cancelled, setCancelled] = useState(() => new Set());
  const [editing, setEditing] = useState(null);
  const [qrId, setQrId] = useState(null);
  const cle = (p) => `${p.type_liste}-${p.id}`;
  const count = (k) => data.filter((p) => bucket(p) === k).length;
  const list = data.filter((p) => bucket(p) === tab);

  const saveEdit = async (payload) => {
    try {
      const updated = editing.type_liste === 'campagne'
        ? await modifierParticipationCampagne(editing.id, payload)
        : await modifierParticipation(editing.id, payload);
      setData((items) => items.map((item) => (cle(item) === cle(editing) ? { ...item, ...payload, ...updated } : item)));
      setEditing(null);
      toast('Participation modifiée.');
    } catch (error) {
      toast(error.message || 'Impossible de modifier la participation.');
      throw error;
    }
  };

  // Annulation différée de 5 s : le toast « Annuler » permet de revenir en arrière.
  const cancel = (p) => {
    const key = cle(p);
    const oublier = () => setCancelled((s) => {
      const n = new Set(s);
      n.delete(key);
      return n;
    });
    setCancelled((s) => new Set(s).add(key));
    const t = setTimeout(async () => {
      try {
        if (p.type_liste === 'campagne') await annulerParticipationCampagne(p.id);
        else await annulerParticipation(p.id);
        setData((items) => items.map((item) => (cle(item) === key ? { ...item, statut: 'annulee' } : item)));
      } catch (error) {
        toast(error.message || "Impossible d'annuler la participation.");
      } finally {
        oublier();
      }
    }, 5300);
    toast('Demande annulée', {
      undo: () => {
        clearTimeout(t);
        oublier();
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
                const e = p.evenement_detail || {};
                const [tone, label] = badge(p);
                const estCampagne = p.type_liste === 'campagne';
                if (cancelled.has(cle(p))) {
                  return (
                    <li key={cle(p)} className="it">
                      <div className="gw muted">Demande annulée.</div>
                    </li>
                  );
                }
                return (
                  <li key={cle(p)} className="it">
                    {e.date_evenement && <DateBadge date={e.date_evenement} />}
                    <div className="gw">
                      <h4>{e.titre}</h4>
                      <small>
                        {estCampagne ? 'Campagne' : horaire(e)}
                        {e.lieu ? ` · ${e.lieu}` : ''}
                      </small>
                      {(p.nom || p.prenom || p.telephone) && (
                        <small style={{ display: 'block' }}>
                          {[p.prenom, p.nom].filter(Boolean).join(' ')}
                          {p.telephone ? ` · ${p.telephone}` : ''}
                        </small>
                      )}
                    </div>
                    <Badge tone={tone}>{label}</Badge>
                    {tab === 'up' && !estCampagne && (
                      <Button variant="navy" size="sm" icon={QrCode} onClick={() => setQrId(p.id)}>
                        QR code
                      </Button>
                    )}
                    {tab !== 'wait' && estCampagne && (
                      <Button variant="ghost" size="sm" icon={Eye} to={`/campagnes/${e.id}`}>
                        Voir
                      </Button>
                    )}
                    {tab === 'wait' && (
                      <>
                        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEditing(p)}>
                          Modifier
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => cancel(p)}>
                          Annuler
                        </Button>
                      </>
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
      <ParticipationFormModal
        open={!!editing}
        onClose={() => setEditing(null)}
        titre="Modifier ma participation"
        sousTitre={editing?.evenement_detail?.titre}
        initial={editing}
        onSubmit={saveEdit}
        submitLabel="Enregistrer"
      />
      <QrCodeModal open={!!qrId} onClose={() => setQrId(null)} participationId={qrId} />
    </div>
  );
}
