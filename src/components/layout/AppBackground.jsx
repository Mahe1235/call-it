/**
 * Full-viewport fixed background layer.
 * Clean ambient gradients only — no logo scatter (logos live on the cards now).
 */
import { useTheme } from '../../contexts/ThemeContext'

export function AppBackground() {
  const { isDark } = useTheme()

  const base = isDark ? '#141210' : '#F0EBE1'

  const gradients = isDark ? [
    'radial-gradient(ellipse 80% 55% at 100% -5%,  rgba(255,120,30,0.11) 0%, transparent 60%)',
    'radial-gradient(ellipse 65% 50% at -5%  105%, rgba(50,90,70,0.10)   0%, transparent 58%)',
    'radial-gradient(ellipse 55% 35% at 42%  0%,   rgba(255,255,255,0.04) 0%, transparent 65%)',
    'radial-gradient(ellipse 40% 40% at 110% 60%,  rgba(180,60,60,0.07)  0%, transparent 55%)',
  ] : [
    'radial-gradient(ellipse 80% 55% at 100% -5%,  rgba(255,210,100,0.30) 0%, transparent 60%)',
    'radial-gradient(ellipse 65% 50% at -5%  105%, rgba(150,195,165,0.24) 0%, transparent 58%)',
    'radial-gradient(ellipse 55% 35% at 42%  0%,   rgba(255,255,255,0.50) 0%, transparent 65%)',
    'radial-gradient(ellipse 40% 40% at 110% 60%,  rgba(220,130,80,0.10)  0%, transparent 55%)',
  ]

  return (
    <>
      {/* Base colour + ambient gradients */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          pointerEvents: 'none',
          userSelect: 'none',
          backgroundColor: base,
          backgroundImage: gradients.join(','),
          transition: 'background-color 0.3s ease',
        }}
      />

      {/* Subtle vignette to frame the mobile column */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          pointerEvents: 'none',
          backgroundImage: isDark
            ? 'radial-gradient(ellipse 32% 100% at 50% 50%, transparent 85%, rgba(0,0,0,0.28) 100%)'
            : 'radial-gradient(ellipse 32% 100% at 50% 50%, transparent 85%, rgba(0,0,0,0.10) 100%)',
        }}
      />
    </>
  )
}
