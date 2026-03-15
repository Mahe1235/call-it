import { getTeam } from '../../lib/content'
import { useAuth } from '../../hooks/useAuth'

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

/**
 * Full ranked leaderboard table.
 * Props:
 *   entries — array from useLeaderboard()
 */
export function LeaderboardTable({ entries }) {
  const { user } = useAuth()

  if (!entries.length) {
    return (
      <div style={{
        padding: '32px 20px',
        textAlign: 'center',
        borderRadius: '16px',
        background: 'var(--card)',
        border: '1.5px solid var(--border-subtle)',
      }}>
        <p style={{ fontSize: '32px', marginBottom: '8px' }}>📊</p>
        <p className="font-display font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
          No scores yet
        </p>
        <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
          Leaderboard fills up after the first match is scored.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {entries.map((entry, i) => (
        <LeaderboardRow
          key={entry.user_id}
          entry={entry}
          isMe={entry.user_id === user?.id}
          isFirst={i === 0}
        />
      ))}
    </div>
  )
}

function LeaderboardRow({ entry, isMe }) {
  const team = getTeam(entry.team)
  const medal = MEDALS[entry.rank]
  const delta = entry.last_match_pts

  return (
    <div style={{
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '13px 14px',
      borderRadius: '14px',
      background: isMe ? 'var(--team-tinted-bg)' : 'var(--card)',
      border: `1.5px solid ${isMe ? 'var(--team-primary)' : 'var(--border-subtle)'}`,
      transition: 'background 0.2s',
    }}>

      {/* Ghost team logo watermark */}
      {team?.logoUrl && (
        <img
          src={team.logoUrl}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: '-14px',
            top: '50%',
            transform: 'translateY(-50%)',
            height: '80px',
            width: '80px',
            objectFit: 'contain',
            opacity: 0.18,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
      )}

      {/* Rank */}
      <div style={{ width: '28px', textAlign: 'center', flexShrink: 0 }}>
        {medal ? (
          <span style={{ fontSize: '18px' }}>{medal}</span>
        ) : (
          <span className="font-mono text-sm" style={{ color: 'var(--text-muted)', fontWeight: 700 }}>
            #{entry.rank}
          </span>
        )}
      </div>

      {/* Team logo (small) + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flex: 1, minWidth: 0 }}>
        {team?.logoUrl ? (
          <img
            src={team.logoUrl}
            alt={team.shortName}
            style={{
              width: '24px',
              height: '24px',
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />
        ) : (
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: team?.colors?.primary ?? '#999',
            flexShrink: 0,
          }} />
        )}
        <p
          className="font-display font-bold text-sm"
          style={{
            color: 'var(--text-primary)',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {entry.display_name}
          {isMe && (
            <span className="font-body" style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '4px', fontSize: '12px' }}>
              (you)
            </span>
          )}
        </p>
      </div>

      {/* Last match delta */}
      {delta != null && (
        <span className="font-mono text-xs" style={{
          color: delta > 0 ? '#16a34a' : 'var(--text-muted)',
          flexShrink: 0,
        }}>
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}

      {/* Total pts */}
      <div style={{ textAlign: 'right', flexShrink: 0, paddingRight: '44px' }}>
        <p className="font-display font-black" style={{
          fontSize: '18px',
          color: 'var(--text-primary)',
          margin: 0,
          letterSpacing: '-0.5px',
        }}>
          {entry.total_pts}
        </p>
        <p className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)', margin: 0, letterSpacing: '0.5px' }}>
          PTS
        </p>
      </div>
    </div>
  )
}
