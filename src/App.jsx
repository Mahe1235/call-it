import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { TeamThemeProvider } from './components/layout/TeamThemeProvider'
import { BottomNav } from './components/layout/BottomNav'
import { AppBackground } from './components/layout/AppBackground'
import { ThemeProvider } from './contexts/ThemeContext'
import { useTheme } from './contexts/ThemeContext'
import Home from './pages/Home'
import FantasyXI from './pages/FantasyXI'
import Season from './pages/Season'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import Onboarding from './pages/Onboarding'

function AppShell() {
  const { loading, user, profile } = useAuth()

  if (loading) return <LoadingScreen />

  // Not signed in at all → show Google sign-in
  if (!user) return <SignInScreen />

  // Signed in but no profile → onboarding (team + display name)
  if (!profile) return <Onboarding />

  return (
    <TeamThemeProvider team={profile.team}>
      <DarkModeToggle />
      <div className="pb-16">
        <Routes>
          <Route path="/"           element={<Home />} />
          <Route path="/fantasy-xi" element={<FantasyXI />} />
          <Route path="/league"     element={<Navigate to="/fantasy-xi" replace />} />
          <Route path="/season"     element={<Season />} />
          <Route path="/profile"    element={<Profile />} />
          <Route path="/admin"      element={<Admin />} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </TeamThemeProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppBackground />
        <AppShell />
      </BrowserRouter>
    </ThemeProvider>
  )
}

/* ── Dark mode toggle — fixed top-right, visible on all pages ───── */

function DarkModeToggle() {
  const { isDark, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      style={{
        position: 'fixed',
        top: '14px',
        right: '16px',
        zIndex: 100,
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: '1.5px solid var(--border-subtle)',
        background: 'var(--card)',
        boxShadow: 'var(--shadow-card)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        transition: 'background 0.2s, border-color 0.2s',
      }}
    >
      {isDark ? '🌙' : '☀️'}
    </button>
  )
}

/* ── Utility screens ────────────────────────────────────────────── */

function LoadingScreen() {
  return (
    <div className="min-h-dvh flex items-center justify-center">
      <span className="font-mono text-sm text-[var(--text-muted)] animate-pulse">Loading…</span>
    </div>
  )
}

const TAGLINES = [
  "Your picks. Permanently on record.",
  "Predictions. Banter. Bragging rights.",
  "Put your reputation on the line.",
  "Group scorekeeping. Personal shame.",
  "Call it. Or be called out.",
]

function SignInScreen() {
  const { signInWithGoogle } = useAuth()
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % TAGLINES.length)
        setVisible(true)
      }, 220)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-dvh flex flex-col justify-end gap-10 p-6 pb-12 relative overflow-hidden">
      {/* Background orb */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-60px',
        width: '320px', height: '320px',
        background: 'radial-gradient(circle, rgba(0,0,0,0.055) 0%, transparent 68%)',
        borderRadius: '50%', pointerEvents: 'none',
        animation: 'shimBg 4s ease-in-out infinite',
      }} />

      {/* Top content */}
      <div className="relative flex flex-col items-center text-center">
        {/* Floating cricket bat */}
        <div style={{ fontSize: '52px', display: 'inline-block', animation: 'floatBadge 3.5s ease-in-out infinite', marginBottom: '24px', lineHeight: 1 }}>
          🏏
        </div>

        <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
          IPL 2026
        </p>

        <h1 className="font-display font-extrabold leading-none mb-5" style={{ fontSize: '72px', color: 'var(--text-primary)', letterSpacing: '-2px' }}>
          Called It.
        </h1>

        {/* Rotating banter tagline */}
        <div style={{
          background: 'var(--card)',
          borderRadius: '14px',
          padding: '12px 16px',
          backdropFilter: 'blur(4px)',
          border: '1.5px solid var(--border-subtle)',
        }}>
          <p className="font-display font-bold" style={{
            fontSize: '14px',
            fontStyle: 'italic',
            color: 'var(--text-primary)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity 0.22s ease, transform 0.22s ease',
          }}>
            "{TAGLINES[idx]}"
          </p>
        </div>

        {/* Decorative emoji row */}
        <div className="flex gap-3 mt-6" style={{ fontSize: '22px' }}>
          {['🏆', '🎯', '🔥', '📊', '🤝'].map((e, i) => (
            <span key={e} style={{
              opacity: 0.55,
              animation: `floatBadge ${3.2 + i * 0.4}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}>{e}</span>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div>
        <p className="font-body text-center text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Sign in to join your group's leaderboard.
        </p>
        <button
          onClick={signInWithGoogle}
          className="w-full font-display font-extrabold text-white tap-feedback"
          style={{
            background: '#111111',
            border: 'none',
            borderRadius: '14px',
            padding: '17px',
            fontSize: '17px',
            letterSpacing: '-0.3px',
            boxShadow: '0 6px 24px rgba(0,0,0,0.20)',
          }}
        >
          Sign in with Google
        </button>

      </div>
    </div>
  )
}
