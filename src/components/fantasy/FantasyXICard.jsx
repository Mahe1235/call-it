import { useMemo } from 'react'
import { teams as teamsData, getTeam } from '../../lib/content'

function getAllPlayersMap() {
  const map = {}
  for (const team of teamsData.teams) {
    for (const p of (team.squad ?? [])) {
      map[p.name] = { teamId: team.id, teamShort: team.shortName, role: p.role ?? '' }
    }
  }
  return map
}

/**
 * Locked Fantasy XI display — shows 11 players with C/VC badges and pts if available.
 *
 * Props:
 *   picks   — { players, captain, vice_captain, locked }
 *   scores  — { breakdown: {name: pts}, total_pts } | null  (from fantasy_xi_scores sum)
 *   onEdit  — callback to re-open picker (only when not locked)
 */
export function FantasyXICard({ picks, scores, onEdit }) {
  const playersMap = useMemo(getAllPlayersMap, [])
  const breakdown = scores?.breakdown ?? {}
  const totalPts  = scores?.total_pts ?? 0

  const rows = picks.players.map(name => ({
    name,
    isCaptain:    name === picks.captain,
    isViceCaptain: name === picks.vice_captain,
    teamShort: playersMap[name]?.teamShort ?? '—',
    teamId:    playersMap[name]?.teamId ?? null,
    pts:       breakdown[name] ?? null,
  }))

  return (
    <div>
      {/* Total pts banner */}
      {scores && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px', borderRadius: '14px',
          background: totalPts > 0 ? 'rgba(22,163,74,0.08)' : 'var(--surface-subtle)',
          border: `1px solid ${totalPts > 0 ? 'rgba(22,163,74,0.20)' : 'var(--border-subtle)'}`,
          marginBottom: '14px',
        }}>
          <span className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            Fantasy XI total
          </span>
          <span className="font-display font-black" style={{ fontSize: '22px', color: totalPts > 0 ? '#16a34a' : 'var(--text-muted)', letterSpacing: '-0.5px' }}>
            {totalPts > 0 ? `+${totalPts}` : totalPts} pts
          </span>
        </div>
      )}

      {/* Player rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
        {rows.map(row => {
          const team = row.teamId ? getTeam(row.teamId) : null
          return (
            <div key={row.name} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '12px',
              background: 'var(--card)', border: '1.5px solid var(--border-subtle)',
            }}>
              {/* Team colour dot */}
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: team?.colors?.primary ?? '#999',
                flexShrink: 0,
              }} />

              {/* Name + team */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.name}
                </p>
                <p className="font-mono text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>
                  {row.teamShort}
                </p>
              </div>

              {/* C / VC badge */}
              {(row.isCaptain || row.isViceCaptain) && (
                <div style={{
                  padding: '2px 8px', borderRadius: '6px',
                  background: row.isCaptain ? 'var(--team-primary)' : 'var(--surface-subtle)',
                  border: row.isCaptain ? 'none' : '1px solid var(--border-default)',
                  flexShrink: 0,
                }}>
                  <span className="font-mono font-bold" style={{
                    fontSize: '11px',
                    color: row.isCaptain ? 'var(--team-text-on-primary)' : 'var(--text-muted)',
                    letterSpacing: '0.05em',
                  }}>
                    {row.isCaptain ? 'C' : 'VC'}
                  </span>
                </div>
              )}

              {/* Points */}
              <span className="font-mono font-bold text-sm" style={{
                color: row.pts > 0 ? '#16a34a' : row.pts < 0 ? '#dc2626' : 'var(--text-muted)',
                flexShrink: 0,
                minWidth: '36px',
                textAlign: 'right',
              }}>
                {row.pts !== null ? (row.pts > 0 ? `+${row.pts}` : row.pts) : '—'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Multiplier note */}
      <p className="font-body text-xs" style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '12px' }}>
        Captain earns 2× · Vice Captain earns 1.5×
      </p>

      {/* Edit link — only if not locked */}
      {!picks.locked && onEdit && (
        <button
          onClick={onEdit}
          className="font-mono tap-feedback"
          style={{
            display: 'block', width: '100%',
            background: 'none', border: 'none',
            padding: '6px', fontSize: '11px', fontWeight: 700,
            letterSpacing: '0.5px', textTransform: 'uppercase',
            color: 'var(--text-muted)', cursor: 'pointer',
            textDecoration: 'underline',
            textDecorationColor: 'var(--border-default)',
            textUnderlineOffset: '3px',
            textAlign: 'center',
          }}
        >
          ✏️ Edit XI
        </button>
      )}
    </div>
  )
}
