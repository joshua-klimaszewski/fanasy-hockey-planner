import {
  Player,
  RosterSlot,
  WeekSchedule,
  GameIndicator,
  getWeekDates,
  hasGameOnDate,
  isBenchSlot,
  isStartingSlot,
  canFillSlot,
} from '@/models';

/** Result of cascade calculation for a single day */
export interface DayCascadeResult {
  date: string;
  /** Starting slots with no game that day (available for bench fill-in) */
  openSlots: RosterSlot[];
  /** Bench players claiming open slots, in priority order */
  benchClaims: Array<{
    benchSlot: RosterSlot;
    targetSlot: RosterSlot;
    player: Player;
  }>;
  /** Bench players with games but no available slot (conflicts) */
  conflicts: Array<{
    benchSlot: RosterSlot;
    player: Player;
  }>;
}

/** Full week cascade analysis */
export interface WeekCascadeResult {
  days: DayCascadeResult[];
  /** Updated indicators for each slot, by slot ID */
  slotIndicators: Map<string, GameIndicator[]>;
  /** Total virtual starts gained from bench */
  virtualStarts: number;
  /** Total conflicts (bench games missed) */
  totalConflicts: number;
}

/** Get open starting slots for a specific day (slots where player has no game) */
function getOpenSlotsForDay(
  startingSlots: RosterSlot[],
  schedule: WeekSchedule,
  date: string
): RosterSlot[] {
  return startingSlots.filter((slot) => {
    if (!slot.player) return true; // Empty slot is open
    return !hasGameOnDate(schedule, slot.player.team, date);
  });
}

/** Check if a bench player can fill an open slot */
function canBenchFillSlot(benchPlayer: Player, openSlot: RosterSlot): boolean {
  // If slot is empty, check position compatibility
  if (!openSlot.player) {
    return canFillSlot(openSlot.type, benchPlayer.positions);
  }

  // If slot has player without game, bench must match the slot type
  return canFillSlot(openSlot.type, benchPlayer.positions);
}

/** Process bench cascade for a single day */
function processDayCascade(
  benchSlots: RosterSlot[],
  startingSlots: RosterSlot[],
  schedule: WeekSchedule,
  date: string
): DayCascadeResult {
  const openSlots = getOpenSlotsForDay(startingSlots, schedule, date);
  const claimedSlots = new Set<string>();
  const benchClaims: DayCascadeResult['benchClaims'] = [];
  const conflicts: DayCascadeResult['conflicts'] = [];

  // Process bench in priority order (B1, B2, B3...)
  // Slots are already sorted by order
  for (const benchSlot of benchSlots) {
    if (!benchSlot.player) continue;

    const hasGame = hasGameOnDate(schedule, benchSlot.player.team, date);
    if (!hasGame) continue;

    // Find an available open slot this bench player can fill
    const availableSlot = openSlots.find(
      (slot) =>
        !claimedSlots.has(slot.id) &&
        canBenchFillSlot(benchSlot.player!, slot)
    );

    if (availableSlot) {
      claimedSlots.add(availableSlot.id);
      benchClaims.push({
        benchSlot,
        targetSlot: availableSlot,
        player: benchSlot.player,
      });
    } else {
      // No slot available - conflict
      conflicts.push({
        benchSlot,
        player: benchSlot.player,
      });
    }
  }

  return {
    date,
    openSlots,
    benchClaims,
    conflicts,
  };
}

/** Calculate bench cascade for an entire week */
export function calculateWeekCascade(
  roster: RosterSlot[],
  schedule: WeekSchedule,
  weekStartDate: string
): WeekCascadeResult {
  const dates = getWeekDates(weekStartDate);
  const startingSlots = roster.filter(isStartingSlot);
  const benchSlots = roster.filter(isBenchSlot).sort((a, b) => a.order - b.order);

  const days: DayCascadeResult[] = [];
  const slotIndicators = new Map<string, GameIndicator[]>();
  let virtualStarts = 0;
  let totalConflicts = 0;

  // Initialize indicators for all slots
  for (const slot of roster) {
    slotIndicators.set(slot.id, []);
  }

  // Process each day
  for (let dayIndex = 0; dayIndex < dates.length; dayIndex++) {
    const date = dates[dayIndex];
    const dayResult = processDayCascade(benchSlots, startingSlots, schedule, date);
    days.push(dayResult);

    // Update indicators for starting slots
    for (const slot of startingSlots) {
      const indicators = slotIndicators.get(slot.id)!;

      if (!slot.player) {
        indicators.push('-');
        continue;
      }

      const hasGame = hasGameOnDate(schedule, slot.player.team, date);
      if (hasGame) {
        indicators.push('X');
      } else {
        indicators.push('-');
      }
    }

    // Update indicators for bench slots
    for (const benchSlot of benchSlots) {
      const indicators = slotIndicators.get(benchSlot.id)!;

      if (!benchSlot.player) {
        indicators.push('-');
        continue;
      }

      const hasGame = hasGameOnDate(schedule, benchSlot.player.team, date);
      if (!hasGame) {
        indicators.push('-');
        continue;
      }

      // Check if this bench player claimed a slot
      const claim = dayResult.benchClaims.find(
        (c) => c.benchSlot.id === benchSlot.id
      );
      if (claim) {
        indicators.push('X');
        virtualStarts++;
      } else {
        indicators.push('O');
        totalConflicts++;
      }
    }
  }

  return {
    days,
    slotIndicators,
    virtualStarts,
    totalConflicts,
  };
}

/** Get the cascade status for a specific bench slot on a specific day */
export function getBenchSlotStatus(
  cascadeResult: WeekCascadeResult,
  slotId: string,
  dayIndex: number
): 'starting' | 'conflict' | 'no-game' {
  const indicators = cascadeResult.slotIndicators.get(slotId);
  if (!indicators || dayIndex >= indicators.length) {
    return 'no-game';
  }

  switch (indicators[dayIndex]) {
    case 'X':
      return 'starting';
    case 'O':
      return 'conflict';
    default:
      return 'no-game';
  }
}

/** Summarize cascade results */
export interface CascadeSummary {
  totalBenchGames: number;
  virtualStarts: number;
  conflicts: number;
  utilizationRate: number; // virtualStarts / totalBenchGames
}

export function getCascadeSummary(
  cascadeResult: WeekCascadeResult
): CascadeSummary {
  const totalBenchGames =
    cascadeResult.virtualStarts + cascadeResult.totalConflicts;
  const utilizationRate =
    totalBenchGames > 0 ? cascadeResult.virtualStarts / totalBenchGames : 0;

  return {
    totalBenchGames,
    virtualStarts: cascadeResult.virtualStarts,
    conflicts: cascadeResult.totalConflicts,
    utilizationRate,
  };
}
