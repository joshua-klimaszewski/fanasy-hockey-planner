# Fantasy Hockey Roster Planner

A web application to help fantasy hockey managers plan their weekly roster, visualize game schedules, and optimize bench usage.

## Features

- **Week Selector** - Navigate between NHL weeks
- **Roster Grid** - Visual grid showing Mon-Sun with game indicators
- **Position Management** - Support for C, LW, RW, D, G, U (Utility), B (Bench), IR positions
- **Bench Priority Cascade** - B1 > B2 > B3 prioritization with conflict visualization
- **Goalie B2B Handling** - Special indicators for back-to-back uncertainty
- **Yahoo Fantasy Integration** - Connect your Yahoo Fantasy Hockey account

## Game Indicators

| Indicator | Meaning |
|-----------|---------|
| `X` | Has game, player will start |
| `O` | Has game, but bench can't fit (conflict) |
| `\|\|` | Back-to-back game (goalie uncertainty) |
| `?` | Uncertain start (DTD injury) |
| `-` | No game |

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Zustand (client state) + React Query (server state)
- Vitest + Playwright (testing)
- GitHub Pages (frontend) + Vercel (OAuth backend)

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests (Playwright)
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript check
```

## Project Structure

```
src/
├── api/
│   ├── clients/          # API clients (Yahoo, NHL)
│   └── hooks/            # React Query hooks
├── components/
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   ├── roster/           # Roster grid components
│   └── week/             # Week selector
├── lib/
│   ├── optimization/     # Core algorithms
│   └── schedule/         # Week utilities
├── models/               # TypeScript interfaces
└── store/                # Zustand store

backend/                  # Vercel serverless (OAuth proxy)
├── api/
│   ├── auth/             # OAuth endpoints
│   └── yahoo/            # Yahoo API proxy
```

## Yahoo Fantasy Setup

To connect with Yahoo Fantasy:

1. Create a Yahoo Developer App at https://developer.yahoo.com/apps/
2. Set up the backend with your credentials (see `backend/.env.example`)
3. Deploy the backend to Vercel
4. Configure the frontend `VITE_BACKEND_URL` environment variable

## License

MIT
