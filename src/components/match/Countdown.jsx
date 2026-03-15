import { useState, useEffect } from 'react'

/**
 * Live countdown to match start.
 * Switches to a LIVE badge once time reaches zero.
 * Updates every second.
 */
export function Countdown({ targetDate, status }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(targetDate))

  useEffect(() => {
    if (status === 'live') return

    const id = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate))
    }, 1000)

    return () => clearInterval(id)
  }, [targetDate, status])

  if (status === 'live') {
    return <LiveBadge />
  }

  if (timeLeft.total <= 0) {
    return <LiveBadge />
  }

  const { hours, minutes, seconds, days } = timeLeft

  return (
    <div className="flex items-center justify-center gap-2">
      {days > 0 && (
        <TimeUnit value={days} label="d" />
      )}
      <TimeUnit value={hours} label="h" />
      <Separator />
      <TimeUnit value={minutes} label="m" />
      <Separator />
      <TimeUnit value={seconds} label="s" />
    </div>
  )
}

function TimeUnit({ value, label }) {
  return (
    <div className="flex items-baseline gap-0.5">
      <span
        className="font-mono font-bold tabular-nums"
        style={{ fontSize: '28px', color: 'var(--text-primary)', letterSpacing: '-1px', lineHeight: 1 }}
      >
        {String(value).padStart(2, '0')}
      </span>
      <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  )
}

function Separator() {
  return (
    <span
      className="font-mono font-bold"
      style={{ fontSize: '22px', color: 'var(--text-muted)', lineHeight: 1, marginBottom: '2px' }}
    >
      :
    </span>
  )
}

function LiveBadge() {
  return (
    <div className="flex items-center justify-center gap-2">
      {/* Pulsing dot */}
      <span
        style={{
          display: 'inline-block',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#22c55e',
          animation: 'popIn 0.4s ease, pulse 1.5s ease-in-out infinite 0.4s',
        }}
      />
      <span
        className="font-display font-black uppercase tracking-wide"
        style={{ fontSize: '18px', color: '#22c55e', letterSpacing: '1px' }}
      >
        Live
      </span>
    </div>
  )
}

function getTimeLeft(targetDate) {
  const now = Date.now()
  const target = new Date(targetDate).getTime()
  const total = target - now

  if (total <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }

  const seconds = Math.floor((total / 1000) % 60)
  const minutes = Math.floor((total / 1000 / 60) % 60)
  const hours = Math.floor((total / 1000 / 60 / 60) % 24)
  const days = Math.floor(total / 1000 / 60 / 60 / 24)

  return { total, days, hours, minutes, seconds }
}
