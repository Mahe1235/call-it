import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/',        label: 'Home',   icon: HomeIcon },
  { to: '/league',  label: 'League', icon: LeagueIcon },
  { to: '/season',  label: 'Season', icon: SeasonIcon },
  { to: '/profile', label: 'You',    icon: ProfileIcon },
]

export function BottomNav() {
  return (
    <nav className="bottom-nav fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] border-t z-50" style={{ background: 'var(--card)', borderColor: 'var(--border)', transition: 'background 0.3s ease' }}>
      <ul className="flex items-center justify-around h-16 px-2">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2 px-3 rounded-btn transition-colors ${
                  isActive
                    ? 'text-[var(--team-primary)]'
                    : 'text-[var(--text-muted)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`w-6 h-6 ${isActive ? 'text-[var(--team-primary)]' : 'text-[var(--text-muted)]'}`}
                  >
                    <Icon />
                  </span>
                  <span className="text-[10px] font-medium font-body tracking-wide uppercase">
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/* ── SVG Icons ────────────────────────────────────────────────── */

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function LeagueIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function SeasonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
