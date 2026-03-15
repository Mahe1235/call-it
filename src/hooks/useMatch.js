import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Returns a feed of matches for the home carousel:
 *   - up to 2 most-recent completed matches (oldest first)
 *   - up to 3 upcoming / live matches (soonest first)
 * activeIndex points to the first upcoming/live match.
 * { matches: [{match, questions}], activeIndex, loading, error }
 */
export function useMatchFeed() {
  const [matches, setMatches] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const [{ data: completed, error: e1 }, { data: upcoming, error: e2 }] = await Promise.all([
        supabase
          .from('matches')
          .select('*, match_questions(*)')
          .eq('status', 'completed')
          .order('date', { ascending: false })
          .limit(2),
        supabase
          .from('matches')
          .select('*, match_questions(*)')
          .in('status', ['upcoming', 'live'])
          .order('date', { ascending: true })
          .limit(3),
      ])

      if (cancelled) return

      if (e1 || e2) {
        setError((e1 || e2).message)
        setLoading(false)
        return
      }

      const toItem = (row) => {
        const { match_questions, ...matchData } = row
        return { match: matchData, questions: match_questions ?? [] }
      }

      // Completed arrive newest-first; reverse so oldest is leftmost in carousel
      const completedItems = (completed ?? []).reverse().map(toItem)
      const upcomingItems  = (upcoming  ?? []).map(toItem)
      const all = [...completedItems, ...upcomingItems]

      setMatches(all)
      setActiveIndex(completedItems.length > 0 ? completedItems.length : 0)
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { matches, activeIndex, loading, error }
}

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
