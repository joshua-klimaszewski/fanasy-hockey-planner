# Fantasy Hockey Roster Planner

## Project Overview
A web app for planning weekly fantasy hockey rosters. Visualizes player schedules and optimizes bench usage.

## Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS
- Zustand (client state) + React Query (server state)
- Vitest + Playwright (testing)
- GitHub Pages (frontend) + Vercel (OAuth backend)

## Key Commands
- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run test` - Run Vitest unit tests
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run lint` - ESLint
- `npm run typecheck` - TypeScript check

## Project Structure
- `src/api/` - API clients (Yahoo, NHL) and React Query hooks
- `src/components/` - React components
- `src/lib/optimization/` - Core algorithms (roster optimizer, bench cascade)
- `src/models/` - TypeScript interfaces
- `src/store/` - Zustand state management
- `backend/` - Vercel serverless functions for Yahoo OAuth

## Key Concepts

### Positions
- Skaters: C (Center), LW (Left Wing), RW (Right Wing), D (Defense)
- Goalies: G
- Flex: U (Utility - accepts C/LW/RW/D), B (Bench)
- Players can be dual-positioned (e.g., C/LW)

### Game Indicators
- `X` = Has game, will start
- `O` = Has game, bench conflict (can't fit)
- `||` = Back-to-back (goalie uncertainty)
- `?` = Uncertain start
- `-` = No game

### Bench Priority Cascade
B1 > B2 > B3 > B4. Higher priority bench gets first claim on open slots.

## APIs
- Yahoo Fantasy: OAuth 2.0, proxied through Vercel backend
- NHL Schedule: `https://api-web.nhle.com/v1/`

## Testing
- Unit tests in `__tests__` folders alongside source
- E2E tests in `e2e/tests/`
- Mocks in `src/test/mocks/`
