import { Player } from './Player';
import { RosterSlotType } from './Position';

/** A roster slot that can hold a player */
export interface RosterSlot {
  /** Unique identifier for this slot */
  id: string;

  /** The position type of this slot */
  type: RosterSlotType;

  /** The player assigned to this slot (if any) */
  player: Player | null;

  /** Display order for this slot (e.g., B1, B2, B3) */
  order: number;
}

/** Create a roster slot */
export function createRosterSlot(
  type: RosterSlotType,
  order: number,
  player: Player | null = null
): RosterSlot {
  return {
    id: `${type}${order}`,
    type,
    order,
    player,
  };
}

/** Generate all roster slots based on configuration */
export function generateRosterSlots(config: Record<RosterSlotType, number>): RosterSlot[] {
  const slots: RosterSlot[] = [];
  const slotOrder: RosterSlotType[] = ['C', 'LW', 'RW', 'D', 'U', 'G', 'B', 'IR', 'IR+'];

  for (const type of slotOrder) {
    const count = config[type] || 0;
    for (let i = 1; i <= count; i++) {
      slots.push(createRosterSlot(type, i));
    }
  }

  return slots;
}

/** Get display label for a roster slot (e.g., "C1", "B2") */
export function getSlotLabel(slot: RosterSlot): string {
  // For single positions, don't show the number
  if (slot.order === 1) {
    return slot.type;
  }
  return `${slot.type}${slot.order}`;
}

/** Check if slot is a bench slot */
export function isBenchSlot(slot: RosterSlot): boolean {
  return slot.type === 'B';
}

/** Check if slot is an IR slot */
export function isIRSlot(slot: RosterSlot): boolean {
  return slot.type === 'IR' || slot.type === 'IR+';
}

/** Check if slot is a starting (non-bench, non-IR) slot */
export function isStartingSlot(slot: RosterSlot): boolean {
  return !isBenchSlot(slot) && !isIRSlot(slot);
}
