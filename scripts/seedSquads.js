/**
 * seedSquads.js
 * Fetches IPL 2026 team squads via match_squad endpoint and updates content/teams.json.
 * Uses match IDs already seeded in Supabase — no separate team ID lookup needed.
 *
 * Usage:
 *   node scripts/seedSquads.js              # update all teams
 *   node scripts/seedSquads.js --team rcb   # update one team only
 */

import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '..', '.env.local') })

const CRICAPI_KEY = process.env.CRICAPI_KEY || process.env.VITE_CRICAPI_KEY
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const TEAMS_JSON_PATH = join(__dirname, '..', 'content', 'teams.json')

// CricAPI shortname → our team ID
const SHORTNAME_MAP = {
  'CSK': 'csk', 'MI': 'mi', 'RCB': 'rcb', 'RCBW': 'rcb',
  'KKR': 'kkr', 'SRH': 'srh', 'DC': 'dc',
  'PBKS': 'pbks', 'RR': 'rr', 'GT': 'gt', 'LSG': 'lsg',
}

function normaliseRole(role) {
  const r = (role || '').toLowerCase()
  if (r.includes('keeper') || r.includes('wicketkeeper') || r.includes('wicket-keeper')) return 'keeper'
  if (r.includes('allrounder') || r.includes('all-rounder') || r.includes('all rounder') || r === 'batting allrounder' || r === 'bowling allrounder') return 'allrounder'
  if (r.includes('bowl')) return 'bowler'
  return 'batter'
}

async function main() {
  const args = process.argv.slice(2)
  const teamFlag = args.indexOf('--team')
  const targetTeamId = teamFlag !== -1 ? args[teamFlag + 1] : null

  if (!CRICAPI_KEY) { console.error('❌  CRICAPI_KEY not set'); process.exit(1) }
  if (!SUPABASE_URL || !SERVICE_KEY) { console.error('❌  Supabase env vars not set'); process.exit(1) }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

  // Fetch all match API IDs from Supabase
  const { data: matches, error } = await supabase
    .from('matches')
    .select('api_match_id, team_a, team_b')
    .order('match_number', { ascending: true })

  if (error) { console.error('❌  DB error:', error.message); process.exit(1) }
  if (!matches.length) { console.error('❌  No matches found. Run seed:schedule first.'); process.exit(1) }

  const teamsJson = JSON.parse(readFileSync(TEAMS_JSON_PATH, 'utf-8'))
  const allTeams = teamsJson.teams

  const neededTeams = new Set(
    targetTeamId ? [targetTeamId] : allTeams.map(t => t.id)
  )
  const collected = {} // teamId → players[]

  console.log(`📡  Fetching squads for ${neededTeams.size} team(s) via match_squad...\n`)

  for (const match of matches) {
    if (!match.api_match_id) continue
    const needsA = neededTeams.has(match.team_a) && !collected[match.team_a]
    const needsB = neededTeams.has(match.team_b) && !collected[match.team_b]
    if (!needsA && !needsB) continue

    process.stdout.write(`  ${match.team_a.toUpperCase()} vs ${match.team_b.toUpperCase()}... `)

    try {
      const res = await fetch(
        `https://api.cricapi.com/v1/match_squad?apikey=${CRICAPI_KEY}&id=${match.api_match_id}`
      )
      const data = await res.json()

      if (data.status !== 'success' || !Array.isArray(data.data)) {
        console.log(`⚠️  ${data.reason || 'no data'}`)
        continue
      }

      let found = 0
      for (const teamData of data.data) {
        const ourId = SHORTNAME_MAP[teamData.shortname]
        if (!ourId || !neededTeams.has(ourId) || collected[ourId]) continue

        const players = (teamData.players || []).map(p => ({
          name: p.name,
          role: normaliseRole(p.role),
        }))

        if (players.length > 0) {
          collected[ourId] = players
          found++
        }
      }

      console.log(found > 0 ? `✅  ${found} team(s) collected` : `⚠️  squads not announced yet`)

      if (Object.keys(collected).length >= neededTeams.size) break

      await new Promise(r => setTimeout(r, 300))
    } catch (err) {
      console.log(`❌  ${err.message}`)
    }
  }

  // Write to teams.json
  let updatedCount = 0
  for (const [teamId, players] of Object.entries(collected)) {
    const team = allTeams.find(t => t.id === teamId)
    if (team) {
      team.squad = players
      updatedCount++
      console.log(`  ✅  ${team.shortName}: ${players.length} players`)
    }
  }

  for (const teamId of neededTeams) {
    if (!collected[teamId]) {
      const team = allTeams.find(t => t.id === teamId)
      console.log(`  ⚠️  ${team?.shortName ?? teamId}: squad not available yet`)
    }
  }

  if (updatedCount > 0) {
    writeFileSync(TEAMS_JSON_PATH, JSON.stringify(teamsJson, null, 2) + '\n', 'utf-8')
    console.log(`\n✅  teams.json updated with ${updatedCount} squad(s). Commit to save.`)
  } else {
    console.log('\n⚠️  No squads updated. May not be announced yet for this season.')
  }
}

main().catch(err => {
  console.error('❌  Unexpected error:', err.message)
  process.exit(1)
})
