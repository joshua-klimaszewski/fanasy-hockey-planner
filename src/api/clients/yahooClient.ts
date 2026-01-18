import { Player, PlayerPosition } from '@/models';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/** Yahoo League response */
interface YahooLeague {
  league_key: string;
  league_id: string;
  name: string;
  num_teams: number;
  current_week: number;
  start_week: number;
  end_week: number;
}

/** Yahoo Player response */
interface YahooPlayer {
  player_key: string;
  player_id: string;
  name: {
    full: string;
    first: string;
    last: string;
  };
  editorial_team_abbr: string;
  display_position: string;
  eligible_positions: Array<{ position: string }>;
  status?: string;
  status_full?: string;
  image_url?: string;
}

/** Get stored tokens */
function getTokens(): { accessToken: string; refreshToken: string } | null {
  const accessToken = sessionStorage.getItem('yahoo_access_token');
  const refreshToken = sessionStorage.getItem('yahoo_refresh_token');

  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

/** Store tokens */
export function setTokens(
  accessToken: string,
  refreshToken: string,
  expiresAt: number
): void {
  sessionStorage.setItem('yahoo_access_token', accessToken);
  sessionStorage.setItem('yahoo_refresh_token', refreshToken);
  sessionStorage.setItem('yahoo_expires_at', String(expiresAt));
}

/** Clear tokens */
export function clearTokens(): void {
  sessionStorage.removeItem('yahoo_access_token');
  sessionStorage.removeItem('yahoo_refresh_token');
  sessionStorage.removeItem('yahoo_expires_at');
}

/** Check if user is authenticated */
export function isAuthenticated(): boolean {
  const tokens = getTokens();
  if (!tokens) return false;

  const expiresAt = sessionStorage.getItem('yahoo_expires_at');
  if (expiresAt && Date.now() > parseInt(expiresAt, 10)) {
    // Token expired, but we might be able to refresh
    return true;
  }

  return true;
}

/** Make authenticated request to Yahoo API via backend proxy */
async function yahooFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const tokens = getTokens();
  if (!tokens) {
    throw new Error('Not authenticated');
  }

  const url = new URL(`${BACKEND_URL}/api/yahoo/proxy`);
  url.searchParams.set('path', path);

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${tokens.accessToken}`,
      'X-Refresh-Token': tokens.refreshToken,
      'Content-Type': 'application/json',
    },
  });

  // Check for new tokens in response headers
  const newAccessToken = response.headers.get('X-New-Access-Token');
  const newRefreshToken = response.headers.get('X-New-Refresh-Token');
  const newExpiresAt = response.headers.get('X-New-Expires-At');

  if (newAccessToken && newRefreshToken && newExpiresAt) {
    setTokens(newAccessToken, newRefreshToken, parseInt(newExpiresAt, 10));
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearTokens();
      throw new Error('Authentication expired');
    }
    throw new Error(`Yahoo API error: ${response.status}`);
  }

  return response.json();
}

/** Initiate Yahoo OAuth login */
export async function initiateLogin(): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/auth/login`);
  const data = await response.json();

  if (data.authUrl) {
    // Store state for verification after redirect
    sessionStorage.setItem('yahoo_oauth_state', data.state);
    // Redirect to Yahoo
    window.location.href = data.authUrl;
  } else {
    throw new Error('Failed to get auth URL');
  }
}

/** Handle OAuth callback (parse tokens from URL hash) */
export function handleAuthCallback(): boolean {
  const hash = window.location.hash.substring(1);
  if (!hash) return false;

  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const expiresAt = params.get('expires_at');

  if (accessToken && refreshToken && expiresAt) {
    setTokens(accessToken, refreshToken, parseInt(expiresAt, 10));

    // Clear the hash from URL
    window.history.replaceState(null, '', window.location.pathname);
    return true;
  }

  return false;
}

/** Map Yahoo position to internal position */
function mapYahooPosition(yahooPos: string): PlayerPosition | null {
  const posMap: Record<string, PlayerPosition> = {
    C: 'C',
    LW: 'LW',
    RW: 'RW',
    D: 'D',
    G: 'G',
  };
  return posMap[yahooPos] || null;
}

/** Convert Yahoo player to internal Player model */
function convertYahooPlayer(yahooPlayer: YahooPlayer): Player {
  const positions = yahooPlayer.eligible_positions
    .map((p) => mapYahooPosition(p.position))
    .filter((p): p is PlayerPosition => p !== null);

  return {
    id: yahooPlayer.player_key,
    name: yahooPlayer.name.full,
    positions,
    team: yahooPlayer.editorial_team_abbr,
    injuryStatus: yahooPlayer.status === 'IR' ? 'IR' :
                  yahooPlayer.status === 'IR+' ? 'IR+' :
                  yahooPlayer.status === 'DTD' ? 'DTD' :
                  yahooPlayer.status === 'O' ? 'O' : 'Healthy',
    injuryNote: yahooPlayer.status_full,
    yahooKey: yahooPlayer.player_key,
    imageUrl: yahooPlayer.image_url,
  };
}

/** Get user's fantasy hockey leagues */
export async function getLeagues(): Promise<YahooLeague[]> {
  const data = await yahooFetch<{
    fantasy_content: {
      users: Array<{
        user: Array<{
          games: Array<{
            game: Array<{
              leagues: Array<{
                league: YahooLeague[];
              }>;
            }>;
          }>;
        }>;
      }>;
    };
  }>('/users;use_login=1/games;game_keys=nhl/leagues');

  // Navigate the deeply nested Yahoo response
  try {
    const games = data.fantasy_content.users[0].user[0].games;
    const leagues = games[0].game[0].leagues;
    return leagues.map((l) => l.league[0]);
  } catch {
    return [];
  }
}

/** Get team roster for a league */
export async function getTeamRoster(teamKey: string): Promise<Player[]> {
  const data = await yahooFetch<{
    fantasy_content: {
      team: Array<{
        roster: {
          players: Array<{
            player: YahooPlayer[];
          }>;
        };
      }>;
    };
  }>(`/team/${teamKey}/roster`);

  try {
    const players = data.fantasy_content.team[0].roster.players;
    return players.map((p) => convertYahooPlayer(p.player[0]));
  } catch {
    return [];
  }
}

/** Search for players in a league */
export async function searchPlayers(
  leagueKey: string,
  query: string
): Promise<Player[]> {
  const data = await yahooFetch<{
    fantasy_content: {
      league: Array<{
        players: Array<{
          player: YahooPlayer[];
        }>;
      }>;
    };
  }>(`/league/${leagueKey}/players;search=${encodeURIComponent(query)}`);

  try {
    const players = data.fantasy_content.league[0].players;
    return players.map((p) => convertYahooPlayer(p.player[0]));
  } catch {
    return [];
  }
}
