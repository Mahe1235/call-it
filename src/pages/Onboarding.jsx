import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { teams } from '../lib/content'
import { JERSEY_AVATARS } from '../lib/avatars'

export default function Onboarding() {
  const { user, refreshProfile } = useAuth()
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [selectedSeed, setSelectedSeed] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedTeam || !displayName.trim() || !selectedSeed) return
    setSaving(true)
    setError(null)
    const jersey = JERSEY_AVATARS.find(j => j.id === selectedSeed)
    const { error } = await supabase.from('users').upsert({
      id: user.id,
      display_name: displayName.trim(),
      team: selectedTeam,
      avatar_url: jersey?.url ?? null,
    })
    if (error) {
      setError(error.message)
      setSaving(false)
    } else {
      if (refreshProfile) {
        await refreshProfile()
      } else {
        window.location.reload()
      }
    }
  }

  const canSubmit = selectedTeam && displayName.trim() && selectedSeed

  return (
    <div className="min-h-dvh flex flex-col justify-end p-4 pb-8 animate-slide-up">
      <p className="text-xs uppercase font-mono tracking-widest text-[var(--text-muted)] mb-2">Welcome</p>
      <h1 className="font-display text-4xl font-extrabold text-[var(--text-primary)] mb-1 leading-tight">
        Call It.
      </h1>
      <p className="text-[var(--text-secondary)] font-body mb-8">
        Pick your team. It sets your colours for the season.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Display name */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">
            What do the others call you?
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            maxLength={24}
            className="w-full border border-[var(--border)] rounded-btn px-4 py-3 font-body text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--team-primary)]"
            style={{ background: 'var(--card)', color: 'var(--text-primary)' }}
          />
        </div>

        {/* Avatar picker */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-[var(--text-muted)] mb-3">
            Pick your number
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
            {JERSEY_AVATARS.map((jersey) => {
              const isSelected = selectedSeed === jersey.id
              return (
                <button
                  key={jersey.id}
                  type="button"
                  onClick={() => setSelectedSeed(jersey.id)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                    padding: '6px 4px',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid var(--text-primary)' : '2px solid transparent',
                    background: isSelected ? 'var(--surface-subtle)' : 'transparent',
                    cursor: 'pointer',
                    transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                    transition: 'transform 0.15s, border-color 0.15s, background 0.15s',
                    boxShadow: isSelected ? '0 2px 10px rgba(0,0,0,0.15)' : 'none',
                  }}
                >
                  <img
                    src={jersey.url}
                    alt={jersey.label}
                    style={{ width: '100%', aspectRatio: '1', borderRadius: '8px', display: 'block' }}
                  />
                  <span style={{
                    fontSize: '9px', fontWeight: 700, fontFamily: 'var(--font-mono)',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                    letterSpacing: '0.02em', lineHeight: 1, textAlign: 'center',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    width: '100%',
                  }}>{jersey.sublabel}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Team picker */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">
            Your team
          </label>
          <div className="grid grid-cols-2 gap-2">
            {teams.teams.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTeam(t.id)}
                style={
                  selectedTeam === t.id
                    ? { backgroundColor: t.colors.primary, color: t.colors.textOnPrimary, borderColor: t.colors.primary }
                    : { background: 'var(--card)' }
                }
                className={`rounded-btn px-3 py-3 text-sm font-body font-medium border transition-all tap-feedback ${
                  selectedTeam === t.id
                    ? 'border-2 -rotate-[0.5deg] scale-[1.02]'
                    : 'border-[var(--border)] text-[var(--text-secondary)]'
                }`}
              >
                {t.shortName}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 font-body">{error}</p>
        )}

        <button
          type="submit"
          disabled={!canSubmit || saving}
          className="w-full py-4 rounded-btn font-display font-bold text-lg disabled:opacity-40 transition-all tap-feedback"
          style={{
            backgroundColor: selectedTeam
              ? teams.teams.find((t) => t.id === selectedTeam)?.colors.primary ?? 'var(--text-primary)'
              : 'var(--text-primary)',
            color: selectedTeam
              ? teams.teams.find((t) => t.id === selectedTeam)?.colors.textOnPrimary ?? '#fff'
              : '#fff',
          }}
        >
          {saving ? 'Locking in…' : 'Lock it in'}
        </button>
      </form>
    </div>
  )
}
