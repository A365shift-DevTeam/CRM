import './StatsGrid.css'

/**
 * StatsGrid — unified stat cards row
 *
 * Props:
 *   stats — array of { label, value, icon, color, valueColor? }
 *     color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | custom hex
 *     icon: ReactNode (lucide icon etc.)
 *     valueColor: optional override for the value text color
 */
export default function StatsGrid({ stats = [] }) {
  if (stats.length === 0) return null

  const getColorClass = (color) => {
    const presets = ['blue', 'green', 'orange', 'purple', 'red']
    return presets.includes(color) ? color : null
  }

  return (
    <div className="sg-grid">
      {stats.map((stat, i) => {
        const colorClass = getColorClass(stat.color)
        const customBg = !colorClass && stat.color ? stat.color : undefined

        return (
          <div key={i} className="sg-card">
            <div className="sg-card-inner">
              <div
                className={`sg-icon-wrapper ${colorClass || ''}`}
                style={customBg ? { background: `${customBg}15`, color: customBg } : undefined}
              >
                {stat.icon}
              </div>
              <div className="sg-content">
                <div className="sg-label">{stat.label}</div>
                <div
                  className="sg-value"
                  style={stat.valueColor ? { color: stat.valueColor } : undefined}
                >
                  {stat.value}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
