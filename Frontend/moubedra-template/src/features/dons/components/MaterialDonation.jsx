import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowRight, CalendarDays, CalendarPlus, CircleCheck, Info, PackageCheck, Store, Truck } from 'lucide-react';
import { useAuth } from '../../../app/AuthContext';
import { Breadcrumb, Button, Chip, StepsBar, confetti, useToast } from '../../../design/components';
import { dateParts } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import { NeedsList } from '../../campagnes';
import { getEvenement } from '../../evenements';
import { creerDonMateriel, getCreneaux } from '../api';
import MaterialProgress from './MaterialProgress';
import '../dons.css';

const CRENEAUX = getCreneaux();
const ETATS = ['Neuf', 'Très bon état', 'Bon état'];

/** Don matériel : Articles + état -> Remise (point / événement / Rapid-Poste) -> Code de dépôt QR + suivi. */
export default function MaterialDonation({ campagne: c, besoins, initial = [] }) {
  const { user } = useAuth();
  const toast = useToast();
  const okRef = useRef(null);
  const listRef = useRef(null);
  const [st, setSt] = useState(1);
  const [qty, setQty] = useState(() => besoins.items.map((_, k) => initial[k] || 0));
  const [etat, setEtat] = useState('Neuf');
  const [how, setHow] = useState('point');
  const [slot, setSlot] = useState('Sam. 28 nov.');
  const [sending, setSending] = useState(false);
  const [don, setDon] = useState(null);
  const [nudge, setNudge] = useState(0);
  // TODO(API): GET /api/evenements/<id>/ — voir features/evenements/api.js
  const { data: ev } = useApi(() => getEvenement(besoins.evenement), [besoins.evenement]);
  const total = qty.reduce((a, b) => a + b, 0);

  const options = [
    ['point', Store, 'Je dépose au point de collecte', `${besoins.point_collecte} · ${besoins.horaires}`],
    ['event', CalendarDays, 'Je les apporte à l’événement', ev ? `${ev.titre} · ${dateParts(ev.date_evenement).slice(0, 2).join(' ')}` : '…'],
    ['post', Truck, 'Je les envoie par Rapid-Poste', 'Adresse et référence envoyées par e-mail'],
  ];

  const confirm = async () => {
    setSending(true);
    // TODO(API): pas encore de modèle « don matériel » — voir features/dons/api.js (creerDonMateriel)
    const d = await creerDonMateriel({ campagne: c.id, quantites: qty, etat, remise: how, creneau: slot });
    setDon(d);
    setSending(false);
    setSt(3);
    setTimeout(() => confetti(okRef.current), 300);
  };

  const lignes = besoins.items.map((it, k) => (qty[k] ? [it.libelle, qty[k]] : null)).filter(Boolean);

  return (
    <div className="pg">
      <Breadcrumb items={[{ label: c.titre, to: `/campagnes/${c.id}` }, 'Don de matériel']} />
      <h1 className="sr-only">Don de matériel pour « {c.titre} »</h1>
      <StepsBar steps={['Articles', 'Remise', 'Confirmation']} current={st} />
      <div className="dg">
        <div className="panel">
          <div className="tabc" key={st}>
            {st === 1 && (
              <>
                <h2 style={{ fontSize: 26 }}>Qu’apportez-vous ?</h2>
                <p style={{ color: 'var(--muted)', margin: '4px 0 8px' }}>L’association a besoin de ces articles en priorité.</p>
                <div ref={listRef} className={nudge ? 'nudge' : undefined} key={nudge}>
                  <NeedsList besoins={besoins} quantites={qty} onChange={(k, v) => setQty((q) => q.map((x, i) => (i === k ? v : x)))} />
                </div>
                <span className="lbl" id="etat-lbl">
                  État des articles
                </span>
                <div className="chips" role="group" aria-labelledby="etat-lbl">
                  {ETATS.map((x) => (
                    <Chip key={x} active={x === etat} onClick={() => setEtat(x)}>
                      {x}
                    </Chip>
                  ))}
                </div>
                <div className="impact3" style={{ marginTop: 14 }}>
                  <CircleCheck size={16} aria-hidden="true" />
                  <span>Acceptés : articles propres et complets. Refusés : articles abîmés, sans étiquette de taille pour les vêtements.</span>
                </div>
                <Button
                  size="wide"
                  iconRight={ArrowRight}
                  style={{ marginTop: 20 }}
                  onClick={() => {
                    if (!total) {
                      toast('Ajoutez au moins un article');
                      setNudge((n) => n + 1);
                      return;
                    }
                    setSt(2);
                  }}
                >
                  Continuer
                </Button>
              </>
            )}
            {st === 2 && (
              <>
                <h2 style={{ fontSize: 26 }} id="how-title">
                  Comment les remettre ?
                </h2>
                <div role="radiogroup" aria-labelledby="how-title" style={{ marginTop: 14 }}>
                  {options.map(([k, IconCmp, l, d]) => (
                    <button key={k} type="button" role="radio" aria-checked={how === k} className="opt2" onClick={() => setHow(k)}>
                      <span className="oi" aria-hidden="true">
                        <IconCmp size={20} />
                      </span>
                      <div>
                        <b>{l}</b>
                        <small>{d}</small>
                      </div>
                    </button>
                  ))}
                </div>
                {how === 'point' && (
                  <div className="tabc">
                    <span className="lbl" id="slot-lbl">
                      Quand passez-vous ?
                    </span>
                    <div className="slots" role="group" aria-labelledby="slot-lbl">
                      {CRENEAUX.map((x) => (
                        <Chip key={x} active={x === slot} onClick={() => setSlot(x)}>
                          {x}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
                <div className="row" style={{ marginTop: 20 }}>
                  <Button variant="ghost" style={{ height: 54 }} onClick={() => setSt(1)}>
                    ← Retour
                  </Button>
                  <Button icon={PackageCheck} loading={sending} loadingText="Envoi…" style={{ flex: 1, justifyContent: 'center', height: 54, fontSize: 17 }} onClick={confirm}>
                    Confirmer mon don
                  </Button>
                </div>
              </>
            )}
            {st === 3 && don && (
              <div className="okbox" aria-live="polite">
                <div className="okc" ref={okRef} aria-hidden="true">
                  <PackageCheck size={44} />
                </div>
                <h2 style={{ fontSize: 30 }}>Merci {user.prenom || user.first_name} !</h2>
                <p style={{ color: 'var(--muted)', marginTop: 6 }}>
                  {how === 'post' ? 'Les instructions d’envoi arrivent par e-mail.' : 'Montrez ce code au moment du dépôt : l’association le scanne pour confirmer la réception.'}
                </p>
                <div className="ok-row">
                  {how !== 'post' && (
                    <span className="qr">
                      <QRCodeSVG value={`moubedra:depot:${don.code}`} size={134} fgColor="#1f2c40" title={`Code de dépôt ${don.code}`} />
                    </span>
                  )}
                  <div className="receipt">
                    <div className="li3">
                      <span>Code de dépôt</span>
                      <b>{don.code}</b>
                    </div>
                    {lignes.map(([l, q]) => (
                      <div className="li3" key={l}>
                        <span>{l}</span>
                        <b>× {q}</b>
                      </div>
                    ))}
                    <div className="li3">
                      <span>État</span>
                      <b>{etat}</b>
                    </div>
                    <div className="li3">
                      <span>Remise</span>
                      <b>{{ point: `Point de collecte · ${slot}`, event: 'À l’événement', post: 'Rapid-Poste' }[how]}</b>
                    </div>
                  </div>
                </div>
                <div style={{ maxWidth: 460, margin: '22px auto 0' }}>
                  <MaterialProgress etape={0} />
                </div>
                <div className="row" style={{ justifyContent: 'center', marginTop: 18, gap: 10, flexWrap: 'wrap' }}>
                  <Button variant="ghost" size="sm" icon={CalendarPlus} onClick={() => toast('Rappel ajouté à votre agenda')}>
                    Rappel dans l’agenda
                  </Button>
                  <Button variant="navy" size="sm" to="/espace/dons?onglet=materiel">
                    Voir mes dons
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        <aside className="sticky2" aria-label="Récapitulatif du don matériel">
          <div className="panel don-side">
            <img src={c.image} alt="" style={{ objectPosition: c.image_position, height: 140 }} />
            <span className="eyebrow" style={{ display: 'block', marginTop: 14 }}>
              Votre don matériel pour
            </span>
            <h3 style={{ marginBottom: 10 }}>{c.titre}</h3>
            <div aria-live="polite">
              {lignes.map(([l, q]) => (
                <div className="li3" key={l}>
                  <span>{l}</span>
                  <b>× {q}</b>
                </div>
              ))}
              {total ? (
                <div className="li3 t">
                  <span>Total</span>
                  <span>
                    {total} article{total > 1 ? 's' : ''}
                  </span>
                </div>
              ) : (
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>Aucun article choisi.</p>
              )}
            </div>
            <div className="impact3" style={{ marginTop: 12 }}>
              <Info size={16} aria-hidden="true" />
              <span>Les dons matériels ne sont pas encaissés : l’association confirme la réception, puis la remise aux bénéficiaires.</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
