import { useState, useRef, useEffect } from 'react';
import { Player, PlayerPosition, getEffectivePositions, hasCustomPositions } from '@/models';
import { useAppStore } from '@/store/store';

const ALL_POSITIONS: PlayerPosition[] = ['C', 'LW', 'RW', 'D', 'G'];

interface PlayerEligibilityEditorProps {
  player: Player;
  onClose: () => void;
}

export default function PlayerEligibilityEditor({
  player,
  onClose,
}: PlayerEligibilityEditorProps) {
  const updatePlayerPositions = useAppStore((state) => state.updatePlayerPositions);
  const clearPlayerPositions = useAppStore((state) => state.clearPlayerPositions);
  const containerRef = useRef<HTMLDivElement>(null);

  const [positions, setPositions] = useState<PlayerPosition[]>(
    getEffectivePositions(player)
  );
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

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

  const addPosition = (pos: PlayerPosition) => {
    if (!positions.includes(pos)) {
      const newPositions = [...positions, pos];
      setPositions(newPositions);
      updatePlayerPositions(player.id, newPositions);
    }
    setShowAddMenu(false);
  };

  const removePosition = (pos: PlayerPosition) => {
    if (positions.length <= 1) return; // Must keep at least one
    const newPositions = positions.filter((p) => p !== pos);
    setPositions(newPositions);
    updatePlayerPositions(player.id, newPositions);
  };

  const resetToDefault = () => {
    clearPlayerPositions(player.id);
    setPositions(player.positions);
  };

  const availableToAdd = ALL_POSITIONS.filter((p) => !positions.includes(p));
  const isModified = hasCustomPositions(player);

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 mt-1 w-72 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 p-3"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium text-white truncate">
          {player.name}
        </div>
        {isModified && (
          <button
            onClick={resetToDefault}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      <div className="text-xs text-slate-400 mb-2">Position Eligibility</div>

      <div className="flex flex-wrap gap-2 mb-3">
        {positions.map((pos) => (
          <span
            key={pos}
            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 rounded text-sm text-white"
          >
            {pos}
            {positions.length > 1 && (
              <button
                onClick={() => removePosition(pos)}
                className="text-slate-400 hover:text-red-400 transition-colors"
                title="Remove position"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </span>
        ))}

        {availableToAdd.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm text-slate-400 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>

            {showAddMenu && (
              <div className="absolute top-full left-0 mt-1 bg-slate-700 border border-slate-600 rounded shadow-lg z-10">
                {availableToAdd.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => addPosition(pos)}
                    className="block w-full px-3 py-1 text-sm text-white hover:bg-slate-600 text-left transition-colors"
                  >
                    {pos}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-3 py-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
