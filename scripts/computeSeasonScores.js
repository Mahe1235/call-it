/**
 * computeSeasonScores.js
 * Runs at season end. Scores all season predictions with contrarian multipliers.
 *
 * Usage:
 *   node scripts/computeSeasonScores.js --results '{"champion":"rcb","runner_up":"mi","wooden_spoon":"lsg","top4":["rcb","mi","csk","kkr"],"orange_cap":["Virat Kohli","..."],"purple_cap":["Jasprit Bumrah","..."],"most_sixes":["Rohit Sharma","..."]}'
 *   node scripts/computeSeasonScores.js --dry-run    # show scores without writing
 *
 * results JSON shape:
 *   {
 *     top4: string[],        // 4 qualifying team ids (order doesn't matter)
 *     champion: string,      // winning team id
 *     runner_up: string,     // runner-up team id
 *     wooden_spoon: string,  // last-place team id
 *     orange_cap: string[],  // top-5 run scorers [rank1, rank2, rank3, rank4, rank5]
 *     purple_cap: string[],  // top-5 wicket takers [rank1..rank5]
 *     most_sixes: string[],  // top-5 six hitters [rank1..rank5]
 *   }
 *
 * Requires: VITE_SUPABASE_URL + SUPABASE_SERVICE_KEY in .env.local
 */

import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createClient } from '@supabase/supabase-js'
import { scoreSeasonPredictions } from '../src/lib/scoring.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ─── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')

const resultsIdx = args.indexOf('--results')
if (resultsIdx === -1) {
  console.error('Error: --results <json> is required.\n')
  console.error('Example:')
  console.error(`  node scripts/computeSeasonScores.js --results '{"champion":"rcb","runner_up":"mi","wooden_spoon":"lsg","top4":["rcb","mi","csk","kkr"],"orange_cap":["Virat Kohli"],"purple_cap":["Jasprit Bumrah"],"most_sixes":["Rohit Sharma"]}'`)
  process.exit(1)
}

let results
try {
  results = JSON.parse(args[resultsIdx + 1])
} catch {
  console.error('Error: --results value is not valid JSON.')
  process.exit(1)
}

// Validate required fields
const required = ['top4', 'champion', 'runner_up', 'wooden_spoon', 'orange_cap', 'purple_cap', 'most_sixes']
for (const key of required) {
  if (results[key] == null) {
    console.error(`Error: results.${key} is missing.`)
    process.exit(1)
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n🏏 computeSeasonScores${dryRun ? ' (DRY RUN)' : ''}\n`)
  console.log('Season results:')
  console.log(`  Champion:     ${results.champion}`)
  console.log(`  Runner-Up:    ${results.runner_up}`)
  console.log(`  Wooden Spoon: ${results.wooden_spoon}`)
  console.log(`  Top 4:        ${results.top4.join(', ')}`)
  console.log(`  Orange Cap:   ${results.orange_cap.slice(0, 5).join(', ')}`)
  console.log(`  Purple Cap:   ${results.purple_cap.slice(0, 5).join(', ')}`)
  console.log(`  Most Sixes:   ${results.most_sixes.slice(0, 5).join(', ')}`)
  console.log()

  // 1. Load all season_predictions
  const { data: allPredictions, error: predErr } = await supabase
    .from('season_predictions')
    .select('*')

  if (predErr) {
    console.error('Failed to load season_predictions:', predErr.message)
    process.exit(1)
  }

  if (!allPredictions.length) {
    console.log('No season predictions found. Nothing to score.')
    return
  }

  console.log(`Scoring ${allPredictions.length} user predictions...\n`)

  // 2. Score each user
  const rows = []
  for (const prediction of allPredictions) {
    const scored = scoreSeasonPredictions(prediction, results, allPredictions)

    rows.push({
      user_id:          prediction.user_id,
      top4_pts:         scored.top4_pts,
      champion_pts:     scored.champion_pts,
      runner_up_pts:    scored.runner_up_pts,
      wooden_spoon_pts: scored.wooden_spoon_pts,
      orange_cap_pts:   scored.orange_cap_pts,
      purple_cap_pts:   scored.purple_cap_pts,
      most_sixes_pts:   scored.most_sixes_pts,
      total:            scored.total,
      breakdown_json:   scored.breakdown,
      scored_at:        new Date().toISOString(),
    })

    console.log(`  ${prediction.user_id}  →  ${scored.total} pts`)
    console.log(`    top4=${scored.top4_pts}  champion=${scored.champion_pts}  runner_up=${scored.runner_up_pts}  wooden_spoon=${scored.wooden_spoon_pts}`)
    console.log(`    orange=${scored.orange_cap_pts}  purple=${scored.purple_cap_pts}  sixes=${scored.most_sixes_pts}`)
  }

  console.log()

  if (dryRun) {
    console.log('DRY RUN — no data written.')
    return
  }

  // 3. Upsert into season_scores
  const { error: upsertErr } = await supabase
    .from('season_scores')
    .upsert(rows, { onConflict: 'user_id' })

  if (upsertErr) {
    console.error('Failed to write season_scores:', upsertErr.message)
    process.exit(1)
  }

  console.log(`✅ Written ${rows.length} rows to season_scores.`)
}

run().catch(err => {
  console.error('Unexpected error:', err)
  process.exit(1)
})
