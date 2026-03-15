import { useSeasonPicks } from '../hooks/useSeasonPicks'
import { SeasonPicksForm } from '../components/season/SeasonPicksForm'
import { SeasonTracker } from '../components/season/SeasonTracker'

export default function Season() {
  const { picks, setPicks, seasonStarted, loading, error } = useSeasonPicks()

  return (
    <div className="p-4 animate-slide-up">
      {/* Page header */}
      <div className="mb-5">
        <p className="font-mono text-xs tracking-widest uppercase mb-0.5" style={{ color: 'var(--text-muted)' }}>
          IPL 2026
        </p>
        <h1 className="font-display font-black" style={{ fontSize: '28px', color: 'var(--text-primary)', letterSpacing: '-1px', lineHeight: 1.1 }}>
          Season Picks
        </h1>
      </div>

      {loading ? (
        <SeasonSkeleton />
      ) : error ? (
        <ErrorCard message={error} />
      ) : picks ? (
        /* Picks exist — tracker handles view + inline editing */
        <SeasonTracker
          picks={picks}
          setPicks={setPicks}
          seasonStarted={seasonStarted}
        />
      ) : seasonStarted ? (
        /* Season started, no picks — missed window */
        <MissedState />
      ) : (
        /* No picks yet, season open — first-time wizard */
        <>
          <div style={{
            marginBottom: '16px',
            padding: '14px 16px',
            borderRadius: '14px',
            background: 'var(--card)',
            border: '1.5px solid var(--border-subtle)',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}>
            <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)', margin: '0 0 4px' }}>
              Before the season starts
            </p>
            <p className="font-body text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>
              {"These picks lock when Match 1 begins. Take your time — but don't miss the window."}
            </p>
          </div>
          <SeasonPicksForm onSaved={setPicks} />
        </>
      )}
    </div>
  )
}

/* ─── Missed state ─────────────────────────────────────────────────────────── */

function MissedState() {
  return (
    <div style={{
      borderRadius: '20px',
      padding: '32px 20px',
      background: 'var(--card)',
      border: '1.5px solid var(--border-subtle)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>😬</div>
      <p className="font-display font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
        Season already started
      </p>
      <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
        Season picks locked when Match 1 kicked off. No picks on record for you this season.
      </p>
    </div>
  )
}

/* ─── Skeleton ─────────────────────────────────────────────────────────────── */

function SeasonSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {[120, 180, 100, 100, 120, 120, 120].map((h, i) => (
        <div key={i} style={{
          height: `${h}px`,
          borderRadius: '18px',
          background: 'linear-gradient(90deg, var(--shimmer-from) 25%, var(--shimmer-mid) 50%, var(--shimmer-from) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s ease-in-out infinite',
          animationDelay: `${i * 0.07}s`,
        }} />
      ))}
    </div>
  )
}

/* ─── Error ────────────────────────────────────────────────────────────────── */

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
        Couldn't load season picks.
      </p>
      <p className="font-mono text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{message}</p>
    </div>
  )
}
