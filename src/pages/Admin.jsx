import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { getTeam } from '../lib/content'
import { scoreMatchCard, scoreH2HMatch } from '../lib/scoring'

// ─── Main page ───────────────────────────────────────────────────────────────

export default function Admin() {
  const { profile, loading } = useAuth()

  if (loading) return null
  if (!profile?.is_admin) return <Navigate to="/" replace />

  return (
    <div className="p-4 animate-slide-up" style={{ paddingBottom: '32px' }}>
      <div className="mb-6">
        <p className="font-mono text-xs tracking-widest uppercase mb-0.5" style={{ color: 'var(--text-muted)' }}>
          Admin
        </p>
        <h1 className="font-display font-black" style={{ fontSize: '28px', color: 'var(--text-primary)', letterSpacing: '-1px', lineHeight: 1.1 }}>
          Scoring Panel
        </h1>
      </div>
      <ScoringPanel />
    </div>
  )
}

// ─── Scoring Panel ───────────────────────────────────────────────────────────

function ScoringPanel() {
  const [matches, setMatches] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loadingMatches, setLoadingMatches] = useState(true)

  useEffect(() => {
    supabase
      .from('matches')
      .select('id, match_number, date, team_a, team_b, status, winner')
      .order('match_number', { ascending: true })
      .then(({ data }) => {
        setMatches(data ?? [])
        // Default to first live/upcoming match
        const first = data?.find(m => m.status === 'live') ?? data?.find(m => m.status === 'upcoming')
        if (first) setSelectedId(first.id)
        setLoadingMatches(false)
      })
  }, [])

  if (loadingMatches) return <Spinner />

  if (!matches.length) {
    return (
      <Card>
        <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>No matches found. Seed the schedule first.</p>
      </Card>
    )
  }

  const selected = matches.find(m => m.id === selectedId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Match selector */}
      <Card>
        <label className="font-mono text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
          Select Match
        </label>
        <select
          value={selectedId ?? ''}
          onChange={e => setSelectedId(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1.5px solid var(--border-subtle)',
            background: 'var(--surface-subtle)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            outline: 'none',
          }}
        >
          {matches.map(m => {
            const tA = getTeam(m.team_a)
            const tB = getTeam(m.team_b)
            const label = `M${m.match_number} — ${tA?.shortName ?? m.team_a} vs ${tB?.shortName ?? m.team_b}`
            const badge = m.status === 'completed' ? ' ✓' : m.status === 'cancelled' ? ' ✕' : m.status === 'live' ? ' ●' : ''
            return <option key={m.id} value={m.id}>{label}{badge}</option>
          })}
        </select>
      </Card>

      {/* Per-match scoring form */}
      {selected && (
        <MatchScoringForm
          key={selected.id}
          match={selected}
          onPublished={(updatedMatch) => {
            setMatches(prev => prev.map(m => m.id === updatedMatch.id ? { ...m, ...updatedMatch } : m))
          }}
        />
      )}
    </div>
  )
}

// ─── Match Scoring Form ───────────────────────────────────────────────────────

function MatchScoringForm({ match, onPublished }) {
  const teamA = getTeam(match.team_a)
  const teamB = getTeam(match.team_b)

  // Form state
  const [winner, setWinner] = useState(match.winner ?? '')
  const [resultType, setResultType] = useState(match.result_type ?? 'normal')
  const [questions, setQuestions] = useState([]) // [{id, type, display_text, answer_options, correct_answer}]
  const [callAnswer, setCallAnswer] = useState('')
  const [chaosAnswer, setChaosAnswer] = useState('')
  const [scorecard, setScorecard] = useState('') // JSON textarea
  const [h2hPairings, setH2hPairings] = useState([]) // [{user_a, user_b}]

  // Preview state
  const [preview, setPreview] = useState(null) // [{user_id, display_name, winner_pts, ...}]
  const [previewing, setPreviewing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishedAt, setPublishedAt] = useState(null)
  const [error, setError] = useState(null)

  // Load questions + existing scores on mount
  useEffect(() => {
    async function load() {
      const [{ data: qs }, { data: pairings }] = await Promise.all([
        supabase
          .from('match_questions')
          .select('*')
          .eq('match_id', match.id),
        supabase
          .from('h2h_pairings')
          .select('user_a, user_b')
          .eq('is_active', true),
      ])

      const qList = qs ?? []
      setQuestions(qList)

      const callQ = qList.find(q => q.type === 'the_call')
      const chaosQ = qList.find(q => q.type === 'chaos_ball')
      if (callQ?.correct_answer) setCallAnswer(callQ.correct_answer)
      if (chaosQ?.correct_answer) setChaosAnswer(chaosQ.correct_answer)
      if (match.scorecard_json) setScorecard(JSON.stringify(match.scorecard_json, null, 2))
      setH2hPairings(pairings ?? [])
    }
    load()
  }, [match.id])

  const callQ = questions.find(q => q.type === 'the_call')
  const chaosQ = questions.find(q => q.type === 'chaos_ball')

  const isCancelled = resultType === 'no_result'

  // ── Compute preview ──────────────────────────────────────────
  const handlePreview = useCallback(async () => {
    setError(null)
    setPreviewing(true)
    setPreview(null)

    try {
      // Fetch all predictions for this match + user display names
      const { data: preds, error: predsError } = await supabase
        .from('predictions')
        .select('*, users(id, display_name)')
        .eq('match_id', match.id)

      if (predsError) throw predsError
      if (!preds?.length) throw new Error('No predictions found for this match.')

      // Cancelled / No Result — zero all scores
      if (isCancelled) {
        const rows = preds.map(pred => ({
          user_id: pred.user_id,
          display_name: pred.users?.display_name ?? pred.user_id.slice(0, 8),
          winner_pts: 0, call_pts: 0, villain_pts: 0, chaos_pts: 0, h2h_pts: 0, total: 0,
        }))
        setPreview(rows)
        return
      }

      let parsedScorecard = []
      if (scorecard.trim()) {
        try { parsedScorecard = JSON.parse(scorecard) }
        catch { throw new Error('Scorecard JSON is invalid. Fix it before previewing.') }
      }

      const allWinnerPicks = preds.map(p => p.match_winner_pick).filter(Boolean)
      const allCallPicks = preds.map(p => p.the_call_pick).filter(Boolean)

      const matchResult = { winner, scorecard: parsedScorecard }
      const questionResults = { the_call: callAnswer, chaos_ball: chaosAnswer }
      const allPicks = { winner: allWinnerPicks, the_call: allCallPicks }

      // Score each prediction
      const matchTotals = {}
      const rows = preds.map(pred => {
        const card = scoreMatchCard(pred, matchResult, questionResults, allPicks)
        matchTotals[pred.user_id] = card.total
        return {
          user_id: pred.user_id,
          display_name: pred.users?.display_name ?? pred.user_id.slice(0, 8),
          winner_pick: pred.match_winner_pick,
          call_pick: pred.the_call_pick,
          villain_pick: pred.villain_pick_player,
          chaos_pick: pred.chaos_ball_pick,
          ...card,
        }
      })

      // H2H
      const h2hResult = scoreH2HMatch(h2hPairings, matchTotals)
      rows.forEach(row => {
        row.h2h_pts = h2hResult[row.user_id] ?? 0
        row.total += row.h2h_pts
      })

      rows.sort((a, b) => b.total - a.total)
      setPreview(rows)
    } catch (e) {
      setError(e.message)
    } finally {
      setPreviewing(false)
    }
  }, [match.id, winner, callAnswer, chaosAnswer, scorecard, h2hPairings, isCancelled])

  // ── Publish ──────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    if (!preview) return
    setError(null)
    setPublishing(true)

    try {
      const newStatus = isCancelled ? 'cancelled' : 'completed'

      // 1. Update match — status + result_type (+ winner/scorecard if not cancelled)
      const matchUpdate = { status: newStatus, result_type: resultType }
      if (!isCancelled) {
        matchUpdate.winner = winner
        matchUpdate.scorecard_json = scorecard.trim() ? JSON.parse(scorecard) : null
      }
      const { error: matchErr } = await supabase
        .from('matches')
        .update(matchUpdate)
        .eq('id', match.id)
      if (matchErr) throw matchErr

      // 2. Set correct answers on match_questions (skip for cancelled)
      if (!isCancelled) {
        const updates = []
        if (callQ && callAnswer) updates.push(
          supabase.from('match_questions').update({ correct_answer: callAnswer }).eq('id', callQ.id)
        )
        if (chaosQ && chaosAnswer) updates.push(
          supabase.from('match_questions').update({ correct_answer: chaosAnswer }).eq('id', chaosQ.id)
        )
        await Promise.all(updates)
      }

      // 3. Upsert match_scores (zeroed for cancelled)
      const scoreRows = preview.map(row => ({
        user_id: row.user_id,
        match_id: match.id,
        winner_pts: row.winner_pts ?? 0,
        call_pts: row.call_pts ?? 0,
        villain_pts: row.villain_pts ?? 0,
        chaos_pts: row.chaos_pts ?? 0,
        h2h_pts: row.h2h_pts ?? 0,
        total: row.total ?? 0,
      }))
      const { error: scoresErr } = await supabase
        .from('match_scores')
        .upsert(scoreRows, { onConflict: 'user_id,match_id' })
      if (scoresErr) throw scoresErr

      setPublishedAt(true)
      onPublished({ id: match.id, winner: isCancelled ? null : winner, status: newStatus, result_type: resultType })
    } catch (e) {
      setError(e.message)
    } finally {
      setPublishing(false)
    }
  }, [match.id, winner, resultType, isCancelled, callAnswer, chaosAnswer, scorecard, callQ, chaosQ, preview, onPublished])

  const alreadyPublished = match.status === 'completed' || match.status === 'cancelled'
  const justPublished = !!publishedAt

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Match header */}
      <Card>
        <p className="font-mono text-xs tracking-wide uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
          M{match.match_number} · {new Date(match.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-display font-black" style={{ fontSize: '22px', color: 'var(--text-primary)' }}>
            {teamA?.shortName ?? match.team_a}
          </span>
          <span className="font-display font-black" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>vs</span>
          <span className="font-display font-black" style={{ fontSize: '22px', color: 'var(--text-primary)' }}>
            {teamB?.shortName ?? match.team_b}
          </span>
        </div>
        {(alreadyPublished || justPublished) && (
          <div className="mt-2">
            <StatusBadge
              label={match.status === 'cancelled' || (justPublished && isCancelled) ? 'Cancelled' : 'Published'}
              color={match.status === 'cancelled' || (justPublished && isCancelled) ? 'red' : 'green'}
            />
          </div>
        )}
      </Card>

      {/* Winner */}
      <Card>
        <SectionLabel>Match Winner</SectionLabel>
        <div className="flex gap-2 mt-2">
          {[match.team_a, match.team_b].map(tid => {
            const t = getTeam(tid)
            const active = winner === tid
            return (
              <button
                key={tid}
                onClick={() => setWinner(tid)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: `2px solid ${active ? (t?.colors?.primary ?? 'var(--text-primary)') : 'var(--border-subtle)'}`,
                  background: active ? (t?.colors?.primary ?? 'var(--text-primary)') + '18' : 'var(--surface-subtle)',
                  color: active ? (t?.colors?.primary ?? 'var(--text-primary)') : 'var(--text-secondary)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {t?.shortName ?? tid.toUpperCase()}
              </button>
            )
          })}
        </div>
        {winner && (
          <p className="font-mono text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Winner: {getTeam(winner)?.name ?? winner}
          </p>
        )}
      </Card>

      {/* Result Type */}
      <Card>
        <SectionLabel>Result Type</SectionLabel>
        <div className="flex flex-wrap gap-2 mt-2">
          {[
            { value: 'normal',     label: 'Normal' },
            { value: 'super_over', label: 'Super Over' },
            { value: 'dls',        label: 'DLS' },
            { value: 'no_result',  label: 'Cancelled / No Result' },
          ].map(opt => {
            const active = resultType === opt.value
            const isCancelOpt = opt.value === 'no_result'
            return (
              <button
                key={opt.value}
                onClick={() => setResultType(opt.value)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: `1.5px solid ${active ? (isCancelOpt ? '#dc2626' : 'var(--text-primary)') : 'var(--border-subtle)'}`,
                  background: active ? (isCancelOpt ? 'rgba(220,38,38,0.10)' : 'var(--text-primary)') : 'var(--surface-subtle)',
                  color: active ? (isCancelOpt ? '#dc2626' : 'var(--card)') : 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  fontWeight: active ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
        {isCancelled && (
          <p className="font-mono text-xs mt-2" style={{ color: '#dc2626' }}>
            All scores will be set to 0. Match status → cancelled.
          </p>
        )}
        {resultType === 'super_over' && (
          <p className="font-mono text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Winner is determined by super over result. Scoring unchanged.
          </p>
        )}
        {resultType === 'dls' && (
          <p className="font-mono text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            DLS applied. Winner as set above. Scoring unchanged.
          </p>
        )}
      </Card>

      {/* The Call */}
      {callQ && !isCancelled && (
        <Card>
          <SectionLabel>The Call</SectionLabel>
          <p className="font-body text-sm mt-1 mb-3" style={{ color: 'var(--text-secondary)' }}>{callQ.display_text}</p>
          <AnswerButtons
            options={callQ.answer_options}
            value={callAnswer}
            onChange={setCallAnswer}
          />
        </Card>
      )}

      {/* Chaos Ball */}
      {chaosQ && !isCancelled && (
        <Card>
          <SectionLabel>Chaos Ball</SectionLabel>
          <p className="font-body text-sm mt-1 mb-3" style={{ color: 'var(--text-secondary)' }}>{chaosQ.display_text}</p>
          <AnswerButtons
            options={chaosQ.answer_options}
            value={chaosAnswer}
            onChange={setChaosAnswer}
          />
        </Card>
      )}

      {/* Scorecard JSON */}
      {!isCancelled && (
        <Card>
          <SectionLabel>Scorecard (JSON)</SectionLabel>
          <p className="font-body text-xs mt-1 mb-2" style={{ color: 'var(--text-muted)' }}>
            Array of player objects: {`{ name, runs?, wickets?, role?, didNotPlay? }`}
          </p>
          <textarea
            value={scorecard}
            onChange={e => setScorecard(e.target.value)}
            placeholder='[{"name":"Virat Kohli","runs":45,"wickets":0,"role":"batter"}]'
            rows={6}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1.5px solid var(--border-subtle)',
              background: 'var(--surface-subtle)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </Card>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#fff0f0', border: '1.5px solid rgba(200,0,0,0.15)' }}>
          <p className="font-mono text-xs" style={{ color: '#cc0000' }}>{error}</p>
        </div>
      )}

      {/* Preview */}
      {preview && <PreviewTable rows={preview} />}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handlePreview}
          disabled={previewing || (!winner && !isCancelled)}
          style={btnStyle('secondary', previewing || (!winner && !isCancelled))}
        >
          {previewing ? 'Computing…' : 'Preview Scores'}
        </button>
        <button
          onClick={handlePublish}
          disabled={publishing || !preview || justPublished}
          style={btnStyle('primary', publishing || !preview || justPublished)}
        >
          {publishing ? 'Publishing…' : justPublished ? 'Published ✓' : alreadyPublished ? 'Re-publish' : 'Publish'}
        </button>
      </div>
    </div>
  )
}

// ─── Preview Table ────────────────────────────────────────────────────────────

function PreviewTable({ rows }) {
  return (
    <Card>
      <SectionLabel>Score Preview</SectionLabel>
      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {rows.map((row, i) => (
          <div key={row.user_id} style={{
            display: 'grid',
            gridTemplateColumns: '20px 1fr repeat(5, 36px)',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 10px',
            borderRadius: '10px',
            background: 'var(--surface-subtle)',
            border: '1px solid var(--border-subtle)',
          }}>
            <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
            <span className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.display_name}
            </span>
            <PtCell label="W" pts={row.winner_pts} />
            <PtCell label="C" pts={row.call_pts} />
            <PtCell label="V" pts={row.villain_pts} />
            <PtCell label="CB" pts={row.chaos_pts} />
            <span className="font-display font-black text-sm text-right" style={{ color: 'var(--text-primary)' }}>
              {row.total > 0 ? '+' : ''}{row.total}
            </span>
          </div>
        ))}
        <p className="font-mono text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          W = Winner · C = The Call · V = Villain · CB = Chaos Ball
        </p>
      </div>
    </Card>
  )
}

function PtCell({ label, pts }) {
  const color = pts > 0 ? '#16a34a' : pts < 0 ? '#dc2626' : 'var(--text-muted)'
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
      <div className="font-mono font-bold" style={{ fontSize: '12px', color }}>{pts >= 0 ? '+' : ''}{pts}</div>
    </div>
  )
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function AnswerButtons({ options, value, onChange }) {
  const opts = Array.isArray(options) ? options : JSON.parse(options ?? '[]')
  return (
    <div className="flex flex-wrap gap-2">
      {opts.map(opt => {
        const active = value === opt
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: `1.5px solid ${active ? 'var(--text-primary)' : 'var(--border-subtle)'}`,
              background: active ? 'var(--text-primary)' : 'var(--surface-subtle)',
              color: active ? 'var(--card)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              fontWeight: active ? 700 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

function Card({ children }) {
  return (
    <div style={{
      padding: '16px',
      borderRadius: '16px',
      background: 'var(--card)',
      border: '1.5px solid var(--border-subtle)',
      boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
    }}>
      {children}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <p className="font-mono text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
      {children}
    </p>
  )
}

function StatusBadge({ label, color }) {
  const colors = {
    green: { bg: 'rgba(22,163,74,0.10)', border: 'rgba(22,163,74,0.25)', text: '#16a34a' },
    red:   { bg: 'rgba(220,38,38,0.10)', border: 'rgba(220,38,38,0.25)', text: '#dc2626' },
  }
  const c = colors[color] ?? colors.green
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: '99px',
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.text,
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      fontWeight: 700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    }}>
      {label}
    </span>
  )
}

function Spinner() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>Loading…</p>
    </div>
  )
}

function btnStyle(variant, disabled) {
  const base = {
    flex: 1,
    padding: '12px',
    borderRadius: '12px',
    fontFamily: 'var(--font-display)',
    fontWeight: 900,
    fontSize: '14px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'opacity 0.15s',
    border: 'none',
  }
  if (variant === 'primary') return { ...base, background: 'var(--text-primary)', color: 'var(--card)' }
  return { ...base, background: 'var(--surface-subtle)', color: 'var(--text-primary)', border: '1.5px solid var(--border-subtle)' }
}
