# Called It — Design Language
### Group Chat Mode · MVP

---

## 1. Design Philosophy

**The app should feel like it was built inside the group chat during the toss.**

Called It is a social prediction game for a friend group of 5–15 people. Two games in one: Season Picks (filled once before the tournament) and Match Cards (a quick 4-question card before every match). The design aesthetic sits at the intersection of Wordle, BeReal, and a WhatsApp thread that's gotten out of hand. It is not a sports data product. It is not a fantasy cricket dashboard. It is a group chat that happens to have scorekeeping.

Every design decision should pass the following test:  
*"Would this feel at home in a group chat between cricket fans?"*

If it feels like ESPN, it's too serious.  
If it feels like Duolingo, it's too gamified.  
If it feels like someone screenshotted a WhatsApp argument and turned it into an app — that's the target.

---

## 2. Tone

**Banter IS the UI.** Copy is not filler. It is the product.

- Predictions lock: *"Card locked 🔒 Arjun's on record."*
- Wrong pick: *"CSK lost. Arjun predicted CSK. Arjun is available for questions."*
- Villain Pick: *"You villain-picked Virat. Arjun villain-picked Virat. One of you will regret this."*
- Empty state: *"Nobody's filled their card yet. Typical. The match starts in 2 hours."*

Rules:
- Never say "submit". Say "lock it in."
- Never say "incorrect". Say "didn't land" or let the score speak.
- Never use loading spinners without a line of copy.
- Treat the user like a cricket fan, not a customer.
- Avoid corporate sports app language entirely (no "insights", no "analytics", no "performance").

---

## 3. Visual Identity

### Theme Name
**Group Chat Mode**

### Feel
Light mode. Warm, slightly aged off-white backgrounds — like a printed scorecard that's been in someone's pocket. Loud team-colour accents. Rounded, chunky elements. Emoji-forward. Feels handmade, not polished.

### Inspirations
- Wordle (clean constraints, one task per screen)
- BeReal (raw, social, slightly chaotic)
- Kahoot (colour as communication)
- A cricket scorecard from 2003 (warmth, texture)

---

## 4. Typography

All three fonts must be loaded. Each has a specific role — do not substitute.

| Font | Role | Usage |
|------|------|-------|
| **Bricolage Grotesque** | Display / Headings | Team names, scores, key numbers, section headers, taglines |
| **Familjen Grotesk** | Body / UI | Question text, banter copy, descriptions, labels, nav |
| **Space Mono** | Data / Labels | Point values, countdowns, stat labels, system messages, timestamps |

```
Google Fonts import:
https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&family=Familjen+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap
```

### Type Scale
| Token | Font | Size | Weight | Use |
|-------|------|------|--------|-----|
| `display-xl` | Bricolage | 32px | 800 | Score totals, win counts |
| `display-lg` | Bricolage | 24–28px | 800 | Team names, section titles |
| `display-md` | Bricolage | 20–22px | 700 | Card headers, question titles |
| `body-lg` | Familjen | 16–17px | 500 | Banter copy, main body |
| `body-md` | Familjen | 14–15px | 400 | Descriptions, subtitles |
| `body-sm` | Familjen | 12–13px | 400 | Meta, secondary info |
| `label` | Space Mono | 9–11px | 700 | Point badges, stat labels, ALL-CAPS system text |
| `mono-data` | Space Mono | 18–24px | 700 | Countdown numbers, live scores |

---

## 5. Colour System

### Base Palette (App Shell)

| Token | Value | Use |
|-------|-------|-----|
| `bg-base` | `#E8E3D8` | App background — warm off-white |
| `bg-card` | `#FFFFFF` | Card surfaces |
| `bg-muted` | `#F5F3EE` | Inactive states, unselected picks |
| `bg-input` | `#F0EDE6` | Tab bars, pill backgrounds |
| `text-primary` | `#111111` | Headings, key content |
| `text-secondary` | `#555555` | Body copy |
| `text-muted` | `#999999` | Timestamps, meta |
| `text-placeholder` | `#BBBBBB` | Empty states, hints |
| `border-subtle` | `rgba(0,0,0,0.07)` | Card borders, dividers |
| `border-focus` | `rgba(0,0,0,0.15)` | Focused inputs |

### Team Colour Tokens

Each user picks a team at onboarding. The entire app re-skins using that team's colour tokens. `primary` drives all interactive elements — buttons, countdown timers, selection states, progress indicators.

| Team | Short | primary | secondary | textOnPrimary | bg (tinted) | Notes |
|------|-------|---------|-----------|---------------|-------------|-------|
| Chennai Super Kings | CSK | `#F9CD1B` | `#1A2B6D` | `#1A2B6D` | `#FFFDF0` | Dark text on yellow |
| Mumbai Indians | MI | `#004BA0` | `#D1AB3E` | `#FFFFFF` | `#EEF4FF` | |
| Royal Challengers | RCB | `#EC1C24` | `#000000` | `#FFFFFF` | `#FFF2F2` | |
| Kolkata Knight Riders | KKR | `#3A225D` | `#F4C64E` | `#FFFFFF` | `#F5F0FF` | |
| Delhi Capitals | DC | `#0078BC` | `#EF1C25` | `#FFFFFF` | `#EEF7FF` | |
| Sunrisers Hyderabad | SRH | `#FF6B1A` | `#1C1C1C` | `#1C1C1C` | `#FFF5EE` | Dark text on orange |
| Rajasthan Royals | RR | `#E91E8C` | `#254AA5` | `#FFFFFF` | `#FFF0F8` | |
| Punjab Kings | PBKS | `#ED1B24` | `#A7A9AC` | `#FFFFFF` | `#FFF0F0` | |
| Lucknow SG | LSG | `#A72056` | `#FFCC00` | `#FFFFFF` | `#FFF0F6` | |
| Gujarat Titans | GT | `#1B3B6F` | `#27B4BC` | `#FFFFFF` | `#EEF5FF` | |

**textOnPrimary rule:** CSK and SRH use `secondary` (dark) as text on their primary button. All others use `#FFFFFF`.

**Usage pattern:**
```
Button background → team.primary
Button text → team.textOnPrimary
Selected card border → team.primary
Selected card background → team.primary + "12" (7% opacity)
Progress bar fill → team.primary
Countdown numbers → team.primary
Point badge → team.primary + "16" bg, team.primary text
Glow/shadow → team.primary + "40"–"55"
```

### Team Logos
- Source: `https://scores.iplt20.com/ipl/teamlogos/{SHORT}.png`
  - Example: `https://scores.iplt20.com/ipl/teamlogos/CSK.png`
- On coloured backgrounds (team primary): apply `filter: brightness(0) invert(1)` to render white
- On white/light backgrounds: render at natural colour
- Fallback: coloured circle with team initials in Space Mono if image fails to load
- Logos should be loaded with an image proxy (e.g. `wsrv.nl`) to handle CORS in browser context

---

## 6. Spacing & Layout

### Mobile-first
Design for 390px viewport width (iPhone 14 standard). All padding/margins should work at 375px minimum.

| Token | Value | Use |
|-------|-------|-----|
| `page-padding` | 14–18px | Left/right page margin |
| `card-padding` | 18px | Internal card padding |
| `card-gap` | 12px | Gap between stacked cards |
| `element-gap` | 8–10px | Gap within components |
| `section-gap` | 24px | Major section breaks |

### Cards
- `border-radius: 20px` — all primary cards
- `border-radius: 14px` — nested elements, secondary cards
- `border-radius: 12px` — buttons, inputs
- `border-radius: 9px` — small chips, badges, pills
- `border: 1.5px solid rgba(0,0,0,0.07)` — standard card border
- `box-shadow: 0 4px 16px rgba(0,0,0,0.05)` — card shadow

---

## 7. Component Patterns

### Team Pick Button
Two-state: unselected / selected

**Unselected:**
- Background: `#F5F3EE`
- Border: `rgba(0,0,0,0.07)`
- Transform: none

**Selected:**
- Background: `team.primary + "12"`
- Border: `team.primary` (2px)
- Transform: `scale(1.03) rotate(-1deg)` — subtle tilt confirms the pick
- Shadow: `0 8px 22px team.primary + "28"`
- Confirmation micro-copy appears below team name

**Active/tap state:** `scale(0.94)` on press.

### Countdown Timer
Three boxes (HRS / MIN / SEC), displayed in a row, equal width.

- Number: `display-xl` in `team.primary`
- Label: `label` (Space Mono, 8px, ALL CAPS, `#BBBBBB`)
- Box background: `team.primary + "0D"` (5% opacity)
- Box border: `team.primary + "22"`
- Box border-radius: 12px

### Ticker Tape
Single horizontal line in `team.primary` background. White (or `textOnPrimary`) Space Mono text. Auto-scrolls left continuously. Used at top of match cards.

```css
animation: ticker 16s linear infinite;
/* Full-width ticker strip, overflow hidden, white-space nowrap */
```

### Point Badge
```
background: team.primary + "16"
border-radius: 9px
padding: 4px 10px
font: Space Mono 11px 700
color: team.primary
content: "+10" / "+15" / "+12" etc.
```

### Progress Dots / Tabs
Thin horizontal bars (4px height) used as progress indicators within cards. Active = `team.primary`. Inactive = `team.primary + "25"`. Tappable.

### CTA Button (Primary)
```
background: team.primary
border: none
border-radius: 14px
padding: 14px
font: Bricolage Grotesque 16px 800
color: team.textOnPrimary
box-shadow: 0 6px 18px team.primary + "40"
width: 100%
```

### Tab Bar (in-card)
```
container: background #F0EDE6, border-radius 12px, padding 3px
tab: border-radius 10px, 8px vertical padding
active tab: background #FFFFFF, border 1.5px solid team.primary + "30", box-shadow 0 2px 8px rgba(0,0,0,0.08)
font: Familjen Grotesk 12px, 700 when active
```

### Hero Badge (Team Identity)
Large floating badge on the team picker / profile screen.

```
width/height: 76px
border-radius: 22px
background: linear-gradient(145deg, team.primary, team.primary + "CC")
shadow: 0 10px 28px team.primary + "50"
animation: floatBadge 3.5s ease-in-out infinite
```

```css
@keyframes floatBadge {
  0%, 100% { transform: translateY(0) rotate(-1.5deg); }
  50%       { transform: translateY(-6px) rotate(1.5deg); }
}
```

### Banter Quote Block (Tagline)
```
background: rgba(255,255,255,0.72)
border-radius: 14px
padding: 12px 14px
font: Bricolage Grotesque 14px 700 italic
color: #111
```

### Roast / Context Footer (inside banter card)
```
background: #F5F2EC
border-radius: 10px
border-left: 3px solid team.primary
padding: 10px 13px
font: Familjen Grotesk 13px
color: #777
```

---

## 8. Animation

| Name | Trigger | Effect |
|------|---------|--------|
| `slideUp` | Screen/card mount | `translateY(18px) → 0, opacity 0 → 1`, 0.3s ease |
| `fadeSlide` | Content swap (banter lines) | `translateY(8px) → 0, opacity 0 → 1`, 0.22s ease |
| `popIn` | Pick confirmed | `scale(0.88) → 1.04 → 1`, 0.2s ease — snap-back feel |
| `ticker` | Match card header | Continuous left scroll, 16s linear infinite |
| `floatBadge` | Team hero badge | Gentle vertical float + tilt, 3.5s ease-in-out infinite |
| `shimBg` | Background orb | Opacity pulse 0.06→0.13, 4s ease-in-out infinite |

**Tap feedback:** All interactive elements use `scale(0.91–0.95)` on `:active`. No duration — instant. Applied via class `.tbtn` and `.pbtn`.

---

## 9. Screen Structure

### Navigation
Bottom tab bar. 4 items:

| Tab | Icon | Label |
|-----|------|-------|
| Home | 🏏 | Home |
| Leaderboard | 🏆 | League |
| Season | 📅 | Season |
| Profile | 👤 | You |

Active tab uses `team.primary` colour. Inactive: `#BBBBBB`. Font: Familjen Grotesk 10px.

### Page Header Pattern
```
padding-top: 36px
label: Space Mono 9px, letter-spacing 3px, #999, ALL CAPS — e.g. "CALLED IT · MATCH DAY"
title: Bricolage Grotesque 22px 800 #111
subtitle: Familjen Grotesk 14px #AAA
```

### Card Stack Order (Match Day Home)
1. Active match card (with ticker, countdown, CTA)
2. Today's card summary (if submitted) or card prompt
3. Leaderboard snapshot (top 3)
4. Recent activity feed

### Season Tab
1. Season Picks card (pre-tournament: fill out picks / post-lock: tracking view)
2. Per-prediction live tracker (e.g. "Your Orange Cap pick is currently 3rd in run-scoring")
3. Points table showing Top 4 race
4. Contrarian indicator — show which of your picks are unique vs consensus

### Post-Match Reveal Screen
The centrepiece of the MVP experience. Shown to all players after match scoring completes.

1. **Your results** — each pick with ✅/❌ and points earned, animated in sequence
2. **Group split** — how everyone split on Match Winner and The Call (e.g. "4 picked MI · 2 picked CSK")
3. **Villain Pick drama** — who picked whom, who got burned, who scored +15
4. **Chaos Ball** — the weird one, who called it
5. **Leaderboard movement** — who moved up, who moved down, with +/- deltas

Each result should use `popIn` animation with staggered delay. Points appear with the `display-xl` type token in `team.primary`. The reveal should feel dramatic — not a data dump.

---

## 10. States & Edge Cases

### Prediction Lock State
- All pick inputs: `pointer-events: none`, `opacity: 0.5`
- CTA button becomes: "Card locked 🔒" — same styling, disabled
- Countdown replaced with: "Locked · Results after the match"

### Scoring In Progress
- Card shows a pulsing "Scoring in progress…" state in Space Mono

### Empty Leaderboard
*"It's early. Nobody's filled their card yet. Typical Arjun."*

### No Matches Today
*"Rest day. Come back tomorrow. Or argue about yesterday's picks in the meantime."*

---

## 11. Key Design Rules (Non-negotiable)

1. **One action per screen.** Don't crowd CTAs. Each card has one job.
2. **Team colour is the accent. Never use a generic blue for interactive states.**
3. **Copy is the product.** Every empty state, every confirmation, every error — write banter, not system messages.
4. **Mobile-first, always.** Anything wider than 430px should be centred with max-width cap, not stretched.
5. **No dark mode in v1.** The warm off-white is the brand. Don't fight it.
6. **Lock time is sacred.** Countdown and lock state must always be visually prominent. Players cannot miss it.
7. **Scores are dramatic.** When points post, they should feel like a reveal — not a data update.
