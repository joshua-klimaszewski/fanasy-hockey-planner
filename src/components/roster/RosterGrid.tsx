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
} from '@/models';
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

// Generate mock game indicators
function getMockGameIndicators(slot: RosterSlot): GameIndicator[] {
  if (!slot.player) {
    return ['-', '-', '-', '-', '-', '-', '-'];
  }

  // Random game schedule for demo
  const hasGame = [
    Math.random() > 0.5,
    Math.random() > 0.6,
    Math.random() > 0.5,
    Math.random() > 0.6,
    Math.random() > 0.5,
    Math.random() > 0.4,
    Math.random() > 0.5,
  ];

  return hasGame.map((game, index) => {
    if (!game) return '-';

    // If bench player
    if (isBenchSlot(slot)) {
      // Random conflict
      return Math.random() > 0.3 ? 'X' : 'O';
    }

    // If goalie, check for back-to-back
    if (slot.type === 'G' && index > 0 && hasGame[index - 1]) {
      return '||';
    }

    return 'X';
  });
}

export default function RosterGrid({ week }: RosterGridProps) {
  const dates = getWeekDates(week.startDate);
  const roster = generateMockRoster();

  // Group slots by category
  const starters = roster.filter((s) => !isBenchSlot(s) && !isIRSlot(s));
  const bench = roster.filter((s) => isBenchSlot(s));
  const ir = roster.filter((s) => isIRSlot(s));

  const renderSection = (title: string, slots: RosterSlot[]) => (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide px-1">
        {title}
      </h3>
      {slots.map((slot) => {
        const indicators = getMockGameIndicators(slot);
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
