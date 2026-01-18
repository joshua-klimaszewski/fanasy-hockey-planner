import { PlayerPosition } from './Position';

/** Player injury status */
export type InjuryStatus = 'Healthy' | 'DTD' | 'O' | 'IR' | 'IR+' | 'NA';

/** NHL team abbreviation */
export type TeamAbbrev = string;

/** Player model */
export interface Player {
  /** Unique identifier (from Yahoo/Fantrax) */
  id: string;

  /** Player's full name */
  name: string;

  /** Player's eligible positions */
  positions: PlayerPosition[];

  /** NHL team abbreviation (e.g., 'TOR', 'NYR') */
  team: TeamAbbrev;

  /** Current injury status */
  injuryStatus: InjuryStatus;

  /** Injury details if applicable */
  injuryNote?: string;

  /** Yahoo player key (e.g., 'nhl.p.12345') */
  yahooKey?: string;

  /** Fantrax player ID */
  fantraxId?: string;

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

/** Check if player is a goalie */
export function isGoalie(player: Player): boolean {
  return player.positions.includes('G');
}

/** Check if player is a skater */
export function isSkater(player: Player): boolean {
  return player.positions.some((pos) => pos !== 'G');
}

/** Get player's primary position (first in list) */
export function getPrimaryPosition(player: Player): PlayerPosition | undefined {
  return player.positions[0];
}

/** Format player positions as string (e.g., "C, LW") */
export function formatPositions(player: Player): string {
  return player.positions.join(', ');
}
