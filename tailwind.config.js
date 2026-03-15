/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Bricolage Grotesque', 'sans-serif'],
        body: ['Familjen Grotesk', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      colors: {
        // Base palette — CSS var driven at runtime
        canvas: '#E8E3D8',
        card: '#FFFFFF',
        primary: '#111111',
        secondary: '#555555',
        muted: '#999999',
        placeholder: '#BBBBBB',
        border: '#E5E5E5',
        // Team theming — driven by --team-* CSS vars injected by TeamThemeProvider
        team: {
          primary: 'var(--team-primary)',
          secondary: 'var(--team-secondary)',
          text: 'var(--team-text-on-primary)',
          tint: 'var(--team-tinted-bg)',
        },
      },
      borderRadius: {
        card: '20px',
        nested: '14px',
        btn: '12px',
        badge: '9px',
      },
    },
  },
  plugins: [],
}
