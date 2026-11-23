import { useRef, useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { Button, EmptyState, PageHeader, SkeletonList, confetti, useToast } from '../../../design/components';
import { useApi } from '../../../lib/useApi';
import { deciderRevue, getPointsDeControle, listCampagnesEnRevue } from '../api';
import CampaignCard from '../components/CampaignCard';
import '../campagnes.css';

const POINTS_DE_CONTROLE = getPointsDeControle();

function Review({ c, index, onDone }) {
  const [checks, setChecks] = useState(c.controles);
  const [out, setOut] = useState(null);
  const okRef = useRef(null);
  const all = checks.every(Boolean);
  const finish = (decision, msg, color) => {
    if (decision === 'publier') confetti(okRef.current);
    setOut(color);
    setTimeout(() => onDone(c, decision, msg), 900);
  };
  return (
    <section
      className={`panel rcv2${out ? ' out' : ''}`}
      style={{ animationDelay: `${index * 0.08}s`, boxShadow: out ? `0 0 0 2px ${out}` : undefined, transitionDelay: out ? '.4s' : undefined }}
      aria-labelledby={`rc-${c.id}`}
    >
      <CampaignCard campagne={{ ...c, nb_donateurs: 0 }} preview />
      <div>
        <h3 id={`rc-${c.id}`} style={{ fontSize: 22 }}>
          {c.titre}
        </h3>
        <small className="muted">
          {c.organisation} · envoyée {c.envoyee}
        </small>
        <fieldset style={{ border: 0, marginTop: 14 }}>
          <legend className="lbl" style={{ margin: '0 0 6px' }}>
            Points de contrôle
          </legend>
          {POINTS_DE_CONTROLE.map((label, i) => (
            <label className="ckl" key={label}>
              <input type="checkbox" checked={checks[i]} onChange={() => setChecks((x) => x.map((v, j) => (j === i ? !v : v)))} />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
        <div className="row" style={{ marginTop: 14, gap: 10, flexWrap: 'wrap' }}>
          <Button variant="ghost" icon={X} onClick={() => finish('refuser', 'Campagne refusée', '#d9472b')}>
            Refuser
          </Button>
          <Button variant="ghost" icon={Pencil} onClick={() => finish('corriger', 'Correction demandée à l’organisateur', '#e8963a')}>
            Demander une correction
          </Button>
          <Button
            ref={okRef}
            icon={Check}
            style={{ flex: 1, justifyContent: 'center' }}
            disabled={!all}
            title={all ? undefined : 'Cochez tous les points de contrôle'}
            aria-describedby={all ? undefined : `hint-${c.id}`}
            onClick={() => finish('publier', 'Campagne publiée, l’organisateur est prévenu', '#4f7f42')}
          >
            Publier
          </Button>
        </div>
        {!all && (
          <small id={`hint-${c.id}`} className="field-hint">
            Cochez tous les points de contrôle pour publier.
          </small>
        )}
      </div>
    </section>
  );
}

export default function AdminCampaignsPage() {
  const toast = useToast();
  // TODO(API): remplacer par GET /api/campagnes/?statut=brouillon — voir features/campagnes/api.js (listCampagnesEnRevue)
  const { data, loading, setData } = useApi(listCampagnesEnRevue, [], []);
  const onDone = (c, decision, msg) => {
    // TODO(API): PATCH /api/campagnes/<id>/ — voir features/campagnes/api.js (deciderRevue)
    deciderRevue(c.id, decision);
    setData((l) => l.filter((x) => x.id !== c.id));
    toast(msg);
  };
  return (
    <div className="pg">
      <PageHeader crumbs={['File d’attente', 'Revue des campagnes']} title="Revue des campagnes" subtitle="Aucune campagne n’est publiée sans relecture humaine." />
      {loading ? (
        <div className="panel">
          <SkeletonList />
        </div>
      ) : data.length ? (
        data.map((c, i) => <Review key={c.id} c={c} index={i} onDone={onDone} />)
      ) : (
        <EmptyState image="campagnes" title="Tout est relu !" text="Aucune campagne en attente de revue pour le moment." />
      )}
    </div>
  );
}
