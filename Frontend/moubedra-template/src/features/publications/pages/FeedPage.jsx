import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, LogIn } from 'lucide-react';
import { useAuth } from '../../../app/AuthContext';
import { Button, EmptyState, Icon, SkeletonPost, Tabs, useToast } from '../../../design/components';
import { useApi } from '../../../lib/useApi';
import { getFiltres, getPublicationEntrante, getRail, getTypes, listPublications, supprimerPublication } from '../api';
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
                Urgent ? </span>
            )}
          </Link>
        ))}
      </div>
      <div className="panel">
        <h3>Qui peut publier quoi ?</h3>
        <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7 }}>
          <b>Tout le monde :</b> Merci, Photo / histoire, Question. ? <br />
          <b>Organisateurs vérifiés :</b> Avancement, Appel urgent, Événement, Transparence, Objectif atteint (automatique).
        </p>
      </div>
    </aside>
  );
}

export default function FeedPage() {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  // TODO(API): remplacer par GET /api/publications/ — voir features/publications/api.js (listPublications)
  const { data: posts, loading, setData } = useApi(listPublications, [], []);
  const [filter, setFilter] = useState('all');
  const [gone, setGone] = useState(() => new Set());
  const [fresh, setFresh] = useState(() => new Set());
  const [pill, setPill] = useState(false);
  const pending = useRef(new Map());

  // pastille « 1 nouvelle publication » après 4,5 s (démo)
  useEffect(() => {
    if (loading) return undefined;
    const t = setTimeout(() => setPill(true), 4500);
    return () => clearTimeout(t);
  }, [loading]);

  // suppression différée : l'appel DELETE part à la fin du délai d'annulation
  useEffect(() => () => pending.current.forEach((t) => clearTimeout(t)), []);

  const remove = (p) => {
    setGone((s) => new Set(s).add(p.id));
    const t = setTimeout(() => {
      pending.current.delete(p.id);
      setData((list) => list.filter((x) => x.id !== p.id));
      supprimerPublication(p.id);
    }, UNDO_MS + 300);
    pending.current.set(p.id, t);
    toast('Publication supprimée', {
      undo: () => {
        clearTimeout(pending.current.get(p.id));
        pending.current.delete(p.id);
        setGone((s) => {
          const n = new Set(s);
          n.delete(p.id);
          return n;
        });
      },
    });
  };

  const add = (p) => {
    setFresh((s) => new Set(s).add(p.id));
    setData((list) => [p, ...list]);
  };

  const showIncoming = async () => {
    setPill(false);
    const p = await getPublicationEntrante();
    add(p);
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
          <Composer onPublished={add} />
        ) : (
          <div className="panel comp comp-guest">
            <p>Connectez-vous pour remercier, raconter ou poser une question à la communauté.</p>
            <Button to="/connexion" variant="navy" size="sm" icon={LogIn} state={{ from: '/communaute' }}>
              Se connecter ? </Button>
          </div>
        )}

        <Tabs variant="pill" label="Filtrer le fil" tabs={FILTRES} value={filter} onChange={setFilter} />
        <span className="sr-only" aria-live="polite">
          {counts[filter] || 0} publications ? </span>

        <button type="button" className={`newpill${pill ? ' show' : ''}`} onClick={showIncoming} tabIndex={pill ? 0 : -1} aria-hidden={!pill}>
          <ArrowUp size={16} aria-hidden="true" /> 1 nouvelle publication ? </button>

        <div aria-busy={loading} key={filter}>
          {loading ? (
            <>
              <SkeletonPost />
              <SkeletonPost />
            </>
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
