/**
 * cricketApi.js
 * Wrapper around the CricketData.org API (api.cricapi.com/v1/).
 *
 * Usage — React app (admin panel):
 *   import { createCricketApi } from './cricketApi'
 *   const api = createCricketApi(import.meta.env.VITE_CRICAPI_KEY)
 *
 * Usage — Node scripts:
 *   import { createCricketApi } from '../src/lib/cricketApi.js'
 *   const api = createCricketApi(process.env.CRICAPI_KEY)
 */

const BASE_URL = 'https://api.cricapi.com/v1'

/**
 * Creates a CricketData.org API client.
 * @param {string} apiKey - Your CricAPI key
 */
export function createCricketApi(apiKey) {
  if (!apiKey) throw new Error('[cricketApi] apiKey is required')

  async function request(endpoint, params = {}) {
    const url = new URL(`${BASE_URL}/${endpoint}`)
    url.searchParams.set('apikey', apiKey)
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v)
    }

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`[cricketApi] HTTP ${res.status} for /${endpoint}`)

    const data = await res.json()
    if (data.status !== 'success') {
      throw new Error(`[cricketApi] API error on /${endpoint}: ${data.reason ?? 'unknown'}`)
    }
    return data
  }

  return {
    /**
     * Fetch all matches in a series (e.g. IPL 2026).
     * Returns raw match list — caller maps to DB shape.
     * @param {string} seriesId - CricAPI series ID
     * @returns {Array<{ apiMatchId, name, date, venue, teamA, teamB }>}
     */
    async fetchSeriesMatches(seriesId) {
      const data = await request('series_info', { id: seriesId })
      const matchList = data.data?.matchList ?? []

      return matchList
        .filter(m => m.matchType?.toLowerCase() === 't20')
        .map(m => ({
          apiMatchId: m.id,
          name: m.name ?? '',
          date: m.dateTimeGMT ?? m.date,
          venue: m.venue ?? '',
          teamA: (m.teams ?? [])[0] ?? '',
          teamB: (m.teams ?? [])[1] ?? '',
        }))
    },

    /**
     * Fetch full scorecard for a completed match.
     * @param {string} matchId - CricAPI match ID
     * @returns {Object} Normalised scorecard (summary stats + raw)
     */
    async fetchMatchScorecard(matchId) {
      const data = await request('match_scorecard', { id: matchId })
      const raw = data.data ?? {}

      const batting = []
      const bowling = []
      const dismissals = []

      for (const scorecard of (raw.scorecard ?? [])) {
        const battingTeam = scorecard.batting_team ?? ''
        const bowlingTeam = scorecard.bowling_team ?? ''

        for (const batter of (scorecard.batting ?? [])) {
          const playerName = batter.batsman?.name ?? batter.batsman ?? ''
          const runs = Number(batter.r ?? 0)
          const dismissalType = batter.dismissal ?? ''

          batting.push({
            name: playerName,
            runs,
            balls: Number(batter.b ?? 0),
            fours: Number(batter['4s'] ?? 0),
            sixes: Number(batter['6s'] ?? 0),
            dismissal: dismissalType,
            team: battingTeam,
          })

          if (dismissalType && dismissalType !== 'not out') {
            dismissals.push({ batter: playerName, type: dismissalType, team: battingTeam })
          }
        }

        for (const bowler of (scorecard.bowling ?? [])) {
          bowling.push({
            name: bowler.bowler?.name ?? bowler.bowler ?? '',
            overs: String(bowler.o ?? 0),
            maidens: Number(bowler.m ?? 0),
            runs: Number(bowler.r ?? 0),
            wickets: Number(bowler.w ?? 0),
            team: bowlingTeam,
          })
        }
      }

      const totalSixes   = batting.reduce((sum, b) => sum + b.sixes, 0)
      const totalFours   = batting.reduce((sum, b) => sum + b.fours, 0)
      const totalWickets = dismissals.length
      const extras       = (raw.scorecard ?? []).reduce((sum, s) => sum + Number(s.extras ?? 0), 0)
      const inningsTotals = (raw.scorecard ?? []).map(s => Number(s.total ?? 0))
      const totalRuns    = inningsTotals.reduce((sum, t) => sum + t, 0)

      return {
        winner: raw.matchWinner ?? null,
        batting, bowling, dismissals,
        totalSixes, totalFours, totalWickets, totalRuns, extras, inningsTotals,
        raw,
      }
    },

    /**
     * Fetch a match scorecard and return per-player merged data in
     * Fantasy XI scoring format (runs, balls_faced, fours, sixes,
     * wickets, lbw_bowled, overs_bowled, runs_conceded, maiden_overs,
     * catches, stumpings, run_out).
     *
     * Name matching: squads were seeded from the same API so primary
     * names match. `altnames` from each player object are also indexed
     * so alternate spellings in scorecards resolve to the canonical name.
     *
     * @param {string} matchId - CricAPI match ID
     * @returns {Array<Object>} One object per player that appeared in the match
     */
    async fetchFantasyScorecard(matchId) {
      const data = await request('match_scorecard', { id: matchId })
      const raw  = data.data ?? {}

      // players keyed by lowercase name; altname keys point to the same object
      const byKey = {}

      function getOrCreate(nameObj) {
        // nameObj: { name, altnames? }  OR  plain string
        const canonical = (typeof nameObj === 'string' ? nameObj : nameObj?.name) ?? ''
        if (!canonical) return null

        const key = canonical.toLowerCase()
        if (!byKey[key]) byKey[key] = { name: canonical }

        // Index any altnames so they resolve to the same object
        const alts = typeof nameObj === 'object' ? (nameObj.altnames ?? []) : []
        for (const alt of alts) {
          const altKey = alt.toLowerCase()
          if (!byKey[altKey]) byKey[altKey] = byKey[key]
        }

        return byKey[key]
      }

      for (const inning of (raw.scorecard ?? [])) {
        // ── Batting ──────────────────────────────────────────────
        for (const b of (inning.batting ?? [])) {
          const p = getOrCreate(b.batsman)
          if (!p) continue
          p.runs        = (p.runs        ?? 0) + Number(b.r      ?? 0)
          p.balls_faced = (p.balls_faced ?? 0) + Number(b.b      ?? 0)
          p.fours       = (p.fours       ?? 0) + Number(b['4s']  ?? 0)
          p.sixes       = (p.sixes       ?? 0) + Number(b['6s']  ?? 0)
        }

        // ── Bowling ──────────────────────────────────────────────
        for (const bw of (inning.bowling ?? [])) {
          const p = getOrCreate(bw.bowler)
          if (!p) continue
          p.wickets       = (p.wickets       ?? 0) + Number(bw.w ?? 0)
          p.overs_bowled  = (p.overs_bowled  ?? 0) + Number(bw.o ?? 0)
          p.runs_conceded = (p.runs_conceded ?? 0) + Number(bw.r ?? 0)
          p.maiden_overs  = (p.maiden_overs  ?? 0) + Number(bw.m ?? 0)
        }

        // ── Catching / fielding ───────────────────────────────────
        // Each entry: { catcher, catch, cb, stumped, runout, lbw, bowled }
        // `lbw` + `bowled` are the bowler's LBW/bowled wickets (not catches).
        // `cb` = caught-and-bowled (bowler catches their own delivery).
        for (const c of (inning.catching ?? [])) {
          const p = getOrCreate(c.catcher)
          if (!p) continue
          p.catches    = (p.catches    ?? 0) + Number(c.catch   ?? 0)
                                             + Number(c.cb      ?? 0) // caught & bowled
          p.stumpings  = (p.stumpings  ?? 0) + Number(c.stumped ?? 0)
          p.run_out    = (p.run_out    ?? 0) + Number(c.runout  ?? 0)
          p.lbw_bowled = (p.lbw_bowled ?? 0) + Number(c.lbw    ?? 0)
                                             + Number(c.bowled  ?? 0)
        }
      }

      // Return only canonical entries (skip alias keys)
      const seen = new Set()
      const result = []
      for (const [key, p] of Object.entries(byKey)) {
        if (key === p.name.toLowerCase() && !seen.has(p.name.toLowerCase())) {
          seen.add(p.name.toLowerCase())
          result.push(p)
        }
      }
      return result
    },

    /**
     * Fetch squad for a team.
     * @param {string} teamId - CricAPI team ID
     * @returns {Array<{ name, role }>}
     */
    async fetchTeamSquad(teamId) {
      const data = await request('teams_info', { id: teamId })
      const players = data.data?.players ?? []

      return players.map(p => ({
        name: p.name ?? '',
        role: normaliseRole(p.playerType ?? p.role ?? ''),
      }))
    },

    /**
     * Search for series by name — useful for finding the IPL 2026 series ID.
     * @param {string} query - e.g. "indian premier league 2026"
     * @returns {Array<{ id, name, startDate, endDate }>}
     */
    async searchSeries(query) {
      const data = await request('series', { search: query })
      return (data.data ?? []).map(s => ({
        id: s.id,
        name: s.name,
        startDate: s.startDate,
        endDate: s.endDate,
      }))
    },

    /**
     * Search for teams by name — useful for finding apiTeamId values.
     * @param {string} query - e.g. "Chennai Super Kings"
     * @returns {Array<{ id, name }>}
     */
    async searchTeams(query) {
      const data = await request('teams', { search: query })
      return (data.data ?? []).map(t => ({
        id: t.id,
        name: t.name,
      }))
    },
  }
}

/** Normalise CricAPI role strings to our 4 roles */
function normaliseRole(role) {
  const r = (role || '').toLowerCase()
  if (r.includes('keeper') || r.includes('wicketkeeper') || r.includes('wicket-keeper')) return 'keeper'
  if (r.includes('allrounder') || r.includes('all-rounder') || r.includes('all rounder') || r === 'batting allrounder' || r === 'bowling allrounder') return 'allrounder'
  if (r.includes('bowl')) return 'bowler'
  return 'batter'
}
