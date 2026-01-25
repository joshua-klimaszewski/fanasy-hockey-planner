import { RosterSlot, GameIndicator } from '@/models';
import PositionCell from './PositionCell';
import PlayerDropdown from './PlayerDropdown';
import GameCell from './GameCell';

interface RosterRowProps {
  slot: RosterSlot;
  /** Game indicators for each day of the week (Mon-Sun) */
  gameIndicators: GameIndicator[];
  /** Total games for this player this week */
  totalGames: number;
}

export default function RosterRow({
  slot,
  gameIndicators,
  totalGames,
}: RosterRowProps) {
  return (
    <div className="flex items-center gap-2 py-1">
      <PositionCell slot={slot} />
      <PlayerDropdown
        player={slot.player}
        slotId={slot.id}
        slotType={slot.type}
      />
      <div className="flex gap-1">
        {gameIndicators.map((indicator, index) => (
          <GameCell key={index} indicator={indicator} />
        ))}
      </div>
      <div className="w-10 h-10 flex items-center justify-center text-sm font-medium text-slate-300">
        {totalGames}
      </div>
    </div>
  );
}
