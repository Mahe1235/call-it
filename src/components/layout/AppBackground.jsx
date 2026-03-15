/**
 * Full-viewport fixed background layer.
 * Renders all 10 IPL team logos scattered at very low opacity,
 * peeking from edges and visible in header / footer margins.
 * position:fixed + z-index:-1 means it sits behind all page content.
 * Switches colours based on ThemeContext (light / dark).
 */
import { useTheme } from '../../contexts/ThemeContext'

const IPL_LOGO_BASE = 'https://scores.iplt20.com/ipl/teamlogos'

function logo(shortName) {
  return `${IPL_LOGO_BASE}/${shortName}.png`
}

/*
  Each placement: { src, pos (CSS position props), size (px), rot (deg), op (opacity) }

  Strategy:
  - Top strip  (top 0-10%)  — logos visible above the first card
  - Left edge  (left -8→0)  — logos peek in from the left, clipped by overflow:hidden
  - Right edge (right -8→0) — same from right
  - Bottom strip (bottom 0-5%) — visible above the bottom nav
  - A few mid-screen for desktop (they'll sit behind white cards on mobile, harmless)
*/
const PLACEMENTS = [
  // ── TOP STRIP ─────────────────────────────────────────────────
  { src: logo('MI'),   pos: { top: '1%',    left: '2%'    }, size: 74, rot: -12, op: 0.09 },
  { src: logo('RR'),   pos: { top: '3%',    left: '24%'   }, size: 52, rot: 22,  op: 0.07 },
  { src: logo('SRH'),  pos: { top: '0%',    left: '53%'   }, size: 66, rot: -7,  op: 0.08 },
  { src: logo('GT'),   pos: { top: '2%',    right: '2%'   }, size: 80, rot: 18,  op: 0.09 },

  // ── LEFT EDGE ─────────────────────────────────────────────────
  { src: logo('CSK'),  pos: { top: '15%',   left: '-12px' }, size: 80, rot: 14,  op: 0.10 },
  { src: logo('RCB'),  pos: { top: '27%',   left: '-8px'  }, size: 62, rot: -19, op: 0.09 },
  { src: logo('KKR'),  pos: { top: '41%',   left: '-16px' }, size: 86, rot: 9,   op: 0.10 },
  { src: logo('LSG'),  pos: { top: '55%',   left: '-10px' }, size: 68, rot: -24, op: 0.09 },
  { src: logo('PBKS'), pos: { top: '69%',   left: '-14px' }, size: 78, rot: 20,  op: 0.10 },
  { src: logo('DC'),   pos: { top: '82%',   left: '-6px'  }, size: 58, rot: -9,  op: 0.09 },

  // ── RIGHT EDGE ────────────────────────────────────────────────
  { src: logo('MI'),   pos: { top: '13%',   right: '-12px'}, size: 84, rot: -16, op: 0.10 },
  { src: logo('GT'),   pos: { top: '26%',   right: '-8px' }, size: 64, rot: 23,  op: 0.09 },
  { src: logo('SRH'),  pos: { top: '40%',   right: '-16px'}, size: 90, rot: -11, op: 0.10 },
  { src: logo('RR'),   pos: { top: '53%',   right: '-10px'}, size: 72, rot: 17,  op: 0.09 },
  { src: logo('CSK'),  pos: { top: '67%',   right: '-14px'}, size: 80, rot: -21, op: 0.10 },
  { src: logo('RCB'),  pos: { top: '80%',   right: '-8px' }, size: 62, rot: 11,  op: 0.09 },

  // ── BOTTOM STRIP ──────────────────────────────────────────────
  { src: logo('KKR'),  pos: { bottom: '2%', left: '3%'    }, size: 68, rot: 14,  op: 0.09 },
  { src: logo('LSG'),  pos: { bottom: '1%', left: '36%'   }, size: 52, rot: -21, op: 0.07 },
  { src: logo('PBKS'), pos: { bottom: '3%', left: '63%'   }, size: 74, rot: 7,   op: 0.08 },
  { src: logo('DC'),   pos: { bottom: '0%', right: '3%'   }, size: 64, rot: -14, op: 0.09 },
]

export function AppBackground() {
  const { isDark } = useTheme()

  const base = isDark ? '#141210' : '#F0EBE1'

  const gradients = isDark ? [
    /* Ember glow top-right */
    'radial-gradient(ellipse 70% 50% at 100% -5%, rgba(255,140,40,0.10) 0%, transparent 65%)',
    /* Deep cool bottom-left */
    'radial-gradient(ellipse 60% 45% at -5% 105%, rgba(60,100,80,0.10) 0%, transparent 60%)',
    /* Faint highlight top-centre */
    'radial-gradient(ellipse 50% 30% at 42% 0%, rgba(255,255,255,0.04) 0%, transparent 68%)',
  ] : [
    'radial-gradient(ellipse 70% 50% at 100% -5%, rgba(255,215,120,0.28) 0%, transparent 65%)',
    'radial-gradient(ellipse 60% 45% at -5% 105%, rgba(165,200,180,0.22) 0%, transparent 60%)',
    'radial-gradient(ellipse 50% 30% at 42% 0%, rgba(255,255,255,0.48) 0%, transparent 68%)',
  ]

  const logoFilter = isDark
    ? 'grayscale(10%) contrast(0.85) brightness(1.15)'
    : 'grayscale(15%) contrast(0.9)'

  const logoOpacityMult = isDark ? 1.3 : 1 // slightly more visible on dark

  return (
    <>
      {/* Base layer: canvas colour + ambient gradients + logos */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          overflow: 'hidden',
          pointerEvents: 'none',
          userSelect: 'none',
          backgroundColor: base,
          backgroundImage: gradients.join(','),
          transition: 'background-color 0.3s ease',
        }}
      >
        {PLACEMENTS.map((p, i) => (
          <img
            key={i}
            src={p.src}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              ...p.pos,
              width:  p.size,
              height: p.size,
              objectFit: 'contain',
              opacity: Math.min(p.op * logoOpacityMult, 0.18),
              transform: `rotate(${p.rot}deg)`,
              filter: logoFilter,
            }}
          />
        ))}
      </div>

      {/* Desktop surround vignette */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          pointerEvents: 'none',
          backgroundImage: isDark
            ? 'radial-gradient(ellipse 32% 100% at 50% 50%, transparent 85%, rgba(0,0,0,0.30) 100%)'
            : 'radial-gradient(ellipse 32% 100% at 50% 50%, transparent 85%, rgba(0,0,0,0.12) 100%)',
        }}
      />
    </>
  )
}
