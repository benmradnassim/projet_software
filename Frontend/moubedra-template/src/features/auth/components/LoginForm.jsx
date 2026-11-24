import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, CircleAlert, Eye, EyeOff, FlaskConical, Lock, Mail } from 'lucide-react';
import { ROLES, ROLE_LABELS, homePath, useAuth } from '../../../app/AuthContext';
import { Button, FloatingField, useToast } from '../../../design/components';

export const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/** Bouton œil pour afficher / masquer un mot de passe. */
export function EyeToggle({ shown, onToggle }) {
  return (
    <button type="button" className="eye" onClick={onToggle} aria-label={shown ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={shown}>
      {shown ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
    </button>
  );
}

export default function LoginForm() {
  const { login, isDemo } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [errs, setErrs] = useState({});
  const [formErr, setFormErr] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | ok
  const [shake, setShake] = useState(0);
  const emailRef = useRef(null);
  const passRef = useRef(null);

  const submit = async (e, creds) => {
    e?.preventDefault();
    const em = creds?.email ?? email;
    const pw = creds?.password ?? pass;
    const next = {};
    if (!emailOk(em)) next.email = em ? 'Cette adresse e-mail ne semble pas valide.' : 'Entrez votre adresse e-mail.';
    if (!pw) next.password = 'Entrez votre mot de passe.';
    setErrs(next);
    setFormErr('');
    if (next.email) return emailRef.current?.focus();
    if (next.password) return passRef.current?.focus();
    setStatus('loading');
    try {
      // TODO(API): POST /api/auth/connexion/ — voir app/AuthContext.jsx et features/auth/api.js
      const user = await login({ email: em, password: pw });
      setStatus('ok');
      setTimeout(() => navigate(state?.from || homePath(user.role), { replace: true }), 800);
    } catch (err) {
      setStatus('idle');
      setFormErr(err.message || 'E-mail ou mot de passe incorrect.');
      setShake((s) => s + 1);
    }
  };

  const demo = (role) => {
    const creds = { email: `${role}@demo.tn`, password: 'demo-moubedra' };
    setEmail(creds.email);
    setPass(creds.password);
    submit(null, creds);
  };

  return (
    <form className={`pane${shake ? ' shake' : ''}`} key={shake} onSubmit={submit} noValidate aria-labelledby="login-title">
      <h1 id="login-title">Ravie de vous revoir !</h1>
      <p className="sub2">Connectez-vous pour continuer votre aventure solidaire.</p>
      <FloatingField
        ref={emailRef}
        label="Adresse e-mail"
        icon={Mail}
        type="email"
        autoComplete="email"
        value={email}
        valid={emailOk(email)}
        error={errs.email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (emailOk(e.target.value)) setErrs((x) => ({ ...x, email: '' }));
        }}
        onBlur={() => email && !emailOk(email) && setErrs((x) => ({ ...x, email: 'Cette adresse e-mail ne semble pas valide.' }))}
        right={
          <span className="ok" aria-hidden="true">
            <Check size={18} />
          </span>
        }
      />
      <FloatingField
        label="Mot de passe"
        icon={Lock}
        type={show ? 'text' : 'password'}
        autoComplete="current-password"
        value={pass}
        error={errs.password}
        onChange={(e) => setPass(e.target.value)}
        right={<EyeToggle shown={show} onToggle={() => setShow((s) => !s)} />}
      />
      <div className="row2">
        <label className="ck2">
          <input type="checkbox" defaultChecked />
          <i aria-hidden="true">
            <Check size={13} />
          </i>
          Rester connecté·e
        </label>
        <button type="button" className="lnk" onClick={() => toast('Un lien de réinitialisation vous sera envoyé par e-mail')}>
          Mot de passe oublié ?
        </button>
      </div>
      <div className={`formerr${formErr ? ' on' : ''}`} role="alert">
        <CircleAlert size={18} aria-hidden="true" /> {formErr}
      </div>
      <Button
        type="submit"
        variant="navy"
        size="wide"
        loading={status === 'loading'}
        loadingText="Connexion…"
        iconRight={status === 'ok' ? undefined : ArrowRight}
        icon={status === 'ok' ? Check : undefined}
        style={status === 'ok' ? { background: 'var(--green)' } : undefined}
        disabled={status === 'loading'}
      >
        {status === 'ok' ? 'Connecté·e' : 'Se connecter'}
      </Button>
      <p className="switch">
        Pas encore de compte ?{' '}
        <Link className="lnk" to="/inscription">
          Créer un compte
        </Link>
      </p>
      {isDemo && (
        <div className="demo2">
          <b>
            <FlaskConical size={16} aria-hidden="true" /> Tester sans compte (démo)
          </b>
          <div>
            {ROLES.map((r) => (
              <button key={r} type="button" onClick={() => demo(r)}>
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
