import { Player, formatPositions } from '@/models';

interface PlayerDropdownProps {
  player: Player | null;
  onSelect?: (player: Player | null) => void;
  disabled?: boolean;
}

export default function PlayerDropdown({
  player,
  onSelect,
  disabled = false,
}: PlayerDropdownProps) {
  const handleClick = () => {
    if (!disabled && onSelect) {
      // TODO: Open player search modal
      console.log('Open player search');
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`min-w-[180px] h-10 px-3 flex items-center gap-2 rounded text-left transition-colors ${
        disabled
          ? 'bg-slate-800 cursor-not-allowed'
          : 'bg-slate-700 hover:bg-slate-600 cursor-pointer'
      }`}
    >
      {player ? (
        <>
          <span className="text-sm font-medium text-white truncate flex-1">
            {player.name}
          </span>
          <span className="text-xs text-slate-400">
            {player.team} - {formatPositions(player)}
          </span>
        </>
      ) : (
        <span className="text-sm text-slate-500 italic">Select player...</span>
      )}
    </button>
  );
}
