import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useToast } from '../../../design/components';
import AuthAside from '../components/AuthAside';
import LoginForm from '../components/LoginForm';
import SignupForm from '../components/SignupForm';
import '../auth.css';

/**
 * Connexion (/connexion) et inscription (/inscription), sans en-tête, comme dans la maquette.
 * Un message transmis par RequireRole (« Connectez-vous pour accéder à cet espace ») s'affiche en toast.
 */
export default function AuthPage({ mode }) {
  const toast = useToast();
  const { state } = useLocation();
  const [acct, setAcct] = useState('cit');

  useEffect(() => {
    if (state?.message) toast(state.message);
  }, [state, toast]);

  useEffect(() => {
    document.title = mode === 'login' ? 'Connexion — moubedra' : 'Créer un compte — moubedra';
    return () => {
      document.title = 'moubedra — La solidarité fait grandir nos horizons';
    };
  }, [mode]);

  return (
    <div className="auth">
      <AuthAside variant={mode === 'login' ? 'login' : acct === 'asso' ? 'asso' : 'signup'} />
      <div className="aright">
        <div className="aform">
          <nav className={`seg2${mode === 'signup' ? ' right' : ''}`} aria-label="Connexion ou inscription">
            <span className="ind2" aria-hidden="true" />
            <Link to="/connexion" state={state} aria-current={mode === 'login' ? 'page' : undefined}>
              Connexion
            </Link>
            <Link to="/inscription" state={state} aria-current={mode === 'signup' ? 'page' : undefined}>
              Créer un compte
            </Link>
          </nav>
          {mode === 'login' ? <LoginForm /> : <SignupForm acct={acct} setAcct={setAcct} />}
        </div>
      </div>
    </div>
  );
}
