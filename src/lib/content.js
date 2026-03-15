import teams from '../../content/teams.json'
import scoring from '../../content/scoring.json'
import questions from '../../content/questions.json'
import venues from '../../content/venues.json'
import season from '../../content/season.json'
import banter from '../../content/banter.json'

export { teams, scoring, questions, venues, season, banter }

/** Lookup helpers */

const IPL_LOGO_BASE = 'https://scores.iplt20.com/ipl/teamlogos'

export function getTeam(id) {
  const team = teams.teams.find((t) => t.id === id) ?? null
  if (!team) return null
  return {
    ...team,
    logoUrl: `${IPL_LOGO_BASE}/${team.shortName}.png`,
  }
}

export function getVenue(id) {
  return venues.venues.find((v) => v.id === id) ?? null
}

export function getTheCallQuestion(id) {
  return questions.theCall.find((q) => q.id === id) ?? null
}

export function getChaosBallQuestion(id) {
  return questions.chaosBall.find((q) => q.id === id) ?? null
}

/**
 * Pick a random banter string from a key path, with optional template substitution.
 * @param {string} path - dot-separated key e.g. "cardStates.open"
 * @param {Object} vars - template vars e.g. { TEAM_A: 'CSK', TEAM_B: 'MI' }
 */
export function getBanter(path, vars = {}) {
  const keys = path.split('.')
  let node = banter
  for (const k of keys) {
    node = node?.[k]
    if (node === undefined) return ''
  }
  const options = Array.isArray(node) ? node : [node]
  let text = options[Math.floor(Math.random() * options.length)]
  for (const [key, val] of Object.entries(vars)) {
    text = text.replaceAll(`{${key}}`, val)
  }
  return text
}
