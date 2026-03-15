-- Add CricAPI match ID for scorecard fetching (admin panel + scoreMatch script)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS api_match_id text;

-- Unique constraint on match_number for idempotent upserts in seedSchedule.js
ALTER TABLE matches ADD CONSTRAINT matches_match_number_key UNIQUE (match_number);
