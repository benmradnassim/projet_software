import { useMemo, useState } from 'react';
import { BadgeCheck, Camera, Info, Lock } from 'lucide-react';
import { useAuth } from '../../../app/AuthContext';
import { Badge, Button, Input, Modal, PageHeader, Panel, Toggle, useToast } from '../../../design/components';
import { formatDate, initials } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import { profilVersUI } from '../../auth';
import { changerMotDePasse, getPreferences, modifierProfil } from '../api';
import '../utilisateurs.css';

const FIELDS = [
  ['prenom', 'Prénom', 'text', 'given-name'],
  ['nom', 'Nom', 'text', 'family-name'],
  ['email', 'E-mail', 'email', 'email'],
  ['telephone', 'Téléphone', 'tel', 'tel'],
  ['ville', 'Ville', 'text', 'address-level2'],
  ['date_naissance', 'Date de naissance', 'date', 'bday'],
];

/** Mon compte : informations, sécurité, préférences. La barre « Enregistrer » n'apparaît qu'en cas de modification. */
export default function AccountPage() {
  const { user, role, updateUser } = useAuth();
  const toast = useToast();
  const initial = useMemo(
    () => ({
      prenom: user.prenom || user.first_name || '',
      nom: user.nom || user.last_name || '',
      email: user.email || '',
      telephone: user.telephone || '',
      ville: user.ville || '',
      date_naissance: user.date_naissance || '',
      adresse: user.adresse || '',
      nom_organisation: user.nom_organisation || '',
    }),
    [user],
  );
  const [form, setForm] = useState(initial);
  const [errs, setErrs] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwd, setPwd] = useState({ ancien_mot_de_passe: '', nouveau_mot_de_passe: '', confirmation: '' });
  const [pwdErrs, setPwdErrs] = useState({});
  const [pwdBusy, setPwdBusy] = useState(false);
  // TODO(API): préférences — pas encore de champs côté back (voir features/utilisateurs/api.js)
  const { data: prefs, setData: setPrefs } = useApi(getPreferences, []);
  const dirty = Object.keys(form).some((k) => form[k] !== initial[k]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const orga = role === 'organisateur';

  const save = async () => {
    setSaving(true);
    setErrs({});
    try {
      // PATCH /api/utilisateurs/moi/ — voir features/utilisateurs/api.js (modifierProfil)
      const { nom_organisation, ...patch } = form; // nom_organisation est en lecture seule côté back
      const res = await modifierProfil(user.id, patch);
      // sous_titre vidé : profilVersUI le recalcule (ex. « Citoyen·ne · Bizerte ») pour la barre latérale
      updateUser(profilVersUI({ ...user, ...patch, ...res, first_name: patch.prenom, last_name: patch.nom, nom_complet: `${patch.prenom} ${patch.nom}`.trim(), nom_organisation, sous_titre: '' }));
      toast('Modifications enregistrées');
    } catch (err) {
      setErrs(err.fields || {});
      toast(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changePwd = async (e) => {
    e.preventDefault();
    setPwdBusy(true);
    setPwdErrs({});
    try {
      // POST /api/utilisateurs/moi/mot-de-passe/ — voir features/utilisateurs/api.js (changerMotDePasse)
      await changerMotDePasse(pwd);
      setPwdOpen(false);
      setPwd({ ancien_mot_de_passe: '', nouveau_mot_de_passe: '', confirmation: '' });
      toast('Mot de passe modifié avec succès');
    } catch (err) {
      setPwdErrs(err.fields && Object.keys(err.fields).length ? err.fields : { confirmation: err.message });
    } finally {
      setPwdBusy(false);
    }
  };

  const togglePref = (group, cle) => setPrefs((p) => ({ ...p, [group]: p[group].map((x) => (x.cle === cle ? { ...x, actif: !x.actif } : x)) }));

  return (
    <div className="pg">
      <PageHeader
        crumbs={['Compte', orga ? 'Profil de l’association' : 'Mon compte']}
        title={orga ? 'Profil de l’association' : 'Mon compte'}
        subtitle="Vos informations, votre sécurité et vos préférences."
      />
      <div className="dg" style={{ gridTemplateColumns: '1fr 340px' }}>
        <div>
          <Panel>
            <div className="row" style={{ gap: 20, marginBottom: 10 }}>
              <div className="avbig" style={{ background: user.couleur || 'var(--orange)' }}>
                <span aria-hidden="true">{initials(user.nom_complet)}</span>
                <button type="button" aria-label="Changer la photo" onClick={() => toast('Changement de photo : bientôt disponible')}>
                  <Camera size={16} aria-hidden="true" />
                </button>
              </div>
              <div>
                <b style={{ font: '800 22px var(--display)', color: 'var(--navy)' }}>{user.nom_complet}</b>
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>
                  {user.sous_titre?.split(' · ')[0]} · inscrit·e le {formatDate(user.date_inscription)}
                </p>
                <Badge tone="info" icon={BadgeCheck} style={{ marginTop: 6 }}>
                  E-mail vérifié
                </Badge>
              </div>
            </div>
            <h3 className="h" style={{ marginTop: 14, fontSize: 20 }}>
              Informations personnelles
            </h3>
            <div className="fg2">
              {orga && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <Input label="Nom de l’association" value={form.nom_organisation} readOnly hint="Modifiable par l’équipe moubedra après vérification." />
                </div>
              )}
              {FIELDS.map(([k, l, type, ac]) => (
                <div key={k}>
                  <Input
                    label={l}
                    type={type}
                    autoComplete={ac}
                    value={form[k]}
                    onChange={set(k)}
                    error={errs[k]}
                  />
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <Input label="Adresse" autoComplete="street-address" value={form.adresse} onChange={set('adresse')} error={errs.adresse} />
              </div>
            </div>
          </Panel>
          <Panel title="Sécurité" style={{ marginTop: 16 }}>
            <div className="row">
              <span className="ic2" style={{ background: 'var(--info-bg)', color: 'var(--navy)' }} aria-hidden="true">
                <Lock size={19} />
              </span>
              <div className="gw">
                <h4 style={{ font: '700 16px var(--display)', color: 'var(--navy)' }}>Mot de passe</h4>
                <small className="muted">Modifié il y a 3 mois</small>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPwdOpen(true)}>
                Modifier
              </Button>
            </div>
          </Panel>
          <Panel className="danger" style={{ marginTop: 16 }}>
            <h3 className="h" style={{ color: 'var(--no-fg)' }}>
              Zone sensible
            </h3>
            <div className="row">
              <div className="gw">
                <h4 style={{ font: '700 16px var(--display)', color: 'var(--navy)' }}>Supprimer mon compte</h4>
                <small className="muted">Vos dons restent enregistrés pour la transparence des campagnes.</small>
              </div>
              <Button variant="danger-soft" size="sm" onClick={() => setConfirmDelete(true)}>
                Supprimer…
              </Button>
            </div>
          </Panel>
          <div className={`savebar${dirty ? ' on' : ''}`} role="region" aria-label="Modifications non enregistrées" aria-hidden={!dirty}>
            <Info size={17} aria-hidden="true" /> Modifications non enregistrées
            <Button size="sm" variant="on-dark" style={{ marginLeft: 'auto' }} onClick={() => setForm(initial)} tabIndex={dirty ? 0 : -1}>
              Annuler
            </Button>
            <Button size="sm" loading={saving} loadingText="Enregistrement…" onClick={save} tabIndex={dirty ? 0 : -1}>
              Enregistrer
            </Button>
          </div>
        </div>
        <aside className="sticky2" aria-label="Préférences">
          {prefs && (
            <>
              <Panel title="Notifications">
                {prefs.notifications.map((p) => (
                  <Toggle key={p.cle} checked={p.actif} onChange={() => togglePref('notifications', p.cle)}>
                    {p.libelle}
                  </Toggle>
                ))}
              </Panel>
              <Panel title="Confidentialité" style={{ marginTop: 16 }}>
                {prefs.confidentialite.map((p) => (
                  <Toggle key={p.cle} checked={p.actif} onChange={() => togglePref('confidentialite', p.cle)}>
                    {p.libelle}
                  </Toggle>
                ))}
              </Panel>
            </>
          )}
        </aside>
      </div>
      <Modal open={pwdOpen} onClose={() => setPwdOpen(false)} title="Changer le mot de passe">
        <form onSubmit={changePwd} noValidate>
          {[
            ['ancien_mot_de_passe', 'Mot de passe actuel', 'current-password'],
            ['nouveau_mot_de_passe', 'Nouveau mot de passe', 'new-password'],
            ['confirmation', 'Confirmer le nouveau mot de passe', 'new-password'],
          ].map(([k, l, ac]) => (
            <Input
              key={k}
              type="password"
              label={l}
              autoComplete={ac}
              value={pwd[k]}
              onChange={(e) => setPwd((p) => ({ ...p, [k]: e.target.value }))}
              error={Array.isArray(pwdErrs[k]) ? pwdErrs[k][0] : pwdErrs[k]}
              autoFocus={k === 'ancien_mot_de_passe'}
            />
          ))}
          <div className="actions">
            <Button variant="ghost" onClick={() => setPwdOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="navy" loading={pwdBusy} loadingText="Enregistrement…">
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Supprimer votre compte ?"
        actions={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Annuler
            </Button>
            <Button
              variant="danger-soft"
              onClick={() => {
                setConfirmDelete(false);
                toast('Demande de suppression envoyée');
              }}
            >
              Supprimer définitivement
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-2)' }}>Cette action est définitive. Vos dons restent enregistrés de façon anonyme pour la transparence des campagnes.</p>
      </Modal>
    </div>
  );
}
