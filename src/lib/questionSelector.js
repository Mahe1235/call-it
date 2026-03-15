/**
 * questionSelector.js
 * Deterministically selects one The Call + one Chaos Ball question per match.
 * Same match number always returns the same questions — no randomness.
 *
 * MVP: only Tier 1 and Tier 2 questions are used.
 */

import questionsData from '../../content/questions.json'
import venuesData from '../../content/venues.json'

const CALL_POOL = questionsData.theCall.filter(q => q.tier <= 2)
const CHAOS_POOL = questionsData.chaosBall.filter(q => q.tier <= 2)

// Which venue defaultLines key maps to which question
const QUESTION_LINE_KEY = {
  C1: 'totalSixes',
  C5: 'totalWickets',
  C8: 'totalFours',
  C10: 'totalRuns',
}

/**
 * Select questions for a match deterministically.
 *
 * @param {number} matchNumber - 1-indexed match number (1–74)
 * @param {string} venueId - venue ID from venues.json (e.g. 'wankhede')
 * @param {{ teamA?: string, teamB?: string }} [matchContext] - short names for substitution
 * @returns {{ theCall: object, chaosBall: object }}
 */
export function selectQuestionsForMatch(matchNumber, venueId, matchContext = {}) {
  const venue = venuesData.venues.find(v => v.id === venueId) ?? null

  // Use a prime offset (7) so call and chaos indices never align at the same pool position
  const callIdx = (matchNumber - 1) % CALL_POOL.length
  const chaosIdx = (matchNumber - 1 + 7) % CHAOS_POOL.length

  const theCall = resolveQuestion(CALL_POOL[callIdx], venue, matchContext)
  const chaosBall = resolveQuestion(CHAOS_POOL[chaosIdx], venue, matchContext)

  return { theCall, chaosBall }
}

/**
 * Resolve a question — substitute {line}, {team_a}, {team_b} placeholders.
 * Returns a new object; never mutates the source.
 */
function resolveQuestion(question, venue, { teamA = 'Team A', teamB = 'Team B' } = {}) {
  if (!question) return null

  const q = {
    ...question,
    answerOptions: [...question.answerOptions],
  }

  // --- Venue-specific O/U line substitution ---
  if (q.requiresVenueConfig || q.defaultLine !== undefined) {
    let line = q.defaultLine

    if (q.requiresVenueConfig && venue) {
      const lineKey = QUESTION_LINE_KEY[q.id]
      if (lineKey && venue.defaultLines?.[lineKey] !== undefined) {
        line = venue.defaultLines[lineKey]
      }
    }

    if (line !== undefined) {
      q.displayText = q.displayText.replace('{line}', line)
      q.answerOptions = q.answerOptions.map(opt => opt.replace('{line}', line))
      q.resolvedLine = line
    }
  }

  // --- Team name substitution ---
  if (q.requiresMatchContext) {
    q.displayText = q.displayText
      .replace('{team_a}', teamA)
      .replace('{team_b}', teamB)
    q.answerOptions = q.answerOptions.map(opt =>
      opt.replace('{team_a}', teamA).replace('{team_b}', teamB)
    )
  }

  return q
}

/**
 * Returns the full resolved question pools (useful for admin previews).
 */
export function getQuestionPools() {
  return {
    theCall: CALL_POOL,
    chaosBall: CHAOS_POOL,
  }
}
