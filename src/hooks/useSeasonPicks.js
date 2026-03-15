import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

/**
 * Returns the current user's season picks + whether the season has started.
 * { picks, setPicks, seasonStarted, loading, error }
 *
 * picks shape:
 *   { id, top_4_teams[], champion, runner_up, wooden_spoon,
 *     orange_cap_picks[], purple_cap_picks[], most_sixes_picks[], locked_at }
 */
export function useSeasonPicks() {
  const { user } = useAuth()
  const [picks, setPicks]               = useState(null)
  const [seasonStarted, setSeasonStarted] = useState(false)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const [picksResult, matchResult] = await Promise.all([
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
      ])

      if (cancelled) return

      if (picksResult.error) setError(picksResult.error.message)
      else setPicks(picksResult.data ?? null)

      if (matchResult.data) {
        const m = matchResult.data
        const started = m.status !== 'upcoming' || Date.now() >= new Date(m.date).getTime()
        setSeasonStarted(started)
      }

      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [user?.id])

  return { picks, setPicks, seasonStarted, loading, error }
}

/**
 * Saves (and locks) season picks.
 * picks: { top_4_teams, champion, runner_up, wooden_spoon,
 *           orange_cap_picks, purple_cap_picks, most_sixes_picks }
 */
export async function saveSeasonPicks(userId, picks) {
  const { data, error } = await supabase
    .from('season_predictions')
    .upsert(
      {
        user_id: userId,
        ...picks,
        locked_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  return { data, error }
}
