-- ════════════════════════════════════════════════════════════════
--  Migration 005 — Fantasy XI
--  Season-long fantasy team picks + accumulated scores per match.
--  Run this in the Supabase SQL Editor.
-- ════════════════════════════════════════════════════════════════

-- ── Fantasy XI Picks ─────────────────────────────────────────────────────────
-- One row per user. 11 players, a captain, and a vice captain.
-- Locked before Match 1. Scoring deferred to a later migration.

create table if not exists public.fantasy_xi_picks (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references public.users(id) on delete cascade,
  players      text[]      not null default '{}',   -- exactly 11 player names
  captain      text,                                 -- must be in players[]
  vice_captain text,                                 -- must be in players[], ≠ captain
  locked       boolean     not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique(user_id)
);

alter table public.fantasy_xi_picks enable row level security;

create policy "fantasy_xi_picks_read_all"
  on public.fantasy_xi_picks for select using (true);

create policy "fantasy_xi_picks_write_own"
  on public.fantasy_xi_picks for all using (auth.uid() = user_id);

-- ── Fantasy XI Scores ────────────────────────────────────────────────────────
-- Admin-written after each match (once scoring rules are finalised).
-- breakdown: { "Player Name": pts, ... } for all 11 players in that match.

create table if not exists public.fantasy_xi_scores (
  id         uuid  primary key default gen_random_uuid(),
  user_id    uuid  not null references public.users(id) on delete cascade,
  match_id   uuid  not null references public.matches(id) on delete cascade,
  breakdown  jsonb not null default '{}',
  total_pts  int   not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, match_id)
);

alter table public.fantasy_xi_scores enable row level security;

create policy "fantasy_xi_scores_read_all"
  on public.fantasy_xi_scores for select using (true);

create policy "fantasy_xi_scores_write_admin"
  on public.fantasy_xi_scores for all
  using (exists (select 1 from public.users where id = auth.uid() and is_admin = true));

-- ── Update leaderboard view to include fantasy_xi_pts ────────────────────────

create or replace view public.leaderboard as
select
  u.id                                                              as user_id,
  u.display_name,
  u.team,
  coalesce(ms.match_total, 0)                                       as match_pts,
  coalesce(ss.total, 0)                                             as season_pts,
  coalesce(fx.fantasy_total, 0)                                     as fantasy_xi_pts,
  coalesce(ms.match_total, 0)
    + coalesce(ss.total, 0)
    + coalesce(fx.fantasy_total, 0)                                 as total_pts,
  coalesce(ms.matches_played, 0)                                    as matches_played,
  ms.last_match_pts,
  rank() over (
    order by (
      coalesce(ms.match_total, 0)
      + coalesce(ss.total, 0)
      + coalesce(fx.fantasy_total, 0)
    ) desc
  )                                                                 as rank
from public.users u
left join (
  select
    user_id,
    sum(total)                                            as match_total,
    count(*)                                              as matches_played,
    (array_agg(total order by created_at desc))[1]        as last_match_pts
  from public.match_scores
  group by user_id
) ms on ms.user_id = u.id
left join (
  select user_id, total
  from public.season_scores
) ss on ss.user_id = u.id
left join (
  select user_id, sum(total_pts) as fantasy_total
  from public.fantasy_xi_scores
  group by user_id
) fx on fx.user_id = u.id;
