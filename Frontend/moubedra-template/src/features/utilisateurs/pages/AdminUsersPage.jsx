import { useState } from 'react';
import { Ban, BadgeCheck, Download, Eye, Mail, Search, UserCheck } from 'lucide-react';
import { Avatar, Badge, Button, DataTable, Menu, PageHeader, Panel, SkeletonList, StatutBadge, Tabs, useToast } from '../../../design/components';
import { formatDate, formatNumber } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import { changerStatutUtilisateur, getResumeUtilisateurs, listUtilisateurs } from '../api';
import '../utilisateurs.css';

const ROLE_BADGE = { citoyen: ['info', 'Citoyen'], organisateur: ['ok', 'Organisateur'], admin: ['grey', 'Admin'] };
const FILTRES = [
  { key: 'all', label: 'Tous' },
  { key: 'citoyen', label: 'Citoyen' },
  { key: 'organisateur', label: 'Organisateur' },
  { key: 'bloque', label: 'Bloqués' },
];

export default function AdminUsersPage() {
  const toast = useToast();
  // TODO(API): GET /api/utilisateurs/ — voir features/utilisateurs/api.js (listUtilisateurs)
  const { data: users, loading, setData } = useApi(listUtilisateurs, [], []);
  const { data: resume } = useApi(getResumeUtilisateurs, []);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [pop, setPop] = useState({});

  const setStatut = (ids, statut) => {
    setData((l) => l.map((u) => (ids.includes(u.id) ? { ...u, statut } : u)));
    setPop((p) => ({ ...p, ...Object.fromEntries(ids.map((id) => [id, Date.now()])) }));
    // TODO(API): PATCH /api/utilisateurs/<id>/ { statut } — voir features/utilisateurs/api.js (changerStatutUtilisateur)
    ids.forEach((id) => changerStatutUtilisateur(id, statut));
  };

  const toggleBlock = (u) => {
    const next = u.statut === 'bloque' ? 'actif' : 'bloque';
    const prev = u.statut;
    setStatut([u.id], next);
    toast(next === 'bloque' ? 'Compte bloqué · e-mail envoyé' : 'Compte débloqué', { undo: () => setStatut([u.id], prev) });
  };

  const s = q.trim().toLowerCase();
  const rows = users.filter(
    (u) => (role === 'all' || (role === 'bloque' ? u.statut === 'bloque' : u.role === role)) && (!s || `${u.nom_complet} ${u.email} ${u.ville}`.toLowerCase().includes(s)),
  );

  return (
    <div className="pg">
      <PageHeader
        crumbs={['Plateforme', 'Utilisateurs']}
        title="Utilisateurs"
        subtitle={resume ? `${formatNumber(resume.total)} comptes · ${resume.nouveaux_semaine} nouveaux cette semaine` : '…'}
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
        <Tabs variant="boxed" label="Filtrer par rôle" tabs={FILTRES} value={role} onChange={setRole} />
      </div>
      <Panel style={{ padding: '6px 10px' }}>
        {loading ? (
          <SkeletonList />
        ) : (
          <DataTable
            caption="Liste des utilisateurs"
            selectable
            rows={rows}
            bulkActions={(ids, clear) => (
              <>
                <Button
                  size="sm"
                  icon={Ban}
                  onClick={() => {
                    setStatut(ids, 'bloque');
                    toast(`${ids.length} compte(s) bloqué(s)`);
                    clear();
                  }}
                >
                  Bloquer
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
              { key: 'role', header: 'Rôle', render: (u) => <Badge tone={ROLE_BADGE[u.role][0]}>{ROLE_BADGE[u.role][1]}</Badge> },
              { key: 'ville', header: 'Ville' },
              { key: 'activite', header: 'Activité', render: (u) => <span style={{ fontSize: 14 }}>{u.activite}</span> },
              { key: 'inscription', header: 'Inscription', render: (u) => <span className="muted" style={{ fontSize: 14 }}>{formatDate(u.date_inscription)}</span> },
              {
                key: 'etat',
                header: 'État',
                render: (u) => (
                  <span key={pop[u.id]} style={{ display: 'inline-block', animation: pop[u.id] ? 'scale-in .35s var(--out)' : undefined }}>
                    <StatutBadge statut={u.statut} label={`● ${{ actif: 'Actif', bloque: 'Bloqué', inactif: 'À vérifier' }[u.statut]}`} />
                  </span>
                ),
              },
              {
                key: 'menu',
                header: <span className="sr-only">Actions</span>,
                align: 'right',
                render: (u) => (
                  <Menu
                    className="urow-menu"
                    label={`Actions pour ${u.nom_complet}`}
                    items={[
                      { icon: Eye, label: 'Voir le profil', onSelect: () => toast('Fiche utilisateur : bientôt disponible') },
                      { icon: Mail, label: 'Envoyer un message', onSelect: () => toast(`Message à ${u.nom_complet}`) },
                      { icon: UserCheck, label: 'Changer le rôle', onSelect: () => toast('Changement de rôle : bientôt disponible') },
                      null,
                      { icon: Ban, label: u.statut === 'bloque' ? 'Débloquer' : 'Bloquer', danger: true, onSelect: () => toggleBlock(u) },
                    ]}
                  />
                ),
              },
            ]}
          />
        )}
      </Panel>
    </div>
  );
}
