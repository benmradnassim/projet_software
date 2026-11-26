import { useEffect, useRef, useState } from 'react';
import { Image, Lock, Megaphone, Send, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';
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
  const [ai, setAi] = useState(null); // null | 'checking' | { verdict: 'ok' | 'revue' | 'bloque', motif }
  const [erreur, setErreur] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | done
  const taRef = useRef(null);
  const aiTimer = useRef();
  const aiAbort = useRef();
  const canOrganize = role === 'organisateur' || role === 'admin';
  const current = TYPES.find((t) => t.type === type);

  useEffect(
    () => () => {
      clearTimeout(aiTimer.current);
      aiAbort.current?.abort();
    },
    [],
  );

  // US 7.6 : vérification IA côté serveur, 600 ms après la dernière frappe
  const onChange = (e) => {
    const v = e.target.value.slice(0, MAX);
    setText(v);
    setErreur('');
    clearTimeout(aiTimer.current);
    aiAbort.current?.abort();
    if (!v.trim()) {
      setAi(null);
      return;
    }
    setAi('checking');
    aiTimer.current = setTimeout(() => {
      const ctrl = new AbortController();
      aiAbort.current = ctrl;
      verifierTexte(v, { signal: ctrl.signal })
        .then(setAi)
        .catch((err) => err?.name !== 'AbortError' && setAi(null));
    }, 600);
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
    const contenu = text.trim();
    if (!contenu) {
      setErreur('Écrivez un message avant de publier.');
      taRef.current?.focus();
      return;
    }
    setState('sending');
    setErreur('');
    try {
      const p = await creerPublication({
        type,
        contenu,
        auteur: { ...user, initiales: user.nom_complet.split(' ').map((w) => w[0]).join('').slice(0, 2) },
      });
      if (p.statut === 'en_attente') {
        toast('Merci ! Votre publication sera visible après vérification par la modération.');
      } else {
        onPublished?.(p);
      }
      setText('');
      setAi(null);
      setState('done');
      setTimeout(() => setState('idle'), 1400);
    } catch (err) {
      setErreur(err?.fields?.contenu || err?.fields?.type || err?.message || 'Publication impossible pour le moment.');
      setState('idle');
    }
  };

  return (
    <div className="panel comp">
      <div className="row1">
        <Avatar name={user.nom_complet} color={user.couleur} />
        <div style={{ flex: 1 }}>
          <label htmlFor="composer" className="sr-only">
            Votre publication
          </label>
          <textarea
            id="composer"
            ref={taRef}
            value={text}
            onChange={onChange}
            placeholder={current.placeholder}
            maxLength={MAX}
            aria-invalid={!!erreur || undefined}
            aria-describedby={erreur ? 'composer-err' : undefined}
          />
          {erreur && (
            <small className="field-err" id="composer-err" role="alert">
              {erreur}
            </small>
          )}
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
        {ai?.verdict === 'ok' && (
          <>
            <ShieldCheck size={15} aria-hidden="true" /> Aucun problème détecté
          </>
        )}
        {ai?.verdict === 'revue' && (
          <span style={{ color: 'var(--wait-fg)' }}>
            <ShieldAlert size={15} aria-hidden="true" /> {ai.motif || 'Contenu sensible'} : votre message sera vérifié avant d’être publié
          </span>
        )}
        {ai?.verdict === 'bloque' && (
          <span style={{ color: 'var(--no-fg)' }}>
            <ShieldX size={15} aria-hidden="true" /> {ai.motif || 'Contenu inapproprié'} : ce message sera bloqué, reformulez-le
          </span>
        )}
      </div>
    </div>
  );
}
