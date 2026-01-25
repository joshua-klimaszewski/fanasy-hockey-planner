import { Game, WeekSchedule, TeamWeekSchedule, TeamAbbrev, Player, PlayerPosition } from '@/models';

// Use proxy in development to avoid CORS issues
// In production, this should be proxied through the backend
const NHL_API_BASE = import.meta.env.DEV
  ? '/api/nhl'
  : 'https://api-web.nhle.com/v1';

/** NHL team abbreviations mapped to full names */
export const NHL_TEAMS: Record<TeamAbbrev, string> = {
  ANA: 'Anaheim Ducks',
  BOS: 'Boston Bruins',
  BUF: 'Buffalo Sabres',
  CGY: 'Calgary Flames',
  CAR: 'Carolina Hurricanes',
  CHI: 'Chicago Blackhawks',
  COL: 'Colorado Avalanche',
  CBJ: 'Columbus Blue Jackets',
  DAL: 'Dallas Stars',
  DET: 'Detroit Red Wings',
  EDM: 'Edmonton Oilers',
  FLA: 'Florida Panthers',
  LAK: 'Los Angeles Kings',
  MIN: 'Minnesota Wild',
  MTL: 'Montreal Canadiens',
  NSH: 'Nashville Predators',
  NJD: 'New Jersey Devils',
  NYI: 'New York Islanders',
  NYR: 'New York Rangers',
  OTT: 'Ottawa Senators',
  PHI: 'Philadelphia Flyers',
  PIT: 'Pittsburgh Penguins',
  SJS: 'San Jose Sharks',
  SEA: 'Seattle Kraken',
  STL: 'St. Louis Blues',
  TBL: 'Tampa Bay Lightning',
  TOR: 'Toronto Maple Leafs',
  UTA: 'Utah Hockey Club',
  VAN: 'Vancouver Canucks',
  VGK: 'Vegas Golden Knights',
  WPG: 'Winnipeg Jets',
  WSH: 'Washington Capitals',
};

/** Response shape from NHL schedule API */
interface NHLScheduleResponse {
  gameWeek: Array<{
    date: string;
    dayAbbrev: string;
    numberOfGames: number;
    games: Array<{
      id: number;
      startTimeUTC: string;
      venue: {
        default: string;
      };
      homeTeam: {
        abbrev: string;
        placeName: { default: string };
      };
      awayTeam: {
        abbrev: string;
        placeName: { default: string };
      };
    }>;
  }>;
}

/** Response shape from NHL team schedule API */
interface NHLTeamScheduleResponse {
  games: Array<{
    id: number;
    gameDate: string;
    startTimeUTC: string;
    venue: {
      default: string;
    };
    homeTeam: {
      abbrev: string;
    };
    awayTeam: {
      abbrev: string;
    };
  }>;
}

/** Parse NHL API game to our Game model */
function parseGame(
  nhlGame: NHLScheduleResponse['gameWeek'][0]['games'][0],
  date: string
): Game {
  return {
    id: String(nhlGame.id),
    date,
    homeTeam: nhlGame.homeTeam.abbrev,
    awayTeam: nhlGame.awayTeam.abbrev,
    startTime: nhlGame.startTimeUTC,
    venue: nhlGame.venue.default,
  };
}

/** Fetch the full NHL schedule for a week starting from given date */
export async function getWeekSchedule(startDate: string): Promise<WeekSchedule> {
  const url = `${NHL_API_BASE}/schedule/${startDate}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`NHL API error: ${response.status}`);
  }

  const data: NHLScheduleResponse = await response.json();

  const games: Game[] = [];
  const byTeam: Record<TeamAbbrev, TeamWeekSchedule> = {};

  // Process each day in the week
  for (const day of data.gameWeek) {
    for (const nhlGame of day.games) {
      const game = parseGame(nhlGame, day.date);
      games.push(game);

      // Add to home team schedule
      if (!byTeam[game.homeTeam]) {
        byTeam[game.homeTeam] = {
          team: game.homeTeam,
          gamesByDate: {},
          totalGames: 0,
        };
      }
      byTeam[game.homeTeam].gamesByDate[day.date] = game;
      byTeam[game.homeTeam].totalGames++;

      // Add to away team schedule
      if (!byTeam[game.awayTeam]) {
        byTeam[game.awayTeam] = {
          team: game.awayTeam,
          gamesByDate: {},
          totalGames: 0,
        };
      }
      byTeam[game.awayTeam].gamesByDate[day.date] = game;
      byTeam[game.awayTeam].totalGames++;
    }
  }

  // Calculate end date (6 days after start)
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  return {
    startDate,
    endDate: endDate.toISOString().split('T')[0],
    games,
    byTeam,
  };
}

/** Fetch schedule for a specific team */
export async function getTeamWeekSchedule(
  teamAbbrev: TeamAbbrev,
  startDate: string
): Promise<TeamWeekSchedule> {
  const url = `${NHL_API_BASE}/club-schedule-week/${teamAbbrev}/${startDate}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`NHL API error: ${response.status}`);
  }

  const data: NHLTeamScheduleResponse = await response.json();

  const gamesByDate: Record<string, Game> = {};

  for (const nhlGame of data.games) {
    const game: Game = {
      id: String(nhlGame.id),
      date: nhlGame.gameDate,
      homeTeam: nhlGame.homeTeam.abbrev,
      awayTeam: nhlGame.awayTeam.abbrev,
      startTime: nhlGame.startTimeUTC,
      venue: nhlGame.venue.default,
    };
    gamesByDate[game.date] = game;
  }

  return {
    team: teamAbbrev,
    gamesByDate,
    totalGames: Object.keys(gamesByDate).length,
  };
}

/** Get opponent for a team on a specific date */
export function getOpponent(
  schedule: TeamWeekSchedule,
  date: string
): { team: TeamAbbrev; isHome: boolean } | null {
  const game = schedule.gamesByDate[date];
  if (!game) return null;

  const isHome = game.homeTeam === schedule.team;
  return {
    team: isHome ? game.awayTeam : game.homeTeam,
    isHome,
  };
}

// ===== ROSTER API =====

/** NHL roster API response structure */
interface NHLRosterResponse {
  forwards: NHLPlayer[];
  defensemen: NHLPlayer[];
  goalies: NHLPlayer[];
}

/** NHL player from roster API */
interface NHLPlayer {
  id: number;
  firstName: { default: string };
  lastName: { default: string };
  positionCode: 'C' | 'L' | 'R' | 'D' | 'G';
  sweaterNumber: number;
  headshot: string;
}

/** Map NHL position codes to our PlayerPosition type */
function mapNHLPosition(positionCode: NHLPlayer['positionCode']): PlayerPosition {
  switch (positionCode) {
    case 'L':
      return 'LW';
    case 'R':
      return 'RW';
    default:
      return positionCode;
  }
}

/** Parse NHL player to our Player model */
function parseNHLPlayer(nhlPlayer: NHLPlayer, teamAbbrev: TeamAbbrev): Player {
  return {
    id: `nhl-${nhlPlayer.id}`,
    name: `${nhlPlayer.firstName.default} ${nhlPlayer.lastName.default}`,
    positions: [mapNHLPosition(nhlPlayer.positionCode)],
    team: teamAbbrev,
    injuryStatus: 'Healthy',
    imageUrl: nhlPlayer.headshot,
    nhlId: nhlPlayer.id,
  };
}

/** Get current NHL season in YYYYYYYY format (e.g., "20242025") */
function getCurrentSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  // NHL season starts in October (month 9), so before October we're in previous season
  // Note: In January 2025, we're in the 2024-2025 season
  const seasonStartYear = month >= 9 ? year : year - 1;
  return `${seasonStartYear}${seasonStartYear + 1}`;
}

/** Fetch roster for a single team */
export async function getTeamRoster(teamAbbrev: TeamAbbrev): Promise<Player[]> {
  const season = getCurrentSeason();
  const url = `${NHL_API_BASE}/roster/${teamAbbrev}/${season}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`NHL API error fetching ${teamAbbrev} roster: ${response.status}`);
  }

  const data: NHLRosterResponse = await response.json();

  const players: Player[] = [
    ...data.forwards.map((p) => parseNHLPlayer(p, teamAbbrev)),
    ...data.defensemen.map((p) => parseNHLPlayer(p, teamAbbrev)),
    ...data.goalies.map((p) => parseNHLPlayer(p, teamAbbrev)),
  ];

  return players;
}

/** All team abbreviations for fetching all rosters */
const ALL_TEAMS = Object.keys(NHL_TEAMS) as TeamAbbrev[];

/** Fetch all NHL players from all 32 teams */
export async function getAllPlayers(): Promise<Player[]> {
  // Fetch all teams in parallel with batching to avoid overwhelming the API
  const batchSize = 8;
  const allPlayers: Player[] = [];

  for (let i = 0; i < ALL_TEAMS.length; i += batchSize) {
    const batch = ALL_TEAMS.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((team) =>
        getTeamRoster(team).catch((err) => {
          console.error(`Failed to fetch roster for ${team}:`, err);
          return [] as Player[];
        })
      )
    );
    allPlayers.push(...results.flat());
  }

  // Dedupe by player ID (players shouldn't appear on multiple rosters, but just in case)
  const seen = new Set<string>();
  return allPlayers.filter((player) => {
    if (seen.has(player.id)) return false;
    seen.add(player.id);
    return true;
  });
}
