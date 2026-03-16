import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getTeam } from '../lib/content'

export default function Profile() {
  const { profile, signOut } = useAuth()
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
            <Section label="Deadline">
              <p className="font-body text-sm" style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                Every match has a card you fill before the first ball is bowled. Once the match goes live, your card locks automatically — no edits, no excuses.
              </p>
            </Section>

            <Divider />

            {/* Match card */}
            <Section label="Match Card — 4 picks per match">
              <RuleRow label="Winner Pick" pts="+10">
                Simple: pick which team wins. Gets a contrarian multiplier — if you're the only one who called the upset, you earn double.
              </RuleRow>
              <RuleRow label="The Call" pts="+10">
                A specific match stat question — e.g. "Total sixes: Over/Under 13" or "Which team scores more in the powerplay?". One question per match, same for everyone.
              </RuleRow>
              <RuleRow label="Villain Pick" pts="varies">
                Pick one player from either squad to be your villain. You want them to <em>flop</em> — score under 10 runs and take zero wickets. The worse they do for their team, the better for you.
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {[
                    { outcome: 'Flopped', detail: '<10 runs & 0 wickets', pts: '+15', neg: false },
                    { outcome: 'Neutral', detail: 'Anything in between', pts: '0', neg: false },
                    { outcome: 'Impact',  detail: '30+ runs or 2+ wickets', pts: '−5', neg: true },
                  ].map(r => (
                    <div key={r.outcome} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--text-secondary)' }}>{r.outcome}</strong> — {r.detail}
                      </span>
                      <span className="font-mono font-bold" style={{ fontSize: '12px', color: r.neg ? '#EF4444' : 'var(--team-primary)' }}>{r.pts}</span>
                    </div>
                  ))}
                </div>
              </RuleRow>
              <RuleRow label="Chaos Ball" pts="+12">
                A Yes/No wildcard question — something unpredictable like "Will the match go to the last over?" or "Will there be a super over?". Pays the most because it's the hardest to call.
              </RuleRow>
            </Section>

            <Divider />

            {/* Contrarian */}
            <Section label="Contrarian Bonus">
              <p className="font-body text-sm" style={{ color: 'var(--text-secondary)', margin: '0 0 8px', lineHeight: 1.5 }}>
                Your Winner, The Call, and Chaos Ball points are multiplied based on how many people picked the same thing.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {[
                  { label: 'Only you picked it', mult: '2×' },
                  { label: '2 of you picked it', mult: '1.5×' },
                  { label: '3 or more picked it', mult: '1×' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <p className="font-body text-sm" style={{ color: 'var(--text-secondary)', margin: 0 }}>{row.label}</p>
                    <span className="font-mono font-bold" style={{ fontSize: '13px', color: 'var(--team-primary)' }}>{row.mult}</span>
                  </div>
                ))}
              </div>
              <p className="font-body text-xs" style={{ color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.5 }}>
                Safe consensus picks earn normal points. Brave solo calls earn double. Villain Pick has no multiplier.
              </p>
            </Section>

            <Divider />

            {/* Season picks */}
            <Section label="Season Picks — lock before Match 1">
              <p className="font-body text-sm" style={{ color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>
                One set of predictions for the whole season, locked before the first match. You can't change them once play begins.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Top 4 teams', pts: '+30 each', desc: 'Pick 4 teams to qualify for the playoffs. 30 pts per correct pick.' },
                  { label: 'Champion', pts: '+200', desc: 'Pick the IPL 2026 winner.' },
                  { label: 'Runner-Up', pts: '+100', desc: 'Pick the finalist who loses.' },
                  { label: 'Wooden Spoon', pts: '+50', desc: 'Pick the team that finishes last.' },
                  { label: 'Orange Cap', pts: 'up to +80', desc: 'Pick up to 3 players for top run-scorer. Points based on their final rank.' },
                  { label: 'Purple Cap', pts: 'up to +80', desc: 'Pick up to 3 players for top wicket-taker.' },
                  { label: 'Most Sixes', pts: 'up to +60', desc: 'Pick up to 3 players for most sixes hit.' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <p className="font-display font-bold" style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>{row.label}</p>
                      <p className="font-body" style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '1px 0 0', lineHeight: 1.4 }}>{row.desc}</p>
                    </div>
                    <span className="font-mono font-bold" style={{ fontSize: '12px', color: 'var(--team-primary)', flexShrink: 0, whiteSpace: 'nowrap' }}>{row.pts}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Divider />

            <p className="font-body text-xs" style={{ color: 'var(--text-muted)', margin: '12px 0 0', lineHeight: 1.5 }}>
              Max per match card: <strong style={{ color: 'var(--text-secondary)' }}>47 pts</strong> · Good season total: <strong style={{ color: 'var(--text-secondary)' }}>500–700 pts</strong>
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

/* ── Rules helpers ───────────────────────────────────────────────── */

function Section({ label, children }) {
  return (
    <div style={{ marginTop: '16px', marginBottom: '4px' }}>
      <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>{label}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>{children}</div>
    </div>
  )
}

function Divider() {
  return <div style={{ marginTop: '16px', height: '1px', background: 'var(--border-subtle)' }} />
}

function RuleRow({ label, pts, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
        <p className="font-display font-bold" style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>{label}</p>
        <span className="font-mono font-bold" style={{ fontSize: '12px', color: 'var(--team-primary)', flexShrink: 0 }}>{pts}</span>
      </div>
      <p className="font-body" style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{children}</p>
    </div>
  )
}
