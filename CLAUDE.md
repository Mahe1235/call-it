# Call-It — Session Index

IPL cricket prediction game. Mobile-first React SPA for a friend group (MVP: 6 players).

## Docs
- `docs/called-it-mvp-spec.md` — game mechanics, scoring rules
- `docs/called-it-technical-spec-mvp.md` — architecture, DB schema, API strategy
- `docs/called-it-design-language-mvp.md` — visual system, fonts, team colors
- `docs/called-it-banter-library-mvp.md` — all UI copy
- `docs/seeding-guide.md` — how to seed match schedule + team squads

## Stack
- React 18 + Vite 5 (SPA, no SSR)
- Tailwind CSS v3
- Supabase (Postgres + Auth + RLS)
- React Router v6
- Hosted on Vercel

## Key patterns
- **Content files** (`content/*.json`) — teams, scoring, questions, banter. Edit copy without touching code.
- **TeamThemeProvider** — swaps `--team-*` CSS vars on `<html>` based on user's chosen team.
- **Scoring is pure functions** in `src/lib/scoring.js` (to be built) — takes data in, returns points.
- **Admin-triggered scoring** — admin clicks Fetch Scorecard → Publish Scores after each match.
- **CricketData.org API** (`api.cricapi.com/v1/`) — 100 hits/day free tier. ~76 calls for full season.

## DB
- Migrations in `supabase/migrations/` — run in order in Supabase SQL Editor.
- Leaderboard is a Postgres view — always fresh, no cache.
- IPL 2026 series ID: `87c62aac-bc3c-4738-ab93-19da0690488f`

## Commands
```
npm run dev              # Start dev server (localhost:5175)
npm run build            # Production build
npm run seed:schedule    # Seed match fixtures from CricAPI (add -- --series-id <id>)
npm run seed:squads      # Seed team squads from CricAPI into teams.json
```

## Env vars needed
Copy `.env.example` → `.env.local` and fill in:
- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` — Project Settings → API
- `SUPABASE_SERVICE_KEY` — Project Settings → API → service_role (scripts only)
- `VITE_CRICAPI_KEY` + `CRICAPI_KEY` — cricketdata.org (same key, two names)
