import scoringConfig from '../../content/scoring.json' with { type: 'json' }

const C = scoringConfig.fantasyXI

/**
 * Fantasy XI Scoring — Dream11-style with SR/economy bias.
 *
 * Scorecard player object (all numeric fields default to 0 if omitted):
 * {
 *   name:               string,
 *   did_not_play?:      boolean,   // true → 0 pts
 *   runs?:              number,
 *   balls_faced?:       number,
 *   fours?:             number,
 *   sixes?:             number,
 *   wickets?:           number,
 *   lbw_bowled?:        number,    // count of LBW/bowled dismissals taken
 *   overs_bowled?:      number,    // decimal e.g. 3.4 = 3 overs 4 balls
 *   runs_conceded?:     number,
 *   maiden_overs?:      number,
 *   catches?:           number,
 *   stumpings?:         number,
 *   run_out_direct?:    number,
 *   run_out_indirect?:  number,
 * }
 */

// ── Helpers ────────────────────────────────────────────────────────────────

/** Convert Dream11-style overs (3.4 = 3 overs 4 balls) to a decimal. */
function oversToDecimal(overs) {
  if (!overs) return 0
  const full  = Math.floor(overs)
  const balls = Math.round((overs - full) * 10) // e.g. .4 → 4 balls
  return full + balls / 6
}

// ── Batting ────────────────────────────────────────────────────────────────

function scoreBatting(p) {
  const runs   = p.runs        ?? 0
  const balls  = p.balls_faced ?? 0
  const fours  = p.fours       ?? 0
  const sixes  = p.sixes       ?? 0
  const B      = C.batting

  let pts = 0

  // Base
  pts += runs  * B.perRun
  pts += fours * B.perFour
  pts += sixes * B.perSix

  // Milestones (additive: 50 also triggers 25 bonus etc.)
  if (runs >= 100) pts += B.milestone100
  if (runs >= 50)  pts += B.milestone50
  if (runs >= 25)  pts += B.milestone25

  // Duck — batted (at least 1 ball faced) and scored 0
  if (balls >= 1 && runs === 0) pts += B.duck

  // Strike-rate bonus/penalty (min balls threshold)
  if (balls >= B.sr.minBalls) {
    const sr = (runs / balls) * 100
    if      (sr >= 170) pts += B.sr.above170
    else if (sr >= 150) pts += B.sr.above150
    else if (sr >= 130) pts += B.sr.above130
    else if (sr <  50)  pts += B.sr.below50
    else if (sr <  60)  pts += B.sr.below60
    else if (sr <  70)  pts += B.sr.below70
  }

  return pts
}

// ── Bowling ────────────────────────────────────────────────────────────────

function scoreBowling(p) {
  const wickets       = p.wickets       ?? 0
  const lbwBowled     = p.lbw_bowled    ?? 0
  const maidens       = p.maiden_overs  ?? 0
  const oversDec      = oversToDecimal(p.overs_bowled ?? 0)
  const runsConceded  = p.runs_conceded ?? 0
  const BW            = C.bowling

  let pts = 0

  // Wickets
  pts += wickets * BW.perWicket
  pts += lbwBowled * BW.lbwBowledBonus

  // Wicket-haul bonus (non-cumulative — highest bracket applies)
  const haul = BW.wicketHaulBonus
  if      (wickets >= 5) pts += haul.five
  else if (wickets >= 4) pts += haul.four
  else if (wickets >= 3) pts += haul.three
  else if (wickets >= 2) pts += haul.two

  // Maiden overs
  pts += maidens * BW.maidenOver

  // Economy bonus/penalty (min overs threshold)
  if (oversDec >= BW.economy.minOvers) {
    const eco = runsConceded / oversDec
    const E   = BW.economy
    if      (eco < 5)  pts += E.below5
    else if (eco < 6)  pts += E.below6
    else if (eco < 7)  pts += E.below7
    else if (eco >= 11) pts += E.above11
    else if (eco >= 10) pts += E.above10
    else if (eco >= 9)  pts += E.above9
  }

  return pts
}

// ── Fielding ───────────────────────────────────────────────────────────────

function scoreFielding(p) {
  const F = C.fielding
  let pts = 0
  pts += (p.catches   ?? 0) * F.catch
  pts += (p.stumpings ?? 0) * F.stumping
  pts += (p.run_out   ?? 0) * F.runOut
  return pts
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Score a single player's contribution in one match.
 * Returns { total, batting, bowling, fielding }
 */
export function scoreFantasyPlayer(player) {
  if (!player || player.did_not_play) {
    return { total: 0, batting: 0, bowling: 0, fielding: 0 }
  }
  const batting  = scoreBatting(player)
  const bowling  = scoreBowling(player)
  const fielding = scoreFielding(player)
  return { total: batting + bowling + fielding, batting, bowling, fielding }
}

/**
 * Build a map of playerName (lowercase) → { total, batting, bowling, fielding }
 * from a scorecard array.
 */
export function buildPlayerScoreMap(scorecard) {
  const map = {}
  for (const entry of (scorecard ?? [])) {
    if (entry.name) {
      map[entry.name.toLowerCase()] = scoreFantasyPlayer(entry)
    }
  }
  return map
}

/**
 * Compute one user's Fantasy XI score for a single match.
 *
 * @param {{ players: string[], captain: string, vice_captain: string }} picks
 * @param {Object} playerScoreMap — from buildPlayerScoreMap()
 * @returns {{
 *   total: number,
 *   breakdown: { [playerName]: { raw, multiplier, pts, batting, bowling, fielding } }
 * }}
 */
export function computeUserFantasyScore(picks, playerScoreMap) {
  let total = 0
  const breakdown = {}

  for (const name of (picks.players ?? [])) {
    const key    = name.toLowerCase()
    const score  = playerScoreMap[key] ?? { total: 0, batting: 0, bowling: 0, fielding: 0 }
    const isCap  = name === picks.captain
    const isVC   = name === picks.vice_captain
    const mult   = isCap ? C.captain : isVC ? C.viceCaptain : 1.0
    const pts    = Math.round(score.total * mult)

    breakdown[name] = {
      raw:       score.total,
      multiplier: mult,
      pts,
      batting:   score.batting,
      bowling:   score.bowling,
      fielding:  score.fielding,
    }
    total += pts
  }

  return { total, breakdown }
}

/**
 * Compute Fantasy XI scores for all users in a single match.
 *
 * @param {Array<{ user_id, players, captain, vice_captain }>} allPicks
 * @param {Array} scorecard — raw scorecard array from admin
 * @returns {Array<{ user_id, total, breakdown }>} sorted by total desc
 */
export function computeAllFantasyXIScores(allPicks, scorecard) {
  const playerMap = buildPlayerScoreMap(scorecard)

  const results = allPicks
    .filter(p => p.players?.length > 0)
    .map(picks => {
      const { total, breakdown } = computeUserFantasyScore(picks, playerMap)
      return { user_id: picks.user_id, total, breakdown }
    })

  results.sort((a, b) => b.total - a.total)
  return results
}
