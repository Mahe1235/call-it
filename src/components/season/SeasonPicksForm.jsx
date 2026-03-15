import { useState, useMemo, useRef, useEffect } from 'react'
import { teams as teamsData, getTeam } from '../../lib/content'
import { saveSeasonPicks } from '../../hooks/useSeasonPicks'
import { useAuth } from '../../hooks/useAuth'

/* ─── Data ───────────────────────────────────────────────────────────────── */

const ALL_TEAM_IDS = teamsData.teams.map(t => t.id)

function getAllPlayers() {
  const list = []
  for (const team of teamsData.teams) {
    for (const p of (team.squad ?? [])) {
      list.push({ name: p.name, role: p.role, teamId: team.id, teamShort: team.shortName })
    }
  }
  return list.sort((a, b) => a.name.localeCompare(b.name))
}

/* ─── Step config ────────────────────────────────────────────────────────── */

const STEPS = [
  { id: 'top4',        label: 'Top 4 Teams',  sub: 'Which 4 teams make the playoffs?'     },
  { id: 'champion',    label: 'Champion',      sub: 'Who lifts the trophy?'                },
  { id: 'runnerUp',    label: 'Runner-Up',     sub: 'Who loses the final?'                 },
  { id: 'woodenSpoon', label: 'Wooden Spoon',  sub: 'Who finishes last in the league?'     },
  { id: 'orangeCap',   label: 'Orange Cap',    sub: 'Top run-scorer — pick 3 candidates'   },
  { id: 'purpleCap',   label: 'Purple Cap',    sub: 'Top wicket-taker — pick 3 candidates' },
  { id: 'mostSixes',   label: 'Most Sixes',    sub: 'Biggest hitter — pick 3 candidates'   },
]

/* ─── Points explainer data ──────────────────────────────────────────────── */

const POINTS_INFO = {
  top4: {
    type: 'perItem',
    rows: [{ label: 'Each correct team', pts: '+30' }],
    note: '4 correct = 120 pts max',
  },
  champion: {
    type: 'simple',
    rows: [{ label: 'Correct pick', pts: '+200' }, { label: 'Wrong pick', pts: '0' }],
  },
  runnerUp: {
    type: 'simple',
    rows: [{ label: 'Correct pick', pts: '+100' }, { label: 'Wrong pick', pts: '0' }],
  },
  woodenSpoon: {
    type: 'simple',
    rows: [{ label: 'Correct pick', pts: '+50' }, { label: 'Wrong pick', pts: '0' }],
  },
  orangeCap: {
    type: 'ranked',
    note: 'Each of your 3 picks earns pts based on where they actually finish',
    rows: [
      { label: 'Finishes #1', pts: '+80' },
      { label: 'Finishes #2 or #3', pts: '+40' },
      { label: 'Finishes #4 or #5', pts: '+20' },
      { label: 'Outside top 5', pts: '0' },
    ],
  },
  purpleCap: {
    type: 'ranked',
    note: 'Each of your 3 picks earns pts based on where they actually finish',
    rows: [
      { label: 'Finishes #1', pts: '+80' },
      { label: 'Finishes #2 or #3', pts: '+40' },
      { label: 'Finishes #4 or #5', pts: '+20' },
      { label: 'Outside top 5', pts: '0' },
    ],
  },
  mostSixes: {
    type: 'ranked',
    note: 'Each of your 3 picks earns pts based on where they actually finish',
    rows: [
      { label: 'Finishes #1', pts: '+60' },
      { label: 'Finishes #2 or #3', pts: '+30' },
      { label: 'Finishes #4 or #5', pts: '+15' },
      { label: 'Outside top 5', pts: '0' },
    ],
  },
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main wizard
   ══════════════════════════════════════════════════════════════════════════ */

export function SeasonPicksForm({ onSaved, onCancel, initialPicks = null }) {
  const { user } = useAuth()
  const allPlayers = useMemo(() => getAllPlayers(), [])
  const isEditing = initialPicks != null

  /* picks state — seeded from initialPicks when editing */
  const [top4, setTop4]               = useState(() => initialPicks?.top_4_teams    ?? [])
  const [champion, setChampion]       = useState(() => initialPicks?.champion        ?? null)
  const [runnerUp, setRunnerUp]       = useState(() => initialPicks?.runner_up       ?? null)
  const [woodenSpoon, setWoodenSpoon] = useState(() => initialPicks?.wooden_spoon    ?? null)
  const [orangeCap, setOrangeCap]     = useState(() => initialPicks?.orange_cap_picks?.map(p => p ?? null) ?? [null, null, null])
  const [purpleCap, setPurpleCap]     = useState(() => initialPicks?.purple_cap_picks?.map(p => p ?? null) ?? [null, null, null])
  const [mostSixes, setMostSixes]     = useState(() => initialPicks?.most_sixes_picks?.map(p => p ?? null) ?? [null, null, null])

  /* wizard state */
  const [step, setStep]       = useState(0)
  const [saving, setSaving]   = useState(false)
  const [saveErr, setSaveErr] = useState(null)

  /* step completion */
  const stepDone = [
    top4.length === 4,
    champion != null,
    runnerUp != null && runnerUp !== champion,
    woodenSpoon != null,
    orangeCap.every(Boolean),
    purpleCap.every(Boolean),
    mostSixes.every(Boolean),
  ]
  const currentDone = stepDone[step]
  const totalDone   = stepDone.filter(Boolean).length
  const isLast      = step === STEPS.length - 1

  /* clear downstream picks when top4 changes */
  function handleTop4Toggle(id) {
    setTop4(prev => {
      const next = prev.includes(id) ? prev.filter(t => t !== id) : prev.length < 4 ? [...prev, id] : prev
      // Clear champion/runnerUp if their team was deselected
      if (!next.includes(champion)) setChampion(null)
      if (!next.includes(runnerUp))  setRunnerUp(null)
      return next
    })
  }

  async function handleLock() {
    if (!stepDone.every(Boolean) || saving) return
    setSaving(true)
    setSaveErr(null)
    const { data, error } = await saveSeasonPicks(user.id, {
      top_4_teams:      top4,
      champion,
      runner_up:        runnerUp,
      wooden_spoon:     woodenSpoon,
      orange_cap_picks: orangeCap,
      purple_cap_picks: purpleCap,
      most_sixes_picks: mostSixes,
    })
    if (error) {
      setSaveErr(error.message ?? 'Something went wrong.')
      setSaving(false)
    } else {
      onSaved?.(data)
    }
  }

  /* ── render ── */
  const s = STEPS[step]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ── Step indicator ── */}
      <StepIndicator current={step} total={STEPS.length} done={totalDone} />

      {/* ── Step card ── */}
      <div style={{
        background: 'var(--card)',
        borderRadius: '20px',
        padding: '20px 18px 18px',
        border: '1.5px solid var(--border-subtle)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* header */}
        <div style={{ marginBottom: '16px' }}>
          <h2 className="font-display font-black" style={{ fontSize: '22px', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
            {s.label}
          </h2>
          <p className="font-body text-sm" style={{ color: 'var(--text-muted)', margin: '4px 0 14px' }}>
            {s.sub}
          </p>
          <PointsBreakdown info={POINTS_INFO[s.id]} />
        </div>

        {/* step content */}
        <div style={{ flex: 1 }}>
          {step === 0 && (
            <TeamGridStep
              selected={top4}
              onToggle={handleTop4Toggle}
              max={4}
              hint={top4.length < 4 ? `${4 - top4.length} more to go` : ''}
            />
          )}
          {step === 1 && (
            <TeamGridStep
              selected={champion ? [champion] : []}
              onToggle={id => setChampion(prev => prev === id ? null : id)}
              max={1}
              filterIds={top4}
              hint="Pick from your Top 4"
            />
          )}
          {step === 2 && (
            <TeamGridStep
              selected={runnerUp ? [runnerUp] : []}
              onToggle={id => setRunnerUp(prev => prev === id ? null : id)}
              max={1}
              filterIds={top4}
              disabledIds={[champion]}
              hint="Not the champion"
            />
          )}
          {step === 3 && (
            <TeamGridStep
              selected={woodenSpoon ? [woodenSpoon] : []}
              onToggle={id => setWoodenSpoon(prev => prev === id ? null : id)}
              max={1}
              disabledIds={top4}
              hint="Can't be one of your Top 4"
            />
          )}
          {step === 4 && (
            <PlayerSearchStep
              picks={orangeCap}
              onChange={setOrangeCap}
              allPlayers={allPlayers}
            />
          )}
          {step === 5 && (
            <PlayerSearchStep
              picks={purpleCap}
              onChange={setPurpleCap}
              allPlayers={allPlayers}
            />
          )}
          {step === 6 && (
            <PlayerSearchStep
              picks={mostSixes}
              onChange={setMostSixes}
              allPlayers={allPlayers}
            />
          )}
        </div>
      </div>

      {/* ── Nav buttons ── */}
      {saveErr && (
        <p className="font-body text-xs text-center" style={{ color: '#cc0000' }}>{saveErr}</p>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            style={{
              flex: '0 0 auto',
              padding: '14px 20px',
              borderRadius: '14px',
              border: '1.5px solid var(--border-subtle)',
              background: 'var(--card)',
              color: 'var(--text-primary)',
              fontSize: '16px',
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}
          >
            ←
          </button>
        )}

        <button
          disabled={!currentDone || saving}
          onClick={isLast ? handleLock : () => setStep(s => s + 1)}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: '14px',
            border: 'none',
            background: currentDone ? 'var(--team-primary)' : 'var(--surface-subtle)',
            color: currentDone ? 'var(--team-text-on-primary, #111)' : 'var(--text-muted)',
            fontSize: '15px',
            fontWeight: 800,
            fontFamily: 'inherit',
            letterSpacing: '-0.3px',
            cursor: currentDone ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving
            ? 'Saving…'
            : isLast
              ? isEditing ? 'Save changes ✓' : 'Lock it in 🔒'
              : 'Next →'}
        </button>
      </div>

      {isLast && !isEditing && (
        <p className="font-body text-xs text-center" style={{ color: 'var(--text-muted)', marginTop: '-4px' }}>
          Once locked, season picks can't be changed.
        </p>
      )}

      {/* Cancel edit link */}
      {onCancel && (
        <button
          onClick={onCancel}
          style={{
            alignSelf: 'center',
            background: 'none',
            border: 'none',
            padding: '4px 8px',
            color: 'var(--text-muted)',
            fontFamily: 'inherit',
            fontSize: '13px',
            cursor: 'pointer',
            marginTop: isLast ? '-4px' : '0',
          }}
        >
          Cancel — back to my picks
        </button>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Points breakdown — shown inside each step card
   ══════════════════════════════════════════════════════════════════════════ */

function PointsBreakdown({ info }) {
  if (!info) return null

  return (
    <div style={{
      borderRadius: '12px',
      background: 'var(--surface-subtle)',
      border: '1px solid var(--border-subtle)',
      padding: '12px 14px',
      marginBottom: '4px',
    }}>
      <p className="font-mono text-xs tracking-widest uppercase" style={{
        color: 'var(--text-muted)',
        margin: '0 0 8px',
        letterSpacing: '0.08em',
      }}>
        How it scores
      </p>

      {/* note line — only for ranked type (perItem shows note inline) */}
      {info.note && info.type === 'ranked' && (
        <p className="font-body text-xs" style={{ color: 'var(--text-muted)', margin: '0 0 8px', fontStyle: 'italic' }}>
          {info.note}
        </p>
      )}

      {info.type === 'perItem' ? (
        /* single "per team" row + note */
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="font-body text-xs" style={{ color: 'var(--text-primary)' }}>
            {info.rows[0].label}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PtsPill value={info.rows[0].pts} />
            {info.note && (
              <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                ({info.note})
              </span>
            )}
          </div>
        </div>
      ) : info.type === 'simple' ? (
        /* two rows: correct / wrong */
        <div style={{ display: 'flex', gap: '8px' }}>
          {info.rows.map(r => (
            <div key={r.label} style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 6px',
              borderRadius: '10px',
              background: r.pts.startsWith('+') ? 'rgba(22,163,74,0.06)' : 'var(--surface-subtle)',
              border: `1px solid ${r.pts.startsWith('+') ? 'rgba(22,163,74,0.15)' : 'var(--border-subtle)'}`,
            }}>
              <span className="font-display font-black" style={{
                fontSize: '17px',
                color: r.pts.startsWith('+') ? '#16a34a' : 'var(--text-muted)',
                letterSpacing: '-0.5px',
              }}>
                {r.pts}
              </span>
              <span className="font-body text-xs" style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                {r.label}
              </span>
            </div>
          ))}
        </div>
      ) : (
        /* ranked: horizontal scrolling chips */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {info.rows.map(r => (
            <div key={r.label} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span className="font-body text-xs" style={{ color: 'var(--text-primary)' }}>
                {r.label}
              </span>
              <PtsPill value={r.pts} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PtsPill({ value }) {
  const isPositive = value.startsWith('+')
  return (
    <span className="font-mono text-xs" style={{
      fontWeight: 700,
      color: isPositive ? '#16a34a' : 'var(--text-muted)',
      background: isPositive ? 'rgba(22,163,74,0.08)' : 'var(--surface-subtle)',
      padding: '2px 7px',
      borderRadius: '99px',
    }}>
      {value}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Step indicator
   ══════════════════════════════════════════════════════════════════════════ */

function StepIndicator({ current, total, done }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 16px',
      borderRadius: '14px',
      background: 'var(--card)',
      border: '1.5px solid var(--border-subtle)',
      boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          height: '5px',
          borderRadius: '99px',
          background: 'var(--surface-subtle)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${((current + 1) / total) * 100}%`,
            borderRadius: '99px',
            background: 'var(--team-primary)',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
      <span className="font-mono text-xs" style={{ color: 'var(--text-muted)', fontWeight: 700, flexShrink: 0, letterSpacing: '0.03em' }}>
        {current + 1} / {total}
      </span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Team grid step (used for top4, champion, runner-up, wooden spoon)
   ══════════════════════════════════════════════════════════════════════════ */

function TeamGridStep({ selected, onToggle, max, filterIds = null, disabledIds = [], hint }) {
  /* filterIds: if provided, only show those teams (for champion/runner-up) */
  const teamIds = filterIds ?? ALL_TEAM_IDS

  return (
    <div>
      {hint && (
        <p className="font-body text-xs" style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>
          {hint}
        </p>
      )}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${filterIds ? Math.min(filterIds.length, 4) : 5}, 1fr)`,
        gap: '8px',
      }}>
        {teamIds.map(id => {
          const team = getTeam(id)
          const isSelected = selected.includes(id)
          const isDisabled = disabledIds.includes(id)
          const isMaxed = !isSelected && selected.length >= max

          return (
            <button
              key={id}
              disabled={isDisabled || isMaxed}
              onClick={() => onToggle(id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px',
                padding: '10px 6px',
                borderRadius: '14px',
                border: `1.5px solid ${isSelected ? 'var(--team-primary)' : 'var(--border-subtle)'}`,
                background: isSelected ? 'var(--team-tinted-bg)' : 'var(--surface-subtle)',
                opacity: (isDisabled || isMaxed) ? 0.3 : 1,
                cursor: (isDisabled || isMaxed) ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                position: 'relative',
              }}
            >
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--team-primary)',
                }} />
              )}
              <img
                src={team.logoUrl}
                alt={team.shortName}
                style={{ width: '36px', height: '36px', objectFit: 'contain' }}
              />
              <span className="font-mono" style={{
                fontSize: '9px',
                fontWeight: 700,
                color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                letterSpacing: '0.5px',
              }}>
                {team.shortName}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Player search step  (orange cap / purple cap / most sixes)
   ══════════════════════════════════════════════════════════════════════════ */

function PlayerSearchStep({ picks, onChange, allPlayers }) {
  const [activeSlot, setActiveSlot] = useState(null)  // 0 | 1 | 2 | null
  const [query, setQuery]           = useState('')
  const inputRef = useRef(null)

  /* Focus input when a slot is activated */
  useEffect(() => {
    if (activeSlot !== null) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [activeSlot])

  function openSlot(i) {
    setActiveSlot(i)
    setQuery('')
  }

  function closeSlot() {
    setActiveSlot(null)
    setQuery('')
  }

  function pickPlayer(name) {
    const next = [...picks]
    next[activeSlot] = name
    onChange(next)
    closeSlot()
  }

  function clearSlot(i) {
    const next = [...picks]
    next[i] = null
    onChange(next)
    if (activeSlot === i) closeSlot()
  }

  /* filter logic */
  const takenByOtherSlots = picks.filter((p, i) => i !== activeSlot && p != null)
  const filtered = query.trim().length < 1
    ? []
    : allPlayers.filter(p =>
        !takenByOtherSlots.includes(p.name) &&
        p.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 20)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p className="font-body text-xs" style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>
        Type a name to search across all squads.
      </p>

      {/* Slots */}
      {[0, 1, 2].map(i => {
        const isActive   = activeSlot === i
        const playerName = picks[i]
        const filled     = playerName != null

        return (
          <div key={i}>
            {/* Slot row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '13px',
              border: `1.5px solid ${isActive ? 'var(--team-primary)' : 'var(--border-subtle)'}`,
              background: isActive ? 'var(--team-tinted-bg)' : 'var(--card)',
              cursor: filled ? 'default' : 'pointer',
              transition: 'all 0.15s',
            }}
              onClick={() => !filled && openSlot(i)}
            >
              {/* Slot number */}
              <span className="font-mono" style={{
                fontSize: '11px',
                fontWeight: 700,
                color: isActive ? 'var(--team-primary)' : 'var(--text-muted)',
                width: '16px',
                flexShrink: 0,
                textAlign: 'center',
              }}>
                {i + 1}
              </span>

              {filled ? (
                <>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {playerName}
                    </p>
                    {/* Team badge */}
                    {(() => {
                      const p = allPlayers.find(pl => pl.name === playerName)
                      return p ? (
                        <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' }}>
                          {p.teamShort}
                        </span>
                      ) : null
                    })()}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); clearSlot(i) }}
                    style={{
                      flexShrink: 0,
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      border: 'none',
                      background: 'var(--surface-subtle)',
                      color: 'var(--text-muted)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </>
              ) : isActive ? (
                /* Search input */
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search player…"
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    color: 'var(--text-primary)',
                  }}
                />
              ) : (
                <p className="font-body text-sm" style={{ color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
                  Tap to search…
                </p>
              )}
            </div>

            {/* Results dropdown — shown directly below the active slot */}
            {isActive && query.trim().length > 0 && (
              <div style={{
                marginTop: '4px',
                borderRadius: '13px',
                border: '1.5px solid var(--border-subtle)',
                background: 'var(--card)',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: '14px 16px' }}>
                    <p className="font-body text-sm" style={{ color: 'var(--text-muted)', margin: 0 }}>No player found</p>
                  </div>
                ) : (
                  <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                    {filtered.map((p, idx) => (
                      <button
                        key={p.name}
                        onClick={() => pickPlayer(p.name)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '11px 16px',
                          border: 'none',
                          borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div>
                          <p className="font-body text-sm" style={{ color: 'var(--text-primary)', margin: 0, fontWeight: 500 }}>
                            {p.name}
                          </p>
                          <p className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)', margin: '1px 0 0', letterSpacing: '0.5px' }}>
                            {p.teamShort} · {p.role}
                          </p>
                        </div>
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)', flexShrink: 0 }}>+</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Cancel search */}
      {activeSlot !== null && (
        <button
          onClick={closeSlot}
          style={{
            alignSelf: 'center',
            padding: '6px 14px',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: '13px',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      )}
    </div>
  )
}
