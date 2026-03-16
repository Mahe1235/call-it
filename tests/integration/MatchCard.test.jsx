import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MatchCard } from '../../src/components/match/MatchCard'

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-uid' },
    profile: { display_name: 'Test User', team: 'rcb' },
  }),
}))

const mockSubmit = vi.fn()
const mockGroupPredictions = vi.fn(() => ({ predictions: [], loading: false }))

vi.mock('../../src/hooks/usePredictions', () => ({
  submitPrediction: (...args) => mockSubmit(...args),
  useGroupPredictions: (...args) => mockGroupPredictions(...args),
}))

// ─── Fixtures ────────────────────────────────────────────────────────────────

// Future date so matchStarted is always false for upcoming tests
const FUTURE = new Date(Date.now() + 86400 * 1000 * 30).toISOString()

const upcomingMatch = {
  id: 'match-1',
  team_a: 'rcb',
  team_b: 'mi',
  status: 'upcoming',
  date: FUTURE,
  venue: 'chinnaswamy',
  match_number: 99,
}

const liveMatch = { ...upcomingMatch, status: 'live', date: new Date(Date.now() - 3600_000).toISOString() }

const theCallQ = {
  id: 'q1',
  type: 'the_call',
  display_text: 'Total sixes: Over/Under 12',
  answer_options: ['Over 12', 'Under 12'],
  correct_answer: null,
}

const chaosBallQ = {
  id: 'q2',
  type: 'chaos_ball',
  display_text: 'Will the match go to the last over?',
  answer_options: ['Yes', 'No'],
  correct_answer: null,
}

const questions = [theCallQ, chaosBallQ]

const existingPrediction = {
  id: 'pred-1',
  match_winner_pick: 'rcb',
  the_call_pick: 'Over 12',
  villain_pick_player: 'Virat Kohli',
  chaos_ball_pick: 'Yes',
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('MatchCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGroupPredictions.mockReturnValue({ predictions: [], loading: false })
  })

  it('renders 4 pick sections when upcoming + no prediction', () => {
    render(<MatchCard match={upcomingMatch} questions={questions} prediction={null} />)

    expect(screen.getByText('Match Winner')).toBeInTheDocument()
    expect(screen.getByText('The Call')).toBeInTheDocument()
    expect(screen.getByText('Villain Pick')).toBeInTheDocument()
    expect(screen.getByText('Chaos Ball')).toBeInTheDocument()
  })

  it('"Lock it in" button is disabled when no picks made', () => {
    render(<MatchCard match={upcomingMatch} questions={questions} prediction={null} />)
    const btn = screen.getByRole('button', { name: /lock it in/i })
    expect(btn).toBeDisabled()
  })

  it('"Lock it in" button enables only after all picks made', async () => {
    render(<MatchCard match={upcomingMatch} questions={questions} prediction={null} />)

    // Pick winner
    fireEvent.click(screen.getByRole('button', { name: /RCB/i }))
    expect(screen.getByRole('button', { name: /lock it in/i })).toBeDisabled()

    // Pick The Call
    fireEvent.click(screen.getByRole('button', { name: /Over 12/i }))
    expect(screen.getByRole('button', { name: /lock it in/i })).toBeDisabled()

    // Pick Villain from select
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: select.querySelector('option:not([value=""])').value } })
    expect(screen.getByRole('button', { name: /lock it in/i })).toBeDisabled()

    // Pick Chaos Ball
    fireEvent.click(screen.getByRole('button', { name: /^Yes$/i }))
    expect(screen.getByRole('button', { name: /lock it in/i })).not.toBeDisabled()
  })

  it('submitting calls submitPrediction with correct payload and invokes onLocked', async () => {
    const onLocked = vi.fn()
    const returnedPred = { ...existingPrediction, id: 'new-pred' }
    mockSubmit.mockResolvedValue({ data: returnedPred, error: null })

    render(<MatchCard match={upcomingMatch} questions={questions} prediction={null} onLocked={onLocked} />)

    fireEvent.click(screen.getByRole('button', { name: /RCB/i }))
    fireEvent.click(screen.getByRole('button', { name: /Over 12/i }))
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: select.querySelector('option:not([value=""])').value } })
    fireEvent.click(screen.getByRole('button', { name: /^Yes$/i }))
    fireEvent.click(screen.getByRole('button', { name: /lock it in/i }))

    await waitFor(() => expect(onLocked).toHaveBeenCalledWith(returnedPred))
    expect(mockSubmit).toHaveBeenCalledWith(
      'test-uid',
      'match-1',
      expect.objectContaining({ match_winner_pick: 'rcb', chaos_ball_pick: 'Yes' })
    )
  })

  it('shows LockedCard with "✏️ Change picks" when prediction exists + upcoming', () => {
    render(
      <MatchCard match={upcomingMatch} questions={questions} prediction={existingPrediction} />
    )
    expect(screen.getByText(/Change picks/)).toBeInTheDocument()
    // No submit button in locked state
    expect(screen.queryByRole('button', { name: /lock it in/i })).not.toBeInTheDocument()
  })

  it('"Change picks" switches to edit form with picks pre-filled', () => {
    render(
      <MatchCard match={upcomingMatch} questions={questions} prediction={existingPrediction} />
    )
    fireEvent.click(screen.getByText(/Change picks/))
    // In edit mode the submit button says "Save changes ✓"
    expect(screen.getByRole('button', { name: /Save changes/i })).toBeInTheDocument()
  })

  it('shows LockedCard WITHOUT "Change picks" when match is live', () => {
    render(
      <MatchCard match={liveMatch} questions={questions} prediction={existingPrediction} />
    )
    expect(screen.queryByText(/Change picks/)).not.toBeInTheDocument()
  })

  it('shows MissedCard (no form) when match is live and no prediction', () => {
    render(<MatchCard match={liveMatch} questions={questions} prediction={null} />)
    // Lock it in button should not be present
    expect(screen.queryByRole('button', { name: /lock it in/i })).not.toBeInTheDocument()
    // Match Winner section should not be present
    expect(screen.queryByText('Match Winner')).not.toBeInTheDocument()
  })

  it('shows "Session expired" UI when submitPrediction returns JWT error', async () => {
    mockSubmit.mockResolvedValue({ data: null, error: { message: 'JWT expired' } })

    render(<MatchCard match={upcomingMatch} questions={questions} prediction={null} />)

    fireEvent.click(screen.getByRole('button', { name: /RCB/i }))
    fireEvent.click(screen.getByRole('button', { name: /Over 12/i }))
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: select.querySelector('option:not([value=""])').value } })
    fireEvent.click(screen.getByRole('button', { name: /^Yes$/i }))
    fireEvent.click(screen.getByRole('button', { name: /lock it in/i }))

    await waitFor(() => expect(screen.getByText(/Session expired/i)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /Reload to sign in/i })).toBeInTheDocument()
  })
})
