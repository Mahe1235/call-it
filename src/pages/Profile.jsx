import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getTeam } from '../lib/content'
import { useTheme } from '../contexts/ThemeContext'

export default function Profile() {
  const { profile, signOut } = useAuth()
  const { isDark, toggle }   = useTheme()
  const navigate = useNavigate()
  const team = profile ? getTeam(profile.team) : null
  const [rulesOpen, setRulesOpen] = useState(false)

  return (
    <div className="p-4 animate-slide-up">
      {/* Page header */}
      <div className="mb-5">
        <p className="font-mono text-xs tracking-widest uppercase mb-0.5" style={{ color: 'var(--text-muted)' }}>
          IPL 2026
        </p>
        <h1 className="font-display font-black" style={{ fontSize: '28px', color: 'var(--text-primary)', letterSpacing: '-1px', lineHeight: 1.1 }}>
          You
        </h1>
      </div>

      {/* Profile card */}
      {profile && (
        <div style={{
          background: 'var(--card)',
          borderRadius: '20px',
          padding: '20px',
          border: '1.5px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Avatar */}
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                style={{ width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0, background: 'var(--surface-subtle)' }}
              />
            ) : (
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--team-primary)',
                color: 'var(--team-text-on-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Bricolage Grotesque, sans-serif',
                fontWeight: 800,
                fontSize: '22px',
                flexShrink: 0,
              }}>
                {profile.display_name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-display font-bold" style={{ fontSize: '18px', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>
                {profile.display_name}
              </p>
              {team && (
                <p className="font-body text-sm" style={{ color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  {team.name}
                </p>
              )}
              {profile.is_admin && (
                <span className="font-mono" style={{ fontSize: '9px', color: 'var(--team-primary)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings card */}
      <div style={{
        background: 'var(--card)',
        borderRadius: '20px',
        border: '1.5px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
        marginBottom: '12px',
      }}>
        {/* Dark mode row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>{isDark ? '🌙' : '☀️'}</span>
            <div>
              <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)', margin: 0 }}>
                {isDark ? 'Dark mode' : 'Light mode'}
              </p>
              <p className="font-body text-xs" style={{ color: 'var(--text-muted)', margin: '1px 0 0' }}>
                {isDark ? 'Night owl mode on' : 'Switch to dark mode'}
              </p>
            </div>
          </div>

          {/* Toggle pill */}
          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            style={{
              position: 'relative',
              width: '50px',
              height: '28px',
              borderRadius: '99px',
              border: 'none',
              background: isDark ? 'var(--team-primary)' : 'rgba(0,0,0,0.12)',
              cursor: 'pointer',
              padding: 0,
              transition: 'background 0.25s ease',
              flexShrink: 0,
            }}
          >
            <span style={{
              position: 'absolute',
              top: '3px',
              left: isDark ? '25px' : '3px',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: 'var(--card)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
              transition: 'left 0.25s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
            }}>
              {isDark ? '🌙' : '☀️'}
            </span>
          </button>
        </div>
      </div>

      {/* How to Play */}
      <div style={{
        background: 'var(--card)',
        borderRadius: '20px',
        border: '1.5px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
        marginBottom: '12px',
      }}>
        <button
          onClick={() => setRulesOpen(o => !o)}
          className="tap-feedback"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>📋</span>
            <div style={{ textAlign: 'left' }}>
              <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)', margin: 0 }}>How to Play</p>
              <p className="font-body text-xs" style={{ color: 'var(--text-muted)', margin: '1px 0 0' }}>Scoring rules & deadlines</p>
            </div>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '16px', transition: 'transform 0.2s', transform: rulesOpen ? 'rotate(90deg)' : 'none' }}>›</span>
        </button>

        {rulesOpen && (
          <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border-subtle)' }}>

            {/* Deadline */}
            <div style={{ marginTop: '16px', marginBottom: '16px' }}>
              <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', marginBottom: '6px' }}>Deadline</p>
              <p className="font-body text-sm" style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Lock your picks before the match starts. Once the first ball is bowled, the card is sealed — no changes.
              </p>
            </div>

            {/* Match card scoring */}
            <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>Match Card</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {[
                { label: 'Winner Pick', pts: '+10', desc: 'Pick which team wins' },
                { label: 'The Call', pts: '+10', desc: 'Match stat over/under or team question' },
                { label: 'Chaos Ball', pts: '+12', desc: 'Yes/No wildcard question' },
                { label: 'Villain — flopped', pts: '+15', desc: 'Your pick scores <10 & takes 0 wkts' },
                { label: 'Villain — impact', pts: '−5', desc: 'Your pick scores 30+ or takes 2+ wkts', neg: true },
                { label: 'Villain — neutral', pts: '0', desc: 'Everyone else' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <p className="font-display font-bold" style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>{row.label}</p>
                    <p className="font-body" style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '1px 0 0', lineHeight: 1.4 }}>{row.desc}</p>
                  </div>
                  <span className="font-mono font-bold" style={{ fontSize: '13px', color: row.neg ? '#EF4444' : 'var(--team-primary)', flexShrink: 0 }}>{row.pts}</span>
                </div>
              ))}
            </div>

            {/* Contrarian bonus */}
            <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>Contrarian Bonus</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              {[
                { label: 'Only you picked it', mult: '2×' },
                { label: '2 of the group picked it', mult: '1.5×' },
                { label: '3 or more picked it', mult: '1×' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <p className="font-body text-sm" style={{ color: 'var(--text-secondary)', margin: 0 }}>{row.label}</p>
                  <span className="font-mono font-bold" style={{ fontSize: '13px', color: 'var(--team-primary)' }}>{row.mult}</span>
                </div>
              ))}
            </div>
            <p className="font-body text-xs" style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Applies to Winner, The Call, and Chaos Ball. Brave solo calls pay double.
            </p>

            <div style={{ marginTop: '16px', height: '1px', background: 'var(--border-subtle)' }} />

            {/* Max points note */}
            <p className="font-body text-xs" style={{ color: 'var(--text-muted)', marginTop: '12px', margin: '12px 0 0', lineHeight: 1.5 }}>
              Max per match card: <strong style={{ color: 'var(--text-secondary)' }}>47 pts</strong> · Good season: <strong style={{ color: 'var(--text-secondary)' }}>500–700 pts</strong>
            </p>
          </div>
        )}
      </div>

      {/* Admin portal link — only for admins */}
      {profile?.is_admin && (
        <div
          onClick={() => navigate('/admin')}
          className="tap-feedback"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            marginBottom: '12px',
            background: 'var(--card)',
            borderRadius: '20px',
            border: '1.5px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>⚙️</span>
            <div>
              <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)', margin: 0 }}>
                Scoring Panel
              </p>
              <p className="font-body text-xs" style={{ color: 'var(--text-muted)', margin: '1px 0 0' }}>
                Score matches and publish results
              </p>
            </div>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '16px' }}>›</span>
        </div>
      )}

      {/* Sign out */}
      <button
        onClick={signOut}
        className="tap-feedback"
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '14px',
          border: '1.5px solid var(--border-default)',
          background: 'transparent',
          color: 'var(--text-muted)',
          fontFamily: 'inherit',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        Sign out
      </button>
    </div>
  )
}
