import { useMemo } from 'react'
import { Row, Col, Card } from 'react-bootstrap'
import { BarChart3, PieChart, TrendingUp, Calendar } from 'lucide-react'

export const ChartView = ({ tasks, columns }) => {
  const visibleColumns = columns.filter(col => col && col.visible !== false)

  // Get choice columns for charting
  const choiceColumns = visibleColumns.filter(col => col.type === 'choice' || col.type === 'dropdown')
  const dateColumns = visibleColumns.filter(col => col.type === 'datetime')

  // Calculate statistics for choice columns
  const choiceColumnStats = useMemo(() => {
    return choiceColumns.map(column => {
      const stats = {}
      const options = column.config?.options || []

      // Normalize options to get labels
      const normalizedOptions = options.map(opt => {
        if (typeof opt === 'string') return opt
        return opt.label || ''
      })

      // Initialize counts
      normalizedOptions.forEach(opt => {
        if (opt) stats[opt] = 0
      })

      // Count tasks by option value
      tasks.forEach(task => {
        const value = task.values?.[column.id]
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => {
              const valStr = String(v).trim()
              if (stats[valStr] !== undefined) {
                stats[valStr]++
              }
            })
          } else {
            const valStr = String(value).trim()
            if (stats[valStr] !== undefined) {
              stats[valStr]++
            }
          }
        }
      })

      return {
        column,
        stats,
        total: Object.values(stats).reduce((sum, count) => sum + count, 0)
      }
    })
  }, [choiceColumns, tasks])

  // Calculate date-based statistics (tasks by month)
  const dateStats = useMemo(() => {
    if (dateColumns.length === 0) return null

    const dateColumn = dateColumns[0] // Use first date column
    const monthlyStats = {}

    tasks.forEach(task => {
      const dateValue = task.values?.[dateColumn.id]
      if (dateValue) {
        try {
          const date = new Date(dateValue)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + 1
        } catch (e) {
          // Invalid date, skip
        }
      }
    })

    return {
      column: dateColumn,
      stats: monthlyStats,
      total: Object.values(monthlyStats).reduce((sum, count) => sum + count, 0)
    }
  }, [dateColumns, tasks])

  // Get option color for choice columns
  const getOptionColor = (column, optionLabel, index) => {
    const options = column.config?.options || []
    const option = options.find(opt => {
      if (typeof opt === 'string') return opt === optionLabel
      return opt.label === optionLabel
    })

    if (option && typeof option === 'object' && option.color) {
      return option.color
    }

    // Default colors
    const defaultColors = ['#0078d4', '#107c10', '#ffaa44', '#e81123', '#8764b8', '#00bcf2', '#ff8c00', '#737373']
    return defaultColors[index % defaultColors.length]
  }

  // Bar Chart Component
  const BarChart = ({ data, title, column }) => {
    const maxValue = Math.max(...Object.values(data.stats), 1)
    const entries = Object.entries(data.stats).filter(([_, count]) => count > 0)

    if (entries.length === 0) {
      return (
        <Card className="h-100">
          <Card.Body>
            <h6 className="d-flex align-items-center gap-2 mb-3">
              <BarChart3 size={18} />
              {title}
            </h6>
            <p className="text-muted text-center py-3">No data available</p>
          </Card.Body>
        </Card>
      )
    }

    return (
      <Card className="h-100">
        <Card.Body>
          <h6 className="d-flex align-items-center gap-2 mb-3">
            <BarChart3 size={18} />
            {title}
          </h6>
          <div className="bar-chart-container">
            {entries.map(([label, count], index) => {
              const percentage = (count / maxValue) * 100
              const color = getOptionColor(column, label, index)
              return (
                <div key={label} className="bar-chart-item mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="bar-label">{label}</span>
                    <span className="bar-value">{count}</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card.Body>
      </Card>
    )
  }

  // Pie Chart Component
  const PieChartComponent = ({ data, title, column }) => {
    const entries = Object.entries(data.stats).filter(([_, count]) => count > 0)

    if (entries.length === 0) {
      return (
        <Card className="h-100">
          <Card.Body>
            <h6 className="d-flex align-items-center gap-2 mb-3">
              <PieChart size={18} />
              {title}
            </h6>
            <p className="text-muted text-center py-3">No data available</p>
          </Card.Body>
        </Card>
      )
    }

    // Calculate angles for pie chart
    let currentAngle = -90 // Start from top
    const segments = entries.map(([label, count], index) => {
      const percentage = (count / data.total) * 100
      const angle = (percentage / 100) * 360
      const startAngle = currentAngle
      currentAngle += angle
      const color = getOptionColor(column, label, index)

      return {
        label,
        count,
        percentage,
        startAngle,
        angle,
        color
      }
    })

    // Generate SVG path for pie slice
    const createPieSlice = (startAngle, angle, radius = 80) => {
      const start = (startAngle * Math.PI) / 180
      const end = ((startAngle + angle) * Math.PI) / 180
      const x1 = 100 + radius * Math.cos(start)
      const y1 = 100 + radius * Math.sin(start)
      const x2 = 100 + radius * Math.cos(end)
      const y2 = 100 + radius * Math.sin(end)
      const largeArc = angle > 180 ? 1 : 0

      return `M 100 100 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
    }

    return (
      <Card className="h-100">
        <Card.Body>
          <h6 className="d-flex align-items-center gap-2 mb-3">
            <PieChart size={18} />
            {title}
          </h6>
          <div className="d-flex align-items-center justify-content-center">
            <div className="pie-chart-container">
              <svg width="200" height="200" viewBox="0 0 200 200">
                {segments.map((segment, index) => (
                  <path
                    key={segment.label}
                    d={createPieSlice(segment.startAngle, segment.angle)}
                    fill={segment.color}
                    stroke="#fff"
                    strokeWidth="2"
                    className="pie-segment"
                  />
                ))}
              </svg>
              <div className="pie-chart-legend">
                {segments.map((segment, index) => (
                  <div key={segment.label} className="pie-legend-item">
                    <div
                      className="pie-legend-color"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="pie-legend-label">{segment.label}</span>
                    <span className="pie-legend-value">({segment.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
    )
  }

  // Summary Statistics Cards
  const SummaryCard = ({ icon: Icon, title, value, subtitle }) => (
    <Card className="h-100">
      <Card.Body>
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <p className="text-muted mb-1 small">{title}</p>
            <h4 className="mb-0">{value}</h4>
            {subtitle && <small className="text-muted">{subtitle}</small>}
          </div>
          <div className="summary-icon">
            <Icon size={32} />
          </div>
        </div>
      </Card.Body>
    </Card>
  )

  // Line Chart for Date-based data
  const LineChart = ({ data, title }) => {
    if (!data || data.total === 0) {
      return (
        <Card className="h-100">
          <Card.Body>
            <h6 className="d-flex align-items-center gap-2 mb-3">
              <TrendingUp size={18} />
              {title}
            </h6>
            <p className="text-muted text-center py-3">No date data available</p>
          </Card.Body>
        </Card>
      )
    }

    const entries = Object.entries(data.stats)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // Show last 6 months

    const maxValue = Math.max(...entries.map(([_, count]) => count), 1)
    const chartHeight = 200

    return (
      <Card className="h-100">
        <Card.Body>
          <h6 className="d-flex align-items-center gap-2 mb-3">
            <TrendingUp size={18} />
            {title}
          </h6>
          <div className="line-chart-container" style={{ height: `${chartHeight}px` }}>
            <svg width="100%" height={chartHeight} viewBox={`0 0 ${entries.length * 60} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0078d4" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0078d4" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                <line
                  key={ratio}
                  x1="0"
                  y1={chartHeight * ratio}
                  x2={entries.length * 60}
                  y2={chartHeight * ratio}
                  stroke="#e9ecef"
                  strokeWidth="1"
                />
              ))}

              {/* Area under line */}
              {entries.length > 0 && (
                <path
                  d={`M 0 ${chartHeight} ${entries.map(([_, count], index) =>
                    `L ${index * 60 + 30} ${chartHeight - (count / maxValue) * chartHeight * 0.8}`
                  ).join(' ')} L ${(entries.length - 1) * 60 + 30} ${chartHeight} Z`}
                  fill="url(#lineGradient)"
                />
              )}

              {/* Line */}
              {entries.length > 1 && (
                <polyline
                  points={entries.map(([_, count], index) =>
                    `${index * 60 + 30},${chartHeight - (count / maxValue) * chartHeight * 0.8}`
                  ).join(' ')}
                  fill="none"
                  stroke="#0078d4"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points */}
              {entries.map(([label, count], index) => {
                const y = chartHeight - (count / maxValue) * chartHeight * 0.8
                return (
                  <g key={label}>
                    <circle
                      cx={index * 60 + 30}
                      cy={y}
                      r="5"
                      fill="#0078d4"
                      stroke="#fff"
                      strokeWidth="2"
                    />
                    <text
                      x={index * 60 + 30}
                      y={y - 15}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="600"
                      fill="#495057"
                    >
                      {count}
                    </text>
                    <text
                      x={index * 60 + 30}
                      y={chartHeight - 10}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#6c757d"
                    >
                      {label.split('-')[1] || label}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </Card.Body>
      </Card>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center text-muted py-5">
        <BarChart3 size={48} className="mb-3" style={{ opacity: 0.3 }} />
        <p>No tasks available to display charts.</p>
        <p>Create some tasks to see visualizations.</p>
      </div>
    )
  }

  return (
    <div className="chart-view-container">
      {/* Summary Statistics */}
      <Row className="mb-4">
        <Col md={3}>
          <SummaryCard
            icon={BarChart3}
            title="Total Tasks"
            value={tasks.length}
            subtitle="All tasks"
          />
        </Col>
        <Col md={3}>
          <SummaryCard
            icon={PieChart}
            title="Choice Columns"
            value={choiceColumns.length}
            subtitle="Available for charting"
          />
        </Col>
        <Col md={3}>
          <SummaryCard
            icon={Calendar}
            title="Date Columns"
            value={dateColumns.length}
            subtitle="Time-based data"
          />
        </Col>
        <Col md={3}>
          <SummaryCard
            icon={TrendingUp}
            title="Columns"
            value={visibleColumns.length}
            subtitle="Total visible"
          />
        </Col>
      </Row>

      {/* Choice Column Charts */}
      {choiceColumnStats.length > 0 && (
        <Row className="mb-4">
          {choiceColumnStats.map((stat, index) => (
            <Col key={stat.column.id} md={6} className="mb-3">
              <BarChart
                data={stat}
                title={`${stat.column.name} Distribution`}
                column={stat.column}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* Pie Charts for Choice Columns */}
      {choiceColumnStats.length > 0 && (
        <Row className="mb-4">
          {choiceColumnStats.map((stat, index) => (
            <Col key={`pie-${stat.column.id}`} md={6} className="mb-3">
              <PieChartComponent
                data={stat}
                title={`${stat.column.name} Breakdown`}
                column={stat.column}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* Date-based Line Chart */}
      {dateStats && (
        <Row>
          <Col md={12}>
            <LineChart
              data={dateStats}
              title={`Tasks Over Time - ${dateStats.column.name}`}
            />
          </Col>
        </Row>
      )}

      {choiceColumnStats.length === 0 && !dateStats && (
        <Card>
          <Card.Body className="text-center py-5">
            <BarChart3 size={48} className="mb-3" style={{ opacity: 0.3 }} />
            <h5>No Chart Data Available</h5>
            <p className="text-muted">
              Add Choice or Date columns to see visualizations.
            </p>
          </Card.Body>
        </Card>
      )}
    </div>
  )
}
