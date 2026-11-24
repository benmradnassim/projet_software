import { useRef, useState } from 'react';
import { ArrowRight, Check, CreditCard, Download, Gift, Info, Landmark, Lock, Mail, Share2, Smartphone } from 'lucide-react';
import { useAuth } from '../../../app/AuthContext';
import { Breadcrumb, Button, StepsBar, Toggle, confetti, useToast } from '../../../design/components';
import { formatNumber, tnd, tnd3 } from '../../../lib/format';
import { creerDon, getModesPaiement } from '../api';
import '../dons.css';

const MODES = getModesPaiement();
const METHODS = [
  ['carte', CreditCard, 'Carte bancaire', 'Visa, Mastercard, e-Dinar'],
  ['d17', Smartphone, 'D17', 'Paiement mobile La Poste'],
  ['virement', Landmark, 'Virement', 'RIB envoyé par e-mail'],
];

const impactText = (a) =>
  a >= 100 ? `Avec ${formatNumber(a)} TND, ${Math.floor(a / 50)} enfants reçoivent un cartable.` : a >= 50 ? 'Avec ce don, 1 enfant reçoit un cartable complet.' : `Avec ${formatNumber(a)} TND, un enfant reçoit une trousse complète.`;

/** Don en argent : Montant -> Paiement (Carte / D17 / Virement) -> Confirmation. */
export default function MoneyDonation({ campagne: c, initialAmount = 50 }) {
  const { user } = useAuth();
  const toast = useToast();
  const okRef = useRef(null);
  const [st, setSt] = useState(1);
  const [amt, setAmt] = useState(initialAmount);
  const [other, setOther] = useState('');
  const [fee, setFee] = useState(true);
  const [rec, setRec] = useState(false);
  const [pm, setPm] = useState('carte');
  const [anon, setAnon] = useState(false);
  const [card, setCard] = useState('');
  const [paying, setPaying] = useState(false);
  const [don, setDon] = useState(null);

  const frais = fee ? Math.round(amt * 0.04 * 1000) / 1000 : 0;
  const total = amt + frais;

  const pay = async () => {
    setPaying(true);
    // TODO(API): POST /api/dons/ { campagne, montant, mode_paiement } — voir features/dons/api.js (creerDon)
    const d = await creerDon({ campagne: c.id, montant: amt, mode_paiement: pm, anonyme: anon, recurrent: rec, frais });
    setDon(d);
    setPaying(false);
    setSt(3);
    setTimeout(() => confetti(okRef.current), 300);
  };

  const pmKey = (e) => {
    const i = METHODS.findIndex((m) => m[0] === pm);
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = METHODS[(i + d + METHODS.length) % METHODS.length][0];
    setPm(next);
    e.currentTarget.querySelector(`[data-m="${next}"]`)?.focus();
  };

  return (
    <div className="pg">
      <Breadcrumb items={[{ label: c.titre, to: `/campagnes/${c.id}` }, 'Faire un don']} />
      <h1 className="sr-only">Faire un don à « {c.titre} »</h1>
      <StepsBar steps={['Montant', 'Paiement', 'Confirmation']} current={st} />
      <div className="dg">
        <div className="panel">
          <div className="tabc" key={st}>
            {st === 1 && (
              <>
                <h2 style={{ fontSize: 26 }} id="amt-title">
                  Combien souhaitez-vous donner ?
                </h2>
                <div className="amts4" role="group" aria-labelledby="amt-title">
                  {[20, 50, 100, 200].map((a) => (
                    <button
                      key={a}
                      type="button"
                      aria-pressed={!other && a === amt}
                      onClick={() => {
                        setAmt(a);
                        setOther('');
                      }}
                    >
                      {a} TND
                    </button>
                  ))}
                </div>
                <label className="lbl" htmlFor="oth">
                  Autre montant
                </label>
                <div className="inp2">
                  <input
                    id="oth"
                    inputMode="decimal"
                    placeholder="Ex. : 35"
                    value={other}
                    onChange={(e) => {
                      setOther(e.target.value);
                      const v = parseFloat(e.target.value.replace(',', '.'));
                      if (v > 0) setAmt(v);
                    }}
                  />
                  <b style={{ color: 'var(--muted)' }}>TND</b>
                </div>
                <Toggle checked={fee} onChange={setFee}>
                  Ajouter 4 % pour couvrir les frais de la plateforme
                </Toggle>
                <Toggle checked={rec} onChange={setRec}>
                  Donner chaque mois (don récurrent)
                </Toggle>
                <Button size="wide" iconRight={ArrowRight} style={{ marginTop: 22 }} onClick={() => setSt(2)}>
                  Continuer
                </Button>
              </>
            )}
            {st === 2 && (
              <>
                <h2 style={{ fontSize: 26 }} id="pm-title">
                  Comment souhaitez-vous payer ?
                </h2>
                <div className="pm2" role="radiogroup" aria-labelledby="pm-title" onKeyDown={pmKey}>
                  {METHODS.map(([k, IconCmp, l, d]) => (
                    <button key={k} data-m={k} type="button" role="radio" aria-checked={pm === k} tabIndex={pm === k ? 0 : -1} onClick={() => setPm(k)}>
                      <span className="rd" aria-hidden="true" />
                      <IconCmp size={26} aria-hidden="true" />
                      <b>{l}</b>
                      <small>{d}</small>
                    </button>
                  ))}
                </div>
                <div className="tabc" key={pm}>
                  {pm === 'carte' && (
                    <>
                      <label className="lbl" htmlFor="ccn">
                        Numéro de carte
                      </label>
                      <div className="inp2">
                        <CreditCard size={18} aria-hidden="true" />
                        <input
                          id="ccn"
                          inputMode="numeric"
                          autoComplete="cc-number"
                          placeholder="1234 5678 9012 3456"
                          value={card}
                          onChange={(e) => setCard(e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '))}
                        />
                      </div>
                      <div className="fg2">
                        <div>
                          <label className="lbl" htmlFor="cexp">
                            Expiration
                          </label>
                          <div className="inp2">
                            <input id="cexp" autoComplete="cc-exp" placeholder="MM / AA" />
                          </div>
                        </div>
                        <div>
                          <label className="lbl" htmlFor="ccvc">
                            CVC
                          </label>
                          <div className="inp2">
                            <input id="ccvc" autoComplete="cc-csc" inputMode="numeric" placeholder="•••" />
                            <Info size={16} aria-label="Les 3 chiffres au dos de la carte" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  {pm === 'd17' && (
                    <>
                      <label className="lbl" htmlFor="d17">
                        Numéro de téléphone D17
                      </label>
                      <div className="inp2">
                        <b>+216</b>
                        <input id="d17" inputMode="tel" placeholder="22 123 456" />
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>Vous recevrez une demande de paiement dans l’application D17.</p>
                    </>
                  )}
                  {pm === 'virement' && (
                    <div className="impact3" style={{ marginTop: 4 }}>
                      <Mail size={16} aria-hidden="true" />
                      <span>Le RIB de l’association et la référence du don vous seront envoyés par e-mail.</span>
                    </div>
                  )}
                </div>
                <Toggle checked={anon} onChange={setAnon}>
                  Faire ce don de façon anonyme
                </Toggle>
                <div className="row" style={{ marginTop: 22 }}>
                  <Button variant="ghost" style={{ height: 54 }} onClick={() => setSt(1)}>
                    ← Retour
                  </Button>
                  <Button icon={Lock} loading={paying} loadingText="Paiement en cours…" style={{ flex: 1, justifyContent: 'center', height: 54, fontSize: 17 }} onClick={pay}>
                    Payer {tnd(total)} en toute sécurité
                  </Button>
                </div>
              </>
            )}
            {st === 3 && don && (
              <div className="okbox" aria-live="polite">
                <div className="okc" ref={okRef} aria-hidden="true">
                  <Check size={46} />
                </div>
                <h2 style={{ fontSize: 30 }}>Merci {user.prenom || user.first_name} !</h2>
                <p style={{ color: 'var(--muted)', marginTop: 6 }}>
                  {pm === 'd17'
                    ? 'Validez le paiement dans votre application D17. Votre don apparaîtra « en attente » jusqu’à confirmation.'
                    : pm === 'virement'
                      ? 'Le RIB vous a été envoyé par e-mail. Votre don sera confirmé à réception.'
                      : `Votre don est confirmé. ${impactText(amt)}`}
                </p>
                <div className="receipt">
                  <div className="li3">
                    <span>Campagne</span>
                    <b>{c.titre}</b>
                  </div>
                  <div className="li3">
                    <span>Montant</span>
                    <b>
                      {tnd(amt)}
                      {rec ? ' / mois' : ''}
                    </b>
                  </div>
                  <div className="li3">
                    <span>Paiement</span>
                    <b>{MODES[pm]}</b>
                  </div>
                  <div className="li3">
                    <span>Référence</span>
                    <b>{don.reference_paiement || '—'}</b>
                  </div>
                </div>
                <div className="row" style={{ justifyContent: 'center', marginTop: 18, gap: 10, flexWrap: 'wrap' }}>
                  <Button variant="ghost" size="sm" icon={Download} onClick={() => toast('Le reçu PDF sera disponible une fois l’API branchée')}>
                    Reçu PDF
                  </Button>
                  <Button variant="ghost" size="sm" icon={Share2} onClick={() => toast('Lien copié : « J’ai soutenu cette cause sur moubedra »')}>
                    Partager
                  </Button>
                  <Button variant="navy" size="sm" to={`/campagnes/${c.id}`}>
                    Retour à la campagne
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        <aside className="sticky2" aria-label="Récapitulatif du don">
          <div className="panel don-side">
            <img src={c.image} alt="" style={{ objectPosition: c.image_position }} />
            <span className="eyebrow" style={{ display: 'block', marginTop: 14 }}>
              Votre don soutient
            </span>
            <h3>{c.titre}</h3>
            <div className="li3">
              <span>Don</span>
              <b>{tnd3(amt)}</b>
            </div>
            <div className="li3">
              <span>Frais de plateforme (facultatif)</span>
              <span>{tnd3(frais)}</span>
            </div>
            <div className="li3 t" aria-live="polite">
              <span>Total</span>
              <span>{tnd(total)}</span>
            </div>
            <div className="impact3" style={{ marginTop: 12 }}>
              <Gift size={16} aria-hidden="true" />
              <span>{impactText(amt)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
