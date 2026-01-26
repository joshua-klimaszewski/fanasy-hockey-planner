# Plan 02: UI Redesign

## Overview

Redesign the fantasy hockey planner UI based on the wireframe:
- Light theme (no dark mode toggle)
- Central week picker pill with season navigation
- Mobile card view for roster
- Settings and Player modals
- Stats subheader

---

## Prerequisites

```bash
npm install lucide-react
```

---

## Phase 1: Foundation Components

### 1.1 Create Generic Modal Component
**File:** `src/components/ui/Modal.tsx`

```typescript
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}
```

### 1.2 Create Position Color Utilities
**File:** `src/lib/design/positionColors.ts`

```typescript
import { PlayerPosition, RosterSlotType } from '@/models';

type ColorSet = {
  bg: string;      // Light background (e.g., bg-blue-100)
  text: string;    // Text color (e.g., text-blue-700)
  solid: string;   // Solid background (e.g., bg-blue-600)
  border: string;  // Border color (e.g., border-blue-200)
};

export const positionColors: Record<PlayerPosition | RosterSlotType, ColorSet> = {
  C:  { bg: 'bg-blue-100',   text: 'text-blue-700',   solid: 'bg-blue-600',   border: 'border-blue-200' },
  LW: { bg: 'bg-green-100',  text: 'text-green-700',  solid: 'bg-green-600',  border: 'border-green-200' },
  RW: { bg: 'bg-amber-100',  text: 'text-amber-700',  solid: 'bg-amber-600',  border: 'border-amber-200' },
  D:  { bg: 'bg-purple-100', text: 'text-purple-700', solid: 'bg-purple-600', border: 'border-purple-200' },
  G:  { bg: 'bg-rose-100',   text: 'text-rose-700',   solid: 'bg-rose-600',   border: 'border-rose-200' },
  U:  { bg: 'bg-gray-100',   text: 'text-gray-700',   solid: 'bg-gray-600',   border: 'border-gray-200' },
  B:  { bg: 'bg-slate-100',  text: 'text-slate-600',  solid: 'bg-slate-500',  border: 'border-slate-200' },
  IR: { bg: 'bg-red-100',    text: 'text-red-700',    solid: 'bg-red-600',    border: 'border-red-200' },
};

export function getPositionColor(position: PlayerPosition | RosterSlotType): ColorSet {
  return positionColors[position] ?? positionColors.U;
}
```

---

## Phase 2: Theme Transition (Dark → Light)

### 2.1 Update Global Styles
**File:** `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background-color: #f9fafb; /* gray-50 */
  color: #111827; /* gray-900 */
}
```

### 2.2 Update MainLayout
**File:** `src/components/layout/MainLayout.tsx`

Key changes:
- `bg-slate-900` → `bg-gray-50`
- Remove WeekSelector from main content (moves to Header)
- Add StatsSubheader below header

```typescript
export default function MainLayout() {
  const [selectedWeek, setSelectedWeek] = useState<Week>(getCurrentWeek);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} />
      <StatsSubheader week={selectedWeek} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <RosterGrid week={selectedWeek} />
      </main>
    </div>
  );
}
```

---

## Phase 3: Header Redesign

### 3.1 Create WeekPickerPill
**File:** `src/components/week/WeekPickerPill.tsx`

Central pill showing:
- Left chevron (previous week)
- Date range + week number (clickable to open dropdown)
- Right chevron (next week)

```typescript
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Week } from '@/models';

interface WeekPickerPillProps {
  week: Week;
  onPrev: () => void;
  onNext: () => void;
  onOpenDropdown: () => void;
}

export default function WeekPickerPill({ week, onPrev, onNext, onOpenDropdown }: WeekPickerPillProps) {
  const formatRange = (week: Week) => {
    const start = new Date(week.startDate);
    const end = new Date(week.endDate);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(start)} - ${fmt(end)}`;
  };

  return (
    <div className="flex items-center gap-1 bg-white rounded-full shadow-sm border border-gray-200 px-1 py-1">
      <button
        onClick={onPrev}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Previous week"
      >
        <ChevronLeft className="w-4 h-4 text-gray-600" />
      </button>

      <button
        onClick={onOpenDropdown}
        className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 rounded-full transition-colors"
      >
        <span className="text-sm font-medium text-gray-900">
          {formatRange(week)}
        </span>
        <span className="text-xs text-gray-500">
          Week {week.weekNumber}
        </span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      <button
        onClick={onNext}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Next week"
      >
        <ChevronRight className="w-4 h-4 text-gray-600" />
      </button>
    </div>
  );
}
```

### 3.2 Create WeekPickerDropdown
**File:** `src/components/week/WeekPickerDropdown.tsx`

Grid of clickable week numbers spanning the full NHL season (~26 weeks).

```typescript
import { Week } from '@/models';

interface WeekPickerDropdownProps {
  weeks: Week[];
  currentWeek: Week;
  onSelect: (week: Week) => void;
  onClose: () => void;
}

export default function WeekPickerDropdown({ weeks, currentWeek, onSelect, onClose }: WeekPickerDropdownProps) {
  return (
    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
      <div className="grid grid-cols-6 gap-2">
        {weeks.map((week) => (
          <button
            key={week.weekNumber}
            onClick={() => { onSelect(week); onClose(); }}
            className={`
              w-10 h-10 rounded-lg text-sm font-medium transition-colors
              ${week.weekNumber === currentWeek.weekNumber
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-100 text-gray-700'
              }
            `}
          >
            {week.weekNumber}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 3.3 Update Header
**File:** `src/components/layout/Header.tsx`

Layout: Logo (left) | WeekPickerPill (center) | Settings icon (right)

```typescript
import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Week } from '@/models';
import WeekPickerPill from '../week/WeekPickerPill';
import WeekPickerDropdown from '../week/WeekPickerDropdown';

interface HeaderProps {
  selectedWeek: Week;
  onWeekChange: (week: Week) => void;
}

export default function Header({ selectedWeek, onWeekChange }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // TODO: Generate full season weeks from NHL season dates
  const allWeeks: Week[] = [];

  const handlePrev = () => {
    // Navigate to previous week
  };

  const handleNext = () => {
    // Navigate to next week
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FH</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 hidden sm:block">
              Fantasy Hockey
            </span>
          </div>

          {/* Center: Week Picker */}
          <div className="relative">
            <WeekPickerPill
              week={selectedWeek}
              onPrev={handlePrev}
              onNext={handleNext}
              onOpenDropdown={() => setIsDropdownOpen(!isDropdownOpen)}
            />
            {isDropdownOpen && (
              <WeekPickerDropdown
                weeks={allWeeks}
                currentWeek={selectedWeek}
                onSelect={onWeekChange}
                onClose={() => setIsDropdownOpen(false)}
              />
            )}
          </div>

          {/* Right: Settings */}
          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
}
```

### 3.4 Create StatsSubheader
**File:** `src/components/layout/StatsSubheader.tsx`

Shows weekly stats summary below header.

```typescript
import { Week } from '@/models';

interface StatsSubheaderProps {
  week: Week;
}

export default function StatsSubheader({ week }: StatsSubheaderProps) {
  // TODO: Calculate actual stats from roster
  const stats = {
    gamesPlayed: 0,
    maxGames: 0,
    benchMisses: 0,
  };

  return (
    <div className="bg-gray-100 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Games:</span>
            <span className="font-medium text-gray-900">
              {stats.gamesPlayed}/{stats.maxGames}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Bench Misses:</span>
            <span className="font-medium text-amber-600">
              {stats.benchMisses}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 4: Mobile Card View

### 4.1 Create PlayerCard Component
**File:** `src/components/roster/PlayerCard.tsx`

Mobile-optimized card showing player info + game schedule.

```typescript
import { Player, Week, TeamWeekSchedule } from '@/models';
import { getPositionColor } from '@/lib/design/positionColors';

interface PlayerCardProps {
  player: Player;
  schedule: TeamWeekSchedule | null;
  week: Week;
  onClick: () => void;
}

export default function PlayerCard({ player, schedule, week, onClick }: PlayerCardProps) {
  const posColor = getPositionColor(player.positions[0]);
  const weekDates = getWeekDates(week); // Helper to get array of dates

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Player Info Row */}
      <div className="flex items-center gap-3 mb-3">
        {player.imageUrl && (
          <img
            src={player.imageUrl}
            alt={player.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{player.name}</div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{player.team}</span>
            <span className={`px-1.5 py-0.5 rounded ${posColor.bg} ${posColor.text}`}>
              {player.positions.join('/')}
            </span>
          </div>
        </div>
      </div>

      {/* Game Schedule Row */}
      <div className="flex gap-1">
        {weekDates.map((date) => {
          const hasGame = schedule?.gamesByDate[date];
          return (
            <div
              key={date}
              className={`
                flex-1 h-8 rounded flex items-center justify-center text-xs font-medium
                ${hasGame ? 'bg-green-100 text-green-700' : 'bg-gray-50 text-gray-400'}
              `}
            >
              {hasGame ? 'X' : '-'}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 4.2 Update RosterGrid for Responsive Layout
**File:** `src/components/roster/RosterGrid.tsx`

- Desktop (lg+): Table view (existing)
- Mobile (<lg): Card list view

```typescript
// Add to RosterGrid
const isMobile = useMediaQuery('(max-width: 1023px)');

return isMobile ? (
  <div className="space-y-3">
    {players.map((player) => (
      <PlayerCard key={player.id} player={player} ... />
    ))}
  </div>
) : (
  <table className="...">
    {/* Existing table view */}
  </table>
);
```

### 4.3 Create useMediaQuery Hook
**File:** `src/hooks/useMediaQuery.ts`

```typescript
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}
```

---

## Phase 5: Player Modal

### 5.1 Create PlayerModal
**File:** `src/components/roster/PlayerModal.tsx`

Shows detailed player info when clicking on a player row/card.

```typescript
import Modal from '../ui/Modal';
import { Player, TeamWeekSchedule, Week } from '@/models';
import { getPositionColor } from '@/lib/design/positionColors';

interface PlayerModalProps {
  player: Player | null;
  schedule: TeamWeekSchedule | null;
  week: Week;
  isOpen: boolean;
  onClose: () => void;
  onEditPositions: () => void;
  onRemove: () => void;
}

export default function PlayerModal({
  player,
  schedule,
  week,
  isOpen,
  onClose,
  onEditPositions,
  onRemove,
}: PlayerModalProps) {
  if (!player) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={player.name}>
      <div className="space-y-6">
        {/* Player Header */}
        <div className="flex items-center gap-4">
          {player.imageUrl && (
            <img
              src={player.imageUrl}
              alt={player.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          )}
          <div>
            <div className="text-xl font-semibold text-gray-900">{player.name}</div>
            <div className="text-gray-500">{player.team}</div>
            <div className="flex gap-1 mt-1">
              {player.positions.map((pos) => (
                <span
                  key={pos}
                  className={`px-2 py-0.5 rounded text-sm ${getPositionColor(pos).bg} ${getPositionColor(pos).text}`}
                >
                  {pos}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Week Schedule */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">This Week's Games</h3>
          {/* Schedule display */}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onEditPositions}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Edit Positions
          </button>
          <button
            onClick={onRemove}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

---

## Phase 6: Settings Modal

### 6.1 Create SettingsModal
**File:** `src/components/settings/SettingsModal.tsx`

```typescript
import Modal from '../ui/Modal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6">
        {/* Roster Configuration */}
        <section>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Roster Slots</h3>
          <div className="space-y-2">
            {/* Slot count inputs */}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Centers (C)</span>
              <input
                type="number"
                min="0"
                max="10"
                defaultValue={2}
                className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-center"
              />
            </div>
            {/* ... more position slots */}
          </div>
        </section>

        {/* Import/Export */}
        <section>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Data</h3>
          <div className="flex gap-3">
            <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              Export Roster
            </button>
            <button className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              Import Roster
            </button>
          </div>
        </section>
      </div>
    </Modal>
  );
}
```

---

## Phase 7: Component Updates (Light Theme)

### 7.1 Update RosterRow
- Dark backgrounds → white/gray
- Dark text → gray-900
- Dark borders → gray-200

### 7.2 Update GameCell
- Keep color indicators for game status
- Improve contrast for light theme

### 7.3 Update PlayerSearch/PlayerDropdown
- White backgrounds
- Gray borders
- Proper shadows

---

## Testing Checklist

- [ ] Light theme applied throughout app
- [ ] Week picker navigates full NHL season
- [ ] Week picker dropdown shows all weeks
- [ ] Mobile card view displays on small screens
- [ ] Desktop table view displays on large screens
- [ ] Player modal opens on row/card click
- [ ] Settings modal opens from header
- [ ] Position colors consistent across components
- [ ] Modals close on Escape key
- [ ] Modals close on backdrop click

---

## File Summary

**New Files:**
- `src/components/ui/Modal.tsx`
- `src/lib/design/positionColors.ts`
- `src/components/week/WeekPickerPill.tsx`
- `src/components/week/WeekPickerDropdown.tsx`
- `src/components/layout/StatsSubheader.tsx`
- `src/components/roster/PlayerCard.tsx`
- `src/components/roster/PlayerModal.tsx`
- `src/components/settings/SettingsModal.tsx`
- `src/hooks/useMediaQuery.ts`

**Modified Files:**
- `src/index.css`
- `src/components/layout/MainLayout.tsx`
- `src/components/layout/Header.tsx`
- `src/components/roster/RosterGrid.tsx`
- `src/components/roster/RosterRow.tsx`
- `src/components/roster/GameCell.tsx`
- `src/components/roster/PlayerSearch.tsx`
- `src/components/roster/PlayerDropdown.tsx`
