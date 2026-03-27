import { getTeam } from '../../lib/content'
import { useAuth } from '../../hooks/useAuth'

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

/**
 * Fantasy XI leaderboard — ranked by accumulated fantasy_xi_pts.
 *
 * Props:
 *   entries       — from useFantasyXIGroup()
 *   seasonStarted — bool: hide pts before season begins
 */
export function FantasyLeaderboard({ entries, seasonStarted }) {
  const { user } = useAuth()

  if (!entries.length) {
    return (
      <div style={{
        padding: '32px 20px', textAlign: 'center',
        borderRadius: '16px', background: 'var(--card)',
        border: '1.5px solid var(--border-subtle)',
      }}>
        <p style={{ fontSize: '32px', marginBottom: '8px' }}>⭐</p>
        <p className="font-display font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
          No Fantasy XIs yet
        </p>
        <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
          Be the first to lock your XI.
        </p>
      </div>
    )
  }

  const ranked = [...entries]
    .sort((a, b) => b.fantasy_xi_pts - a.fantasy_xi_pts)
    .map((e, i) => ({ ...e, rank: i + 1 }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {ranked.map(entry => {
        const isMe  = entry.user_id === user?.id
        const team  = getTeam(entry.team)
        const medal = MEDALS[entry.rank]

        return (
          <div key={entry.user_id} style={{
            position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '13px 14px', borderRadius: '14px',
            background: isMe ? 'var(--team-tinted-bg)' : 'var(--card)',
            border: `1.5px solid ${isMe ? 'var(--team-primary)' : 'var(--border-subtle)'}`,
          }}>
            {/* Ghost logo */}
            {team?.logoUrl && (
              <img src={team.logoUrl} alt="" aria-hidden="true" style={{
                position: 'absolute', right: '-14px', top: '50%',
                transform: 'translateY(-50%)',
                height: '72px', width: '72px',
                objectFit: 'contain', opacity: 0.14,
                pointerEvents: 'none', userSelect: 'none',
              }} />
            )}
            {team?.shortName && (
              <span aria-hidden="true" style={{
                position: 'absolute', right: '8px', bottom: '5px',
                fontFamily: 'Bricolage Grotesque, sans-serif',
                fontWeight: 900, fontSize: '10px', letterSpacing: '0.12em',
                color: team?.colors?.primary ?? 'var(--text-muted)',
                opacity: 0.24, textTransform: 'uppercase',
                pointerEvents: 'none', userSelect: 'none',
              }}>
                {team.shortName}
              </span>
            )}

            {/* Rank */}
            <div style={{ width: '28px', textAlign: 'center', flexShrink: 0 }}>
              {medal
                ? <span style={{ fontSize: '18px' }}>{medal}</span>
                : <span className="font-mono text-sm" style={{ color: 'var(--text-muted)', fontWeight: 700 }}>#{entry.rank}</span>
              }
            </div>

            {/* Logo + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flex: 1, minWidth: 0 }}>
              {team?.logoUrl
                ? <img src={team.logoUrl} alt={team.shortName} style={{ width: '22px', height: '22px', objectFit: 'contain', flexShrink: 0 }} />
                : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: team?.colors?.primary ?? '#999', flexShrink: 0 }} />
              }
              <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.display_name}
                {isMe && <span className="font-body" style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '4px', fontSize: '12px' }}>(you)</span>}
              </p>
            </div>

            {/* Locked badge */}
            {!entry.locked && (
              <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.05em', flexShrink: 0, border: '1px dashed var(--border-default)', borderRadius: '4px', padding: '2px 6px', textTransform: 'uppercase' }}>
                Draft
              </span>
            )}

            {/* Points — hidden pre-season */}
            {seasonStarted ? (
              <div style={{ textAlign: 'right', flexShrink: 0, paddingRight: '40px' }}>
                <p className="font-display font-black" style={{ fontSize: '18px', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
                  {entry.fantasy_xi_pts}
                </p>
                <p className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)', margin: 0, letterSpacing: '0.5px' }}>
                  PTS
                </p>
              </div>
            ) : (
              <div style={{ flexShrink: 0, paddingRight: '40px' }}>
                <p className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)', margin: 0, letterSpacing: '0.5px', textAlign: 'right' }}>
                  pts live<br/>after M1
                </p>
              </div>
            )}
          </div>
        )
      })}

      {/* Pre-season note */}
      {!seasonStarted && (
        <p className="font-body text-xs text-center" style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
          Points activate after the first match is bowled 🏏
        </p>
      )}
    </div>
  )
}
