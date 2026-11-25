import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Undo2 } from 'lucide-react';

/**
 * Notification éphémère en bas de l'écran (5 s), annoncée aux lecteurs d'écran (role="status").
 *
 *   const toast = useToast();
 *   toast('Campagne enregistrée');
 *   toast('Publication supprimée', { undo: () => restaurer(p) });   // bouton « Annuler »
 */
const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [state, setState] = useState({ msg: '', undo: null, show: false, n: 0 });
  const timer = useRef();

  const toast = useCallback((msg, { undo = null, duration = 5000 } = {}) => {
    clearTimeout(timer.current);
    setState((s) => ({ msg, undo, show: true, n: s.n + 1 }));
    timer.current = setTimeout(() => setState((s) => ({ ...s, show: false })), duration);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onUndo = () => {
    clearTimeout(timer.current);
    state.undo?.();
    setState((s) => ({ ...s, show: false, undo: null }));
  };

  const value = useMemo(() => toast, [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={`toast${state.show ? ' show' : ''}`} role="status" aria-live="polite" aria-atomic="true">
        <Check size={18} aria-hidden="true" />
        <span>{state.msg}</span>
        {state.undo && state.show && (
          <button type="button" className="undo" onClick={onUndo}>
            <Undo2 size={16} aria-hidden="true" /> Annuler ? </button>
        )}
        <span className="tbar" key={state.n} aria-hidden="true" />
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
