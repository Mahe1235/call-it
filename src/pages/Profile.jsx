import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { useSeasonStatus } from '../hooks/useSeasonStatus'
import { supabase } from '../lib/supabase'
import { getTeam } from '../lib/content'

export default function Profile() {
  const { profile, session, signOut } = useAuth()
  const navigate = useNavigate()
  const team = profile ? getTeam(profile.team) : null
  const [rulesOpen, setRulesOpen] = useState(false)

  const { entries, loading: leaderboardLoading } = useLeaderboard()
  const { seasonStarted } = useSeasonStatus()
  const myRow = session ? entries.find(e => e.user_id === session.user.id) : null

  const [bestPts, setBestPts] = useState(null)
  const [worstPts, setWorstPts] = useState(null)

  useEffect(() => {
    if (!session) return
    supabase
      .from('match_scores')
      .select('total')
      .eq('user_id', session.user.id)
      .order('total', { ascending: false })
      .then(({ data }) => {
        if (!data || data.length === 0) return
        setBestPts(data[0].total)
        setWorstPts(data[data.length - 1].total)
      })
  }, [session])

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


      {/* Stats card — skeleton while loading */}
      {leaderboardLoading && session && (
        <div className="shimmer" style={{
          borderRadius: '20px',
          height: '88px',
          marginBottom: '12px',
          border: '1.5px solid var(--border-subtle)',
        }} />
      )}

      {/* Stats card — populated */}
      {!leaderboardLoading && myRow && (
        <div style={{
          background: 'var(--card)',
          borderRadius: '20px',
          padding: '16px 20px',
          border: '1.5px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          marginBottom: '12px',
        }}>
          <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>
            Season Stats
          </p>
          {seasonStarted ? (
            <>
              {/* Row 1: Rank + Matches */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'center', marginBottom: '12px' }}>
                <StatCell label="Rank" value={`#${myRow.rank}`} />
                <StatCell label="Matches" value={myRow.matches_played ?? 0} />
              </div>
              {/* Row 2: Match pts / Season pts / Fantasy XI pts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <StatCell label="Match" value={myRow.match_pts ?? 0} />
                <StatCell label="Season" value={myRow.season_pts ?? 0} />
                <StatCell label="Fantasy XI" value={myRow.fantasy_xi_pts ?? 0} />
              </div>
              {(bestPts !== null || worstPts !== null) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', textAlign: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                  <StatCell label="Best match" value={bestPts >= 0 ? `+${bestPts}` : `${bestPts}`} positive={bestPts > 0} />
                  <StatCell label="Worst match" value={worstPts >= 0 ? `+${worstPts}` : `${worstPts}`} negative={worstPts < 0} />
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <p className="font-display font-black" style={{ fontSize: '28px', color: 'var(--text-muted)', margin: '0 0 4px', letterSpacing: '-1px' }}>— — —</p>
              <p className="font-body text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>
                Points and rankings activate after Match 1 🏏
              </p>
            </div>
          )}
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

            {/* Fantasy XI */}
            <Section label="Fantasy XI — your squad for the whole season">
              <p className="font-body text-sm" style={{ color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>
                Pick 11 players before Match 1. Your squad earns points after every game automatically — based on what they actually do on the pitch.
              </p>

              {/* Composition */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                {[
                  { role: 'Wicket-Keepers', req: 'min 1' },
                  { role: 'Batsmen', req: 'min 3' },
                  { role: 'All-Rounders', req: 'min 1' },
                  { role: 'Bowlers', req: 'min 3' },
                  { role: 'Overseas players', req: 'max 4' },
                ].map(r => (
                  <div key={r.role} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="font-body text-xs" style={{ color: 'var(--text-secondary)' }}>{r.role}</span>
                    <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.req}</span>
                  </div>
                ))}
              </div>

              {/* Captain / VC */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {[{ label: 'Captain', mult: '2×', color: '#b45309' }, { label: 'Vice Captain', mult: '1.5×', color: '#6b7280' }].map(({ label, mult, color }) => (
                  <div key={label} style={{ flex: 1, padding: '8px 10px', borderRadius: '10px', border: `1.5px solid ${color}22`, background: `${color}08`, textAlign: 'center' }}>
                    <p className="font-display font-black" style={{ fontSize: '18px', color, margin: '0 0 1px', letterSpacing: '-0.5px' }}>{mult}</p>
                    <p className="font-body text-xs" style={{ color: 'var(--text-muted)', margin: 0 }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Batting scoring */}
              <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', margin: '0 0 6px' }}>Batting</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                {[
                  { label: 'Per run', pts: '+1' },
                  { label: 'Boundary (4)', pts: '+1' },
                  { label: 'Six', pts: '+2' },
                  { label: 'Duck (faced ≥1 ball)', pts: '−2' },
                  { label: '25 runs', pts: '+4 bonus' },
                  { label: '50 runs', pts: '+4 more' },
                  { label: '100 runs', pts: '+8 more' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="font-body text-xs" style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                    <span className="font-mono font-bold" style={{ fontSize: '11px', color: r.pts.startsWith('−') ? '#EF4444' : 'var(--team-primary)' }}>{r.pts}</span>
                  </div>
                ))}
              </div>

              <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', margin: '0 0 4px' }}>Strike Rate bonus</p>
              <p className="font-body" style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 6px', lineHeight: 1.4 }}>Min 10 balls faced.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '12px' }}>
                {[
                  { label: 'SR ≥ 170', pts: '+6' },
                  { label: 'SR ≥ 150', pts: '+4' },
                  { label: 'SR ≥ 130', pts: '+2' },
                  { label: 'SR < 70',  pts: '−2' },
                  { label: 'SR < 60',  pts: '−4' },
                  { label: 'SR < 50',  pts: '−6' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="font-body text-xs" style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                    <span className="font-mono font-bold" style={{ fontSize: '11px', color: r.pts.startsWith('−') ? '#EF4444' : 'var(--team-primary)' }}>{r.pts}</span>
                  </div>
                ))}
              </div>

              {/* Bowling scoring */}
              <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', margin: '0 0 6px' }}>Bowling</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                {[
                  { label: 'Per wicket', pts: '+25' },
                  { label: 'LBW or bowled bonus', pts: '+8' },
                  { label: 'Maiden over', pts: '+12' },
                  { label: '2-wicket haul', pts: '+4 bonus' },
                  { label: '3-wicket haul', pts: '+8 bonus' },
                  { label: '4-wicket haul', pts: '+12 bonus' },
                  { label: '5-wicket haul', pts: '+20 bonus' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="font-body text-xs" style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                    <span className="font-mono font-bold" style={{ fontSize: '11px', color: 'var(--team-primary)' }}>{r.pts}</span>
                  </div>
                ))}
              </div>

              <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', margin: '0 0 4px' }}>Economy bonus</p>
              <p className="font-body" style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 6px', lineHeight: 1.4 }}>Min 2 overs bowled.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '12px' }}>
                {[
                  { label: 'Economy < 5', pts: '+8' },
                  { label: 'Economy < 6', pts: '+6' },
                  { label: 'Economy < 7', pts: '+2' },
                  { label: 'Economy ≥ 9',  pts: '−2' },
                  { label: 'Economy ≥ 10', pts: '−4' },
                  { label: 'Economy ≥ 11', pts: '−6' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="font-body text-xs" style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                    <span className="font-mono font-bold" style={{ fontSize: '11px', color: r.pts.startsWith('−') ? '#EF4444' : 'var(--team-primary)' }}>{r.pts}</span>
                  </div>
                ))}
              </div>

              {/* Fielding */}
              <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', margin: '0 0 6px' }}>Fielding</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  { label: 'Catch', pts: '+8' },
                  { label: 'Stumping', pts: '+12' },
                  { label: 'Run-out', pts: '+8' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="font-body text-xs" style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                    <span className="font-mono font-bold" style={{ fontSize: '11px', color: 'var(--team-primary)' }}>{r.pts}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Divider />

            {/* Season picks */}
            <Section label="Season Picks — lock before Match 1">
              <p className="font-body text-sm" style={{ color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>
                One set of tournament predictions, locked before the first ball. Scored at the end of the season. Bold, contrarian picks earn more.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Top 4 teams', pts: '+30 each', desc: 'Pick 4 teams to make the playoffs.' },
                  { label: 'Champion', pts: '+200', desc: 'Pick the IPL 2026 winner.' },
                  { label: 'Runner-Up', pts: '+100', desc: 'Pick the finalist who loses.' },
                  { label: 'Wooden Spoon', pts: 'up to +100', desc: 'Pick the last-place team. Contrarian multiplier — solo pick earns 2×.' },
                  { label: 'Orange Cap', pts: 'up to +80', desc: 'Pick 3 players for most runs. Partial credit + contrarian multiplier per pick.' },
                  { label: 'Purple Cap', pts: 'up to +80', desc: 'Pick 3 players for most wickets.' },
                  { label: 'Most Sixes', pts: 'up to +60', desc: 'Pick 3 players for most sixes hit.' },
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

              <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '10px', background: 'var(--surface-subtle)', border: '1px solid var(--border-subtle)' }}>
                <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', marginBottom: '6px' }}>Contrarian Multiplier</p>
                {[
                  { label: 'Only you picked it', mult: '2×' },
                  { label: '2 people picked it', mult: '1.5×' },
                  { label: '3+ picked it', mult: '1×' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <p className="font-body text-xs" style={{ color: 'var(--text-secondary)', margin: 0 }}>{row.label}</p>
                    <span className="font-mono font-bold" style={{ fontSize: '12px', color: 'var(--team-primary)' }}>{row.mult}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Divider />

            <p className="font-body text-xs" style={{ color: 'var(--text-muted)', margin: '12px 0 0', lineHeight: 1.5 }}>
              Fantasy XI: picked once, earns all season · Season Picks: scored at tournament end · Good combined total: <strong style={{ color: 'var(--text-secondary)' }}>500–800 pts</strong>
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

function StatCell({ label, value, positive, negative }) {
  const color = positive ? 'var(--team-primary)' : negative ? '#EF4444' : 'var(--text-primary)'
  return (
    <div>
      <p className="font-display font-black" style={{ fontSize: '20px', color, margin: 0, letterSpacing: '-0.5px' }}>{value}</p>
      <p className="font-body text-xs" style={{ color: 'var(--text-muted)', margin: '2px 0 0' }}>{label}</p>
    </div>
  )
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
