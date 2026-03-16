import { describe, it, expect } from 'vitest'
import {
  scoreMatchWinner,
  scoreTheCall,
  scoreChaosBall,
  scoreVillainPick,
  calculateContrarianMultiplier,
  scoreH2HMatch,
  scoreMatchCard,
} from '../../src/lib/scoring.js'

// ─── scoreMatchWinner ─────────────────────────────────────────────────────────

describe('scoreMatchWinner', () => {
  it('returns 10 for a correct pick', () => {
    expect(scoreMatchWinner('rcb', 'rcb')).toBe(10)
  })
  it('returns 0 for a wrong pick', () => {
    expect(scoreMatchWinner('mi', 'rcb')).toBe(0)
  })
  it('returns 0 when pick is null', () => {
    expect(scoreMatchWinner(null, 'rcb')).toBe(0)
  })
  it('returns 0 when winner is null (match not done)', () => {
    expect(scoreMatchWinner('rcb', null)).toBe(0)
  })
  it('returns 0 when both are undefined', () => {
    expect(scoreMatchWinner(undefined, undefined)).toBe(0)
  })
})

// ─── scoreTheCall ─────────────────────────────────────────────────────────────

describe('scoreTheCall', () => {
  it('returns 10 for a correct pick', () => {
    expect(scoreTheCall('Over 13', 'Over 13')).toBe(10)
  })
  it('returns 0 for a wrong pick', () => {
    expect(scoreTheCall('Under 13', 'Over 13')).toBe(0)
  })
  it('returns 0 when pick is null', () => {
    expect(scoreTheCall(null, 'Over 13')).toBe(0)
  })
  it('returns 0 when correct answer is null', () => {
    expect(scoreTheCall('Over 13', null)).toBe(0)
  })
})

// ─── scoreChaosBall ───────────────────────────────────────────────────────────

describe('scoreChaosBall', () => {
  it('returns 12 for correct Yes pick', () => {
    expect(scoreChaosBall('Yes', 'Yes')).toBe(12)
  })
  it('returns 12 for correct No pick', () => {
    expect(scoreChaosBall('No', 'No')).toBe(12)
  })
  it('returns 0 for wrong pick', () => {
    expect(scoreChaosBall('No', 'Yes')).toBe(0)
  })
  it('returns 0 when pick is null', () => {
    expect(scoreChaosBall(null, 'Yes')).toBe(0)
  })
  it('returns 0 when correct answer is null', () => {
    expect(scoreChaosBall('Yes', null)).toBe(0)
  })
})

// ─── scoreVillainPick ─────────────────────────────────────────────────────────

describe('scoreVillainPick', () => {
  const player = (overrides) => ({ name: 'Rohit Sharma', runs: 0, wickets: 0, ...overrides })

  // Flop boundary conditions
  it('+15 when runs=9, wkts=0 (just below flop boundary)', () => {
    const { pts, reason } = scoreVillainPick('Rohit Sharma', [player({ runs: 9, wickets: 0 })])
    expect(pts).toBe(15)
    expect(reason).toBe('flopped')
  })
  it('neutral when runs=10, wkts=0 (not < 10)', () => {
    const { pts, reason } = scoreVillainPick('Rohit Sharma', [player({ runs: 10, wickets: 0 })])
    expect(pts).toBe(0)
    expect(reason).toBe('neutral')
  })

  // Impact boundary conditions
  it('neutral when runs=30, wkts=0 (not > 30)', () => {
    const { pts, reason } = scoreVillainPick('Rohit Sharma', [player({ runs: 30, wickets: 0 })])
    expect(pts).toBe(0)
    expect(reason).toBe('neutral')
  })
  it('-5 when runs=31, wkts=0 (just above impact boundary)', () => {
    const { pts, reason } = scoreVillainPick('Rohit Sharma', [player({ runs: 31, wickets: 0 })])
    expect(pts).toBe(-5)
    expect(reason).toBe('impact')
  })

  // Wicket-based impact
  it('-5 when runs=0, wkts=2 (wickets threshold hit)', () => {
    const { pts, reason } = scoreVillainPick('Rohit Sharma', [player({ runs: 0, wickets: 2 })])
    expect(pts).toBe(-5)
    expect(reason).toBe('impact')
  })
  it('-5 when runs=0, wkts=3 (wickets above threshold)', () => {
    const { pts, reason } = scoreVillainPick('Rohit Sharma', [player({ runs: 0, wickets: 3 })])
    expect(pts).toBe(-5)
    expect(reason).toBe('impact')
  })

  // Neutral cases
  it('neutral when runs=0, wkts=1 (runs < 10 but wkts not 0)', () => {
    const { pts, reason } = scoreVillainPick('Rohit Sharma', [player({ runs: 0, wickets: 1 })])
    expect(pts).toBe(0)
    expect(reason).toBe('neutral')
  })
  it('neutral when runs=5, wkts=1', () => {
    const { pts, reason } = scoreVillainPick('Rohit Sharma', [player({ runs: 5, wickets: 1 })])
    expect(pts).toBe(0)
    expect(reason).toBe('neutral')
  })
  it('neutral when runs=15, wkts=0', () => {
    const { pts, reason } = scoreVillainPick('Rohit Sharma', [player({ runs: 15, wickets: 0 })])
    expect(pts).toBe(0)
    expect(reason).toBe('neutral')
  })

  // DNP
  it('0 pts with reason dnp when player did not play', () => {
    const { pts, reason } = scoreVillainPick('Rohit Sharma', [player({ didNotPlay: true })])
    expect(pts).toBe(0)
    expect(reason).toBe('dnp')
  })

  // Missing fields
  it('player not found in scorecard → not_found', () => {
    const { pts, reason } = scoreVillainPick('Nobody', [player()])
    expect(pts).toBe(0)
    expect(reason).toBe('not_found')
  })
  it('null playerName → not_picked', () => {
    const { pts, reason } = scoreVillainPick(null, [player()])
    expect(pts).toBe(0)
    expect(reason).toBe('not_picked')
  })
  it('empty scorecard → not_picked', () => {
    const { pts, reason } = scoreVillainPick('Rohit Sharma', [])
    expect(pts).toBe(0)
    expect(reason).toBe('not_picked')
  })
  it('null scorecard → not_picked', () => {
    const { pts, reason } = scoreVillainPick('Rohit Sharma', null)
    expect(pts).toBe(0)
    expect(reason).toBe('not_picked')
  })

  // Case-insensitive name matching
  it('matches player name case-insensitively (upper)', () => {
    const { pts } = scoreVillainPick('ROHIT SHARMA', [player({ runs: 8, wickets: 0 })])
    expect(pts).toBe(15)
  })
  it('matches player name case-insensitively (lower)', () => {
    const { pts } = scoreVillainPick('rohit sharma', [player({ runs: 8, wickets: 0 })])
    expect(pts).toBe(15)
  })

  // Missing numeric fields default to 0
  it('missing runs field defaults to 0 (wkts=3 → impact)', () => {
    const { pts, reason } = scoreVillainPick('Rohit Sharma', [{ name: 'Rohit Sharma', wickets: 3 }])
    expect(pts).toBe(-5)
    expect(reason).toBe('impact')
  })
  it('missing wkts field defaults to 0 (runs=35 → impact)', () => {
    const { pts, reason } = scoreVillainPick('Rohit Sharma', [{ name: 'Rohit Sharma', runs: 35 }])
    expect(pts).toBe(-5)
    expect(reason).toBe('impact')
  })
  it('both fields missing → runs=0, wkts=0 → flopped', () => {
    const { pts, reason } = scoreVillainPick('Rohit Sharma', [{ name: 'Rohit Sharma' }])
    expect(pts).toBe(15)
    expect(reason).toBe('flopped')
  })
})

// ─── calculateContrarianMultiplier ───────────────────────────────────────────

describe('calculateContrarianMultiplier', () => {
  it('2.0x when only 1 person picked that option', () => {
    expect(calculateContrarianMultiplier('rcb', ['rcb'])).toBe(2.0)
  })
  it('2.0x when user is the sole rcb picker among multiple picks', () => {
    expect(calculateContrarianMultiplier('rcb', ['rcb', 'mi', 'csk'])).toBe(2.0)
  })
  it('1.5x when exactly 2 people picked the same option', () => {
    expect(calculateContrarianMultiplier('rcb', ['rcb', 'rcb'])).toBe(1.5)
  })
  it('1.5x when 2 of 3 picked same option', () => {
    expect(calculateContrarianMultiplier('rcb', ['rcb', 'rcb', 'mi'])).toBe(1.5)
  })
  it('1.0x when 3 or more picked the same option', () => {
    expect(calculateContrarianMultiplier('rcb', ['rcb', 'rcb', 'rcb'])).toBe(1.0)
  })
  it('1.0x when 3 of 4 picked same option', () => {
    expect(calculateContrarianMultiplier('rcb', ['rcb', 'rcb', 'rcb', 'mi'])).toBe(1.0)
  })
  it('1.0x fallback when userPick is null', () => {
    expect(calculateContrarianMultiplier(null, ['rcb', 'mi'])).toBe(1.0)
  })
  it('1.0x fallback when allPicks is null', () => {
    expect(calculateContrarianMultiplier('rcb', null)).toBe(1.0)
  })
  it('1.0x fallback when allPicks is empty array', () => {
    expect(calculateContrarianMultiplier('rcb', [])).toBe(1.0)
  })
})

// ─── scoreH2HMatch ────────────────────────────────────────────────────────────

describe('scoreH2HMatch', () => {
  it('higher scorer in a pairing gets +10', () => {
    const result = scoreH2HMatch(
      [{ user_a: 'A', user_b: 'B' }],
      { A: 30, B: 20 }
    )
    expect(result.A).toBe(10)
    expect(result.B).toBe(0)
  })
  it('reversed pairing: B wins', () => {
    const result = scoreH2HMatch(
      [{ user_a: 'A', user_b: 'B' }],
      { A: 20, B: 30 }
    )
    expect(result.A).toBe(0)
    expect(result.B).toBe(10)
  })
  it('tie → no points for either', () => {
    const result = scoreH2HMatch(
      [{ user_a: 'A', user_b: 'B' }],
      { A: 25, B: 25 }
    )
    expect(result.A).toBe(0)
    expect(result.B).toBe(0)
  })
  it('multiple pairings processed independently', () => {
    const result = scoreH2HMatch(
      [{ user_a: 'A', user_b: 'B' }, { user_a: 'C', user_b: 'D' }],
      { A: 30, B: 20, C: 10, D: 40 }
    )
    expect(result.A).toBe(10)
    expect(result.B).toBe(0)
    expect(result.C).toBe(0)
    expect(result.D).toBe(10)
  })
  it('user missing from matchTotals defaults to 0', () => {
    const result = scoreH2HMatch(
      [{ user_a: 'A', user_b: 'B' }],
      { A: 10 } // B missing
    )
    expect(result.A).toBe(10)
    expect(result.B).toBe(0)
  })
  it('empty pairings array returns empty object', () => {
    expect(scoreH2HMatch([], { A: 30, B: 20 })).toEqual({})
  })
})

// ─── scoreMatchCard ───────────────────────────────────────────────────────────

describe('scoreMatchCard', () => {
  const makePred = (overrides = {}) => ({
    match_winner_pick: 'rcb',
    the_call_pick: 'Over 13',
    villain_pick_player: 'Rohit Sharma',
    chaos_ball_pick: 'Yes',
    ...overrides,
  })

  const matchResult = {
    winner: 'rcb',
    scorecard: [{ name: 'Rohit Sharma', runs: 8, wickets: 0 }],
  }

  const questionResults = { the_call: 'Over 13', chaos_ball: 'Yes' }

  it('max score with all correct picks, no allPicks (no contrarian)', () => {
    const result = scoreMatchCard(makePred(), matchResult, questionResults, null)
    expect(result.winner_pts).toBe(10)
    expect(result.call_pts).toBe(10)
    expect(result.villain_pts).toBe(15)
    expect(result.chaos_pts).toBe(12)
    expect(result.total).toBe(47)
  })

  it('solo contrarian → 2x multiplier on winner + call', () => {
    const allPicks = { winner: ['rcb'], the_call: ['Over 13'] }
    const result = scoreMatchCard(makePred(), matchResult, questionResults, allPicks)
    expect(result.winner_pts).toBe(20)  // 10 * 2.0
    expect(result.call_pts).toBe(20)    // 10 * 2.0
    expect(result.villain_pts).toBe(15)
    expect(result.chaos_pts).toBe(12)   // chaos: no contrarian
    expect(result.total).toBe(67)
    expect(result.breakdown.winnerMultiplier).toBe(2.0)
    expect(result.breakdown.callMultiplier).toBe(2.0)
  })

  it('1.5x contrarian when 2 of group picked same', () => {
    const allPicks = { winner: ['rcb', 'rcb', 'mi'], the_call: ['Over 13'] }
    const result = scoreMatchCard(makePred(), matchResult, questionResults, allPicks)
    expect(result.winner_pts).toBe(15)  // Math.round(10 * 1.5)
  })

  it('chaos ball correct, all 6 picked Yes → still gets base 12 pts (1x, no penalty)', () => {
    const allPicks = { winner: ['rcb', 'rcb', 'rcb'], the_call: ['Over 13', 'Over 13', 'Over 13'] }
    const result = scoreMatchCard(makePred(), matchResult, questionResults, allPicks)
    expect(result.chaos_pts).toBe(12)   // not affected by contrarian multiplier
  })

  it('all wrong picks → negative total from villain impact', () => {
    const wrongPred = makePred({
      match_winner_pick: 'mi',
      the_call_pick: 'Under 13',
      villain_pick_player: 'Big Impact Player',
      chaos_ball_pick: 'No',
    })
    const wrongMatch = {
      winner: 'rcb',
      scorecard: [{ name: 'Big Impact Player', runs: 40, wickets: 0 }],
    }
    const result = scoreMatchCard(wrongPred, wrongMatch, questionResults, null)
    expect(result.winner_pts).toBe(0)
    expect(result.call_pts).toBe(0)
    expect(result.villain_pts).toBe(-5)
    expect(result.chaos_pts).toBe(0)
    expect(result.total).toBe(-5)
  })

  it('chaos ball does NOT get contrarian multiplier even when solo pick', () => {
    // Even if only user picked 'Yes', chaos should still return 12 not 24
    const allPicks = { winner: ['rcb'], the_call: ['Over 13'], chaos_ball: ['Yes'] }
    const result = scoreMatchCard(makePred(), matchResult, questionResults, allPicks)
    expect(result.chaos_pts).toBe(12)
  })

  it('villain pick as null → 0 pts', () => {
    const result = scoreMatchCard(
      makePred({ villain_pick_player: null }),
      matchResult,
      questionResults,
      null
    )
    expect(result.villain_pts).toBe(0)
  })
})
