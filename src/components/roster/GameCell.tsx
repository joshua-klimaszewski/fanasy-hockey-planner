import { GameIndicator } from '@/models';

interface GameCellProps {
  indicator: GameIndicator;
  opponent?: string;
  isHome?: boolean;
}

const indicatorStyles: Record<GameIndicator, string> = {
  X: 'bg-green-600 text-white',
  O: 'bg-red-600 text-white',
  '||': 'bg-yellow-600 text-black',
  '?': 'bg-slate-600 text-slate-300',
  '-': 'bg-slate-800 text-slate-600',
};

const indicatorLabels: Record<GameIndicator, string> = {
  X: 'Starting',
  O: 'Bench conflict',
  '||': 'Back-to-back',
  '?': 'Uncertain',
  '-': 'No game',
};

export default function GameCell({
  indicator,
  opponent,
  isHome,
}: GameCellProps) {
  const displayText = indicator === '-' ? '' : indicator;
  const title = opponent
    ? `${indicatorLabels[indicator]} - ${isHome ? 'vs' : '@'} ${opponent}`
    : indicatorLabels[indicator];

  return (
    <div
      className={`w-10 h-10 flex items-center justify-center rounded font-bold text-sm ${indicatorStyles[indicator]}`}
      title={title}
    >
      {displayText}
    </div>
  );
}
