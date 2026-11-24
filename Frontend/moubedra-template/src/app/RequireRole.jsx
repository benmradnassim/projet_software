import { Navigate, useLocation } from 'react-router-dom';
import { homePath, useAuth } from './AuthContext';

/**
 * Protège une route.
 *  - <RequireRole>…</RequireRole>                       : il faut être connecté (tous rôles)
 *  - <RequireRole roles={['organisateur']}>…</RequireRole> : il faut avoir l'un de ces rôles
 *
 * Non connecté   -> /connexion (puis retour à la page demandée après connexion)
 * Mauvais rôle   -> tableau de bord de son propre rôle
 *
 * Dans les features, on ne l'utilise pas directement : on renseigne `access` dans routes.jsx.
 */
export default function RequireRole({ roles, children }) {
  const { ready, user, role } = useAuth();
  const location = useLocation();

  if (!ready) return null;
  if (!user) {
    return (
      <Navigate
        to="/connexion"
        replace
        state={{ from: location.pathname + location.search, message: 'Connectez-vous pour accéder à cet espace' }}
      />
    );
  }
  if (roles && !roles.includes(role)) return <Navigate to={homePath(role)} replace />;
  return children;
}
