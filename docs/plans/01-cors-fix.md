# Plan 01: CORS Fix & Vercel Deployment

## Problem

The production site at `https://joshua-klimaszewski.github.io/fanasy-hockey-planner/` gets CORS errors when calling the NHL API directly. The Vite dev proxy (`/api/nhl` → `https://api-web.nhle.com/v1`) only works locally.

Current behavior in `src/api/clients/nhlClient.ts`:
```typescript
const NHL_API_BASE = import.meta.env.DEV
  ? '/api/nhl'  // Works locally via Vite proxy
  : 'https://api-web.nhle.com/v1';  // CORS blocked in production
```

## Solution: Migrate to Vercel with Edge Function Proxy

Instead of GitHub Pages (static hosting), deploy to Vercel which supports serverless functions. Create an Edge Function to proxy NHL API requests.

---

## Phase 1: Create Vercel Edge Function

### 1.1 Create API Route
**File:** `api/nhl/[...path].ts`

```typescript
export const config = { runtime: 'edge' };

export default async function handler(request: Request) {
  const url = new URL(request.url);
  // Extract the path after /api/nhl/
  const path = url.pathname.replace(/^\/api\/nhl\/?/, '');
  const nhlUrl = `https://api-web.nhle.com/v1/${path}`;

  try {
    const response = await fetch(nhlUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `NHL API returned ${response.status}` }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch from NHL API' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
```

### 1.2 Handle CORS Preflight
**File:** `api/nhl/[...path].ts` (add to handler)

```typescript
// Handle OPTIONS preflight requests
if (request.method === 'OPTIONS') {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
```

---

## Phase 2: Update NHL Client

### 2.1 Simplify Base URL Logic
**File:** `src/api/clients/nhlClient.ts`

Change from:
```typescript
const NHL_API_BASE = import.meta.env.DEV
  ? '/api/nhl'
  : 'https://api-web.nhle.com/v1';
```

To:
```typescript
// Both dev (Vite proxy) and prod (Vercel function) use /api/nhl
const NHL_API_BASE = '/api/nhl';
```

This works because:
- **Dev:** Vite proxy handles `/api/nhl` → `https://api-web.nhle.com/v1`
- **Prod:** Vercel routes `/api/nhl/*` to the Edge Function

---

## Phase 3: Vercel Configuration

### 3.1 Create vercel.json
**File:** `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/nhl/:path*",
      "destination": "/api/nhl/:path*"
    },
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

### 3.2 Update vite.config.ts
**File:** `vite.config.ts`

Remove the `base` property (Vercel deploys to root, not a subpath):
```typescript
export default defineConfig({
  // Remove: base: '/fanasy-hockey-planner/',
  plugins: [react()],
  // ... rest stays the same
});
```

---

## Phase 4: GitHub Actions Update

### 4.1 Remove GitHub Pages Workflow
**Delete:** `.github/workflows/deploy.yml`

### 4.2 Keep CI Workflow
**File:** `.github/workflows/ci.yml` - No changes needed

Vercel will auto-deploy from the `main` branch via its GitHub integration.

---

## Phase 5: Deployment Steps

1. **Link Vercel to Repository**
   ```bash
   npx vercel link
   ```

2. **Set Environment Variables (if needed)**
   - None required for NHL API (public)

3. **Deploy**
   ```bash
   npx vercel --prod
   ```

4. **Update GitHub repo settings**
   - Remove GitHub Pages if configured
   - Add Vercel deployment URL to repo description

---

## Verification Checklist

- [ ] Edge function returns NHL schedule data at `/api/nhl/schedule/2025-01-27`
- [ ] Edge function returns team roster at `/api/nhl/roster/TOR/20242025`
- [ ] Frontend loads schedule without CORS errors
- [ ] Frontend loads player search without CORS errors
- [ ] Vite dev proxy still works locally
- [ ] Build completes without errors

---

## Rollback Plan

If issues arise:
1. Revert `vite.config.ts` to include `base: '/fanasy-hockey-planner/'`
2. Restore GitHub Pages deploy workflow
3. Update `nhlClient.ts` to use a public CORS proxy as fallback:
   ```typescript
   const NHL_API_BASE = import.meta.env.DEV
     ? '/api/nhl'
     : 'https://corsproxy.io/?https://api-web.nhle.com/v1';
   ```
