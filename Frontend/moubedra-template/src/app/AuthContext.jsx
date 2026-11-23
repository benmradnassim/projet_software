import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError, IS_DEMO, clearTokens, getTokens, setTokens } from '../lib/api';
import { DEMO_USERS, connexion, getProfil } from '../features/auth';

/**
 * Session de l'utilisateur.
 *
 * Rôles (valeurs du backend, Utilisateur.Role) : 'citoyen' | 'organisateur' | 'admin'.
 * Le rôle 'utilisateur' du backend est traité comme 'citoyen'.
 *
 * - VITE_DEMO=true  : aucune requête ; connexion démo par rôle (loginDemo / switchRole).
 * - VITE_DEMO=false : POST /api/auth/connexion/ (JWT) puis GET /api/utilisateurs/<id>/.
 */

export const ROLES = ['citoyen', 'organisateur', 'admin'];
export const ROLE_LABELS = { citoyen: 'Citoyen', organisateur: 'Organisateur', admin: 'Admin' };

/** Page d'accueil de l'espace connecté pour chaque rôle. */
export const HOME_BY_ROLE = { citoyen: '/espace', organisateur: '/organisateur', admin: '/admin' };
export const homePath = (role) => HOME_BY_ROLE[role] || '/espace';

const normalizeRole = (role) => (ROLES.includes(role) ? role : 'citoyen');
const DEMO_KEY = 'moubedra.demoRole';

const store = {
  get: () => {
    try {
      return localStorage.getItem(DEMO_KEY);
    } catch {
      return null;
    }
  },
  set: (v) => {
    try {
      v ? localStorage.setItem(DEMO_KEY, v) : localStorage.removeItem(DEMO_KEY);
    } catch {
      /* stockage indisponible */
    }
  },
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Restauration de la session au chargement
  useEffect(() => {
    let alive = true;
    (async () => {
      if (IS_DEMO) {
        const role = store.get();
        if (role && DEMO_USERS[role]) setUser(structuredClone(DEMO_USERS[role]));
      } else if (getTokens()?.access) {
        try {
          const profil = await getProfil();
          if (alive) setUser(profil);
        } catch {
          clearTokens();
        }
      }
      if (alive) setReady(true);
    })();
    const onExpired = () => setUser(null);
    window.addEventListener('moubedra:session-expiree', onExpired);
    return () => {
      alive = false;
      window.removeEventListener('moubedra:session-expiree', onExpired);
    };
  }, []);

  /** Connexion démo : `overrides` permet par ex. de garder le prénom saisi à l'inscription. */
  const loginDemo = useCallback((role, overrides = {}) => {
    const next = { ...structuredClone(DEMO_USERS[normalizeRole(role)]), ...overrides };
    store.set(next.role);
    setUser(next);
    return next;
  }, []);

  const login = useCallback(
    async ({ email, password }) => {
      if (IS_DEMO) {
        await new Promise((r) => setTimeout(r, 900));
        // Même règle que la maquette : un mot de passe trop court simule des identifiants incorrects.
        if (!password || password.length < 8) throw new ApiError('E-mail ou mot de passe incorrect.', 401);
        const role = ROLES.find((r) => email.toLowerCase().startsWith(r)) || 'citoyen';
        return loginDemo(role);
      }
      const jetons = await connexion({ email, password });
      setTokens(jetons);
      const profil = await getProfil();
      setUser(profil);
      return profil;
    },
    [loginDemo],
  );

  const logout = useCallback(() => {
    clearTokens();
    store.set(null);
    setUser(null);
  }, []);

  /** Mode démo uniquement : change de rôle sans se déconnecter. */
  const switchRole = useCallback((role) => (IS_DEMO ? loginDemo(role) : null), [loginDemo]);

  /** Met à jour le profil en mémoire (après un PATCH réussi par exemple). */
  const updateUser = useCallback((patch) => setUser((u) => (u ? { ...u, ...patch } : u)), []);

  const value = useMemo(() => {
    const role = user ? normalizeRole(user.role) : null;
    return {
      user,
      role,
      ready,
      isAuthenticated: !!user,
      isDemo: IS_DEMO,
      homePath: homePath(role),
      login,
      loginDemo,
      logout,
      switchRole,
      updateUser,
    };
  }, [user, ready, login, loginDemo, logout, switchRole, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>.');
  return ctx;
}
