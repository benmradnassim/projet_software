import { useRef, useState } from 'react';
import { Check, Clock3, Pencil, Plus, ScanLine } from 'lucide-react';
import { Button, DateBadge, PageHeader, Panel, ProgressBar, SkeletonList, useToast } from '../../../design/components';
import { percent } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import { getScans, listMesEvenements } from '../api';
import { horaire } from '../components/EventRow';
import '../evenements.css';

/** Mes événements + mode jour J (scanner des QR codes des bénévoles et des dépôts de matériel). */
export default function MyEventsPage() {
  const toast = useToast();
  // TODO(API): remplacer par GET /api/evenements/?organisateur=<moi> — voir features/evenements/api.js (listMesEvenements)
  const { data: events, loading } = useApi(listMesEvenements, [], []);
  // TODO(API): pas encore d'endpoint de pointage — voir features/evenements/api.js (getScans)
  const { data: scans } = useApi(getScans, []);
  const [log, setLog] = useState([]);
  const [flash, setFlash] = useState(0);
  const [k, setK] = useState(0);
  const scanRef = useRef(null);

  const simulate = () => {
    const n = scans.simules[k % scans.simules.length];
    setK((x) => x + 1);
    setLog((l) => [{ ...n, id: Date.now(), detail: `${n.detail} · ${new Date().toTimeString().slice(0, 5)}` }, ...l]);
    setFlash((f) => f + 1);
  };

  const entries = scans ? [...log, ...scans.initiaux.map((s, i) => ({ ...s, id: `i${i}` }))] : log;

  return (
    <div className="pg">
      <PageHeader
        crumbs={['Mes actions', 'Mes événements']}
        title="Mes événements"
        subtitle="Inscriptions, capacité et accueil le jour J."
        actions={
          <Button icon={Plus} onClick={() => toast('Le formulaire suit le même modèle que « Nouvelle campagne »')}>
            Nouvel événement
          </Button>
        }
      />
      <div className="g2">
        <div className="evl">
          {loading ? (
            <div className="panel">
              <SkeletonList rows={2} />
            </div>
          ) : (
            events.map((e, i) => (
              <article key={e.id} className="evc" style={{ animationDelay: `${i * 0.06}s` }}>
                <img src={e.image} alt="" style={{ objectPosition: e.image_position, width: 140, height: 100 }} />
                <DateBadge date={e.date_evenement} />
                <div className="gw">
                  <h3>{e.titre}</h3>
                  <div className="meta2">
                    <Clock3 size={14} aria-hidden="true" /> {horaire(e)} · {e.lieu}
                  </div>
                  <div style={{ maxWidth: 260, marginTop: 6 }}>
                    <ProgressBar value={percent(e.nb_participants, e.capacite)} label={`${e.nb_participants} inscrits sur ${e.capacite}`} />
                    <small className="muted">
                      {e.nb_participants} / {e.capacite} inscrits · {e.nb_en_attente} en attente
                    </small>
                  </div>
                </div>
                <div className="acts">
                  <Button
                    variant="navy"
                    size="sm"
                    icon={ScanLine}
                    onClick={() => {
                      scanRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      scanRef.current?.querySelector('button')?.focus({ preventScroll: true });
                    }}
                  >
                    Jour J
                  </Button>
                  <Button variant="ghost" size="sm" icon={Pencil} onClick={() => toast('Modification de l’événement : bientôt disponible')}>
                    Modifier
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>
        <div ref={scanRef}>
          <Panel title="Mode jour J">
            <div className={`scan${flash ? ' flash' : ''}`} key={flash} role="img" aria-label="Zone de scan du QR code">
              <i aria-hidden="true" />
              <span>Placez le QR code du bénévole ou du dépôt dans le cadre</span>
            </div>
            <ul className="list scanlog" style={{ marginTop: 10 }} aria-live="polite" aria-label="Arrivées enregistrées">
              {entries.map((s) => (
                <li className="it" key={s.id}>
                  <span className="okb" aria-hidden="true">
                    <Check size={16} />
                  </span>
                  <div className="gw">
                    <h4>{s.nom}</h4>
                    <small>{s.detail}</small>
                  </div>
                </li>
              ))}
            </ul>
            <Button variant="ghost" size="sm" block style={{ marginTop: 10 }} onClick={simulate} disabled={!scans}>
              Simuler un scan
            </Button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
