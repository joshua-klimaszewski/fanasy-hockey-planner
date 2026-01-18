import { RosterSlot, getSlotLabel } from '@/models';

interface PositionCellProps {
  slot: RosterSlot;
}

const positionColors: Record<string, string> = {
  C: 'bg-red-700',
  LW: 'bg-green-700',
  RW: 'bg-blue-700',
  D: 'bg-purple-700',
  G: 'bg-yellow-700',
  U: 'bg-orange-700',
  B: 'bg-slate-600',
  IR: 'bg-slate-700',
  'IR+': 'bg-slate-700',
};

export default function PositionCell({ slot }: PositionCellProps) {
  const label = getSlotLabel(slot);
  const bgColor = positionColors[slot.type] || 'bg-slate-600';

  return (
    <div
      className={`w-12 h-10 flex items-center justify-center rounded font-bold text-sm text-white ${bgColor}`}
    >
      {label}
    </div>
  );
}
