import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Returns the full leaderboard, ordered by rank ascending.
 * { entries, loading, error }
 *
 * Entry shape:
 *   { user_id, display_name, team, total_pts, match_pts, season_pts,
 *     matches_played, last_match_pts, rank }
 */
export function useLeaderboard() {
  const [entries, setEntries]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error,   setError]     = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const { data, error: err } = await supabase
        .from('leaderboard')
        .select('*')
        .order('rank', { ascending: true })

      if (cancelled) return
      if (err) setError(err.message)
      else setEntries(data ?? [])
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { entries, loading, error }
}
