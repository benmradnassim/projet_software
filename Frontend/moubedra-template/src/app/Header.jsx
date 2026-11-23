import { Link, NavLink } from 'react-router-dom';
import { useAuth } from './AuthContext';

/** En-tête — version provisoire (étape 2). Remplacée par la version de la maquette à l'étape 3. */
export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  return (
    <header>
      <Link to="/">moubedra.</Link>
      <nav aria-label="Navigation principale">
        <NavLink to="/" end>Accueil</NavLink>
        <NavLink to="/campagnes">Campagnes</NavLink>
        <NavLink to="/evenements">Événements</NavLink>
        <NavLink to="/communaute">Communauté</NavLink>
      </nav>
      <div className="hr">
        {isAuthenticated ? (
          <button type="button" onClick={logout}>{user.first_name} · Déconnexion</button>
        ) : (
          <Link to="/connexion">Connexion</Link>
        )}
      </div>
    </header>
  );
}
