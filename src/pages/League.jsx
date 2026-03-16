import { useLeaderboard } from '../hooks/useLeaderboard'
import { usePointsProgression } from '../hooks/usePointsProgression'
import { LeaderboardTable } from '../components/league/LeaderboardTable'
import { PointsProgressionChart } from '../components/league/PointsProgressionChart'

export default function League() {
  const { entries, loading, error } = useLeaderboard()
  const { chartData, players, loading: chartLoading } = usePointsProgression()

  return (
    <div className="p-4 animate-slide-up">
      {/* Header */}
      <div className="mb-5">
        <p className="font-mono text-xs tracking-widest uppercase mb-0.5" style={{ color: 'var(--text-muted)' }}>
          IPL 2026
        </p>
        <h1 className="font-display font-black" style={{ fontSize: '28px', color: 'var(--text-primary)', letterSpacing: '-1px', lineHeight: 1.1 }}>
          League
        </h1>
      </div>

      {/* Leaderboard */}
      <section className="mb-6">
        <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
          Standings
        </p>

        {loading ? (
          <LeaderboardSkeleton />
        ) : error ? (
          <ErrorCard message={error} />
        ) : (
          <LeaderboardTable entries={entries} />
        )}
      </section>

      {/* Points progression */}
      <section>
        <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
          Points Race
        </p>
        {chartLoading ? (
          <div style={{ height: '280px', borderRadius: '20px', background: 'var(--surface-subtle)', border: '1.5px solid var(--border-subtle)' }} />
        ) : !chartData.length ? (
          <div style={{ borderRadius: '20px', padding: '28px 20px', background: 'var(--card)', border: '1.5px solid var(--border-subtle)', textAlign: 'center' }}>
            <p style={{ fontSize: '28px', marginBottom: '8px' }}>📈</p>
            <p className="font-display font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>No matches scored yet</p>
            <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>The race starts after Match 1 is scored.</p>
          </div>
        ) : (
          <PointsProgressionChart chartData={chartData} players={players} />
        )}
      </section>
    </div>
  )
}

/* ─── Skeleton ────────────────────────────────────────────────────────────── */

function LeaderboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          height: '54px',
          borderRadius: '14px',
          background: 'linear-gradient(90deg, var(--surface-subtle) 25%, var(--border-subtle) 50%, var(--surface-subtle) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s ease-in-out infinite',
          animationDelay: `${i * 0.08}s`,
        }} />
      ))}
    </div>
  )
}

/* ─── Error ───────────────────────────────────────────────────────────────── */

function ErrorCard({ message }) {
  return (
    <div style={{
      borderRadius: '16px',
      padding: '20px',
      background: '#fff5f5',
      border: '1.5px solid rgba(200,0,0,0.12)',
      textAlign: 'center',
    }}>
      <p className="font-body text-sm" style={{ color: '#cc0000' }}>
        Couldn't load leaderboard.
      </p>
      <p className="font-mono text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{message}</p>
    </div>
  )
}
