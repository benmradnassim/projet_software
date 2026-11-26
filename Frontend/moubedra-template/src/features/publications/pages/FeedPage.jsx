import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, LogIn } from 'lucide-react';
import { useAuth } from '../../../app/AuthContext';
import { Button, EmptyState, Icon, SkeletonPost, Tabs, useToast } from '../../../design/components';
import { IS_DEMO } from '../../../lib/api';
import { plural } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import { getFiltres, getRail, getTypes, listPublications, listPublicationsEntrantes, supprimerPublication } from '../api';
import Composer from '../components/Composer';
import PostCard from '../components/PostCard';
import '../publications.css';

const TYPES = getTypes();
const FILTRES = getFiltres().map((f) => ({ ...f, icon: f.icon ? (p) => <Icon name={f.icon} {...p} /> : undefined }));
const UNDO_MS = 5000;

/** Colonne de droite : impact, campagnes à soutenir, qui peut publier quoi. */
function Rail() {
  // TODO(API): remplacer par les vraies données — voir features/publications/api.js (getRail)
  const { data } = useApi(getRail, []);
  if (!data) return <aside className="rail" />;
  return (
    <aside className="rail" aria-label="À côté du fil">
      <div className="panel impact">
        <span className="eyebrow">Votre impact</span>
        <p className="big">{data.impact.montant}</p>
        <p className="sub">{data.impact.prochain}</p>
      </div>
      <div className="panel">
        <h3>Campagnes à soutenir</h3>
        {data.campagnes.map((c) => (
          <Link key={c.id} to={`/campagnes/${c.id}`} className="mini">
            <img src={c.image} alt="" loading="lazy" style={{ objectPosition: c.position }} />
            <div style={{ flex: 1 }}>
              <b>{c.titre}</b>
              <small>{c.info}</small>
            </div>
            {c.urgent && (
              <span className="pill urg">
                <i aria-hidden="true" />
                Urgent
              </span>
            )}
          </Link>
        ))}
      </div>
      <div className="panel">
        <h3>Qui peut publier quoi ?</h3>
        <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7 }}>
          <b>Tout le monde :</b> Merci, Photo / histoire, Question.
          <br />
          <b>Organisateurs vérifiés :</b> Avancement, Appel urgent, Événement, Transparence, Objectif atteint (automatique).
        </p>
      </div>
    </aside>
  );
}

export default function FeedPage() {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const { data: posts, loading, error, reload, setData } = useApi(listPublications, [], []);
  const [filter, setFilter] = useState('all');
  const [gone, setGone] = useState(() => new Set());
  const [fresh, setFresh] = useState(() => new Set());
  const [incoming, setIncoming] = useState([]);
  const pending = useRef(new Map());
  const postsRef = useRef(posts);
  postsRef.current = posts;

  // pastille « N nouvelles publications » : une fois après 4,5 s en démo, toutes les 30 s avec le back
  useEffect(() => {
    if (loading || error) return undefined;
    const check = () =>
      listPublicationsEntrantes(new Set(postsRef.current.map((p) => p.id)))
        .then((list) => list.length && setIncoming(list))
        .catch(() => {});
    if (IS_DEMO) {
      const t = setTimeout(check, 4500);
      return () => clearTimeout(t);
    }
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, [loading, error]);
  const pill = incoming.length > 0;

  // suppression différée : l'appel DELETE part à la fin du délai d'annulation
  useEffect(() => () => pending.current.forEach((t) => clearTimeout(t)), []);

  const unhide = (id) =>
    setGone((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });

  const remove = (p) => {
    setGone((s) => new Set(s).add(p.id));
    const t = setTimeout(() => {
      pending.current.delete(p.id);
      supprimerPublication(p.id)
        .then(() => setData((list) => list.filter((x) => x.id !== p.id)))
        .catch((err) => {
          unhide(p.id);
          toast(err?.message || 'Suppression impossible pour le moment');
        });
    }, UNDO_MS + 300);
    pending.current.set(p.id, t);
    toast('Publication supprimée', {
      undo: () => {
        clearTimeout(pending.current.get(p.id));
        pending.current.delete(p.id);
        unhide(p.id);
      },
    });
  };

  const add = (list) => {
    const ids = new Set(list.map((p) => p.id));
    setFresh((s) => new Set([...s, ...ids]));
    setData((current) => [...list, ...current.filter((x) => !ids.has(x.id))]);
  };

  const showIncoming = () => {
    add(incoming);
    setIncoming([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const counts = useMemo(() => {
    const c = { all: posts.length };
    posts.forEach((p) => {
      const g = TYPES[p.type]?.group;
      c[g] = (c[g] || 0) + 1;
    });
    return c;
  }, [posts]);

  const visible = posts.filter((p) => filter === 'all' || TYPES[p.type]?.group === filter);

  return (
    <div className="pg feedv">
      <div>
        <h1>Le fil communautaire</h1>
        <p className="intro">Chaque publication a une forme adaptée à ce qu’elle demande : aider, venir, donner, remercier ou décider.</p>

        {isAuthenticated ? (
          <Composer onPublished={(p) => add([p])} />
        ) : (
          <div className="panel comp comp-guest">
            <p>Connectez-vous pour remercier, raconter ou poser une question à la communauté.</p>
            <Button to="/connexion" variant="navy" size="sm" icon={LogIn} state={{ from: '/communaute' }}>
              Se connecter
            </Button>
          </div>
        )}

        <Tabs variant="pill" label="Filtrer le fil" tabs={FILTRES} value={filter} onChange={setFilter} />
        <span className="sr-only" aria-live="polite">
          {counts[filter] || 0} publications
        </span>

        <button type="button" className={`newpill${pill ? ' show' : ''}`} onClick={showIncoming} tabIndex={pill ? 0 : -1} aria-hidden={!pill}>
          <ArrowUp size={16} aria-hidden="true" /> {plural(incoming.length || 1, 'nouvelle publication', 'nouvelles publications')}
        </button>

        <div aria-busy={loading} key={filter}>
          {loading ? (
            <>
              <SkeletonPost />
              <SkeletonPost />
            </>
          ) : error ? (
            <EmptyState
              image="fil"
              title="Le fil n’a pas pu être chargé"
              text={error.message}
              actions={
                <Button variant="navy" size="sm" onClick={reload}>
                  Réessayer
                </Button>
              }
            />
          ) : visible.length ? (
            visible.map((p, i) => (
              <PostCard key={p.id} post={p} gone={gone.has(p.id)} fresh={fresh.has(p.id)} enterDelay={Math.min(i, 3) * 0.08} onDelete={() => remove(p)} />
            ))
          ) : (
            <EmptyState image="fil" title="Rien ici pour le moment" text="Aucune publication dans cette catégorie. Revenez bientôt !" />
          )}
        </div>
      </div>
      <Rail />
    </div>
  );
}
