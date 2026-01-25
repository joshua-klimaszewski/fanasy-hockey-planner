import { PlayerPosition } from './Position';

/** Player injury status */
export type InjuryStatus = 'Healthy' | 'DTD' | 'O' | 'IR' | 'IR+' | 'NA';

/** NHL team abbreviation */
export type TeamAbbrev = string;

/** Player model */
export interface Player {
  /** Unique identifier */
  id: string;

  /** Player's full name */
  name: string;

  /** Player's eligible positions (default from API) */
  positions: PlayerPosition[];

  /** User-set dual eligibility (overrides positions if set) */
  customPositions?: PlayerPosition[];

  /** NHL team abbreviation (e.g., 'TOR', 'NYR') */
  team: TeamAbbrev;

  /** Current injury status */
  injuryStatus: InjuryStatus;

  /** Injury details if applicable */
  injuryNote?: string;

  /** NHL API player ID */
  nhlId?: number;

  /** Player headshot URL */
  imageUrl?: string;
}

/** Create a player with default values */
export function createPlayer(partial: Partial<Player> & { id: string; name: string; team: TeamAbbrev }): Player {
  return {
    positions: [],
    injuryStatus: 'Healthy',
    ...partial,
  };
}

/** Get effective positions for a player (customPositions overrides positions) */
export function getEffectivePositions(player: Player): PlayerPosition[] {
  return player.customPositions ?? player.positions;
}

/** Check if player is a goalie */
export function isGoalie(player: Player): boolean {
  return getEffectivePositions(player).includes('G');
}

/** Check if player is a skater */
export function isSkater(player: Player): boolean {
  return getEffectivePositions(player).some((pos) => pos !== 'G');
}

/** Get player's primary position (first in list) */
export function getPrimaryPosition(player: Player): PlayerPosition | undefined {
  return getEffectivePositions(player)[0];
}

/** Format player positions as string (e.g., "C/LW") */
export function formatPositions(player: Player): string {
  return getEffectivePositions(player).join('/');
}

/** Check if player has custom positions set */
export function hasCustomPositions(player: Player): boolean {
  return player.customPositions !== undefined && player.customPositions.length > 0;
}
