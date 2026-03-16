import { useMatchReveal } from '../../hooks/useMatchReveal'
import { getBanter, getTeam } from '../../lib/content'

/**
 * Post-match reveal panel — shown on Home when a completed match is selected.
 * Receives the match object and its questions (with correct_answer set).
 */
export function PostMatchReveal({ match, questions }) {
  const { myPrediction, myScore, groupPredictions, scorecard, loading } = useMatchReveal(match.id)

  const winnerTeam = match.winner ? getTeam(match.winner) : null
  const callQ  = questions.find(q => q.type === 'the_call')
  const chaosQ = questions.find(q => q.type === 'chaos_ball')

  if (loading) return <RevealSkeleton />

  // No score yet — match completed but admin hasn't scored it
  if (!myScore) {
    return (
      <div style={cardStyle}>
        <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Last match</p>
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <p style={{ fontSize: '28px', marginBottom: '8px' }}>⏳</p>
          <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)', margin: 0 }}>Scores coming soon</p>
          <p className="font-body text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Admin is calculating results.</p>
        </div>
      </div>
    )
  }

  // No prediction submitted — missed
  if (!myPrediction) {
    return (
      <div style={cardStyle}>
        <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Last match</p>
        <MatchResultBanner match={match} winnerTeam={winnerTeam} />
        <div style={{ marginTop: '12px', textAlign: 'center', padding: '12px 0' }}>
          <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>No picks submitted</p>
          <p className="font-body text-xs mt-1" style={{ color: 'var(--text-muted)' }}>You missed this one.</p>
        </div>
        <GroupSplit match={match} groupPredictions={groupPredictions} />
      </div>
    )
  }

  const totalPositive = myScore.total > 0

  return (
    <div style={cardStyle}>
      <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
        {getBanter('reveal.header')}
      </p>

      {/* Winner banner */}
      <MatchResultBanner match={match} winnerTeam={winnerTeam} />

      {/* Total pts */}
      <div style={{
        margin: '14px 0',
        padding: '14px',
        borderRadius: '14px',
        background: totalPositive ? 'rgba(22,163,74,0.08)' : myScore.total < 0 ? 'rgba(220,38,38,0.08)' : 'var(--surface-subtle)',
        border: `1px solid ${totalPositive ? 'rgba(22,163,74,0.20)' : myScore.total < 0 ? 'rgba(220,38,38,0.20)' : 'var(--border-subtle)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Your total</span>
        <span className="font-display font-black" style={{
          fontSize: '22px',
          color: totalPositive ? '#16a34a' : myScore.total < 0 ? '#dc2626' : 'var(--text-muted)',
          letterSpacing: '-0.5px',
        }}>
          {myScore.total > 0 ? '+' : ''}{myScore.total} pts
        </span>
      </div>

      {/* Pick breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
        {/* Match winner */}
        <PickRow
          label="Winner"
          pick={myPrediction.match_winner_pick ? (getTeam(myPrediction.match_winner_pick)?.shortName ?? myPrediction.match_winner_pick.toUpperCase()) : '—'}
          correct={myPrediction.match_winner_pick === match.winner}
          pts={myScore.winner_pts}
          skipped={!myPrediction.match_winner_pick}
        />

        {/* The Call */}
        {callQ && (
          <PickRow
            label="The Call"
            pick={myPrediction.the_call_pick ?? '—'}
            correct={myPrediction.the_call_pick === callQ.correct_answer}
            pts={myScore.call_pts}
            skipped={!myPrediction.the_call_pick}
            sublabel={callQ.correct_answer ? `Answer: ${callQ.correct_answer}` : null}
          />
        )}

        {/* Villain */}
        <VillainRow
          playerName={myPrediction.villain_pick_player}
          pts={myScore.villain_pts}
          scorecard={scorecard}
        />

        {/* Chaos Ball */}
        {chaosQ && (
          <PickRow
            label="Chaos Ball"
            pick={myPrediction.chaos_ball_pick ?? '—'}
            correct={myPrediction.chaos_ball_pick === chaosQ.correct_answer}
            pts={myScore.chaos_pts}
            skipped={!myPrediction.chaos_ball_pick}
            sublabel={chaosQ.correct_answer ? `Answer: ${chaosQ.correct_answer}` : null}
          />
        )}
      </div>

      {/* Group split */}
      <GroupSplit match={match} groupPredictions={groupPredictions} />
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MatchResultBanner({ match, winnerTeam }) {
  if (!winnerTeam) return null
  const teamA = getTeam(match.team_a)
  const teamB = getTeam(match.team_b)
  return (
    <div style={{
      padding: '10px 14px', borderRadius: '12px',
      background: `rgba(${hexToRgbParts(winnerTeam.colors.primary)},0.10)`,
      border: `1px solid rgba(${hexToRgbParts(winnerTeam.colors.primary)},0.22)`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
        {teamA?.shortName} vs {teamB?.shortName}
      </span>
      <span className="font-display font-black text-sm" style={{ color: 'var(--text-primary)' }}>
        🏆 {winnerTeam.shortName} won
      </span>
    </div>
  )
}

function PickRow({ label, pick, correct, pts, skipped, sublabel }) {
  const ptsColor = pts > 0 ? '#16a34a' : pts < 0 ? '#dc2626' : 'var(--text-muted)'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 12px', borderRadius: '12px',
      background: 'var(--surface-subtle)', border: '1px solid var(--border-subtle)',
    }}>
      {/* Result icon */}
      <span style={{ fontSize: '14px', flexShrink: 0, width: '18px', textAlign: 'center' }}>
        {skipped ? '–' : correct ? '✓' : '✗'}
      </span>

      {/* Label + pick */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="font-mono text-xs" style={{ color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pick}</p>
        {sublabel && !skipped && (
          <p className="font-body text-xs" style={{ color: 'var(--text-muted)', margin: '1px 0 0' }}>{sublabel}</p>
        )}
      </div>

      {/* Pts */}
      <span className="font-mono font-bold text-sm" style={{ color: ptsColor, flexShrink: 0 }}>
        {skipped ? '—' : pts > 0 ? `+${pts}` : pts}
      </span>
    </div>
  )
}

function VillainRow({ playerName, pts, scorecard }) {
  if (!playerName) {
    return (
      <PickRow label="Villain" pick="—" correct={false} pts={0} skipped={true} />
    )
  }

  const player = scorecard?.find(p => p.name?.toLowerCase() === playerName.toLowerCase())
  let outcome = null
  if (player && !player.didNotPlay) {
    const runs = player.runs ?? 0
    const wkts = player.wickets ?? 0
    if (pts === 15) outcome = `${runs} runs · ${wkts} wkts — flopped`
    else if (pts === -5) outcome = `${runs} runs · ${wkts} wkts — had impact`
    else outcome = `${runs} runs · ${wkts} wkts — neutral`
  } else if (player?.didNotPlay) {
    outcome = 'Did not play'
  }

  const ptsColor = pts > 0 ? '#16a34a' : pts < 0 ? '#dc2626' : 'var(--text-muted)'

  return (
    <div style={{
      padding: '10px 12px', borderRadius: '12px',
      background: 'var(--surface-subtle)',
      border: '1px solid var(--border-subtle)',
      display: 'flex', alignItems: 'center', gap: '10px',
    }}>
      <span style={{ fontSize: '14px', flexShrink: 0, width: '18px', textAlign: 'center' }}>
        {pts === 15 ? '✓' : pts === -5 ? '✗' : '·'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="font-mono text-xs" style={{ color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Villain</p>
        <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{playerName}</p>
        {outcome && <p className="font-body text-xs" style={{ color: 'var(--text-muted)', margin: '1px 0 0' }}>{outcome}</p>}
      </div>
      <span className="font-mono font-bold text-sm" style={{ color: ptsColor, flexShrink: 0 }}>
        {pts > 0 ? `+${pts}` : pts === 0 ? '0' : pts}
      </span>
    </div>
  )
}

function GroupSplit({ match, groupPredictions }) {
  if (!groupPredictions.length || !match.winner) return null

  const total = groupPredictions.length
  const correct = groupPredictions.filter(p => p.match_winner_pick === match.winner).length
  const winnerTeam = getTeam(match.winner)

  const banter = getBanter('reveal.groupSplit', {
    COUNT: correct,
    TOTAL: total,
    WINNER_COUNT: correct,
    LOSER_COUNT: total - correct,
    TEAM: winnerTeam?.shortName ?? match.winner,
  })

  return (
    <div style={{
      marginTop: '12px', padding: '10px 14px', borderRadius: '12px',
      background: 'var(--surface-subtle)', border: '1px solid var(--border-subtle)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
    }}>
      <p className="font-body text-xs" style={{ color: 'var(--text-secondary)', margin: 0 }}>{banter}</p>
      <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
        {groupPredictions.map((p, i) => (
          <div key={i} style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: p.match_winner_pick === match.winner ? '#16a34a' : 'var(--border-default)',
          }} />
        ))}
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function RevealSkeleton() {
  return (
    <div style={cardStyle}>
      <div style={{ height: '10px', width: '100px', borderRadius: '6px', background: 'var(--surface-subtle)', marginBottom: '16px' }} />
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ height: '52px', borderRadius: '12px', background: 'var(--surface-subtle)', marginBottom: '8px' }} />
      ))}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cardStyle = {
  borderRadius: '20px',
  padding: '20px',
  background: 'var(--card)',
  border: '1.5px solid var(--border-subtle)',
  boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
  marginBottom: '16px',
}

function hexToRgbParts(hex = '#000000') {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `${r},${g},${b}`
}
