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

// ─── Season Scoring ───────────────────────────────────────────────────────────

/**
 * Helper: return pts for a player in a ranked list (orange/purple/sixes caps).
 * rankList is ordered [rank1, rank2, rank3, rank4, rank5].
 * capConfig is the scoring.json config for that cap (e.g. S.season.orangeCap).
 */
function _capPtsForPlayer(playerName, rankList, capConfig) {
  if (!playerName) return 0
  const idx = rankList.findIndex(p => p?.toLowerCase() === playerName.toLowerCase())
  if (idx === -1) return capConfig.outsideTop5
  const rankKey = `rank${idx + 1}`
  return capConfig[rankKey] ?? capConfig.outsideTop5
}

/**
 * Score one user's full season predictions.
 *
 * @param {Object} predictions  - single row from season_predictions
 * @param {Object} results      - actual season outcomes:
 *   {
 *     top4: string[],          // 4 qualifying team ids
 *     champion: string,        // winning team id
 *     runner_up: string,       // runner-up team id
 *     wooden_spoon: string,    // last-place team id
 *     orange_cap: string[],    // top-5 run scorers [rank1, rank2, rank3, rank4, rank5]
 *     purple_cap: string[],    // top-5 wicket takers
 *     most_sixes: string[],    // top-5 six hitters
 *   }
 * @param {Object[]} allPredictions - all users' season_predictions rows (for contrarian calc)
 * @returns {{ top4_pts, champion_pts, runner_up_pts, wooden_spoon_pts, orange_cap_pts, purple_cap_pts, most_sixes_pts, total, breakdown }}
 */
export function scoreSeasonPredictions(predictions, results, allPredictions) {
  const Ss = S.season

  // Build group pick lists for contrarian calc
  const allTop4Flat       = allPredictions.flatMap(p => p.top_4_teams ?? [])
  const allChampions      = allPredictions.map(p => p.champion).filter(Boolean)
  const allRunnerUps      = allPredictions.map(p => p.runner_up).filter(Boolean)
  const allWoodenSpoons   = allPredictions.map(p => p.wooden_spoon).filter(Boolean)
  const allOrangeFlat     = allPredictions.flatMap(p => p.orange_cap_picks ?? []).filter(Boolean)
  const allPurpleFlat     = allPredictions.flatMap(p => p.purple_cap_picks ?? []).filter(Boolean)
  const allSixesFlat      = allPredictions.flatMap(p => p.most_sixes_picks ?? []).filter(Boolean)

  // ── Top 4 ──────────────────────────────────────────────────────────────────
  let top4_pts = 0
  const top4Breakdown = []
  for (const teamId of (predictions.top_4_teams ?? [])) {
    if (results.top4?.includes(teamId)) {
      const mult = calculateContrarianMultiplier(teamId, allTop4Flat)
      const pts  = Math.round(Ss.top4.perTeam * mult)
      top4_pts += pts
      top4Breakdown.push({ teamId, pts, mult })
    }
  }

  // ── Champion ───────────────────────────────────────────────────────────────
  let champion_pts = 0
  let championMult = 1.0
  if (predictions.champion && predictions.champion === results.champion) {
    championMult  = calculateContrarianMultiplier(predictions.champion, allChampions)
    champion_pts  = Math.round(Ss.champion.base * championMult)
  }

  // ── Runner-Up ──────────────────────────────────────────────────────────────
  let runner_up_pts = 0
  let runnerUpMult  = 1.0
  if (predictions.runner_up && predictions.runner_up === results.runner_up) {
    runnerUpMult  = calculateContrarianMultiplier(predictions.runner_up, allRunnerUps)
    runner_up_pts = Math.round(Ss.runnerUp.base * runnerUpMult)
  }

  // ── Wooden Spoon ───────────────────────────────────────────────────────────
  let wooden_spoon_pts = 0
  let woodenSpoonMult  = 1.0
  if (predictions.wooden_spoon && predictions.wooden_spoon === results.wooden_spoon) {
    woodenSpoonMult  = calculateContrarianMultiplier(predictions.wooden_spoon, allWoodenSpoons)
    wooden_spoon_pts = Math.round(Ss.woodenSpoon.base * woodenSpoonMult)
  }

  // ── Orange Cap ─────────────────────────────────────────────────────────────
  let orange_cap_pts = 0
  const orangeBreakdown = []
  for (const playerName of (predictions.orange_cap_picks ?? []).filter(Boolean)) {
    const rawPts = _capPtsForPlayer(playerName, results.orange_cap ?? [], Ss.orangeCap)
    if (rawPts > 0) {
      const mult = calculateContrarianMultiplier(playerName, allOrangeFlat)
      const pts  = Math.round(rawPts * mult)
      orange_cap_pts += pts
      orangeBreakdown.push({ playerName, pts, mult })
    }
  }

  // ── Purple Cap ─────────────────────────────────────────────────────────────
  let purple_cap_pts = 0
  const purpleBreakdown = []
  for (const playerName of (predictions.purple_cap_picks ?? []).filter(Boolean)) {
    const rawPts = _capPtsForPlayer(playerName, results.purple_cap ?? [], Ss.purpleCap)
    if (rawPts > 0) {
      const mult = calculateContrarianMultiplier(playerName, allPurpleFlat)
      const pts  = Math.round(rawPts * mult)
      purple_cap_pts += pts
      purpleBreakdown.push({ playerName, pts, mult })
    }
  }

  // ── Most Sixes ─────────────────────────────────────────────────────────────
  let most_sixes_pts = 0
  const sixesBreakdown = []
  for (const playerName of (predictions.most_sixes_picks ?? []).filter(Boolean)) {
    const rawPts = _capPtsForPlayer(playerName, results.most_sixes ?? [], Ss.mostSixes)
    if (rawPts > 0) {
      const mult = calculateContrarianMultiplier(playerName, allSixesFlat)
      const pts  = Math.round(rawPts * mult)
      most_sixes_pts += pts
      sixesBreakdown.push({ playerName, pts, mult })
    }
  }

  const total =
    top4_pts + champion_pts + runner_up_pts + wooden_spoon_pts +
    orange_cap_pts + purple_cap_pts + most_sixes_pts

  return {
    top4_pts,
    champion_pts,
    runner_up_pts,
    wooden_spoon_pts,
    orange_cap_pts,
    purple_cap_pts,
    most_sixes_pts,
    total,
    breakdown: {
      top4: top4Breakdown,
      champion: { mult: championMult },
      runnerUp: { mult: runnerUpMult },
      woodenSpoon: { mult: woodenSpoonMult },
      orangeCap: orangeBreakdown,
      purpleCap: purpleBreakdown,
      mostSixes: sixesBreakdown,
    },
  }
}
