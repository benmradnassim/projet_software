import { Link } from 'react-router-dom';
import { CalendarPlus, ChevronRight, Download, QrCode } from 'lucide-react';
import { useAuth } from '../../../app/AuthContext';
import { Badge, Breadcrumb, Button, CountUp, DateBadge, Icon, Panel, ProgressBar, SkeletonList, useToast } from '../../../design/components';
import { formatTime } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import { listCampagnes, pctCampagne } from '../../campagnes';
import { getEvenement } from '../../evenements';
import { getTableauDeBord } from '../api';
import '../utilisateurs.css';

export default function CitizenDashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  // TODO(API): agrégats citoyen — voir features/utilisateurs/api.js (getTableauDeBord)
  const { data: tdb } = useApi(getTableauDeBord, []);
  // TODO(API): GET /api/campagnes/ et GET /api/evenements/<id>/ — voir les api.js des features campagnes et evenements
  const { data: campagnes } = useApi(listCampagnes, [], []);
  const { data: rdv } = useApi(() => getEvenement(1), []);
  const camp = (id) => campagnes.find((c) => c.id === id);
  const prenom = user.prenom || user.first_name;

  return (
    <div className="pg">
      <Breadcrumb items={[`Bonjour ${prenom} 👋`]} />
      <h1 className="sr-only">Tableau de bord</h1>
      <div className="g2" style={{ marginBottom: 20 }}>
        <Panel className="impact-panel">
          <span className="eyebrow">Votre impact en 2026</span>
          <h2>
            Merci {prenom}, vous avez aidé {tdb?.nb_causes ?? 3} causes. </h2>
          <p>Voici ce que vos gestes ont rendu possible cette année.</p>
          <div className="vals">
            {tdb?.impact.map((k) => (
              <div key={k.libelle}>
                <b>{k.compteur ? <CountUp value={Number(k.valeur)} duration={1200} /> : k.valeur}</b>
                <small>{k.libelle}</small>
              </div>
            ))}
          </div>
        </Panel>
        <Panel className="rdv-panel">
          <span className="eyebrow">Votre prochain rendez-vous</span>
          {rdv && (
            <>
              <div className="row" style={{ marginTop: 12 }}>
                <DateBadge date={rdv.date_evenement} light />
                <div>
                  <b style={{ font: '800 19px var(--display)', color: 'var(--navy)' }}>{rdv.titre}</b>
                  <p style={{ fontSize: 14, color: 'var(--muted)' }}>
                    {rdv.ville} · {formatTime(rdv.date_evenement)}
                  </p>
                  <Badge tone="ok">✓ Participation acceptée</Badge>
                </div>
              </div>
              <div className="row" style={{ marginTop: 16, gap: 10 }}>
                <Button variant="navy" size="sm" icon={QrCode} to={`/evenements/${rdv.id}`}>
                  Mon QR code ? </Button>
                <Button variant="ghost" size="sm" icon={CalendarPlus} onClick={() => toast('Ajouté à votre agenda')}>
                  Agenda ? </Button>
              </div>
            </>
          )}
        </Panel>
      </div>
      <div className="g2">
        <div>
          <Panel
            title="Mon activité récente"
            action={
              <Link className="lnk2" to="/espace/notifications">
                Tout voir ? </Link>
            }
          >
            {!tdb ? (
              <SkeletonList />
            ) : (
              <ul className="list">
                {tdb.activite.map((a) => (
                  <li className="it" key={a.titre}>
                    <span className="ic2" style={{ background: a.fond, color: a.couleur }} aria-hidden="true">
                      <Icon name={a.icone} size={20} />
                    </span>
                    <div className="gw">
                      <h4>{a.titre}</h4>
                      <small>{a.info}</small>
                    </div>
                    {a.badge && <Badge tone={a.badge.ton}>{a.badge.texte}</Badge>}
                    {a.action === 'recu' && (
                      <Button variant="ghost" size="sm" icon={Download} onClick={() => toast('Le reçu PDF sera disponible une fois l’API branchée')}>
                        Reçu
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel
            title="Campagnes que vous suivez"
            style={{ marginTop: 20 }}
            action={
              <Link className="lnk2" to="/campagnes">
                Explorer ? </Link>
            }
          >
            <ul className="list">
              {tdb?.suivies.map(camp).filter(Boolean).map((c) => (
                <li key={c.id}>
                  <Link to={`/campagnes/${c.id}`} className="it link">
                    <img className="thumb" src={c.image} alt="" style={{ objectPosition: c.image_position }} />
                    <div className="gw">
                      <h4>{c.titre}</h4>
                      <small>
                        {c.ville} · {c.jours_restants} jours restants ? </small>
                      <ProgressBar value={pctCampagne(c)} label={`${pctCampagne(c)} % financé`} />
                    </div>
                    <b style={{ font: '800 18px var(--display)', color: 'var(--navy)' }}>{pctCampagne(c)} %</b>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
        <Panel title="Choisies pour vous">
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: '-6px 0 6px' }}>Selon votre ville : {user.ville} et alentours</p>
          <ul className="list">
            {tdb?.pour_vous.map(camp).filter(Boolean).map((c) => (
              <li key={c.id}>
                <Link to={`/campagnes/${c.id}`} className="it link">
                  <img className="thumb" src={c.image} alt="" style={{ objectPosition: c.image_position }} />
                  <div className="gw">
                    <h4>{c.titre}</h4>
                    <small>
                      {c.ville} · {pctCampagne(c)} %{c.urgent && <b style={{ color: 'var(--no-fg)' }}> · urgent</b>}
                    </small>
                  </div>
                  <ChevronRight size={18} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
