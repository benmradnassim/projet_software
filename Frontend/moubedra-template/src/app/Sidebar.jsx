import { NavLink } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { getNavigation } from './navigation';

/** Barre latérale — version provisoire (étape 2). Remplacée par la version 2 de la maquette à l'étape 3. */
export default function Sidebar() {
  const { role } = useAuth();
  return (
    <aside className="side2" aria-label="Espace personnel">
      {getNavigation(role).map((g) => (
        <div key={g.label}>
          <div className="cap">{g.label}</div>
          {g.items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end} className="sl2">
              {it.label}
              {it.badge ? <span className="n">{it.badge}</span> : null}
            </NavLink>
          ))}
        </div>
      ))}
    </aside>
  );
}
