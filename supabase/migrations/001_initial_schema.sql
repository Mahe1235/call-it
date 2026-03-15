-- ════════════════════════════════════════════════════════════════
--  Call-It — Initial Schema Migration
--  Run in Supabase SQL Editor (or via supabase db push)
-- ════════════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── 1. USERS ────────────────────────────────────────────────────
-- Extends Supabase auth.users with app-specific profile data
create table if not exists public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null,
  team          text not null check (team in ('csk','mi','rcb','kkr','srh','dc','pbks','rr','gt','lsg')),
  is_admin      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── 2. MATCHES ──────────────────────────────────────────────────
create table if not exists public.matches (
  id              uuid primary key default uuid_generate_v4(),
  match_number    integer not null,           -- 1..74
  date            timestamptz not null,       -- scheduled start time (UTC)
  venue           text not null,              -- venue id from venues.json
  team_a          text not null,              -- team id
  team_b          text not null,              -- team id
  status          text not null default 'upcoming'
                    check (status in ('upcoming','live','completed','cancelled')),
  winner          text,                       -- team id of winner, null until completed
  scorecard_json  jsonb,                      -- raw API response cached here
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── 3. MATCH QUESTIONS ──────────────────────────────────────────
-- One The Call + one Chaos Ball per match, set before the match
create table if not exists public.match_questions (
  id              uuid primary key default uuid_generate_v4(),
  match_id        uuid not null references public.matches(id) on delete cascade,
  type            text not null check (type in ('the_call','chaos_ball')),
  question_id     text not null,              -- e.g. "C1", "CB7"
  display_text    text not null,
  answer_options  jsonb not null,             -- string array
  correct_answer  text,                       -- set by admin after match
  created_at      timestamptz not null default now(),
  unique(match_id, type)
);

-- ── 4. PREDICTIONS ──────────────────────────────────────────────
create table if not exists public.predictions (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.users(id) on delete cascade,
  match_id            uuid not null references public.matches(id) on delete cascade,
  match_winner_pick   text,                   -- team id
  the_call_pick       text,                   -- answer string matching answer_options
  villain_pick_player text,                   -- player name (from squad)
  chaos_ball_pick     text,                   -- "Yes" or "No"
  locked_at           timestamptz,            -- set when first ball starts
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique(user_id, match_id)
);

-- ── 5. MATCH SCORES ─────────────────────────────────────────────
-- Written by admin after scoring each match
create table if not exists public.match_scores (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  match_id    uuid not null references public.matches(id) on delete cascade,
  winner_pts  integer not null default 0,
  call_pts    integer not null default 0,
  villain_pts integer not null default 0,     -- can be negative
  chaos_pts   integer not null default 0,
  h2h_pts     integer not null default 0,
  total       integer not null default 0,
  scored_at   timestamptz not null default now(),
  unique(user_id, match_id)
);

-- ── 6. SEASON PREDICTIONS ───────────────────────────────────────
create table if not exists public.season_predictions (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.users(id) on delete cascade unique,
  top_4_teams         text[] not null default '{}',         -- array of 4 team ids
  champion            text,                                  -- team id
  runner_up           text,                                  -- team id
  wooden_spoon        text,                                  -- team id
  orange_cap_picks    text[] not null default '{}',         -- array of 3 player names
  purple_cap_picks    text[] not null default '{}',         -- array of 3 player names
  most_sixes_picks    text[] not null default '{}',         -- array of 3 player names
  locked_at           timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ── 7. SEASON SCORES ────────────────────────────────────────────
-- Written at season end by computeSeasonScores script
create table if not exists public.season_scores (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.users(id) on delete cascade unique,
  top_4_pts           integer not null default 0,
  champion_pts        integer not null default 0,
  runner_up_pts       integer not null default 0,
  wooden_spoon_pts    integer not null default 0,
  orange_cap_pts      integer not null default 0,
  purple_cap_pts      integer not null default 0,
  most_sixes_pts      integer not null default 0,
  total               integer not null default 0,
  breakdown_json      jsonb,                    -- multiplier details per category
  scored_at           timestamptz not null default now()
);

-- ── 8. H2H PAIRINGS ─────────────────────────────────────────────
create table if not exists public.h2h_pairings (
  id          uuid primary key default uuid_generate_v4(),
  user_a      uuid not null references public.users(id) on delete cascade,
  user_b      uuid not null references public.users(id) on delete cascade,
  cycle_start date not null,
  cycle_end   date not null,
  wins_a      integer not null default 0,
  wins_b      integer not null default 0,
  winner      uuid,                             -- references users(id), null until cycle ends
  created_at  timestamptz not null default now(),
  check (user_a <> user_b)
);

-- ════════════════════════════════════════════════════════════════
--  LEADERBOARD VIEW
-- ════════════════════════════════════════════════════════════════

create or replace view public.leaderboard
  with (security_invoker = true)
as
select
  u.id                                                  as user_id,
  u.display_name,
  u.team,
  coalesce(ms.match_total, 0) + coalesce(ss.total, 0)  as total_pts,
  coalesce(ms.match_total, 0)                           as match_pts,
  coalesce(ss.total, 0)                                 as season_pts,
  coalesce(ms.matches_played, 0)                        as matches_played,
  ms.last_match_pts,
  rank() over (order by (coalesce(ms.match_total, 0) + coalesce(ss.total, 0)) desc) as rank
from public.users u
left join (
  select
    user_id,
    sum(total)                                  as match_total,
    count(*)                                    as matches_played,
    (array_agg(total order by scored_at desc))[1] as last_match_pts
  from public.match_scores
  group by user_id
) ms on ms.user_id = u.id
left join public.season_scores ss on ss.user_id = u.id;

-- ════════════════════════════════════════════════════════════════
--  ROW-LEVEL SECURITY (RLS)
-- ════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
alter table public.users             enable row level security;
alter table public.matches           enable row level security;
alter table public.match_questions   enable row level security;
alter table public.predictions       enable row level security;
alter table public.match_scores      enable row level security;
alter table public.season_predictions enable row level security;
alter table public.season_scores     enable row level security;
alter table public.h2h_pairings      enable row level security;

-- users: anyone in the league can read all profiles; only you can update yours
create policy "users_select" on public.users for select using (true);
create policy "users_insert" on public.users for insert with check (auth.uid() = id);
create policy "users_update" on public.users for update using (auth.uid() = id);

-- matches: all authenticated users can read
create policy "matches_select" on public.matches for select using (auth.role() = 'authenticated');
-- only admins can insert/update
create policy "matches_admin_write" on public.matches for all using (
  exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);

-- match_questions: all authenticated users can read
create policy "mq_select" on public.match_questions for select using (auth.role() = 'authenticated');
create policy "mq_admin_write" on public.match_questions for all using (
  exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);

-- predictions: you can read your own predictions at any time;
--              you can read others' predictions only after match is locked
create policy "predictions_own" on public.predictions for select
  using (user_id = auth.uid());
create policy "predictions_others_after_lock" on public.predictions for select
  using (
    user_id <> auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.status in ('live','completed') or locked_at is not null)
    )
  );
create policy "predictions_insert" on public.predictions for insert
  with check (user_id = auth.uid());
create policy "predictions_update" on public.predictions for update
  using (user_id = auth.uid() and locked_at is null);

-- match_scores: all authenticated users can read (it's a public leaderboard)
create policy "match_scores_select" on public.match_scores for select using (auth.role() = 'authenticated');
create policy "match_scores_admin_write" on public.match_scores for all using (
  exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);

-- season_predictions: own anytime; others after season picks lock
create policy "sp_own" on public.season_predictions for select using (user_id = auth.uid());
create policy "sp_others_after_lock" on public.season_predictions for select
  using (user_id <> auth.uid() and locked_at is not null);
create policy "sp_insert" on public.season_predictions for insert with check (user_id = auth.uid());
create policy "sp_update" on public.season_predictions for update
  using (user_id = auth.uid() and locked_at is null);

-- season_scores: all authenticated users can read
create policy "ss_select" on public.season_scores for select using (auth.role() = 'authenticated');
create policy "ss_admin_write" on public.season_scores for all using (
  exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);

-- h2h_pairings: all authenticated users can read their own pairings
create policy "h2h_select" on public.h2h_pairings for select using (
  auth.role() = 'authenticated' and (user_a = auth.uid() or user_b = auth.uid())
);
create policy "h2h_admin_write" on public.h2h_pairings for all using (
  exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);

-- ════════════════════════════════════════════════════════════════
--  HELPER: updated_at trigger
-- ════════════════════════════════════════════════════════════════

create or replace function public.handle_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at before update on public.users
  for each row execute function public.handle_updated_at();
create trigger matches_updated_at before update on public.matches
  for each row execute function public.handle_updated_at();
create trigger predictions_updated_at before update on public.predictions
  for each row execute function public.handle_updated_at();
create trigger sp_updated_at before update on public.season_predictions
  for each row execute function public.handle_updated_at();
