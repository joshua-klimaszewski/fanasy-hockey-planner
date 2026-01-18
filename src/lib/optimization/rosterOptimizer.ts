import {
  RosterSlot,
  WeekSchedule,
  GameIndicator,
  getWeekDates,
  hasGameOnDate,
  getBackToBackDates,
  isBenchSlot,
  isIRSlot,
  isStartingSlot,
} from '@/models';
import { calculateWeekCascade, WeekCascadeResult } from './benchCascade';
import { isGoalie } from './goalieHandler';

/** Optimized schedule for a single roster slot */
export interface OptimizedSlotSchedule {
  slot: RosterSlot;
  indicators: GameIndicator[];
  totalGames: number;
  activeGames: number; // Games where player actually starts (X)
}

/** Full optimized roster analysis */
export interface OptimizedRoster {
  slots: OptimizedSlotSchedule[];
  cascadeResult: WeekCascadeResult;
  summary: RosterSummary;
}

/** Summary statistics for the roster */
export interface RosterSummary {
  totalGames: number;
  startingGames: number;
  benchVirtualStarts: number;
  benchConflicts: number;
  goalieStarts: number;
  goalieB2BUncertain: number;
}

/** Calculate optimized roster schedule for the week */
export function optimizeRoster(
  roster: RosterSlot[],
  schedule: WeekSchedule,
  weekStartDate: string
): OptimizedRoster {
  const dates = getWeekDates(weekStartDate);

  // Calculate bench cascade
  const cascadeResult = calculateWeekCascade(roster, schedule, weekStartDate);

  // Build optimized slot schedules
  const slots: OptimizedSlotSchedule[] = [];
  let totalGames = 0;
  let startingGames = 0;
  let benchVirtualStarts = 0;
  let benchConflicts = 0;
  let goalieStarts = 0;
  let goalieB2BUncertain = 0;

  for (const slot of roster) {
    const indicators: GameIndicator[] = [];
    let slotTotalGames = 0;
    let slotActiveGames = 0;

    if (!slot.player) {
      // Empty slot - all dashes
      for (let i = 0; i < 7; i++) {
        indicators.push('-');
      }
    } else {
      const player = slot.player;
      const b2bDates = getBackToBackDates(schedule, player.team);

      for (let dayIndex = 0; dayIndex < dates.length; dayIndex++) {
        const date = dates[dayIndex];
        const hasGame = hasGameOnDate(schedule, player.team, date);

        if (!hasGame) {
          indicators.push('-');
          continue;
        }

        slotTotalGames++;

        // Handle different slot types
        if (isIRSlot(slot)) {
          // IR players don't start
          indicators.push('-');
        } else if (isBenchSlot(slot)) {
          // Use cascade result for bench
          const cascadeIndicators = cascadeResult.slotIndicators.get(slot.id);
          const indicator = cascadeIndicators?.[dayIndex] || '-';
          indicators.push(indicator);

          if (indicator === 'X') {
            slotActiveGames++;
            benchVirtualStarts++;
          } else if (indicator === 'O') {
            benchConflicts++;
          }
        } else {
          // Starting slot
          const isB2B = b2bDates.includes(date);

          if (isGoalie(player) && isB2B) {
            indicators.push('||');
            goalieB2BUncertain++;
          } else if (player.injuryStatus === 'DTD') {
            indicators.push('?');
            slotActiveGames++; // Count uncertain as potential start
          } else {
            indicators.push('X');
            slotActiveGames++;
            startingGames++;

            if (isGoalie(player)) {
              goalieStarts++;
            }
          }
        }
      }
    }

    totalGames += slotTotalGames;

    slots.push({
      slot,
      indicators,
      totalGames: slotTotalGames,
      activeGames: slotActiveGames,
    });
  }

  const summary: RosterSummary = {
    totalGames,
    startingGames,
    benchVirtualStarts,
    benchConflicts,
    goalieStarts,
    goalieB2BUncertain,
  };

  return {
    slots,
    cascadeResult,
    summary,
  };
}

/** Get game counts per day for the roster */
export function getGamesPerDay(
  optimizedRoster: OptimizedRoster
): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0];

  for (const slotSchedule of optimizedRoster.slots) {
    // Skip IR slots
    if (isIRSlot(slotSchedule.slot)) continue;

    for (let i = 0; i < 7; i++) {
      const indicator = slotSchedule.indicators[i];
      if (indicator === 'X' || indicator === '||' || indicator === '?') {
        counts[i]++;
      }
    }
  }

  return counts;
}

/** Get maximum games per position type per day */
export function getMaxGamesPerPosition(
  roster: RosterSlot[]
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const slot of roster) {
    if (!isStartingSlot(slot)) continue;
    counts[slot.type] = (counts[slot.type] || 0) + 1;
  }

  return counts;
}

/** Calculate efficiency score (0-100) */
export function calculateEfficiency(summary: RosterSummary): number {
  const totalPossible = summary.startingGames + summary.benchVirtualStarts + summary.benchConflicts;
  if (totalPossible === 0) return 100;

  const actual = summary.startingGames + summary.benchVirtualStarts;
  return Math.round((actual / totalPossible) * 100);
}
