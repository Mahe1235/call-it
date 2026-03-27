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
const OVERSEAS_MAX = 4

const ROLE_COLORS = {
  WK:  '#7c3aed',
  BAT: '#0284c7',
  AR:  '#059669',
  BWL: '#dc2626',
}

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
        overseas:  p.overseas === true,
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

function overseasCount(selected, allPlayers) {
  let count = 0
  for (const name of selected) {
    const p = allPlayers.find(p => p.name === name)
    if (p?.overseas) count++
  }
  return count
}

function isCompositionValid(counts) {
  return ROLE_ORDER.every(r => counts[r] >= ROLES[r].min && counts[r] <= ROLES[r].max)
}

/**
 * Fantasy XI player selection form — two-panel Dream11-style layout.
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

  const [selected, setSelected]       = useState(new Set(initialPlayers))
  const [captain, setCaptain]         = useState(initialCaptain)
  const [viceCaptain, setViceCaptain] = useState(initialViceCap)
  const [activeRole, setActiveRole]   = useState('WK')
  const [natFilter, setNatFilter]     = useState('all')
  const [search, setSearch]           = useState('')

  const counts        = useMemo(() => roleCounts([...selected], allPlayers), [selected, allPlayers])
  const osCount       = useMemo(() => overseasCount([...selected], allPlayers), [selected, allPlayers])
  const compositionOk = isCompositionValid(counts)
  const allPicked     = selected.size === TOTAL
  const canLock       = allPicked && compositionOk && captain && viceCaptain
  const osCapped      = osCount >= OVERSEAS_MAX

  function addPlayer(player) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(player.name)) return prev
      if (next.size >= TOTAL) return prev
      if ((counts[player.role] ?? 0) >= ROLES[player.role].max) return prev
      if (player.overseas && overseasCount([...next], allPlayers) >= OVERSEAS_MAX) return prev
      next.add(player.name)
      return next
    })
  }

  function removePlayer(name) {
    setSelected(prev => {
      const next = new Set(prev)
      next.delete(name)
      if (captain === name)     setCaptain(null)
      if (viceCaptain === name) setViceCaptain(null)
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

  function focusRole(role) {
    setActiveRole(role)
    setNatFilter('all')
    setSearch('')
  }

  const visiblePlayers = useMemo(() => {
    let list = allPlayers.filter(p => p.role === activeRole)
    if (natFilter === 'indian')   list = list.filter(p => !p.overseas)
    if (natFilter === 'overseas') list = list.filter(p => p.overseas)
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(p => p.name.toLowerCase().includes(q) || p.teamShort.toLowerCase().includes(q))
  }, [allPlayers, activeRole, natFilter, search])

  return (
    <div>

      {/* ── Team sheet ──────────────────────────────────────────────── */}
      <TeamSheet
        allPlayers={allPlayers}
        selected={selected}
        captain={captain}
        viceCaptain={viceCaptain}
        osCount={osCount}
        counts={counts}
        onRemove={removePlayer}
        onCap={handleCap}
        onViceCap={handleViceCap}
        onFocusRole={focusRole}
      />

      {/* ── Section divider ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0 14px' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        <p className="font-mono text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)', margin: 0 }}>
          Add players
        </p>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
      </div>

      {/* ── Role tabs ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
        {ROLE_ORDER.map(role => {
          const c    = counts[role]
          const r    = ROLES[role]
          const ok   = c >= r.min
          const over = c > r.max
          const active = activeRole === role
          const roleColor = ROLE_COLORS[role]
          return (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: '12px',
                border: `1.5px solid ${active ? roleColor : over ? '#dc2626' : 'var(--border-default)'}`,
                background: active ? roleColor : 'var(--card)',
                color: active ? '#fff' : over ? '#dc2626' : 'var(--text-primary)',
                fontFamily: 'Bricolage Grotesque, sans-serif',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div>{r.short}</div>
              <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '1px' }}>
                {c}/{r.max}
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Nationality filter ──────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {[
          { key: 'all',      label: 'All' },
          { key: 'indian',   label: '🇮🇳 Indian' },
          { key: 'overseas', label: `🌍 OS (${osCount}/${OVERSEAS_MAX})` },
        ].map(({ key, label }) => {
          const active   = natFilter === key
          const isOs     = key === 'overseas'
          const chipClr  = isOs && osCapped ? '#dc2626' : 'var(--team-primary)'
          return (
            <button
              key={key}
              onClick={() => setNatFilter(key)}
              style={{
                flexShrink: 0,
                padding: '5px 12px',
                borderRadius: '99px',
                border: `1.5px solid ${active ? chipClr : 'var(--border-default)'}`,
                background: active ? chipClr : 'var(--card)',
                color: active ? '#fff' : isOs && osCapped ? '#dc2626' : 'var(--text-muted)',
                fontFamily: 'Bricolage Grotesque, sans-serif',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* ── Search ──────────────────────────────────────────────────── */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={`Search ${ROLES[activeRole].label.toLowerCase()}s…`}
        style={{
          width: '100%',
          padding: '10px 14px',
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

      {/* ── Player list ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '340px', overflowY: 'auto', marginBottom: '16px' }}>
        {visiblePlayers.length === 0 && (
          <p className="font-body text-sm" style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
            No players found.
          </p>
        )}
        {visiblePlayers.map(player => {
          const isSelected = selected.has(player.name)
          const team       = getTeam(player.teamId)
          const roleFull   = (counts[player.role] ?? 0) >= ROLES[player.role].max
          const listFull   = selected.size >= TOTAL
          const osCap      = player.overseas && !isSelected && osCapped
          const disabled   = !isSelected && (roleFull || listFull || osCap)

          return (
            <div
              key={player.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: '12px',
                border: `1.5px solid ${isSelected ? 'var(--team-primary)' : 'var(--border-subtle)'}`,
                background: isSelected ? 'var(--team-tinted-bg)' : 'var(--card)',
                opacity: disabled ? 0.4 : 1,
                gap: '10px',
              }}
            >
              {/* Team colour bar */}
              <div style={{
                width: '4px', height: '36px', borderRadius: '2px',
                background: team?.colors?.primary ?? '#999',
                flexShrink: 0,
              }} />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="font-display font-bold" style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {player.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1px' }}>
                  <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {player.teamShort}
                  </span>
                  {player.overseas && (
                    <span style={{
                      fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em',
                      color: osCap ? '#dc2626' : 'var(--text-muted)',
                      border: `1px solid ${osCap ? '#dc2626' : 'var(--border-default)'}`,
                      borderRadius: '4px', padding: '1px 4px',
                      fontFamily: 'Bricolage Grotesque, sans-serif',
                    }}>OS</span>
                  )}
                </div>
              </div>

              {/* Add / Selected button */}
              <button
                onClick={() => isSelected ? removePlayer(player.name) : addPlayer(player)}
                disabled={disabled}
                style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  border: `2px solid ${isSelected ? 'var(--team-primary)' : disabled ? 'var(--border-default)' : ROLE_COLORS[player.role]}`,
                  background: isSelected ? 'var(--team-primary)' : 'transparent',
                  color: isSelected ? 'var(--team-text-on-primary)' : disabled ? 'var(--text-muted)' : ROLE_COLORS[player.role],
                  fontSize: '16px', lineHeight: 1, cursor: disabled ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, flexShrink: 0,
                }}
              >
                {isSelected ? '✓' : '+'}
              </button>
            </div>
          )
        })}
      </div>

      {/* ── Validation hints ────────────────────────────────────────── */}
      {allPicked && !compositionOk && (
        <p className="font-body text-xs mb-3" style={{ color: '#dc2626', textAlign: 'center' }}>
          Check role minimums: min 1 WK · 3 BAT · 1 AR · 3 BWL.
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

      {/* ── Save draft + Lock ────────────────────────────────────────── */}
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

/* ─── Team Sheet ───────────────────────────────────────────────────────────── */

function TeamSheet({ allPlayers, selected, captain, viceCaptain, osCount, counts, onRemove, onCap, onViceCap, onFocusRole }) {
  const selectedArr = [...selected]

  // OS bar color
  const osBarColor = osCount >= OVERSEAS_MAX ? '#dc2626' : osCount >= 3 ? '#b45309' : 'var(--team-primary)'

  return (
    <div style={{
      borderRadius: '18px',
      border: '1.5px solid var(--border-subtle)',
      background: 'var(--card)',
      overflow: 'hidden',
      marginBottom: '16px',
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px 10px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <p className="font-mono text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)', margin: 0 }}>
            My XI
          </p>
          {/* OS pill */}
          <span style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em',
            color: osBarColor,
            border: `1px solid ${osBarColor}`,
            borderRadius: '5px', padding: '2px 6px',
            fontFamily: 'Bricolage Grotesque, sans-serif',
          }}>
            OS {osCount}/{OVERSEAS_MAX}
          </span>
          {/* C/VC summary */}
          {captain && (
            <span style={{ fontSize: '11px', color: '#b45309', fontFamily: 'Bricolage Grotesque', fontWeight: 700 }}>
              © {captain.split(' ').pop()}
            </span>
          )}
          {viceCaptain && (
            <span style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'Bricolage Grotesque', fontWeight: 700 }}>
              vc {viceCaptain.split(' ').pop()}
            </span>
          )}
        </div>
        <span className="font-display font-black" style={{
          fontSize: '20px',
          color: selected.size === TOTAL ? 'var(--team-primary)' : 'var(--text-primary)',
          letterSpacing: '-0.5px',
        }}>
          {selected.size}<span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 400 }}>/11</span>
        </span>
      </div>

      {/* Role sections */}
      <div style={{ padding: '8px 10px 10px' }}>
        {ROLE_ORDER.map(role => {
          const rolePlayers = selectedArr
            .map(name => allPlayers.find(p => p.name === name))
            .filter(p => p?.role === role)
          const roleColor = ROLE_COLORS[role]
          const filled    = counts[role]
          const min       = ROLES[role].min
          const max       = ROLES[role].max
          const canAdd    = filled < max && selected.size < TOTAL

          // Empty slots: show max(min - filled, 0) mandatory + 1 optional if can add
          const mandatoryEmpty = Math.max(0, min - filled)
          const showOptional   = canAdd && filled >= min

          return (
            <div key={role} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
              {/* Role label */}
              <div style={{
                flexShrink: 0, width: '30px', paddingTop: '9px',
                fontFamily: 'Bricolage Grotesque, sans-serif',
                fontWeight: 800, fontSize: '10px', letterSpacing: '0.06em',
                color: roleColor,
                textTransform: 'uppercase',
              }}>
                {role}
              </div>

              {/* Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', flex: 1 }}>
                {rolePlayers.map(player => (
                  <PlayerChip
                    key={player.name}
                    player={player}
                    isCap={captain === player.name}
                    isVC={viceCaptain === player.name}
                    onRemove={() => onRemove(player.name)}
                    onCap={() => onCap(player.name)}
                    onViceCap={() => onViceCap(player.name)}
                    roleColor={roleColor}
                  />
                ))}

                {/* Mandatory empty slots */}
                {Array.from({ length: mandatoryEmpty }).map((_, i) => (
                  <EmptySlot key={`req-${i}`} role={role} roleColor={roleColor} required onClick={() => onFocusRole(role)} />
                ))}

                {/* Optional add slot */}
                {showOptional && (
                  <EmptySlot role={role} roleColor={roleColor} required={false} onClick={() => onFocusRole(role)} />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Player Chip (in team sheet) ─────────────────────────────────────────── */

function PlayerChip({ player, isCap, isVC, onRemove, onCap, onViceCap, roleColor }) {
  const team = getTeam(player.teamId)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '5px',
      padding: '5px 6px 5px 8px',
      borderRadius: '10px',
      background: 'var(--surface-subtle)',
      border: `1.5px solid ${isCap ? '#b45309' : isVC ? '#6b7280' : roleColor}`,
      minWidth: 0,
    }}>
      {/* Team dot */}
      <div style={{
        width: '7px', height: '7px', borderRadius: '50%',
        background: team?.colors?.primary ?? '#999',
        flexShrink: 0,
      }} />

      {/* Name */}
      <span style={{
        fontFamily: 'Bricolage Grotesque, sans-serif',
        fontWeight: 700, fontSize: '12px',
        color: 'var(--text-primary)',
        whiteSpace: 'nowrap', overflow: 'hidden',
        textOverflow: 'ellipsis', maxWidth: '80px',
      }}>
        {/* Show captain/VC icon in name */}
        {isCap && <span style={{ color: '#b45309', marginRight: '3px' }}>©</span>}
        {isVC  && <span style={{ color: '#6b7280', marginRight: '3px' }}>vc</span>}
        {player.name.split(' ').pop()}
      </span>

      {/* C button */}
      <button
        onClick={onCap}
        title="Set as Captain (2×)"
        style={{
          width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0,
          border: `1.5px solid ${isCap ? '#b45309' : 'var(--border-default)'}`,
          background: isCap ? '#b45309' : 'transparent',
          color: isCap ? '#fff' : 'var(--text-muted)',
          fontFamily: 'Bricolage Grotesque, sans-serif',
          fontWeight: 800, fontSize: '10px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >C</button>

      {/* VC button */}
      <button
        onClick={onViceCap}
        title="Set as Vice Captain (1.5×)"
        style={{
          padding: '0 3px', height: '20px', borderRadius: '5px', flexShrink: 0,
          border: `1.5px solid ${isVC ? '#6b7280' : 'var(--border-default)'}`,
          background: isVC ? '#6b7280' : 'transparent',
          color: isVC ? '#fff' : 'var(--text-muted)',
          fontFamily: 'Bricolage Grotesque, sans-serif',
          fontWeight: 800, fontSize: '9px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >VC</button>

      {/* Remove */}
      <button
        onClick={onRemove}
        title="Remove player"
        style={{
          width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
          border: 'none',
          background: 'var(--border-default)',
          color: 'var(--text-muted)',
          fontSize: '11px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, lineHeight: 1,
        }}
      >×</button>
    </div>
  )
}

/* ─── Empty Slot ───────────────────────────────────────────────────────────── */

function EmptySlot({ role, roleColor, required, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        padding: '5px 10px',
        borderRadius: '10px',
        border: `1.5px dashed ${required ? roleColor : 'var(--border-default)'}`,
        background: 'transparent',
        color: required ? roleColor : 'var(--text-muted)',
        fontFamily: 'Bricolage Grotesque, sans-serif',
        fontWeight: 700, fontSize: '11px',
        cursor: 'pointer', opacity: required ? 0.7 : 0.5,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '13px', lineHeight: 1 }}>+</span>
      {required ? role : 'Add'}
    </button>
  )
}
