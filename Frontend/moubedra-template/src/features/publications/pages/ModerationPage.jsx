import { useCallback, useEffect, useState } from 'react';
import { Check, Eye, Sparkles, Trash2 } from 'lucide-react';
import { Avatar, Badge, Button, EmptyState, PageHeader, ProgressBar, SkeletonList, useToast } from '../../../design/components';
import { useApi } from '../../../lib/useApi';
import { listFileModeration, moderer } from '../api';
import '../publications.css';

/** Surligne les mots repérés par l'IA. */
function Highlight({ text, words }) {
  if (!words.length) return text;
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  return text.split(re).map((part, i) => (words.includes(part) ? <mark key={i}>{part}</mark> : part));
}

const ACTIONS = {
  garder: 'Contenu conservé · l’IA apprend de cette décision',
  masquer: 'Contenu masqué',
  supprimer: 'Supprimé · avertissement envoyé à l’auteur',
};

export default function ModerationPage() {
  const toast = useToast();
  // TODO(API): remplacer par GET /api/publications/ + /api/commentaires/ filtrés sur score_toxicite — voir features/publications/api.js
  const { data: queue, loading, setData } = useApi(listFileModeration, [], []);
  const [cur, setCur] = useState(0);
  const [leaving, setLeaving] = useState(null);

  const act = useCallback(
    (item, decision) => {
      if (!item || leaving) return;
      setLeaving(item.id);
      toast(ACTIONS[decision]);
      // TODO(API): PATCH du statut — voir features/publications/api.js (moderer)
      moderer(item.id, decision);
      setTimeout(() => {
        setData((q) => q.filter((x) => x.id !== item.id));
        setCur(0);
        setLeaving(null);
      }, 400);
    },
    [leaving, setData, toast],
  );

  // raccourcis clavier G / M / S (hors champs de saisie)
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || /input|textarea|select/i.test(document.activeElement?.tagName)) return;
      const k = e.key.toLowerCase();
      const map = { g: 'garder', m: 'masquer', s: 'supprimer' };
      if (map[k] && queue[cur]) {
        e.preventDefault();
        act(queue[cur], map[k]);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [queue, cur, act]);

  return (
    <div className="pg">
      <PageHeader
        crumbs={['File d’attente', 'Modération IA']}
        title="Modération IA"
        subtitle={
          <>
            L’IA signale, un humain décide. Raccourcis : <kbd>G</kbd> garder · <kbd>M</kbd> masquer · <kbd>S</kbd> supprimer + avertir ? </>
        }
        actions={
          <Badge tone="info" icon={Sparkles}>
            14 analysés aujourd’hui ? </Badge>
        }
      />
      {loading ? (
        <div className="panel">
          <SkeletonList rows={3} />
        </div>
      ) : !queue.length ? (
        <EmptyState image="fil" title="File vide, bravo !" text="Tous les contenus signalés par l’IA ont été traités." />
      ) : (
        <ul aria-label="Contenus à modérer" style={{ listStyle: 'none' }}>
          {queue.map((m, i) => {
            const sc = Math.round(m.score_toxicite * 100);
            const col = sc > 70 ? '#d9472b' : sc > 40 ? '#e8963a' : '#4f7f42';
            return (
              <li
                key={m.id}
                className={`panel mqi${i === cur ? ' cur' : ''}${leaving === m.id ? ' leaving' : ''}`}
                style={{ animationDelay: `${i * 0.06}s` }}
                onClick={() => setCur(i)}
                aria-current={i === cur || undefined}
              >
                <div className="row" style={{ gap: 12 }}>
                  <Avatar initials={m.auteur_initiales} color="#888" />
                  <div className="gw">
                    <h4 style={{ font: '700 16px var(--display)', color: 'var(--navy)' }}>
                      {m.auteur_nom} · <span style={{ fontWeight: 500, color: 'var(--muted)' }}>{m.objet === 'commentaire' ? 'Commentaire' : 'Publication'}</span>
                    </h4>
                    <small className="muted">Motif IA : {m.motif_ia}</small>
                  </div>
                  <div className="mscore">
                    <small className="muted">Score de risque</small>
                    <ProgressBar value={sc} color={col} height={10} label={`Score de risque ${sc} %`} />
                    <b style={{ color: col }}>{sc} %</b>
                  </div>
                </div>
                <p className="mtxt">
                  <Highlight text={m.contenu} words={m.mots} />
                </p>
                <div className="row" style={{ gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <Button variant="ghost" size="sm" icon={Check} onClick={(e) => { e.stopPropagation(); act(m, 'garder'); }}>
                    Garder <kbd>G</kbd>
                  </Button>
                  <Button variant="ghost" size="sm" icon={Eye} onClick={(e) => { e.stopPropagation(); act(m, 'masquer'); }}>
                    Masquer <kbd>M</kbd>
                  </Button>
                  <Button variant="danger-soft" size="sm" icon={Trash2} onClick={(e) => { e.stopPropagation(); act(m, 'supprimer'); }}>
                    Supprimer + avertir <kbd>S</kbd>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
