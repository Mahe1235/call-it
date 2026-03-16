import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock useMatchReveal
const mockReveal = vi.fn()
vi.mock('../../src/hooks/useMatchReveal', () => ({
  useMatchReveal: (...args) => mockReveal(...args),
}))

import { PostMatchReveal } from '../../src/components/match/PostMatchReveal'

const completedMatch = {
  id: 'match-90',
  team_a: 'rcb',
  team_b: 'mi',
  status: 'completed',
  winner: 'rcb',
  date: '2026-03-10T14:00:00Z',
  venue: 'chinnaswamy',
}

const questions = [
  { id: 'q1', type: 'the_call', display_text: 'Total sixes', answer_options: ['Over 12', 'Under 12'], correct_answer: 'Over 12' },
  { id: 'q2', type: 'chaos_ball', display_text: 'Last over?', answer_options: ['Yes', 'No'], correct_answer: 'Yes' },
]

const myPrediction = {
  match_winner_pick: 'rcb',
  the_call_pick: 'Over 12',
  villain_pick_player: 'Rohit Sharma',
  chaos_ball_pick: 'Yes',
}

describe('PostMatchReveal', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows "Scores coming soon" when myScore is null', () => {
    mockReveal.mockReturnValue({
      myPrediction, myScore: null, groupPredictions: [], scorecard: null, loading: false,
    })
    render(<PostMatchReveal match={completedMatch} questions={questions} />)
    expect(screen.getByText(/Scores coming soon/i)).toBeInTheDocument()
  })

  it('shows total pts and per-pick pts when myScore is present', () => {
    mockReveal.mockReturnValue({
      myPrediction,
      myScore: { winner_pts: 20, call_pts: 10, villain_pts: 15, chaos_pts: 12, total: 57 },
      groupPredictions: [],
      scorecard: [{ name: 'Rohit Sharma', runs: 8, wickets: 0 }],
      loading: false,
    })
    render(<PostMatchReveal match={completedMatch} questions={questions} />)
    // Points are rendered as "+", "57", " pts" in separate nodes — check for the number
    expect(screen.getByText((content, el) =>
      el?.tagName !== 'SCRIPT' && /57/.test(el?.textContent ?? '')
      && el?.children?.length === 0
    )).toBeInTheDocument()
  })

  it('shows "flopped" villain outcome when villain pts = +15', () => {
    mockReveal.mockReturnValue({
      myPrediction,
      myScore: { winner_pts: 10, call_pts: 10, villain_pts: 15, chaos_pts: 12, total: 47 },
      groupPredictions: [],
      scorecard: [{ name: 'Rohit Sharma', runs: 8, wickets: 0 }],
      loading: false,
    })
    render(<PostMatchReveal match={completedMatch} questions={questions} />)
    expect(screen.getByText(/flopped/i)).toBeInTheDocument()
  })

  it('shows "had impact" villain outcome when villain pts = −5', () => {
    const impactPrediction = { ...myPrediction, villain_pick_player: 'Virat Kohli' }
    mockReveal.mockReturnValue({
      myPrediction: impactPrediction,
      myScore: { winner_pts: 10, call_pts: 10, villain_pts: -5, chaos_pts: 12, total: 27 },
      groupPredictions: [],
      scorecard: [{ name: 'Virat Kohli', runs: 82, wickets: 0 }],
      loading: false,
    })
    render(<PostMatchReveal match={completedMatch} questions={questions} />)
    expect(screen.getByText(/had impact/i)).toBeInTheDocument()
  })
})
