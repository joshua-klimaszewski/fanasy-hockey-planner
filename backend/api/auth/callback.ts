import type { VercelRequest, VercelResponse } from '@vercel/node';

const YAHOO_TOKEN_URL = 'https://api.login.yahoo.com/oauth2/get_token';
const CLIENT_ID = process.env.YAHOO_CLIENT_ID;
const CLIENT_SECRET = process.env.YAHOO_CLIENT_SECRET;
const REDIRECT_URI = process.env.YAHOO_REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { code, state, error, error_description } = req.query;

  // Handle OAuth errors
  if (error) {
    const errorRedirect = `${FRONTEND_URL}?auth_error=${encodeURIComponent(
      String(error_description || error)
    )}`;
    return res.redirect(302, errorRedirect);
  }

  if (!code || typeof code !== 'string') {
    return res.status(400).json({
      error: 'Missing authorization code',
    });
  }

  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    return res.status(500).json({
      error: 'Server configuration error',
    });
  }

  try {
    // Exchange code for tokens
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
      'base64'
    );

    const tokenResponse = await fetch(YAHOO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange error:', errorText);
      return res.redirect(
        302,
        `${FRONTEND_URL}?auth_error=${encodeURIComponent('Failed to exchange code for tokens')}`
      );
    }

    const tokens: TokenResponse = await tokenResponse.json();

    // Calculate expiration timestamp
    const expiresAt = Date.now() + tokens.expires_in * 1000;

    // Redirect back to frontend with tokens in URL hash (not query params for security)
    const redirectUrl = `${FRONTEND_URL}#access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}&expires_at=${expiresAt}&state=${state || ''}`;

    return res.redirect(302, redirectUrl);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return res.redirect(
      302,
      `${FRONTEND_URL}?auth_error=${encodeURIComponent('Authentication failed')}`
    );
  }
}
