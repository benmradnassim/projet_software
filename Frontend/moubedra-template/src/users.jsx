// Écrans du module « Gestion des utilisateurs » branchés sur l'API Django.
import React, { useCallback, useEffect, useState } from 'react';
import { Eye, KeyRound, Search, ShieldCheck, UserCheck, UserX, Ban } from 'lucide-react';
import { api, fieldError, nomAffiche, ROLE_LABELS, STATUT_LABELS } from './api';
import { Avatar, Button, EmptyState, Field, PageHeading, Panel, StatusBadge, Table } from './ui';

const dateHeure = (iso) => (iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const FormError = ({ error }) => (error && !Object.keys(error.fields || {}).some((k) => k !== 'detail' && k !== 'non_field_errors') ? <div className="form-error" role="alert">{error.message}</div> : null);

/* ---------- Connexion / inscription (US-UTIL-01 + blocage des comptes suspendus/désactivés) ---------- */
export function AuthForm({ mode, onAuthenticated, notify }) {
  const [form, setForm] = useState({ email: '', password: '', nom: '', prenom: '', telephone: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  useEffect(() => setError(null), [mode]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'register') {
        const donnees = { email: form.email, password: form.password, nom: form.nom, prenom: form.prenom };
        if (form.telephone.trim()) donnees.telephone = form.telephone.trim();
        const reponse = await api.inscription(donnees);
        notify(reponse.message || 'Votre compte a été créé avec succès.');
      }
      const user = await api.connexion(form.email, form.password);
      onAuthenticated(user);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      {mode === 'register' && (
        <div className="form-grid">
          <Field label="Nom *" value={form.nom} onChange={set('nom')} placeholder="Votre nom" autoComplete="family-name" error={fieldError(error, 'nom')} />
          <Field label="Prénom *" value={form.prenom} onChange={set('prenom')} placeholder="Votre prénom" autoComplete="given-name" error={fieldError(error, 'prenom')} />
        </div>
      )}
      <Field label="Adresse e-mail *" value={form.email} onChange={set('email')} placeholder="vous@exemple.tn" type="email" autoComplete="email" error={fieldError(error, 'email')} />
      {mode === 'register' && <Field label="Téléphone (optionnel)" value={form.telephone} onChange={set('telephone')} placeholder="+216 …" type="tel" autoComplete="tel" error={fieldError(error, 'telephone')} />}
      <Field label="Mot de passe *" value={form.password} onChange={set('password')} placeholder="Au moins 8 caractères" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} error={fieldError(error, 'password')} />
      <FormError error={error} />
      <Button type="submit" variant="primary" disabled={busy}>{busy ? 'Veuillez patienter…' : mode === 'register' ? 'Créer mon compte' : 'Se connecter'}</Button>
    </form>
  );
}

/* ---------- Mon compte (US-UTIL-04, US-UTIL-05, US-UTIL-06) ---------- */
const CHAMPS_PROFIL = ['nom', 'prenom', 'email', 'telephone', 'ville', 'adresse'];
const videMotDePasse = { ancien_mot_de_passe: '', nouveau_mot_de_passe: '', confirmation: '' };

export function ProfilApi({ onUserUpdated, notify }) {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [mdp, setMdp] = useState(videMotDePasse);
  const [mdpError, setMdpError] = useState(null);
  const [mdpBusy, setMdpBusy] = useState(false);

  const remplir = (u) => { setUser(u); setForm(Object.fromEntries(CHAMPS_PROFIL.map((k) => [k, u[k] || '']))); };
  useEffect(() => { api.moi().then(remplir).catch(setLoadError); }, []);

  const enregistrer = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const reponse = await api.modifierProfil(form);
      remplir(reponse.utilisateur);
      onUserUpdated(reponse.utilisateur);
      notify(reponse.message || 'Profil mis à jour avec succès.');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const changerMotDePasse = async (event) => {
    event.preventDefault();
    setMdpError(null);
    setMdpBusy(true);
    try {
      const reponse = await api.changerMotDePasse(mdp);
      setMdp(videMotDePasse);
      notify(reponse.message || 'Mot de passe modifié avec succès.');
    } catch (err) {
      setMdpError(err);
    } finally {
      setMdpBusy(false);
    }
  };

  const head = <PageHeading eyebrow="VOTRE ESPACE PERSONNEL" title="Mon compte" description="Consultez et modifiez les informations de votre profil." />;
  if (loadError) return <>{head}<Panel><EmptyState title="Profil indisponible" text={loadError.message} /></Panel></>;
  if (!user) return <>{head}<Panel><p>Chargement du profil…</p></Panel></>;
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const setM = (key) => (value) => setMdp((m) => ({ ...m, [key]: value }));

  return (
    <>
      {head}
      <div className="profile-layout">
        <Panel className="profile-card">
          <div className="profile-card-head">
            <Avatar name={nomAffiche(user)} size={64} />
            <div><b>{nomAffiche(user)}</b><StatusBadge status={ROLE_LABELS[user.role] || user.role} /></div>
          </div>
          <form onSubmit={enregistrer} noValidate>
            <div className="form-grid">
              <Field label="Nom" value={form.nom} onChange={set('nom')} error={fieldError(error, 'nom')} />
              <Field label="Prénom" value={form.prenom} onChange={set('prenom')} error={fieldError(error, 'prenom')} />
              <Field label="Adresse e-mail" type="email" value={form.email} onChange={set('email')} error={fieldError(error, 'email')} />
              <Field label="Téléphone" type="tel" value={form.telephone} onChange={set('telephone')} error={fieldError(error, 'telephone')} />
              <Field label="Ville" value={form.ville} onChange={set('ville')} error={fieldError(error, 'ville')} />
              <Field label="Adresse" value={form.adresse} onChange={set('adresse')} error={fieldError(error, 'adresse')} />
            </div>
            <div className="form-grid">
              <Field label="Rôle (non modifiable)" value={ROLE_LABELS[user.role] || user.role} onChange={() => {}} disabled />
              <Field label="Statut (non modifiable)" value={STATUT_LABELS[user.statut] || user.statut} onChange={() => {}} disabled />
              <Field label="Inscrit le (non modifiable)" value={dateHeure(user.date_inscription)} onChange={() => {}} disabled />
            </div>
            <FormError error={error} />
            <Button type="submit" variant="primary" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer le profil'}</Button>
          </form>
        </Panel>
        <Panel>
          <span className="eyebrow">SÉCURITÉ</span>
          <h3><KeyRound size={16} /> Changer le mot de passe</h3>
          <form onSubmit={changerMotDePasse} noValidate>
            <Field label="Ancien mot de passe *" type="password" autoComplete="current-password" value={mdp.ancien_mot_de_passe} onChange={setM('ancien_mot_de_passe')} error={fieldError(mdpError, 'ancien_mot_de_passe')} />
            <Field label="Nouveau mot de passe *" type="password" autoComplete="new-password" value={mdp.nouveau_mot_de_passe} onChange={setM('nouveau_mot_de_passe')} error={fieldError(mdpError, 'nouveau_mot_de_passe')} />
            <Field label="Confirmation *" type="password" autoComplete="new-password" value={mdp.confirmation} onChange={setM('confirmation')} error={fieldError(mdpError, 'confirmation')} />
            <FormError error={mdpError} />
            <Button type="submit" variant="primary" disabled={mdpBusy}>{mdpBusy ? 'Modification…' : 'Modifier le mot de passe'}</Button>
          </form>
          <div className="api-notice"><ShieldCheck size={14} /> Données enregistrées sur le serveur.</div>
        </Panel>
      </div>
    </>
  );
}

/* ---------- Administration (US-UTIL-16, US-UTIL-17, US-UTIL-18) ---------- */
export function AdminUsersApi({ currentUserId, askConfirm, closeModal, notify }) {
  const [filters, setFilters] = useState({ role: '', statut: '', search: '', page: 1 });
  const [searchDraft, setSearchDraft] = useState('');
  const [list, setList] = useState(null);
  const [listError, setListError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const charger = useCallback(() => {
    setListError(null);
    api.listeUtilisateurs(filters).then(setList).catch((err) => { setList(null); setListError(err); });
  }, [filters]);
  useEffect(charger, [charger]);

  const chargerDetail = useCallback((id) => {
    if (!id) return;
    setDetail(null);
    setDetailError(null);
    api.detailUtilisateur(id).then(setDetail).catch(setDetailError);
  }, []);
  useEffect(() => chargerDetail(selectedId), [selectedId, chargerDetail]);

  const appliquerStatut = async (compte, statut) => {
    closeModal();
    setBusyId(compte.id);
    try {
      const reponse = await api.changerStatut(compte.id, statut, statut === 'suspendu');
      notify(reponse.message);
      charger();
      if (selectedId === compte.id) setDetail(reponse.utilisateur);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };
  const suspendre = (u) => askConfirm('Suspendre ce compte ?', `${nomAffiche(u)} (${u.email}) ne pourra plus se connecter tant que le compte n’est pas réactivé.`, () => appliquerStatut(u, 'suspendu'));
  const desactiver = (u) => askConfirm('Désactiver ce compte ?', `${nomAffiche(u)} (${u.email}) ne pourra plus se connecter. Le compte est conservé en base (suppression logique).`, () => appliquerStatut(u, 'desactive'));
  const reactiver = (u) => appliquerStatut(u, 'actif');

  const setFilter = (key) => (event) => setFilters((f) => ({ ...f, [key]: event.target.value, page: 1 }));
  const head = <PageHeading eyebrow="ADMINISTRATION" title="Gestion des utilisateurs" description="Consultez les comptes, filtrez par rôle et statut, suspendez ou réactivez un accès." />;

  if (listError?.status === 403) return <>{head}<Panel><EmptyState title="Accès refusé" text={listError.message} /></Panel></>;

  const actions = (u) => {
    const soi = u.id === currentUserId;
    const titre = soi ? 'Vous ne pouvez pas modifier le statut de votre propre compte.' : undefined;
    const busy = busyId === u.id;
    return (
      <div className="inline-actions" title={titre}>
        <Button icon={Eye} onClick={() => setSelectedId(u.id)}>Voir</Button>
        {u.statut === 'actif'
          ? <Button icon={UserX} disabled={soi || busy} onClick={() => suspendre(u)}>Suspendre</Button>
          : <Button icon={UserCheck} variant="primary" disabled={soi || busy} onClick={() => reactiver(u)}>Réactiver</Button>}
        {u.statut !== 'desactive' && <Button icon={Ban} variant="danger" disabled={soi || busy} onClick={() => desactiver(u)}>Désactiver</Button>}
      </div>
    );
  };

  return (
    <>
      {head}
      <div className="users-layout">
        <Panel>
          <div className="users-filters">
            <form className="search-box table-search" onSubmit={(e) => { e.preventDefault(); setFilters((f) => ({ ...f, search: searchDraft.trim(), page: 1 })); }}>
              <Search size={16} />
              <input value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} placeholder="Rechercher un nom ou un e-mail puis Entrée…" />
            </form>
            <select value={filters.role} onChange={setFilter('role')} aria-label="Filtrer par rôle">
              <option value="">Tous les rôles</option>
              {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={filters.statut} onChange={setFilter('statut')} aria-label="Filtrer par statut">
              <option value="">Tous les statuts</option>
              {Object.entries(STATUT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          {listError && <div className="form-error" role="alert">{listError.message}</div>}
          {!list && !listError && <p>Chargement des comptes…</p>}
          {list && (
            <>
              <Table headers={['Utilisateur', 'E-mail', 'Rôle', 'Statut', 'Inscription', 'Actions']}>
                {list.results.map((u) => (
                  <tr key={u.id}>
                    <td><span className="table-person"><Avatar name={nomAffiche(u)} size={29} />{nomAffiche(u)}{u.id === currentUserId && ' (vous)'}</span></td>
                    <td>{u.email}</td>
                    <td>{ROLE_LABELS[u.role] || u.role}</td>
                    <td><StatusBadge status={STATUT_LABELS[u.statut] || u.statut} /></td>
                    <td>{dateHeure(u.date_inscription)}</td>
                    <td>{actions(u)}</td>
                  </tr>
                ))}
              </Table>
              {!list.results.length && <EmptyState title="Aucun compte" text="Aucun compte ne correspond à ces filtres." />}
              <div className="users-pager">
                <span>{list.count} compte(s)</span>
                <Button disabled={!list.previous} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>Précédent</Button>
                <span>Page {filters.page}</span>
                <Button disabled={!list.next} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Suivant</Button>
              </div>
            </>
          )}
        </Panel>
        <Panel className="users-detail">
          <span className="eyebrow">FICHE DU COMPTE</span>
          {!selectedId && <p>Cliquez sur « Voir » pour afficher la fiche d’un compte.</p>}
          {detailError && <div className="form-error" role="alert">{detailError.message}</div>}
          {selectedId && !detail && !detailError && <p>Chargement…</p>}
          {detail && (
            <>
              <div className="profile-card-head"><Avatar name={nomAffiche(detail)} size={48} /><div><b>{nomAffiche(detail)}</b><StatusBadge status={STATUT_LABELS[detail.statut] || detail.statut} /></div></div>
              <dl>
                <dt>E-mail</dt><dd>{detail.email}</dd>
                <dt>Nom</dt><dd>{detail.nom || '—'}</dd>
                <dt>Prénom</dt><dd>{detail.prenom || '—'}</dd>
                <dt>Téléphone</dt><dd>{detail.telephone || '—'}</dd>
                <dt>Ville</dt><dd>{detail.ville || '—'}</dd>
                <dt>Rôle</dt><dd>{ROLE_LABELS[detail.role] || detail.role}</dd>
                <dt>Statut</dt><dd>{STATUT_LABELS[detail.statut] || detail.statut}</dd>
                <dt>Inscription</dt><dd>{dateHeure(detail.date_inscription)}</dd>
                <dt>Dernière connexion</dt><dd>{dateHeure(detail.last_login)}</dd>
              </dl>
              {actions(detail)}
            </>
          )}
        </Panel>
      </div>
    </>
  );
}
