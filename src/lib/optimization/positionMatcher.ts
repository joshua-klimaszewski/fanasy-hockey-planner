import {
  Player,
  RosterSlot,
  RosterSlotType,
  PlayerPosition,
  canFillSlot,
  isSkaterPosition,
} from '@/models';

/** Check if a player can fill a specific roster slot */
export function canPlayerFillSlot(player: Player, slot: RosterSlot): boolean {
  return canFillSlot(slot.type, player.positions);
}

/** Get all slots a player is eligible for */
export function getEligibleSlots(
  player: Player,
  slots: RosterSlot[]
): RosterSlot[] {
  return slots.filter((slot) => canPlayerFillSlot(player, slot));
}

/** Get all empty slots a player is eligible for */
export function getAvailableSlots(
  player: Player,
  slots: RosterSlot[]
): RosterSlot[] {
  return getEligibleSlots(player, slots).filter((slot) => !slot.player);
}

/** Find the best slot for a player (most restrictive first) */
export function findBestSlot(
  player: Player,
  slots: RosterSlot[]
): RosterSlot | null {
  const available = getAvailableSlots(player, slots);
  if (available.length === 0) return null;

  // Priority order:
  // 1. Direct position match (C, LW, RW, D, G)
  // 2. Utility (U)
  // 3. Bench (B)
  // 4. IR slots

  // Try direct position match first
  for (const pos of player.positions) {
    const directMatch = available.find((slot) => slot.type === pos);
    if (directMatch) return directMatch;
  }

  // Try utility slot for skaters
  if (player.positions.some((p) => isSkaterPosition(p))) {
    const utilitySlot = available.find((slot) => slot.type === 'U');
    if (utilitySlot) return utilitySlot;
  }

  // Try bench
  const benchSlot = available.find((slot) => slot.type === 'B');
  if (benchSlot) return benchSlot;

  // Try IR
  const irSlot = available.find(
    (slot) => slot.type === 'IR' || slot.type === 'IR+'
  );
  if (irSlot) return irSlot;

  // Return first available as fallback
  return available[0] || null;
}

/** Get position eligibility display string */
export function getEligibilityDisplay(player: Player): string {
  const positions = [...player.positions];

  // Add implicit eligibility
  if (positions.some((p) => isSkaterPosition(p))) {
    if (!positions.includes('U' as PlayerPosition)) {
      positions.push('U' as PlayerPosition);
    }
  }

  return positions.join(', ');
}

/** Find players that can fill a specific slot type */
export function findPlayersForSlot(
  slotType: RosterSlotType,
  players: Player[]
): Player[] {
  return players.filter((player) => canFillSlot(slotType, player.positions));
}

/** Calculate position scarcity score (higher = more scarce) */
export function getPositionScarcity(
  player: Player,
  roster: RosterSlot[]
): number {
  // Count how many slots this player can fill
  const eligibleCount = getEligibleSlots(player, roster).length;

  // Fewer eligible slots = more scarce = higher score
  return 1 / (eligibleCount || 1);
}

/** Sort players by position scarcity (most scarce first) */
export function sortByScarcity(
  players: Player[],
  roster: RosterSlot[]
): Player[] {
  return [...players].sort((a, b) => {
    const scarcityA = getPositionScarcity(a, roster);
    const scarcityB = getPositionScarcity(b, roster);
    return scarcityB - scarcityA;
  });
}
