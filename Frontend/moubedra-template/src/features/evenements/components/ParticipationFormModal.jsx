import { useEffect, useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { Button, Input, Modal, Select } from '../../../design/components';

const VIDE = { type: 'benevole', nom: '', prenom: '', telephone: '', cin: '', adresse: '', motif: '' };

export const TYPES_PARTICIPATION = [
  { value: 'benevole', label: 'Bénévole' },
  { value: 'don_materiel', label: 'Don matériel' },
  { value: 'accompagnement', label: 'Accompagnement' },
  { value: 'autre', label: 'Autre' },
];

/** Mêmes règles que le back (serializers/participation_evenement.py). */
export function verifierParticipant(f) {
  const errors = {};
  if (f.nom.trim().length < 2) errors.nom = 'Saisissez votre nom.';
  if (f.prenom.trim().length < 2) errors.prenom = 'Saisissez votre prénom.';
  const chiffres = f.telephone.trim().replace(/\D/g, '');
  if (!(chiffres.length === 8 || (chiffres.startsWith('216') && chiffres.length === 11))) {
    errors.telephone = 'Saisissez 8 chiffres, avec +216 facultatif.';
  }
  if (!/^\d{8}$/.test(f.cin.trim())) errors.cin = 'Le CIN doit contenir exactement 8 chiffres.';
  if (f.adresse.trim().length < 5) errors.adresse = 'Saisissez une adresse complète.';
  if (f.motif.trim().length < 10) errors.motif = 'Le motif doit contenir au moins 10 caractères.';
  return errors;
}

/**
 * Formulaire de participation (création ou modification d'une demande).
 *   onSubmit(payload) : promesse ; une ApiError avec `fields` affiche les erreurs sous les champs.
 */
export default function ParticipationFormModal({ open, onClose, titre, sousTitre, initial, onSubmit, submitLabel = 'Envoyer ma demande' }) {
  const [form, setForm] = useState(VIDE);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...VIDE, ...Object.fromEntries(Object.entries(initial || {}).filter(([k, v]) => k in VIDE && v != null)) });
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (k, transform = (v) => v) => (e) => setForm((f) => ({ ...f, [k]: transform(e.target.value) }));

  const submit = async () => {
    const errs = verifierParticipant(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSending(true);
    try {
      await onSubmit(Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()])));
    } catch (err) {
      if (err?.fields && Object.keys(err.fields).length) setErrors(err.fields);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => !sending && onClose()}
      title={titre}
      width={520}
      actions={
        <>
          <Button variant="ghost" disabled={sending} onClick={onClose}>Annuler</Button>
          <Button icon={CalendarPlus} loading={sending} loadingText="Envoi…" onClick={submit}>{submitLabel}</Button>
        </>
      }
    >
      {sousTitre && <p style={{ color: 'var(--muted)', marginTop: 4 }}>{sousTitre}</p>}
      <div style={{ marginTop: 16 }}>
        <Select label="Type de participation" value={form.type} onChange={set('type')} options={TYPES_PARTICIPATION} />
      </div>
      <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
        <div><Input label="Nom" value={form.nom} onChange={set('nom')} error={errors.nom} maxLength={100} autoFocus /></div>
        <div><Input label="Prénom" value={form.prenom} onChange={set('prenom')} error={errors.prenom} maxLength={100} /></div>
      </div>
      <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <div><Input label="Téléphone" type="tel" inputMode="tel" placeholder="+216 22 333 444" value={form.telephone} onChange={set('telephone')} error={errors.telephone} maxLength={30} /></div>
        <div><Input label="CIN" inputMode="numeric" placeholder="8 chiffres" value={form.cin} onChange={set('cin', (v) => v.replace(/\D/g, '').slice(0, 8))} error={errors.cin} maxLength={8} /></div>
      </div>
      <div style={{ marginTop: 12 }}>
        <Input label="Adresse" value={form.adresse} onChange={set('adresse')} error={errors.adresse} maxLength={255} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label className="lbl" htmlFor="participation-motif">Motif de participation</label>
        <textarea
          id="participation-motif"
          className={`inp3${errors.motif ? ' bad' : ''}`}
          style={{ height: 90 }}
          placeholder="Expliquez brièvement comment vous souhaitez participer"
          value={form.motif}
          onChange={set('motif')}
          aria-invalid={!!errors.motif}
        />
        {errors.motif && <small className="field-err" role="alert">{errors.motif}</small>}
      </div>
    </Modal>
  );
}
