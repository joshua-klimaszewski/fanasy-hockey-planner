# Implementation Plan

## Phase 1: Foundation

### 1.1 Project Initialization
- [x] Initialize Vite project: `npm create vite@latest . -- --template react-ts`
- [x] Install dependencies:
  ```bash
  npm install @tanstack/react-query zustand tailwindcss postcss autoprefixer
  npm install -D vitest @testing-library/react @testing-library/jest-dom
  npm install -D playwright @playwright/test
  npm install -D eslint prettier eslint-config-prettier
  ```
- [x] Configure Tailwind CSS
- [x] Configure Vitest and Playwright
- [x] Set up ESLint and Prettier
- [x] Create .gitignore, .env.example

### 1.2 GitHub Actions CI
- [x] Create `.github/workflows/ci.yml`
- [x] Add lint, typecheck, test, build jobs
- [x] Create `.github/workflows/deploy.yml` for GitHub Pages

### 1.3 Core Data Models
- [x] Create `src/models/Position.ts`
- [x] Create `src/models/Player.ts`
- [x] Create `src/models/RosterSlot.ts`
- [x] Create `src/models/Schedule.ts`
- [x] Create `src/models/Week.ts`

### 1.4 Basic Layout
- [x] Create `src/components/layout/MainLayout.tsx`
- [x] Create `src/components/layout/Header.tsx`
- [x] Create `src/components/week/WeekSelector.tsx`

## Phase 2: Schedule Integration

### 2.1 NHL API Client
- [x] Create `src/api/clients/nhlClient.ts`
- [x] Implement `getWeekSchedule(startDate)` method
- [x] Implement `getTeamWeekSchedule(teamAbbrev, date)` method
- [x] Add team abbreviation mapping

### 2.2 Week Utilities
- [x] Create `src/lib/schedule/weekCalculator.ts`
- [x] Implement NHL week boundary detection
- [x] Create `src/lib/schedule/gameMapper.ts`

### 2.3 React Query Hooks
- [x] Create `src/api/hooks/useSchedule.ts`
- [x] Create `src/api/hooks/useRosterSchedules.ts`

### 2.4 Roster Grid (Static)
- [x] Create `src/components/roster/RosterGrid.tsx`
- [x] Create `src/components/roster/RosterRow.tsx`
- [x] Create `src/components/roster/GameCell.tsx`
- [x] Create `src/components/roster/PositionCell.tsx`
- [x] Add mock player data for testing

### 2.5 Goalie Detection
- [x] Create `src/lib/optimization/goalieHandler.ts`
- [x] Implement back-to-back detection
- [x] Add `||` and `?` indicators to GameCell

## Phase 3: Yahoo API + OAuth Backend

### 3.1 Vercel Backend Setup
- [x] Create `backend/` directory
- [x] Initialize `backend/package.json`
- [x] Create `backend/vercel.json`

### 3.2 OAuth Endpoints
- [x] Create `backend/api/auth/login.ts`
- [x] Create `backend/api/auth/callback.ts`
- [x] Handle token exchange and storage

### 3.3 Yahoo API Proxy
- [x] Create `backend/api/yahoo/proxy.ts`
- [x] Forward authenticated requests to Yahoo API
- [x] Handle token refresh

### 3.4 Frontend Auth
- [x] Create `src/components/auth/AuthProvider.tsx`
- [x] Create `src/components/auth/LoginButton.tsx`
- [x] Create `src/api/clients/yahooClient.ts`

### 3.5 Yahoo Data Integration
- [x] Create `src/api/hooks/useLeagues.ts`
- [x] Create `src/api/hooks/useRoster.ts`
- [x] Create `src/api/hooks/usePlayers.ts`
- [x] Map Yahoo positions to internal model

## Phase 4: Player Assignment

### 4.1 Player Dropdown
- [ ] Create `src/components/roster/PlayerDropdown.tsx`
- [ ] Create `src/components/roster/PlayerSearch.tsx`
- [ ] Implement position eligibility filtering

### 4.2 Assignment Logic
- [ ] Create `src/lib/optimization/positionMatcher.ts`
- [ ] Implement `canPlayerFillSlot()` function
- [ ] Implement `getEligibleSlots()` function

### 4.3 State Management
- [ ] Create `src/store/store.ts` with Zustand
- [ ] Add roster assignments slice
- [ ] Add persistence to localStorage

## Phase 5: Bench Priority

### 5.1 Cascade Algorithm
- [ ] Create `src/lib/optimization/benchCascade.ts`
- [ ] Implement priority cascade logic
- [ ] Track virtual starts and conflicts

### 5.2 Roster Optimizer
- [ ] Create `src/lib/optimization/rosterOptimizer.ts`
- [ ] Combine all optimization logic
- [ ] Generate complete grid output

### 5.3 UI Components
- [ ] Create `src/components/roster/BenchPriorityPanel.tsx`
- [ ] Add drag-and-drop reordering
- [ ] Add `O` indicator styling
- [ ] Add conflict tooltips

## Phase 6: Polish

### 6.1 Loading States
- [ ] Add skeleton loaders
- [ ] Add loading spinners
- [ ] Implement error boundaries

### 6.2 Responsive Design
- [ ] Mobile-friendly grid
- [ ] Collapsible panels
- [ ] Touch-friendly dropdowns

### 6.3 Testing
- [ ] Unit tests for optimization algorithms (>90% coverage)
- [ ] E2E tests for core flows
- [ ] API mock handlers with MSW

### 6.4 Documentation
- [ ] Update README with setup instructions
- [ ] Add JSDoc comments to key functions
- [ ] Document API endpoints

## Verification Checklist
- [ ] Dev server runs without errors
- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] OAuth flow works with Yahoo
- [ ] Schedule data loads correctly
- [ ] Player assignment works
- [ ] Bench cascade shows X and O correctly
- [ ] Goalie B2B shows || indicator
- [ ] State persists across page refresh
- [ ] Deploys successfully to GitHub Pages
