import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Returns per-match cumulative points for all users, ordered by match number.
 *
 * Returns:
 *   chartData: array of { match: 'M1', [displayName]: cumulativePts, ... }
 *   players:   array of { user_id, display_name, team, finalPts } sorted by finalPts desc
 *   loading, error
 */
export function usePointsProgression() {
  const [chartData, setChartData] = useState([])
  const [players, setPlayers]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const { data, error: err } = await supabase
        .from('match_scores')
        .select('user_id, total, matches(match_number), users(display_name, team)')
        .order('match_number', { referencedTable: 'matches', ascending: true })

      if (cancelled) return
      if (err) { setError(err.message); setLoading(false); return }
      if (!data?.length) { setLoading(false); return }

      // Build cumulative sums per user across matches
      const matchNumbers = [...new Set(data.map(r => r.matches.match_number))].sort((a, b) => a - b)
      const userMap = {}  // user_id → { display_name, team, scoreByMatch }

      for (const row of data) {
        const { user_id, total, matches: { match_number }, users: { display_name, team } } = row
        if (!userMap[user_id]) {
          userMap[user_id] = { user_id, display_name, team, scoreByMatch: {} }
        }
        userMap[user_id].scoreByMatch[match_number] = total
      }

      // Build chart data — one entry per match, with cumulative pts for each player
      const builtData = []
      const cumulative = {}

      for (const mn of matchNumbers) {
        const point = { match: `M${mn}` }
        for (const u of Object.values(userMap)) {
          cumulative[u.user_id] = (cumulative[u.user_id] ?? 0) + (u.scoreByMatch[mn] ?? 0)
          point[u.display_name] = cumulative[u.user_id]
        }
        builtData.push(point)
      }

      // Final standings for legend ordering
      const playerList = Object.values(userMap).map(u => ({
        user_id: u.user_id,
        display_name: u.display_name,
        team: u.team,
        finalPts: cumulative[u.user_id] ?? 0,
      })).sort((a, b) => b.finalPts - a.finalPts)

      setChartData(builtData)
      setPlayers(playerList)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { chartData, players, loading, error }
}
