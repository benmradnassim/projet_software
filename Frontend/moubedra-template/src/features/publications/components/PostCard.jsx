import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, Bell, Bookmark, CalendarPlus, Check, ChevronsLeftRight, Clock, EyeOff, FileText, Flag, HandHeart,
  Heart, Link as LinkIcon, MapPin, Megaphone, MessageCircle, Pencil, Pin, Quote, Share2, Sparkles, Trash2, TrendingUp, Trophy,
} from 'lucide-react';
import { useAuth } from '../../../app/AuthContext';
import { Avatar, AvatarStack, Button, DateBadge, Icon, Menu, ProgressBar, confetti, miniBurst, useToast } from '../../../design/components';
import { useInView } from '../../../design/hooks';
import { formatRelative, percent, tnd } from '../../../lib/format';
import { basculerMerci, getTypes, modifierPublication, voter } from '../api';
import Comments from './Comments';
import { creerSignalement } from '../../signalements';
import '../publications.css';

const TYPES = getTypes();

/* ---------- en-tête de carte ---------- */
function Head({ post, mine, onDelete, onEdit }) {
  const toast = useToast();
  const { role } = useAuth();
  const ty = TYPES[post.type] || TYPES.story;
  const goal = post.type === 'goal';
  const copy = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/communaute#publication-${post.id}`).catch(() => {});
    toast('Lien copié');
  };
  const items = mine
    ? [
        ...(onEdit ? [{ icon: Pencil, label: 'Modifier', onSelect: onEdit }] : []),
        { icon: Pin, label: 'Épingler sur mon profil', onSelect: () => toast('Épinglé sur votre profil ✓') },
        { icon: LinkIcon, label: 'Copier le lien', onSelect: copy },
        null,
        { icon: Trash2, label: 'Supprimer…', danger: true, onSelect: onDelete },
      ]
    : [
        { icon: LinkIcon, label: 'Copier le lien', onSelect: copy },
        { icon: Bookmark, label: 'Enregistrer', onSelect: () => toast('Enregistrer ✓') },
        { icon: Share2, label: 'Partager sur WhatsApp', onSelect: () => toast('Partager sur WhatsApp ✓') },
        { icon: EyeOff, label: 'Masquer', onSelect: () => toast('Masquer ✓') },
        { icon: Bell, label: 'Suivre', onSelect: () => toast('Suivre ✓') },
        null,
        {
          icon: Flag,
          label: 'Signaler…',
          danger: true,
          onSelect: () => {
            // TODO(API): POST /api/signalements/ — voir features/signalements/api.js
            creerSignalement({ type: 'publication', publication: post.id, description: '' });
            toast('Signalement envoyé à la modération');
          },
        },
        // US 7.10 : un admin peut supprimer une publication inappropriée
        ...(role === 'admin' && onDelete ? [{ icon: Trash2, label: 'Supprimer (modération)…', danger: true, onSelect: onDelete }] : []),
      ];
  return (
    <div className="top">
      <div className="who">
        <Avatar name={post.auteur_nom} initials={post.auteur_initiales} color={post.auteur_couleur} size={40} style={{ fontSize: 13 }} />
        <div>
          <b>
            {post.auteur_nom}
            {post.auteur_verifie && <BadgeCheck size={16} color={goal ? '#9fd08f' : '#4f7f42'} aria-label="vérifié" />}
            {mine && <span className="pill vous">Vous</span>}
          </b>
          <small>
            {post.auteur_sous_titre} · {formatRelative(post.date_creation)}
          </small>
        </div>
      </div>
      <span className="ttag" style={{ background: ty.bg, color: ty.color }}>
        <Icon name={ty.icon} size={14} /> {ty.label}
      </span>
      <Menu items={items} onDark={goal} label={`Options de la publication de ${post.auteur_nom}`} />
    </div>
  );
}

/* ---------- pied : Merci / commentaires / partager ---------- */
function Foot({ post, nbCommentaires, commentsOpen, onToggleComments }) {
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [on, setOn] = useState(!!post.a_like);
  const [n, setN] = useState(post.nb_like || 0);
  const [dir, setDir] = useState('');
  const [plus, setPlus] = useState(0);
  const ref = useRef(null);
  const toggle = () => {
    if (!isAuthenticated) {
      navigate('/connexion', { state: { from: '/communaute', message: 'Connectez-vous pour participer' } });
      return;
    }
    const next = !on;
    setOn(next);
    setN((x) => x + (next ? 1 : -1));
    setDir(next ? 'up' : 'down');
    if (next) {
      miniBurst(ref.current);
      setPlus((p) => p + 1);
    }
    // Mise à jour optimiste : on aligne sur la réponse du serveur, ou on annule en cas d'erreur.
    basculerMerci(post.id, next)
      .then((r) => {
        if (typeof r?.nb_like === 'number') setN(r.nb_like);
      })
      .catch((err) => {
        setOn(!next);
        setN((x) => x + (next ? -1 : 1));
        toast(err?.message || 'Action impossible pour le moment');
      });
  };
  return (
    <div className="foot2">
      <button ref={ref} type="button" className="thanks" aria-pressed={on} onClick={toggle} aria-label={`Merci, ${n}`}>
        <span className="h">
          <Heart size={16} aria-hidden="true" />
        </span>
        <span aria-hidden="true">
          Merci ·{' '}
          <span className="cnt">
            <span key={n} className={dir}>
              {n}
            </span>
          </span>
        </span>
        {plus > 0 && on && (
          <span className="plus1" key={plus} aria-hidden="true">
            +1
          </span>
        )}
      </button>
      <button type="button" onClick={onToggleComments} aria-expanded={commentsOpen} aria-label={`${nbCommentaires} commentaires`}>
        <MessageCircle size={16} aria-hidden="true" /> {nbCommentaires}
      </button>
      <button type="button" onClick={() => toast('Lien copié, prêt à partager')}>
        <Share2 size={16} aria-hidden="true" /> Partager
      </button>
    </div>
  );
}

/* ---------- corps par type ---------- */
function useRequireAuth() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  return (fn) => (e) => {
    if (!isAuthenticated) {
      navigate('/connexion', { state: { from: '/communaute', message: 'Connectez-vous pour participer' } });
      return;
    }
    fn(e);
  };
}

function Countdown({ seconds }) {
  const [s, setS] = useState(seconds);
  useEffect(() => {
    const iv = setInterval(() => setS((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(iv);
  }, []);
  const d = Math.floor(s / 86400);
  const h = String(Math.floor((s % 86400) / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const x = String(s % 60).padStart(2, '0');
  return (
    <span className="cd" role="timer" aria-label={`Plus que ${d} jours et ${Number(h)} heures`}>
      <span aria-hidden="true">
        Plus que {d} j {h} h {m} min {x} s
      </span>
    </span>
  );
}

function UrgentBody({ post, head }) {
  const toast = useToast();
  const navigate = useNavigate();
  const guard = useRequireAuth();
  const [helped, setHelped] = useState(false);
  const besoins = post.details.besoins.map((b, i) => (i === 1 && helped ? { ...b, recu: b.recu + 1 } : b));
  return (
    <>
      <div className="band">
        <span className="pd" aria-hidden="true" /> Besoin immédiat · {post.details.lieu}
        <Countdown seconds={post.details.fin_dans_secondes} />
      </div>
      <div className="in">
        {head}
        <h3>{post.titre}</h3>
        <p className="t">{post.contenu}</p>
        <div className="needs">
          {besoins.map((n) => (
            <div className="need" key={n.libelle}>
              <span>{n.libelle}</span>
              <span>
                <b>{n.recu}</b> / {n.objectif}
              </span>
              <ProgressBar value={percent(n.recu, n.objectif)} tone="warm" label={`${n.libelle} : ${n.recu} sur ${n.objectif}`} delay={250} />
            </div>
          ))}
        </div>
        <div className="ctaRow">
          <Button
            icon={helped ? Check : HandHeart}
            done={helped}
            onClick={guard(() => {
              if (helped) return;
              setHelped(true);
              toast('Merci ! Le Croissant-Rouge vous contacte');
            })}
          >
            {helped ? 'Vous êtes inscrit·e' : 'Je viens aider'}
          </Button>
          <Button variant="ghost" icon={Heart} onClick={() => navigate(`/campagnes/${post.campagne}/don`)}>
            Je fais un don
          </Button>
        </div>
      </div>
    </>
  );
}

function EventBody({ post, head }) {
  const toast = useToast();
  const navigate = useNavigate();
  const guard = useRequireAuth();
  const { user } = useAuth();
  const [joined, setJoined] = useState(false);
  const d = post.details;
  const inscrits = d.inscrits + (joined ? 1 : 0);
  const people = [['SK', '#d9472b'], ['YA', '#1f3a6b'], ['MB', '#4f7f42']];
  if (joined) people.push([user?.nom_complet?.split(' ').map((w) => w[0]).join('') || 'NS', user?.couleur || '#d9472b', true]);
  return (
    <div className="in">
      {head}
      <div className="ev2">
        <DateBadge date={d.date} />
        <div>
          <h3>{post.titre}</h3>
          <div className="evmeta">
            <span>
              <Clock size={15} aria-hidden="true" /> {d.horaire}
            </span>
            <span>
              <MapPin size={15} aria-hidden="true" /> {d.lieu}
            </span>
          </div>
        </div>
      </div>
      <div className="going">
        <AvatarStack people={people} size="sm" />
        <div className="places">
          <small>
            <b style={{ color: 'var(--navy)' }}>{inscrits}</b> participants · {d.capacite - inscrits} places restantes
          </small>
          <ProgressBar value={percent(inscrits, d.capacite)} style={{ marginTop: 6 }} delay={250} />
        </div>
      </div>
      <div className="ctaRow">
        <Button
          icon={joined ? Check : CalendarPlus}
          done={joined}
          onClick={guard((e) => {
            if (joined) return;
            setJoined(true);
            confetti(e.currentTarget);
            toast('Inscription envoyée à l’organisateur');
          })}
        >
          {joined ? 'Inscrit·e · samedi 08:30' : 'Je participe'}
        </Button>
        <Button variant="ghost" icon={MapPin} onClick={() => navigate(`/evenements/${d.evenement}`)}>
          Itinéraire
        </Button>
      </div>
    </div>
  );
}

function UpdateBody({ post, head, visible }) {
  const toast = useToast();
  const navigate = useNavigate();
  const d = post.details;
  const base = percent(d.collecte - d.semaine, d.objectif);
  const week = percent(d.semaine, d.objectif);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setW(week), 50);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [visible, week]);
  return (
    <>
      <div className="in" style={{ paddingBottom: 12 }}>
        {head}
        <span className="linkcamp">
          <Megaphone size={14} aria-hidden="true" /> {post.campagne_titre}
        </span>
        <p className="t">{post.contenu}</p>
      </div>
      <div className="uimg">
        <img src={post.image} alt="Distribution de cartables à l’école" loading="lazy" style={{ objectPosition: '30% 55%' }} />
      </div>
      <div className="in" style={{ paddingTop: 0 }}>
        <div className="prog2">
          <div className="row">
            <span>
              <b>{tnd(d.collecte)}</b> sur {tnd(d.objectif)}
            </span>
            <span>{percent(d.collecte, d.objectif)} %</span>
          </div>
          <div className="bar" role="progressbar" aria-valuenow={percent(d.collecte, d.objectif)} aria-valuemin={0} aria-valuemax={100} aria-label="Progression de la collecte">
            <span style={{ width: visible ? `${base}%` : 0 }} />
            <i style={{ left: `${base}%`, width: `${w}%` }} />
          </div>
          <div className="wk">
            <TrendingUp size={14} aria-hidden="true" /> +{tnd(d.semaine)} cette semaine · {d.jours_restants} jours restants
          </div>
        </div>
        <div className="ctaRow">
          <Button icon={Heart} onClick={() => navigate(`/campagnes/${post.campagne}/don`)}>
            Donner
          </Button>
          <Button variant="ghost" icon={Bell} onClick={() => toast('Vous suivez cette campagne')}>
            Suivre la campagne
          </Button>
        </div>
      </div>
    </>
  );
}

function GoalBody({ post, head, visible }) {
  const ringRef = useRef(null);
  const [full, setFull] = useState(false);
  const d = post.details;
  useEffect(() => {
    if (!visible) return undefined;
    const t1 = setTimeout(() => setFull(true), 300);
    const t2 = setTimeout(() => confetti(ringRef.current), 1600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [visible]);
  return (
    <div className="in">
      {head}
      <div className="goalrow">
        <div className="ringw" ref={ringRef} role="img" aria-label="Objectif atteint à 100 %">
          <svg width="120" height="120" aria-hidden="true">
            <circle className="bg" cx="60" cy="60" r="52" />
            <circle className="fg" cx="60" cy="60" r="52" style={{ strokeDashoffset: full ? 0 : 327 }} />
          </svg>
          <b aria-hidden="true">100 %</b>
        </div>
        <div>
          <span className="linkcamp" style={{ background: '#ffffff1f', color: '#fff' }}>
            <Trophy size={14} aria-hidden="true" /> {post.campagne_titre}
          </span>
          <div className="big2">{tnd(d.montant)} collectés</div>
          <p className="t">
            Grâce à <b style={{ color: '#fff' }}>{d.donateurs} donateurs</b> et {d.benevoles} bénévoles. {d.suite}
          </p>
        </div>
      </div>
      <div className="ctaRow">
        <Button variant="goal-w" icon={Sparkles} to={`/campagnes/${post.campagne}`}>
          Voir l’impact
        </Button>
        <Button variant="goal-o" icon={ArrowRight} to="/campagnes">
          Campagnes similaires
        </Button>
      </div>
    </div>
  );
}

const DEBRIS = Array.from({ length: 26 }, (_, i) => ({ left: `${((i * 37) % 96) + 2}%`, top: `${55 + ((i * 13) % 40)}%`, transform: `rotate(${i * 31}deg)` }));

function BeforeAfterBody({ post, head, visible }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(50);
  const [touched, setTouched] = useState(false);
  const drag = useRef(false);

  // balayage de démonstration à l'apparition
  useEffect(() => {
    if (!visible || touched || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let raf;
    let t = 0;
    const start = setTimeout(function go() {
      t += 0.04;
      setPos(t < Math.PI * 2 ? 50 + Math.sin(t) * 22 : 50);
      if (t < Math.PI * 2) raf = requestAnimationFrame(go);
    }, 600);
    return () => {
      clearTimeout(start);
      cancelAnimationFrame(raf);
    };
  }, [visible, touched]);

  const setFromX = (x) => {
    const r = ref.current.getBoundingClientRect();
    setPos(Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100)));
  };
  const onKey = (e) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === 'ArrowLeft') setPos((p) => Math.max(0, p - step));
    else if (e.key === 'ArrowRight') setPos((p) => Math.min(100, p + step));
    else return;
    e.preventDefault();
    setTouched(true);
  };
  return (
    <>
      <div className="in" style={{ paddingBottom: 12 }}>
        {head}
        <h3>{post.titre}</h3>
      </div>
      <div
        ref={ref}
        className="ba"
        role="slider"
        tabIndex={0}
        aria-label="Comparer avant et après (flèches gauche et droite)"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        aria-valuetext={`${Math.round(pos)} % de la photo « avant » visible`}
        onKeyDown={onKey}
        onPointerDown={(e) => {
          drag.current = true;
          setTouched(true);
          ref.current.setPointerCapture(e.pointerId);
          setFromX(e.clientX);
        }}
        onPointerMove={(e) => drag.current && setFromX(e.clientX)}
        onPointerUp={() => {
          drag.current = false;
        }}
      >
        <div className="l after" />
        <div className="l before" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          {DEBRIS.map((s, i) => (
            <i key={i} style={s} />
          ))}
        </div>
        <span className="lab2" style={{ left: 12 }}>
          Avant
        </span>
        <span className="lab2" style={{ right: 12 }}>
          Après
        </span>
        <div className="handle" style={{ left: `${pos}%` }}>
          <span>
            <ChevronsLeftRight size={18} aria-hidden="true" />
          </span>
        </div>
        <span className="hint" style={{ opacity: touched ? 0 : 1 }}>
          Glissez pour comparer
        </span>
      </div>
      <div className="in" style={{ paddingTop: 12 }}>
        <div className="stat3">
          {post.details.stats.map(([v, l]) => (
            <div key={l}>
              <b>{v}</b>
              <small>{l}</small>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ThanksBody({ post, head }) {
  return (
    <div className="in">
      {head}
      <div className="qt">
        <span className="q" aria-hidden="true">
          <Quote size={44} />
        </span>
        <p>{post.contenu}</p>
      </div>
      <span className="to">
        <Heart size={14} aria-hidden="true" /> Merci adressé à <b style={{ color: 'var(--navy)' }}>{post.details.destinataire}</b>
      </span>
    </div>
  );
}

function TransparencyBody({ post, head, visible }) {
  const d = post.details;
  const [stamp, setStamp] = useState(false);
  useEffect(() => {
    if (!visible) return undefined;
    const t = setTimeout(() => setStamp(true), 900);
    return () => clearTimeout(t);
  }, [visible]);
  return (
    <div className="in">
      {head}
      <span className="linkcamp">
        <Megaphone size={14} aria-hidden="true" /> {post.campagne_titre}
      </span>
      <p className="t">{post.contenu}</p>
      <div className="rec">
        <span className={`stamp${stamp ? ' on' : ''}`}>✓ Vérifié par moubedra</span>
        {d.lignes.map(([l, v]) => (
          <div className="li" key={l}>
            <span>{l}</span>
            <b>{tnd(v)}</b>
          </div>
        ))}
        <div className="tot">
          <span>Total dépensé</span>
          <span>{tnd(d.lignes.reduce((a, [, v]) => a + v, 0))}</span>
        </div>
      </div>
      <span className="file">
        <FileText size={16} aria-hidden="true" /> {d.fichier} · {d.taille}
      </span>
    </div>
  );
}

function PollBody({ post, head }) {
  const [me, setMe] = useState(null);
  const d = post.details;
  const voted = me !== null;
  return (
    <div className="in">
      {head}
      <h3 id={`q-${post.id}`}>{post.titre}</h3>
      <div className={`opts${voted ? ' voted' : ''}`} role="group" aria-labelledby={`q-${post.id}`}>
        {d.options.map(([label, pct], i) => (
          <button
            key={label}
            type="button"
            className={`opt${me === i ? ' me' : ''}`}
            disabled={voted}
            aria-pressed={me === i}
            onClick={() => {
              setMe(i);
              // TODO(API): pas encore de modèle sondage — voir features/publications/api.js
              voter(post.id, i);
            }}
          >
            <span className="fill" style={{ width: voted ? `${pct}%` : 0 }} />
            <span>{label}</span>
            <span className="pct">{pct} %</span>
          </button>
        ))}
      </div>
      <div className="pmeta">
        {d.votes + (voted ? 1 : 0)} votes · {d.fin}
      </div>
    </div>
  );
}

function StoryBody({ post, head }) {
  return (
    <div className="in">
      {head}
      {post.titre && <h3>{post.titre}</h3>}
      <p className="t">{post.contenu}</p>
    </div>
  );
}

const BODIES = {
  urgent: UrgentBody,
  event: EventBody,
  update: UpdateBody,
  goal: GoalBody,
  beforeafter: BeforeAfterBody,
  thanks: ThanksBody,
  transparency: TransparencyBody,
  poll: PollBody,
  story: StoryBody,
};

/**
 * Carte de publication typée (Appel urgent, Événement, Avancement, Objectif atteint, Transparence,
 * Avant/Après, Merci, Question, Histoire).
 *   <PostCard post={p} onDelete={() => …} />       fil complet
 *   <PostCard post={p} compact />                  aperçu de l'accueil (sans pied)
 */
/* ---------- modification d'une publication (US 7.3) ---------- */
function EditForm({ post, onSaved, onCancel }) {
  const toast = useToast();
  const champ = post.type === 'poll' ? 'titre' : 'contenu';
  const [texte, setTexte] = useState(post[champ] || '');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const id = `edit-publication-${post.id}`;

  const submit = async (e) => {
    e.preventDefault();
    if (!texte.trim()) {
      setErreur('Le message ne peut pas être vide.');
      return;
    }
    setEnvoi(true);
    setErreur('');
    try {
      const maj = await modifierPublication(post.id, { [champ]: texte.trim() });
      toast(maj.statut === 'en_attente' ? 'Modification enregistrée : visible après vérification par la modération' : 'Publication modifiée');
      onSaved(maj);
    } catch (err) {
      setErreur(err?.fields?.contenu || err?.fields?.titre || err?.message || 'Une erreur est survenue.');
      setEnvoi(false);
    }
  };

  return (
    <form className="pc-edit" onSubmit={submit} onKeyDown={(e) => e.key === 'Escape' && onCancel()}>
      <label htmlFor={id} className="lbl">
        Modifier votre publication
      </label>
      <textarea
        id={id}
        className={`inp3${erreur ? ' bad' : ''}`}
        value={texte}
        maxLength={2000}
        autoFocus
        aria-invalid={!!erreur || undefined}
        aria-describedby={erreur ? `${id}-err` : undefined}
        onChange={(e) => setTexte(e.target.value)}
      />
      {erreur && (
        <small className="field-err" id={`${id}-err`} role="alert">
          {erreur}
        </small>
      )}
      <div className="cmt-actions">
        <Button type="submit" variant="navy" size="sm" loading={envoi} loadingText="Enregistrement…">
          Enregistrer
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

export default function PostCard({ post: initial, compact, onDelete, gone, fresh, enterDelay = 0, className = '' }) {
  const { user } = useAuth();
  const [ref, visible] = useInView({ threshold: 0.25 });
  const [post, setPost] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [nbCommentaires, setNbCommentaires] = useState(initial.nb_commentaire || 0);
  useEffect(() => setPost(initial), [initial]);

  const mine = post.mine || (user && user.id === post.auteur);
  // Sans `details` (publications venant du back), les cartes riches s'affichent au format « Histoire ».
  const Body = (post.details || post.type === 'story' ? BODIES[post.type] : null) || StoryBody;
  const head = <Head post={post} mine={mine} onDelete={onDelete} onEdit={compact ? undefined : () => setEditing(true)} />;
  const typeClass = post.type === 'thanks' ? 'thanks2' : post.type;
  const cls = ['pc', typeClass, fresh ? 'fresh' : 'enter', gone && 'gone', className].filter(Boolean).join(' ');
  return (
    <article ref={ref} id={`publication-${post.id}`} className={cls} style={{ animationDelay: `${enterDelay}s` }} aria-label={`${TYPES[post.type]?.label || 'Publication'} — ${post.auteur_nom}`} aria-hidden={gone || undefined}>
      {editing ? (
        <>
          <div className="in">{head}</div>
          <EditForm
            post={post}
            onCancel={() => setEditing(false)}
            onSaved={(maj) => {
              setPost((p) => ({ ...p, ...maj, details: p.details }));
              setEditing(false);
            }}
          />
        </>
      ) : (
        <Body post={post} head={head} visible={visible} />
      )}
      {!compact && (
        <Foot post={post} nbCommentaires={nbCommentaires} commentsOpen={commentsOpen} onToggleComments={() => setCommentsOpen((o) => !o)} />
      )}
      {!compact && commentsOpen && <Comments publicationId={post.id} onCountChange={(d) => setNbCommentaires((x) => Math.max(0, x + d))} />}
    </article>
  );
}
