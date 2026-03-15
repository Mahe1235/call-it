# Called It — Technical Spec 🏏

### MVP · Architecture, Data, & Build Guide

*The primary build document for Claude Code. Covers project structure, modular architecture, database schema, scoring engine, API integration, and content layer. Companion to the MVP Game Mechanics spec, Design Language, and Banter Library.*

---

## 1. Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React (Vite) | Mobile-first SPA. Team-themed UI per user. |
| Styling | Tailwind CSS + CSS custom properties | Team colours as CSS variables, swapped at runtime. |
| Backend / DB | Supabase | Auth, Postgres, Row Level Security, Realtime subscriptions. |
| Auth | Supabase Google Auth | Google Sign-In. Display name + team chosen post-auth. |
| Cricket Data | CricketData.org | Free tier. `api.cricapi.com/v1/`. 100 hits/day. |
| Hosting | Vercel | Free tier. Auto-deploy from GitHub. |

---

## 2. Project Structure

Designed for Claude Code multi-session workflows. Every directory has context. The root `CLAUDE.md` is the session index.

```
called-it/
├── CLAUDE.md                    # ← Claude Code reads this first every session
├── README.md                    # Project overview, setup instructions
├── package.json
├── vite.config.js
├── tailwind.config.js
├── .env.example                 # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_CRICAPI_KEY
│
├── docs/                        # All design & spec documents
│   ├── MVP_SPEC.md              # Game mechanics (The Pitch Report MVP)
│   ├── DESIGN_LANGUAGE.md       # Visual system, colours, typography, components
│   ├── BANTER_LIBRARY.md        # Full copy source (for reference — app reads from content/)
│   └── TECH_SPEC.md             # This file
│
├── content/                     # ← ALL banter, copy, and game data — NO code changes needed to edit
│   ├── README.md                # Explains how content files work
│   ├── banter.json              # All UI copy, pick confirmations, scoring results, empty states
│   ├── teams.json               # 10 IPL teams: names, short codes, colours, squad rosters
│   ├── questions.json           # The Call pool (15) + Chaos Ball pool (20) — text, types, tiers
│   ├── venues.json              # Venue metadata + O/U lines for sixes, wickets
│   ├── season.json              # Season prediction config — categories, base points, contrarian rules
│   └── scoring.json             # Point values for every pick type, Villain Pick thresholds
│
├── supabase/
│   ├── README.md                # Schema overview, migration instructions
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed/
│       └── seed_schedule.sql    # IPL 2026 fixture data (seeded from API or manual)
│
├── src/
│   ├── main.jsx                 # App entry point
│   ├── App.jsx                  # Router, auth gate, team theme provider
│   │
│   ├── lib/                     # Shared utilities — no UI
│   │   ├── README.md            # What each module does
│   │   ├── supabase.js          # Supabase client init
│   │   ├── auth.js              # Google auth helpers (signIn, signOut, onAuthChange)
│   │   ├── scoring.js           # Scoring engine — pure functions, no side effects
│   │   ├── cricketApi.js        # CricketData.org API wrapper
│   │   ├── questionSelector.js  # Picks The Call + Chaos Ball questions per match
│   │   ├── contrarianCalc.js    # Season-end contrarian multiplier computation
│   │   └── content.js           # Loads and exposes content/*.json files
│   │
│   ├── hooks/                   # React hooks for data fetching
│   │   ├── useAuth.js           # Auth state, user profile
│   │   ├── useMatch.js          # Current/upcoming match data
│   │   ├── usePredictions.js    # Submit and fetch prediction cards
│   │   ├── useLeaderboard.js    # Leaderboard with season/match breakdown
│   │   ├── useH2H.js            # Head-to-head pairings and scores
│   │   └── useSeasonPicks.js    # Season predictions CRUD
│   │
│   ├── components/              # Reusable UI components
│   │   ├── README.md            # Component inventory
│   │   ├── ui/                  # Primitives (Button, Card, Badge, CountdownTimer, Ticker, TabBar)
│   │   ├── match/               # Match card, pick inputs, lock state
│   │   ├── reveal/              # Post-match reveal screen, group split, villain drama
│   │   ├── leaderboard/         # Leaderboard table, H2H card, season breakdown
│   │   ├── season/              # Season picks form, prediction tracker, contrarian indicator
│   │   ├── admin/               # Admin scoring panel, manual override, publish button
│   │   └── layout/              # Shell, BottomNav, PageHeader, TeamThemeProvider
│   │
│   ├── pages/                   # Route-level components (one per tab + admin)
│   │   ├── Home.jsx             # Match card + leaderboard snapshot
│   │   ├── League.jsx           # Full leaderboard
│   │   ├── Season.jsx           # Season picks + tracker
│   │   ├── Profile.jsx          # User profile, team, settings
│   │   ├── Reveal.jsx           # Post-match reveal (deep link from push/notification)
│   │   ├── Onboarding.jsx       # Post-auth: choose name + team
│   │   └── Admin.jsx            # Admin scoring panel (protected)
│   │
│   └── styles/
│       ├── globals.css          # Base palette CSS variables, font imports, bg-base
│       └── teams.css            # Team colour CSS variable sets (swapped by TeamThemeProvider)
│
└── scripts/                     # One-off CLI scripts (run with Node)
    ├── README.md                # What each script does
    ├── seedSchedule.js          # Fetch IPL 2026 schedule from API → insert into Supabase
    ├── seedSquads.js            # Fetch team squads from API → insert into Supabase
    ├── scoreMatch.js            # Fetch scorecard → run scoring engine → write results
    └── computeSeasonScores.js   # Run at season end — contrarian multipliers, final standings
```

---

## 3. CLAUDE.md (Root Index for Claude Code)

This file lives at the project root. Claude Code reads it at the start of every session.

```markdown
# Called It — Claude Code Index

## What is this?
A mobile-first IPL prediction game for a friend group of 6 people. Two games:
1. **Season Picks** — filled once before the tournament, scored at season end with contrarian multipliers
2. **Match Cards** — 4-question card per match (Match Winner, The Call, Villain Pick, Chaos Ball)

## Key docs (read before any work)
- `docs/TECH_SPEC.md` — architecture, schema, scoring logic, API integration
- `docs/MVP_SPEC.md` — game mechanics, point values, question pools
- `docs/DESIGN_LANGUAGE.md` — visual system, team colours, component patterns, animations

## Architecture principles
- **Content is data, not code.** All banter, copy, questions, and scoring values live in `content/*.json`. Changing copy never requires code changes.
- **Scoring is pure functions.** `src/lib/scoring.js` takes inputs and returns points. No side effects. Testable.
- **Team theming is CSS variables.** `TeamThemeProvider` sets `--team-primary`, `--team-secondary`, etc. Components reference variables, never hardcoded colours.
- **One API call per match.** Post-match scorecard fetch is the only external dependency. Everything else is in Supabase.

## File conventions
- Every directory has a `README.md` explaining what's inside
- Content files in `content/` are JSON — editable without touching code
- Supabase migrations in `supabase/migrations/` — numbered sequentially
- Scripts in `scripts/` are CLI tools run with `node scripts/scriptName.js`

## Current state
[Update this section as work progresses — e.g. "Schema deployed. Auth working. Match card UI in progress."]
```

---

## 4. Content Layer (Modular Copy & Data)

All game content lives in `content/`. The app reads these at build time (imported as JSON modules). **Changing any banter line, question, or point value is a content edit, not a code change.**

### content/README.md

```markdown
# Content Files

These JSON files contain ALL game data and copy. Edit freely — no code changes needed.

| File | What it controls |
|------|-----------------|
| `banter.json` | Every piece of UI copy — pick confirmations, results, empty states, leaderboard lines |
| `teams.json` | IPL team names, short codes, colour tokens, squad rosters |
| `questions.json` | The Call question pool (15) and Chaos Ball question pool (20) |
| `venues.json` | Venue names, IDs, and O/U lines for sixes and wickets |
| `season.json` | Season prediction categories, base points, contrarian multiplier rules |
| `scoring.json` | Point values for Match Winner, The Call, Villain Pick, Chaos Ball, H2H |

## Placeholder names
Banter lines use `{FRIEND}` as a placeholder. At runtime, the app replaces
`{FRIEND}` with a random group member name (not the current user).
Other variables: `{TEAM}`, `{PLAYER}`, `{POINTS}`, `{N}`, `{X}`.
```

### content/scoring.json (structure)

```json
{
  "matchCard": {
    "matchWinner": { "correct": 10, "wrong": 0 },
    "theCall": { "correct": 10, "wrong": 0 },
    "villainPick": { "under10": 15, "over30": -5, "between": 0, "didNotPlay": 0 },
    "chaosBall": { "correct": 12, "wrong": 0 }
  },
  "h2h": {
    "matchBonus": 10,
    "cycleWinnerBonus": 75
  },
  "seasonPicks": {
    "top4": { "perCorrectTeam": 30 },
    "champion": { "correct": 200 },
    "runnerUp": { "correct": 100 },
    "woodenSpoon": { "base": 50, "contrarian": true },
    "orangeCap": { "base": 40, "picksPerPlayer": 3, "contrarian": true },
    "purpleCap": { "base": 40, "picksPerPlayer": 3, "contrarian": true },
    "mostSixes": { "base": 30, "picksPerPlayer": 3, "contrarian": true },
    "partialCredit": {
      "first": 1.0,
      "top3": 0.5,
      "top5": 0.25,
      "outside": 0
    },
    "contrarianMultipliers": {
      "solo": 2.0,
      "twoOfGroup": 1.5,
      "threeOrMore": 1.0
    }
  }
}
```

### content/questions.json (structure)

```json
{
  "theCall": [
    {
      "id": "C1",
      "question": "Total sixes — Over/Under {line}",
      "inputType": "overUnder",
      "requiresLine": true,
      "lineSource": "venue.sixesLine",
      "tier": 1,
      "scoringField": "totalSixes"
    },
    {
      "id": "C2",
      "question": "Top scorer's team",
      "inputType": "teamPick",
      "requiresLine": false,
      "tier": 1,
      "scoringField": "topScorerTeam"
    },
    {
      "id": "C3",
      "question": "Will there be a maiden over?",
      "inputType": "yesNo",
      "requiresLine": false,
      "tier": 1,
      "scoringField": "hasMaidenOver"
    }
  ],
  "chaosBall": [
    {
      "id": "CB1",
      "question": "Will there be a golden duck?",
      "inputType": "yesNo",
      "tier": 1,
      "scoringField": "hasGoldenDuck"
    }
  ]
}
```

### content/teams.json (structure)

```json
{
  "teams": [
    {
      "id": "CSK",
      "name": "Chennai Super Kings",
      "shortName": "CSK",
      "colors": {
        "primary": "#F9CD1B",
        "secondary": "#1A2B6D",
        "textOnPrimary": "#1A2B6D",
        "bgTint": "#FFFDF0"
      },
      "logoUrl": "https://scores.iplt20.com/ipl/teamlogos/CSK.png",
      "squad": [
        { "id": "player_001", "name": "Ruturaj Gaikwad", "role": "batter", "isCaptain": true },
        { "id": "player_002", "name": "MS Dhoni", "role": "wicketkeeper" }
      ]
    }
  ]
}
```

### content/banter.json (structure)

```json
{
  "predictionCard": {
    "cardOpen": [
      "Today's card is open. {TEAM_A} vs {TEAM_B}. Lock it in before the first ball.",
      "Card's up. {FRIEND} hasn't started. Classic."
    ],
    "thirtyMinsToLock": [
      "30 minutes left. {FRIEND} still hasn't filled his card."
    ],
    "cardLocked": [
      "Card locked 🔒 You're on record."
    ],
    "resultsPosted": [
      "Scores are in. Brace yourself."
    ]
  },
  "pickConfirmation": {
    "matchWinner": {
      "ownTeam": [
        "Loyal. Possibly correct. {FRIEND} picked the same, for what it's worth."
      ],
      "opponent": [
        "Going against your own team? Bold. {FRIEND} will ask questions."
      ]
    },
    "villainPick": {
      "selected": [
        "Villain locked: {PLAYER}. {FRIEND} villain-picked someone different. May the worse prediction win."
      ]
    }
  },
  "scoringResults": {
    "perfectCard": [
      "Clean sweep. All 4. {FRIEND} is going to hear about this."
    ],
    "villainCorrect": [
      "Your villain pick landed. {PLAYER} scored {X}. Under 10. +15 pts. Ruthless."
    ]
  },
  "emptyStates": {
    "noMatchToday": [
      "Rest day. Either revisit yesterday's damage or argue about it. Both valid."
    ]
  },
  "reveal": {
    "groupSplit": {
      "unanimousCorrect": [
        "All {N} of you picked {TEAM}. All correct. No bragging rights when everyone's right."
      ],
      "loneCorrect": [
        "Only {FRIEND} picked {TEAM}. {FRIEND} was correct. {FRIEND} will not be quiet about this."
      ]
    }
  },
  "seasonPicks": {
    "championSoloPick": [
      "Only you picked {TEAM} to win it all. If this lands, the group will hear about it forever."
    ]
  },
  "leaderboard": {
    "leader": [
      "Top of the table. {N} pts clear of {FRIEND}. {FRIEND} is doing maths."
    ]
  }
}
```

The `content.js` module exposes a helper:

```javascript
// src/lib/content.js
import banter from '../../content/banter.json';

// Pick a random line from a category, replace variables
export function getBanter(path, variables = {}) {
  const lines = getNestedValue(banter, path);
  if (!lines || !lines.length) return '';
  const line = lines[Math.floor(Math.random() * lines.length)];
  return Object.entries(variables).reduce(
    (text, [key, val]) => text.replaceAll(`{${key}}`, val),
    line
  );
}

// Usage:
// getBanter('predictionCard.cardLocked') → "Card locked 🔒 You're on record."
// getBanter('scoringResults.villainCorrect', { PLAYER: 'Kohli', X: '3' })
```

---

## 5. Database Schema (Supabase / Postgres)

### Entity Relationship Overview

```
users ──< predictions ──< match_scores
  │                          │
  │                          ├── matches ──< match_questions
  │                          │
  ├──< season_predictions ──< season_scores
  │
  └──< h2h_pairings
```

### Migration: `001_initial_schema.sql`

```sql
-- ============================================
-- USERS
-- ============================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  team text not null,            -- IPL team short code: CSK, MI, RCB, etc.
  is_admin boolean default false,
  created_at timestamptz default now()
);

alter table public.users enable row level security;
create policy "Users can read all users" on public.users for select using (true);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

-- ============================================
-- MATCHES (seeded from API at season start)
-- ============================================
create table public.matches (
  id text primary key,                -- CricketData.org match ID
  match_number integer,               -- 1–74
  date date not null,
  start_time timestamptz not null,    -- Lock time = start_time
  venue text not null,
  team_a text not null,               -- Short code
  team_b text not null,
  status text default 'upcoming',     -- upcoming | live | completed
  scorecard_json jsonb,               -- Raw API response, cached after match
  winner text,                        -- Short code of winning team (null until completed)
  created_at timestamptz default now()
);

alter table public.matches enable row level security;
create policy "Anyone can read matches" on public.matches for select using (true);
create policy "Admins can update matches" on public.matches for update using (
  exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);

-- ============================================
-- MATCH QUESTIONS (The Call + Chaos Ball per match)
-- ============================================
create table public.match_questions (
  id uuid primary key default gen_random_uuid(),
  match_id text references public.matches(id) on delete cascade,
  type text not null,                 -- 'the_call' | 'chaos_ball'
  question_id text not null,          -- References questions.json: C1, C2, CB1, etc.
  display_text text not null,         -- Rendered question with venue-specific line if applicable
  answer_options jsonb,               -- e.g. ["Over", "Under"] or ["Yes", "No"] or ["CSK", "MI"]
  correct_answer text,                -- Filled after match scoring (null until then)
  created_at timestamptz default now(),
  unique(match_id, type)              -- One The Call + one Chaos Ball per match
);

alter table public.match_questions enable row level security;
create policy "Anyone can read questions" on public.match_questions for select using (true);
create policy "Admins can update questions" on public.match_questions for update using (
  exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);

-- ============================================
-- PREDICTIONS (one card per user per match)
-- ============================================
create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  match_id text references public.matches(id) on delete cascade,
  match_winner_pick text not null,    -- Team short code
  the_call_pick text not null,        -- Answer string matching answer_options
  villain_pick_player text,           -- Player ID from teams.json (nullable — optional)
  chaos_ball_pick text not null,      -- "Yes" or "No"
  submitted_at timestamptz default now(),
  unique(user_id, match_id)           -- One card per user per match
);

alter table public.predictions enable row level security;
create policy "Users can read all predictions after lock" on public.predictions for select using (
  exists (
    select 1 from public.matches
    where id = predictions.match_id
    and (status != 'upcoming' or start_time <= now())
  )
);
create policy "Users can insert own predictions before lock" on public.predictions for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.matches
    where id = match_id
    and status = 'upcoming'
    and start_time > now()
  )
);

-- ============================================
-- MATCH SCORES (computed after match)
-- ============================================
create table public.match_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  match_id text references public.matches(id) on delete cascade,
  winner_pts integer not null default 0,
  call_pts integer not null default 0,
  villain_pts integer not null default 0,
  chaos_pts integer not null default 0,
  h2h_pts integer not null default 0,
  total integer not null default 0,
  created_at timestamptz default now(),
  unique(user_id, match_id)
);

alter table public.match_scores enable row level security;
create policy "Anyone can read scores" on public.match_scores for select using (true);

-- ============================================
-- SEASON PREDICTIONS (filled once before Match 1)
-- ============================================
create table public.season_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade unique,
  top_4_teams text[] not null,         -- Array of 4 team short codes
  champion text not null,
  runner_up text not null,
  wooden_spoon text not null,
  orange_cap_picks text[] not null,    -- Array of 3 player IDs
  purple_cap_picks text[] not null,
  most_sixes_picks text[] not null,
  locked_at timestamptz default now()
);

alter table public.season_predictions enable row level security;
create policy "Users can read all season predictions after lock" on public.season_predictions for select using (true);
create policy "Users can insert own" on public.season_predictions for insert with check (auth.uid() = user_id);

-- ============================================
-- SEASON SCORES (computed at season end)
-- ============================================
create table public.season_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade unique,
  top_4_pts integer default 0,
  champion_pts integer default 0,
  runner_up_pts integer default 0,
  wooden_spoon_pts integer default 0,
  orange_cap_pts integer default 0,
  purple_cap_pts integer default 0,
  most_sixes_pts integer default 0,
  total integer default 0,
  breakdown jsonb,                     -- Detailed per-pick breakdown with contrarian multipliers
  computed_at timestamptz default now()
);

alter table public.season_scores enable row level security;
create policy "Anyone can read season scores" on public.season_scores for select using (true);

-- ============================================
-- H2H PAIRINGS (rotated monthly)
-- ============================================
create table public.h2h_pairings (
  id uuid primary key default gen_random_uuid(),
  user_a uuid references public.users(id) on delete cascade,
  user_b uuid references public.users(id) on delete cascade,
  cycle_start date not null,
  cycle_end date not null,
  user_a_wins integer default 0,
  user_b_wins integer default 0,
  cycle_winner uuid references public.users(id),
  is_active boolean default true
);

alter table public.h2h_pairings enable row level security;
create policy "Anyone can read pairings" on public.h2h_pairings for select using (true);

-- ============================================
-- VIEWS
-- ============================================

-- Leaderboard: combined match + season + H2H
create or replace view public.leaderboard as
select
  u.id,
  u.display_name,
  u.team,
  coalesce(m.match_total, 0) as match_points,
  coalesce(s.total, 0) as season_points,
  coalesce(m.match_total, 0) + coalesce(s.total, 0) as total_points,
  coalesce(m.matches_played, 0) as matches_played
from public.users u
left join (
  select user_id,
    sum(total) as match_total,
    count(*) as matches_played
  from public.match_scores
  group by user_id
) m on m.user_id = u.id
left join public.season_scores s on s.user_id = u.id
order by total_points desc;
```

---

## 6. Scoring Engine (`src/lib/scoring.js`)

Pure functions. No database calls. No side effects. Takes data in, returns points out. Testable in isolation.

```javascript
import scoringConfig from '../../content/scoring.json';

/**
 * Score a complete match card for one user.
 * @param {Object} prediction - User's prediction card
 * @param {Object} matchResult - Derived from scorecard
 * @param {Object} matchQuestions - The Call + Chaos Ball with correct answers
 * @returns {Object} { winnerPts, callPts, villainPts, chaosPts, total }
 */
export function scoreMatchCard(prediction, matchResult, matchQuestions) {
  const cfg = scoringConfig.matchCard;

  const winnerPts = prediction.match_winner_pick === matchResult.winner
    ? cfg.matchWinner.correct : cfg.matchWinner.wrong;

  const callQ = matchQuestions.find(q => q.type === 'the_call');
  const callPts = prediction.the_call_pick === callQ.correct_answer
    ? cfg.theCall.correct : cfg.theCall.wrong;

  const villainPts = scoreVillainPick(
    prediction.villain_pick_player,
    matchResult.playerScores
  );

  const chaosQ = matchQuestions.find(q => q.type === 'chaos_ball');
  const chaosPts = prediction.chaos_ball_pick === chaosQ.correct_answer
    ? cfg.chaosBall.correct : cfg.chaosBall.wrong;

  return {
    winnerPts, callPts, villainPts, chaosPts,
    total: winnerPts + callPts + villainPts + chaosPts
  };
}

/**
 * Score Villain Pick.
 */
export function scoreVillainPick(playerPicked, playerScores) {
  if (!playerPicked) return 0; // Skipped
  const cfg = scoringConfig.matchCard.villainPick;
  const score = playerScores[playerPicked];
  if (score === undefined || score === null) return cfg.didNotPlay;
  if (score < 10) return cfg.under10;
  if (score >= 30) return cfg.over30;
  return cfg.between;
}

/**
 * Score season predictions at tournament end.
 * @param {Object} prediction - User's season picks
 * @param {Object} actualResults - Final standings, award winners
 * @param {Array} allPredictions - All users' season picks (for contrarian calc)
 * @returns {Object} Detailed breakdown with contrarian multipliers
 */
export function scoreSeasonPredictions(prediction, actualResults, allPredictions) {
  // Implementation follows contrarian logic from MVP spec Section 3
  // See contrarianCalc.js for multiplier computation
}
```

---

## 7. Scorecard Parser (`src/lib/cricketApi.js`)

Translates the raw CricketData.org scorecard response into the flat structure the scoring engine needs.

```javascript
const BASE_URL = 'https://api.cricapi.com/v1';
const API_KEY = import.meta.env.VITE_CRICAPI_KEY;

/**
 * Fetch and parse a match scorecard.
 * Returns a normalized object the scoring engine can consume.
 */
export async function fetchAndParseScorecard(matchId) {
  const res = await fetch(
    `${BASE_URL}/match_scorecard?apikey=${API_KEY}&id=${matchId}`
  );
  const data = await res.json();
  if (data.status !== 'success') throw new Error(`API error: ${data.status}`);
  return parseScorecard(data.data);
}

/**
 * Normalize raw scorecard into scoring-friendly shape.
 * This is the ONLY place that understands the API response format.
 * If the API changes, only this function needs updating.
 */
export function parseScorecard(raw) {
  return {
    winner: extractWinner(raw),
    playerScores: extractPlayerScores(raw),        // { playerId: runs }
    totalSixes: extractTotalSixes(raw),
    sixesPerTeam: extractSixesPerTeam(raw),        // { teamA: N, teamB: N }
    topScorer: extractTopScorer(raw),              // { name, team, runs }
    topScorerPerTeam: extractTopScorerPerTeam(raw),
    hasMaidenOver: extractHasMaiden(raw),
    bowlersWith3PlusWickets: extractBowlersWith3Plus(raw),
    hasRunOut: extractHasRunOut(raw),
    firstDismissalMethod: extractFirstDismissal(raw),
    openersScores: extractOpenersScores(raw),      // { team_a: [r1, r2], team_b: [r1, r2] }
    bowlersConceding50Plus: extractBowlersConceding50(raw),
    totalWickets: extractTotalWickets(raw),
    inningsRunRates: extractRunRates(raw),
    inningsTotals: extractInningsTotals(raw),
    totalExtras: extractTotalExtras(raw),
    hasGoldenDuck: extractHasGoldenDuck(raw),
    maxSixesByBatter: extractMaxSixesByBatter(raw),
    battingFirst: extractBattingFirst(raw),
    // ... all fields needed for The Call + Chaos Ball resolution
  };
}
```

---

## 8. Question Selection (`src/lib/questionSelector.js`)

Picks one The Call question and one Chaos Ball question per match. Deterministic per match ID (so all users see the same questions).

```javascript
import questions from '../../content/questions.json';

/**
 * Select questions for a match.
 * Uses match ID as seed for deterministic random selection.
 * Avoids repeating same question within the same gameweek.
 */
export function selectMatchQuestions(matchId, recentQuestionIds = []) {
  const seed = hashString(matchId);

  const theCallPool = questions.theCall
    .filter(q => !recentQuestionIds.includes(q.id))
    .filter(q => q.tier <= 2); // MVP: Tier 1–2 only for Chaos Ball

  const chaosBallPool = questions.chaosBall
    .filter(q => !recentQuestionIds.includes(q.id))
    .filter(q => q.tier <= 2);

  return {
    theCall: seededPick(theCallPool, seed),
    chaosBall: seededPick(chaosBallPool, seed + 1)
  };
}
```

---

## 9. Team Theming

CSS variables are set by a React context provider based on the user's team.

### src/styles/teams.css

Generated from `content/teams.json`. Each team's colours are a CSS variable set:

```css
[data-team="CSK"] {
  --team-primary: #F9CD1B;
  --team-secondary: #1A2B6D;
  --team-text-on-primary: #1A2B6D;
  --team-bg-tint: #FFFDF0;
}
[data-team="MI"] {
  --team-primary: #004BA0;
  --team-secondary: #D1AB3E;
  --team-text-on-primary: #FFFFFF;
  --team-bg-tint: #EEF4FF;
}
/* ... all 10 teams */
```

### TeamThemeProvider

```jsx
// Sets data-team attribute on document root
function TeamThemeProvider({ children }) {
  const { user } = useAuth();
  useEffect(() => {
    if (user?.team) {
      document.documentElement.setAttribute('data-team', user.team);
    }
  }, [user?.team]);
  return children;
}
```

Components use variables like `bg-[var(--team-primary)]` in Tailwind or `var(--team-primary)` in custom CSS.

---

## 10. Admin Scoring Panel

Protected route (`/admin`). Only users with `is_admin = true` can access.

### Post-Match Workflow

1. Admin navigates to `/admin` after a match ends.
2. Panel shows the match with a "Fetch Scorecard" button.
3. On click: calls `fetchAndParseScorecard(matchId)`, caches raw JSON in `matches.scorecard_json`.
4. Parsed result auto-fills each question's correct answer.
5. Admin reviews: each question shows ✅ auto-filled / 🔴 needs manual input.
6. Admin can override any answer via dropdown/input.
7. "Publish Scores" button:
   - For each user with a prediction card for this match:
     - Runs `scoreMatchCard()` → writes to `match_scores`
     - Computes H2H bonus → updates `h2h_pairings`
   - Updates `matches.status` to `completed`
   - Leaderboard view auto-updates (it's a Postgres view)

### Manual Fallback Fields

If the API fails entirely, admin can manually enter:
- Match winner (dropdown)
- The Call correct answer (dropdown matching answer_options)
- Chaos Ball correct answer (Yes/No)
- Individual player scores (for Villain Pick — a simple table)

---

## 11. Data Flow Summary

```
SEASON START
  ┌─────────────────────────────┐
  │ scripts/seedSchedule.js     │ → Supabase: matches (74 rows)
  │ scripts/seedSquads.js       │ → content/teams.json (squad rosters)
  │ Manual: venue O/U lines     │ → content/venues.json
  └─────────────────────────────┘

BEFORE EACH MATCH
  ┌─────────────────────────────┐
  │ questionSelector.js         │ → Supabase: match_questions (2 rows)
  │ App shows card to all users │
  │ Users submit predictions    │ → Supabase: predictions
  │ Lock at match start_time    │
  └─────────────────────────────┘

AFTER EACH MATCH
  ┌─────────────────────────────┐
  │ Admin: "Fetch Scorecard"    │ → CricketData API (1 call)
  │ parseScorecard()            │ → Supabase: matches.scorecard_json
  │ Auto-fill correct answers   │ → Supabase: match_questions.correct_answer
  │ Admin reviews + publishes   │
  │ scoreMatchCard() per user   │ → Supabase: match_scores
  │ H2H bonus computed          │ → Supabase: h2h_pairings
  │ Leaderboard view refreshes  │
  └─────────────────────────────┘

SEASON END
  ┌─────────────────────────────┐
  │ scripts/computeSeasonScores │
  │ contrarianCalc.js           │ → Supabase: season_scores
  │ Final leaderboard           │
  └─────────────────────────────┘
```

---

## 12. Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| **Admin-triggered scoring, not automated** | For a 6-person group, having the admin click "Fetch + Publish" after each match is simpler than building a cron job. It takes 30 seconds if the API works, 3 minutes with manual fallback. No infra to maintain. |
| **Raw scorecard cached in DB** | Store the full API response as JSONB. If scoring logic changes or a bug is found, scores can be recomputed from cached data without hitting the API again. |
| **Content as JSON, not DB rows** | Questions, banter, and scoring values change rarely and are the same for all users. JSON files are version-controlled, diffable, and deployable without migrations. |
| **Prediction visibility gated by match time** | RLS policy ensures nobody can see others' predictions until the match has started (lock time). Prevents copying. |
| **No real-time subscriptions for scoring** | Players check results after the match. No need for live Supabase subscriptions on match_scores. A simple page refresh or pull-to-refresh is sufficient. |
| **Leaderboard as a Postgres view** | Always consistent, never stale. No cache invalidation to worry about. Fast enough for 6 users. |
| **Vercel for hosting** | Free tier, auto-deploy from GitHub, edge functions if ever needed. React SPA with no SSR required. |

---

## 13. Environment Variables

```env
# .env.example
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_CRICAPI_KEY=your-cricketdata-api-key
```

The CricAPI key is only used in admin-triggered scripts and the admin panel. It never ships to regular users' browsers. For MVP simplicity, it can be in the client env — the free tier key has no billing risk. For v2, move to a Supabase Edge Function.

---

## 14. Development Workflow

### First-time Setup
```bash
npm create vite@latest called-it -- --template react
cd called-it
npm install @supabase/supabase-js
# Copy .env.example → .env and fill in values
# Run Supabase migration
# Run seed scripts
npm run dev
```

### Claude Code Session Flow
1. Claude Code reads `CLAUDE.md` → knows project state
2. Check `docs/` for spec questions
3. Check `content/` for data/copy questions
4. Work in `src/` for code changes
5. Update `CLAUDE.md` "Current state" section before ending session

### Testing
- Scoring engine: unit tests on `scoring.js` with fixture data
- Scorecard parser: unit tests on `parseScorecard()` with sample API responses
- Content loading: verify all `content/*.json` files parse correctly
- RLS: verify prediction visibility rules with Supabase test client

---

*Companion documents: MVP Spec (game mechanics), Design Language (visual system), Banter Library (copy source).*
