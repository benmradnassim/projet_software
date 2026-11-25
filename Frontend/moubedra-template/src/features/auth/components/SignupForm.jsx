import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Check, ChevronDown, ChevronRight, Heart, Landmark, Lock, Mail, MapPin, Megaphone, Sparkles, User } from 'lucide-react';
import { useAuth } from '../../../app/AuthContext';
import { Button, FloatingField, StepsBar, confetti } from '../../../design/components';
import { formatPhone } from '../../../lib/format';
import { emailDejaUtilise, getGouvernorats, getPresDeChezVous, inscription } from '../api';
import { EyeToggle, emailOk } from './LoginForm';

const GOV = getGouvernorats();
const RULES = [
  ['len', '8 caractères minimum'],
  ['num', 'Pas uniquement des chiffres'],
  ['mix', 'Une lettre et un chiffre'],
  ['name', 'Différent de votre nom ou e-mail'],
];
const METER = ['#d9472b', '#e8963a', '#c9b13a', '#4f7f42'];

/** Règles de mot de passe (alignées sur les validateurs Django : longueur, numérique, similarité). */
function checkPassword(v, { prenom, nom, email }) {
  const low = v.toLowerCase();
  const names = [prenom, nom, email.split('@')[0]].filter((x) => x.length > 2).map((x) => x.toLowerCase());
  const r = {
    len: v.length >= 8,
    num: v.length > 0 && !/^\d+$/.test(v),
    mix: /[a-zA-Z]/.test(v) && /\d/.test(v),
    name: v.length > 0 && !names.some((n) => low.includes(n)),
  };
  const score = Math.min(4, Object.values(r).filter(Boolean).length + (v.length >= 12 ? 1 : 0));
  return { r, score, ok: r.len && r.num && r.name };
}

/** Inscription en 3 étapes : Vous -> Votre ville / association -> Bienvenue. */
export default function SignupForm({ acct, setAcct }) {
  const { loginDemo, login, isDemo } = useAuth();
  const [step, setStep] = useState(1);
  const [back, setBack] = useState(false);
  const [f, setF] = useState({ prenom: '', nom: '', email: '', password: '', ville: '', org: '', motif: '', tel: '', cgu: false });
  const [errs, setErrs] = useState({});
  const [show, setShow] = useState(false);
  const [creating, setCreating] = useState(false);
  const heartRef = useRef(null);
  const typeRefs = useRef({});
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const pw = useMemo(() => checkPassword(f.password, f), [f]);
  const asso = acct === 'asso';
  const near = f.ville && (getPresDeChezVous(f.ville) || `Des actions solidaires existent déjà à ${f.ville}. Soyez parmi les premiers !`);

  const go = (n) => {
    setBack(n < step);
    setStep(n);
    if (n === 3) setTimeout(() => confetti(heartRef.current), 350);
  };

  const next1 = () => {
    const e = {};
    if (!f.prenom.trim()) e.prenom = 'Entrez votre prénom.';
    if (!f.nom.trim()) e.nom = 'Entrez votre nom.';
    if (!emailOk(f.email)) e.email = f.email ? 'Cette adresse e-mail ne semble pas valide.' : 'Entrez votre adresse e-mail.';
    else if (emailDejaUtilise(f.email)) e.email = 'exists';
    if (!pw.ok) e.password = 'Le mot de passe ne respecte pas encore toutes les règles.';
    setErrs(e);
    if (Object.keys(e).length) {
      document.getElementById(`s-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    go(2);
  };

  const create = async () => {
    const e = {};
    if (!f.ville) e.ville = 'Choisissez votre gouvernorat.';
    if (asso && !f.org.trim()) e.org = 'Entrez le nom de votre association.';
    if (asso && f.motif.trim().length < 40) e.motif = 'Quelques phrases de plus (40 caractères min.) pour aider notre équipe à vous vérifier.';
    if (!f.cgu) e.cgu = 'Veuillez accepter les conditions pour continuer.';
    setErrs(e);
    if (Object.keys(e).length) return;
    setCreating(true);
    try {
      // TODO(API): POST /api/auth/inscription/ (+ POST /api/demandes-organisateur/ pour une association) — voir features/auth/api.js
      await inscription({ email: f.email, password: f.password, nom: f.nom, prenom: f.prenom, telephone: f.tel ? `+216 ${f.tel}` : '', ville: f.ville });
      if (isDemo) {
        const nom_complet = `${f.prenom.trim()} ${f.nom.trim()}`;
        loginDemo('citoyen', { prenom: f.prenom.trim(), first_name: f.prenom.trim(), nom: f.nom.trim(), last_name: f.nom.trim(), nom_complet, email: f.email, ville: f.ville, sous_titre: `Citoyen·ne · ${f.ville}` });
      } else {
        await login({ email: f.email, password: f.password });
      }
      go(3);
    } catch (err) {
      setErrs(err.fields?.email ? { email: err.fields.email } : { cgu: err.message });
      if (err.fields?.email) go(1);
    } finally {
      setCreating(false);
    }
  };

  const onTypeKey = (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const next = acct === 'cit' ? 'asso' : 'cit';
    setAcct(next);
    typeRefs.current[next]?.focus();
  };

  const emailError =
    errs.email === 'exists' ? (
      <>
        Un compte existe déjà avec cet e-mail.{' '}
        <Link className="lnk" to="/connexion">
          Se connecter ? </Link>
      </>
    ) : (
      errs.email
    );

  return (
    <div className="pane" aria-labelledby="signup-title">
      <StepsBar compact lastIsCheck steps={['Vous', asso ? 'Votre association' : 'Votre ville', 'Bienvenue']} current={step} />

      {step === 1 && (
        <section className={`sl${back ? ' back' : ''}`} aria-labelledby="signup-title">
          <h1 id="signup-title">Créons votre compte</h1>
          <p className="sub2">Gratuit, en moins d’une minute.</p>
          <div className="atype" role="radiogroup" aria-label="Type de compte" onKeyDown={onTypeKey}>
            {[
              ['cit', User, 'Citoyen·ne', 'Je veux donner, aider, participer'],
              ['asso', Landmark, 'Association', 'Je veux lancer des campagnes'],
            ].map(([k, IconCmp, t, d]) => (
              <button
                key={k}
                ref={(el) => {
                  typeRefs.current[k] = el;
                }}
                type="button"
                role="radio"
                aria-checked={acct === k}
                tabIndex={acct === k ? 0 : -1}
                onClick={() => setAcct(k)}
              >
                <span className="ai2" aria-hidden="true">
                  <IconCmp size={18} />
                </span>
                <b>{t}</b>
                <small>{d}</small>
                <i className="rd" aria-hidden="true" />
              </button>
            ))}
          </div>
          <p className="atnote" aria-live="polite">
            {asso ? 'Votre compte est créé tout de suite ; votre association est vérifiée par notre équipe sous 48 h.' : ''}
          </p>
          <div className="two2">
            <FloatingField id="s-prenom" label="Prénom" autoComplete="given-name" value={f.prenom} onChange={set('prenom')} error={errs.prenom} />
            <FloatingField id="s-nom" label="Nom" autoComplete="family-name" value={f.nom} onChange={set('nom')} error={errs.nom} />
          </div>
          <FloatingField
            id="s-email"
            label="Adresse e-mail"
            icon={Mail}
            type="email"
            autoComplete="email"
            value={f.email}
            onChange={(e) => {
              set('email')(e);
              setErrs((x) => ({ ...x, email: '' }));
            }}
            valid={emailOk(f.email) && !errs.email}
            error={emailError}
            right={
              <span className="ok" aria-hidden="true">
                <Check size={18} />
              </span>
            }
          />
          <FloatingField
            id="s-password"
            label="Mot de passe"
            icon={Lock}
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            value={f.password}
            onChange={set('password')}
            error={errs.password}
            aria-describedby="pw-rules"
            right={<EyeToggle shown={show} onToggle={() => setShow((s) => !s)} />}
          />
          <div className="meter" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} style={{ background: i < pw.score ? METER[pw.score - 1] : undefined }} />
            ))}
          </div>
          <ul className="rules2" id="pw-rules" aria-label="Règles du mot de passe">
            {RULES.map(([k, l]) => (
              <li key={k} className={pw.r[k] ? 'ok' : undefined}>
                {l}
                <span className="sr-only">{pw.r[k] ? ' : respectée' : ' : non respectée'}</span>
              </li>
            ))}
          </ul>
          <Button variant="navy" size="wide" iconRight={ArrowRight} onClick={next1}>
            Continuer ? </Button>
        </section>
      )}

      {step === 2 && (
        <section className={`sl${back ? ' back' : ''}`} aria-labelledby="signup-title2">
          <h1 id="signup-title2">Où agissez-vous ?</h1>
          <p className="sub2">On vous montre d’abord les causes et les événements près de chez vous.</p>
          <FloatingField
            as="select"
            label={asso ? 'Gouvernorat de l’association' : 'Gouvernorat'}
            icon={MapPin}
            value={f.ville}
            className={f.ville ? 'filled' : ''}
            error={errs.ville}
            onChange={(e) => {
              set('ville')(e);
              setErrs((x) => ({ ...x, ville: '' }));
            }}
            right={
              <span className="chev" aria-hidden="true">
                <ChevronDown size={18} />
              </span>
            }
          >
            <option value="" disabled hidden />
            {GOV.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </FloatingField>
          <div className={`nearby${near ? ' on' : ''}`} aria-live="polite">
            {near && (
              <div>
                <Sparkles size={16} aria-hidden="true" /> {near}
              </div>
            )}
          </div>
          {asso && (
            <div className="assof">
              <FloatingField label="Nom de l’association" icon={Landmark} value={f.org} onChange={set('org')} error={errs.org} />
              <FloatingField
                as="textarea"
                label="Présentez votre association et vos actions"
                maxLength={600}
                value={f.motif}
                onChange={set('motif')}
                error={errs.motif}
                right={<span className="cnt2">{f.motif.length} / 600 · 40 min.</span>}
              />
            </div>
          )}
          <div className="fld tel">
            <span className="pre" aria-hidden="true">
              🇹🇳 +216
            </span>
            <input id="s-tel" inputMode="tel" placeholder=" " autoComplete="tel-national" value={f.tel} onChange={(e) => setF((x) => ({ ...x, tel: formatPhone(e.target.value) }))} aria-describedby="tel-hint" />
            <label htmlFor="s-tel">Téléphone (facultatif)</label>
            <small className="field-hint" id="tel-hint">
              Pour que l’organisateur puisse vous joindre le jour d’un événement. ? </small>
          </div>
          <label className={`ck2 cgu${errs.cgu ? ' shake' : ''}`}>
            <input type="checkbox" checked={f.cgu} onChange={(e) => setF((x) => ({ ...x, cgu: e.target.checked }))} aria-describedby="cgu-err" aria-invalid={!!errs.cgu || undefined} />
            <i aria-hidden="true">
              <Check size={13} />
            </i>
            <span>
              J’accepte les <a className="lnk" href="#cgu">conditions d’utilisation</a> et la <a className="lnk" href="#confidentialite">politique de confidentialité</a>.
            </span>
          </label>
          <small className="cgu-err" id="cgu-err" role={errs.cgu ? 'alert' : undefined}>
            {errs.cgu}
          </small>
          <div className="row3">
            <Button variant="ghost" onClick={() => go(1)}>
              ← Retour ? </Button>
            <Button size="wide" icon={Heart} loading={creating} loadingText="Création…" onClick={create}>
              Créer mon compte ? </Button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="sl welcome" aria-labelledby="welcome-title" aria-live="polite">
          <div className="bigheart" ref={heartRef} aria-hidden="true">
            <Heart size={40} />
          </div>
          <h1 id="welcome-title">Bienvenue {f.prenom.trim() || 'Nour'} !</h1>
          <p className="sub2">{asso ? 'Votre compte est prêt. Voici où en est votre association :' : 'Votre compte citoyen est prêt. Par quoi voulez-vous commencer ?'}</p>
          {asso ? (
            <div className="atl">
              <ol style={{ listStyle: 'none' }}>
                <li className="st2 ok">
                  <i aria-hidden="true">
                    <Check size={14} />
                  </i>
                  <div>
                    <b>Compte créé</b>
                    <small>Vous pouvez déjà donner et participer.</small>
                  </div>
                </li>
                <li className="st2 ok">
                  <i aria-hidden="true">
                    <Check size={14} />
                  </i>
                  <div>
                    <b>Demande organisateur envoyée</b>
                    <small>
                      {f.org.trim() || 'Votre association'} · {f.ville}
                    </small>
                  </div>
                </li>
                <li className="st2 cur">
                  <i aria-hidden="true">
                    <span className="spin3" />
                  </i>
                  <div>
                    <b>Vérification par l’équipe moubedra</b>
                    <small>Sous 48 h · vous recevrez un e-mail</small>
                  </div>
                </li>
                <li className="st2">
                  <i aria-hidden="true">4</i>
                  <div>
                    <b>Publier votre première campagne</b>
                    <small>Préparez-la dès maintenant en brouillon</small>
                  </div>
                </li>
              </ol>
              <Button size="wide" icon={Megaphone} style={{ marginTop: 14 }} to="/espace/devenir-organisateur">
                Préparer ma première campagne ? </Button>
            </div>
          ) : (
            <nav className="next3" aria-label="Premiers pas">
              <Link to="/campagnes">
                <span className="ni" style={{ background: '#ffede7', color: 'var(--orange)' }} aria-hidden="true">
                  <Heart size={20} />
                </span>
                <div>
                  <b>Soutenir une campagne</b>
                  <small>{getPresDeChezVous(f.ville) || `Les campagnes près de ${f.ville}`}</small>
                </div>
                <ChevronRight size={18} aria-hidden="true" />
              </Link>
              <Link to="/evenements">
                <span className="ni" style={{ background: '#e6edf8', color: 'var(--navy)' }} aria-hidden="true">
                  <CalendarDays size={20} />
                </span>
                <div>
                  <b>Rejoindre un événement</b>
                  <small>Samedi : plage de Mahdia, 19 places</small>
                </div>
                <ChevronRight size={18} aria-hidden="true" />
              </Link>
              <Link to="/espace/devenir-organisateur">
                <span className="ni" style={{ background: '#e5f1e1', color: 'var(--green)' }} aria-hidden="true">
                  <Megaphone size={20} />
                </span>
                <div>
                  <b>Devenir organisateur</b>
                  <small>Demande examinée sous 48 h</small>
                </div>
                <ChevronRight size={18} aria-hidden="true" />
              </Link>
            </nav>
          )}
        </section>
      )}

      {step < 3 && (
        <p className="switch">
          Déjà inscrit·e ?{' '}
          <Link className="lnk" to="/connexion">
            Se connecter ? </Link>
        </p>
      )}
    </div>
  );
}
