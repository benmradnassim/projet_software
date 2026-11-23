import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Home, Languages, LayoutDashboard } from 'lucide-react';
import { CountUp, useToast } from '../design/components';
import { POULS_DU_JOUR } from '../features/accueil';
import { useAuth } from './AuthContext';

const SPARK = Array.from({ length: 14 }, (_, i) => 25 + Math.abs(Math.sin(i * 1.3)) * 55 + i * 2.5);

/**
 * « Le pouls solidaire du jour » : popover ouvert par un clic sur le logo depuis l'accueil.
 * TODO(API): données du jour — voir features/accueil/api.js (getPouls)
 */
export default function PulsePopover({ open, id }) {
  const { isAuthenticated, homePath } = useAuth();
  const toast = useToast();
  const [run, setRun] = useState(0);
  const [bars, setBars] = useState(false);
  const [msg, setMsg] = useState(0);

  useEffect(() => {
    if (!open) {
      setBars(false);
      return undefined;
    }
    setRun((r) => r + 1);
    setMsg(0);
    const t = setTimeout(() => setBars(true), 60);
    const iv = setInterval(() => setMsg((m) => m + 1), 2600);
    return () => {
      clearTimeout(t);
      clearInterval(iv);
    };
  }, [open]);

  const { dons, montant, benevoles, fil } = POULS_DU_JOUR;

  return (
    <div className={`pulse${open ? ' open' : ''}`} id={id} role="dialog" aria-label="Le pouls solidaire du jour" aria-hidden={!open}>
      <div className="hd">
        <span className="live" aria-hidden="true" />
        <b>Aujourd’hui sur moubedra</b>
        <span>en direct</span>
      </div>
      <div className="st" key={run}>
        <div>
          <b>{open ? <CountUp value={dons} duration={1000} /> : 0}</b>
          <small>dons</small>
        </div>
        <div>
          <b>{open ? <CountUp value={montant} duration={1000} /> : 0}</b>
          <small>TND collectés</small>
        </div>
        <div>
          <b>{open ? <CountUp value={benevoles} duration={1000} /> : 0}</b>
          <small>bénévoles</small>
        </div>
      </div>
      <div className="spark" aria-hidden="true">
        {SPARK.map((h, i) => (
          <i key={i} style={{ height: bars ? `${h}%` : 0, transitionDelay: `${0.06 + i * 0.045}s` }} />
        ))}
      </div>
      <div className="ql">
        <Link to="/" tabIndex={open ? 0 : -1}>
          <Home size={18} aria-hidden="true" />
          Accueil
        </Link>
        <Link to="/campagnes" tabIndex={open ? 0 : -1}>
          <Heart size={18} aria-hidden="true" />
          Donner
        </Link>
        <Link to={isAuthenticated ? homePath : '/connexion'} tabIndex={open ? 0 : -1}>
          <LayoutDashboard size={18} aria-hidden="true" />
          Mon espace
        </Link>
        <button type="button" tabIndex={open ? 0 : -1} onClick={() => toast('La version arabe arrive bientôt')}>
          <Languages size={18} aria-hidden="true" />
          FR · عربي
        </button>
      </div>
      <div className="feed" aria-live="off">
        <p key={msg}>{fil[msg % fil.length]}</p>
      </div>
    </div>
  );
}
