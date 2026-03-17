import teams from '../../content/teams.json'
import scoring from '../../content/scoring.json'
import questions from '../../content/questions.json'
import venues from '../../content/venues.json'
import season from '../../content/season.json'
import banter from '../../content/banter.json'

export { teams, scoring, questions, venues, season, banter }

/** Lookup helpers */

const IPL_CDN = 'https://documents.iplt20.com/ipl'

// Transparent-background logo URLs from the official IPL CDN.
// DC uses a capital O in LogoOutline; RR has a different path entirely.
function getLogoUrl(shortName) {
  if (shortName === 'DC') return `${IPL_CDN}/DC/Logos/LogoOutline/DCoutline.png`
  if (shortName === 'RR') return `${IPL_CDN}/RR/Logos/RR_Logo.png`
  return `${IPL_CDN}/${shortName}/Logos/Logooutline/${shortName}outline.png`
}

export function getTeam(id) {
  const team = teams.teams.find((t) => t.id === id) ?? null
  if (!team) return null
  return {
    ...team,
    logoUrl: getLogoUrl(team.shortName),
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
 * Lines that reference a {VAR} not present in vars are automatically excluded —
 * so if FRIEND is null/missing, {FRIEND} lines are skipped entirely.
 *
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

  // Only pick lines where every referenced {VAR} has a non-null value in vars
  const available = options.filter(opt => {
    const placeholders = [...opt.matchAll(/\{([A-Z_]+)\}/g)].map(m => m[1])
    return placeholders.every(p => vars[p] != null)
  })

  const pool = available.length ? available : options  // fallback: use all if none pass
  let text = pool[Math.floor(Math.random() * pool.length)]
  for (const [key, val] of Object.entries(vars)) {
    if (val != null) text = text.replaceAll(`{${key}}`, val)
  }
  return text
}
