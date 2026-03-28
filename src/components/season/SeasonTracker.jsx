import { useState, useMemo, useRef, useEffect } from 'react'
import { getTeam, teams as teamsData } from '../../lib/content'

function hexToRgba(hex = '#000000', alpha = 0.10) {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
import { saveSeasonPicks } from '../../hooks/useSeasonPicks'
import { useAuth } from '../../hooks/useAuth'

/* ─── Player data ────────────────────────────────────────────────────────── */

const ALL_TEAM_IDS = teamsData.teams.map(t => t.id)

function buildPlayerList() {
  const list = []
  for (const team of teamsData.teams) {
    for (const p of (team.squad ?? [])) {
      list.push({ name: p.name, role: p.role, teamId: team.id, teamShort: team.shortName })
    }
  }
  return list.sort((a, b) => a.name.localeCompare(b.name))
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main tracker — view + inline edit
   ══════════════════════════════════════════════════════════════════════════ */

export function SeasonTracker({ picks, setPicks, scores, seasonStarted }) {
  const { user }     = useAuth()
  const allPlayers   = useMemo(() => buildPlayerList(), [])
  const [activeEdit, setActiveEdit] = useState(null) // section key
  const [activeSlot, setActiveSlot] = useState(null) // 0|1|2 for player sections
  const [top4Draft,  setTop4Draft]  = useState([])
  const [saving,     setSaving]     = useState(false)

  const canEdit = !seasonStarted

  /* ── save helper ── */
  const savingRef = useRef(false)

  async function commit(patch) {
    if (!user || savingRef.current) return
    savingRef.current = true
    setSaving(true)
    const base = {
      top_4_teams:      picks.top_4_teams      ?? [],
      champion:         picks.champion          ?? null,
      runner_up:        picks.runner_up         ?? null,
      wooden_spoon:     picks.wooden_spoon      ?? null,
      orange_cap_picks: picks.orange_cap_picks  ?? [null, null, null],
      purple_cap_picks: picks.purple_cap_picks  ?? [null, null, null],
      most_sixes_picks: picks.most_sixes_picks  ?? [null, null, null],
    }
    const { data, error } = await saveSeasonPicks(user.id, { ...base, ...patch })
    savingRef.current = false
    setSaving(false)
    if (!error && data) {
      setPicks(data)
    }
    setActiveEdit(null)
    setActiveSlot(null)
    setTop4Draft([])
  }

  /* ── top4 helpers ── */
  function startEditTop4() {
    setTop4Draft([...(picks.top_4_teams ?? [])])
    setActiveEdit('top4')
  }

  function toggleTop4Draft(id) {
    setTop4Draft(prev =>
      prev.includes(id)
        ? prev.filter(t => t !== id)
        : prev.length < 4 ? [...prev, id] : prev
    )
  }

  async function saveTop4() {
    const patch = { top_4_teams: top4Draft }
    if (picks.champion  && !top4Draft.includes(picks.champion))  patch.champion = null
    if (picks.runner_up && !top4Draft.includes(picks.runner_up)) patch.runner_up = null
    await commit(patch)
  }

  /* ── player slot helper ── */
  async function savePlayerSlot(field, slotIdx, name) {
    const prev = picks[field] ?? [null, null, null]
    const next  = [...prev]
    next[slotIdx] = name
    await commit({ [field]: next })
  }

  async function clearPlayerSlot(field, slotIdx) {
    await savePlayerSlot(field, slotIdx, null)
  }

  const top4      = picks.top_4_teams      ?? []
  const orangeCap = picks.orange_cap_picks ?? [null, null, null]
  const purpleCap = picks.purple_cap_picks ?? [null, null, null]
  const mostSixes = picks.most_sixes_picks ?? [null, null, null]

  function closeEdit() { setActiveEdit(null); setActiveSlot(null) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ── Season score total banner ── */}
      {scores && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '16px',
          background: 'var(--team-tinted-bg)',
          border: '1.5px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', margin: '0 0 2px' }}>Season Score</p>
            <p className="font-display font-black" style={{ fontSize: '28px', color: 'var(--team-primary)', margin: 0, letterSpacing: '-1px', lineHeight: 1 }}>
              {scores.total > 0 ? `+${scores.total}` : scores.total} pts
            </p>
          </div>
          <span style={{ fontSize: '28px' }}>🏆</span>
        </div>
      )}

      {/* ── Status banner ── */}
      <div style={{
        padding: '12px 16px',
        borderRadius: '14px',
        background: 'var(--card)',
        border: '1.5px solid var(--border-subtle)',
        boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <span style={{ fontSize: '16px', flexShrink: 0 }}>{canEdit ? '✏️' : '🔒'}</span>
        <div>
          <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)', margin: '0 0 1px' }}>
            {canEdit ? 'Picks are editable' : 'Picks are locked'}
          </p>
          <p className="font-body text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>
            {canEdit
              ? 'Tap any section to edit. Locks when Match 1 begins.'
              : 'Season picks locked. Points tallied at season end.'}
          </p>
        </div>
      </div>

      {/* ── TOP 4 ── */}
      <SectionCard
        label="Top 4 Teams"
        pts="up to 120 pts"
        earnedPts={scores?.top4_pts}
        canEdit={canEdit}
        editing={activeEdit === 'top4'}
        onEdit={startEditTop4}
        onClose={closeEdit}
      >
        {activeEdit === 'top4' ? (
          <TeamGridEditor
            draft={top4Draft}
            onToggle={toggleTop4Draft}
            onSave={saveTop4}
            onCancel={closeEdit}
            saving={saving}
            max={4}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {top4.length > 0
              ? top4.map(id => (
                  <TeamDisplayCard key={id} id={id} onClick={canEdit ? startEditTop4 : null} />
                ))
              : [0, 1, 2, 3].map(i => (
                  <EmptyCard key={i} label="Pick a team" onClick={canEdit ? startEditTop4 : null} />
                ))
            }
          </div>
        )}
      </SectionCard>

      {/* ── CHAMPION ── */}
      <SectionCard
        label="Champion"
        pts="200 pts"
        earnedPts={scores?.champion_pts}
        canEdit={canEdit && top4.length === 4}
        editing={activeEdit === 'champion'}
        onEdit={() => setActiveEdit('champion')}
        onClose={closeEdit}
      >
        {activeEdit === 'champion' ? (
          <InlineTeamPicker
            filterIds={top4}
            disabledIds={[picks.runner_up].filter(Boolean)}
            current={picks.champion}
            onPick={id => commit({ champion: id })}
            onClear={() => commit({ champion: null })}
            onCancel={closeEdit}
            saving={saving}
          />
        ) : (
          picks.champion
            ? <TeamDisplayCard id={picks.champion} label="🏆 Champion" onClick={canEdit && top4.length === 4 ? () => setActiveEdit('champion') : null} tall />
            : <EmptyCard label="Pick your champion" onClick={canEdit && top4.length === 4 ? () => setActiveEdit('champion') : null} hint="Choose from your Top 4" tall />
        )}
      </SectionCard>

      {/* ── RUNNER-UP ── */}
      <SectionCard
        label="Runner-Up"
        pts="100 pts"
        earnedPts={scores?.runner_up_pts}
        canEdit={canEdit && top4.length === 4}
        editing={activeEdit === 'runnerUp'}
        onEdit={() => setActiveEdit('runnerUp')}
        onClose={closeEdit}
      >
        {activeEdit === 'runnerUp' ? (
          <InlineTeamPicker
            filterIds={top4}
            disabledIds={[picks.champion].filter(Boolean)}
            current={picks.runner_up}
            onPick={id => commit({ runner_up: id })}
            onClear={() => commit({ runner_up: null })}
            onCancel={closeEdit}
            saving={saving}
          />
        ) : (
          picks.runner_up
            ? <TeamDisplayCard id={picks.runner_up} label="🥈 Runner-Up" onClick={canEdit && top4.length === 4 ? () => setActiveEdit('runnerUp') : null} tall />
            : <EmptyCard label="Pick your runner-up" onClick={canEdit && top4.length === 4 ? () => setActiveEdit('runnerUp') : null} hint="Choose from your Top 4" tall />
        )}
      </SectionCard>

      {/* ── WOODEN SPOON ── */}
      <SectionCard
        label="Wooden Spoon"
        pts="50 pts"
        earnedPts={scores?.wooden_spoon_pts}
        canEdit={canEdit}
        editing={activeEdit === 'woodenSpoon'}
        onEdit={() => setActiveEdit('woodenSpoon')}
        onClose={closeEdit}
      >
        {activeEdit === 'woodenSpoon' ? (
          <InlineTeamPicker
            filterIds={null}
            disabledIds={top4}
            current={picks.wooden_spoon}
            onPick={id => commit({ wooden_spoon: id })}
            onClear={() => commit({ wooden_spoon: null })}
            onCancel={closeEdit}
            saving={saving}
            hint="Can't be one of your Top 4"
          />
        ) : (
          picks.wooden_spoon
            ? <TeamDisplayCard id={picks.wooden_spoon} label="🪵 Wooden Spoon" onClick={canEdit ? () => setActiveEdit('woodenSpoon') : null} tall />
            : <EmptyCard label="Pick last place" onClick={canEdit ? () => setActiveEdit('woodenSpoon') : null} tall />
        )}
      </SectionCard>

      {/* ── ORANGE CAP ── */}
      <SectionCard label="Orange Cap" pts="80 / 40 / 20 pts" earnedPts={scores?.orange_cap_pts} canEdit={canEdit} editing={activeEdit === 'orangeCap'} onEdit={() => { setActiveEdit('orangeCap'); setActiveSlot(0) }} onClose={closeEdit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[0, 1, 2].map(i => (
            <PlayerSlotCard
              key={i}
              slotNum={i + 1}
              playerName={orangeCap[i]}
              allPlayers={allPlayers}
              canEdit={canEdit}
              editing={activeEdit === 'orangeCap' && activeSlot === i}
              onEdit={() => { setActiveEdit('orangeCap'); setActiveSlot(i) }}
              onClose={closeEdit}
              onPick={name => savePlayerSlot('orange_cap_picks', i, name)}
              onClear={() => clearPlayerSlot('orange_cap_picks', i)}
              usedNames={orangeCap.filter((_, j) => j !== i).filter(Boolean)}
              saving={saving}
            />
          ))}
        </div>
      </SectionCard>

      {/* ── PURPLE CAP ── */}
      <SectionCard label="Purple Cap" pts="80 / 40 / 20 pts" earnedPts={scores?.purple_cap_pts} canEdit={canEdit} editing={activeEdit === 'purpleCap'} onEdit={() => { setActiveEdit('purpleCap'); setActiveSlot(0) }} onClose={closeEdit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[0, 1, 2].map(i => (
            <PlayerSlotCard
              key={i}
              slotNum={i + 1}
              playerName={purpleCap[i]}
              allPlayers={allPlayers}
              canEdit={canEdit}
              editing={activeEdit === 'purpleCap' && activeSlot === i}
              onEdit={() => { setActiveEdit('purpleCap'); setActiveSlot(i) }}
              onClose={closeEdit}
              onPick={name => savePlayerSlot('purple_cap_picks', i, name)}
              onClear={() => clearPlayerSlot('purple_cap_picks', i)}
              usedNames={purpleCap.filter((_, j) => j !== i).filter(Boolean)}
              saving={saving}
            />
          ))}
        </div>
      </SectionCard>

      {/* ── MOST SIXES ── */}
      <SectionCard label="Most Sixes" pts="60 / 30 / 15 pts" earnedPts={scores?.most_sixes_pts} canEdit={canEdit} editing={activeEdit === 'mostSixes'} onEdit={() => { setActiveEdit('mostSixes'); setActiveSlot(0) }} onClose={closeEdit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[0, 1, 2].map(i => (
            <PlayerSlotCard
              key={i}
              slotNum={i + 1}
              playerName={mostSixes[i]}
              allPlayers={allPlayers}
              canEdit={canEdit}
              editing={activeEdit === 'mostSixes' && activeSlot === i}
              onEdit={() => { setActiveEdit('mostSixes'); setActiveSlot(i) }}
              onClose={closeEdit}
              onPick={name => savePlayerSlot('most_sixes_picks', i, name)}
              onClear={() => clearPlayerSlot('most_sixes_picks', i)}
              usedNames={mostSixes.filter((_, j) => j !== i).filter(Boolean)}
              saving={saving}
            />
          ))}
        </div>
      </SectionCard>

    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Section card — white card wrapper matching app design language
   ══════════════════════════════════════════════════════════════════════════ */

function SectionCard({ label, pts, earnedPts, canEdit, editing, onEdit, onClose, children }) {
  return (
    <div style={{
      background: 'var(--card)',
      borderRadius: '20px',
      padding: '16px 18px 18px',
      border: '1.5px solid var(--border-subtle)',
      boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
    }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <p className="font-mono text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)', margin: 0, fontWeight: 700 }}>
            {label}
          </p>
          {earnedPts != null ? (
            <span className="font-mono font-bold" style={{ fontSize: '11px', color: earnedPts > 0 ? 'var(--team-primary)' : 'var(--text-muted)' }}>
              {earnedPts > 0 ? `+${earnedPts}` : earnedPts} pts
            </span>
          ) : pts ? (
            <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)', opacity: 0.7 }}>
              {pts}
            </span>
          ) : null}
        </div>
        {canEdit && onEdit && (
          <button
            onClick={editing ? onClose : onEdit}
            style={{
              padding: '4px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              background: editing ? 'var(--surface-subtle)' : 'transparent',
              color: editing ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
        )}
      </div>

      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Team display card  (filled pick — the visual centrepiece)
   ══════════════════════════════════════════════════════════════════════════ */

function TeamDisplayCard({ id, label, onClick, tall = false }) {
  const team = getTeam(id)
  if (!team) return null

  const primary = team.colors.primary
  const tint    = hexToRgba(primary, 0.12)

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '14px',
        padding: tall ? '18px 16px' : '14px',
        background: tint,
        border: `1.5px solid ${hexToRgba(primary, 0.30)}`,
        cursor: onClick ? 'pointer' : 'default',
        minHeight: tall ? '88px' : '76px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        transition: 'transform 0.1s',
      }}
    >
      {/* Full-bleed faded logo */}
      <img
        src={team.logoUrl}
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: '-16px',
          top: '50%',
          transform: 'translateY(-50%)',
          height: tall ? '110px' : '90px',
          opacity: 0.22,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />
      {/* Gradient overlay — ensures left text is fully readable */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(100deg, var(--card) 45%, transparent 80%)`,
        pointerEvents: 'none',
      }} />

      {/* Text content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {label && (
          <p className="font-mono" style={{
            fontSize: '9px',
            color: primary,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            margin: '0 0 3px',
          }}>
            {label}
          </p>
        )}
        <p className="font-display font-black" style={{
          fontSize: tall ? '22px' : '18px',
          color: 'var(--text-primary)',
          margin: 0,
          letterSpacing: '-0.5px',
          lineHeight: 1,
        }}>
          {team.shortName}
        </p>
        <p className="font-body text-xs" style={{ color: 'var(--text-muted)', margin: '3px 0 0' }}>
          {team.name}
        </p>
      </div>

    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Empty card (dashed, tap-to-fill)
   ══════════════════════════════════════════════════════════════════════════ */

function EmptyCard({ label, hint, onClick, tall = false }) {
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: '14px',
        padding: tall ? '18px 16px' : '14px',
        minHeight: tall ? '88px' : '76px',
        border: '1.5px dashed var(--border-default)',
        background: 'var(--surface-subtle)',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
      }}
    >
      <p className="font-body text-sm" style={{ color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
        {label}
      </p>
      {hint && (
        <p className="font-body text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>
          {hint}
        </p>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Top-4 grid editor
   ══════════════════════════════════════════════════════════════════════════ */

function TeamGridEditor({ draft, onToggle, onSave, onCancel, saving, max }) {
  const done = draft.length === max
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '14px' }}>
        {ALL_TEAM_IDS.map(id => {
          const team   = getTeam(id)
          const isSel  = draft.includes(id)
          const isMax  = !isSel && draft.length >= max
          return (
            <button
              key={id}
              disabled={isMax}
              onClick={() => onToggle(id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '9px 4px',
                borderRadius: '12px',
                border: `1.5px solid ${isSel ? 'var(--team-primary)' : 'var(--border-subtle)'}`,
                background: isSel ? 'var(--team-tinted-bg)' : 'var(--surface-subtle)',
                opacity: isMax ? 0.3 : 1,
                cursor: isMax ? 'not-allowed' : 'pointer',
                transition: 'all 0.12s',
                position: 'relative',
              }}
            >
              {isSel && (
                <div style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%', background: 'var(--team-primary)' }} />
              )}
              <img src={team.logoUrl} alt={team.shortName} style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
              <span className="font-mono" style={{ fontSize: '9px', fontWeight: 700, color: isSel ? 'var(--text-primary)' : 'var(--text-muted)', letterSpacing: '0.5px' }}>
                {team.shortName}
              </span>
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onCancel}
          style={{ flex: '0 0 auto', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid var(--border-default)', background: 'var(--surface-subtle)', color: 'var(--text-muted)', fontSize: '14px', fontFamily: 'inherit', cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button
          disabled={!done || saving}
          onClick={onSave}
          style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: done ? 'var(--team-primary)' : 'rgba(0,0,0,0.07)', color: done ? 'var(--team-text-on-primary, #111)' : 'var(--text-muted)', fontSize: '14px', fontWeight: 700, fontFamily: 'inherit', cursor: done ? 'pointer' : 'not-allowed', opacity: saving ? 0.7 : 1, transition: 'all 0.15s' }}
        >
          {saving ? 'Saving…' : done ? 'Save Top 4' : `${max - draft.length} more to go`}
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Inline team picker (champion / runner-up / wooden spoon)
   ══════════════════════════════════════════════════════════════════════════ */

function InlineTeamPicker({ filterIds, disabledIds, current, onPick, onClear, onCancel, saving, hint }) {
  const teamIds = filterIds ?? ALL_TEAM_IDS
  return (
    <div>
      {hint && (
        <p className="font-body text-xs" style={{ color: 'var(--text-muted)', margin: '0 0 12px', fontStyle: 'italic' }}>
          {hint}
        </p>
      )}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {teamIds.map(id => {
          const team  = getTeam(id)
          const isSel = current === id
          const isDis = disabledIds?.includes(id)
          return (
            <button
              key={id}
              disabled={isDis || saving}
              onClick={() => isSel ? onClear() : onPick(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '10px',
                border: `1.5px solid ${isSel ? 'var(--team-primary)' : 'var(--border-subtle)'}`,
                background: isSel ? 'var(--team-tinted-bg)' : 'var(--surface-subtle)',
                opacity: isDis ? 0.3 : 1,
                cursor: isDis ? 'not-allowed' : 'pointer',
                transition: 'all 0.12s',
              }}
            >
              <img src={team.logoUrl} alt={team.shortName} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
              <span className="font-mono" style={{ fontSize: '11px', fontWeight: 700, color: isSel ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {team.shortName}
              </span>
            </button>
          )
        })}
      </div>
      {saving && (
        <p className="font-body text-xs" style={{ color: 'var(--text-muted)', marginTop: '10px' }}>Saving…</p>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Player slot card  (filled = logo-bg card / empty = dashed / editing = search)
   ══════════════════════════════════════════════════════════════════════════ */

function PlayerSlotCard({ slotNum, playerName, allPlayers, canEdit, editing, onEdit, onClose, onPick, onClear, usedNames, saving }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) setTimeout(() => inputRef.current?.focus(), 60)
    else setQuery('')
  }, [editing])

  const playerInfo = playerName ? allPlayers.find(p => p.name === playerName) : null
  const team       = playerInfo ? getTeam(playerInfo.teamId) : null

  const filtered = query.trim().length < 1
    ? []
    : allPlayers
        .filter(p => !usedNames.includes(p.name) && p.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 18)

  /* ── Editing state ── */
  if (editing) {
    return (
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 14px',
          borderRadius: '13px',
          border: '1.5px solid var(--team-primary)',
          background: 'var(--team-tinted-bg)',
        }}>
          <span className="font-mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--team-primary)', width: '16px', textAlign: 'center', flexShrink: 0 }}>
            {slotNum}
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search player…"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', fontFamily: 'inherit', color: 'var(--text-primary)' }}
          />
          <button onClick={onClose} style={{ border: 'none', background: 'var(--surface-subtle)', borderRadius: '6px', padding: '4px 8px', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
            Cancel
          </button>
        </div>

        {filtered.length > 0 && (
          <div style={{ marginTop: '4px', borderRadius: '13px', border: '1.5px solid var(--border-subtle)', background: 'var(--card)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.09)' }}>
            <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {filtered.map((p, idx) => (
                <button
                  key={p.name}
                  onClick={() => onPick(p.name)}
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
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <p className="font-body text-sm" style={{ color: 'var(--text-primary)', margin: 0, fontWeight: 500 }}>{p.name}</p>
                    <p className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)', margin: '1px 0 0', letterSpacing: '0.5px' }}>
                      {p.teamShort} · {p.role}
                    </p>
                  </div>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>+</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {query.trim().length > 0 && filtered.length === 0 && (
          <div style={{ marginTop: '4px', padding: '12px 16px', borderRadius: '13px', background: 'var(--card)', border: '1.5px solid var(--border-subtle)' }}>
            <p className="font-body text-sm" style={{ color: 'var(--text-muted)', margin: 0 }}>No player found</p>
          </div>
        )}
      </div>
    )
  }

  /* ── Filled state — logo-background card ── */
  if (playerName && team) {
    const primary = team.colors.primary
    const tint    = hexToRgba(primary, 0.12)
    return (
      <div
        onClick={canEdit ? onEdit : undefined}
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '13px',
          padding: '12px 14px',
          background: tint,
          border: `1.5px solid ${hexToRgba(primary, 0.30)}`,
          cursor: canEdit ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minHeight: '60px',
          transition: 'transform 0.1s',
        }}
      >
        {/* Faded team logo watermark */}
        <img
          src={team.logoUrl}
          alt=""
          aria-hidden="true"
          style={{ position: 'absolute', right: '-6px', top: '50%', transform: 'translateY(-50%)', height: '64px', opacity: 0.12, pointerEvents: 'none', userSelect: 'none' }}
        />
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(100deg, var(--card) 45%, transparent 80%)`, pointerEvents: 'none' }} />

        <span className="font-mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', width: '16px', textAlign: 'center', flexShrink: 0, position: 'relative', zIndex: 1 }}>
          {slotNum}
        </span>
        <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
          <p className="font-display font-bold" style={{ fontSize: '15px', color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {playerName}
          </p>
          <p className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)', margin: '2px 0 0', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {playerInfo.teamShort} · {playerInfo.role}
          </p>
        </div>
      </div>
    )
  }

  /* ── Fallback filled (no team info) ── */
  if (playerName && !team) {
    return (
      <div
        onClick={canEdit ? onEdit : undefined}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '13px', background: 'var(--surface-subtle)', border: '1.5px solid var(--border-subtle)', cursor: canEdit ? 'pointer' : 'default' }}
      >
        <span className="font-mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', width: '16px', textAlign: 'center' }}>{slotNum}</span>
        <p className="font-body text-sm" style={{ color: 'var(--text-primary)', margin: 0, flex: 1 }}>{playerName}</p>
      </div>
    )
  }

  /* ── Empty state ── */
  return (
    <div
      onClick={canEdit ? onEdit : undefined}
      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '13px', border: '1.5px dashed var(--border-subtle)', background: 'var(--surface-subtle)', cursor: canEdit ? 'pointer' : 'default', minHeight: '60px' }}
    >
      <span className="font-mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-placeholder)', width: '16px', textAlign: 'center' }}>{slotNum}</span>
      <p className="font-body text-sm" style={{ color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
        {canEdit ? 'Tap to search a player…' : 'Not picked'}
      </p>
    </div>
  )
}
