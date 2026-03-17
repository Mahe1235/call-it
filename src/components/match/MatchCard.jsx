import { useState, useMemo } from 'react'
import { getTeam, getBanter } from '../../lib/content'
import { useAuth } from '../../hooks/useAuth'
import { submitPrediction, useGroupPredictions } from '../../hooks/usePredictions'
import { useMatchStartCheck } from '../../hooks/useMatchStartCheck'

/**
 * MatchCard — the prediction form for a single match.
 *
 * Props:
 *   match      — match row from DB
 *   questions  — array of match_questions rows
 *   prediction — existing prediction row (null if not submitted)
 *   onLocked   — called with new prediction after successful submit
 */
export function MatchCard({ match, questions, prediction, onLocked }) {
  const { user } = useAuth()
  const theCall   = questions.find(q => q.type === 'the_call')
  const chaosBall = questions.find(q => q.type === 'chaos_ball')
  const teamA = getTeam(match.team_a)
  const teamB = getTeam(match.team_b)
  const [editing, setEditing] = useState(false)

  // Get a real friend name for banter — pick a random group member (not the current user)
  const { predictions: groupPreds } = useGroupPredictions(match.id)
  const friendName = useMemo(() => {
    const others = groupPreds.filter(p => p.user_id !== user?.id)
    if (!others.length) return null
    const picked = others[Math.floor(Math.random() * others.length)]
    return picked.users?.display_name?.split(' ')[0] ?? null
  }, [groupPreds.length, user?.id])

  // CricAPI-aware start check: polls within 5 mins of scheduled start to detect delays
  const matchStartedByApi = useMatchStartCheck(match)
  const matchStarted = match.status !== 'upcoming' || matchStartedByApi

  // Missed: match started but user never submitted
  if (matchStarted && !prediction) {
    return (
      <>
        <MissedCard match={match} teamA={teamA} teamB={teamB} friendName={friendName} />
        <GroupPicksSection match={match} teamA={teamA} teamB={teamB} />
      </>
    )
  }

  // Locked + editing: show form pre-filled with existing picks
  if (prediction && !matchStarted && editing) {
    return (
      <OpenCard
        match={match}
        theCall={theCall}
        chaosBall={chaosBall}
        teamA={teamA}
        teamB={teamB}
        friendName={friendName}
        initialPicks={prediction}
        onLocked={(updated) => { setEditing(false); onLocked?.(updated) }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  // Locked: prediction submitted (after match starts, no edit allowed)
  if (prediction) {
    return (
      <>
        <LockedCard
          prediction={prediction}
          theCall={theCall}
          chaosBall={chaosBall}
          teamA={teamA}
          teamB={teamB}
          canEdit={!matchStarted}
          onEdit={() => setEditing(true)}
          friendName={friendName}
        />
        {/* Show group picks only after match has started */}
        {matchStarted && (
          <GroupPicksSection match={match} teamA={teamA} teamB={teamB} />
        )}
      </>
    )
  }

  // Open: fill in picks
  return (
    <OpenCard
      match={match}
      theCall={theCall}
      chaosBall={chaosBall}
      teamA={teamA}
      teamB={teamB}
      friendName={friendName}
      onLocked={onLocked}
    />
  )
}

/* ─── Open card ──────────────────────────────────────────────────────────── */

function OpenCard({ match, theCall, chaosBall, teamA, teamB, onLocked, onCancel, initialPicks = null, friendName = null }) {
  const { user } = useAuth()
  const isEditing = initialPicks !== null
  const friend = friendName ?? 'someone'

  const openBanter = useMemo(() => getBanter('cardStates.open', {
    TEAM_A: teamA?.shortName ?? match.team_a.toUpperCase(),
    TEAM_B: teamB?.shortName ?? match.team_b.toUpperCase(),
    FRIEND: friend,
  }), [match.id, friend])

  const [winner,  setWinner]  = useState(initialPicks?.match_winner_pick  ?? null)
  const [call,    setCall]    = useState(initialPicks?.the_call_pick       ?? null)
  const [villain, setVillain] = useState(initialPicks?.villain_pick_player ?? '')
  const [chaos,   setChaos]   = useState(initialPicks?.chaos_ball_pick     ?? null)
  const [submitting,   setSubmitting]   = useState(false)
  const [submitError,  setSubmitError]  = useState(null)
  const [authExpired,  setAuthExpired]  = useState(false)

  const squadA = teamA?.squad ?? []
  const squadB = teamB?.squad ?? []
  const hasSquad = squadA.length > 0 || squadB.length > 0

  // Only require picks for sections that actually exist
  const needsCall    = !!theCall
  const needsChaos   = !!chaosBall
  const needsVillain = hasSquad

  const allPicked = (
    !!winner &&
    (!needsCall    || !!call) &&
    (!needsVillain || !!villain) &&
    (!needsChaos   || !!chaos)
  )

  function isAuthError(msg = '') {
    const m = msg.toLowerCase()
    return m.includes('jwt') || m.includes('auth') || m.includes('not authenticated') || m.includes('session')
  }

  async function handleSubmit() {
    if (!allPicked || submitting) return
    setSubmitting(true)
    setSubmitError(null)
    setAuthExpired(false)

    const { data, error } = await submitPrediction(user.id, match.id, {
      match_winner_pick:   winner,
      the_call_pick:       call    || null,
      villain_pick_player: villain || null,
      chaos_ball_pick:     chaos   || null,
    })

    if (error) {
      if (isAuthError(error.message)) {
        setAuthExpired(true)
      } else {
        setSubmitError(error.message)
      }
      setSubmitting(false)
    } else {
      onLocked?.(data)
    }
  }

  // ── Confirmation banter (must be before any early return) ───────────────────
  const winnerConfirmation = useMemo(() => {
    if (!winner) return null
    const shortName = winner === match.team_a
      ? (teamA?.shortName ?? winner.toUpperCase())
      : (teamB?.shortName ?? winner.toUpperCase())
    return getBanter('pickConfirmations.matchWinner', { TEAM: shortName, FRIEND: friend })
  }, [winner, friend])

  const callConfirmation = useMemo(() => {
    if (!call) return null
    return getBanter('pickConfirmations.theCall', { ANSWER: call, FRIEND: friend })
  }, [call, friend])

  const villainConfirmation = useMemo(() => {
    if (!villain) return null
    return getBanter('pickConfirmations.villainPick', { PLAYER: villain, FRIEND: friend })
  }, [villain, friend])

  const chaosConfirmation = useMemo(() => {
    if (!chaos) return null
    return getBanter('pickConfirmations.chaosBall', { ANSWER: chaos, FRIEND: friend })
  }, [chaos, friend])

  // ── Auth expired — early return after all hooks ───────────────────────────
  if (authExpired) {
    return (
      <div style={{
        marginTop: '20px',
        borderRadius: '14px',
        padding: '20px',
        background: '#fff5f5',
        border: '1.5px solid rgba(200,0,0,0.12)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '24px', marginBottom: '8px' }}>🔐</p>
        <p className="font-display font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
          Session expired
        </p>
        <p className="font-body text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Your picks are still here. Sign in again to submit.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="font-display font-bold tap-feedback"
          style={{
            background: 'var(--team-primary)',
            color: 'var(--team-text-on-primary)',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Reload to sign in
        </button>
      </div>
    )
  }

  return (
    <div style={{ marginTop: '20px' }}>

      {/* Open banter */}
      {!isEditing && (
        <p className="font-body text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          {openBanter}
        </p>
      )}

      {/* Match Winner */}
      <SectionLabel>🏆 Match Winner</SectionLabel>
      <div style={{ display: 'flex', gap: '10px', marginBottom: winner ? '8px' : '20px' }}>
        <PickButton
          label={teamA?.shortName ?? match.team_a.toUpperCase()}
          selected={winner === match.team_a}
          onClick={() => setWinner(match.team_a)}
        />
        <PickButton
          label={teamB?.shortName ?? match.team_b.toUpperCase()}
          selected={winner === match.team_b}
          onClick={() => setWinner(match.team_b)}
        />
      </div>
      {winnerConfirmation && (
        <p className="font-mono text-xs mb-4" style={{ color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
          {winnerConfirmation}
        </p>
      )}

      {/* The Call */}
      {theCall && (
        <>
          <SectionLabel>🎯 The Call</SectionLabel>
          <p className="font-body text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            {theCall.display_text}
          </p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: call ? '8px' : '20px', flexWrap: 'wrap' }}>
            {(theCall.answer_options ?? []).map(opt => (
              <PickButton
                key={opt}
                label={opt}
                selected={call === opt}
                onClick={() => setCall(opt)}
              />
            ))}
          </div>
          {callConfirmation && (
            <p className="font-mono text-xs mb-4" style={{ color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
              {callConfirmation}
            </p>
          )}
        </>
      )}

      {/* Villain Pick */}
      <SectionLabel>😈 Villain Pick</SectionLabel>
      <p className="font-body text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
        Pick any player. Under 10 runs / 0 wickets = +15 pts. Over 30 runs / 2+ wickets = −5 pts.
      </p>
      {hasSquad ? (
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <select
            value={villain}
            onChange={e => setVillain(e.target.value)}
            style={{
              width: '100%',
              appearance: 'none',
              background: villain ? 'var(--team-tinted-bg)' : 'var(--card)',
              border: `1.5px solid ${villain ? 'var(--team-primary)' : 'var(--border-default)'}`,
              borderRadius: '12px',
              padding: '13px 40px 13px 14px',
              fontSize: '14px',
              fontFamily: 'Familjen Grotesk, sans-serif',
              color: villain ? 'var(--text-primary)' : 'var(--text-placeholder)',
              cursor: 'pointer',
            }}
          >
            <option value="">Select a player…</option>
            {squadA.length > 0 && (
              <optgroup label={`── ${teamA?.shortName ?? match.team_a.toUpperCase()} ──`}>
                {squadA.map(p => (
                  <option key={`a-${p.name}`} value={p.name}>{p.name}</option>
                ))}
              </optgroup>
            )}
            {squadB.length > 0 && (
              <optgroup label={`── ${teamB?.shortName ?? match.team_b.toUpperCase()} ──`}>
                {squadB.map(p => (
                  <option key={`b-${p.name}`} value={p.name}>{p.name}</option>
                ))}
              </optgroup>
            )}
          </select>
          <span style={{
            position: 'absolute', right: '14px', top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: 'var(--text-muted)',
            fontSize: '12px',
          }}>▼</span>
        </div>
      ) : (
        <div style={{
          marginBottom: '20px',
          padding: '13px 14px',
          borderRadius: '12px',
          background: 'var(--surface-subtle)',
          border: '1.5px dashed var(--border-default)',
        }}>
          <p className="font-body text-sm" style={{ color: 'var(--text-muted)', margin: 0 }}>
            {getBanter('pickConfirmations.noSquad')}
          </p>
        </div>
      )}
      {villainConfirmation && (
        <p className="font-mono text-xs mb-4" style={{ color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
          {villainConfirmation}
        </p>
      )}

      {/* Chaos Ball */}
      {chaosBall && (
        <>
          <SectionLabel>💥 Chaos Ball</SectionLabel>
          <p className="font-body text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            {chaosBall.display_text}
          </p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: chaos ? '8px' : '24px', flexWrap: 'wrap' }}>
            {(chaosBall.answer_options ?? []).map(opt => (
              <PickButton
                key={opt}
                label={opt}
                selected={chaos === opt}
                onClick={() => setChaos(opt)}
              />
            ))}
          </div>
          {chaosConfirmation && (
            <p className="font-mono text-xs mb-4" style={{ color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
              {chaosConfirmation}
            </p>
          )}
        </>
      )}

      {/* Submit error */}
      {submitError && (
        <p className="font-mono text-xs text-center mb-3" style={{ color: '#cc0000' }}>
          {submitError}
        </p>
      )}

      {/* Submit + optional cancel when editing */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {isEditing && onCancel && (
          <button
            onClick={onCancel}
            className="font-display font-bold tap-feedback"
            style={{
              flex: '0 0 auto',
              padding: '17px 18px',
              borderRadius: '14px',
              border: '1.5px solid var(--border-subtle)',
              background: 'var(--card)',
              color: 'var(--text-muted)',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!allPicked || submitting}
          className="font-display font-extrabold tap-feedback"
          style={{
            flex: 1,
            background: allPicked ? 'var(--team-primary)' : 'var(--surface-subtle)',
            color: allPicked ? 'var(--team-text-on-primary)' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '14px',
            padding: '17px',
            fontSize: '17px',
            letterSpacing: '-0.3px',
            cursor: allPicked ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s ease, color 0.2s ease',
          }}
        >
          {submitting ? 'Saving…' : isEditing ? 'Update picks ✓' : 'Lock it in →'}
        </button>
      </div>
    </div>
  )
}

/* ─── Locked card ────────────────────────────────────────────────────────── */

function LockedCard({ prediction, theCall, chaosBall, teamA, teamB, canEdit, onEdit, friendName = null }) {
  const winnerTeam = prediction.match_winner_pick === teamA?.id ? teamA : teamB
  const friend = friendName ?? 'someone'
  const banter = canEdit
    ? getBanter('cardStates.saved', { FRIEND: friend })
    : getBanter('cardStates.locked', { FRIEND: friend })

  return (
    <div style={{ marginTop: '20px' }}>
      {/* Banter line */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '7px',
        marginBottom: '14px',
        padding: '10px 14px',
        background: 'var(--surface-subtle)',
        borderRadius: '10px',
        border: '1px solid var(--border-subtle)',
      }}>
        <span style={{ fontSize: '14px', flexShrink: 0 }}>{canEdit ? '✓' : '🔒'}</span>
        <p className="font-body text-sm" style={{ color: 'var(--text-secondary)', margin: 0 }}>
          {banter}
        </p>
      </div>

      {/* Pick rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <LockedRow
          icon="🏆"
          label="Match Winner"
          value={winnerTeam?.shortName ?? prediction.match_winner_pick?.toUpperCase()}
        />
        {theCall && prediction.the_call_pick && (
          <LockedRow icon="🎯" label={theCall.display_text} value={prediction.the_call_pick} />
        )}
        {prediction.villain_pick_player && (
          <LockedRow icon="😈" label="Villain Pick" value={prediction.villain_pick_player} />
        )}
        {chaosBall && prediction.chaos_ball_pick && (
          <LockedRow icon="💥" label={chaosBall.display_text} value={prediction.chaos_ball_pick} />
        )}
      </div>

      {/* Edit link — only before match starts */}
      {canEdit && (
        <div style={{ textAlign: 'center', marginTop: '14px' }}>
          <button
            onClick={onEdit}
            className="font-mono tap-feedback"
            style={{
              background: 'none',
              border: 'none',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              textDecoration: 'underline',
              textDecorationColor: 'var(--border-default)',
              textUnderlineOffset: '3px',
            }}
          >
            ✏️ Change picks
          </button>
        </div>
      )}
    </div>
  )
}

function LockedRow({ icon, label, value }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '11px 14px',
      background: 'var(--card)',
      borderRadius: '12px',
      border: '1.5px solid var(--border-subtle)',
      gap: '10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: '15px', flexShrink: 0 }}>{icon}</span>
        <p className="font-body text-xs" style={{ color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </p>
      </div>
      <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)', margin: 0, flexShrink: 0 }}>
        {value}
      </p>
    </div>
  )
}

/* ─── Missed card ────────────────────────────────────────────────────────── */

function MissedCard({ match, teamA, teamB, friendName = null }) {
  const title = getBanter('cardStates.missedTitle')
  const banter = getBanter('cardStates.missed', {
    TEAM_A: teamA?.shortName ?? match.team_a.toUpperCase(),
    TEAM_B: teamB?.shortName ?? match.team_b.toUpperCase(),
    FRIEND: friendName ?? 'someone',
  })

  return (
    <div style={{
      marginTop: '20px',
      borderRadius: '14px',
      padding: '20px',
      background: 'var(--surface-subtle)',
      border: '1.5px dashed var(--border-default)',
      textAlign: 'center',
    }}>
      <p style={{ fontSize: '28px', marginBottom: '8px' }}>😬</p>
      <p className="font-display font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
        {title}
      </p>
      <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
        {banter}
      </p>
    </div>
  )
}

/* ─── Group picks (visible after match starts) ───────────────────────────── */

function GroupPicksSection({ match, teamA, teamB }) {
  const { predictions, loading } = useGroupPredictions(match.id)

  if (loading) {
    return (
      <div style={{ marginTop: '24px' }}>
        <Divider />
        <GroupSkeleton />
      </div>
    )
  }

  if (!predictions.length) {
    return (
      <div style={{ marginTop: '24px' }}>
        <Divider />
        <SectionLabel>The Group</SectionLabel>
        <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
          {getBanter('groupPicks.justYou')}
        </p>
      </div>
    )
  }

  const countA = predictions.filter(p => p.match_winner_pick === match.team_a).length
  const countB = predictions.filter(p => p.match_winner_pick === match.team_b).length
  const total  = predictions.length
  const pctA   = total ? Math.round((countA / total) * 100) : 50

  return (
    <div style={{ marginTop: '24px' }}>
      <Divider />
      <SectionLabel>The Group</SectionLabel>

      {/* Winner split bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: teamA?.colors?.primary ?? 'var(--border-default)', flexShrink: 0 }} />
            <span className="font-display font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
              {teamA?.shortName ?? match.team_a.toUpperCase()}
            </span>
            <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{countA}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{countB}</span>
            <span className="font-display font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
              {teamB?.shortName ?? match.team_b.toUpperCase()}
            </span>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: teamB?.colors?.primary ?? 'var(--border-default)', flexShrink: 0 }} />
          </div>
        </div>
        <div style={{
          height: '6px',
          borderRadius: '99px',
          background: teamB?.colors?.primary ? `${teamB.colors.primary}44` : 'var(--border-subtle)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${pctA}%`,
            background: teamA?.colors?.primary ?? 'var(--team-primary)',
            borderRadius: '99px',
            transition: 'width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }} />
        </div>
        <p className="font-body text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
          {countA === countB
            ? `Split — ${countA} each`
            : `${Math.max(countA, countB)} of ${total} picked ${countA > countB
                ? (teamA?.shortName ?? match.team_a.toUpperCase())
                : (teamB?.shortName ?? match.team_b.toUpperCase())}`
          }
        </p>
      </div>

      {/* Member rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {predictions.map(p => (
          <GroupMemberRow
            key={p.user_id}
            prediction={p}
            match={match}
            teamA={teamA}
            teamB={teamB}
          />
        ))}
      </div>
    </div>
  )
}

function GroupMemberRow({ prediction, match, teamA, teamB }) {
  const name = prediction.users?.display_name ?? 'Unknown'
  const initial = name.charAt(0).toUpperCase()
  const pickedTeam = prediction.match_winner_pick === match.team_a ? teamA : teamB
  const villain = prediction.villain_pick_player
  const callPick = prediction.the_call_pick
  const chaosPick = prediction.chaos_ball_pick

  return (
    <div style={{
      padding: '12px 14px',
      background: 'var(--card)',
      borderRadius: '14px',
      border: '1.5px solid var(--border-subtle)',
    }}>
      {/* Top row: avatar + name + winner pill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: pickedTeam?.colors?.primary ?? 'var(--team-primary)',
            color: pickedTeam?.colors?.textOnPrimary ?? 'var(--team-text-on-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Bricolage Grotesque, sans-serif',
            fontWeight: 700,
            fontSize: '13px',
            flexShrink: 0,
          }}>
            {initial}
          </div>
          <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)', margin: 0 }}>
            {name}
          </p>
        </div>

        {/* Winner pill — actual team colour */}
        <div style={{
          padding: '4px 10px',
          borderRadius: '99px',
          background: pickedTeam?.colors?.primary ?? 'var(--team-primary)',
          flexShrink: 0,
        }}>
          <p className="font-display font-bold" style={{
            fontSize: '12px',
            color: pickedTeam?.colors?.textOnPrimary ?? 'var(--team-text-on-primary)',
            margin: 0,
          }}>
            {pickedTeam?.shortName ?? prediction.match_winner_pick?.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Sub-picks row */}
      {(villain || callPick || chaosPick) && (
        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
        }}>
          {villain && (
            <span className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
              😈 {villain}
            </span>
          )}
          {callPick && (
            <span className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
              🎯 {callPick}
            </span>
          )}
          {chaosPick && (
            <span className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
              💥 {chaosPick}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Shared primitives ──────────────────────────────────────────────────── */

function SectionLabel({ children }) {
  return (
    <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
      {children}
    </p>
  )
}

function Divider() {
  return (
    <div style={{ height: '1px', background: 'var(--border-subtle)', marginBottom: '20px' }} />
  )
}

function PickButton({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className="tap-feedback"
      style={{
        flex: 1,
        padding: '12px 8px',
        borderRadius: '12px',
        border: `1.5px solid ${selected ? 'var(--team-primary)' : 'var(--border-default)'}`,
        background: selected ? 'var(--team-primary)' : 'var(--card)',
        color: selected ? 'var(--team-text-on-primary)' : 'var(--text-primary)',
        fontFamily: 'Bricolage Grotesque, sans-serif',
        fontWeight: 700,
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
        minWidth: 0,
      }}
    >
      {label}
    </button>
  )
}

function GroupSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} className="shimmer" style={{ height: '50px', borderRadius: '12px' }} />
      ))}
    </div>
  )
}
