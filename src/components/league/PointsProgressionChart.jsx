import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, ReferenceLine,
} from 'recharts'
import { getTeam } from '../../lib/content'

const FALLBACK_COLORS = ['#e11d48', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2']

export function PointsProgressionChart({ chartData, players }) {
  if (!chartData?.length || !players?.length) return null

  return (
    <div style={{
      padding: '16px',
      borderRadius: '20px',
      background: 'var(--card)',
      border: '1.5px solid var(--border-subtle)',
      boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
    }}>
      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 16px', marginBottom: '16px' }}>
        {players.map((p, i) => {
          const color = getTeam(p.team)?.colors?.primary ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]
          return (
            <div key={p.user_id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span className="font-body text-xs" style={{ color: 'var(--text-secondary)' }}>
                {p.display_name}
              </span>
              <span className="font-mono text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                {p.finalPts > 0 ? '+' : ''}{p.finalPts}
              </span>
            </div>
          )
        })}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <XAxis
            dataKey="match"
            tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontFamily: 'var(--font-mono)', fontSize: 10, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <ReferenceLine y={0} stroke="var(--border-subtle)" strokeDasharray="3 3" />
          <Tooltip content={<CustomTooltip players={players} />} />
          {players.map((p, i) => {
            const color = getTeam(p.team)?.colors?.primary ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]
            return (
              <Line
                key={p.user_id}
                type="monotone"
                dataKey={p.display_name}
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            )
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function CustomTooltip({ active, payload, label, players }) {
  if (!active || !payload?.length) return null

  // Sort tooltip entries by value desc
  const sorted = [...payload].sort((a, b) => b.value - a.value)

  return (
    <div style={{
      background: 'var(--card)',
      border: '1.5px solid var(--border-subtle)',
      borderRadius: '12px',
      padding: '10px 12px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      minWidth: '120px',
    }}>
      <p className="font-mono text-xs mb-2" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </p>
      {sorted.map(entry => (
        <div key={entry.dataKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
            <span className="font-body text-xs" style={{ color: 'var(--text-secondary)' }}>{entry.dataKey}</span>
          </div>
          <span className="font-mono text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  )
}
