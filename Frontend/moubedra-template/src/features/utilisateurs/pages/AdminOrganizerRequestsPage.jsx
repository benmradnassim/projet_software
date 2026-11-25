import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Check, CircleCheck, Info, Mail, X } from 'lucide-react';
import { Avatar, Badge, Button, EmptyState, Input, PageHeader, Panel, SkeletonList, confetti, useToast } from '../../../design/components';
import { useApi } from '../../../lib/useApi';
import { getVerifications, listDemandesOrganisateur, traiterDemandeOrganisateur } from '../api';
import '../utilisateurs.css';

const VERIFS = getVerifications();
const ETATS = { en_attente: ['wait', 'À vérifier'], acceptee: ['ok', 'Validée'], refusee: ['no', 'Refusée'], infos: ['info', 'Infos demandées'] };

/** Demandes organisateur : liste + dossier + vérifications ; passe automatiquement au dossier suivant. */
export default function AdminOrganizerRequestsPage() {
  const toast = useToast();
  // TODO(API): GET /api/demandes-organisateur/ — voir features/utilisateurs/api.js (listDemandesOrganisateur)
  const { data: list, loading, setData } = useApi(listDemandesOrganisateur, [], []);
  const [sel, setSel] = useState(null);
  const [msg, setMsg] = useState('');
  const okRef = useRef(null);

  useEffect(() => {
    if (sel === null && list.length) setSel(list[0].id);
  }, [list, sel]);

  const r = list.find((x) => x.id === sel);

  const decide = (statut) => {
    if (statut === 'acceptee') confetti(okRef.current);
    // TODO(API): PATCH /api/demandes-organisateur/<id>/ — voir features/utilisateurs/api.js (traiterDemandeOrganisateur)
    traiterDemandeOrganisateur(r.id, statut, msg);
    setData((l) => l.map((x) => (x.id === r.id ? { ...x, statut } : x)));
    toast(`${ETATS[statut][1]} · e-mail envoyé à ${r.utilisateur_nom}`);
    setMsg('');
    const next = list.find((x) => x.id !== r.id && x.statut === 'en_attente');
    if (next) setTimeout(() => setSel(next.id), 700);
  };

  const allOk = r?.verifications.every(Boolean);

  return (
    <div className="pg">
      <PageHeader crumbs={['File d’attente', 'Demandes organisateur']} title="Demandes organisateur" subtitle="Vérifiez chaque structure avant de lui donner le badge." />
      {loading ? (
        <Panel>
          <SkeletonList />
        </Panel>
      ) : !list.length ? (
        <EmptyState title="Aucune demande" text="Les nouvelles demandes apparaîtront ici." />
      ) : (
        <div className="g2" style={{ gridTemplateColumns: '1fr 1.2fr' }}>
          <Panel style={{ padding: 8 }}>
            <ul className="list" aria-label="Demandes">
              {list.map((x) => (
                <li key={x.id}>
                  <button type="button" className="it orq" aria-current={x.id === sel} onClick={() => setSel(x.id)}>
                    <Avatar name={x.utilisateur_nom} color={x.couleur} />
                    <div className="gw">
                      <h4>{x.nom_structure || x.utilisateur_nom}</h4>
                      <small>
                        {x.utilisateur_nom} · {x.ville} · {x.date_demande}
                      </small>
                    </div>
                    <Badge tone={ETATS[x.statut][0]}>{ETATS[x.statut][1]}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
          {r && (
            <Panel aria-live="polite">
              <div className="tabc" key={r.id}>
                <div className="row" style={{ gap: 14 }}>
                  <Avatar name={r.utilisateur_nom} color={r.couleur} size={52} />
                  <div>
                    <h3 style={{ fontSize: 22 }}>{r.nom_structure || 'Aucune structure indiquée'}</h3>
                    <small className="muted">
                      Demandé par {r.utilisateur_nom} · {r.ville}
                    </small>
                  </div>
                </div>
                <span className="lbl">Présentation</span>
                <p className="motif-box">{r.motif}</p>
                <span className="lbl">Vérifications</span>
                <ul>
                  {VERIFS.map((v, i) => (
                    <li className="check-row" key={v}>
                      <span className={r.verifications[i] ? 'okb' : 'kob'} aria-hidden="true">
                        {r.verifications[i] ? <Check size={14} /> : <X size={14} />}
                      </span>
                      <span>
                        {v}
                        <span className="sr-only">{r.verifications[i] ? ' : oui' : ' : non'}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                {allOk ? (
                  <div className="impact3" style={{ marginTop: 10 }}>
                    <CircleCheck size={16} aria-hidden="true" />
                    <span>Toutes les vérifications sont au vert.</span>
                  </div>
                ) : (
                  <div className="impact3 warn" style={{ marginTop: 10 }}>
                    <Info size={16} aria-hidden="true" />
                    <span>{r.motif.length < 60 ? 'Présentation trop courte et aucune structure : demandez plus d’informations.' : 'Justificatif manquant : vous pouvez valider ou le demander.'}</span>
                  </div>
                )}
                <Input as="textarea" label="Message à l’organisateur (facultatif)" style={{ height: 80 }} placeholder="Ex. : merci de joindre votre récépissé…" value={msg} onChange={(e) => setMsg(e.target.value)} />
                {r.statut === 'en_attente' ? (
                  <div className="row" style={{ marginTop: 14, gap: 10, flexWrap: 'wrap' }}>
                    <Button variant="ghost" icon={X} onClick={() => decide('refusee')}>
                      Refuser ? </Button>
                    <Button variant="ghost" icon={Mail} onClick={() => decide('infos')}>
                      Demander des infos ? </Button>
                    <Button ref={okRef} icon={BadgeCheck} style={{ flex: 1, justifyContent: 'center' }} onClick={() => decide('acceptee')}>
                      Valider et donner le badge ? </Button>
                  </div>
                ) : (
                  <p style={{ marginTop: 14 }}>
                    <Badge tone={ETATS[r.statut][0]}>Décision : {ETATS[r.statut][1]}</Badge>
                  </p>
                )}
              </div>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}
