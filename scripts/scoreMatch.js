/**
 * scoreMatch.js
 * Fetches a match scorecard, runs the scoring engine, and writes match_scores.
 *
 * Usage: node scripts/scoreMatch.js <match_id>
 * Requires: SUPABASE_SERVICE_KEY and VITE_CRICAPI_KEY in environment
 *
 * Called by admin panel OR run directly for debugging.
 */

// TODO: implement
// 1. Fetch scorecard from api.cricapi.com/v1/match_scorecard?id={API_MATCH_ID}
// 2. Parse scorecard into normalized shape (see cricketApi.js when built)
// 3. For each user prediction, run scoreMatchCard() from src/lib/scoring.js
// 4. Write results to match_scores table
// 5. Compute H2H bonuses
// 6. Set match.status = 'completed'
console.log('scoreMatch.js — not yet implemented')
