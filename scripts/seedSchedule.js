/**
 * seedSchedule.js
 * Fetches the IPL 2026 schedule from CricketData.org and seeds the matches +
 * match_questions tables in Supabase.
 *
 * Usage:
 *   node scripts/seedSchedule.js --series-id <cricapi-series-id> [--dry-run]
 *
 * To find the IPL 2026 series ID, run:
 *   node scripts/seedSchedule.js --find-series "indian premier league 2026"
 *
 * Requires in .env.local:
 *   SUPABASE_URL      (same value as VITE_SUPABASE_URL)
 *   SUPABASE_SERVICE_KEY
 *   CRICAPI_KEY
 */

import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createClient } from '@supabase/supabase-js'
import { createCricketApi } from '../src/lib/cricketApi.js'

// Load .env.local from project root
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '..', '.env.local') })

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const CRICAPI_KEY = process.env.CRICAPI_KEY || process.env.VITE_CRICAPI_KEY

// CricAPI team names → our team IDs
const TEAM_NAME_MAP = {
  'Chennai Super Kings': 'csk',
  'Mumbai Indians': 'mi',
  'Royal Challengers Bengaluru': 'rcb',
  'Royal Challengers Bangalore': 'rcb', // legacy spelling
  'Kolkata Knight Riders': 'kkr',
  'Sunrisers Hyderabad': 'srh',
  'Delhi Capitals': 'dc',
  'Punjab Kings': 'pbks',
  'Rajasthan Royals': 'rr',
  'Gujarat Titans': 'gt',
  'Lucknow Super Giants': 'lsg',
}

// City name → our venue ID
const CITY_TO_VENUE = {
  'Mumbai': 'wankhede',
  'Chennai': 'ma_chidambaram',
  'Bengaluru': 'm_chinnaswamy',
  'Bangalore': 'm_chinnaswamy',
  'Kolkata': 'eden_gardens',
  'Hyderabad': 'rajiv_gandhi',
  'Delhi': 'arun_jaitley',
  'Mohali': 'pca_mohali',
  'Chandigarh': 'pca_mohali',
  'Jaipur': 'sawai_mansingh',
  'Ahmedabad': 'narendra_modi',
  'Lucknow': 'atal_bihari',
  // Neutral/playoff venues — fall back to narendra_modi lines (large ground)
  'Guwahati': 'narendra_modi',
  'Dharamsala': 'pca_mohali',
  'Pune': 'wankhede',
  'Visakhapatnam': 'rajiv_gandhi',
  'Ranchi': 'eden_gardens',
  'Cuttack': 'eden_gardens',
  'Nagpur': 'narendra_modi',
  'Indore': 'narendra_modi',
}

// Venue data for line substitution (mirrors venues.json — avoids JSON import in Node)
const VENUE_LINES = {
  wankhede:       { totalSixes: 14, totalRuns: 355, totalWickets: 12, totalFours: 28 },
  ma_chidambaram: { totalSixes: 11, totalRuns: 320, totalWickets: 14, totalFours: 25 },
  m_chinnaswamy:  { totalSixes: 16, totalRuns: 375, totalWickets: 11, totalFours: 30 },
  eden_gardens:   { totalSixes: 13, totalRuns: 345, totalWickets: 12, totalFours: 27 },
  rajiv_gandhi:   { totalSixes: 12, totalRuns: 340, totalWickets: 13, totalFours: 26 },
  arun_jaitley:   { totalSixes: 13, totalRuns: 340, totalWickets: 12, totalFours: 27 },
  pca_mohali:     { totalSixes: 14, totalRuns: 350, totalWickets: 12, totalFours: 28 },
  sawai_mansingh: { totalSixes: 15, totalRuns: 360, totalWickets: 11, totalFours: 29 },
  narendra_modi:  { totalSixes: 11, totalRuns: 330, totalWickets: 13, totalFours: 25 },
  atal_bihari:    { totalSixes: 13, totalRuns: 345, totalWickets: 12, totalFours: 27 },
}

// Question pools (tier 1 + 2 only, mirrors questionSelector.js logic for Node)
const CALL_QUESTIONS = [
  { id: 'C1',  tier: 1, displayText: 'Total sixes in this match',                              type: 'over_under',   answerOptions: ['Over {line}', 'Under {line}'], lineKey: 'totalSixes',  defaultLine: 13 },
  { id: 'C2',  tier: 1, displayText: 'Which team will score more runs in the powerplay?',      type: 'binary_team',  answerOptions: ['{team_a}', '{team_b}'],         requiresMatchContext: true },
  { id: 'C3',  tier: 1, displayText: 'Will the match go to the last over?',                   type: 'yes_no',       answerOptions: ['Yes', 'No'] },
  { id: 'C4',  tier: 1, displayText: 'Top scorer of the match plays for which team?',         type: 'binary_team',  answerOptions: ['{team_a}', '{team_b}'],         requiresMatchContext: true },
  { id: 'C5',  tier: 1, displayText: 'Total wickets in the match',                            type: 'over_under',   answerOptions: ['Over {line}', 'Under {line}'], lineKey: 'totalWickets', defaultLine: 12 },
  { id: 'C6',  tier: 1, displayText: 'Will there be a maiden over?',                         type: 'yes_no',       answerOptions: ['Yes', 'No'] },
  { id: 'C7',  tier: 2, displayText: 'Will there be a run out?',                              type: 'yes_no',       answerOptions: ['Yes', 'No'] },
  { id: 'C8',  tier: 2, displayText: 'Total fours in the match',                              type: 'over_under',   answerOptions: ['Over {line}', 'Under {line}'], lineKey: 'totalFours',   defaultLine: 28 },
  { id: 'C9',  tier: 2, displayText: 'Will the first wicket fall in the powerplay?',         type: 'yes_no',       answerOptions: ['Yes', 'No'] },
  { id: 'C10', tier: 2, displayText: 'Combined total runs scored in the match',               type: 'over_under',   answerOptions: ['Over {line}', 'Under {line}'], lineKey: 'totalRuns',    defaultLine: 340 },
  { id: 'C11', tier: 2, displayText: 'Will any bowler take 3 or more wickets?',              type: 'yes_no',       answerOptions: ['Yes', 'No'] },
  { id: 'C12', tier: 2, displayText: 'Which team bats first?',                               type: 'binary_team',  answerOptions: ['{team_a}', '{team_b}'],         requiresMatchContext: true },
  { id: 'C13', tier: 2, displayText: 'Will the winning team win by more than 30 runs (or 5+ wickets with 10+ balls remaining)?', type: 'yes_no', answerOptions: ['Yes — dominant win', 'No — close match'] },
]

const CHAOS_QUESTIONS = [
  { id: 'CB1',  tier: 1, displayText: 'Will there be a golden duck (out for 0 off first ball)?',    answerOptions: ['Yes', 'No'] },
  { id: 'CB2',  tier: 1, displayText: 'Will the top scorer be an opener?',                           answerOptions: ['Yes', 'No'] },
  { id: 'CB3',  tier: 1, displayText: 'Will the winning captain score 25+ runs?',                    answerOptions: ['Yes', 'No'] },
  { id: 'CB4',  tier: 1, displayText: 'Will there be a hat-trick?',                                  answerOptions: ['Yes', 'No'] },
  { id: 'CB5',  tier: 1, displayText: 'Will the first ball of the match be a wide or no-ball?',     answerOptions: ['Yes', 'No'] },
  { id: 'CB6',  tier: 1, displayText: 'Will any player score consecutive sixes?',                    answerOptions: ['Yes', 'No'] },
  { id: 'CB7',  tier: 1, displayText: 'Will a bowler bowl a full over without conceding a boundary?', answerOptions: ['Yes', 'No'] },
  { id: 'CB8',  tier: 2, displayText: 'Will the match result be decided in the final over?',         answerOptions: ['Yes', 'No'] },
  { id: 'CB9',  tier: 2, displayText: 'Will there be exactly 1 run out in the match?',               answerOptions: ['Yes — exactly 1', 'No'] },
  { id: 'CB10', tier: 2, displayText: 'Will the first innings total be a palindrome (e.g. 151, 232)?', answerOptions: ['Yes', 'No'] },
  { id: 'CB11', tier: 2, displayText: 'Will a number 7 or lower batter score the most runs for their team?', answerOptions: ['Yes', 'No'] },
  { id: 'CB12', tier: 2, displayText: 'Will both openers of the first batting team score 20+?',      answerOptions: ['Yes', 'No'] },
  { id: 'CB13', tier: 2, displayText: 'Will there be a stumping?',                                   answerOptions: ['Yes', 'No'] },
  { id: 'CB14', tier: 2, displayText: 'Will a bowler concede 20+ runs in a single over?',           answerOptions: ['Yes', 'No'] },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapTeamName(name) {
  if (!name) return null
  // Exact match first
  if (TEAM_NAME_MAP[name]) return TEAM_NAME_MAP[name]
  // Case-insensitive partial match fallback
  const lower = name.toLowerCase()
  for (const [key, val] of Object.entries(TEAM_NAME_MAP)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return val
  }
  return null
}

function mapVenueCity(venueString) {
  if (!venueString) return null
  for (const [city, venueId] of Object.entries(CITY_TO_VENUE)) {
    if (venueString.toLowerCase().includes(city.toLowerCase())) return venueId
  }
  return null
}

function selectQuestionsForMatch(matchNumber, venueId, teamA = 'Team A', teamB = 'Team B') {
  const venueLines = VENUE_LINES[venueId] ?? null
  const callIdx = (matchNumber - 1) % CALL_QUESTIONS.length
  const chaosIdx = (matchNumber - 1 + 7) % CHAOS_QUESTIONS.length

  const callQ = resolveQuestion(CALL_QUESTIONS[callIdx], venueLines, teamA, teamB)
  const chaosQ = { ...CHAOS_QUESTIONS[chaosIdx], type: 'yes_no', answerOptions: [...CHAOS_QUESTIONS[chaosIdx].answerOptions] }

  return { theCall: callQ, chaosBall: chaosQ }
}

function resolveQuestion(q, venueLines, teamA, teamB) {
  const resolved = { ...q, answerOptions: [...q.answerOptions] }

  if (q.lineKey) {
    const line = venueLines?.[q.lineKey] ?? q.defaultLine
    resolved.displayText = resolved.displayText.replace('{line}', line)
    resolved.answerOptions = resolved.answerOptions.map(o => o.replace('{line}', line))
    resolved.resolvedLine = line
  }

  if (q.requiresMatchContext) {
    resolved.displayText = resolved.displayText
      .replace('{team_a}', teamA)
      .replace('{team_b}', teamB)
    resolved.answerOptions = resolved.answerOptions.map(o =>
      o.replace('{team_a}', teamA).replace('{team_b}', teamB)
    )
  }

  return resolved
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const isDryRun = args.includes('--dry-run')
  const seriesIdFlag = args.indexOf('--series-id')
  const findSeriesFlag = args.indexOf('--find-series')

  // Validate env
  if (!CRICAPI_KEY) {
    console.error('❌  CRICAPI_KEY not set in .env.local')
    process.exit(1)
  }

  const cricApi = createCricketApi(CRICAPI_KEY)

  // ── Mode: find series ID ──────────────────────────────────────────────────
  if (findSeriesFlag !== -1) {
    const query = args[findSeriesFlag + 1]
    if (!query) {
      console.error('❌  Provide a search query: --find-series "indian premier league 2026"')
      process.exit(1)
    }
    console.log(`🔍  Searching for series: "${query}"...`)
    const results = await cricApi.searchSeries(query)
    if (!results.length) {
      console.log('No results found.')
    } else {
      console.log('\nMatching series:')
      results.forEach(s => console.log(`  ${s.id}  ${s.name}  (${s.startDate} → ${s.endDate})`))
      console.log('\nUse the ID above with: --series-id <id>')
    }
    return
  }

  // ── Mode: seed schedule ───────────────────────────────────────────────────
  if (seriesIdFlag === -1 || !args[seriesIdFlag + 1]) {
    console.error('❌  Usage: node scripts/seedSchedule.js --series-id <id> [--dry-run]')
    console.error('   Find the series ID first: node scripts/seedSchedule.js --find-series "ipl 2026"')
    process.exit(1)
  }

  const seriesId = args[seriesIdFlag + 1]

  if (!isDryRun && (!SUPABASE_URL || !SERVICE_KEY)) {
    console.error('❌  SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_KEY must be set in .env.local')
    console.error('   For a preview without DB writes, add --dry-run')
    process.exit(1)
  }

  const supabase = (!isDryRun) ? createClient(SUPABASE_URL, SERVICE_KEY) : null

  console.log(`📡  Fetching IPL 2026 schedule for series: ${seriesId}`)
  const rawMatches = await cricApi.fetchSeriesMatches(seriesId)

  if (!rawMatches.length) {
    console.error('❌  No matches returned. Check the series ID.')
    process.exit(1)
  }

  // Sort by date and assign sequential match numbers
  rawMatches.sort((a, b) => new Date(a.date) - new Date(b.date))

  const matchRows = []
  const questionRows = []

  rawMatches.forEach((m, idx) => {
    const matchNumber = idx + 1
    const teamA = mapTeamName(m.teamA)
    const teamB = mapTeamName(m.teamB)
    const venueId = mapVenueCity(m.venue)

    if (!teamA || !teamB) {
      console.warn(`  ⚠️  Match ${matchNumber}: unrecognised team(s) — "${m.teamA}" vs "${m.teamB}" — skipping`)
      return
    }

    const teamAData = { mi: 'MI', csk: 'CSK', rcb: 'RCB', kkr: 'KKR', srh: 'SRH', dc: 'DC', pbks: 'PBKS', rr: 'RR', gt: 'GT', lsg: 'LSG' }
    const teamAShort = teamAData[teamA] ?? teamA.toUpperCase()
    const teamBShort = teamAData[teamB] ?? teamB.toUpperCase()

    matchRows.push({
      match_number: matchNumber,
      date: new Date(m.date).toISOString(),
      venue: venueId ?? 'unknown',
      team_a: teamA,
      team_b: teamB,
      status: 'upcoming',
      api_match_id: m.apiMatchId,
    })

    const { theCall, chaosBall } = selectQuestionsForMatch(matchNumber, venueId, teamAShort, teamBShort)

    questionRows.push({
      _matchNumber: matchNumber, // temp ref for linking
      type: 'the_call',
      question_id: theCall.id,
      display_text: theCall.displayText,
      answer_options: theCall.answerOptions,
      correct_answer: null,
    })

    questionRows.push({
      _matchNumber: matchNumber,
      type: 'chaos_ball',
      question_id: chaosBall.id,
      display_text: chaosBall.displayText,
      answer_options: chaosBall.answerOptions,
      correct_answer: null,
    })
  })

  console.log(`\n📋  ${matchRows.length} matches ready to insert`)
  console.log(`❓  ${questionRows.length} match questions ready to insert`)

  if (isDryRun) {
    console.log('\n🔍  DRY RUN — no DB writes. First 3 matches:\n')
    matchRows.slice(0, 3).forEach(r => {
      console.log(`  Match ${r.match_number}: ${r.team_a.toUpperCase()} vs ${r.team_b.toUpperCase()} @ ${r.venue} on ${r.date.slice(0, 10)}`)
    })
    console.log('\nFirst 2 questions:')
    questionRows.slice(0, 2).forEach(q => {
      console.log(`  [${q.type}] ${q.question_id}: "${q.display_text}"`)
      console.log(`    Options: ${q.answer_options.join(' / ')}`)
    })
    return
  }

  // ── Upsert matches ────────────────────────────────────────────────────────
  console.log('\n⬆️   Upserting matches...')
  const { error: matchError } = await supabase
    .from('matches')
    .upsert(
      matchRows.map(({ _matchNumber, ...r }) => r), // strip temp fields
      { onConflict: 'match_number' }
    )

  if (matchError) {
    console.error('❌  Match insert failed:', matchError.message)
    process.exit(1)
  }
  console.log(`✅  ${matchRows.length} matches upserted`)

  // Fetch back inserted matches to get their UUIDs
  const { data: insertedMatches, error: fetchError } = await supabase
    .from('matches')
    .select('id, match_number')
    .order('match_number')

  if (fetchError) {
    console.error('❌  Could not fetch match IDs:', fetchError.message)
    process.exit(1)
  }

  const matchIdMap = Object.fromEntries(insertedMatches.map(m => [m.match_number, m.id]))

  // ── Upsert match_questions ────────────────────────────────────────────────
  const questionRowsWithIds = questionRows
    .filter(q => matchIdMap[q._matchNumber])
    .map(({ _matchNumber, ...q }) => ({
      ...q,
      match_id: matchIdMap[_matchNumber],
    }))

  console.log('\n⬆️   Upserting match questions...')
  const { error: qError } = await supabase
    .from('match_questions')
    .upsert(questionRowsWithIds, { onConflict: 'match_id,type' })

  if (qError) {
    console.error('❌  match_questions insert failed:', qError.message)
    process.exit(1)
  }
  console.log(`✅  ${questionRowsWithIds.length} match questions upserted`)
  console.log('\n🎉  Schedule seeded successfully!')
  console.log('   Next: node scripts/seedSquads.js')
}

main().catch(err => {
  console.error('❌  Unexpected error:', err.message)
  process.exit(1)
})
