# Called It — The Pitch Report 🏏

### MVP Game Mechanics

*A fast, fun prediction game for friend groups (5–15 players). Two games in one: Season Picks (filled once before the tournament) and Match Cards (a quick 4-question card before every IPL match). Earn points for correct calls. Auto-scored via live match data. One combined leaderboard with season vs match breakdown keeps it competitive across 74 games.*

*This spec replaces v7 Game Mechanics for the MVP build. The design language doc and banter library remain valid companions.*

---

## 1. Design Principles (MVP)

**The reveal is the game, not the card.**

Every design decision serves the post-match moment — who got what right, who flopped, who's climbing the leaderboard. The card is just the setup. Keep inputs fast and outputs dramatic.

**20-second card, 20-minute conversation.**

The prediction card should take under 30 seconds to fill. The post-match results should fuel group chat conversation for the rest of the evening.

**Skip-friendly by default.**

Missing a match costs you zero points and zero guilt. No catch-up mechanics, no shields, no "best of N" calculations. You either play or you don't. The leaderboard handles the rest.

---

## 2. Onboarding

**Sign in with Google.** Supabase Google Auth. No passwords, no friction.

**Pick your name and team.** Choose a display name and your favourite IPL franchise. The entire app skins itself in your team's colours — a CSK fan sees gold and yellow, an RCB fan sees red and black.

**Fill your Season Picks.** Before Match 1, complete the Season Picks card (see Section 3). This is a one-time activity — 7 predictions about how the tournament plays out. Must be locked before the first match of the season.

---

## 3. Game 1 — Season Picks

Locked before Match 1. Filled out once, scored at tournament end. This is a **separate tab/screen** from match-day cards.

The flow mirrors how fans actually think: first pick which teams make the Top 4, then pick the winners and losers, then call the individual awards.

### Contrarian Scoring

Some picks use a **contrarian multiplier** — the fewer people in your group who made the same pick, the more you earn if you're right. This rewards bold, differentiated takes over safe consensus picks. Capped at 2× to prevent lucky guesses from dominating the leaderboard.

| How many in the group picked the same answer | Multiplier |
|---|---|
| Only you (1 of group) | 2× |
| 2 of group | 1.5× |
| 3+ of group | 1× (base) |

The multiplier scales naturally with group size. For a group of 6, a "solo pick" means 5 others disagreed. For a group of 10, it means 9 others disagreed — even more contrarian, same 3× reward.

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

This is the team villain pick. Picking a popular team to finish last is inherently contrarian — and the multiplier rewards the conviction.

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

| # | Prediction | Base (per pick) | Full (#1) | Top 3 | Top 5 | Contrarian? |
|---|-----------|----------------|-----------|-------|-------|-------------|
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

Season picks represent roughly **25–35% of a competitive total**. Meaningful, but daily match play still dominates.

---

## 4. Game 2 — Match Cards

### Match Day Flow

Before each match, every player fills out a prediction card with **4 items** (3 picks + 1 Chaos Ball). **All predictions lock at match start time** (or a set time configured by admin). Players can check the toss result, playing XI, and conditions on their own — the app doesn't need to fetch this data.

### Timeline

1. **Card opens** → Available from when the match is scheduled (or earlier that day). Villain Pick dropdown shows the full team squad (seeded at season start).
2. **Match start** → Card locks. Late submissions rejected. Countdown timer visible.
3. **Match ends** → One API call fetches the scorecard. All cards auto-scored. Players see the reveal screen.

---

## 5. The Card — 3 Picks + Chaos Ball

### Pick 1 — Match Winner

| | |
|---|---|
| **Question** | Who wins? |
| **Input** | Team A or Team B (dropdown) |
| **Points** | +10 correct · 0 wrong |
| **Hit rate** | ~60–65% for informed players |

The backbone. Every card starts here. Creates the cleanest post-match split in the group.

---

### Pick 2 — The Call

| | |
|---|---|
| **Question** | One rotating question per match, same for all players |
| **Input** | Varies — binary (Yes/No), Over/Under, team dropdown, or short category |
| **Points** | +10 correct · 0 wrong |
| **Hit rate** | Target 35–65% |

The app selects one question per match from the pool below. The same question is shown to every player — comparing picks is the fun.

#### The Call — Question Pool (15 Questions)

Questions are tagged by input type and data source for build reference.

| # | Question | Input | Approx. Hit Rate | Scoring Source |
|---|----------|-------|-------------------|----------------|
| C1 | Total sixes — Over/Under X | Over / Under (venue-adjusted line) | ~55–65% | Scorecard — sixes total |
| C2 | Top scorer's team | Team A / Team B | ~50–55% | Scorecard — top batter + team |
| C3 | Will there be a maiden over? | Yes / No | ~30–40% | Scorecard — maiden column |
| C4 | Will the match go to the last over? | Yes / No | ~35–45% | Scorecard — match progression |
| C5 | Will any bowler take 3+ wickets? | Yes / No | ~35–45% | Scorecard — bowling figures |
| C6 | Will there be a run-out? | Yes / No | ~40–50% | Scorecard — dismissal types |
| C7 | First dismissal method | Caught / Bowled / LBW / Run Out / Other | ~25–35% for Caught | Scorecard + commentary |
| C8 | Will both openers reach double figures? | Yes / No | ~45–55% | Scorecard — opening batters |
| C9 | Which team will hit more sixes? | Team A / Team B | ~45–55% | Scorecard — sixes per team |
| C10 | Total match wickets — Over/Under X | Over / Under (venue-adjusted line) | ~45–55% | Scorecard — total wickets |
| C11 | Will any single over go for 20+ runs? | Yes / No | ~25–35% | Over-by-over breakdown |
| C12 | Will the losing team's top scorer outscore the winner's? | Yes / No | ~30–40% | Scorecard — top scorers |
| C13 | Which innings will have the higher run rate? | First / Second | ~45–55% | Scorecard — run rates |
| C14 | Will any bowler concede 50+ runs? | Yes / No | ~30–40% | Scorecard — bowling figures |
| C15 | Will the team batting first win? | Yes / No | ~45–50% | Scorecard — match result |

**Selection rules:**
- One question per match, app selects it
- No repeats within the same gameweek (if 2+ matches in a week)
- O/U questions (C1, C10) use venue-adjusted lines seeded from historical data
- The question is visible to all players from the moment the card opens

**Design rule:** Both sides of every question must be a reasonable choice. If one answer wins 80%+ of the time historically, the question needs a better line or gets cut.

---

### Pick 3 — Villain Pick

| | |
|---|---|
| **Question** | Name one batter who will flop (score under 10 runs) |
| **Input** | Player dropdown (from both teams' full squads) |
| **Points** | +15 if they score under 10 · −5 if they score 30+ · 0 otherwise |
| **Optional** | Yes — players can skip this pick |

The anti-pick. You're betting against someone. This generates more conversation per unit of effort than anything else on the card. *"You villain-picked Virat?!"*

If the picked player doesn't play in the match, the Villain Pick scores 0 — no points, no penalty.

---

### Chaos Ball 🎲

| | |
|---|---|
| **Question** | One weird, specific Yes/No question, auto-generated per match |
| **Input** | Yes / No (one tap) |
| **Points** | +12 correct · 0 wrong |

Zero-thought, one-tap addition. Gives everyone something odd to watch for during the match.

#### Chaos Ball — Question Pool (20 Questions)

All questions are Yes/No. Prioritise Tier 1 and Tier 2 for MVP — these are verifiable without ball-by-ball data.

**Tier 1 — Scorecard-Verifiable (always available)**

| # | Question | Approx. Probability |
|---|----------|---------------------|
| CB1 | Will there be a golden duck? | ~25–35% |
| CB2 | Will the top scorer be an opener? | ~40–50% |
| CB3 | Will the winning team's captain score 25+? | ~35–45% |
| CB4 | Will any batter face 40+ balls? | ~45–55% |
| CB5 | Will the top wicket-taker be a spinner? | ~30–40% |
| CB6 | Will both teams score 160+? | ~30–40% |
| CB7 | Will total extras exceed 20? | ~30–40% |
| CB8 | Will any batter hit 4+ sixes? | ~35–45% |
| CB9 | Will the match have zero maiden overs? | ~55–65% |

**Tier 2 — Commentary-Verifiable (preferred)**

| # | Question | Approx. Probability |
|---|----------|---------------------|
| CB10 | Will there be a wide in the first over? | ~35–45% |
| CB11 | Will there be a DRS review? | ~60–70% |
| CB12 | Will a DRS review overturn the on-field decision? | ~25–35% |
| CB13 | Will any batter hit three boundaries in a single over? | ~40–50% |
| CB14 | Will there be a stumping? | ~15–25% |
| CB15 | Will there be a direct-hit run-out? | ~15–25% |

**Tier 3 — Live Feed Only (deferred to post-MVP if ball-by-ball API is reliable)**

| # | Question | Approx. Probability |
|---|----------|---------------------|
| CB16 | Will the first ball of the match be a dot ball? | ~55–65% |
| CB17 | Will there be a six in the first over? | ~20–30% |
| CB18 | Will the first boundary be a six (not a four)? | ~25–35% |
| CB19 | Will any batter hit a boundary off a free hit? | ~30–40% |
| CB20 | Will there be a six in the final over? | ~50–60% |

**Selection rules:**
- One question per match, randomly selected
- MVP: draw only from Tier 1 and Tier 2 (14 questions)
- Tier 3 added when ball-by-ball data is confirmed reliable

---

## 6. Scoring Summary

### Per-Match Points (Game 2)

| Source | If Correct | If Wrong | Max per Match |
|--------|-----------|----------|---------------|
| Match Winner | +10 | 0 | 10 |
| The Call | +10 | 0 | 10 |
| Villain Pick | +15 (under 10 runs) | −5 (30+ runs) | 15 |
| Chaos Ball | +12 | 0 | 12 |
| **Total** | | | **47** |

**Realistic per-match range:** 0–47 pts. Expected average for an informed player: ~15–25 pts.

### Season Points (Game 1)

Scored once at tournament end. See Section 3 for full breakdown.

| Source | Realistic Range | Max Possible |
|--------|----------------|--------------|
| Team predictions (Top 4 + Champion + Runner-Up) | 130–420 | 420 |
| Wooden Spoon (contrarian) | 0–100 | 100 |
| Player awards (contrarian, partial credit) | 60–300 | ~660 |
| **Season total** | **~200–700** | **~1,180** |

### Combined Leaderboard

| Source | Share of Competitive Total | Notes |
|--------|---------------------------|-------|
| Match Cards (cumulative) | ~55–65% | Daily grind. Dominates. |
| Season Picks | ~25–35% | One-time. Rewards knowledge + contrarian thinking. |
| H2H Rivalry Bonus | ~5–10% | Social stakes layer. |

The leaderboard shows one combined total with a **season vs match breakdown** visible per player. "Priya is #1 overall — 60% from match cards, 40% from a huge season game."

**No multipliers.** No Joker, no Fan Boost. No best-of-N. Cumulative total is the leaderboard.

---

## 7. Head-to-Head Rivalry

Random pairings within the group, rotated **monthly**.

- Higher scorer in the pair gets **+10 per match** (both must have submitted a card).
- Monthly cycle winner gets **+75 lump sum**.
- Displayed on leaderboard with W/L record.

For odd-numbered groups: one person gets a bye each cycle, or a three-way rivalry (highest scorer of the three gets the +10).

---

## 8. Leaderboard

**Live leaderboard** — cumulative points, updated after every match.

What it shows:
- Total points (rank-ordered) with **season vs match breakdown**
- Matches played count
- Current H2H pairing and cycle score
- Last match score (for at-a-glance "how did everyone do tonight")
- Season prediction tracker (how your picks are trending — e.g. "Your Orange Cap pick is currently 3rd in run-scoring")

### Post-Match Reveal Screen

This is the centrepiece of the experience. After every match, each player sees:

1. **Their results** — each pick with ✅/❌ and points earned
2. **Group comparison** — how everyone split on Match Winner and The Call
3. **Villain Pick drama** — who picked whom, who got burned
4. **Chaos Ball** — the weird one, who called it
5. **Leaderboard movement** — who moved up, who moved down

The reveal screen is where the banter copy does its heaviest work. Every result line should read like a group chat message, not a data table.

---

## 9. Technical Implications (for companion tech spec)

### Stack

- **Frontend:** React web app. Team-themed UI per user.
- **Backend:** Supabase (auth, database, real-time).
- **Auth:** Google Sign-In via Supabase Auth.
- **Cricket Data:** CricketData.org (free tier — `api.cricapi.com/v1/`).

### Data Strategy

The app follows a **seed-once, score-once** model. The Supabase database is the source of truth. The cricket API is only used to seed the schedule at season start and fetch one scorecard per match after it ends.

**Seed once at season start (stored in Supabase):**

| Data | API Call | Frequency |
|------|----------|-----------|
| IPL 2026 schedule (74 matches — dates, venues, teams) | `/v1/series_info?id={ipl_series_id}` | Once |
| Team squads (full rosters, ~25 players each) | `/v1/match_squad?id={match_id}` or manual entry | Once |
| Venue metadata (for O/U line generation) | Manual — historical averages per ground | Once |

**After each match (1 API call):**

| Data | API Call | Frequency |
|------|----------|-----------|
| Full scorecard | `/v1/match_scorecard?id={match_id}` | 1× per match |

That's it. **1 API call per match day.** 74 total calls for the entire IPL season. The free tier allows 100 calls/day — massively sufficient.

**Never fetched from API (derived from data already in Supabase):**
- O/U lines — calculated from venue data seeded at start
- The Call / Chaos Ball questions — selected by app logic from the question pool
- Season standings (points table) — derived from match results already stored
- Orange Cap / Purple Cap / Most Sixes tracking — accumulated from scorecard data across matches
- Contrarian multipliers — computed from group picks stored in Supabase

### Scorecard → Scoring Resolution

One `/v1/match_scorecard` call returns batting cards, bowling cards, dismissal methods, extras, and match result. Here's how each pick resolves from that single response:

| Pick | What to extract from scorecard |
|------|-------------------------------|
| **Match Winner** | Winning team from match result |
| **Villain Pick** | Individual batter's runs — check if under 10 or 30+ |
| **The Call: Sixes O/U** | Sum of 6s column across both batting cards |
| **The Call: Top scorer's team** | Highest run scorer → which team they belong to |
| **The Call: Maiden over** | Maidens column in bowling card |
| **The Call: 3+ wickets** | Wickets column in bowling card |
| **The Call: Run-out** | Dismissal descriptions in batting card |
| **The Call: First dismissal method** | First dismissal entry in first innings batting card |
| **The Call: Both openers double figures** | Runs for batters #1 and #2 in each innings |
| **The Call: Bowler conceded 50+** | Runs column in bowling card |
| **The Call: Match wickets O/U** | Sum of all wickets across both innings |
| **The Call: Which team hit more sixes** | 6s per team from batting cards |
| **The Call: Team batting first wins** | Match result + toss/batting order |
| **The Call: Which innings higher run rate** | Runs and overs per innings |
| **The Call: Losing team's top scorer beats winner's** | Top scorer per team from batting cards |
| **Chaos Ball: Golden duck** | Batter with 0 runs and 1 ball faced |
| **Chaos Ball: Top scorer is opener** | Highest scorer's batting position |
| **Chaos Ball: Captain scored 25+** | Captain's runs (captain identified from squad data) |
| **Chaos Ball: 4+ sixes by one batter** | 6s column per batter |
| **Chaos Ball: Zero maidens** | Maidens column — all zeros |
| **Chaos Ball: Both teams 160+** | Innings totals |
| **Chaos Ball: Extras exceed 20** | Extras from both innings |
| **Season: Orange/Purple Cap** | Accumulate runs/wickets per player across all stored scorecards |
| **Season: Most Sixes** | Accumulate 6s per player across all stored scorecards |

### Villain Pick — Squad Dropdown

Players pick from the **full team squad** (seeded at season start), not the confirmed playing XI. If a player picks someone who didn't play, the Villain Pick scores 0 (no points, no penalty). This removes the need to fetch playing XI data from the API before each match.

### API Provider Details

**Provider:** CricketData.org (formerly CricAPI)
**Base URL:** `https://api.cricapi.com/v1/`
**Auth:** API key passed as query parameter (`?apikey={key}`)
**Plan:** Lifetime Free — 100 hits/day, all features included
**Cost:** $0
**Upgrade path:** $5.99/mo for 2,000 hits/day if free tier proves unreliable

**Key endpoints used:**

| Endpoint | Purpose | When |
|----------|---------|------|
| `/v1/series?apikey={key}` | Find IPL 2026 series ID | Once |
| `/v1/series_info?apikey={key}&id={series_id}` | Full match schedule | Once |
| `/v1/match_squad?apikey={key}&id={match_id}` | Team squads | Once per team |
| `/v1/match_scorecard?apikey={key}&id={match_id}` | Post-match scorecard | Once per match |

**Known limitations:**
- Data is a few minutes behind real-time (fine — we only score post-match)
- Volunteer-run with no SLA (admin fallback covers this)
- No player photos (not needed for MVP)
- Free tier is daily quota, not hourly/monthly

### Admin Fallback

If the API is down or returns incomplete data after a match, admin opens the scoring panel and enters results manually from any public scorecard (ESPNcricinfo, Google scores, IPL app). For a 6-person friend group, this is 2–3 minutes of work. The app never goes down.

Admin panel shows:
- **Status per question:** ✅ auto-scored / ⚠️ pending / 🔴 needs manual input
- **One-click override** for any question
- **"Publish scores"** button — all player cards re-score and leaderboard updates

### Data Model — Simplified

- **User:** google_auth_id, display_name, team
- **Match:** id, date, venue, team_a, team_b, status (upcoming/live/completed), scorecard_json (raw API response cached)
- **Team Squad:** team_id, player_id, player_name, role (batter/bowler/all-rounder/wicketkeeper)
- **The Call Question:** match_id, question_id (from pool), display_text, answer_options, correct_answer
- **Chaos Ball Question:** match_id, question_id (from pool), display_text, correct_answer
- **Prediction Card:** user_id, match_id, match_winner_pick, the_call_pick, villain_pick_player (nullable), chaos_ball_pick, submitted_at
- **Match Result:** match_id, winner, the_call_result, chaos_ball_result, player_scores (derived from scorecard_json)
- **Match Score:** user_id, match_id, winner_pts, call_pts, villain_pts, chaos_pts, total
- **Season Prediction:** user_id, top_4_teams (4), champion, runner_up, wooden_spoon, orange_cap_picks (3), purple_cap_picks (3), most_sixes_picks (3), locked_at
- **Season Score:** user_id, per-prediction points (base × contrarian multiplier), total
- **H2H Pairing:** user_a, user_b, cycle_start, cycle_end, per_match_results
- **Leaderboard:** computed view — sum of all match scores + season prediction scores + H2H bonuses, with season vs match breakdown

### Scoring Engine

All picks follow the same lifecycle: **lock before match → score after match.**

No mid-match dependencies. No async scoring delays in MVP (POTM has been removed). All results can be resolved from a standard scorecard within minutes of match end.

### Contrarian Multiplier Computation

At season end, for each contrarian-eligible prediction:
1. Count how many players in the group made the same pick
2. Apply the multiplier tier (solo = 2×, 2 = 1.5×, 3+ = 1×)
3. Multiply base points (after partial credit, if applicable) by the tier

For player awards with 3 picks each: contrarian count is computed **per player picked**, not per category. If 3 people picked Kohli for Orange Cap and you're the only one who picked Gill, your Gill pick gets the solo multiplier regardless of what happened with your other 2 picks.

### O/U Line Generation

For The Call questions C1 (sixes) and C10 (wickets): venue-adjusted lines should be seeded at season start from historical venue data. Lines can be a simple lookup table by venue, refreshed if needed mid-season.

---

## 10. What's Explicitly Out of Scope (MVP)

These are all good ideas parked for v2. They are not in the build.

| Feature | Why it's out |
|---------|-------------|
| Bonus picks (3-of-5, wager/bold/all-or-nothing types) | Too much input. Strategic depth is a v2 unlock once the group is hooked. |
| Fan Boost | Adds a decision layer that complicates per-match scoring. |
| Joker Round | Same — multiplier mechanics need a baseline to multiply. |
| Streak Bonus + Streak Shield | Rewards consistency but adds tracking complexity. |
| Best 55 of 74 | Skip = 0 is simpler and the group feedback said "just let me skip." |
| Score floor (−30) | No floor needed when max downside is −5 (Villain Pick). |
| Duck Watch (as separate question) | Lives on as a Chaos Ball question (CB1: golden duck). |
| POTM pick | 30–60 min scoring delay is bad UX when the #1 priority is fast reveals. |
| Weekly badge ("Top of the Over") | Nice-to-have. Not core loop. |
| Category accuracy stats | Requires more picks to be meaningful. v2 when card expands. |

---

## 11. v2 Expansion Path

Once the MVP is live and the group is engaged, these are the natural next additions — roughly in order of "adds the most fun per unit of complexity":

1. **Fan Boost** — +50% on core picks for your team's match, 1x/week. Adds a strategic layer.
2. **Expand The Call to 2 questions** — the card grows from 4 items to 5. Only do this if the group asks for more.
3. **Bonus pick (optional, 1 question)** — a single high-risk/high-reward pick with upside and downside. Opt-in.
4. **Streak Bonus** — consecutive correct Match Winner picks earn escalating points.
5. **Joker Round** — triple all points for one match per season. Only once streaks exist to protect.
6. **Chaos Ball Tier 3** — unlock ball-by-ball questions once API reliability is confirmed.
7. **Season Picks expansion** — mid-season prediction window, additional award categories, Flop XI.
8. **Full bonus system (3-of-5)** — the v7 strategic centrepiece. Only when the group is ready for it.

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

---

*Companion documents: Design Language (unchanged), Banter Library (unchanged), Technical Spec (to be updated for MVP scope).*
*Cricket data: CricketData.org free tier (api.cricapi.com/v1/).*
