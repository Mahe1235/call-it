# Pre-Season Checklist

Everything to do before IPL 2026 Match 1 goes live. Work through this top to bottom.

---

## 1. Remove test data

The app ships with fake matches (M90–M97) and fake users for testing. **Delete them before the real season.**

```bash
# Removes M90–M94, all predictions, scores, and test users (Priya/Karan/Sneha)
npm run seed:test:reset
```

> Rahul's account (`rahul@called-it.test`) is kept — use it to stay logged in during the reset process.

After running, verify in Supabase dashboard:
- `matches` table has no rows with `match_number` 90–97
- `match_scores` table is empty
- `predictions` table is empty
- `users` table has only real players (you + friends)

---

## 2. Set up real player accounts

Each player needs a Google account to sign in (the app uses Google OAuth via Supabase).

Steps:
1. Share the app URL with each player
2. They sign in with Google — this auto-creates their `users` row
3. They complete onboarding (display name + team)

After everyone's signed up, check `public.users` in Supabase — you should see one row per player.

**Make admins:** Run this SQL for each admin (currently Mahendra + Rahul):
```sql
UPDATE public.users SET is_admin = true WHERE id = '<user-uuid>';
```

---

## 3. Seed the real IPL 2026 schedule

```bash
# Preview first — no writes
npm run seed:schedule -- --series-id 87c62aac-bc3c-4738-ab93-19da0690488f --dry-run

# Seed for real
npm run seed:schedule -- --series-id 87c62aac-bc3c-4738-ab93-19da0690488f
```

Verify in Supabase:
- `matches` table has upcoming IPL fixtures (match_number 1–74 as CricAPI releases them)
- `match_questions` table has 2 rows per match (1 `the_call` + 1 `chaos_ball`)
- `correct_answer` is `null` for all — set by admin after each match

> CricAPI releases fixtures gradually. Re-run `seed:schedule` every few weeks. It's idempotent.

---

## 4. Seed team squads

Player squads power the villain picker dropdown in the Match Card.

```bash
# First time: find each team's CricAPI ID
node scripts/seedSquads.js --find-team "Chennai Super Kings"
# → copy the UUID into content/teams.json → "apiTeamId": "<uuid>"
# Do this for all 10 teams, then commit

# Then fetch squads
npm run seed:squads
```

Verify: open `content/teams.json` — each team's `squad` array should have 15–20 players.

---

## 5. Season predictions window

The **Season Picks** page opens immediately — players can submit season predictions the moment they sign up. The window closes when you manually set it (no automatic lock yet).

Before Match 1:
- Make sure all players have submitted their season picks
- Check `season_predictions` table in Supabase — one row per player

---

## 6. Final smoke-test before Match 1

Log in as each player and check:

| Page | What to verify |
|------|---------------|
| Home | Match carousel shows upcoming matches with correct teams + dates |
| Home → Match Card | Villain picker shows squad players, submit works |
| Season | Form is open (not locked) |
| League | Leaderboard shows all players at 0 pts |
| League → Points Race | Empty state ("No matches scored yet") |
| You | Profile shows correct name + team |

---

## 7. Match day flow (every match)

1. **Before match starts** — players submit picks on Home page. Card auto-locks when you set the match to `live` in Admin.
2. **During match** — no action needed.
3. **After match** — admin:
   a. Go to `/admin` (linked from You page)
   b. Select the match
   c. Paste scorecard JSON (or fetch automatically if CricAPI has it)
   d. Set winner (click team button)
   e. Set correct answers for The Call and Chaos Ball
   f. Click **Preview Scores** — review the table
   g. Click **Publish** — scores written, match marked completed

Players immediately see the reveal on Home page.

---

## 8. Files to delete before season

These files are **test-only** and should be removed:

```bash
# Delete the script itself after running --reset
rm scripts/seedTestData.js
# Remove the npm shortcuts from package.json too:
#   "seed:test" and "seed:test:reset"
```

Also remove from `package.json`:
```json
"seed:test": "node scripts/seedTestData.js",
"seed:test:reset": "node scripts/seedTestData.js --reset"
```

---

## Quick reference

| Task | Command |
|------|---------|
| Remove test data | `npm run seed:test:reset` |
| Seed schedule | `npm run seed:schedule -- --series-id 87c62aac-bc3c-4738-ab93-19da0690488f` |
| Seed squads | `npm run seed:squads` |
| Run dev server | `npm run dev` |
| Deploy | Push to `master` → Vercel auto-deploys |

| URL | Purpose |
|-----|---------|
| `/` | Home — match card |
| `/league` | Leaderboard + points race |
| `/season` | Season picks |
| `/admin` | Scoring panel (admin only) |

| Supabase table | Purpose |
|----------------|---------|
| `matches` | All IPL fixtures + status + winner + scorecard_json |
| `match_questions` | The Call + Chaos Ball per match |
| `predictions` | All player picks |
| `match_scores` | Scored results per player per match |
| `season_predictions` | Season picks (one row per player) |
| `leaderboard` | Postgres view — sum of all match_scores |

---

## Admin credentials

| Person | Email | Admin? |
|--------|-------|--------|
| Mahendra | mahendrab1094@gmail.com | ✅ |
| Rahul (test) | rahul@called-it.test | ✅ |

> The admin panel is at `/admin` and linked from the You page when `is_admin = true`.
