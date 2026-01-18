import type { VercelRequest, VercelResponse } from '@vercel/node';

const YAHOO_API_BASE = 'https://fantasysports.yahooapis.com/fantasy/v2';
const CLIENT_ID = process.env.YAHOO_CLIENT_ID;
const CLIENT_SECRET = process.env.YAHOO_CLIENT_SECRET;

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

async function refreshAccessToken(
  refreshToken: string
): Promise<RefreshResponse | null> {
  if (!CLIENT_ID || !CLIENT_SECRET) return null;

  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
    'base64'
  );

  try {
    const response = await fetch(
      'https://api.login.yahoo.com/oauth2/get_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      }
    );

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET and POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization' });
  }

  const accessToken = authHeader.substring(7);

  // Get the Yahoo API path from query
  const { path, ...queryParams } = req.query;
  if (!path || typeof path !== 'string') {
    return res.status(400).json({ error: 'Missing API path' });
  }

  // Build Yahoo API URL
  const queryString = new URLSearchParams(
    Object.entries(queryParams)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  );

  // Always request JSON format
  queryString.set('format', 'json');

  const yahooUrl = `${YAHOO_API_BASE}${path}?${queryString.toString()}`;

  try {
    // Make request to Yahoo API
    const yahooResponse = await fetch(yahooUrl, {
      method: req.method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: req.method === 'POST' ? JSON.stringify(req.body) : undefined,
    });

    // Check if token expired
    if (yahooResponse.status === 401) {
      // Try to get refresh token from header
      const refreshToken = req.headers['x-refresh-token'] as string;

      if (refreshToken) {
        const newTokens = await refreshAccessToken(refreshToken);

        if (newTokens) {
          // Retry with new token
          const retryResponse = await fetch(yahooUrl, {
            method: req.method,
            headers: {
              Authorization: `Bearer ${newTokens.access_token}`,
              'Content-Type': 'application/json',
            },
            body: req.method === 'POST' ? JSON.stringify(req.body) : undefined,
          });

          const data = await retryResponse.json();

          // Return new tokens in response headers
          res.setHeader('X-New-Access-Token', newTokens.access_token);
          res.setHeader('X-New-Refresh-Token', newTokens.refresh_token);
          res.setHeader(
            'X-New-Expires-At',
            String(Date.now() + newTokens.expires_in * 1000)
          );

          return res.status(retryResponse.status).json(data);
        }
      }

      return res.status(401).json({ error: 'Token expired and refresh failed' });
    }

    const data = await yahooResponse.json();
    return res.status(yahooResponse.status).json(data);
  } catch (err) {
    console.error('Yahoo API proxy error:', err);
    return res.status(500).json({ error: 'Failed to proxy request' });
  }
}
