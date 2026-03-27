import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Lightweight hook that returns whether the IPL season has started.
 * Does not require auth — just checks the first match row.
 *
 * Returns { seasonStarted, firstMatchDate, loading }
 *
 * seasonStarted = true when:
 *   - first match status !== 'upcoming', OR
 *   - current time >= first match date
 */
export function useSeasonStatus() {
  const [seasonStarted, setSeasonStarted] = useState(false)
  const [firstMatchDate, setFirstMatchDate] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data } = await supabase
        .from('matches')
        .select('date, status')
        .order('match_number', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (cancelled) return

      if (data) {
        const date = new Date(data.date)
        setFirstMatchDate(date)
        setSeasonStarted(data.status !== 'upcoming' || Date.now() >= date.getTime())
      }

      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { seasonStarted, firstMatchDate, loading }
}
