// Tokens are kept per room so a phone that reloads rejoins as the same player.
// Storage can be unavailable (private windows), so every access is guarded.

function key(kind, code) {
  return `htv:${kind}:${String(code).toUpperCase()}`;
}

export function getToken(kind, code) {
  try {
    return window.localStorage.getItem(key(kind, code));
  } catch {
    return memory[key(kind, code)] ?? null;
  }
}

export function setToken(kind, code, token) {
  memory[key(kind, code)] = token;
  try {
    window.localStorage.setItem(key(kind, code), token);
  } catch {
    // Falls back to memory for this tab.
  }
}

const memory = {};
