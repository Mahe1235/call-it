import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { teams } from '../lib/content'

export default function Onboarding() {
  const { user } = useAuth()
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedTeam || !displayName.trim()) return
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('users').insert({
      id: user.id,
      display_name: displayName.trim(),
      team: selectedTeam,
    })
    if (error) {
      setError(error.message)
      setSaving(false)
    }
    // On success, useAuth listener will pick up the new profile and re-render App
  }

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
            className="w-full bg-white border border-[var(--border)] rounded-btn px-4 py-3 font-body text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--team-primary)]"
          />
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
                    : {}
                }
                className={`rounded-btn px-3 py-3 text-sm font-body font-medium border transition-all tap-feedback ${
                  selectedTeam === t.id
                    ? 'border-2 -rotate-[0.5deg] scale-[1.02]'
                    : 'bg-white border-[var(--border)] text-[var(--text-secondary)]'
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
          disabled={!selectedTeam || !displayName.trim() || saving}
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
