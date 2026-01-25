import { useState, useRef, useEffect, useMemo } from 'react';
import { Player, RosterSlotType, canFillSlot, formatPositions, getEffectivePositions } from '@/models';
import { useAppStore } from '@/store/store';

interface PlayerSearchProps {
  slotId: string;
  slotType: RosterSlotType;
  onSelect: (playerId: string) => void;
  onClose: () => void;
}

export default function PlayerSearch({
  slotType,
  onSelect,
  onClose,
}: PlayerSearchProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const availablePlayers = useAppStore((state) => state.availablePlayers);
  const roster = useAppStore((state) => state.roster);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    const searchTerm = query.toLowerCase().trim();

    // Compute assigned player IDs from roster
    const assignedPlayerIds = new Set(
      roster.filter((s) => s.player).map((s) => s.player!.id)
    );

    return availablePlayers
      .filter((player) => {
        // Filter by name match
        if (searchTerm && !player.name.toLowerCase().includes(searchTerm)) {
          return false;
        }
        // Filter out already assigned players
        if (assignedPlayerIds.has(player.id)) {
          return false;
        }
        // Filter by position eligibility for the slot
        return canFillSlot(slotType, getEffectivePositions(player));
      })
      .slice(0, 15); // Limit results
  }, [availablePlayers, query, slotType, roster]);

  const handleSelect = (player: Player) => {
    onSelect(player.id);
    onClose();
  };

  return (
    <div className="absolute top-full left-0 mt-1 w-80 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50">
      <div className="p-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search players..."
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="max-h-64 overflow-y-auto">
        {filteredPlayers.length === 0 ? (
          <div className="px-3 py-4 text-sm text-slate-400 text-center">
            {query ? 'No matching players found' : 'No eligible players available'}
          </div>
        ) : (
          <ul>
            {filteredPlayers.map((player) => (
              <li key={player.id}>
                <button
                  onClick={() => handleSelect(player)}
                  className="w-full px-3 py-2 flex items-center gap-3 hover:bg-slate-700 transition-colors text-left"
                >
                  {player.imageUrl ? (
                    <img
                      src={player.imageUrl}
                      alt=""
                      className="w-8 h-8 rounded-full bg-slate-600 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs text-slate-400">
                      {player.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {player.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {player.team} - {formatPositions(player)}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="px-3 py-2 border-t border-slate-700">
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-white transition-colors"
        >
          Cancel (Esc)
        </button>
      </div>
    </div>
  );
}
