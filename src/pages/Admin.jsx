import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { getTeam } from '../lib/content'
import { scoreMatchCard, scoreH2HMatch } from '../lib/scoring'
import { computeAllFantasyXIScores } from '../lib/fantasyScoring'
import { createCricketApi } from '../lib/cricketApi'

// ─── Main page ───────────────────────────────────────────────────────────────

export default function Admin() {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (!profile?.is_admin) return <Navigate to="/" replace />

  return (
    <div className="p-4 animate-slide-up" style={{ paddingBottom: '40px' }}>
      <div className="mb-6">
        <p className="font-mono text-xs tracking-widest uppercase mb-0.5" style={{ color: 'var(--text-muted)' }}>
          Admin
        </p>
        <h1 className="font-display font-black" style={{ fontSize: '28px', color: 'var(--text-primary)', letterSpacing: '-1px', lineHeight: 1.1 }}>
          Scoring Panel
        </h1>
        <p className="font-body text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Score matches and Fantasy XIs after each game.
        </p>
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
      .select('id, match_number, date, team_a, team_b, status, winner, api_match_id')
      .order('match_number', { ascending: true })
      .then(({ data }) => {
        setMatches(data ?? [])
        const first = data?.find(m => m.status === 'live') ?? data?.find(m => m.status === 'upcoming')
        if (first) setSelectedId(first.id)
        setLoadingMatches(false)
      })
  }, [])

  if (loadingMatches) return <Spinner />
  if (!matches.length) {
    return <Card><p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>No matches found. Seed the schedule first.</p></Card>
  }

  const selected = matches.find(m => m.id === selectedId)

  // Group matches by status for the selector
  const upcoming  = matches.filter(m => m.status === 'upcoming')
  const live      = matches.filter(m => m.status === 'live')
  const completed = matches.filter(m => m.status === 'completed' || m.status === 'cancelled')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Match selector */}
      <Card>
        <SectionLabel>Select Match</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
          {[...live, ...upcoming, ...completed].map(m => {
            const tA     = getTeam(m.team_a)
            const tB     = getTeam(m.team_b)
            const active = m.id === selectedId
            const dot    = m.status === 'live' ? '🔴' : m.status === 'completed' ? '✓' : m.status === 'cancelled' ? '✕' : ''
            return (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: '10px', textAlign: 'left',
                  border: `1.5px solid ${active ? 'var(--team-primary)' : 'var(--border-subtle)'}`,
                  background: active ? 'var(--team-tinted-bg)' : 'var(--surface-subtle)',
                  cursor: 'pointer',
                }}
              >
                <span className="font-display font-bold" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                  M{m.match_number} · {tA?.shortName ?? m.team_a} vs {tB?.shortName ?? m.team_b}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}
                  </span>
                  {dot && <span style={{ fontSize: '11px' }}>{dot}</span>}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      {selected && (
        <MatchScoringForm
          key={selected.id}
          match={selected}
          onPublished={updated =>
            setMatches(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m))
          }
        />
      )}
    </div>
  )
}

// ─── Match Scoring Form ───────────────────────────────────────────────────────

function MatchScoringForm({ match, onPublished }) {
  const teamA = getTeam(match.team_a)
  const teamB = getTeam(match.team_b)

  const [winner,      setWinner]      = useState(match.winner ?? '')
  const [resultType,  setResultType]  = useState(match.result_type ?? 'normal')
  const [questions,   setQuestions]   = useState([])
  const [callAnswer,  setCallAnswer]  = useState('')
  const [chaosAnswer, setChaosAnswer] = useState('')
  const [scorecard,   setScorecard]   = useState('')
  const [h2hPairings, setH2hPairings] = useState([])

  const [preview,    setPreview]    = useState(null)
  const [previewing, setPreviewing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [published,  setPublished]  = useState(false)
  const [error,      setError]      = useState(null)
  const [fetching,   setFetching]   = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: qs }, { data: pairings }] = await Promise.all([
        supabase.from('match_questions').select('*').eq('match_id', match.id),
        supabase.from('h2h_pairings').select('user_a, user_b').eq('is_active', true),
      ])
      const qList = qs ?? []
      setQuestions(qList)
      const callQ  = qList.find(q => q.type === 'the_call')
      const chaosQ = qList.find(q => q.type === 'chaos_ball')
      if (callQ?.correct_answer)  setCallAnswer(callQ.correct_answer)
      if (chaosQ?.correct_answer) setChaosAnswer(chaosQ.correct_answer)
      if (match.scorecard_json)   setScorecard(JSON.stringify(match.scorecard_json, null, 2))
      setH2hPairings(pairings ?? [])
    }
    load()
  }, [match.id])

  const callQ      = questions.find(q => q.type === 'the_call')
  const chaosQ     = questions.find(q => q.type === 'chaos_ball')
  const isCancelled = resultType === 'no_result'
  const alreadyDone = match.status === 'completed' || match.status === 'cancelled'

  // ── Auto-fetch scorecard from CricAPI ─────────────────────────
  const handleFetchScorecard = useCallback(async () => {
    if (!match.api_match_id) return
    setError(null); setFetching(true)
    try {
      const api     = createCricketApi(import.meta.env.VITE_CRICAPI_KEY)
      const players = await api.fetchFantasyScorecard(match.api_match_id)
      setScorecard(JSON.stringify(players, null, 2))
    } catch (e) {
      setError(`Scorecard fetch failed: ${e.message}`)
    } finally {
      setFetching(false)
    }
  }, [match.api_match_id])

  // ── Preview ───────────────────────────────────────────────────
  const handlePreview = useCallback(async () => {
    setError(null); setPreviewing(true); setPreview(null)
    try {
      const { data: preds, error: e } = await supabase
        .from('predictions')
        .select('*, users(id, display_name)')
        .eq('match_id', match.id)
      if (e) throw e
      if (!preds?.length) throw new Error('No predictions for this match.')

      if (isCancelled) {
        setPreview(preds.map(p => ({
          user_id: p.user_id,
          display_name: p.users?.display_name ?? '—',
          winner_pts: 0, call_pts: 0, villain_pts: 0, chaos_pts: 0, h2h_pts: 0, total: 0,
        })))
        return
      }

      let parsedScorecard = []
      if (scorecard.trim()) {
        try { parsedScorecard = JSON.parse(scorecard) }
        catch { throw new Error('Scorecard JSON is invalid.') }
      }

      const allWinnerPicks = preds.map(p => p.match_winner_pick).filter(Boolean)
      const allCallPicks   = preds.map(p => p.the_call_pick).filter(Boolean)
      const matchResult    = { winner, scorecard: parsedScorecard }
      const qResults       = { the_call: callAnswer, chaos_ball: chaosAnswer }
      const allPicks       = { winner: allWinnerPicks, the_call: allCallPicks }

      const totals = {}
      const rows = preds.map(pred => {
        const card = scoreMatchCard(pred, matchResult, qResults, allPicks)
        totals[pred.user_id] = card.total
        return { user_id: pred.user_id, display_name: pred.users?.display_name ?? '—', ...card }
      })

      const h2h = scoreH2HMatch(h2hPairings, totals)
      rows.forEach(r => { r.h2h_pts = h2h[r.user_id] ?? 0; r.total += r.h2h_pts })
      rows.sort((a, b) => b.total - a.total)
      setPreview(rows)
    } catch (e) { setError(e.message) }
    finally { setPreviewing(false) }
  }, [match.id, winner, callAnswer, chaosAnswer, scorecard, h2hPairings, isCancelled])

  // ── Publish ───────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    if (!preview) return
    setError(null); setPublishing(true)
    try {
      const newStatus  = isCancelled ? 'cancelled' : 'completed'
      const matchUpdate = { status: newStatus, result_type: resultType }
      if (!isCancelled) {
        matchUpdate.winner = winner
        matchUpdate.scorecard_json = scorecard.trim() ? JSON.parse(scorecard) : null
      }
      const { error: mErr } = await supabase.from('matches').update(matchUpdate).eq('id', match.id)
      if (mErr) throw mErr

      if (!isCancelled) {
        const updates = []
        if (callQ  && callAnswer)  updates.push(supabase.from('match_questions').update({ correct_answer: callAnswer  }).eq('id', callQ.id))
        if (chaosQ && chaosAnswer) updates.push(supabase.from('match_questions').update({ correct_answer: chaosAnswer }).eq('id', chaosQ.id))
        await Promise.all(updates)
      }

      const { error: sErr } = await supabase.from('match_scores').upsert(
        preview.map(r => ({
          user_id: r.user_id, match_id: match.id,
          winner_pts: r.winner_pts ?? 0, call_pts: r.call_pts ?? 0,
          villain_pts: r.villain_pts ?? 0, chaos_pts: r.chaos_pts ?? 0,
          h2h_pts: r.h2h_pts ?? 0, total: r.total ?? 0,
        })),
        { onConflict: 'user_id,match_id' }
      )
      if (sErr) throw sErr

      setPublished(true)
      onPublished({ id: match.id, winner: isCancelled ? null : winner, status: newStatus, result_type: resultType })
    } catch (e) { setError(e.message) }
    finally { setPublishing(false) }
  }, [match.id, winner, resultType, isCancelled, callAnswer, chaosAnswer, scorecard, callQ, chaosQ, preview, onPublished])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Match header */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <p className="font-mono text-xs tracking-wide uppercase" style={{ color: 'var(--text-muted)', margin: 0 }}>
            M{match.match_number} · {new Date(match.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}
          </p>
          {(alreadyDone || published) && (
            <StatusBadge
              label={match.status === 'cancelled' || (published && isCancelled) ? 'Cancelled' : 'Published'}
              color={match.status === 'cancelled' || (published && isCancelled) ? 'red' : 'green'}
            />
          )}
        </div>
        <p className="font-display font-black" style={{ fontSize: '22px', color: 'var(--text-primary)', letterSpacing: '-0.5px', margin: 0 }}>
          {teamA?.shortName ?? match.team_a} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '16px' }}>vs</span> {teamB?.shortName ?? match.team_b}
        </p>
      </Card>

      {/* Winner */}
      <Card>
        <SectionLabel>Match Winner</SectionLabel>
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          {[match.team_a, match.team_b].map(tid => {
            const t = getTeam(tid); const active = winner === tid
            return (
              <button key={tid} onClick={() => setWinner(tid)} style={{
                flex: 1, padding: '12px', borderRadius: '12px',
                border: `2px solid ${active ? (t?.colors?.primary ?? 'var(--text-primary)') : 'var(--border-subtle)'}`,
                background: active ? (t?.colors?.primary ?? 'var(--text-primary)') + '22' : 'var(--surface-subtle)',
                color: active ? (t?.colors?.primary ?? 'var(--text-primary)') : 'var(--text-secondary)',
                fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '18px', cursor: 'pointer',
              }}>
                {t?.shortName ?? tid.toUpperCase()}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Result type */}
      <Card>
        <SectionLabel>Result Type</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
          {[
            { value: 'normal',    label: 'Normal' },
            { value: 'super_over', label: 'Super Over' },
            { value: 'dls',       label: 'DLS' },
            { value: 'no_result', label: 'No Result / Cancelled' },
          ].map(opt => {
            const active = resultType === opt.value
            const red    = opt.value === 'no_result'
            return (
              <button key={opt.value} onClick={() => setResultType(opt.value)} style={{
                padding: '7px 14px', borderRadius: '8px', cursor: 'pointer',
                border: `1.5px solid ${active ? (red ? '#dc2626' : 'var(--text-primary)') : 'var(--border-subtle)'}`,
                background: active ? (red ? 'rgba(220,38,38,0.10)' : 'var(--text-primary)') : 'var(--surface-subtle)',
                color: active ? (red ? '#dc2626' : 'var(--card)') : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: active ? 700 : 400,
              }}>{opt.label}</button>
            )
          })}
        </div>
        {isCancelled && <p className="font-mono text-xs mt-2" style={{ color: '#dc2626' }}>All scores → 0. Match status → cancelled.</p>}
      </Card>

      {/* The Call */}
      {callQ && !isCancelled && (
        <Card>
          <SectionLabel>The Call</SectionLabel>
          <p className="font-body text-sm mt-1 mb-3" style={{ color: 'var(--text-secondary)' }}>{callQ.display_text}</p>
          <AnswerButtons options={callQ.answer_options} value={callAnswer} onChange={setCallAnswer} />
        </Card>
      )}

      {/* Chaos Ball */}
      {chaosQ && !isCancelled && (
        <Card>
          <SectionLabel>Chaos Ball</SectionLabel>
          <p className="font-body text-sm mt-1 mb-3" style={{ color: 'var(--text-secondary)' }}>{chaosQ.display_text}</p>
          <AnswerButtons options={chaosQ.answer_options} value={chaosAnswer} onChange={setChaosAnswer} />
        </Card>
      )}

      {/* Scorecard JSON */}
      {!isCancelled && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <SectionLabel style={{ margin: 0 }}>Scorecard</SectionLabel>
            {match.api_match_id && (
              <button
                onClick={handleFetchScorecard}
                disabled={fetching}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '5px 12px', borderRadius: '8px',
                  border: '1.5px solid var(--border-default)',
                  background: 'var(--surface-subtle)',
                  color: fetching ? 'var(--text-muted)' : 'var(--text-primary)',
                  fontFamily: 'Bricolage Grotesque, sans-serif',
                  fontWeight: 700, fontSize: '12px', cursor: fetching ? 'wait' : 'pointer',
                }}
              >
                {fetching ? '⏳ Fetching…' : '🔄 Fetch from API'}
              </button>
            )}
          </div>
          <p className="font-body text-xs mb-2" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Per-player data for Villain scoring + Fantasy XI. Auto-fetch pulls directly from CricAPI after the match ends.
            Manual fields: <code style={{ background: 'var(--surface-subtle)', padding: '1px 4px', borderRadius: '4px' }}>
              name, runs, balls_faced, fours, sixes, wickets, lbw_bowled, overs_bowled, runs_conceded, maiden_overs, catches, stumpings, run_out, did_not_play
            </code>
          </p>
          <textarea
            value={scorecard}
            onChange={e => setScorecard(e.target.value)}
            placeholder={'[\n  {"name":"Virat Kohli","runs":67,"balls_faced":42,"fours":7,"sixes":2,"catches":1},\n  {"name":"Jasprit Bumrah","wickets":3,"lbw_bowled":1,"overs_bowled":4,"runs_conceded":22,"maiden_overs":1}\n]'}
            rows={8}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: '10px',
              border: '1.5px solid var(--border-subtle)', background: 'var(--surface-subtle)',
              color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '12px',
              resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.5,
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

      {/* Match score preview */}
      {preview && <MatchScorePreview rows={preview} />}

      {/* Match scoring actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={handlePreview} disabled={previewing || (!winner && !isCancelled)} style={btnStyle('secondary', previewing || (!winner && !isCancelled))}>
          {previewing ? 'Computing…' : 'Preview Scores'}
        </button>
        <button onClick={handlePublish} disabled={publishing || !preview || published} style={btnStyle('primary', publishing || !preview || published)}>
          {publishing ? 'Publishing…' : published ? 'Published ✓' : alreadyDone ? 'Re-publish' : 'Publish'}
        </button>
      </div>

      {/* ── Fantasy XI Scoring ─────────────────────────────────── */}
      {!isCancelled && (
        <FantasyXISection matchId={match.id} scorecardRaw={scorecard} />
      )}
    </div>
  )
}

// ─── Fantasy XI Section ───────────────────────────────────────────────────────

function FantasyXISection({ matchId, scorecardRaw }) {
  const [xiPreview,    setXiPreview]    = useState(null) // [{ user_id, display_name, total, breakdown }]
  const [xiPreviewing, setXiPreviewing] = useState(false)
  const [xiPublishing, setXiPublishing] = useState(false)
  const [xiPublished,  setXiPublished]  = useState(false)
  const [xiError,      setXiError]      = useState(null)

  const handleXiPreview = async () => {
    setXiError(null); setXiPreviewing(true); setXiPreview(null)
    try {
      if (!scorecardRaw.trim()) throw new Error('Enter a scorecard above before computing Fantasy XI scores.')
      let parsed
      try { parsed = JSON.parse(scorecardRaw) }
      catch { throw new Error('Scorecard JSON is invalid.') }

      // Fetch all locked fantasy picks + user display names
      const { data: picks, error: e } = await supabase
        .from('fantasy_xi_picks')
        .select('user_id, players, captain, vice_captain, users(display_name)')
        .eq('locked', true)
      if (e) throw e
      if (!picks?.length) throw new Error('No locked Fantasy XIs found.')

      const scores = computeAllFantasyXIScores(picks, parsed)

      // Merge in display names
      const nameMap = {}
      for (const p of picks) nameMap[p.user_id] = p.users?.display_name ?? '—'

      setXiPreview(scores.map(s => ({ ...s, display_name: nameMap[s.user_id] ?? '—' })))
    } catch (e) { setXiError(e.message) }
    finally { setXiPreviewing(false) }
  }

  const handleXiPublish = async () => {
    if (!xiPreview?.length) return
    setXiError(null); setXiPublishing(true)
    try {
      const rows = xiPreview.map(s => ({
        user_id:   s.user_id,
        match_id:  matchId,
        breakdown: s.breakdown,
        total_pts: s.total,
      }))
      const { error: e } = await supabase
        .from('fantasy_xi_scores')
        .upsert(rows, { onConflict: 'user_id,match_id' })
      if (e) throw e
      setXiPublished(true)
    } catch (e) { setXiError(e.message) }
    finally { setXiPublishing(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        <p className="font-mono text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)', margin: 0 }}>Fantasy XI</p>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
      </div>

      <Card>
        <SectionLabel>Fantasy XI Scores — This Match</SectionLabel>
        <p className="font-body text-xs mt-1" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Reads the scorecard above and computes each user's XI points (with Captain 2× / VC 1.5× applied).
          Only locked XIs are included.
        </p>
      </Card>

      {/* Fantasy XI error */}
      {xiError && (
        <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#fff0f0', border: '1.5px solid rgba(200,0,0,0.15)' }}>
          <p className="font-mono text-xs" style={{ color: '#cc0000' }}>{xiError}</p>
        </div>
      )}

      {/* Fantasy XI preview table */}
      {xiPreview && <FantasyXIPreview rows={xiPreview} />}

      {/* Fantasy XI actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={handleXiPreview} disabled={xiPreviewing} style={btnStyle('secondary', xiPreviewing)}>
          {xiPreviewing ? 'Computing…' : 'Preview XI Scores'}
        </button>
        <button onClick={handleXiPublish} disabled={xiPublishing || !xiPreview || xiPublished} style={btnStyle('primary', xiPublishing || !xiPreview || xiPublished)}>
          {xiPublishing ? 'Publishing…' : xiPublished ? 'Published ✓' : 'Publish XI Scores'}
        </button>
      </div>
    </div>
  )
}

// ─── Match Score Preview ──────────────────────────────────────────────────────

function MatchScorePreview({ rows }) {
  return (
    <Card>
      <SectionLabel>Match Score Preview</SectionLabel>
      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {rows.map((row, i) => (
          <div key={row.user_id} style={{
            display: 'grid', gridTemplateColumns: '22px 1fr repeat(5, 34px)',
            alignItems: 'center', gap: '4px',
            padding: '8px 10px', borderRadius: '10px',
            background: i === 0 ? 'var(--team-tinted-bg)' : 'var(--surface-subtle)',
            border: `1px solid ${i === 0 ? 'var(--team-primary)' : 'var(--border-subtle)'}`,
          }}>
            <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
            <span className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.display_name}
            </span>
            <PtCell label="W"  pts={row.winner_pts} />
            <PtCell label="C"  pts={row.call_pts} />
            <PtCell label="V"  pts={row.villain_pts} />
            <PtCell label="CB" pts={row.chaos_pts} />
            <span className="font-display font-black text-sm" style={{ color: 'var(--text-primary)', textAlign: 'right' }}>
              {row.total >= 0 ? '+' : ''}{row.total}
            </span>
          </div>
        ))}
        <p className="font-mono text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          W = Winner · C = The Call · V = Villain · CB = Chaos Ball (H2H included in total)
        </p>
      </div>
    </Card>
  )
}

// ─── Fantasy XI Preview ───────────────────────────────────────────────────────

function FantasyXIPreview({ rows }) {
  const [expanded, setExpanded] = useState(null)

  return (
    <Card>
      <SectionLabel>Fantasy XI Preview</SectionLabel>
      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {rows.map((row, i) => (
          <div key={row.user_id}>
            <button
              onClick={() => setExpanded(expanded === row.user_id ? null : row.user_id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                background: i === 0 ? 'var(--team-tinted-bg)' : 'var(--surface-subtle)',
                border: `1px solid ${i === 0 ? 'var(--team-primary)' : 'var(--border-subtle)'}`,
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="font-mono text-xs" style={{ color: 'var(--text-muted)', width: '16px' }}>{i + 1}</span>
                <span className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{row.display_name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="font-display font-black" style={{ fontSize: '18px', color: row.total > 0 ? '#16a34a' : 'var(--text-muted)', letterSpacing: '-0.5px' }}>
                  {row.total > 0 ? '+' : ''}{row.total} pts
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{expanded === row.user_id ? '▲' : '▼'}</span>
              </div>
            </button>

            {/* Expanded: per-player breakdown */}
            {expanded === row.user_id && (
              <div style={{ padding: '8px 4px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {Object.entries(row.breakdown).map(([name, data]) => (
                  <div key={name} style={{
                    display: 'grid', gridTemplateColumns: '1fr repeat(4, auto)',
                    alignItems: 'center', gap: '8px',
                    padding: '6px 10px', borderRadius: '8px',
                    background: 'var(--card)',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    <span className="font-body text-xs" style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {name}
                      {data.multiplier > 1 && (
                        <span style={{ marginLeft: '5px', fontSize: '9px', color: data.multiplier === 2 ? '#b45309' : '#6b7280', fontWeight: 700 }}>
                          {data.multiplier === 2 ? '©' : 'vc'}
                        </span>
                      )}
                    </span>
                    <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>bat {data.batting ?? 0}</span>
                    <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>bowl {data.bowling ?? 0}</span>
                    <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>fld {data.fielding ?? 0}</span>
                    <span className="font-display font-bold" style={{ fontSize: '13px', color: data.pts > 0 ? '#16a34a' : data.pts < 0 ? '#dc2626' : 'var(--text-muted)', minWidth: '36px', textAlign: 'right' }}>
                      {data.pts > 0 ? '+' : ''}{data.pts}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Shared UI ─────────────────────────────────────────────────────────────────

function AnswerButtons({ options, value, onChange }) {
  const opts = Array.isArray(options) ? options : JSON.parse(options ?? '[]')
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {opts.map(opt => {
        const active = value === opt
        return (
          <button key={opt} onClick={() => onChange(opt)} style={{
            padding: '7px 14px', borderRadius: '8px', cursor: 'pointer',
            border: `1.5px solid ${active ? 'var(--text-primary)' : 'var(--border-subtle)'}`,
            background: active ? 'var(--text-primary)' : 'var(--surface-subtle)',
            color: active ? 'var(--card)' : 'var(--text-secondary)',
            fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: active ? 700 : 400,
          }}>{opt}</button>
        )
      })}
    </div>
  )
}

function Card({ children }) {
  return (
    <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--card)', border: '1.5px solid var(--border-subtle)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
      {children}
    </div>
  )
}

function SectionLabel({ children }) {
  return <p className="font-mono text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)', margin: 0 }}>{children}</p>
}

function StatusBadge({ label, color }) {
  const c = color === 'red'
    ? { bg: 'rgba(220,38,38,0.10)', border: 'rgba(220,38,38,0.25)', text: '#dc2626' }
    : { bg: 'rgba(22,163,74,0.10)', border: 'rgba(22,163,74,0.25)', text: '#16a34a' }
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '99px', background: c.bg, border: `1px solid ${c.border}`, color: c.text, fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
      {label}
    </span>
  )
}

function PtCell({ label, pts }) {
  const color = pts > 0 ? '#16a34a' : pts < 0 ? '#dc2626' : 'var(--text-muted)'
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
      <div className="font-mono font-bold" style={{ fontSize: '11px', color }}>{pts >= 0 ? '+' : ''}{pts}</div>
    </div>
  )
}

function Spinner() {
  return <div style={{ padding: '40px', textAlign: 'center' }}><p className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>Loading…</p></div>
}

function btnStyle(variant, disabled) {
  const base = { flex: 1, padding: '13px', borderRadius: '12px', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '14px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1, border: 'none' }
  if (variant === 'primary') return { ...base, background: 'var(--text-primary)', color: 'var(--card)' }
  return { ...base, background: 'var(--surface-subtle)', color: 'var(--text-primary)', border: '1.5px solid var(--border-subtle)' }
}
