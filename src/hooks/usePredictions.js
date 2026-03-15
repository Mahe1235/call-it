import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

/**
 * Returns the current user's prediction for a match.
 * { prediction, loading, error, refresh }
 *
 * prediction shape:
 *   { id, match_winner_pick, the_call_pick, villain_pick_player, chaos_ball_pick, locked_at }
 */
export function useMyPrediction(matchId) {
  const { user } = useAuth()
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!matchId || !user) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const { data, error: err } = await supabase
        .from('predictions')
        .select('*')
        .eq('match_id', matchId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (cancelled) return

      if (err) setError(err.message)
      else setPrediction(data ?? null)

      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [matchId, user?.id])

  return { prediction, setPrediction, loading, error }
}

/**
 * Submits (or updates) a prediction for a match.
 * picks: { match_winner_pick, the_call_pick, villain_pick_player, chaos_ball_pick }
 * Returns { data, error }
 */
export async function submitPrediction(userId, matchId, picks) {
  const { data, error } = await supabase
    .from('predictions')
    .upsert(
      {
        user_id: userId,
        match_id: matchId,
        ...picks,
        locked_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,match_id' }
    )
    .select()
    .single()

  return { data, error }
}

/**
 * Returns all predictions for a match (for group reveal).
 * { predictions, loading, error }
 */
export function useGroupPredictions(matchId) {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!matchId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const { data, error: err } = await supabase
        .from('predictions')
        .select('*, users(display_name, team)')
        .eq('match_id', matchId)

      if (cancelled) return

      if (err) setError(err.message)
      else setPredictions(data ?? [])

      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [matchId])

  return { predictions, loading, error }
}
