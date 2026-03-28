import { getTeam, getVenue } from '../../lib/content'

/**
 * Displays the two teams facing off — colored badges, venue, match number.
 * Used on Home (upcoming match) and later on the Match Card.
 */
export function MatchHeader({ match }) {
  const teamA = getTeam(match.team_a)
  const teamB = getTeam(match.team_b)
  const venue = getVenue(match.venue)

  const matchDate = new Date(match.date)
  const dateStr = matchDate.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
    timeZone: 'Asia/Kolkata',
  })
  const timeStr = matchDate.toLocaleTimeString('en-IN', {
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Kolkata',
  })

  return (
    <div style={{ marginBottom: '4px' }}>
      {/* Match meta */}
      <p className="font-mono text-xs tracking-wide uppercase mb-3" style={{ color: 'var(--text-secondary)' }}>
        M{match.match_number} · {dateStr} · {timeStr}
      </p>

      {/* Teams row */}
      <div className="flex items-center justify-between gap-3">
        <TeamBadge team={teamA} align="left" />

        <div className="flex flex-col items-center flex-shrink-0">
          <span className="font-display font-black text-base" style={{ color: 'var(--text-muted)', letterSpacing: '-0.5px' }}>
            vs
          </span>
        </div>

        <TeamBadge team={teamB} align="right" />
      </div>

      {/* Venue */}
      {venue && (
        <p className="font-body text-xs mt-3 text-center" style={{
          color: 'var(--text-muted)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          📍 {venue.name}, {venue.city}
        </p>
      )}
    </div>
  )
}

function TeamBadge({ team, align }) {
  if (!team) return null

  return (
    <div className={`flex items-center ${align === 'right' ? 'justify-end' : 'justify-start'} flex-1 min-w-0`}>
      <p
        className="font-display font-black"
        style={{
          fontSize: '22px',
          letterSpacing: '-1px',
          lineHeight: 1,
          color: 'var(--text-primary)',
          margin: 0,
        }}
      >
        {team.shortName}
      </p>
    </div>
  )
}
