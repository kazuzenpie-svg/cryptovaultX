# CryptoVaultX

Trading Journal and Portfolio Analytics

## Overview

CryptoVaultX is a TypeScript/React app built with Vite and Tailwind. It helps you log trades, analyze performance, and view per-asset summaries. Data is stored in Supabase (PostgreSQL + PostgREST) with Row Level Security.

## Features

- Journal entries for multiple types: `spot`, `futures`, `wallet`, `dual_investment`, `liquidity_mining`, `liquidity_pool`, `other`
- Per-asset summaries with cached crypto icons and live/fallback pricing
- Analytics: performance metrics, PnL calendar, trading heatmap, activity breakdown
- Access grants and sharing with RLS policies
- Local caching for prices/icons to reduce API calls and keep UI fast

## Tech Stack

- Vite, React, TypeScript
- Tailwind CSS, shadcn/ui
- Supabase (Auth, Postgres, RLS)

## Local Development

Requirements: Node.js 18+, npm 9+

```sh
git clone <YOUR_GIT_URL>
cd cryptovaultX
npm i

# Copy environment template and fill values
cp .env.example .env.local

# Start dev server
npm run dev
```

Open http://localhost:5173

## Environment Variables

Create `.env.local` with the following keys (never commit secrets):

```ini
VITE_SUPABASE_URL= https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY= <public-anon-key>
```

Service-role keys must never be exposed to the client. Use server-side functions if needed.

## Scripts

- `npm run dev` — Start Vite dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build locally
- `npm run lint` — Lint the project

## Directory Structure

```
public/
  favicon.ico
  placeholder.svg
  robots.txt
src/
  components/
    analytics/           # Analytics UI (Per-Asset Summary, Heatmap, Calendar)
    journal/             # Journal form and UI
    navigation/          # Navbar
    ui/                  # shadcn/ui primitives
  hooks/
    useJournalEntries.tsx
    useCryptoPrices.tsx
    useLivePrices.ts
    useAssetSummaries.tsx
  integrations/
    supabase/
      client.ts
      types.ts
  pages/
    Analytics.tsx
    Journal.tsx
    Portfolio.tsx
  lib/
    cache.ts             # localStorage TTL cache
    utils.ts
supabase/
  migrations/            # SQL migrations (RLS, tables, enums, triggers)
  config.toml
```

## Database & Security

- PostgreSQL schema is managed via `supabase/migrations/`
- Enums: `entry_type`, `trade_side`, `currency_code`
- RLS enabled by default for `journal_entries` and related tables
- Policies restrict row access to `auth.uid()`
- Never expose service-role keys to the client

## Testing

- Unit test React components and hooks (recommend vitest + testing-library)
- Integration test Supabase API (recommend supertest against local supabase or mocks)

## Deployment

- Build with `npm run build`
- Deploy `dist/` to a static host (Netlify, Vercel, Cloudflare Pages). Set env vars in host settings.

## Troubleshooting

- Pricing shows dashes: asset symbol unmapped in CoinGecko; add to `CRYPTO_ID_MAP` in `src/hooks/useCryptoPrices.tsx`
- Cannot add futures/spot entries: ensure required fields — `side` for spot, `leverage` for futures. Numeric inputs must be > 0 when provided.
- Auth or data empty: verify `.env.local` Supabase URL and anon key; confirm RLS policies and authenticated session.

## License

MIT
