-- ── Migration 003: add avatar_url to users ──────────────────────────────────
-- Stores the DiceBear avatar URL chosen during onboarding.
-- Nullable — existing rows keep their initials fallback until they update.

alter table public.users
  add column if not exists avatar_url text;
