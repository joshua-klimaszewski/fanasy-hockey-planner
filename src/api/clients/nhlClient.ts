import { Game, WeekSchedule, TeamWeekSchedule, TeamAbbrev } from '@/models';

const NHL_API_BASE = 'https://api-web.nhle.com/v1';

/** NHL team abbreviations mapped to full names */
export const NHL_TEAMS: Record<TeamAbbrev, string> = {
  ANA: 'Anaheim Ducks',
  ARI: 'Arizona Coyotes',
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
