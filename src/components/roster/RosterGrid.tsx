import { useEffect } from 'react';
import {
  Week,
  WEEKDAYS,
  getWeekDates,
  RosterSlot,
  GameIndicator,
  isBenchSlot,
  isIRSlot,
  hasGameOnDate,
  getEffectivePositions,
} from '@/models';
import { useWeekSchedule, useAllPlayers } from '@/api/hooks';
import { useAppStore } from '@/store/store';
import { analyzeGoalieWeek } from '@/lib/optimization/goalieHandler';
import RosterRow from './RosterRow';

interface RosterGridProps {
  week: Week;
}

export default function RosterGrid({ week }: RosterGridProps) {
  const dates = getWeekDates(week.startDate);
  const roster = useAppStore((state) => state.roster);
  const setAvailablePlayers = useAppStore((state) => state.setAvailablePlayers);

  // Fetch all NHL players
  const { data: players, isLoading: playersLoading, error: playersError } = useAllPlayers();

  // Fetch real NHL schedule data
  const { data: schedule, isLoading: scheduleLoading, error: scheduleError } = useWeekSchedule(week.startDate);

  // Set available players when loaded
  useEffect(() => {
    if (players) {
      setAvailablePlayers(players);
    }
  }, [players, setAvailablePlayers]);

  // Generate game indicators based on real schedule data
  const getGameIndicators = (slot: RosterSlot): GameIndicator[] => {
    if (!slot.player || !schedule) {
      return ['-', '-', '-', '-', '-', '-', '-'];
    }

    // For goalies, use the goalie handler
    if (getEffectivePositions(slot.player).includes('G')) {
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
  if (playersLoading || scheduleLoading) {
    return (
      <div className="bg-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-slate-400">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>
              {playersLoading ? 'Loading players...' : 'Loading schedule...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (playersError || scheduleError) {
    const error = playersError || scheduleError;
    return (
      <div className="bg-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-red-400">
            Error: {error?.message || 'Failed to load data'}
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
