// Vercel can set VITE_API_BASE_URL to the separately hosted PHP API.
// Without it, api.php next to the page keeps the XAMPP setup working.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'api.php';
const BASE = new URL(API_BASE, window.location.href.split('#')[0]).toString();

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function apiUrl(route, query = {}) {
  const url = new URL(BASE);
  url.searchParams.set('r', route);
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  }
  return url.toString();
}

export async function api(route, { method = 'GET', body, token, query } = {}) {
  let res;
  try {
    res = await fetch(apiUrl(route, query), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'X-Token': token } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Can\'t reach the game server. Check your connection and that the PHP server is running.', 0);
  }
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ApiError('The game server sent an unexpected reply. Check that PHP is running and the database is set up.', res.status);
  }
  if (!res.ok) throw new ApiError(data.error || 'That didn\'t work. Try again.', res.status);
  return data;
}
