import {
  Player,
  RosterSlot,
  WeekSchedule,
  GameIndicator,
  getWeekDates,
  hasGameOnDate,
  getBackToBackDates,
} from '@/models';

export interface PlayerGameInfo {
  date: string;
  hasGame: boolean;
  indicator: GameIndicator;
  opponent?: string;
  isHome?: boolean;
  isBackToBack?: boolean;
}

export interface SlotWeekSchedule {
  slot: RosterSlot;
  games: PlayerGameInfo[];
  totalGames: number;
}

/** Get game information for a player across a week */
export function getPlayerWeekGames(
  player: Player,
  schedule: WeekSchedule,
  weekStartDate: string
): PlayerGameInfo[] {
  const dates = getWeekDates(weekStartDate);
  const b2bDates = getBackToBackDates(schedule, player.team);

  return dates.map((date) => {
    const hasGame = hasGameOnDate(schedule, player.team, date);
    const game = schedule.byTeam[player.team]?.gamesByDate[date];
    const isBackToBack = b2bDates.includes(date);

    if (!hasGame) {
      return {
        date,
        hasGame: false,
        indicator: '-' as GameIndicator,
      };
    }

    const isHome = game?.homeTeam === player.team;
    const opponent = isHome ? game?.awayTeam : game?.homeTeam;

    // Default indicator for a game (will be modified by optimizer)
    let indicator: GameIndicator = 'X';

    // Goalie back-to-back uncertainty
    if (player.positions.includes('G') && isBackToBack) {
      indicator = '||';
    }

    // Injury uncertainty
    if (player.injuryStatus === 'DTD') {
      indicator = '?';
    }

    return {
      date,
      hasGame: true,
      indicator,
      opponent,
      isHome,
      isBackToBack,
    };
  });
}

/** Get schedule for a roster slot */
export function getSlotWeekSchedule(
  slot: RosterSlot,
  schedule: WeekSchedule,
  weekStartDate: string
): SlotWeekSchedule {
  if (!slot.player) {
    const dates = getWeekDates(weekStartDate);
    return {
      slot,
      games: dates.map((date) => ({
        date,
        hasGame: false,
        indicator: '-' as GameIndicator,
      })),
      totalGames: 0,
    };
  }

  const games = getPlayerWeekGames(slot.player, schedule, weekStartDate);
  const totalGames = games.filter((g) => g.hasGame).length;

  return {
    slot,
    games,
    totalGames,
  };
}

/** Count total games for a roster across the week */
export function countRosterGames(
  roster: RosterSlot[],
  schedule: WeekSchedule,
  weekStartDate: string
): number {
  return roster.reduce((total, slot) => {
    if (!slot.player) return total;
    const slotSchedule = getSlotWeekSchedule(slot, schedule, weekStartDate);
    return total + slotSchedule.totalGames;
  }, 0);
}

/** Count games per day for starting slots */
export function getStartingGamesPerDay(
  startingSlots: RosterSlot[],
  schedule: WeekSchedule,
  weekStartDate: string
): number[] {
  const dates = getWeekDates(weekStartDate);

  return dates.map((date) => {
    return startingSlots.reduce((count, slot) => {
      if (!slot.player) return count;
      if (hasGameOnDate(schedule, slot.player.team, date)) {
        return count + 1;
      }
      return count;
    }, 0);
  });
}
