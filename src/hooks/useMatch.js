import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Returns the next upcoming or currently live match, with its questions.
 * { match, questions, loading, error }
 *
 * match shape: { id, match_number, date, venue, team_a, team_b, status, winner, api_match_id }
 * questions shape: [{ id, type, question_id, display_text, answer_options, correct_answer }]
 */
export function useCurrentMatch() {
  const [match, setMatch] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      setLoading(true)
      setError(null)

      const { data, error: err } = await supabase
        .from('matches')
        .select('*, match_questions(*)')
        .in('status', ['upcoming', 'live'])
        .order('date', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (cancelled) return

      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }

      if (data) {
        const { match_questions, ...matchData } = data
        setMatch(matchData)
        setQuestions(match_questions ?? [])
      } else {
        setMatch(null)
        setQuestions([])
      }

      setLoading(false)
    }

    fetch()
    return () => { cancelled = true }
  }, [])

  return { match, questions, loading, error }
}

/**
 * Returns a specific match by ID, with its questions.
 * { match, questions, loading, error }
 */
export function useMatch(matchId) {
  const [match, setMatch] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!matchId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetch() {
      setLoading(true)
      setError(null)

      const { data, error: err } = await supabase
        .from('matches')
        .select('*, match_questions(*)')
        .eq('id', matchId)
        .maybeSingle()

      if (cancelled) return

      if (err) {
        setError(err.message)
      } else if (data) {
        const { match_questions, ...matchData } = data
        setMatch(matchData)
        setQuestions(match_questions ?? [])
      }

      setLoading(false)
    }

    fetch()
    return () => { cancelled = true }
  }, [matchId])

  return { match, questions, loading, error }
}
