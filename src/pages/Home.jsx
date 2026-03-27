import { useState, useRef, useEffect } from 'react'
import { useMatchFeed } from '../hooks/useMatch'
import { useMyPrediction } from '../hooks/usePredictions'
import { useAuth } from '../hooks/useAuth'
import { MatchHeader } from '../components/match/MatchHeader'
import { Countdown } from '../components/match/Countdown'
import { MatchCard } from '../components/match/MatchCard'
import { PostMatchReveal } from '../components/match/PostMatchReveal'
import { LeaderboardSnapshot } from '../components/league/LeaderboardSnapshot'
import { getBanter, getTeam } from '../lib/content'

function hexToRgba(hex = '#000000', alpha = 0.07) {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// Match-level predictions are disabled for this season.
// Flip to true when per-match picks go live.
const MATCH_PICKS_ENABLED = false

export default function Home() {
  const { profile } = useAuth()
  const { matches, activeIndex, loading, error } = useMatchFeed()
  const [index, setIndex] = useState(null)

  const currentIndex = index !== null ? index : activeIndex
  const currentItem = matches[currentIndex] ?? null

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

      {/* Match info carousel — schedule view */}
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

      {/* Picks card — hidden until match picks go live next season */}
      {MATCH_PICKS_ENABLED && !loading && !error && currentItem && (
        <PicksCard
          key={currentItem.match.id}
          match={currentItem.match}
          questions={currentItem.questions}
        />
      )}

      {/* Leaderboard snapshot */}
      <LeaderboardSnapshot />
    </div>
  )
}

/* ─── Peek carousel (match info only — no picks) ─────────────────────────── */

function MatchCarousel({ matches, currentIndex, onChange }) {
  const scrollRef = useRef(null)
  const slideRefs = useRef([])
  const isProgrammatic = useRef(false)
  const scrollEndTimer = useRef(null)

  // Programmatically scroll to active card when index changes via dots
  useEffect(() => {
    const container = scrollRef.current
    const slide = slideRefs.current[currentIndex]
    if (!container || !slide) return
    isProgrammatic.current = true
    const cw = container.offsetWidth
    const sw = slide.offsetWidth
    container.scrollTo({ left: slide.offsetLeft - (cw - sw) / 2, behavior: 'smooth' })
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
      {/* Scroll container — bleeds into page padding for peek effect */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        style={{
          margin: '0 -16px',
          overflowX: 'auto',
          overflowY: 'visible',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          display: 'flex',
          alignItems: 'stretch',
          gap: '10px',
          paddingInline: '16px',
        }}
      >
        {matches.map((item, i) => (
          <div
            key={item.match.id}
            ref={el => slideRefs.current[i] = el}
            style={{
              scrollSnapAlign: 'center',
              flexShrink: 0,
              width: 'calc(100vw - 80px)',
            }}
          >
            <MatchInfoCard
              match={item.match}
              isActive={i === currentIndex}
              onClick={() => onChange(i)}
            />
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '12px', marginBottom: '16px' }}>
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

/* ─── Match info card (carousel slide — no picks, always same height) ─────── */

function MatchInfoCard({ match, isActive, onClick }) {
  const teamA = getTeam(match.team_a)
  const teamB = getTeam(match.team_b)
  const tintA = hexToRgba(teamA?.colors?.primary, 0.25)
  const tintB = hexToRgba(teamB?.colors?.primary, 0.25)
  const isCompleted = match.status === 'completed'
  const winnerTeam = isCompleted && match.winner ? getTeam(match.winner) : null

  return (
    <div
      onClick={!isActive ? onClick : undefined}
      style={{
        borderRadius: '20px',
        padding: '18px',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(140deg, ${tintA} 0%, var(--card) 40%, var(--card) 60%, ${tintB} 100%)`,
        border: `1.5px solid ${isActive ? 'var(--border-default)' : 'var(--border-subtle)'}`,
        boxShadow: isActive ? '0 4px 20px rgba(0,0,0,0.10)' : '0 1px 8px rgba(0,0,0,0.04)',
        opacity: isActive ? 1 : 0.65,
        transition: 'opacity 0.25s, box-shadow 0.25s',
        cursor: isActive ? 'default' : 'pointer',
      }}
    >
      {/* Logo watermarks */}
      {teamA?.logoUrl && (
        <img src={teamA.logoUrl} alt="" aria-hidden="true" style={{
          position: 'absolute', top: '-50px', left: '-50px',
          width: '200px', height: '200px', opacity: isActive ? 0.28 : 0.12,
          transform: 'rotate(-10deg)', pointerEvents: 'none', userSelect: 'none',
          transition: 'opacity 0.25s',
        }} />
      )}
      {teamB?.logoUrl && (
        <img src={teamB.logoUrl} alt="" aria-hidden="true" style={{
          position: 'absolute', bottom: '-50px', right: '-50px',
          width: '200px', height: '200px', opacity: isActive ? 0.28 : 0.12,
          transform: 'rotate(10deg)', pointerEvents: 'none', userSelect: 'none',
          transition: 'opacity 0.25s',
        }} />
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Status badge — only for completed */}
        {isCompleted && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
            <span style={{
              fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-mono)',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '4px 10px', borderRadius: '99px',
              background: 'var(--text-primary)', color: 'var(--card)',
            }}>Done</span>
          </div>
        )}

        <MatchHeader match={match} />

        {/* Countdown for upcoming/live */}
        {!isCompleted && (
          <div style={{ marginTop: '14px', textAlign: 'center' }}>
            <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>
              {match.status === 'live' ? 'In progress' : 'Card closes in'}
            </p>
            <Countdown targetDate={match.date} status={match.status} />
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Picks card (below carousel, swaps when active match changes) ────────── */

function PicksCard({ match, questions }) {
  const { prediction, setPrediction, loading } = useMyPrediction(match.id)
  const isCompleted = match.status === 'completed'

  if (isCompleted) return <PostMatchReveal match={match} questions={questions} />

  return (
    <div style={{
      borderRadius: '20px',
      padding: '20px',
      background: 'var(--card)',
      border: '1.5px solid var(--border-subtle)',
      boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
      marginBottom: '16px',
    }}>
      <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--text-muted)' }}>
        Your picks
      </p>

      {loading ? (
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
    <div>
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
