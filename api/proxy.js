const API_URL = 'https://holdvisionapi.ifree.page/backend/public/api.php';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const requestUrl = new URL(req.url, 'https://vercel.local');
  const upstreamUrl = new URL(API_URL);
  upstreamUrl.search = requestUrl.search;

  const headers = {};
  if (req.headers['content-type']) {
    headers['Content-Type'] = req.headers['content-type'];
  }
  if (req.headers['x-token']) {
    headers['X-Token'] = req.headers['x-token'];
  }

  let body;
  if (req.method === 'POST' && req.body !== undefined) {
    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }

  try {
    const response = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body,
    });
    const responseBody = await response.text();

    res.statusCode = response.status;
    for (const header of ['content-type', 'content-disposition', 'cache-control']) {
      const value = response.headers.get(header);
      if (value) res.setHeader(header, value);
    }
    res.end(responseBody);
  } catch (error) {
    console.error('InfinityFree API proxy request failed:', error);
    res.status(502).json({ error: 'The game server could not be reached.' });
  }
};
