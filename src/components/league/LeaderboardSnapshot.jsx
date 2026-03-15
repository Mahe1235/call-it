import { Link } from 'react-router-dom'
import { useLeaderboard } from '../../hooks/useLeaderboard'
import { useAuth } from '../../hooks/useAuth'
import { getTeam } from '../../lib/content'

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

/**
 * Compact top-3 leaderboard card for the Home page.
 * Links to /league for the full table.
 */
export function LeaderboardSnapshot() {
  const { entries, loading } = useLeaderboard()
  const { user } = useAuth()

  return (
    <div style={{
      marginTop: '16px',
      borderRadius: '20px',
      padding: '18px 20px',
      background: 'var(--card)',
      border: '1.5px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-card)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <p className="font-mono text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)', margin: 0 }}>
          Standings
        </p>
        <Link
          to="/league"
          className="font-body text-xs"
          style={{ color: 'var(--team-primary)', textDecoration: 'none', fontWeight: 600 }}
        >
          Full table →
        </Link>
      </div>

      {loading ? (
        <SnapshotSkeleton />
      ) : entries.length === 0 ? (
        <p className="font-body text-sm text-center" style={{ color: 'var(--text-muted)', padding: '8px 0' }}>
          No scores yet — after Match 1.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {entries.slice(0, 3).map(entry => (
            <SnapshotRow
              key={entry.user_id}
              entry={entry}
              isMe={entry.user_id === user?.id}
            />
          ))}
          {/* Show current user's rank if outside top 3 */}
          {(() => {
            const myEntry = entries.find(e => e.user_id === user?.id)
            if (myEntry && myEntry.rank > 3) {
              return (
                <>
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', padding: '2px 0' }}>
                    ···
                  </div>
                  <SnapshotRow entry={myEntry} isMe={true} />
                </>
              )
            }
            return null
          })()}
        </div>
      )}
    </div>
  )
}

function SnapshotRow({ entry, isMe }) {
  const team = getTeam(entry.team)
  const medal = MEDALS[entry.rank]

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '9px 12px',
      borderRadius: '12px',
      background: isMe ? 'var(--team-tinted-bg)' : 'transparent',
      border: `1.5px solid ${isMe ? 'var(--team-primary)' : 'transparent'}`,
    }}>
      {/* Rank / medal */}
      <div style={{ width: '22px', textAlign: 'center', flexShrink: 0 }}>
        {medal ? (
          <span style={{ fontSize: '15px' }}>{medal}</span>
        ) : (
          <span className="font-mono" style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>
            #{entry.rank}
          </span>
        )}
      </div>

      {/* Team logo + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flex: 1, minWidth: 0 }}>
        {team?.logoUrl ? (
          <img src={team.logoUrl} alt={team.shortName} style={{ width: '20px', height: '20px', objectFit: 'contain', flexShrink: 0 }} />
        ) : (
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: team?.colors?.primary ?? '#999', flexShrink: 0 }} />
        )}
        <p className="font-body text-sm" style={{
          color: 'var(--text-primary)',
          fontWeight: isMe ? 700 : 500,
          margin: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {entry.display_name}
        </p>
      </div>

      {/* Points */}
      <p className="font-display font-black text-sm" style={{ color: 'var(--text-primary)', margin: 0, flexShrink: 0 }}>
        {entry.total_pts}
        <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)', marginLeft: '2px', fontWeight: 400 }}>pts</span>
      </p>
    </div>
  )
}

function SnapshotSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: '38px',
          borderRadius: '12px',
          background: 'linear-gradient(90deg, var(--shimmer-from) 25%, var(--shimmer-mid) 50%, var(--shimmer-from) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s ease-in-out infinite',
        }} />
      ))}
    </div>
  )
}
