import { useEffect, useState } from 'react';
import { Pencil, QrCode } from 'lucide-react';
import { Badge, Button, DateBadge, EmptyState, Input, Modal, PageHeader, Select, SkeletonList, Tabs, useToast } from '../../../design/components';
import { useApi } from '../../../lib/useApi';
import { annulerParticipation, listMesParticipations, modifierParticipation } from '../api';
import { annulerParticipationCampagne, listMesParticipationsCampagnes, modifierParticipationCampagne } from '../../campagnes/api';
import { horaire } from '../components/EventRow';
import '../evenements.css';

/** Onglet d'une participation : à venir, en attente ou passée. */
function bucket(p) {
  const e = p.evenement_detail;
  if (p.statut === 'en_attente') return 'wait';
  if (p.statut === 'acceptee' && e.statut !== 'termine' && new Date(e.date_evenement) > new Date()) return 'up';
  if (p.statut === 'annulee') return null;
  return 'past';
}

function badge(p) {
  if (p.statut === 'en_attente') return ['wait', 'En attente'];
  if (p.statut === 'refusee') return ['no', `Refusée${p.raison ? ` · ${p.raison}` : ''}`];
  if (p.evenement_detail.statut === 'termine') return ['grey', 'Terminée · merci !'];
  return ['ok', 'Acceptée'];
}

export default function MyParticipationsPage() {
  const toast = useToast();
  // TODO(API): remplacer par GET /api/participations/evenements/ — voir features/evenements/api.js (listMesParticipations)
  const { data, loading, setData } = useApi(async () => {
    const [evenements, campagnes] = await Promise.all([
      listMesParticipations(),
      listMesParticipationsCampagnes(),
    ]);
    return [...evenements, ...campagnes];
  }, [], []);
  const [tab, setTab] = useState('up');
  const [cancelled, setCancelled] = useState(() => new Set());
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const count = (k) => data.filter((p) => bucket(p) === k).length;
  const list = data.filter((p) => bucket(p) === tab);

  const startEditing = (participation) => {
    setEditing(participation);
    setEditForm({
      type: participation.type || 'benevole',
      nom: participation.nom || '',
      prenom: participation.prenom || '',
      telephone: participation.telephone || '',
      cin: participation.cin || '',
      adresse: participation.adresse || '',
      motif: participation.motif || '',
    });
    setEditErrors({});
  };

  const saveEdit = async () => {
    const errors = {};
    if (editForm.nom.trim().length < 2) errors.nom = 'Saisissez votre nom.';
    if (editForm.prenom.trim().length < 2) errors.prenom = 'Saisissez votre prénom.';
    const phoneDigits = editForm.telephone.trim().replace(/\D/g, '');
    if (!(phoneDigits.length === 8 || (phoneDigits.startsWith('216') && phoneDigits.length === 11))) {
      errors.telephone = 'Saisissez 8 chiffres, avec +216 facultatif.';
    }
    if (!/^\d{8}$/.test(editForm.cin.trim())) errors.cin = 'Le CIN doit contenir exactement 8 chiffres.';
    if (editForm.adresse.trim().length < 5) errors.adresse = 'Saisissez une adresse complète.';
    if (editForm.motif.trim().length < 10) errors.motif = 'Le motif doit contenir au moins 10 caractères.';
    setEditErrors(errors);
    if (Object.keys(errors).length) return;

    const payload = {
      ...editForm,
      nom: editForm.nom.trim(),
      prenom: editForm.prenom.trim(),
      telephone: editForm.telephone.trim(),
      cin: editForm.cin.trim(),
      adresse: editForm.adresse.trim(),
      motif: editForm.motif.trim(),
    };
    setSavingEdit(true);
    try {
      const updated = editing.type_liste === 'campagne'
        ? await modifierParticipationCampagne(editing.id, payload)
        : await modifierParticipation(editing.id, payload);
      setData((items) => items.map((item) => (item.id === editing.id && item.type_liste === editing.type_liste ? { ...item, ...updated } : item)));
      setEditing(null);
      toast('Participation modifiée.');
    } catch (error) {
      toast(error.message || 'Impossible de modifier la participation.');
    } finally {
      setSavingEdit(false);
    }
  };

  const cancel = (p) => {
    const key = `${p.type_liste}-${p.id}`;
    setCancelled((s) => new Set(s).add(key));
    const t = setTimeout(async () => {
      try {
        if (p.type_liste === 'campagne') await annulerParticipationCampagne(p.id);
        else await annulerParticipation(p.id);
        setData((items) => items.map((item) => (
          item.id === p.id && item.type_liste === p.type_liste
            ? { ...item, statut: 'annulee' }
            : item
        )));
        setCancelled((state) => {
          const next = new Set(state);
          next.delete(key);
          return next;
        });
      } catch (error) {
        setCancelled((state) => {
          const next = new Set(state);
          next.delete(key);
          return next;
        });
        toast(error.message || "Impossible d'annuler la participation.");
      }
    }, 5300);
    toast('Demande annulée', {
      undo: () => {
        clearTimeout(t);
        setCancelled((s) => {
          const n = new Set(s);
          n.delete(key);
          return n;
        });
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
                const e = p.evenement_detail;
                const [tone, label] = badge(p);
                if (cancelled.has(`${p.type_liste}-${p.id}`)) {
                  return (
                    <li key={p.id} className="it">
                      <div className="gw muted">Demande annulée.</div>
                    </li>
                  );
                }
                return (
                  <li key={p.id} className="it">
                    <DateBadge date={e.date_evenement} />
                    <div className="gw">
                      <h4>{e.titre}</h4>
                      <small>
                        {horaire(e)} · {e.lieu}
                      </small>
                      {(p.nom || p.prenom || p.telephone) && (
                        <small style={{ display: 'block' }}>
                          {[p.prenom, p.nom].filter(Boolean).join(' ')}
                          {p.telephone ? ` · ${p.telephone}` : ''}
                        </small>
                      )}
                    </div>
                    <Badge tone={tone}>{label}</Badge>
                    {tab === 'up' && (
                      <Button variant="navy" size="sm" icon={QrCode} to={`/evenements/${e.id}`}>
                        QR code
                      </Button>
                    )}
                    {tab === 'wait' && (
                      <>
                        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => startEditing(p)}>
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
      <Modal
        open={!!editing}
        onClose={() => !savingEdit && setEditing(null)}
        title="Modifier ma participation"
        width={520}
        actions={
          <>
            <Button variant="ghost" disabled={savingEdit} onClick={() => setEditing(null)}>Annuler</Button>
            <Button loading={savingEdit} loadingText="Enregistrement…" onClick={saveEdit}>Enregistrer</Button>
          </>
        }
      >
        {editing && <p style={{ color: 'var(--muted)', marginTop: 4 }}>{editing.evenement_detail?.titre}</p>}
        <div style={{ marginTop: 16 }}>
          <Select
            label="Type de participation"
            value={editForm.type || 'benevole'}
            onChange={(event) => setEditForm((form) => ({ ...form, type: event.target.value }))}
            options={[
              { value: 'benevole', label: 'Bénévole' },
              { value: 'don_materiel', label: 'Don matériel' },
              { value: 'accompagnement', label: 'Accompagnement' },
              { value: 'autre', label: 'Autre' },
            ]}
          />
        </div>
        <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          <Input label="Nom" value={editForm.nom || ''} onChange={(event) => setEditForm((form) => ({ ...form, nom: event.target.value }))} error={editErrors.nom} maxLength={100} autoFocus />
          <Input label="Prénom" value={editForm.prenom || ''} onChange={(event) => setEditForm((form) => ({ ...form, prenom: event.target.value }))} error={editErrors.prenom} maxLength={100} />
        </div>
        <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <Input label="Téléphone" type="tel" inputMode="tel" value={editForm.telephone || ''} onChange={(event) => setEditForm((form) => ({ ...form, telephone: event.target.value }))} error={editErrors.telephone} maxLength={30} />
          <Input label="CIN" inputMode="numeric" value={editForm.cin || ''} onChange={(event) => setEditForm((form) => ({ ...form, cin: event.target.value.replace(/\D/g, '').slice(0, 8) }))} error={editErrors.cin} maxLength={8} />
        </div>
        <div style={{ marginTop: 12 }}>
          <Input label="Adresse" value={editForm.adresse || ''} onChange={(event) => setEditForm((form) => ({ ...form, adresse: event.target.value }))} error={editErrors.adresse} maxLength={255} />
        </div>
        <div style={{ marginTop: 12 }}>
          <label className="lbl" htmlFor="edit-participation-motif">Motif de participation</label>
          <textarea
            id="edit-participation-motif"
            className={`inp3${editErrors.motif ? ' bad' : ''}`}
            style={{ height: 90 }}
            value={editForm.motif || ''}
            onChange={(event) => setEditForm((form) => ({ ...form, motif: event.target.value }))}
            aria-invalid={!!editErrors.motif}
          />
          {editErrors.motif && <small className="field-err" role="alert">{editErrors.motif}</small>}
        </div>
      </Modal>
    </div>
  );
}
