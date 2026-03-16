import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

/**
 * Fetches all data needed for the post-match reveal panel.
 *
 * Returns:
 *   myPrediction   – current user's picks (null if they didn't submit)
 *   myScore        – { winner_pts, call_pts, villain_pts, chaos_pts, total } (null if not scored)
 *   groupPredictions – [{ user_id, match_winner_pick, users: { display_name } }]
 *   scorecard      – array of player objects from matches.scorecard_json (may be null)
 *   loading, error
 */
export function useMatchReveal(matchId) {
  const { user } = useAuth()
  const [myPrediction, setMyPrediction]     = useState(null)
  const [myScore, setMyScore]               = useState(null)
  const [groupPredictions, setGroupPreds]   = useState([])
  const [scorecard, setScorecard]           = useState(null)
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState(null)

  useEffect(() => {
    if (!matchId || !user) { setLoading(false); return }
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const [predRes, scoreRes, groupRes, matchRes] = await Promise.all([
        supabase.from('predictions').select('*').eq('match_id', matchId).eq('user_id', user.id).maybeSingle(),
        supabase.from('match_scores').select('*').eq('match_id', matchId).eq('user_id', user.id).maybeSingle(),
        supabase.from('predictions').select('user_id, match_winner_pick, users(display_name)').eq('match_id', matchId),
        supabase.from('matches').select('scorecard_json').eq('id', matchId).maybeSingle(),
      ])

      if (cancelled) return

      const err = predRes.error || scoreRes.error || groupRes.error || matchRes.error
      if (err) { setError(err.message); setLoading(false); return }

      setMyPrediction(predRes.data ?? null)
      setMyScore(scoreRes.data ?? null)
      setGroupPreds(groupRes.data ?? [])
      setScorecard(matchRes.data?.scorecard_json ?? null)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [matchId, user?.id])

  return { myPrediction, myScore, groupPredictions, scorecard, loading, error }
}
