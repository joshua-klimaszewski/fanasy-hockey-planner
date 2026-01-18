import type { VercelRequest, VercelResponse } from '@vercel/node';

const YAHOO_AUTH_URL = 'https://api.login.yahoo.com/oauth2/request_auth';
const CLIENT_ID = process.env.YAHOO_CLIENT_ID;
const REDIRECT_URI = process.env.YAHOO_REDIRECT_URI;

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!CLIENT_ID || !REDIRECT_URI) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Yahoo OAuth credentials not configured',
    });
  }

  // Generate state for CSRF protection
  const state = Math.random().toString(36).substring(2, 15);

  // Build Yahoo OAuth URL
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid fspt-r', // Fantasy sports read
    state,
  });

  const authUrl = `${YAHOO_AUTH_URL}?${params.toString()}`;

  // Return the URL for the frontend to redirect to
  return res.status(200).json({
    authUrl,
    state,
  });
}
