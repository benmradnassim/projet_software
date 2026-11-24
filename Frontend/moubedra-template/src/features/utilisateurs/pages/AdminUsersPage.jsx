import { useState } from 'react';
import { Ban, BadgeCheck, Download, Eye, Mail, RotateCcw, Search, UserX } from 'lucide-react';
import { useAuth } from '../../../app/AuthContext';
import { Avatar, Badge, Button, DataTable, EmptyState, Menu, Modal, PageHeader, Panel, SkeletonList, StatutBadge, Tabs, useToast } from '../../../design/components';
import { formatDate, formatNumber } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import { STATUTS_COMPTE, changerStatutUtilisateur, getResumeUtilisateurs, listUtilisateurs } from '../api';
import '../utilisateurs.css';

const ROLE_BADGE = { utilisateur: ['grey', 'Utilisateur'], citoyen: ['info', 'Citoyen'], organisateur: ['ok', 'Organisateur'], admin: ['grey', 'Admin'] };
const FILTRES = [
  { key: 'all', label: 'Tous' },
  { key: 'citoyen', label: 'Citoyen' },
  { key: 'organisateur', label: 'Organisateur' },
  { key: 'suspendu', label: 'Suspendus' },
  { key: 'desactive', label: 'Désactivés' },
];
const MESSAGES = { actif: 'Compte réactivé', suspendu: 'Compte suspendu', desactive: 'Compte désactivé' };

/** Gestion des utilisateurs (US-UTIL-16/17/18) : recherche, filtres, suspension confirmée, réactivation, désactivation. */
export default function AdminUsersPage() {
  const { user: moi } = useAuth();
  const toast = useToast();
  // TODO(API): branché sur GET /api/utilisateurs/ quand VITE_DEMO=false — voir features/utilisateurs/api.js
  const { data: users, loading, error, setData } = useApi(listUtilisateurs, [], []);
  const { data: resume } = useApi(getResumeUtilisateurs, []);
  const [q, setQ] = useState('');
  const [filtre, setFiltre] = useState('all');
  const [pop, setPop] = useState({});
  const [aSuspendre, setASuspendre] = useState(null); // { ids, clear }
  const [busy, setBusy] = useState(false);

  /** Applique un statut à une liste de comptes ; renvoie les comptes réellement modifiés. */
  const appliquer = async (ids, statut) => {
    const ok = [];
    for (const id of ids) {
      try {
        // POST /api/utilisateurs/<id>/statut/ — la suspension est envoyée avec confirmation: true
        const { utilisateur } = await changerStatutUtilisateur(id, statut, statut === 'suspendu');
        setData((l) => l.map((u) => (u.id === id ? { ...u, ...utilisateur, statut } : u)));
        ok.push(id);
      } catch (err) {
        toast(err.message);
      }
    }
    setPop((p) => ({ ...p, ...Object.fromEntries(ok.map((id) => [id, Date.now()])) }));
    return ok;
  };

  const changer = async (u, statut) => {
    const prev = u.statut;
    const ok = await appliquer([u.id], statut);
    if (ok.length) toast(MESSAGES[statut], { undo: () => appliquer([u.id], prev) });
  };

  const confirmerSuspension = async () => {
    setBusy(true);
    const ok = await appliquer(aSuspendre.ids, 'suspendu');
    setBusy(false);
    aSuspendre.clear?.();
    setASuspendre(null);
    if (ok.length) toast(ok.length > 1 ? `${ok.length} comptes suspendus` : MESSAGES.suspendu);
  };

  const s = q.trim().toLowerCase();
  const rows = users.filter(
    (u) =>
      (filtre === 'all' || (STATUTS_COMPTE[filtre] ? u.statut === filtre : u.role === filtre || (filtre === 'citoyen' && u.role === 'utilisateur'))) &&
      (!s || `${u.nom_complet} ${u.email} ${u.ville}`.toLowerCase().includes(s)),
  );
  const nomsASuspendre = aSuspendre ? users.filter((u) => aSuspendre.ids.includes(u.id)).map((u) => u.nom_complet) : [];

  return (
    <div className="pg">
      <PageHeader
        crumbs={['Plateforme', 'Utilisateurs']}
        title="Utilisateurs"
        subtitle={resume ? `${formatNumber(resume.total)} comptes${resume.nouveaux_semaine ? ` · ${resume.nouveaux_semaine} nouveaux cette semaine` : ''}` : '…'}
        actions={
          <Button variant="ghost" size="sm" icon={Download} onClick={() => toast('Export CSV en préparation')}>
            Exporter CSV
          </Button>
        }
      />
      <div className="fbar2" style={{ marginBottom: 14 }} role="search">
        <label className="srch">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Rechercher un utilisateur</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, e-mail, ville…" />
        </label>
        <Tabs variant="boxed" label="Filtrer par rôle ou statut" tabs={FILTRES} value={filtre} onChange={setFiltre} />
      </div>
      <Panel style={{ padding: '6px 10px' }}>
        {loading ? (
          <SkeletonList />
        ) : error ? (
          <EmptyState image="fil" title="Impossible de charger les utilisateurs" text={error.message} />
        ) : (
          <DataTable
            caption="Liste des utilisateurs"
            selectable
            rows={rows}
            empty={<p className="muted" style={{ padding: 16 }}>Aucun compte ne correspond.</p>}
            bulkActions={(ids, clear) => (
              <>
                <Button size="sm" icon={Ban} onClick={() => setASuspendre({ ids: ids.filter((id) => id !== moi?.id), clear })}>
                  Suspendre
                </Button>
                <Button size="sm" icon={Mail} onClick={() => toast(`Message préparé pour ${ids.length} compte(s)`)}>
                  Message
                </Button>
              </>
            )}
            columns={[
              {
                key: 'user',
                header: 'Utilisateur',
                render: (u) => (
                  <div className="row" style={{ gap: 10 }}>
                    <Avatar name={u.nom_complet} color={u.couleur} size={36} />
                    <div>
                      <b style={{ color: 'var(--navy)', display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                        {u.nom_complet}
                        {u.role === 'organisateur' && <BadgeCheck size={14} aria-label="organisateur vérifié" />}
                      </b>
                      <br />
                      <small className="muted">{u.email}</small>
                    </div>
                  </div>
                ),
              },
              { key: 'role', header: 'Rôle', render: (u) => <Badge tone={(ROLE_BADGE[u.role] || ROLE_BADGE.utilisateur)[0]}>{(ROLE_BADGE[u.role] || ROLE_BADGE.utilisateur)[1]}</Badge> },
              { key: 'ville', header: 'Ville', render: (u) => u.ville || '—' },
              { key: 'activite', header: 'Activité', render: (u) => <span style={{ fontSize: 14 }}>{u.activite || '—'}</span> },
              { key: 'inscription', header: 'Inscription', render: (u) => <span className="muted" style={{ fontSize: 14 }}>{formatDate(u.date_inscription)}</span> },
              {
                key: 'etat',
                header: 'État',
                render: (u) => (
                  <span key={pop[u.id]} style={{ display: 'inline-block', animation: pop[u.id] ? 'scale-in .35s var(--out)' : undefined }}>
                    <StatutBadge statut={u.statut} label={`● ${STATUTS_COMPTE[u.statut]?.label || u.statut}`} />
                  </span>
                ),
              },
              {
                key: 'menu',
                header: <span className="sr-only">Actions</span>,
                align: 'right',
                render: (u) =>
                  u.id === moi?.id ? null : (
                    <Menu
                      className="urow-menu"
                      label={`Actions pour ${u.nom_complet}`}
                      items={[
                        { icon: Eye, label: 'Voir le profil', onSelect: () => toast('Fiche utilisateur : bientôt disponible') },
                        { icon: Mail, label: 'Envoyer un message', onSelect: () => toast(`Message à ${u.nom_complet}`) },
                        null,
                        u.statut !== 'actif' && { icon: RotateCcw, label: 'Réactiver', onSelect: () => changer(u, 'actif') },
                        u.statut === 'actif' && { icon: Ban, label: 'Suspendre…', danger: true, onSelect: () => setASuspendre({ ids: [u.id] }) },
                        u.statut !== 'desactive' && { icon: UserX, label: 'Désactiver', danger: true, onSelect: () => changer(u, 'desactive') },
                      ]}
                    />
                  ),
              },
            ]}
          />
        )}
      </Panel>

      <Modal
        open={!!aSuspendre}
        onClose={() => setASuspendre(null)}
        title={nomsASuspendre.length > 1 ? `Suspendre ${nomsASuspendre.length} comptes ?` : 'Suspendre ce compte ?'}
        actions={
          <>
            <Button variant="ghost" onClick={() => setASuspendre(null)}>
              Annuler
            </Button>
            <Button variant="danger-soft" icon={Ban} loading={busy} loadingText="Suspension…" onClick={confirmerSuspension} disabled={!nomsASuspendre.length}>
              Suspendre
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-2)' }}>
          {nomsASuspendre.length ? (
            <>
              <b>{nomsASuspendre.join(', ')}</b> ne pourra plus se connecter tant que le compte n’est pas réactivé.
            </>
          ) : (
            'Vous ne pouvez pas suspendre votre propre compte.'
          )}
        </p>
      </Modal>
    </div>
  );
}
