import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, HandHeart, Heart, MapPin, Search } from 'lucide-react';
import { AvatarStack, Button } from '../../../design/components';
import { useCountUp, useReducedMotion } from '../../../design/hooks';
import { formatNumber, percent } from '../../../lib/format';

const WORDS = ['La', 'solidarité', 'fait', 'grandir', 'nos', 'horizons.'];

/** Placeholder « tapé » lettre par lettre (s'arrête quand le champ a le focus). */
function useTypedPlaceholder(phrases, active) {
  const [text, setText] = useState(phrases[0]);
  useEffect(() => {
    if (!active) return undefined;
    let w = 0;
    let i = 0;
    let del = false;
    const iv = setInterval(() => {
      const s = phrases[w % phrases.length];
      i += del ? -1 : 1;
      setText(s.slice(0, Math.max(0, i)));
      if (i === s.length + 12) del = true;
      if (del && i === 0) {
        del = false;
        w += 1;
      }
    }, 70);
    return () => clearInterval(iv);
  }, [phrases, active]);
  return text;
}

function Count({ value, start }) {
  const n = useCountUp(value, { start, duration: 1600 });
  return formatNumber(n);
}

export default function Hero({ contenus }) {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const [started, setStarted] = useState(false);
  const [donor, setDonor] = useState(0);
  const [out, setOut] = useState(false);
  const inputRef = useRef(null);
  const placeholder = useTypedPlaceholder(contenus.recherches, !reduced && !focused);
  const une = contenus.a_la_une;
  const p = percent(une.collecte, une.objectif);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 1100);
    return () => clearTimeout(t);
  }, []);

  // pastille « X a donné … à l'instant » qui tourne toutes les 3,2 s
  useEffect(() => {
    if (reduced) return undefined;
    let t2;
    const iv = setInterval(() => {
      setOut(true);
      t2 = setTimeout(() => {
        setDonor((d) => d + 1);
        setOut(false);
      }, 450);
    }, 3200);
    return () => {
      clearInterval(iv);
      clearTimeout(t2);
    };
  }, [reduced]);

  const [nom, montant] = contenus.donateurs[donor % contenus.donateurs.length];

  const onSearch = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/campagnes?q=${encodeURIComponent(q.trim())}` : '/campagnes');
  };

  return (
    <div className="hero">
      <div className="hero-bg" aria-hidden="true" />
      <div>
        <span className="eyebrow fade" style={{ animationDelay: '.05s' }}>
          ● La plateforme solidaire tunisienne ? </span>
        <h1 aria-label="La solidarité fait grandir nos horizons.">
          {WORDS.map((w, i) => (
            <span key={w} aria-hidden="true">
              <span className={`w${w === 'grandir' ? ' grow' : ''}`} style={{ animationDelay: `${0.15 + i * 0.1}s` }}>
                {w === 'grandir' ? (
                  <>
                    <em>grandir</em>
                    <svg viewBox="0 0 200 20" preserveAspectRatio="none">
                      <path d="M3 14 C 50 4, 120 2, 197 9" />
                    </svg>
                  </>
                ) : (
                  w
                )}
              </span>{' '}
            </span>
          ))}
        </h1>
        <p className="lead fade" style={{ animationDelay: '.8s' }}>
          Soutenez une cause, rejoignez une action bénévole ou lancez votre propre campagne — partout en Tunisie. ? </p>
        <div className="ctas fade" style={{ animationDelay: '.95s' }}>
          <Button size="lg" to="/campagnes" iconRight={ArrowRight} arrow>
            Soutenir une campagne ? </Button>
          <Button size="lg" variant="ghost" icon={HandHeart} to="/evenements">
            Devenir bénévole ? </Button>
        </div>
        <form className="search fade" style={{ animationDelay: '1.1s' }} role="search" onSubmit={onSearch}>
          <Search size={18} aria-hidden="true" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={focused ? '' : `${placeholder}${reduced ? '' : '|'}`}
            aria-label="Rechercher une cause, une ville ou une association"
          />
          <div className="r">
            <MapPin size={16} color="var(--orange)" aria-hidden="true" /> Toute la Tunisie ? </div>
          <Button type="submit" variant="navy">
            Rechercher ? </Button>
        </form>
        <div className="trust fade" style={{ animationDelay: '1.25s' }}>
          <AvatarStack people={contenus.engages.avatars} />
          <span>
            <b style={{ color: 'var(--navy)' }}>
              <Count value={contenus.engages.nombre} start={started} />
            </b>{' '}
            citoyens déjà engagés
          </span>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <BadgeCheck size={16} color="var(--green)" aria-hidden="true" /> Associations vérifiées ? </span>
        </div>
      </div>

      <div className="collage" aria-hidden="true">
        <div className="p1">
          {reduced ? (
            <img src="/media/hero/hero-poster.webp" alt="" />
          ) : (
            <video autoPlay muted loop playsInline preload="metadata" poster="/media/hero/hero-poster.webp">
              <source src="/media/hero/hero-loop.webm" type="video/webm" />
              <source src="/media/hero/hero-loop.mp4" type="video/mp4" />
            </video>
          )}
        </div>
        <div className="p2">
          <img src="/media/covers/education.webp" alt="" loading="lazy" />
        </div>
        <div className="livecard">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="pill urg">
              <i />
              Urgence ? </span>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{une.ville}</span>
          </div>
          <h4>{une.titre}</h4>
          <div className="bar">
            <span style={{ width: started ? `${p}%` : 0 }} />
          </div>
          <div className="n">
            <span>
              <b>
                <Count value={une.collecte} start={started} />
              </b>{' '}
              / {formatNumber(une.objectif)} TND ? </span>
            <span>{p} %</span>
          </div>
          <div className="n" style={{ marginTop: 4 }}>
            <span>{une.donateurs} donateurs</span>
            <span style={{ color: 'var(--orange)', fontWeight: 700 }}>{une.jours} jours restants</span>
          </div>
          <Button icon={Heart} to={`/campagnes/${une.id}/don`} tabIndex={-1}>
            Je donne ? </Button>
        </div>
        <div className={`dtoast${out ? ' out' : ''}`}>
          <i>
            <Heart size={16} />
          </i>
          <span>
            <b>{nom}</b> a donné {montant} · à l’instant ? </span>
        </div>
      </div>
    </div>
  );
}
