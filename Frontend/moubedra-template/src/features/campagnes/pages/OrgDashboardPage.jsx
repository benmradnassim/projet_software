import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Check, Plus, ScanLine, X } from 'lucide-react';
import { useAuth } from '../../../app/AuthContext';
import { Avatar, Badge, BarChart, Button, DateBadge, Icon, PageHeader, Panel, ProgressBar, SkeletonList, StatCard, TodoCards, confetti, useToast } from '../../../design/components';
import { formatTime, percent } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import { deciderDemande, getEvenement, listDemandesRecues } from '../../evenements';
import { getOrgDashboard } from '../api';
import '../campagnes.css';

export default function OrgDashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  // TODO(API): agrégats organisateur — voir features/campagnes/api.js (getOrgDashboard)
  const { data } = useApi(getOrgDashboard, []);
  // TODO(API): GET /api/participations/evenements/?statut=en_attente — voir features/evenements/api.js
  const { data: demandes, setData: setDemandes, loading } = useApi(listDemandesRecues, [], []);
  const { data: ev } = useApi(() => getEvenement(3), []);
  const [leaving, setLeaving] = useState(null);

  const decide = (d, ok, e) => {
    if (ok) confetti(e.currentTarget);
    setLeaving(d.id);
    // TODO(API): PATCH du statut de la participation — voir features/evenements/api.js (deciderDemande)
    deciderDemande(d.id, ok ? 'acceptee' : 'refusee');
    // TODO(API): l'annulation d'un refus doit repasser la demande en « en_attente »
    toast(ok ? 'Accepté·e : QR code envoyé' : 'Demande refusée', ok ? {} : { undo: () => setDemandes((l) => [d, ...l]) });
    setTimeout(() => {
      setDemandes((l) => l.filter((x) => x.id !== d.id));
      setLeaving(null);
    }, 450);
  };

  return (
    <div className="pg">
      <PageHeader
        crumbs={['Espace organisateur']}
        title={`Bonjour ${user.prenom}`}
        subtitle={
          <>
            {user.nom_organisation} · 4 campagnes · <BadgeCheck size={15} aria-hidden="true" /> organisatrice vérifiée
          </>
        }
        actions={
          <Button to="/organisateur/campagnes/nouvelle" icon={Plus}>
            Nouvelle campagne
          </Button>
        }
      />
      {data && (
        <>
          <TodoCards items={data.a_faire} />
          <div className="kpis2">
            {data.kpis.map((k) => (
              <StatCard key={k.libelle} icon={(p) => <Icon name={k.icone} {...p} />} label={k.libelle} value={k.valeur} suffix={k.unite} trend={k.tendance} />
            ))}
          </div>
        </>
      )}
      <div className="g2">
        <Panel title="Dons des 8 dernières semaines" action={data && <Badge tone="ok">{data.graphique.badge}</Badge>}>
          {data && (
            <BarChart
              title="Dons par semaine en milliers de TND"
              values={data.graphique.valeurs}
              labels={data.graphique.semaines}
              max={data.graphique.max}
              format={(v) => `${String(v).replace('.', ',')}k`}
            />
          )}
        </Panel>
        <Panel
          title="À valider"
          action={
            <Link className="lnk2" to="/organisateur/demandes">
              Tout voir
            </Link>
          }
        >
          {loading ? (
            <SkeletonList rows={3} />
          ) : demandes.length ? (
            <ul className="list" aria-live="polite">
              {demandes.slice(0, 3).map((d) => (
                <li key={d.id} className={`it${leaving === d.id ? ' leaving' : ''}`}>
                  <Avatar name={d.utilisateur_nom} color={d.couleur} />
                  <div className="gw">
                    <h4>{d.utilisateur_nom}</h4>
                    <small>
                      {ev?.titre} · {d.experience}
                    </small>
                  </div>
                  <button type="button" className="kob" aria-label={`Refuser ${d.utilisateur_nom}`} onClick={(e) => decide(d, false, e)}>
                    <X size={18} aria-hidden="true" />
                  </button>
                  <button type="button" className="okb" aria-label={`Accepter ${d.utilisateur_nom}`} onClick={(e) => decide(d, true, e)}>
                    <Check size={18} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Toutes les demandes sont traitées. 🎉</p>
          )}
        </Panel>
      </div>
      <Panel
        title="Prochains événements"
        style={{ marginTop: 20 }}
        action={
          <Link className="lnk2" to="/organisateur/evenements">
            Gérer
          </Link>
        }
      >
        {ev && (
          <div className="list">
            <div className="it">
              <DateBadge date={ev.date_evenement} />
              <div className="gw">
                <h4>{ev.titre}</h4>
                <small>
                  {formatTime(ev.date_evenement)} – {ev.heure_fin} · {ev.lieu}
                </small>
                <ProgressBar value={percent(ev.nb_participants, ev.capacite)} label={`${ev.nb_participants} inscrits sur ${ev.capacite}`} />
              </div>
              <Badge tone="wait">{demandes.length} en attente</Badge>
              <Button variant="navy" size="sm" icon={ScanLine} to="/organisateur/evenements">
                Mode jour J
              </Button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
