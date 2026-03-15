import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'

export default function Admin() {
  const { profile, loading } = useAuth()

  if (loading) return null
  if (!profile?.is_admin) return <Navigate to="/" replace />

  return (
    <div className="p-4 animate-slide-up">
      <p className="text-xs uppercase font-mono tracking-widest text-[var(--text-muted)] mb-1">Admin</p>
      <h1 className="font-display text-3xl font-bold text-[var(--text-primary)] mb-1">Scoring Panel</h1>
      <p className="text-[var(--text-secondary)] font-body">Fetch scorecards and publish match results here.</p>
    </div>
  )
}
