import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Week,
  Player,
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

/** Auth state */
interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  userName: string | null;
}

/** App state */
interface AppState {
  // Auth
  auth: AuthState;

  // Week selection
  selectedWeek: Week;

  // Roster configuration
  rosterConfig: RosterConfig;

  // Current roster (with player assignments)
  roster: RosterSlot[];

  // Available players (from Yahoo/mock)
  availablePlayers: Player[];

  // Bench priority order (slot IDs in priority order)
  benchPriority: string[];

  // Selected league (from Yahoo)
  selectedLeagueKey: string | null;

  // Actions
  setAuth: (auth: Partial<AuthState>) => void;
  clearAuth: () => void;
  setSelectedWeek: (week: Week) => void;
  setRosterConfig: (config: RosterConfig) => void;
  assignPlayer: (playerId: string, slotId: string) => void;
  unassignPlayer: (slotId: string) => void;
  setAvailablePlayers: (players: Player[]) => void;
  setBenchPriority: (priority: string[]) => void;
  setSelectedLeague: (leagueKey: string | null) => void;
  resetRoster: () => void;
}

const initialAuthState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  userName: null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      auth: initialAuthState,
      selectedWeek: getCurrentWeek(),
      rosterConfig: DEFAULT_ROSTER_CONFIG,
      roster: generateEmptyRoster(DEFAULT_ROSTER_CONFIG),
      availablePlayers: [],
      benchPriority: [],
      selectedLeagueKey: null,

      // Actions
      setAuth: (authUpdate) =>
        set((state) => ({
          auth: { ...state.auth, ...authUpdate },
        })),

      clearAuth: () =>
        set({
          auth: initialAuthState,
          selectedLeagueKey: null,
        }),

      setSelectedWeek: (week) => set({ selectedWeek: week }),

      setRosterConfig: (config) =>
        set({
          rosterConfig: config,
          roster: generateEmptyRoster(config),
          benchPriority: [],
        }),

      assignPlayer: (playerId, slotId) =>
        set((state) => {
          const player = state.availablePlayers.find((p) => p.id === playerId);
          if (!player) return state;

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

      setAvailablePlayers: (players) => set({ availablePlayers: players }),

      setBenchPriority: (priority) => set({ benchPriority: priority }),

      setSelectedLeague: (leagueKey) => set({ selectedLeagueKey: leagueKey }),

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
        selectedLeagueKey: state.selectedLeagueKey,
        // Don't persist auth tokens or available players
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
