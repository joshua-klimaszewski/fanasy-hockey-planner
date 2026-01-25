import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Week,
  Player,
  PlayerPosition,
  RosterSlot,
  RosterConfig,
  DEFAULT_ROSTER_CONFIG,
  createRosterSlot,
} from '@/models';
import { getCurrentWeek } from '@/lib/schedule';

/** Generate empty roster slots from config */
function generateEmptyRoster(config: RosterConfig): RosterSlot[] {
  const slots: RosterSlot[] = [];
  const slotTypes: (keyof RosterConfig)[] = [
    'C',
    'LW',
    'RW',
    'D',
    'U',
    'G',
    'B',
    'IR',
    'IR+',
  ];

  for (const type of slotTypes) {
    const count = config[type];
    for (let i = 1; i <= count; i++) {
      slots.push(createRosterSlot(type, i));
    }
  }

  return slots;
}

/** Custom position overrides stored separately */
interface PositionOverrides {
  [playerId: string]: PlayerPosition[];
}

/** App state */
interface AppState {
  // Week selection
  selectedWeek: Week;

  // Roster configuration
  rosterConfig: RosterConfig;

  // Current roster (with player assignments)
  roster: RosterSlot[];

  // Available players (from NHL API)
  availablePlayers: Player[];

  // Custom position overrides (persisted separately from player data)
  positionOverrides: PositionOverrides;

  // Bench priority order (slot IDs in priority order)
  benchPriority: string[];

  // Actions
  setSelectedWeek: (week: Week) => void;
  setRosterConfig: (config: RosterConfig) => void;
  assignPlayer: (playerId: string, slotId: string) => void;
  unassignPlayer: (slotId: string) => void;
  setAvailablePlayers: (players: Player[]) => void;
  updatePlayerPositions: (playerId: string, positions: PlayerPosition[]) => void;
  clearPlayerPositions: (playerId: string) => void;
  setBenchPriority: (priority: string[]) => void;
  resetRoster: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      selectedWeek: getCurrentWeek(),
      rosterConfig: DEFAULT_ROSTER_CONFIG,
      roster: generateEmptyRoster(DEFAULT_ROSTER_CONFIG),
      availablePlayers: [],
      positionOverrides: {},
      benchPriority: [],

      // Actions
      setSelectedWeek: (week) => set({ selectedWeek: week }),

      setRosterConfig: (config) =>
        set({
          rosterConfig: config,
          roster: generateEmptyRoster(config),
          benchPriority: [],
        }),

      assignPlayer: (playerId, slotId) =>
        set((state) => {
          // Find player from available players, applying any position overrides
          const basePlayer = state.availablePlayers.find((p) => p.id === playerId);
          if (!basePlayer) return state;

          // Apply position override if exists
          const customPositions = state.positionOverrides[playerId];
          const player: Player = customPositions
            ? { ...basePlayer, customPositions }
            : basePlayer;

          // Remove player from any existing slot
          const newRoster = state.roster.map((slot) => {
            if (slot.player?.id === playerId) {
              return { ...slot, player: null };
            }
            return slot;
          });

          // Assign to new slot
          const updatedRoster = newRoster.map((slot) => {
            if (slot.id === slotId) {
              return { ...slot, player };
            }
            return slot;
          });

          return { roster: updatedRoster };
        }),

      unassignPlayer: (slotId) =>
        set((state) => ({
          roster: state.roster.map((slot) =>
            slot.id === slotId ? { ...slot, player: null } : slot
          ),
        })),

      setAvailablePlayers: (players) =>
        set((state) => {
          // Apply existing position overrides to new players
          const playersWithOverrides = players.map((player) => {
            const customPositions = state.positionOverrides[player.id];
            return customPositions ? { ...player, customPositions } : player;
          });
          return { availablePlayers: playersWithOverrides };
        }),

      updatePlayerPositions: (playerId, positions) =>
        set((state) => {
          const newOverrides = {
            ...state.positionOverrides,
            [playerId]: positions,
          };

          // Update in available players
          const updatedAvailable = state.availablePlayers.map((player) =>
            player.id === playerId
              ? { ...player, customPositions: positions }
              : player
          );

          // Update in roster slots
          const updatedRoster = state.roster.map((slot) =>
            slot.player?.id === playerId
              ? { ...slot, player: { ...slot.player, customPositions: positions } }
              : slot
          );

          return {
            positionOverrides: newOverrides,
            availablePlayers: updatedAvailable,
            roster: updatedRoster,
          };
        }),

      clearPlayerPositions: (playerId) =>
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [playerId]: _removed, ...newOverrides } = state.positionOverrides;

          // Update in available players
          const updatedAvailable = state.availablePlayers.map((player) =>
            player.id === playerId
              ? { ...player, customPositions: undefined }
              : player
          );

          // Update in roster slots
          const updatedRoster = state.roster.map((slot) =>
            slot.player?.id === playerId
              ? { ...slot, player: { ...slot.player, customPositions: undefined } }
              : slot
          );

          return {
            positionOverrides: newOverrides,
            availablePlayers: updatedAvailable,
            roster: updatedRoster,
          };
        }),

      setBenchPriority: (priority) => set({ benchPriority: priority }),

      resetRoster: () =>
        set((state) => ({
          roster: generateEmptyRoster(state.rosterConfig),
          benchPriority: [],
        })),
    }),
    {
      name: 'fantasy-hockey-planner',
      partialize: (state) => ({
        // Only persist these fields
        rosterConfig: state.rosterConfig,
        roster: state.roster,
        benchPriority: state.benchPriority,
        positionOverrides: state.positionOverrides,
        // Don't persist available players (fetched fresh from API)
      }),
    }
  )
);

/** Selector for starting slots */
export const selectStartingSlots = (state: AppState): RosterSlot[] =>
  state.roster.filter(
    (slot) => slot.type !== 'B' && slot.type !== 'IR' && slot.type !== 'IR+'
  );

/** Selector for bench slots */
export const selectBenchSlots = (state: AppState): RosterSlot[] =>
  state.roster.filter((slot) => slot.type === 'B');

/** Selector for IR slots */
export const selectIRSlots = (state: AppState): RosterSlot[] =>
  state.roster.filter((slot) => slot.type === 'IR' || slot.type === 'IR+');

/** Selector for assigned player IDs */
export const selectAssignedPlayerIds = (state: AppState): Set<string> =>
  new Set(state.roster.filter((s) => s.player).map((s) => s.player!.id));

/** Selector for unassigned players */
export const selectUnassignedPlayers = (state: AppState): Player[] => {
  const assignedIds = selectAssignedPlayerIds(state);
  return state.availablePlayers.filter((p) => !assignedIds.has(p.id));
};
