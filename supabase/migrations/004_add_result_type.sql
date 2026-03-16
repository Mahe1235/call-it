-- ════════════════════════════════════════════════════════════════
--  Migration 004 — Add result_type to matches
--  Tracks how a match concluded for admin scoring edge cases.
-- ════════════════════════════════════════════════════════════════

alter table public.matches
  add column if not exists result_type text not null default 'normal'
  check (result_type in ('normal', 'super_over', 'dls', 'no_result'));
