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

  const [selected, setSelected] = useState(new Set(initialPlayers))
  const [captain, setCaptain]       = useState(initialCaptain)
  const [viceCaptain, setViceCaptain] = useState(initialViceCap)
  const [activeRole, setActiveRole] = useState('WK')
  const [search, setSearch] = useState('')

  const counts = useMemo(() => roleCounts([...selected], allPlayers), [selected, allPlayers])
  const compositionOk = isCompositionValid(counts)
  const allPicked = selected.size === TOTAL
  const canLock = allPicked && compositionOk && captain && viceCaptain

  function togglePlayer(player) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(player.name)) {
        next.delete(player.name)
        if (captain === player.name) setCaptain(null)
        if (viceCaptain === player.name) setViceCaptain(null)
      } else {
        if (next.size >= TOTAL) return prev  // already 11
        const roleCount = counts[player.role] ?? 0
        if (roleCount >= ROLES[player.role].max) return prev  // role full
        next.add(player.name)
      }
      return next
    })
  }

  function setCap(name) {
    if (name === viceCaptain) setViceCaptain(null)
    setCaptain(name)
  }

  function setViceCap(name) {
    if (name === captain) setCaptain(null)
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
          const r = ROLES[role]
          const c = counts[role]
          const ok = c >= r.min && c <= r.max
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

      {/* Player list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '340px', overflowY: 'auto', marginBottom: '16px' }}>
        {visiblePlayers.length === 0 && (
          <p className="font-body text-sm" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
            No players found.
          </p>
        )}
        {visiblePlayers.map(player => {
          const isSelected = selected.has(player.name)
          const team = getTeam(player.teamId)
          const roleCount = counts[player.role]
          const roleFull = roleCount >= ROLES[player.role].max && !isSelected
          const listFull = selected.size >= TOTAL && !isSelected
          const disabled = roleFull || listFull

          return (
            <button
              key={player.name}
              onClick={() => togglePlayer(player)}
              disabled={disabled}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 14px',
                borderRadius: '12px',
                border: `1.5px solid ${isSelected ? 'var(--team-primary)' : 'var(--border-subtle)'}`,
                background: isSelected ? 'var(--team-tinted-bg)' : 'var(--card)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                textAlign: 'left',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                {/* Team colour dot */}
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: team?.colors?.primary ?? '#999',
                  flexShrink: 0,
                }} />
                <div style={{ minWidth: 0 }}>
                  <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {player.name}
                  </p>
                  <p className="font-mono text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>
                    {player.teamShort}
                  </p>
                </div>
              </div>
              {isSelected && (
                <span style={{ fontSize: '16px', flexShrink: 0 }}>✓</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected count */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '16px', padding: '10px 14px',
        background: 'var(--surface-subtle)', borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
      }}>
        <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>SELECTED</span>
        <span className="font-display font-black" style={{
          fontSize: '20px', color: selected.size === TOTAL ? 'var(--team-primary)' : 'var(--text-primary)',
          letterSpacing: '-0.5px',
        }}>
          {selected.size} / {TOTAL}
        </span>
      </div>

      {/* Captain / Vice-Captain pickers — visible once 11 selected */}
      {allPicked && (
        <div style={{ marginBottom: '16px' }}>
          <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
            Captain (2×) &amp; Vice Captain (1.5×)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
            {[...selected].map(name => (
              <div key={name} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: '12px',
                background: 'var(--card)', border: '1.5px solid var(--border-subtle)',
                gap: '10px',
              }}>
                <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)', margin: 0, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {name}
                </p>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <CaptainBadge
                    label="C"
                    active={captain === name}
                    onClick={() => setCap(captain === name ? null : name)}
                    title="Captain — 2× points"
                  />
                  <CaptainBadge
                    label="VC"
                    active={viceCaptain === name}
                    onClick={() => setViceCap(viceCaptain === name ? null : name)}
                    title="Vice Captain — 1.5× points"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation hint */}
      {allPicked && !compositionOk && (
        <p className="font-body text-xs mb-3" style={{ color: '#dc2626', textAlign: 'center' }}>
          Composition invalid — check role minimums (min 1 WK, 3 BAT, 1 AR, 3 BWL).
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

function CaptainBadge({ label, active, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="tap-feedback"
      style={{
        width: '32px', height: '28px',
        borderRadius: '8px',
        border: `1.5px solid ${active ? 'var(--team-primary)' : 'var(--border-default)'}`,
        background: active ? 'var(--team-primary)' : 'transparent',
        color: active ? 'var(--team-text-on-primary)' : 'var(--text-muted)',
        fontFamily: 'Bricolage Grotesque, sans-serif',
        fontWeight: 800,
        fontSize: '11px',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}
