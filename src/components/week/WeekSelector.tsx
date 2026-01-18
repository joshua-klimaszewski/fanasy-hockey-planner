import { Week, createWeek, formatDate, parseDate } from '@/models';

interface WeekSelectorProps {
  selectedWeek: Week;
  onWeekChange: (week: Week) => void;
}

export default function WeekSelector({
  selectedWeek,
  onWeekChange,
}: WeekSelectorProps) {
  const handlePreviousWeek = () => {
    const currentStart = parseDate(selectedWeek.startDate);
    currentStart.setDate(currentStart.getDate() - 7);
    const newWeek = createWeek(
      formatDate(currentStart),
      Math.max(1, selectedWeek.weekNumber - 1)
    );
    onWeekChange(newWeek);
  };

  const handleNextWeek = () => {
    const currentStart = parseDate(selectedWeek.startDate);
    currentStart.setDate(currentStart.getDate() + 7);
    const newWeek = createWeek(
      formatDate(currentStart),
      selectedWeek.weekNumber + 1
    );
    onWeekChange(newWeek);
  };

  return (
    <div className="flex items-center justify-between bg-slate-800 rounded-lg p-4">
      <button
        onClick={handlePreviousWeek}
        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        aria-label="Previous week"
      >
        <svg
          className="w-5 h-5 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <div className="text-center">
        <h2 className="text-lg font-semibold text-white">
          {selectedWeek.label}
        </h2>
        <p className="text-sm text-slate-400">
          {selectedWeek.startDate} to {selectedWeek.endDate}
        </p>
      </div>

      <button
        onClick={handleNextWeek}
        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        aria-label="Next week"
      >
        <svg
          className="w-5 h-5 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
}
