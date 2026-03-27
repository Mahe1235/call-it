import { useMemo } from 'react'
import { teams as teamsData, getTeam } from '../../lib/content'

const ROLE_ORDER = ['WK', 'BAT', 'AR', 'BWL']
const ROLE_LABELS = { WK: 'Wicket-Keeper', BAT: 'Batsmen', AR: 'All-Rounders', BWL: 'Bowlers' }
const ROLE_COLORS = { WK: '#7c3aed', BAT: '#0284c7', AR: '#059669', BWL: '#dc2626' }

function normaliseRole(role = '') {
  const r = role.toUpperCase()
  if (r.includes('WICKET') || r === 'WK' || r === 'KEEPER') return 'WK'
  if (r.includes('ALL')    || r === 'AR')                   return 'AR'
  if (r.includes('BOWL')   || r === 'BWL' || r === 'BL')    return 'BWL'
  return 'BAT'
}

function getAllPlayersMap() {
  const map = {}
  for (const team of teamsData.teams) {
    for (const p of (team.squad ?? [])) {
      map[p.name] = {
        teamId:    team.id,
        teamShort: team.shortName,
        role:      normaliseRole(p.role ?? ''),
      }
    }
  }
  return map
}

/**
 * Fantasy XI read-only view — grouped by role, well-spaced cards.
 *
 * Props:
 *   picks   — { players, captain, vice_captain, locked }
 *   scores  — { breakdown: {name: pts}, total_pts } | null
 *   onEdit  — callback to re-open picker (null post-season)
 */
export function FantasyXICard({ picks, scores, onEdit }) {
  const playersMap = useMemo(getAllPlayersMap, [])
  const breakdown  = scores?.breakdown ?? {}
  const totalPts   = scores?.total_pts ?? 0

  // Build enriched player list
  const players = picks.players.map(name => ({
    name,
    isCaptain:     name === picks.captain,
    isViceCaptain: name === picks.vice_captain,
    role:          playersMap[name]?.role ?? 'BAT',
    teamShort:     playersMap[name]?.teamShort ?? '—',
    teamId:        playersMap[name]?.teamId ?? null,
    pts:           breakdown[name] ?? null,
  }))

  // Group by role, preserving pick order within each group
  const byRole = {}
  for (const role of ROLE_ORDER) byRole[role] = []
  for (const p of players) byRole[p.role]?.push(p)

  return (
    <div>
      {/* Total pts banner */}
      {scores && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px', borderRadius: '14px',
          background: totalPts > 0 ? 'rgba(22,163,74,0.08)' : 'var(--surface-subtle)',
          border: `1.5px solid ${totalPts > 0 ? 'rgba(22,163,74,0.20)' : 'var(--border-subtle)'}`,
          marginBottom: '18px',
        }}>
          <span className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            Fantasy XI total
          </span>
          <span className="font-display font-black" style={{
            fontSize: '24px', letterSpacing: '-0.5px',
            color: totalPts > 0 ? '#16a34a' : 'var(--text-muted)',
          }}>
            {totalPts > 0 ? `+${totalPts}` : totalPts} <span style={{ fontSize: '14px', fontWeight: 400 }}>pts</span>
          </span>
        </div>
      )}

      {/* Role sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '16px' }}>
        {ROLE_ORDER.map(role => {
          const group = byRole[role]
          if (!group.length) return null
          const roleColor = ROLE_COLORS[role]

          return (
            <div key={role}>
              {/* Role header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{
                  fontFamily: 'Bricolage Grotesque, sans-serif',
                  fontWeight: 800, fontSize: '10px', letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: roleColor,
                  padding: '2px 8px', borderRadius: '99px',
                  border: `1.5px solid ${roleColor}`,
                  opacity: 0.85,
                }}>
                  {role}
                </span>
                <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                  {ROLE_LABELS[role]}
                </span>
              </div>

              {/* Player cards — 2-column grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                {group.map(player => (
                  <PlayerCard
                    key={player.name}
                    player={player}
                    roleColor={roleColor}
                    showPts={scores !== null}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Multiplier note */}
      <p className="font-body text-xs" style={{
        color: 'var(--text-muted)', textAlign: 'center',
        marginBottom: onEdit ? '14px' : '4px',
      }}>
        Captain earns <strong>2×</strong> · Vice Captain earns <strong>1.5×</strong>
      </p>

      {/* Edit button */}
      {onEdit && (
        <button
          onClick={onEdit}
          className="font-display font-bold tap-feedback"
          style={{
            display: 'block', width: '100%',
            background: 'var(--surface-subtle)',
            border: '1.5px solid var(--border-default)',
            borderRadius: '12px',
            padding: '13px', fontSize: '14px',
            color: 'var(--text-primary)', cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          ✏️ Edit my XI
        </button>
      )}
    </div>
  )
}

/* ─── Individual player card ──────────────────────────────────────────────── */

function PlayerCard({ player, roleColor, showPts }) {
  const team = player.teamId ? getTeam(player.teamId) : null
  const { isCaptain, isViceCaptain } = player

  // Captain gets amber tint; VC gets a neutral tint
  const borderColor = isCaptain
    ? '#b45309'
    : isViceCaptain
    ? '#6b7280'
    : 'var(--border-subtle)'

  const bgColor = isCaptain
    ? 'rgba(180, 83, 9, 0.05)'
    : isViceCaptain
    ? 'rgba(107, 114, 128, 0.05)'
    : 'var(--card)'

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      borderRadius: '14px',
      border: `1.5px solid ${borderColor}`,
      background: bgColor,
      overflow: 'hidden',
      gap: 0,
    }}>
      {/* Team colour bar */}
      <div style={{
        width: '5px',
        alignSelf: 'stretch',
        background: team?.colors?.primary ?? roleColor,
        flexShrink: 0,
      }} />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, padding: '9px 8px', position: 'relative', overflow: 'hidden' }}>
        {/* Ghost logo */}
        {team?.logoUrl && (
          <img
            src={team.logoUrl}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute', right: '-6px', top: '50%',
              transform: 'translateY(-50%)',
              width: '36px', height: '36px',
              objectFit: 'contain',
              opacity: 0.14,
              pointerEvents: 'none', userSelect: 'none',
            }}
          />
        )}

        {/* C / VC badge — top right */}
        {(isCaptain || isViceCaptain) && (
          <div style={{
            position: 'absolute', top: '6px', right: '6px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px',
          }}>
            <div style={{
              padding: '1px 5px', borderRadius: '5px',
              background: isCaptain ? '#b45309' : 'transparent',
              border: isCaptain ? 'none' : '1.5px solid #6b7280',
            }}>
              <span style={{
                fontFamily: 'Bricolage Grotesque, sans-serif',
                fontWeight: 800, fontSize: '10px',
                color: isCaptain ? '#fff' : '#6b7280',
              }}>
                {isCaptain ? 'C' : 'VC'}
              </span>
            </div>
            <span className="font-mono" style={{ fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
              {isCaptain ? '2×' : '1.5×'}
            </span>
          </div>
        )}

        {/* Name */}
        <p className="font-display font-bold" style={{
          fontSize: '13px', color: 'var(--text-primary)',
          margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          letterSpacing: '-0.2px',
          paddingRight: (isCaptain || isViceCaptain) ? '28px' : '20px',
        }}>
          {player.name}
        </p>

        {/* Team + pts row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
          <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {player.teamShort}
          </span>
          {showPts && (
            <span className="font-display font-black" style={{
              fontSize: '13px', letterSpacing: '-0.3px',
              color: player.pts > 0 ? '#16a34a' : player.pts < 0 ? '#dc2626' : 'var(--text-muted)',
            }}>
              {player.pts !== null ? (player.pts > 0 ? `+${player.pts}` : player.pts) : '—'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
