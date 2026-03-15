# Data Seeding Guide

How to get match data and team squads into Supabase before the season starts.

---

## Prerequisites

Make sure your `.env.local` has all four values:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...         ← Project Settings → API → anon key
SUPABASE_SERVICE_KEY=sb_secret_...    ← Project Settings → API → service_role key
CRICAPI_KEY=your-key-here             ← cricketdata.org free tier (100 calls/day)
```

---

## Step 1 — Seed the Match Schedule

Fetches IPL fixtures from CricketData.org and inserts them into the `matches` and `match_questions` tables. Each match automatically gets one **The Call** question and one **Chaos Ball** question assigned (deterministic — same match always gets the same questions).

**IPL 2026 series ID:** `87c62aac-bc3c-4738-ab93-19da0690488f`

```bash
# Preview first — no DB writes
npm run seed:schedule -- --series-id 87c62aac-bc3c-4738-ab93-19da0690488f --dry-run

# Seed for real
npm run seed:schedule -- --series-id 87c62aac-bc3c-4738-ab93-19da0690488f
```

The script is **idempotent** — safe to re-run anytime. New matches are inserted; existing ones are updated in place (upsert on `match_number`).

> **Note:** CricAPI releases fixtures gradually as BCCI announces them. As of March 2026, only 20 of 74 matches are available. Re-run this script every few weeks to pick up newly announced fixtures.

---

## Step 2 — Seed Team Squads

Fetches player rosters from CricketData.org and writes them into `content/teams.json`. Squads are used in the Match Card villain picker dropdown.

### First time: find team API IDs

CricAPI uses its own team IDs, which you need to look up once and save into `content/teams.json`:

```bash
node scripts/seedSquads.js --find-team "Chennai Super Kings"
# → prints: <uuid>  Chennai Super Kings
# Copy the ID into teams.json → "apiTeamId": "<uuid>"
```

Do this for all 10 teams, then commit `content/teams.json`.

### Then fetch squads

```bash
# All teams (skips any without apiTeamId set)
npm run seed:squads

# One team only (useful for mid-season squad changes)
npm run seed:squads -- --team rcb
```

After running, commit the updated `content/teams.json` — the squad data is stored in the file, not the database.

---

## Re-running During the Season

| When | What to run |
|------|------------|
| BCCI announces new fixtures | `seed:schedule` |
| Player traded / squad change | `seed:squads --team <id>` |
| Venue changes for a match | Update `content/venues.json` lines, re-run `seed:schedule` |

---

## How Questions Are Assigned

Questions are selected **deterministically** from `content/questions.json` using the match number as a seed. The same match will always get the same questions — no randomness.

- **The Call** pool: 13 questions (Tier 1 + 2 only for MVP)
- **Chaos Ball** pool: 14 questions (Tier 1 + 2 only)
- Over/Under lines in question text are substituted from `content/venues.json` based on the match venue

Correct answers are set by the admin after each match via the Admin panel.

---

## Troubleshooting

**"No matches returned"** — The series ID is wrong or CricAPI hasn't published fixtures yet. Run `--find-series "ipl 2026"` to verify the ID.

**"Unrecognised team"** — A team name from CricAPI doesn't match our mapping. Add it to `TEAM_NAME_MAP` in `scripts/seedSchedule.js`.

**"Unknown venue"** — A match is at a neutral venue not in our list. Add it to `CITY_TO_VENUE` in `scripts/seedSchedule.js` (map to the closest venue for O/U line purposes).

**API rate limit** — Free tier is 100 calls/day. The full seed (schedule + 10 squads) uses ~12 calls. Well within limits.
