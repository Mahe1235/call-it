# Called It — The Pitch Report 🏏

### MVP Game Mechanics

*A fast, fun prediction game for friend groups (5–15 players). Two games in one: Season Picks (filled once before the tournament) and Fantasy XI (a season-long squad, scored match by match). Earn points for correct predictions and strong player picks. Auto-scored after every match via live scorecard data. One combined leaderboard keeps it competitive across 74 games.*

*This spec reflects the final MVP build. Match Cards (per-match prediction cards) were designed, prototyped, and ultimately dropped in favour of Fantasy XI as the per-match scoring layer — it generates more sustained engagement and doesn't require players to submit before every single match.*

---

## 1. Design Principles (MVP)

**The reveal is the game, not the card.**

Every design decision serves the post-match moment — who racked up points tonight, who's climbing the leaderboard. The card is just the setup. Keep inputs fast and outputs dramatic.

**Season-long skin in the game.**

Fantasy XI gives every player a reason to care about every match, even ones where their own team isn't playing. Your squad is on the field every night.

**Skip-friendly by default.**

Missing a match costs you zero guilt. Fantasy XI accrues automatically — you pick once and the points flow. Season Picks score themselves at tournament end. No catch-up mechanics, no shields.

---

## 2. Onboarding

**Sign in with Google.** Supabase Google Auth. No passwords, no friction.

**Pick your name and team.** Choose a display name and your favourite IPL franchise. The entire app skins itself in your team's colours — a CSK fan sees gold and yellow, an RCB fan sees red and black.

**Two things to do before Match 1:**
1. **Fill your Season Picks** — 7 predictions about how the tournament plays out. Locked before the first match, scored at tournament end.
2. **Pick your Fantasy XI** — an 11-player squad (with Captain and Vice Captain) for the whole season. Lock it before Match 1. Points accumulate automatically after every match.

---

## 3. Game 1 — Season Picks

Locked before Match 1. Filled out once, scored at tournament end. This is the **Season** tab.

The flow mirrors how fans actually think: first pick which teams make the Top 4, then pick the winners and losers, then call the individual awards.

### Contrarian Scoring

Some picks use a **contrarian multiplier** — the fewer people in your group who made the same pick, the more you earn if you're right. This rewards bold, differentiated takes over safe consensus picks. Capped at 2× to prevent lucky guesses from dominating the leaderboard.

| How many in the group picked the same answer | Multiplier |
|---|---|
| Only you (1 of group) | 2× |
| 2 of group | 1.5× |
| 3+ of group | 1× (base) |

### Team Predictions (Flat Scoring)

| # | Prediction | Input | Points |
|---|-----------|-------|--------|
| 1 | **Top 4 Teams** (pick 4 teams to qualify for playoffs) | 4 × Team dropdown | 30 pts per correct team (max 120) |
| 2 | **Tournament Champion** | Team dropdown | 200 |
| 3 | **Runner-Up** | Team dropdown | 100 |

### Wooden Spoon (Contrarian Scoring)

| # | Prediction | Input | Base Points | Solo (2×) | 2 of group (1.5×) | 3+ (1×) |
|---|-----------|-------|-------------|-----------|---------------------|---------|
| 4 | **Wooden Spoon** (last place) | Team dropdown | 50 | 100 | 75 | 50 |

### Player Award Predictions (Contrarian Scoring, Top 3 Picks)

For each player award, you pick **3 players**. Each pick is scored independently with partial credit, then the contrarian multiplier applies per pick.

**Partial credit tiers (per pick, before contrarian multiplier):**

| Result | Points |
|--------|--------|
| Your pick finishes #1 | Full base |
| Finishes #2–3 | Half base |
| Finishes #4–5 | Quarter base |
| Outside top 5 | 0 |

**Player award categories:**

| # | Prediction | Base (per pick) | #1 | Top 3 | Top 5 | Contrarian? |
|---|-----------|----------------|-----|-------|-------|-------------|
| 5 | **Orange Cap** (most runs) — pick 3 players | 40 | 40 | 20 | 10 | Yes |
| 6 | **Purple Cap** (most wickets) — pick 3 players | 40 | 40 | 20 | 10 | Yes |
| 7 | **Most Sixes in Tournament** — pick 3 players | 30 | 30 | 15 | 8 | Yes |

**Example:** You pick Player X for Orange Cap. Nobody else in your group picked Player X. Player X finishes #2 in run-scoring. You earn: 20 (half base for top 3) × 2 (solo contrarian) = **40 pts** for that one pick.

### Season Scoring Summary

| Scenario | Approximate Points |
|----------|-------------------|
| **Max possible** (everything exact, all solo picks) | ~1,180 |
| **Strong season** (Champion + 3 of 4 playoff teams + good contrarian player picks) | ~500–700 |
| **Decent season** (2 playoff teams + runner-up + a few top-5 player hits) | ~200–350 |
| **Casual player** (1 playoff team + a couple of partial credit player hits) | ~50–100 |

---

## 4. Game 2 — Fantasy XI

Pick a squad of **11 players** before the season. One squad for all 74 matches. It accrues points automatically after every match via the scorecard.

### The XI — Composition Rules

| Role | Min | Max |
|------|-----|-----|
| Wicket-Keepers (WK) | 1 | 4 |
| Batsmen (BAT) | 3 | 6 |
| All-Rounders (AR) | 1 | 4 |
| Bowlers (BWL) | 3 | 6 |
| **Overseas players** | 0 | **4** |

The overseas cap mirrors IPL playing regulations — no more than 4 non-Indian players in a playing XI.

### Captain & Vice Captain

Designate one **Captain (2×)** and one **Vice Captain (1.5×)**. Their raw score for each match is multiplied before being added to your total.

### Scoring — Batting

| Action | Points |
|--------|--------|
| Per run | +1 |
| Boundary (4) | +1 |
| Six | +2 |
| 25 runs | +4 bonus |
| 50 runs | +4 more (+8 total over 50) |
| 100 runs | +8 more (+16 total over 100) |
| Duck (faced ≥1 ball, scored 0) | −2 |

**Milestones are additive.** A century earns all three milestone bonuses (+28 total in addition to run points).

**Strike Rate bonus/penalty** (minimum 10 balls faced):

| Strike Rate | Points |
|-------------|--------|
| ≥ 170 | +6 |
| ≥ 150 | +4 |
| ≥ 130 | +2 |
| < 70 | −2 |
| < 60 | −4 |
| < 50 | −6 |

### Scoring — Bowling

| Action | Points |
|--------|--------|
| Per wicket | +25 |
| LBW or bowled dismissal bonus | +8 each |
| Maiden over | +12 |

**Wicket haul bonus** (non-cumulative — highest bracket only):

| Wickets | Bonus |
|---------|-------|
| 2 wickets | +4 |
| 3 wickets | +8 |
| 4 wickets | +12 |
| 5 wickets | +20 |

**Economy rate bonus/penalty** (minimum 2 overs bowled):

| Economy | Points |
|---------|--------|
| < 5 | +8 |
| < 6 | +6 |
| < 7 | +2 |
| ≥ 9 | −2 |
| ≥ 10 | −4 |
| ≥ 11 | −6 |

### Scoring — Fielding

| Action | Points |
|--------|--------|
| Catch | +8 |
| Stumping | +12 |
| Run-out | +8 |

*Run-outs are not split into direct/indirect — CricAPI doesn't distinguish. All run-outs award +8 (midpoint between the typical +12 direct / +6 indirect split).*

### Timeline

- **Before Match 1:** Pick XI, set Captain and Vice Captain.
- **Until Match 1 ball 1:** Edits allowed (in the app, gated by `seasonStarted`).
- **Once season starts:** XI is locked for the season.
- **After every match:** Admin fetches the scorecard → scores are computed and published to `fantasy_xi_scores`.

### Example — Sunil Narine (44 off 18, 3/13 with 1 LBW + 2 bowled)

| Category | Calc | Points |
|----------|------|--------|
| Runs | 44 × 1 | +44 |
| Boundaries | 2 × 1 | +2 |
| Sixes | 5 × 2 | +10 |
| Milestone 25 | | +4 |
| SR 244 (≥170) | | +6 |
| **Batting total** | | **+66** |
| Wickets | 3 × 25 | +75 |
| LBW/bowled | (1+2) × 8 | +24 |
| 3-wicket haul | | +8 |
| Economy 3.25 (<5) | | +8 |
| **Bowling total** | | **+115** |
| **Raw total** | | **181 pts** |
| As Captain | × 2 | **362 pts** |

---

## 5. Scoring Summary

### Fantasy XI Points (Game 2)

Scored after every match. Accumulates across the season.

| Category | Key awards | Notes |
|----------|-----------|-------|
| Batting | +1/run, +1/boundary, +2/six | SR bonus/penalty on ≥10 balls |
| Milestones | +4 at 25, +8 at 50, +16 at 100 | Additive |
| Bowling | +25/wkt, +8 LBW/bowled bonus | Economy bonus/penalty on ≥2 overs |
| Haul bonus | +4 to +20 (2–5 wickets) | Non-cumulative, highest bracket only |
| Fielding | +8 catch, +12 stumping, +8 run-out | |
| Captain | 2× raw score | |
| Vice Captain | 1.5× raw score | |

### Season Points (Game 1)

Scored once at tournament end. See Section 3 for full breakdown.

| Source | Realistic Range | Max Possible |
|--------|----------------|--------------|
| Team predictions (Top 4 + Champion + Runner-Up) | 130–420 | 420 |
| Wooden Spoon (contrarian) | 0–100 | 100 |
| Player awards (contrarian, partial credit) | 60–300 | ~660 |
| **Season total** | **~200–700** | **~1,180** |

### Combined Leaderboard

| Source | Notes |
|--------|-------|
| Fantasy XI (cumulative match-by-match) | Scores automatically after each match |
| Season Picks | Scored once at tournament end |

---

## 6. Leaderboard

**Live leaderboard** — cumulative points, updated after every match scoring run.

What it shows:
- Total points (rank-ordered) with **Fantasy XI vs Season Picks breakdown**
- Matches played count
- Per-player Fantasy XI score (in the Fantasy XI tab)
- Season prediction tracker (how your picks are trending — e.g. "Your Orange Cap pick is currently 3rd in run-scoring")

---

## 7. Technical Implications

### Stack

- **Frontend:** React 18 + Vite 5 (SPA, no SSR). Mobile-first, max-width 430px.
- **Backend:** Supabase (Postgres + Auth + RLS + Realtime).
- **Auth:** Google Sign-In via Supabase Auth.
- **Cricket Data:** CricketData.org (free tier — `api.cricapi.com/v1/`).
- **Hosting:** Vercel.

### Data Strategy

The app follows a **seed-once, score-once** model.

**Seed once at season start:**

| Data | How |
|------|-----|
| IPL 2026 schedule (74 matches) | `npm run seed:schedule` |
| Team squads (full rosters, ~25 players each + overseas flags) | `content/teams.json` (manual, seeded from API) |
| Venue metadata (O/U lines for The Call — unused now) | `content/venues.json` |

**After each match (1 API call):**

```
GET /v1/match_scorecard?apikey={key}&id={api_match_id}
```

Admin panel has a **"🔄 Fetch from API"** button that calls `cricketApi.fetchFantasyScorecard()`, which:
1. Merges `batting[]`, `bowling[]`, `catching[]` per player across both innings
2. Indexes `altnames` for alternate player name spellings
3. Returns per-player objects in our scoring engine format

**Never fetched from API (derived or manual):**
- Orange Cap / Purple Cap / Most Sixes tracking — accumulated from scorecard data
- Contrarian multipliers — computed from group picks in Supabase
- Match winner for season picks — entered manually by admin

### Scoring Engine

**`src/lib/fantasyScoring.js`** — pure functions, no side effects:
- `scoreFantasyPlayer(player)` → `{ total, batting, bowling, fielding }`
- `buildPlayerScoreMap(scorecard)` → `{ name.toLowerCase() → scores }`
- `computeUserFantasyScore(picks, playerScoreMap)` → `{ total, breakdown }`
- `computeAllFantasyXIScores(allPicks, scorecard)` → sorted array

**`src/lib/scoring.js`** — season picks scoring:
- `scoreMatchCard()` — legacy, no longer used for active play
- `scoreSeasonPicks()` — season prediction scoring with contrarian multipliers

**`content/scoring.json`** — all point values in one place. Edit to tune without touching code.

### Name Matching

Squad names in `content/teams.json` were seeded from CricAPI. The match scorecard uses the same canonical `name` field. The adapter also indexes `altnames` from the API response, so alternate spellings resolve correctly.

### API Provider Details

**Provider:** CricketData.org (CricAPI)
**Base URL:** `https://api.cricapi.com/v1/`
**Plan:** Lifetime Free — 100 hits/day
**IPL 2026 series ID:** `87c62aac-bc3c-4738-ab93-19da0690488f`

### Admin Workflow (per match)

1. Open `/admin`, select the completed match.
2. Click **"🔄 Fetch from API"** — scorecard populates automatically.
3. Review the JSON in the textarea (edit if needed — rare).
4. Click **"Preview Scores"** under Fantasy XI section → expandable breakdown table.
5. Click **"Publish XI Scores"** → upserted to `fantasy_xi_scores`.
6. Optionally enter winner + season pick answers → Publish match scores.

### Database Tables

| Table | Purpose |
|-------|---------|
| `matches` | Schedule, status, winner, scorecard_json, api_match_id |
| `users` | Profile, display_name, team, is_admin |
| `fantasy_xi_picks` | user_id, players[], captain, vice_captain, locked |
| `fantasy_xi_scores` | user_id, match_id, breakdown jsonb, total_pts |
| `season_predictions` | user_id, all prediction fields, locked_at |
| `season_scores` | user_id, per-prediction points, total |
| `match_scores` | user_id, match_id, legacy match card scores |
| `leaderboard` | Postgres view — always fresh, no cache |

---

## 8. What's Out of Scope (MVP)

### Explicitly Abandoned After Prototyping

| Feature | Decision |
|---------|----------|
| **Match Cards** (Winner Pick, The Call, Villain Pick, Chaos Ball) | Built and dropped. Requires players to submit before every match — too much friction for a casual friend group. Fantasy XI gives the same "skin in every game" feeling without the per-match submission burden. |
| **Head-to-Head Rivalry** | Dropped with Match Cards (H2H was based on per-match scores). |
| **Contrarian multiplier on Match Cards** | Not relevant without Match Cards. |

### Never Built (v2 Candidates)

| Feature | Why it's out |
|---------|-------------|
| Fan Boost | Strategic depth for v2 once the group is hooked. |
| Joker Round | Multiplier mechanics need a baseline to multiply. |
| Streak Bonus | Adds tracking complexity. |
| Ball-by-ball Chaos Ball questions | Deferred until API reliability confirmed. |
| Mid-season Fantasy XI transfers | v2 feature — adds management depth. |
| Category accuracy stats per player | Requires more data points to be meaningful. |
| POTM pick | 30–60 min scoring delay is bad UX. |

---

## 9. v2 Expansion Path

1. **Mid-season Fantasy XI transfers** — allow 1–2 transfers per month.
2. **Bench players** — pick 15 players with 4 on the bench. Auto-substitute if a picked player doesn't play.
3. **Match-week mini-leagues** — per-gameweek Fantasy XI contest alongside season-long.
4. **Fan Boost** — +50% on your team's match, once per season.
5. **Season Picks expansion** — mid-season prediction window, additional award categories.
6. **Match Card reintroduction** — if the group asks for more to do on match nights. One question ("What's your call on tonight's match?") as a social layer, not scoring.

---

## Appendix: Key IPL Reference Data

| Metric | Value |
|--------|-------|
| Average sixes/match (2024) | ~17 per match |
| Average sixes/match (2023) | ~15.2 per match |
| Teams choosing to chase after toss win | ~53% win rate |
| Toss winner = match winner correlation | ~50–55% |
| 200+ innings frequency (post-Impact Player rule) | ~36.6% |
| Players per match (both squads) | 22 |
| Overseas player cap per playing XI | 4 |

---

*Companion documents: Design Language (unchanged), Banter Library (partially valid — match card copy is deprecated), Technical Spec (separate, mirrors this doc's tech section).*
*Cricket data: CricketData.org free tier (api.cricapi.com/v1/).*
