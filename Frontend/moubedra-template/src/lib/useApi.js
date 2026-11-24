import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Charge des données depuis une fonction d'un `features/<module>/api.js`.
 *
 *   const { data, loading, error, reload, setData } = useApi(() => listCampagnes(), []);
 *
 * - `setData` permet les mises à jour optimistes (favori, suppression…)
 * - `reload()` relance la requête
 */
export function useApi(fetcher, deps = [], initial = null) {
  const [state, setState] = useState({ data: initial, loading: true, error: null });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve()
      .then(() => fetcherRef.current())
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((error) => alive && setState((s) => ({ ...s, loading: false, error })));
    return () => {
      alive = false;
    };
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, deps);

  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }));
  }, []);

  return { ...state, reload: load, setData };
}
