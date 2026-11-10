import { useEffect, useState } from 'react';
import { api } from './api.js';

let cache = null;
let pending = null;

/** Game content (roles, instruments, packs, abilities), loaded once. */
export function useContent() {
  const [content, setContent] = useState(cache);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (cache) return;
    pending ??= api('/content').then((c) => {
      c.roleById = Object.fromEntries(c.roles.map((r) => [r.id, r]));
      c.instrumentById = Object.fromEntries(c.instruments.map((i) => [i.id, i]));
      c.abilityById = Object.fromEntries(c.abilities.map((a) => [a.id, a]));
      cache = c;
      return c;
    });
    pending.then(setContent).catch((e) => {
      pending = null;
      setError(e.message);
    });
  }, []);
  return { content, error };
}
