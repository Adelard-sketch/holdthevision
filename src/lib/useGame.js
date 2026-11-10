import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';

const POLL_MS = 1200;

/**
 * Keeps a game in sync by polling. The server answers "nothing changed"
 * cheaply when the version hasn't moved, so polling stays light on phones.
 */
export function useGame(code, token) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const version = useRef(-1);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const d = await api(`/sessions/${code}/state`, { token, query: { since: version.current } });
      if (d.changed) {
        version.current = d.version;
        setData(d);
      }
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      inFlight.current = false;
    }
  }, [code, token]);

  useEffect(() => {
    version.current = -1;
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const send = useCallback(
    async (type, payload = {}) => {
      await api(`/sessions/${code}/actions`, { method: 'POST', token, body: { type, payload } });
      inFlight.current = false;
      await refresh();
    },
    [code, token, refresh],
  );

  return { data, state: data?.state, me: data?.me, viewer: data?.viewer, error, send, refresh };
}

/** Wraps an async action with busy and error state for buttons. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const run = useCallback(async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }, []);
  return { run, busy, error, setError };
}

export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
