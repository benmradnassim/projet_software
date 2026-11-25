import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Heart, LayoutDashboard, LogOut, User, Wallet } from 'lucide-react';
import { Avatar, Button, Menu, useToast } from '../design/components';
import { useDismiss, useHideOnScroll } from '../design/hooks';
import { nonLues } from '../features/notifications';
import { useAuth } from './AuthContext';
import { LogoMark, LogoWord } from './Logo';
import PulsePopover from './PulsePopover';

const NAV = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/campagnes', label: 'Campagnes' },
  { to: '/evenements', label: 'Événements' },
  { to: '/communaute', label: 'Communauté' },
];

/**
 * En-tête de la maquette : logo animé (+ popover « pouls » sur l'accueil), navigation,
 * Connexion ou cloche + menu de l'avatar, bouton « Faire un don ».
 * Se cache au défilement vers le bas, réapparaît vers le haut (useHideOnScroll).
 */
export default function Header() {
  const { user, role, isAuthenticated, homePath, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();
  const [ready, setReady] = useState(false);
  const [pulseOpen, setPulseOpen] = useState(false);
  const logoRef = useRef(null);
  const { hidden, shadow, show } = useHideOnScroll({ locked: pulseOpen });

  useDismiss(pulseOpen, () => setPulseOpen(false), [logoRef]);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => setPulseOpen(false), [pathname]);

  const onLogo = () => {
    if (pathname !== '/') navigate('/');
    else setPulseOpen((o) => !o);
  };

  const onLogout = () => {
    logout();
    toast('Vous êtes déconnecté·e');
    navigate('/');
  };

  const unread = isAuthenticated ? nonLues(role) : 0;
  const prenom = user?.prenom || user?.first_name;

  return (
    <>
      <a className="skip" href="#contenu">
        Aller au contenu ? </a>
      <header className={`site-header${hidden ? ' hide' : ''}${shadow ? ' shadow' : ''}`} onFocus={show}>
        <div className="logo-wrap" ref={logoRef}>
          <button
            type="button"
            className={`logo${ready ? ' ready' : ''}${pulseOpen ? ' beating' : ''}`}
            onClick={onLogo}
            aria-label={pathname === '/' ? 'moubedra — le pouls solidaire du jour' : 'moubedra — retour à l’accueil'}
            aria-haspopup={pathname === '/' ? 'dialog' : undefined}
            aria-expanded={pathname === '/' ? pulseOpen : undefined}
            aria-controls="pouls"
          >
            <LogoMark />
            <LogoWord />
          </button>
          <PulsePopover open={pulseOpen} id="pouls" />
        </div>

        <nav className="main-nav" aria-label="Navigation principale">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive && !(n.to === '/' && hash) ? 'active' : '')}>
              {n.label}
            </NavLink>
          ))}
          <Link to="/#comment-ca-marche" className={pathname === '/' && hash === '#comment-ca-marche' ? 'active' : ''}>
            Comment ça marche ? </Link>
        </nav>

        <div className="hr">
          {!isAuthenticated ? (
            <Button to="/connexion" variant="ghost">
              Connexion ? </Button>
          ) : (
            <>
              <Link to="/espace/notifications" className="bellb notif" aria-label={unread ? `Notifications, ${unread} non lues` : 'Notifications'}>
                <Bell size={20} aria-hidden="true" />
                {unread > 0 && (
                  <span className="dot3" aria-hidden="true">
                    {unread}
                  </span>
                )}
              </Link>
              <Menu
                label="Menu du compte"
                menuClassName="um"
                header={
                  <div className="hd2">
                    <b>{user.nom_complet}</b>
                    <small>{user.sous_titre || user.ville}</small>
                  </div>
                }
                renderTrigger={(props) => (
                  <button {...props} className="me2">
                    <Avatar name={user.nom_complet} color={user.couleur} size={38} />
                    <span className="name">{prenom}</span>
                    <ChevronDown size={16} aria-hidden="true" />
                  </button>
                )}
                items={[
                  { icon: LayoutDashboard, label: 'Tableau de bord', onSelect: () => navigate(homePath) },
                  { icon: Wallet, label: 'Mes dons', onSelect: () => navigate('/espace/dons') },
                  { icon: User, label: 'Mon compte', onSelect: () => navigate('/espace/compte') },
                  { icon: LogOut, label: 'Déconnexion', danger: true, onSelect: onLogout },
                ]}
              />
            </>
          )}
          <Button to="/campagnes" icon={Heart}>
            Faire un don ? </Button>
        </div>
      </header>
    </>
  );
}
