import { useState, useRef } from 'react'
import { useMatchFeed } from '../hooks/useMatch'
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
  const { matches, activeIndex, loading, error } = useMatchFeed()
  const [index, setIndex] = useState(null) // null = use activeIndex once loaded

  // Resolve the current carousel index
  const currentIndex = index !== null ? index : activeIndex

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

      {/* Match carousel */}
      {loading ? (
        <MatchSkeleton />
      ) : error ? (
        <ErrorCard message={error} />
      ) : matches.length === 0 ? (
        <EmptyState />
      ) : (
        <MatchCarousel
          matches={matches}
          currentIndex={currentIndex}
          onChange={(i) => setIndex(i)}
        />
      )}

      {/* Leaderboard snapshot */}
      <LeaderboardSnapshot />
    </div>
  )
}

/* ─── Carousel ────────────────────────────────────────────────────────────── */

function MatchCarousel({ matches, currentIndex, onChange }) {
  const touchStartX = useRef(null)

  function prev() { if (currentIndex > 0) onChange(currentIndex - 1) }
  function next() { if (currentIndex < matches.length - 1) onChange(currentIndex + 1) }

  function onTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (dx < -40) next()
    else if (dx > 40) prev()
  }

  return (
    <div style={{ marginBottom: '0' }}>
      {/* Sliding window */}
      <div
        style={{ overflow: 'hidden' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          style={{
            display: 'flex',
            transform: `translateX(calc(-${currentIndex} * 100%))`,
            transition: 'transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            willChange: 'transform',
            alignItems: 'flex-start',
          }}
        >
          {matches.map((item, i) => (
            <div key={item.match.id} style={{ minWidth: '100%' }}>
              {item.match.status === 'completed'
                ? <CompletedMatchCard match={item.match} />
                : <UpcomingMatchCard match={item.match} questions={item.questions} />
              }
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '14px' }}>
        {matches.map((item, i) => {
          const isActive = i === currentIndex
          const isCompleted = item.match.status === 'completed'
          return (
            <button
              key={i}
              onClick={() => onChange(i)}
              aria-label={`Match ${i + 1}`}
              style={{
                width: isActive ? '22px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background: isActive
                  ? 'var(--text-primary)'
                  : isCompleted
                    ? 'var(--border-default)'
                    : 'var(--border-subtle)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                opacity: isActive ? 1 : 0.5,
              }}
            />
          )
        })}
      </div>
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

  const tintA = hexToRgba(teamA?.colors?.primary, 0.25)
  const tintB = hexToRgba(teamB?.colors?.primary, 0.25)

  return (
    <div
      className="card"
      style={{
        borderRadius: '20px',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(140deg, ${tintA} 0%, var(--card) 40%, var(--card) 60%, ${tintB} 100%)`,
        border: '1.5px solid var(--border-subtle)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
      }}
    >
      {/* Logo watermarks */}
      {teamA?.logoUrl && (
        <img src={teamA.logoUrl} alt="" aria-hidden="true" style={{
          position: 'absolute', top: '-50px', left: '-50px',
          width: '220px', height: '220px', opacity: 0.30,
          transform: 'rotate(-10deg)', pointerEvents: 'none', userSelect: 'none',
        }} />
      )}
      {teamB?.logoUrl && (
        <img src={teamB.logoUrl} alt="" aria-hidden="true" style={{
          position: 'absolute', bottom: '-50px', right: '-50px',
          width: '220px', height: '220px', opacity: 0.30,
          transform: 'rotate(10deg)', pointerEvents: 'none', userSelect: 'none',
        }} />
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        <MatchHeader match={match} />

        <div style={{ margin: '20px 0 4px', height: '1px', background: 'var(--border-subtle)' }} />

        {/* Countdown */}
        <div className="flex flex-col items-center" style={{ paddingTop: '16px' }}>
          <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
            {match.status === 'live' ? 'Match in progress' : 'Card closes in'}
          </p>
          <Countdown targetDate={match.date} status={match.status} />
          {match.status !== 'live' && (
            <p className="font-body text-xs text-center mt-3" style={{ color: 'var(--text-muted)', maxWidth: '240px' }}>
              {banterText}
            </p>
          )}
        </div>

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

/* ─── Completed match card ────────────────────────────────────────────────── */

function CompletedMatchCard({ match }) {
  const teamA = getTeam(match.team_a)
  const teamB = getTeam(match.team_b)

  const tintA = hexToRgba(teamA?.colors?.primary, 0.15)
  const tintB = hexToRgba(teamB?.colors?.primary, 0.15)
  const winnerTeam = match.winner ? getTeam(match.winner) : null

  return (
    <div
      style={{
        borderRadius: '20px',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(140deg, ${tintA} 0%, var(--card) 40%, var(--card) 60%, ${tintB} 100%)`,
        border: '1.5px solid var(--border-subtle)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
        opacity: 0.85,
      }}
    >
      {/* Faded logos */}
      {teamA?.logoUrl && (
        <img src={teamA.logoUrl} alt="" aria-hidden="true" style={{
          position: 'absolute', top: '-50px', left: '-50px',
          width: '200px', height: '200px', opacity: 0.18,
          transform: 'rotate(-10deg)', pointerEvents: 'none', userSelect: 'none',
        }} />
      )}
      {teamB?.logoUrl && (
        <img src={teamB.logoUrl} alt="" aria-hidden="true" style={{
          position: 'absolute', bottom: '-50px', right: '-50px',
          width: '200px', height: '200px', opacity: 0.18,
          transform: 'rotate(10deg)', pointerEvents: 'none', userSelect: 'none',
        }} />
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Completed badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <p className="font-mono text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
            Match {match.match_number}
          </p>
          <span style={{
            fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-mono)',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '3px 8px', borderRadius: '99px',
            background: 'var(--surface-subtle)', color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
          }}>
            Completed
          </span>
        </div>

        <MatchHeader match={match} />

        {winnerTeam && (
          <div style={{
            marginTop: '16px',
            padding: '12px 16px',
            borderRadius: '12px',
            background: hexToRgba(winnerTeam.colors.primary, 0.12),
            border: `1.5px solid ${hexToRgba(winnerTeam.colors.primary, 0.25)}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '16px' }}>🏆</span>
            <p className="font-display font-black text-sm" style={{ color: 'var(--text-primary)', margin: 0 }}>
              {winnerTeam.shortName} won
            </p>
          </div>
        )}

        {!winnerTeam && (
          <p className="font-body text-xs text-center" style={{ color: 'var(--text-muted)', marginTop: '16px' }}>
            Result pending
          </p>
        )}
      </div>
    </div>
  )
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */

function EmptyState() {
  const text = getBanter('emptyStates.noMatchesToday')
  return (
    <div style={{
      borderRadius: '20px', padding: '32px 20px',
      background: 'var(--card)', border: '1.5px solid var(--border-subtle)', textAlign: 'center',
    }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏏</div>
      <p className="font-display font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
        No matches right now
      </p>
      <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>{text}</p>
    </div>
  )
}

/* ─── Prediction skeleton ─────────────────────────────────────────────────── */

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
    <div style={{
      borderRadius: '20px', padding: '20px',
      background: 'var(--card)', border: '1.5px solid var(--border-subtle)',
      boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
    }}>
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
    <div style={{
      background: 'linear-gradient(90deg, var(--shimmer-from) 25%, var(--shimmer-mid) 50%, var(--shimmer-from) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s ease-in-out infinite',
      borderRadius: '8px',
      ...style,
    }} />
  )
}

/* ─── Error card ──────────────────────────────────────────────────────────── */

function ErrorCard({ message }) {
  return (
    <div style={{
      borderRadius: '20px', padding: '24px 20px',
      background: '#fff5f5', border: '1.5px solid rgba(200,0,0,0.12)', textAlign: 'center',
    }}>
      <p className="font-body text-sm" style={{ color: '#cc0000' }}>
        Couldn't load match data. Check your connection.
      </p>
      <p className="font-mono text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{message}</p>
    </div>
  )
}
