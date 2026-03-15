import { useCurrentMatch } from '../hooks/useMatch'
import { useMyPrediction } from '../hooks/usePredictions'
import { useAuth } from '../hooks/useAuth'
import { MatchHeader } from '../components/match/MatchHeader'
import { Countdown } from '../components/match/Countdown'
import { MatchCard } from '../components/match/MatchCard'
import { LeaderboardSnapshot } from '../components/league/LeaderboardSnapshot'
import { getBanter, getTeam } from '../lib/content'

/** Convert a 6-digit hex colour to rgba() string */
function hexToRgba(hex = '#000000', alpha = 0.07) {
  const clean = hex.replace('#', '')
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export default function Home() {
  const { profile } = useAuth()
  const { match, questions, loading, error } = useCurrentMatch()

  return (
    <div className="p-4 animate-slide-up">
      {/* Page header */}
      <div className="mb-5">
        <p className="font-mono text-xs tracking-widest uppercase mb-0.5" style={{ color: 'var(--text-muted)' }}>
          IPL 2026
        </p>
        <h1 className="font-display font-black" style={{ fontSize: '28px', color: 'var(--text-primary)', letterSpacing: '-1px', lineHeight: 1.1 }}>
          Hey, {profile?.display_name?.split(' ')[0] ?? 'there'} 👋
        </h1>
      </div>

      {/* Match card area */}
      {loading ? (
        <MatchSkeleton />
      ) : error ? (
        <ErrorCard message={error} />
      ) : match ? (
        <UpcomingMatchCard match={match} questions={questions} />
      ) : (
        <EmptyState />
      )}

      {/* Leaderboard snapshot — always shown */}
      <LeaderboardSnapshot />
    </div>
  )
}

/* ─── Upcoming match card ─────────────────────────────────────────────────── */

function UpcomingMatchCard({ match, questions }) {
  const { prediction, setPrediction, loading: predLoading } = useMyPrediction(match.id)

  const teamA = getTeam(match.team_a)
  const teamB = getTeam(match.team_b)

  const banterText = getBanter('cardStates.countdown', {
    TIME: '...',
    TEAM_A: teamA?.shortName ?? match.team_a.toUpperCase(),
    TEAM_B: teamB?.shortName ?? match.team_b.toUpperCase(),
  })

  const tintA = hexToRgba(teamA?.colors?.primary, 0.08)
  const tintB = hexToRgba(teamB?.colors?.primary, 0.08)

  return (
    <div
      className="card"
      style={{
        borderRadius: '20px',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        // Diagonal gradient: teamA colour bleeds from top-left, teamB from bottom-right
        background: `linear-gradient(135deg, ${tintA} 0%, var(--card) 36%, var(--card) 64%, ${tintB} 100%)`,
        border: '1.5px solid var(--border-subtle)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
      }}
    >
      {/* Team logo watermarks — clipped at edges for depth */}
      {teamA?.logo && (
        <img
          src={teamA.logo} alt=""
          aria-hidden="true"
          style={{
            position: 'absolute', top: '-18px', left: '-18px',
            width: '120px', height: '120px',
            opacity: 0.07, filter: 'grayscale(15%)',
            pointerEvents: 'none', userSelect: 'none',
          }}
        />
      )}
      {teamB?.logo && (
        <img
          src={teamB.logo} alt=""
          aria-hidden="true"
          style={{
            position: 'absolute', bottom: '-18px', right: '-18px',
            width: '120px', height: '120px',
            opacity: 0.07, filter: 'grayscale(15%)',
            pointerEvents: 'none', userSelect: 'none',
          }}
        />
      )}

      {/* All content above the decorative layer */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <MatchHeader match={match} />

        <div
          style={{
            margin: '20px 0 4px',
            height: '1px',
            background: 'var(--border-subtle)',
          }}
        />

        {/* Countdown section */}
        <div className="flex flex-col items-center" style={{ paddingTop: '16px' }}>
          <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
            {match.status === 'live' ? 'Match in progress' : 'Card closes in'}
          </p>

          <Countdown targetDate={match.date} status={match.status} />

          {match.status !== 'live' && (
            <p
              className="font-body text-xs text-center mt-3"
              style={{ color: 'var(--text-muted)', maxWidth: '240px' }}
            >
              {banterText}
            </p>
          )}
        </div>

        {/* Prediction card — skeleton while checking for existing prediction */}
        {predLoading ? (
          <PredictionSkeleton />
        ) : (
          <MatchCard
            match={match}
            questions={questions}
            prediction={prediction}
            onLocked={setPrediction}
          />
        )}
      </div>
    </div>
  )
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */

function EmptyState() {
  const text = getBanter('emptyStates.noMatchesToday')

  return (
    <div
      style={{
        borderRadius: '20px',
        padding: '32px 20px',
        background: 'var(--card)',
        border: '1.5px solid var(--border-subtle)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏏</div>
      <p className="font-display font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
        No matches right now
      </p>
      <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
        {text}
      </p>
    </div>
  )
}

/* ─── Prediction skeleton (while checking for existing pick) ─────────────── */

function PredictionSkeleton() {
  return (
    <div style={{ marginTop: '20px' }}>
      <Shimmer style={{ height: '10px', width: '100px', marginBottom: '10px' }} />
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <Shimmer style={{ height: '44px', flex: 1, borderRadius: '12px' }} />
        <Shimmer style={{ height: '44px', flex: 1, borderRadius: '12px' }} />
      </div>
      <Shimmer style={{ height: '10px', width: '80px', marginBottom: '10px' }} />
      <Shimmer style={{ height: '16px', width: '200px', marginBottom: '12px' }} />
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <Shimmer style={{ height: '44px', flex: 1, borderRadius: '12px' }} />
        <Shimmer style={{ height: '44px', flex: 1, borderRadius: '12px' }} />
      </div>
      <Shimmer style={{ height: '48px', borderRadius: '14px', marginTop: '4px' }} />
    </div>
  )
}

/* ─── Loading skeleton ────────────────────────────────────────────────────── */

function MatchSkeleton() {
  return (
    <div
      style={{
        borderRadius: '20px',
        padding: '20px',
        background: 'var(--card)',
        border: '1.5px solid var(--border-subtle)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
      }}
    >
      <Shimmer style={{ height: '12px', width: '120px', marginBottom: '16px' }} />
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <Shimmer style={{ height: '30px', width: '60px', borderRadius: '99px', marginBottom: '8px' }} />
          <Shimmer style={{ height: '10px', width: '90px' }} />
        </div>
        <Shimmer style={{ height: '16px', width: '20px' }} />
        <div className="flex flex-col items-end">
          <Shimmer style={{ height: '30px', width: '60px', borderRadius: '99px', marginBottom: '8px' }} />
          <Shimmer style={{ height: '10px', width: '90px' }} />
        </div>
      </div>
      <Shimmer style={{ height: '1px', marginBottom: '20px' }} />
      <Shimmer style={{ height: '40px', width: '180px', margin: '0 auto' }} />
    </div>
  )
}

function Shimmer({ style }) {
  return (
    <div
      style={{
        background: 'linear-gradient(90deg, var(--shimmer-from) 25%, var(--shimmer-mid) 50%, var(--shimmer-from) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s ease-in-out infinite',
        borderRadius: '8px',
        ...style,
      }}
    />
  )
}

/* ─── Error card ──────────────────────────────────────────────────────────── */

function ErrorCard({ message }) {
  return (
    <div
      style={{
        borderRadius: '20px',
        padding: '24px 20px',
        background: '#fff5f5',
        border: '1.5px solid rgba(200,0,0,0.12)',
        textAlign: 'center',
      }}
    >
      <p className="font-body text-sm" style={{ color: '#cc0000' }}>
        Couldn't load match data. Check your connection.
      </p>
      <p className="font-mono text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{message}</p>
    </div>
  )
}
