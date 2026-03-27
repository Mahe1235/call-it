import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Fetch the current user's Fantasy XI picks.
 * Returns { picks, loading, error }
 * picks: { players: string[], captain: string|null, vice_captain: string|null, locked: boolean } | null
 */
export function useFantasyXI(userId) {
  const [picks, setPicks]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    let cancelled = false

    async function load() {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('fantasy_xi_picks')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (cancelled) return
      if (err) setError(err.message)
      else setPicks(data)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [userId])

  return { picks, setPicks, loading, error }
}

/**
 * Save (upsert) Fantasy XI picks for the current user.
 * Only succeeds if picks are not yet locked.
 *
 * @param {string} userId
 * @param {string[]} players  — exactly 11 player names
 * @param {string}   captain
 * @param {string}   viceCaptain
 * @param {boolean}  lock     — set true to lock permanently
 */
export async function saveFantasyXIPicks(userId, players, captain, viceCaptain, lock = false) {
  const { data, error } = await supabase
    .from('fantasy_xi_picks')
    .upsert({
      user_id:      userId,
      players,
      captain,
      vice_captain: viceCaptain,
      locked:       lock,
      updated_at:   new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .single()

  return { data, error }
}

/**
 * Fetch all users' Fantasy XI picks (for the group view).
 * Returns { entries, loading, error }
 * entries: [{ user_id, display_name, team, players, captain, vice_captain, locked, fantasy_xi_pts }]
 */
export function useFantasyXIGroup() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)

      // Fetch picks joined with user info
      const { data: picksData, error: picksErr } = await supabase
        .from('fantasy_xi_picks')
        .select('user_id, players, captain, vice_captain, locked, users(display_name, team)')

      if (cancelled) return
      if (picksErr) { setError(picksErr.message); setLoading(false); return }

      // Fetch fantasy_xi totals from leaderboard view
      const { data: lbData } = await supabase
        .from('leaderboard')
        .select('user_id, fantasy_xi_pts')

      if (cancelled) return

      const ptsByUser = {}
      for (const row of (lbData ?? [])) ptsByUser[row.user_id] = row.fantasy_xi_pts

      const mapped = (picksData ?? []).map(p => ({
        user_id:      p.user_id,
        display_name: p.users?.display_name ?? 'Unknown',
        team:         p.users?.team ?? null,
        players:      p.players ?? [],
        captain:      p.captain,
        vice_captain: p.vice_captain,
        locked:       p.locked,
        fantasy_xi_pts: ptsByUser[p.user_id] ?? 0,
      }))

      mapped.sort((a, b) => b.fantasy_xi_pts - a.fantasy_xi_pts)
      setEntries(mapped)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { entries, loading, error }
}
