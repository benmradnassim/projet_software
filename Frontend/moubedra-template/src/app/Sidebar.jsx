import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, FlaskConical, LogOut, ShieldCheck } from 'lucide-react';
import { Avatar, useToast } from '../design/components';
import { ROLES, ROLE_LABELS, homePath, useAuth } from './AuthContext';
import { HELP, getNavigation } from './navigation';

const ROLE_PILL = {
  citoyen: { bg: '#ffede7', fg: '#d9472b', label: 'Citoyen·ne' },
  organisateur: { bg: '#e5f1e1', fg: '#3d6d31', label: 'Organisateur vérifié', icon: BadgeCheck },
  admin: { bg: '#e6edf8', fg: '#1f3a6b', label: 'Administrateur', icon: ShieldCheck },
};

/**
 * Barre latérale v2 de la maquette : carte profil, groupes, icône dans une case,
 * élément actif bleu marine + trait orange, compteurs, carte d'aide, sélecteur de rôle (démo), déconnexion.
 * Les entrées viennent des `features/<module>/nav.js` (voir app/navigation.js).
 */
export default function Sidebar() {
  const { user, role, isDemo, switchRole, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const pill = ROLE_PILL[role];
  const help = HELP[role];
  const PillIcon = pill?.icon;

  const changeRole = (r) => {
    if (r === role) return;
    switchRole(r);
    navigate(homePath(r));
    toast(`Vous êtes maintenant en mode ${ROLE_LABELS[r]}`);
  };

  const onLogout = () => {
    logout();
    toast('Vous êtes déconnecté·e');
    navigate('/');
  };

  return (
    <aside className="side2" aria-label="Mon espace">
      <div className="sprof">
        <Avatar name={user.nom_complet} color={user.couleur} size={42} />
        <div>
          <b>{user.nom_complet}</b>
          <small>{user.sous_titre}</small>
          {pill && (
            <span className="rolepill" style={{ background: pill.bg, color: pill.fg }}>
              {PillIcon && <PillIcon size={13} aria-hidden="true" />}
              {pill.label}
            </span>
          )}
        </div>
      </div>

      <nav aria-label="Menu de l’espace">
        {getNavigation(role).map((g) => (
          <div key={g.label}>
            <div className="cap" id={`cap-${g.label}`}>
              {g.label}
            </div>
            <ul aria-labelledby={`cap-${g.label}`}>
              {g.items.map((it) => {
                const ItemIcon = it.icon;
                return (
                  <li key={`${it.to}-${it.label}`}>
                    <NavLink to={it.to} end={it.end} className="sl2">
                      <span className="si" aria-hidden="true">
                        {ItemIcon && <ItemIcon size={18} />}
                      </span>
                      <span>{it.label}</span>
                      {it.badge ? (
                        <span className={`n${it.pulse ? ' npul' : ''}`} aria-label={`${it.badge} en attente`}>
                          {it.badge}
                        </span>
                      ) : null}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {help && (
        <div className="sidehelp">
          <img src="/media/empty/campagnes.webp" alt="" width="54" height="54" />
          <div>
            <b>{help.title}</b>
            <small>{help.text}</small>
            <Link to={help.to}>
              {help.cta} <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}

      <div className="sidebot">
        {isDemo && (
          <div className="rolebox2">
            <span id="role-demo">
              <FlaskConical size={13} aria-hidden="true" /> Mode démo, changer de rôle ? </span>
            <div className="seg3" role="group" aria-labelledby="role-demo">
              {ROLES.map((r) => (
                <button key={r} type="button" aria-pressed={r === role} onClick={() => changeRole(r)}>
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
        )}
        <button type="button" className="sl2 logout" onClick={onLogout}>
          <span className="si" aria-hidden="true">
            <LogOut size={18} />
          </span>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
