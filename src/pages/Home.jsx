import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSeasonStatus } from '../hooks/useSeasonStatus'
import { useFantasyXI } from '../hooks/useFantasyXI'
import { useSeasonPicks } from '../hooks/useSeasonPicks'
import { LeaderboardSnapshot } from '../components/league/LeaderboardSnapshot'
import { getTeam } from '../lib/content'

// All 10 IPL teams split into two rows for the logo mosaic
const LOGO_ROW1 = ['csk', 'mi', 'rcb', 'kkr', 'srh']
const LOGO_ROW2 = ['dc', 'pbks', 'rr', 'gt', 'lsg']

export default function Home() {
  const { profile, user } = useAuth()
  const { seasonStarted, firstMatchDate, loading: statusLoading } = useSeasonStatus()
  const { picks: fantasyPicks, loading: fantasyLoading } = useFantasyXI(user?.id)
  const { picks: seasonPicks, loading: seasonLoading } = useSeasonPicks()

  const loading = statusLoading || fantasyLoading || seasonLoading

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

      {loading ? (
        <HomeSkeleton />
      ) : seasonStarted ? (
        <SeasonLiveView fantasyPicks={fantasyPicks} seasonPicks={seasonPicks} />
      ) : (
        <PreSeasonView
          firstMatchDate={firstMatchDate}
          fantasyPicks={fantasyPicks}
          seasonPicks={seasonPicks}
        />
      )}
    </div>
  )
}

/* ─── Pre-season view: countdown + shortcut cards ─────────────────────────── */

function PreSeasonView({ firstMatchDate, fantasyPicks, seasonPicks }) {
  return (
    <>
      <TournamentCountdown targetDate={firstMatchDate} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <FantasyXIShortcut picks={fantasyPicks} />
        <SeasonPicksShortcut picks={seasonPicks} />
      </div>
    </>
  )
}

/* ─── Post-season view ────────────────────────────────────────────────────── */

function SeasonLiveView({ fantasyPicks, seasonPicks }) {
  return (
    <>
      {/* Live banner */}
      <div style={{
        borderRadius: '20px',
        padding: '22px 20px',
        marginBottom: '16px',
        background: 'var(--card)',
        border: '1.5px solid var(--border-subtle)',
        textAlign: 'center',
        boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
      }}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>🏏</div>
        <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
          IPL 2026
        </p>
        <h2 className="font-display font-black" style={{ fontSize: '22px', color: 'var(--text-primary)', letterSpacing: '-0.5px', margin: 0 }}>
          Season is live!
        </h2>
        <p className="font-body text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Picks are locked. Let the cricket do the talking.
        </p>
      </div>

      {/* View-only shortcuts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <FantasyXIShortcut picks={fantasyPicks} seasonStarted />
        <SeasonPicksShortcut picks={seasonPicks} seasonStarted />
      </div>

      {/* Leaderboard snapshot — only visible after season starts */}
      <LeaderboardSnapshot />
    </>
  )
}

/* ─── Tournament Countdown ────────────────────────────────────────────────── */

function LogoRow({ teamIds }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', width: '100%' }}>
      {teamIds.map(id => {
        const team = getTeam(id)
        if (!team?.logoUrl) return null
        return (
          <img
            key={id}
            src={team.logoUrl}
            alt=""
            aria-hidden="true"
            style={{
              width: '68px', height: '68px',
              objectFit: 'contain',
              opacity: 0.16,
              filter: 'grayscale(10%)',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        )
      })}
    </div>
  )
}

function TournamentCountdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState(calcTimeLeft(targetDate))

  useEffect(() => {
    if (!targetDate) return
    const id = setInterval(() => setTimeLeft(calcTimeLeft(targetDate)), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  if (!targetDate) return null

  const { days, hours, minutes, seconds } = timeLeft
  const isImminent = days === 0 && hours < 2

  return (
    <div style={{
      borderRadius: '24px',
      marginBottom: '20px',
      background: 'var(--card)',
      border: '1.5px solid var(--border-subtle)',
      boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Central glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '380px', height: '220px',
        background: 'radial-gradient(ellipse, var(--team-primary) 0%, transparent 68%)',
        opacity: 0.18, pointerEvents: 'none',
      }} />

      {/* Top logo row */}
      <div style={{ position: 'relative', padding: '22px 12px 0' }}>
        <LogoRow teamIds={LOGO_ROW1} />
        {/* Fade-out gradient below top logos */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '36px',
          background: 'linear-gradient(to bottom, transparent, var(--card))',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Centre content */}
      <div style={{ padding: '24px 20px 20px', position: 'relative', zIndex: 1 }}>
        <p className="font-mono text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--text-muted)' }}>
          {isImminent ? '🚨 Starting soon' : 'IPL 2026 starts in'}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
          <CountUnit value={days}    label="days" />
          <Colon />
          <CountUnit value={hours}   label="hrs"  />
          <Colon />
          <CountUnit value={minutes} label="min"  />
          <Colon />
          <CountUnit value={seconds} label="sec"  animate />
        </div>

        <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
          Lock your Fantasy XI and Season picks before the first ball! 🏏
        </p>
      </div>

      {/* Bottom logo row */}
      <div style={{ position: 'relative', padding: '0 12px 22px' }}>
        {/* Fade-in gradient above bottom logos */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '36px',
          background: 'linear-gradient(to top, transparent, var(--card))',
          pointerEvents: 'none',
        }} />
        <LogoRow teamIds={LOGO_ROW2} />
      </div>
    </div>
  )
}

function CountUnit({ value, label, animate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '58px' }}>
      <div style={{
        background: 'var(--surface-subtle)',
        border: '1.5px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '10px 4px',
        width: '100%',
        transition: animate ? 'none' : undefined,
      }}>
        <span className="font-display font-black" style={{
          fontSize: '44px',
          color: 'var(--text-primary)',
          letterSpacing: '-2px',
          lineHeight: 1,
          display: 'block',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '5px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  )
}

function Colon() {
  return (
    <span className="font-display font-black" style={{
      fontSize: '36px', color: 'var(--text-muted)', opacity: 0.4,
      alignSelf: 'flex-start', paddingTop: '10px', lineHeight: 1.2,
    }}>:</span>
  )
}

function calcTimeLeft(target) {
  if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  const diff = Math.max(0, target.getTime() - Date.now())
  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

/* ─── Fantasy XI shortcut card ────────────────────────────────────────────── */

function FantasyXIShortcut({ picks, seasonStarted }) {
  const navigate = useNavigate()
  const hasLocked = picks?.locked === true
  const hasDraft  = picks && !picks.locked && (picks.players?.length ?? 0) > 0
  const hasNone   = !picks || (picks.players?.length ?? 0) === 0

  const status = hasLocked ? 'locked' : hasDraft ? 'draft' : 'none'
  const statusLabel = { locked: 'Locked ✓', draft: 'Draft saved', none: 'Not started' }[status]
  const statusColor = { locked: 'var(--team-primary)', draft: '#b45309', none: 'var(--text-muted)' }[status]

  const ctaLabel = seasonStarted
    ? 'View my XI →'
    : hasLocked ? 'View my XI →' : hasDraft ? 'Edit draft →' : 'Pick your XI →'

  const captainName = picks?.captain ?? null

  return (
    <button
      onClick={() => navigate('/fantasy-xi')}
      style={{
        width: '100%', textAlign: 'left', background: 'none',
        border: 'none', padding: 0, cursor: 'pointer',
      }}
    >
      <div style={{
        borderRadius: '18px', padding: '16px 18px',
        background: 'var(--card)', border: '1.5px solid var(--border-subtle)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        display: 'flex', alignItems: 'center', gap: '14px',
      }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
          background: 'var(--surface-subtle)', border: '1.5px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
        }}>⭐</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)', margin: 0 }}>
              Fantasy XI
            </p>
            <span className="font-mono" style={{
              fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: statusColor, padding: '2px 7px', borderRadius: '99px',
              border: `1px solid ${statusColor}`, opacity: 0.9,
            }}>{statusLabel}</span>
          </div>
          <p className="font-body text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>
            {hasLocked && captainName ? `Captain: ${captainName}` :
             hasDraft ? `${picks.players.length} of 11 selected` :
             'Pick 11 players + captain for the season'}
          </p>
        </div>

        <span className="font-display font-bold" style={{ color: 'var(--text-muted)', fontSize: '13px', flexShrink: 0 }}>
          {ctaLabel}
        </span>
      </div>
    </button>
  )
}

/* ─── Season Picks shortcut card ──────────────────────────────────────────── */

function SeasonPicksShortcut({ picks, seasonStarted }) {
  const navigate = useNavigate()
  const hasSubmitted = picks !== null

  const statusLabel = hasSubmitted ? 'Submitted ✓' : 'Not started'
  const statusColor = hasSubmitted ? 'var(--team-primary)' : 'var(--text-muted)'

  const ctaLabel = seasonStarted
    ? 'View picks →'
    : hasSubmitted ? 'Edit picks →' : 'Make picks →'

  const championName = picks?.champion ?? null

  return (
    <button
      onClick={() => navigate('/season')}
      style={{
        width: '100%', textAlign: 'left', background: 'none',
        border: 'none', padding: 0, cursor: 'pointer',
      }}
    >
      <div style={{
        borderRadius: '18px', padding: '16px 18px',
        background: 'var(--card)', border: '1.5px solid var(--border-subtle)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        display: 'flex', alignItems: 'center', gap: '14px',
      }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
          background: 'var(--surface-subtle)', border: '1.5px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
        }}>🏆</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)', margin: 0 }}>
              Season Picks
            </p>
            <span className="font-mono" style={{
              fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
              color: statusColor, padding: '2px 7px', borderRadius: '99px',
              border: `1px solid ${statusColor}`, opacity: 0.9,
            }}>{statusLabel}</span>
          </div>
          <p className="font-body text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>
            {hasSubmitted && championName ? `Champion pick: ${championName.toUpperCase()}` :
             'Predict champion, top 4, award winners'}
          </p>
        </div>

        <span className="font-display font-bold" style={{ color: 'var(--text-muted)', fontSize: '13px', flexShrink: 0 }}>
          {ctaLabel}
        </span>
      </div>
    </button>
  )
}

/* ─── Skeletons ────────────────────────────────────────────────────────────── */

function HomeSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="shimmer" style={{ height: '180px', borderRadius: '24px' }} />
      <div className="shimmer" style={{ height: '72px', borderRadius: '18px' }} />
      <div className="shimmer" style={{ height: '72px', borderRadius: '18px' }} />
    </div>
  )
}
