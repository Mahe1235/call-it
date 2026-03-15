import { useState, useRef, useEffect } from 'react'
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

/* ─── Peek carousel ───────────────────────────────────────────────────────── */

function MatchCarousel({ matches, currentIndex, onChange }) {
  const scrollRef = useRef(null)
  const slideRefs = useRef([])
  const [containerHeight, setContainerHeight] = useState(null)
  const isProgrammatic = useRef(false)
  const scrollEndTimer = useRef(null)

  // Animate container height to match active slide (incl. when form expands)
  useEffect(() => {
    const el = slideRefs.current[currentIndex]
    if (!el) return
    setContainerHeight(el.offsetHeight)
    const ro = new ResizeObserver(() => setContainerHeight(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [currentIndex, matches])

  // Programmatically scroll to active card when index changes via dots
  useEffect(() => {
    const container = scrollRef.current
    const slide = slideRefs.current[currentIndex]
    if (!container || !slide) return
    isProgrammatic.current = true
    const cw = container.offsetWidth
    const sw = slide.offsetWidth
    container.scrollTo({ left: slide.offsetLeft - (cw - sw) / 2, behavior: 'smooth' })
    // Release lock after scroll settles
    clearTimeout(scrollEndTimer.current)
    scrollEndTimer.current = setTimeout(() => { isProgrammatic.current = false }, 600)
  }, [currentIndex])

  // Sync dots while user manually scrolls
  function onScroll() {
    if (isProgrammatic.current) return
    clearTimeout(scrollEndTimer.current)
    scrollEndTimer.current = setTimeout(() => {
      const container = scrollRef.current
      if (!container) return
      const center = container.scrollLeft + container.offsetWidth / 2
      let closest = 0, minDist = Infinity
      slideRefs.current.forEach((el, i) => {
        if (!el) return
        const dist = Math.abs(el.offsetLeft + el.offsetWidth / 2 - center)
        if (dist < minDist) { minDist = dist; closest = i }
      })
      if (closest !== currentIndex) onChange(closest)
    }, 80)
  }

  return (
    <div>
      {/* Scroll container — bleeds 16px into page padding on each side for peek */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        style={{
          margin: '0 -16px',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          paddingInline: '16px',   // restores page edge; peek comes from narrower cards
          height: containerHeight ? `${containerHeight}px` : 'auto',
          transition: 'height 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {matches.map((item, i) => (
          <div
            key={item.match.id}
            ref={el => slideRefs.current[i] = el}
            style={{
              scrollSnapAlign: 'center',
              flexShrink: 0,
              // Cards are narrower than viewport so adjacent cards peek in
              width: 'calc(100vw - 80px)',
            }}
          >
            {item.match.status === 'completed'
              ? <CompletedMatchCard match={item.match} />
              : <UpcomingMatchCard match={item.match} questions={item.questions} />
            }
          </div>
        ))}
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
                background: isActive ? 'var(--text-primary)' : isCompleted ? 'var(--border-default)' : 'var(--border-subtle)',
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
  const [formOpen, setFormOpen] = useState(false)

  const teamA = getTeam(match.team_a)
  const teamB = getTeam(match.team_b)

  const matchStarted = match.status !== 'upcoming' || Date.now() >= new Date(match.date).getTime()
  // Show prediction form when: user explicitly opened it, OR prediction already exists
  const showForm = formOpen || !!prediction

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

        <div style={{ margin: '16px 0 0', height: '1px', background: 'var(--border-subtle)' }} />

        {/* Countdown — always visible */}
        <div className="flex flex-col items-center" style={{ paddingTop: '14px', paddingBottom: '4px' }}>
          <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>
            {match.status === 'live' ? 'Match in progress' : 'Card closes in'}
          </p>
          <Countdown targetDate={match.date} status={match.status} />
        </div>

        {/* Bottom area: compact CTA or full prediction form */}
        {predLoading ? (
          <CompactSkeleton />
        ) : showForm ? (
          <MatchCard
            match={match}
            questions={questions}
            prediction={prediction}
            onLocked={(p) => { setPrediction(p); setFormOpen(false) }}
          />
        ) : matchStarted ? (
          // Match started, no picks — missed state handled inside MatchCard
          <MatchCard match={match} questions={questions} prediction={null} />
        ) : (
          // Compact default — tap to expand form
          <button
            onClick={() => setFormOpen(true)}
            style={{
              marginTop: '14px',
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background: 'var(--text-primary)',
              color: 'var(--card)',
              fontSize: '15px',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              cursor: 'pointer',
              letterSpacing: '-0.3px',
              transition: 'opacity 0.15s',
            }}
          >
            Call it →
          </button>
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

/* ─── Compact skeleton (while checking for existing pick) ────────────────── */

function CompactSkeleton() {
  return (
    <div style={{ marginTop: '14px' }}>
      <Shimmer style={{ height: '48px', borderRadius: '14px' }} />
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
