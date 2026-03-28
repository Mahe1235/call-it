import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

/**
 * Returns the current user's season picks + scores + whether the season has started.
 * { picks, setPicks, scores, seasonStarted, loading, error }
 *
 * picks shape:
 *   { id, top_4_teams[], champion, runner_up, wooden_spoon,
 *     orange_cap_picks[], purple_cap_picks[], most_sixes_picks[], locked_at }
 *
 * scores shape (null if not yet scored):
 *   { top4_pts, champion_pts, runner_up_pts, wooden_spoon_pts,
 *     orange_cap_pts, purple_cap_pts, most_sixes_pts, total, breakdown_json }
 */
export function useSeasonPicks() {
  const { user } = useAuth()
  const [picks, setPicks]               = useState(null)
  const [scores, setScores]             = useState(null)
  const [seasonStarted, setSeasonStarted] = useState(false)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const [picksResult, matchResult, scoresResult] = await Promise.all([
        supabase
          .from('season_predictions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('matches')
          .select('date, status')
          .order('match_number', { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('season_scores')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(),
      ])

      if (cancelled) return

      if (picksResult.error) setError(picksResult.error.message)
      else setPicks(picksResult.data ?? null)

      if (matchResult.data) {
        const m = matchResult.data
        const started = m.status !== 'upcoming' || Date.now() >= new Date(m.date).getTime()
        setSeasonStarted(started)
      }

      setScores(scoresResult.data ?? null)

      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [user?.id])

  return { picks, setPicks, scores, seasonStarted, loading, error }
}

/**
 * Saves (and locks) season picks.
 * picks: { top_4_teams, champion, runner_up, wooden_spoon,
 *           orange_cap_picks, purple_cap_picks, most_sixes_picks }
 */
export async function saveSeasonPicks(userId, picks) {
  // 1. Write
  const { error: writeError } = await supabase
    .from('season_predictions')
    .upsert(
      {
        user_id: userId,
        ...picks,
        locked_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (writeError) return { data: null, error: writeError }

  // 2. Read back the saved row
  const { data, error } = await supabase
    .from('season_predictions')
    .select('*')
    .eq('user_id', userId)
    .single()

  return { data, error }
}
