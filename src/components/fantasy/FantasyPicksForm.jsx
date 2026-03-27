import { useState, useMemo } from 'react'
import { teams as teamsData, getTeam } from '../../lib/content'

// ── Role rules ────────────────────────────────────────────────────────────────
const ROLES = {
  WK:  { label: 'Wicket-Keeper', short: 'WK',  min: 1, max: 4 },
  BAT: { label: 'Batsman',       short: 'BAT', min: 3, max: 6 },
  AR:  { label: 'All-Rounder',   short: 'AR',  min: 1, max: 4 },
  BWL: { label: 'Bowler',        short: 'BWL', min: 3, max: 6 },
}
const ROLE_ORDER = ['WK', 'BAT', 'AR', 'BWL']
const TOTAL = 11

function normaliseRole(role = '') {
  const r = role.toUpperCase()
  if (r.includes('WICKET') || r === 'WK' || r === 'KEEPER') return 'WK'
  if (r.includes('ALL')    || r === 'AR')                   return 'AR'
  if (r.includes('BOWL')   || r === 'BWL' || r === 'BL')    return 'BWL'
  return 'BAT'
}

function getAllPlayers() {
  const list = []
  for (const team of teamsData.teams) {
    for (const p of (team.squad ?? [])) {
      list.push({
        name:      p.name,
        role:      normaliseRole(p.role),
        teamId:    team.id,
        teamShort: team.shortName,
      })
    }
  }
  return list.sort((a, b) => a.name.localeCompare(b.name))
}

function roleCounts(selected, allPlayers) {
  const counts = { WK: 0, BAT: 0, AR: 0, BWL: 0 }
  for (const name of selected) {
    const p = allPlayers.find(p => p.name === name)
    if (p) counts[p.role] = (counts[p.role] ?? 0) + 1
  }
  return counts
}

function isCompositionValid(counts) {
  return ROLE_ORDER.every(r => counts[r] >= ROLES[r].min && counts[r] <= ROLES[r].max)
}

/**
 * Fantasy XI player selection form.
 *
 * Props:
 *   initialPlayers   — string[] (pre-selected, e.g. from draft)
 *   initialCaptain   — string | null
 *   initialViceCap   — string | null
 *   onSave(players, captain, viceCaptain, lock) — called on save/lock
 *   saving           — bool
 */
export function FantasyPicksForm({ initialPlayers = [], initialCaptain = null, initialViceCap = null, onSave, saving }) {
  const allPlayers = useMemo(getAllPlayers, [])

  const [selected, setSelected]           = useState(new Set(initialPlayers))
  const [captain, setCaptain]             = useState(initialCaptain)
  const [viceCaptain, setViceCaptain]     = useState(initialViceCap)
  const [activeRole, setActiveRole]       = useState('WK')
  const [search, setSearch]               = useState('')

  const counts        = useMemo(() => roleCounts([...selected], allPlayers), [selected, allPlayers])
  const compositionOk = isCompositionValid(counts)
  const allPicked     = selected.size === TOTAL
  const canLock       = allPicked && compositionOk && captain && viceCaptain

  function togglePlayer(player) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(player.name)) {
        next.delete(player.name)
        if (captain === player.name)     setCaptain(null)
        if (viceCaptain === player.name) setViceCaptain(null)
      } else {
        if (next.size >= TOTAL) return prev
        const roleCount = counts[player.role] ?? 0
        if (roleCount >= ROLES[player.role].max) return prev
        next.add(player.name)
      }
      return next
    })
  }

  function handleCap(name) {
    if (captain === name) { setCaptain(null); return }
    if (viceCaptain === name) setViceCaptain(null)
    setCaptain(name)
  }

  function handleViceCap(name) {
    if (viceCaptain === name) { setViceCaptain(null); return }
    if (captain === name) setCaptain(null)
    setViceCaptain(name)
  }

  const visiblePlayers = useMemo(() => {
    const byRole = allPlayers.filter(p => p.role === activeRole)
    if (!search.trim()) return byRole
    const q = search.toLowerCase()
    return byRole.filter(p => p.name.toLowerCase().includes(q) || p.teamShort.toLowerCase().includes(q))
  }, [allPlayers, activeRole, search])

  return (
    <div>
      {/* Role tabs + counts */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '2px' }}>
        {ROLE_ORDER.map(role => {
          const r   = ROLES[role]
          const c   = counts[role]
          const ok  = c >= r.min && c <= r.max
          const over = c > r.max
          return (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              style={{
                flexShrink: 0,
                padding: '8px 14px',
                borderRadius: '10px',
                border: `1.5px solid ${activeRole === role ? 'var(--team-primary)' : over ? '#dc2626' : 'var(--border-default)'}`,
                background: activeRole === role ? 'var(--team-primary)' : 'var(--card)',
                color: activeRole === role ? 'var(--team-text-on-primary)' : over ? '#dc2626' : 'var(--text-primary)',
                fontFamily: 'Bricolage Grotesque, sans-serif',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div>{r.short}</div>
              <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '1px' }}>
                {c}/{r.max} <span style={{ opacity: 0.6 }}>(min {r.min})</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={`Search ${ROLES[activeRole].label.toLowerCase()}s…`}
        style={{
          width: '100%',
          padding: '11px 14px',
          borderRadius: '12px',
          border: '1.5px solid var(--border-default)',
          background: 'var(--card)',
          color: 'var(--text-primary)',
          fontFamily: 'Familjen Grotesk, sans-serif',
          fontSize: '14px',
          marginBottom: '10px',
          boxSizing: 'border-box',
        }}
      />

      {/* C/VC hint — shown once any player is selected */}
      {selected.size > 0 && (
        <p className="font-mono text-xs" style={{ color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center', letterSpacing: '0.04em' }}>
          Tap <strong>C</strong> / <strong>VC</strong> on any selected player to assign captain roles
        </p>
      )}

      {/* Player list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '380px', overflowY: 'auto', marginBottom: '16px' }}>
        {visiblePlayers.length === 0 && (
          <p className="font-body text-sm" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
            No players found.
          </p>
        )}
        {visiblePlayers.map(player => {
          const isSelected = selected.has(player.name)
          const isCap      = captain === player.name
          const isVC       = viceCaptain === player.name
          const team       = getTeam(player.teamId)
          const roleCount  = counts[player.role]
          const roleFull   = roleCount >= ROLES[player.role].max && !isSelected
          const listFull   = selected.size >= TOTAL && !isSelected
          const disabled   = roleFull || listFull

          return (
            <div
              key={player.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '11px 14px',
                borderRadius: '12px',
                border: `1.5px solid ${isSelected ? (isCap ? '#b45309' : isVC ? '#6b7280' : 'var(--team-primary)') : 'var(--border-subtle)'}`,
                background: isSelected ? 'var(--team-tinted-bg)' : 'var(--card)',
                opacity: disabled ? 0.4 : 1,
                gap: '10px',
              }}
            >
              {/* Team dot */}
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: team?.colors?.primary ?? '#999',
                flexShrink: 0,
              }} />

              {/* Name + team — tappable area to select/deselect */}
              <button
                onClick={() => togglePlayer(player)}
                disabled={disabled}
                style={{
                  flex: 1, minWidth: 0, textAlign: 'left', background: 'none',
                  border: 'none', padding: 0, cursor: disabled ? 'not-allowed' : 'pointer',
                }}
              >
                <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {player.name}
                </p>
                <p className="font-mono text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>
                  {player.teamShort}
                </p>
              </button>

              {/* C / VC badges — always visible on selected rows */}
              {isSelected && (
                <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleCap(player.name)}
                    title="Captain — 2× points"
                    style={{
                      width: '28px', height: '26px', borderRadius: '7px',
                      border: `1.5px solid ${isCap ? '#b45309' : 'var(--border-default)'}`,
                      background: isCap ? '#b45309' : 'transparent',
                      color: isCap ? '#fff' : 'var(--text-muted)',
                      fontFamily: 'Bricolage Grotesque, sans-serif',
                      fontWeight: 800, fontSize: '11px', cursor: 'pointer',
                    }}
                  >C</button>
                  <button
                    onClick={() => handleViceCap(player.name)}
                    title="Vice Captain — 1.5× points"
                    style={{
                      width: '28px', height: '26px', borderRadius: '7px',
                      border: `1.5px solid ${isVC ? '#4b5563' : 'var(--border-default)'}`,
                      background: isVC ? '#4b5563' : 'transparent',
                      color: isVC ? '#fff' : 'var(--text-muted)',
                      fontFamily: 'Bricolage Grotesque, sans-serif',
                      fontWeight: 800, fontSize: '10px', cursor: 'pointer',
                    }}
                  >VC</button>
                </div>
              )}

              {/* Checkmark */}
              {isSelected && (
                <span style={{ fontSize: '14px', flexShrink: 0, color: 'var(--text-muted)' }}>✓</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Selected count */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '12px', padding: '10px 14px',
        background: 'var(--surface-subtle)', borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
      }}>
        <div>
          <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>SELECTED</span>
          {captain && (
            <span className="font-mono text-xs" style={{ color: '#b45309', marginLeft: '10px' }}>
              C: {captain.split(' ').pop()}
            </span>
          )}
          {viceCaptain && (
            <span className="font-mono text-xs" style={{ color: '#4b5563', marginLeft: '8px' }}>
              VC: {viceCaptain.split(' ').pop()}
            </span>
          )}
        </div>
        <span className="font-display font-black" style={{
          fontSize: '20px', color: selected.size === TOTAL ? 'var(--team-primary)' : 'var(--text-primary)',
          letterSpacing: '-0.5px',
        }}>
          {selected.size} / {TOTAL}
        </span>
      </div>

      {/* Validation hint */}
      {allPicked && !compositionOk && (
        <p className="font-body text-xs mb-3" style={{ color: '#dc2626', textAlign: 'center' }}>
          Composition invalid — check role minimums (min 1 WK, 3 BAT, 1 AR, 3 BWL).
        </p>
      )}
      {allPicked && compositionOk && !captain && (
        <p className="font-body text-xs mb-3" style={{ color: '#b45309', textAlign: 'center' }}>
          Tap <strong>C</strong> on a player above to set your captain.
        </p>
      )}
      {allPicked && compositionOk && captain && !viceCaptain && (
        <p className="font-body text-xs mb-3" style={{ color: '#4b5563', textAlign: 'center' }}>
          Tap <strong>VC</strong> on a player above to set your vice captain.
        </p>
      )}

      {/* Save draft + Lock buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onSave([...selected], captain, viceCaptain, false)}
          disabled={saving || selected.size === 0}
          className="font-display font-bold tap-feedback"
          style={{
            flex: '0 0 auto',
            padding: '16px 18px',
            borderRadius: '14px',
            border: '1.5px solid var(--border-default)',
            background: 'var(--card)',
            color: 'var(--text-muted)',
            fontSize: '14px',
            cursor: saving || selected.size === 0 ? 'not-allowed' : 'pointer',
            opacity: selected.size === 0 ? 0.4 : 1,
          }}
        >
          Save draft
        </button>
        <button
          onClick={() => onSave([...selected], captain, viceCaptain, true)}
          disabled={saving || !canLock}
          className="font-display font-extrabold tap-feedback"
          style={{
            flex: 1,
            background: canLock ? 'var(--team-primary)' : 'var(--surface-subtle)',
            color: canLock ? 'var(--team-text-on-primary)' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '14px',
            padding: '16px',
            fontSize: '17px',
            letterSpacing: '-0.3px',
            cursor: canLock ? 'pointer' : 'not-allowed',
          }}
        >
          {saving ? 'Saving…' : 'Lock my XI →'}
        </button>
      </div>
    </div>
  )
}
