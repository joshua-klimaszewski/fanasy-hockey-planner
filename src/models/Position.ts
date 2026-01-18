/** Skater positions */
export type SkaterPosition = 'C' | 'LW' | 'RW' | 'D';

/** Goalie position */
export type GoaliePosition = 'G';

/** Utility position - accepts any skater */
export type UtilityPosition = 'U';

/** Bench position */
export type BenchPosition = 'B';

/** Injured reserve */
export type InjuredReserve = 'IR' | 'IR+';

/** All roster slot types */
export type RosterSlotType =
  | SkaterPosition
  | GoaliePosition
  | UtilityPosition
  | BenchPosition
  | InjuredReserve;

/** Player's eligible positions (e.g., ['C', 'LW'] for dual-eligible) */
export type PlayerPosition = SkaterPosition | GoaliePosition;

/** All skater positions for utility slot eligibility */
export const SKATER_POSITIONS: SkaterPosition[] = ['C', 'LW', 'RW', 'D'];

/** Forward positions */
export const FORWARD_POSITIONS: SkaterPosition[] = ['C', 'LW', 'RW'];

/** Check if a position is a skater position */
export function isSkaterPosition(
  position: RosterSlotType
): position is SkaterPosition {
  return SKATER_POSITIONS.includes(position as SkaterPosition);
}

/** Check if a position is a goalie position */
export function isGoaliePosition(
  position: RosterSlotType
): position is GoaliePosition {
  return position === 'G';
}

/** Check if a position can hold a player with given positions */
export function canFillSlot(
  slotType: RosterSlotType,
  playerPositions: PlayerPosition[]
): boolean {
  // Bench and IR can hold anyone
  if (slotType === 'B' || slotType === 'IR' || slotType === 'IR+') {
    return true;
  }

  // Utility accepts any skater
  if (slotType === 'U') {
    return playerPositions.some((pos) => isSkaterPosition(pos));
  }

  // Direct position match
  return playerPositions.includes(slotType as PlayerPosition);
}

/** Default roster configuration */
export interface RosterConfig {
  C: number;
  LW: number;
  RW: number;
  D: number;
  G: number;
  U: number;
  B: number;
  IR: number;
  'IR+': number;
}

export const DEFAULT_ROSTER_CONFIG: RosterConfig = {
  C: 2,
  LW: 2,
  RW: 2,
  D: 4,
  G: 2,
  U: 2,
  B: 4,
  IR: 1,
  'IR+': 1,
};
