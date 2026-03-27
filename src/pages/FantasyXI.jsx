import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useFantasyXI, useFantasyXIGroup, saveFantasyXIPicks } from '../hooks/useFantasyXI'
import { useSeasonStatus } from '../hooks/useSeasonStatus'
import { FantasyPicksForm } from '../components/fantasy/FantasyPicksForm'
import { FantasyXICard } from '../components/fantasy/FantasyXICard'
import { FantasyLeaderboard } from '../components/fantasy/FantasyLeaderboard'

export default function FantasyXI() {
  const { user } = useAuth()
  const { picks, setPicks, loading, error } = useFantasyXI(user?.id)
  const { entries, loading: groupLoading } = useFantasyXIGroup()
  const { seasonStarted } = useSeasonStatus()
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [saveError, setSaveError] = useState(null)

  async function handleSave(players, captain, viceCaptain, lock) {
    if (!user) return
    setSaving(true)
    setSaveError(null)
    const { data, error: err } = await saveFantasyXIPicks(user.id, players, captain, viceCaptain, lock)
    setSaving(false)
    if (err) {
      setSaveError(err.message)
    } else {
      setPicks(data)
      if (lock) setEditing(false)
    }
  }

  const hasPicks   = picks && picks.players?.length > 0
  const isLocked   = picks?.locked === true
  const showForm   = !hasPicks || editing

  return (
    <div className="p-4 animate-slide-up">
      {/* Page header */}
      <div className="mb-5">
        <p className="font-mono text-xs tracking-widest uppercase mb-0.5" style={{ color: 'var(--text-muted)' }}>
          IPL 2026
        </p>
        <h1 className="font-display font-black" style={{ fontSize: '28px', color: 'var(--text-primary)', letterSpacing: '-1px', lineHeight: 1.1 }}>
          Fantasy XI
        </h1>
        <p className="font-body text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Pick your best 11 for the whole season.
        </p>
      </div>

      {loading ? (
        <FantasySkeleton />
      ) : error ? (
        <ErrorCard message={error} />
      ) : (
        <>
          {/* My XI section */}
          <div style={{
            background: 'var(--card)',
            borderRadius: '20px',
            padding: '20px',
            border: '1.5px solid var(--border-subtle)',
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <p className="font-mono text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)', margin: 0 }}>
                My XI
              </p>
              {isLocked && (
                <span style={{
                  padding: '3px 10px', borderRadius: '99px',
                  background: 'var(--team-primary)', color: 'var(--team-text-on-primary)',
                  fontFamily: 'Bricolage Grotesque, sans-serif',
                  fontWeight: 700, fontSize: '11px', letterSpacing: '0.04em',
                }}>
                  Locked ✓
                </span>
              )}
            </div>

            {showForm ? (
              <>
                <PickerIntro isEditing={editing} />
                <FantasyPicksForm
                  initialPlayers={picks?.players ?? []}
                  initialCaptain={picks?.captain ?? null}
                  initialViceCap={picks?.vice_captain ?? null}
                  onSave={handleSave}
                  saving={saving}
                />
              </>
            ) : (
              <FantasyXICard
                picks={picks}
                scores={null}
                onEdit={isLocked ? null : () => setEditing(true)}
              />
            )}

            {saveError && (
              <p className="font-mono text-xs text-center mt-3" style={{ color: '#cc0000' }}>
                {saveError}
              </p>
            )}
          </div>

          {/* Scoring note — deferred */}
          <div style={{
            padding: '12px 16px', borderRadius: '14px',
            background: 'var(--surface-subtle)', border: '1px solid var(--border-subtle)',
            marginBottom: '20px',
          }}>
            <p className="font-body text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>
              ⏳ Fantasy scoring activates after the first match. Your XI accumulates points across the whole season.
            </p>
          </div>

          {/* Group leaderboard */}
          <div style={{ marginBottom: '24px' }}>
            <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
              The Group
            </p>
            {groupLoading ? (
              <GroupSkeleton />
            ) : (
              <FantasyLeaderboard entries={entries} seasonStarted={seasonStarted} />
            )}
          </div>
        </>
      )}
    </div>
  )
}

function PickerIntro({ isEditing }) {
  if (isEditing) return null
  return (
    <div style={{
      padding: '14px 16px', borderRadius: '14px',
      background: 'var(--surface-subtle)', border: '1px solid var(--border-subtle)',
      marginBottom: '20px',
    }}>
      <p className="font-display font-bold text-sm mb-1" style={{ color: 'var(--text-primary)', margin: '0 0 4px' }}>
        Pick your 11 for IPL 2026
      </p>
      <p className="font-body text-xs" style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
        Min: 1 WK · 3 BAT · 1 AR · 3 BWL. Assign a Captain (2×) and Vice Captain (1.5×). Lock before Match 1.
      </p>
    </div>
  )
}

function FantasySkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="shimmer" style={{ height: '52px', borderRadius: '12px' }} />
      ))}
    </div>
  )
}

function GroupSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} className="shimmer" style={{ height: '52px', borderRadius: '14px' }} />
      ))}
    </div>
  )
}

function ErrorCard({ message }) {
  return (
    <div style={{
      borderRadius: '16px', padding: '24px 20px',
      background: '#fff5f5', border: '1.5px solid rgba(200,0,0,0.12)', textAlign: 'center',
    }}>
      <p className="font-body text-sm" style={{ color: '#cc0000' }}>
        Couldn't load Fantasy XI data.
      </p>
      <p className="font-mono text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{message}</p>
    </div>
  )
}
