import { useEffect } from 'react'
import { getTeam } from '../../lib/content'
import { useTheme } from '../../contexts/ThemeContext'

/**
 * Converts a 6-digit hex colour to rgba().
 * Used to derive a dark-mode-friendly tinted background from the team's primary.
 */
function hexToRgba(hex, alpha) {
  const clean = hex.replace('#', '')
  // Handle shorthand #abc → #aabbcc
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/**
 * Injects team CSS variables onto <html> based on the user's chosen team.
 * In dark mode, --team-tinted-bg is computed as a semi-transparent overlay of
 * the primary colour (so light text remains readable on it).
 */
export function TeamThemeProvider({ team, children }) {
  const { isDark } = useTheme()

  useEffect(() => {
    const root = document.documentElement
    const teamData = team ? getTeam(team) : null

    if (teamData) {
      const { colors } = teamData
      root.style.setProperty('--team-primary', colors.primary)
      root.style.setProperty('--team-secondary', colors.secondary)
      root.style.setProperty('--team-text-on-primary', colors.textOnPrimary)

      // Dark mode: use a translucent version of the primary so dark text vars
      // stay readable. Light mode: use the design-system pastel tint.
      const tintedBg = isDark
        ? hexToRgba(colors.primary, 0.20)
        : colors.tintedBg
      root.style.setProperty('--team-tinted-bg', tintedBg)

      root.dataset.team = team
    } else {
      root.style.removeProperty('--team-primary')
      root.style.removeProperty('--team-secondary')
      root.style.removeProperty('--team-text-on-primary')
      root.style.removeProperty('--team-tinted-bg')
      delete root.dataset.team
    }
  }, [team, isDark])

  return children
}
