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
     * @returns {Object} Normalised scorecard
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
            dismissals.push({
              batter: playerName,
              type: dismissalType,
              team: battingTeam,
            })
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

      const totalSixes = batting.reduce((sum, b) => sum + b.sixes, 0)
      const totalFours = batting.reduce((sum, b) => sum + b.fours, 0)
      const totalWickets = dismissals.length
      const extras = (raw.scorecard ?? []).reduce((sum, s) => sum + Number(s.extras ?? 0), 0)

      // Innings totals for combined runs
      const inningsTotals = (raw.scorecard ?? []).map(s => Number(s.total ?? 0))
      const totalRuns = inningsTotals.reduce((sum, t) => sum + t, 0)

      return {
        winner: raw.matchWinner ?? null,
        batting,
        bowling,
        dismissals,
        totalSixes,
        totalFours,
        totalWickets,
        totalRuns,
        extras,
        inningsTotals,
        raw, // preserve for admin manual reference
      }
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
