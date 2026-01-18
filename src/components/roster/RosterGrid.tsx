import {
  Week,
  WEEKDAYS,
  getWeekDates,
  RosterSlot,
  GameIndicator,
  createRosterSlot,
  createPlayer,
  DEFAULT_ROSTER_CONFIG,
  isBenchSlot,
  isIRSlot,
  hasGameOnDate,
} from '@/models';
import { useWeekSchedule } from '@/api/hooks/useSchedule';
import { analyzeGoalieWeek } from '@/lib/optimization/goalieHandler';
import RosterRow from './RosterRow';

interface RosterGridProps {
  week: Week;
}

// Mock data for initial development
const mockPlayers = [
  createPlayer({
    id: '1',
    name: 'Connor McDavid',
    positions: ['C'],
    team: 'EDM',
  }),
  createPlayer({
    id: '2',
    name: 'Artemi Panarin',
    positions: ['LW'],
    team: 'NYR',
  }),
  createPlayer({
    id: '3',
    name: 'Mikko Rantanen',
    positions: ['RW'],
    team: 'COL',
  }),
  createPlayer({
    id: '4',
    name: 'Cale Makar',
    positions: ['D'],
    team: 'COL',
  }),
  createPlayer({
    id: '5',
    name: 'Igor Shesterkin',
    positions: ['G'],
    team: 'NYR',
  }),
];

// Generate mock roster slots
function generateMockRoster(): RosterSlot[] {
  const slots: RosterSlot[] = [];
  let playerIndex = 0;

  const addSlots = (type: string, count: number) => {
    for (let i = 1; i <= count; i++) {
      const player =
        playerIndex < mockPlayers.length ? mockPlayers[playerIndex++] : null;
      slots.push(
        createRosterSlot(type as RosterSlot['type'], i, player)
      );
    }
  };

  addSlots('C', DEFAULT_ROSTER_CONFIG.C);
  addSlots('LW', DEFAULT_ROSTER_CONFIG.LW);
  addSlots('RW', DEFAULT_ROSTER_CONFIG.RW);
  addSlots('D', DEFAULT_ROSTER_CONFIG.D);
  addSlots('U', DEFAULT_ROSTER_CONFIG.U);
  addSlots('G', DEFAULT_ROSTER_CONFIG.G);
  addSlots('B', DEFAULT_ROSTER_CONFIG.B);
  addSlots('IR', DEFAULT_ROSTER_CONFIG.IR);
  addSlots('IR+', DEFAULT_ROSTER_CONFIG['IR+']);

  return slots;
}

export default function RosterGrid({ week }: RosterGridProps) {
  const dates = getWeekDates(week.startDate);
  const roster = generateMockRoster();

  // Fetch real NHL schedule data
  const { data: schedule, isLoading, error } = useWeekSchedule(week.startDate);

  // Generate game indicators based on real schedule data
  const getGameIndicators = (slot: RosterSlot): GameIndicator[] => {
    if (!slot.player || !schedule) {
      return ['-', '-', '-', '-', '-', '-', '-'];
    }

    // For goalies, use the goalie handler
    if (slot.player.positions.includes('G')) {
      const analysis = analyzeGoalieWeek(slot.player, schedule, week.startDate);
      return analysis.days.map((day) => day.indicator);
    }

    // For skaters, check if they have games on each day
    return dates.map((date) => {
      const hasGame = hasGameOnDate(schedule, slot.player!.team, date);
      if (!hasGame) return '-';

      // For starters, show X
      if (!isBenchSlot(slot)) {
        return 'X';
      }

      // For bench players, show X for now (bench cascade will add O later)
      return 'X';
    });
  };

  // Group slots by category
  const starters = roster.filter((s) => !isBenchSlot(s) && !isIRSlot(s));
  const bench = roster.filter((s) => isBenchSlot(s));
  const ir = roster.filter((s) => isIRSlot(s));

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400">Loading schedule...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-red-400">
            Error loading schedule: {error.message}
          </div>
        </div>
      </div>
    );
  }

  const renderSection = (title: string, slots: RosterSlot[]) => (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide px-1">
        {title}
      </h3>
      {slots.map((slot) => {
        const indicators = getGameIndicators(slot);
        const totalGames = indicators.filter((i) => i !== '-').length;
        return (
          <RosterRow
            key={slot.id}
            slot={slot}
            gameIndicators={indicators}
            totalGames={totalGames}
          />
        );
      })}
    </div>
  );

  return (
    <div className="bg-slate-800 rounded-lg p-4 overflow-x-auto">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-700 mb-3">
        <div className="w-12" /> {/* Position column */}
        <div className="min-w-[180px]" /> {/* Player column */}
        <div className="flex gap-1">
          {WEEKDAYS.map((day, index) => (
            <div
              key={day}
              className="w-10 h-8 flex flex-col items-center justify-center text-xs"
            >
              <span className="font-medium text-slate-300">{day}</span>
              <span className="text-slate-500">
                {new Date(dates[index]).getDate()}
              </span>
            </div>
          ))}
        </div>
        <div className="w-10 text-center text-xs font-medium text-slate-400">
          GP
        </div>
      </div>

      {/* Roster sections */}
      <div className="space-y-4">
        {renderSection('Starting Lineup', starters)}
        {renderSection('Bench', bench)}
        {renderSection('Injured Reserve', ir)}
      </div>
    </div>
  );
}
