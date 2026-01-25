import { useState } from 'react';
import { Player, RosterSlotType, formatPositions, hasCustomPositions } from '@/models';
import { useAppStore } from '@/store/store';
import PlayerSearch from './PlayerSearch';
import PlayerEligibilityEditor from './PlayerEligibilityEditor';

interface PlayerDropdownProps {
  player: Player | null;
  slotId: string;
  slotType: RosterSlotType;
  disabled?: boolean;
}

export default function PlayerDropdown({
  player,
  slotId,
  slotType,
  disabled = false,
}: PlayerDropdownProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showEligibilityEditor, setShowEligibilityEditor] = useState(false);

  const assignPlayer = useAppStore((state) => state.assignPlayer);
  const unassignPlayer = useAppStore((state) => state.unassignPlayer);

  const handleSelectPlayer = (playerId: string) => {
    assignPlayer(playerId, slotId);
    setShowSearch(false);
  };

  const handleClearPlayer = (e: React.MouseEvent) => {
    e.stopPropagation();
    unassignPlayer(slotId);
  };

  const handlePlayerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (player) {
      setShowEligibilityEditor(true);
    }
  };

  const handleSlotClick = () => {
    if (!disabled && !player) {
      setShowSearch(true);
    }
  };

  return (
    <div className="relative">
      <div
        className={`min-w-[180px] h-10 px-3 flex items-center gap-2 rounded text-left transition-colors ${
          disabled
            ? 'bg-slate-800 cursor-not-allowed'
            : player
              ? 'bg-slate-700'
              : 'bg-slate-700 hover:bg-slate-600 cursor-pointer'
        }`}
      >
        {player ? (
          <>
            <button
              onClick={handlePlayerClick}
              disabled={disabled}
              className="flex-1 flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity text-left"
            >
              <span className="text-sm font-medium text-white truncate">
                {player.name}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                {player.team} - {formatPositions(player)}
                {hasCustomPositions(player) && (
                  <span className="text-blue-400" title="Custom positions">*</span>
                )}
              </span>
            </button>
            <button
              onClick={handleClearPlayer}
              disabled={disabled}
              className="p-1 text-slate-500 hover:text-red-400 transition-colors"
              title="Remove player"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        ) : (
          <button
            onClick={handleSlotClick}
            disabled={disabled}
            className="flex-1 text-left"
          >
            <span className="text-sm text-slate-500 italic">Select player...</span>
          </button>
        )}
      </div>

      {showSearch && (
        <PlayerSearch
          slotId={slotId}
          slotType={slotType}
          onSelect={handleSelectPlayer}
          onClose={() => setShowSearch(false)}
        />
      )}

      {showEligibilityEditor && player && (
        <PlayerEligibilityEditor
          player={player}
          onClose={() => setShowEligibilityEditor(false)}
        />
      )}
    </div>
  );
}
