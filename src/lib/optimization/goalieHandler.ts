import {
  Player,
  WeekSchedule,
  GameIndicator,
  getWeekDates,
  getBackToBackDates,
  hasGameOnDate,
} from '@/models';

/** Information about a goalie's schedule for a single day */
export interface GoalieDayInfo {
  date: string;
  hasGame: boolean;
  isBackToBack: boolean;
  isFirstOfB2B: boolean;
  indicator: GameIndicator;
  opponent?: string;
  isHome?: boolean;
}

/** Full week schedule analysis for a goalie */
export interface GoalieWeekAnalysis {
  player: Player;
  days: GoalieDayInfo[];
  totalGames: number;
  backToBackCount: number;
  likelyStarts: number;
}

/** Check if a player is a goalie */
export function isGoalie(player: Player): boolean {
  return player.positions.includes('G');
}

/** Analyze a goalie's week schedule */
export function analyzeGoalieWeek(
  player: Player,
  schedule: WeekSchedule,
  weekStartDate: string
): GoalieWeekAnalysis {
  if (!isGoalie(player)) {
    throw new Error('Player is not a goalie');
  }

  const dates = getWeekDates(weekStartDate);
  const b2bDates = getBackToBackDates(schedule, player.team);
  const teamSchedule = schedule.byTeam[player.team];

  const days: GoalieDayInfo[] = [];
  let totalGames = 0;
  let backToBackCount = 0;
  let likelyStarts = 0;

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const hasGame = hasGameOnDate(schedule, player.team, date);
    const isBackToBack = b2bDates.includes(date);

    // Check if this is the first game of a B2B (the reliable start)
    const isFirstOfB2B =
      hasGame &&
      i < dates.length - 1 &&
      hasGameOnDate(schedule, player.team, dates[i + 1]) &&
      b2bDates.includes(dates[i + 1]);

    let indicator: GameIndicator = '-';
    let opponent: string | undefined;
    let isHome: boolean | undefined;

    if (hasGame) {
      totalGames++;
      const game = teamSchedule?.gamesByDate[date];

      if (game) {
        isHome = game.homeTeam === player.team;
        opponent = isHome ? game.awayTeam : game.homeTeam;
      }

      if (isBackToBack) {
        // Second game of B2B - uncertain
        indicator = '||';
        backToBackCount++;
      } else if (player.injuryStatus === 'DTD') {
        indicator = '?';
      } else {
        indicator = 'X';
        likelyStarts++;
      }
    }

    days.push({
      date,
      hasGame,
      isBackToBack,
      isFirstOfB2B,
      indicator,
      opponent,
      isHome,
    });
  }

  return {
    player,
    days,
    totalGames,
    backToBackCount,
    likelyStarts,
  };
}

/** Get estimated starts for a goalie (excluding B2B uncertainty) */
export function getEstimatedGoalieStarts(
  player: Player,
  schedule: WeekSchedule,
  weekStartDate: string
): number {
  const analysis = analyzeGoalieWeek(player, schedule, weekStartDate);
  return analysis.likelyStarts;
}

/** Check if team has back-to-back games in a week */
export function teamHasBackToBack(
  schedule: WeekSchedule,
  team: string
): boolean {
  const b2bDates = getBackToBackDates(schedule, team);
  return b2bDates.length > 0;
}

/** Get all back-to-back sets for a team (pairs of consecutive game dates) */
export function getBackToBackSets(
  schedule: WeekSchedule,
  team: string,
  weekStartDate: string
): Array<{ first: string; second: string }> {
  const dates = getWeekDates(weekStartDate);
  const sets: Array<{ first: string; second: string }> = [];

  for (let i = 0; i < dates.length - 1; i++) {
    const currentHasGame = hasGameOnDate(schedule, team, dates[i]);
    const nextHasGame = hasGameOnDate(schedule, team, dates[i + 1]);

    if (currentHasGame && nextHasGame) {
      sets.push({ first: dates[i], second: dates[i + 1] });
    }
  }

  return sets;
}
