import { useEffect, useRef, useState } from 'react';
import { Image, Lock, Megaphone, Send, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../app/AuthContext';
import { Avatar, Button, Icon, useToast } from '../../../design/components';
import { creerPublication, getTypesComposer, verifierTexte } from '../api';

const TYPES = getTypesComposer();
const MAX = 500;

/**
 * Zone de publication : choix du type (types organisateur verrouillés pour les citoyens),
 * compteur de caractères, vérification IA simulée, envoi.
 */
export default function Composer({ onPublished }) {
  const { user, role } = useAuth();
  const toast = useToast();
  const [type, setType] = useState('thanks');
  const [text, setText] = useState('');
  const [ai, setAi] = useState(null); // null | 'checking' | 'ok'
  const [state, setState] = useState('idle'); // idle | sending | done
  const taRef = useRef(null);
  const aiTimer = useRef();
  const canOrganize = role === 'organisateur' || role === 'admin';
  const current = TYPES.find((t) => t.type === type);

  useEffect(() => () => clearTimeout(aiTimer.current), []);

  const onChange = (e) => {
    const v = e.target.value.slice(0, MAX);
    setText(v);
    setAi('checking');
    clearTimeout(aiTimer.current);
    // TODO(API): le score de toxicité est calculé par le back à la création — voir features/publications/api.js
    aiTimer.current = setTimeout(() => verifierTexte(v).then(() => setAi('ok')), 0);
  };

  const pick = (t) => {
    if (t.organisateur && !canOrganize) {
      toast('Devenez organisateur vérifié pour publier ce type');
      return;
    }
    setType(t.type);
    taRef.current?.focus();
  };

  const publish = async () => {
    if (state !== 'idle') return;
    setState('sending');
    const contenu = text.trim() || 'Première matinée à la cuisine solidaire de Bab El Khadra, une équipe incroyable ! 🍲';
    const kind = ['thanks', 'story', 'poll'].includes(type) ? type : 'story';
    // TODO(API): POST /api/publications/ — voir features/publications/api.js (creerPublication)
    const p = await creerPublication({
      type: kind,
      contenu,
      auteur: { ...user, initiales: user.nom_complet.split(' ').map((w) => w[0]).join('').slice(0, 2) },
    });
    if (kind === 'story' && type !== 'story') p.titre = current.label;
    onPublished?.(p);
    setText('');
    setAi(null);
    setState('done');
    setTimeout(() => setState('idle'), 1400);
  };

  return (
    <div className="panel comp">
      <div className="row1">
        <Avatar name={user.nom_complet} color={user.couleur} />
        <div style={{ flex: 1 }}>
          <label htmlFor="composer" className="sr-only">
            Votre publication
          </label>
          <textarea id="composer" ref={taRef} value={text} onChange={onChange} placeholder={current.placeholder} maxLength={MAX} />
        </div>
      </div>
      <div className="ctypes" role="group" aria-label="Type de publication">
        {TYPES.map((t) => {
          const locked = t.organisateur && !canOrganize;
          return (
            <button
              key={t.type}
              type="button"
              className={`ct${locked ? ' lock' : ''}`}
              aria-pressed={type === t.type}
              aria-disabled={locked || undefined}
              aria-describedby={locked ? `tip-${t.type}` : undefined}
              onClick={() => pick(t)}
            >
              {locked ? <Lock size={14} aria-hidden="true" /> : <Icon name={t.icon} size={14} />} {t.label}
              {locked && (
                <span className="tip" role="tooltip" id={`tip-${t.type}`}>
                  Réservé aux organisateurs vérifiés
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="tools">
        <button type="button" className="tool" onClick={() => toast('Ajout de photo : bientôt disponible')}>
          <Image size={16} aria-hidden="true" /> Photo
        </button>
        <button type="button" className="tool" onClick={() => toast('Lien vers une campagne : bientôt disponible')}>
          <Megaphone size={16} aria-hidden="true" /> Lier une campagne
        </button>
        <span className="count" aria-live="polite">
          {text.length} / {MAX}
        </span>
        <Button
          variant="navy"
          size="sm"
          icon={state === 'done' ? undefined : Send}
          loading={state === 'sending'}
          loadingText="Envoi…"
          onClick={publish}
          style={state === 'done' ? { background: 'var(--green)' } : undefined}
        >
          {state === 'done' ? '✓ Publié' : 'Publier'}
        </Button>
      </div>
      <div className="ai" aria-live="polite">
        {ai === 'checking' && (
          <>
            <span className="sp" aria-hidden="true" /> Vérification IA…
          </>
        )}
        {ai === 'ok' && (
          <>
            <ShieldCheck size={15} aria-hidden="true" /> Aucun problème détecté
          </>
        )}
      </div>
    </div>
  );
}
