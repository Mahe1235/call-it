import scoringConfig from '../../content/scoring.json' with { type: 'json' }

const S = scoringConfig

// ─── Match Card Scoring ──────────────────────────────────────────────────────

/**
 * Score the match winner pick.
 * @param {string} pick - team id the user picked
 * @param {string} winner - actual winning team id
 * @returns {number}
 */
export function scoreMatchWinner(pick, winner) {
  if (!pick || !winner) return 0
  return pick === winner ? S.matchCard.winner.correct : S.matchCard.winner.wrong
}

/**
 * Score The Call question.
 * @param {string} pick - answer string chosen by user
 * @param {string} correctAnswer - correct answer set by admin
 * @returns {number}
 */
export function scoreTheCall(pick, correctAnswer) {
  if (!pick || !correctAnswer) return 0
  return pick === correctAnswer ? S.matchCard.theCall.correct : S.matchCard.theCall.wrong
}

/**
 * Score the Chaos Ball question.
 * @param {string} pick - "Yes" or "No"
 * @param {string} correctAnswer - "Yes" or "No"
 * @returns {number}
 */
export function scoreChaosBall(pick, correctAnswer) {
  if (!pick || !correctAnswer) return 0
  return pick === correctAnswer ? S.matchCard.chaosBall.correct : S.matchCard.chaosBall.wrong
}

/**
 * Score the villain pick.
 *
 * Applies to ALL player types — both runs and wickets count as impact:
 *   Penalty  (−5): runs > 30 OR wickets >= 2
 *   Reward  (+15): runs < 10 AND wickets === 0
 *   Neutral   (0): everything else (e.g. 15 runs + 0 wkts, or 5 runs + 1 wkt)
 *   DNP       (0): did not play
 *
 * @param {string} playerName
 * @param {Array<{name: string, runs?: number, wickets?: number, role?: string, didNotPlay?: boolean}>} scorecard
 * @returns {{ pts: number, reason: string }}
 */
export function scoreVillainPick(playerName, scorecard) {
  if (!playerName || !scorecard?.length) {
    return { pts: S.matchCard.villainPick.notPicked, reason: 'not_picked' }
  }

  const player = scorecard.find(
    p => p.name?.toLowerCase() === playerName.toLowerCase()
  )

  if (!player) {
    return { pts: S.matchCard.villainPick.notPicked, reason: 'not_found' }
  }

  if (player.didNotPlay) {
    return { pts: S.matchCard.villainPick.didNotPlay, reason: 'dnp' }
  }

  const runs = player.runs ?? 0
  const wickets = player.wickets ?? 0

  if (runs > 30 || wickets >= 2) {
    return { pts: S.matchCard.villainPick.over30, reason: 'impact' }
  }
  if (runs < 10 && wickets === 0) {
    return { pts: S.matchCard.villainPick.under10, reason: 'flopped' }
  }
  return { pts: S.matchCard.villainPick.between10and30, reason: 'neutral' }
}

// ─── Contrarian Multiplier ───────────────────────────────────────────────────

/**
 * Returns the contrarian multiplier for a pick.
 * Solo picker → 2.0x, 2 of group → 1.5x, 3+ → 1.0x
 *
 * @param {string} userPick - the user's answer
 * @param {string[]} allPicks - all picks from the group (including user's)
 * @returns {number} multiplier
 */
export function calculateContrarianMultiplier(userPick, allPicks) {
  if (!userPick || !allPicks?.length) return S.contrarianMultipliers.threeOrMore
  const sameCount = allPicks.filter(p => p === userPick).length
  if (sameCount === 1) return S.contrarianMultipliers.solo
  if (sameCount === 2) return S.contrarianMultipliers.twoOfGroup
  return S.contrarianMultipliers.threeOrMore
}

// ─── H2H Scoring ────────────────────────────────────────────────────────────

/**
 * Score H2H for a single match across all active pairings.
 * The user with the higher total match card score wins +10 pts.
 * Ties: no points awarded to either.
 *
 * @param {Array<{user_a: string, user_b: string}>} pairings - active H2H pairs (user ids)
 * @param {Object<string, number>} matchTotals - map of userId → match card total
 * @returns {Object<string, number>} map of userId → h2h pts earned this match
 */
export function scoreH2HMatch(pairings, matchTotals) {
  const result = {}

  for (const { user_a, user_b } of pairings) {
    const scoreA = matchTotals[user_a] ?? 0
    const scoreB = matchTotals[user_b] ?? 0

    if (scoreA > scoreB) {
      result[user_a] = (result[user_a] ?? 0) + S.h2h.perMatchWin
      result[user_b] = result[user_b] ?? 0
    } else if (scoreB > scoreA) {
      result[user_b] = (result[user_b] ?? 0) + S.h2h.perMatchWin
      result[user_a] = result[user_a] ?? 0
    } else {
      // Tie — no points
      result[user_a] = result[user_a] ?? 0
      result[user_b] = result[user_b] ?? 0
    }
  }

  return result
}

// ─── Full Match Card Score ────────────────────────────────────────────────────

/**
 * Score a single user's full match card.
 *
 * @param {Object} prediction - row from predictions table
 * @param {Object} matchResult - { winner: string, scorecard: Array }
 * @param {Object} questionResults - { the_call: string, chaos_ball: string } correct answers
 * @param {Object} [allPicks] - { winner: string[], the_call: string[], chaos_ball: string[] } all group picks for contrarian calc
 * @returns {{ winner_pts, call_pts, villain_pts, chaos_pts, total, breakdown }}
 */
export function scoreMatchCard(prediction, matchResult, questionResults, allPicks = null) {
  const winnerRaw = scoreMatchWinner(prediction.match_winner_pick, matchResult.winner)
  const callRaw = scoreTheCall(prediction.the_call_pick, questionResults.the_call)
  const chaosRaw = scoreChaosBall(prediction.chaos_ball_pick, questionResults.chaos_ball)
  const { pts: villainPts } = scoreVillainPick(prediction.villain_pick_player, matchResult.scorecard)

  // Apply contrarian multiplier to winner + call picks if group picks provided
  let winnerMultiplier = 1.0
  let callMultiplier = 1.0

  if (allPicks) {
    if (prediction.match_winner_pick && allPicks.winner?.length) {
      winnerMultiplier = calculateContrarianMultiplier(prediction.match_winner_pick, allPicks.winner)
    }
    if (prediction.the_call_pick && allPicks.the_call?.length) {
      callMultiplier = calculateContrarianMultiplier(prediction.the_call_pick, allPicks.the_call)
    }
  }

  const winner_pts = Math.round(winnerRaw * winnerMultiplier)
  const call_pts = Math.round(callRaw * callMultiplier)
  const villain_pts = villainPts
  const chaos_pts = chaosRaw
  const total = winner_pts + call_pts + villain_pts + chaos_pts

  return {
    winner_pts,
    call_pts,
    villain_pts,
    chaos_pts,
    total,
    breakdown: {
      winnerMultiplier,
      callMultiplier,
    },
  }
}
