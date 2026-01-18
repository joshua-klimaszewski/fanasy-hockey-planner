import { TeamAbbrev } from './Player';

/** Game indicator for roster grid display */
export type GameIndicator =
  | 'X' // Has game, will start
  | 'O' // Has game, bench conflict (can't fit)
  | '||' // Back-to-back (goalie uncertainty)
  | '?' // Uncertain start
  | '-'; // No game

/** A single NHL game */
export interface Game {
  /** Unique game ID */
  id: string;

  /** Game date (YYYY-MM-DD) */
  date: string;

  /** Home team abbreviation */
  homeTeam: TeamAbbrev;

  /** Away team abbreviation */
  awayTeam: TeamAbbrev;

  /** Game start time (ISO 8601) */
  startTime: string;

  /** Venue name */
  venue?: string;
}

/** Team schedule for a week */
export interface TeamWeekSchedule {
  /** Team abbreviation */
  team: TeamAbbrev;

  /** Games mapped by date (YYYY-MM-DD) */
  gamesByDate: Record<string, Game>;

  /** Total games this week */
  totalGames: number;
}

/** Full week schedule */
export interface WeekSchedule {
  /** Week start date (YYYY-MM-DD) */
  startDate: string;

  /** Week end date (YYYY-MM-DD) */
  endDate: string;

  /** All games in the week */
  games: Game[];

  /** Games organized by team */
  byTeam: Record<TeamAbbrev, TeamWeekSchedule>;
}

/** Check if a team has a game on a specific date */
export function hasGameOnDate(
  schedule: WeekSchedule,
  team: TeamAbbrev,
  date: string
): boolean {
  const teamSchedule = schedule.byTeam[team];
  if (!teamSchedule) return false;
  return date in teamSchedule.gamesByDate;
}

/** Get game for a team on a specific date */
export function getGameOnDate(
  schedule: WeekSchedule,
  team: TeamAbbrev,
  date: string
): Game | undefined {
  return schedule.byTeam[team]?.gamesByDate[date];
}

/** Get all dates in a week where team has games */
export function getTeamGameDates(
  schedule: WeekSchedule,
  team: TeamAbbrev
): string[] {
  const teamSchedule = schedule.byTeam[team];
  if (!teamSchedule) return [];
  return Object.keys(teamSchedule.gamesByDate).sort();
}

/** Check if team has back-to-back games */
export function hasBackToBack(
  schedule: WeekSchedule,
  team: TeamAbbrev
): boolean {
  const dates = getTeamGameDates(schedule, team);
  for (let i = 0; i < dates.length - 1; i++) {
    const current = new Date(dates[i]);
    const next = new Date(dates[i + 1]);
    const diffDays =
      (next.getTime() - current.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      return true;
    }
  }
  return false;
}

/** Get back-to-back game dates for a team (returns second game of each B2B) */
export function getBackToBackDates(
  schedule: WeekSchedule,
  team: TeamAbbrev
): string[] {
  const dates = getTeamGameDates(schedule, team);
  const b2bDates: string[] = [];

  for (let i = 0; i < dates.length - 1; i++) {
    const current = new Date(dates[i]);
    const next = new Date(dates[i + 1]);
    const diffDays =
      (next.getTime() - current.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      b2bDates.push(dates[i + 1]);
    }
  }

  return b2bDates;
}
