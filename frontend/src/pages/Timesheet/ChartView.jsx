import React from 'react'
import { Card, Row, Col, ProgressBar } from 'react-bootstrap'
import { CheckCircle, Building, Users } from 'lucide-react'

export const ChartView = ({ entries }) => {
  const totalEntries = entries.length

  const getDistribution = (columnId) => {
    const dist = {}
    entries.forEach(entry => {
      const val = entry.values?.[columnId] || 'Unknown'
      dist[val] = (dist[val] || 0) + 1
    })
    return Object.entries(dist)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({
        label,
        count,
        percentage: totalEntries > 0 ? Math.round((count / totalEntries) * 100) : 0
      }))
  }

  const taskDist = getDistribution('col-task')
  const customerDist = getDistribution('col-customer')
  const userDist = getDistribution('col-name')

  return (
    <div className="timesheet-chart-view">
      <Row className="g-4">
        {/* Task Distribution */}
        <Col md={6} lg={4}>
          <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <Card.Body>
              <div className="d-flex align-items-center gap-2 mb-4">
                <div className="p-2 bg-primary-subtle rounded-3 text-primary">
                  <CheckCircle size={20} />
                </div>
                <h6 className="mb-0 fw-bold text-secondary">Task Distribution</h6>
              </div>
              <div className="d-flex flex-column gap-3">
                {taskDist.slice(0, 8).map((item, idx) => (
                  <div key={idx}>
                    <div className="d-flex justify-content-between mb-1 small">
                      <span className="fw-medium text-truncate" style={{ maxWidth: '70%' }} title={item.label}>{item.label}</span>
                      <span className="text-muted">{item.count} ({item.percentage}%)</span>
                    </div>
                    <ProgressBar
                      now={item.percentage}
                      variant={idx === 0 ? 'success' : idx === 1 ? 'primary' : 'info'}
                      style={{ height: '8px', borderRadius: '4px' }}
                    />
                  </div>
                ))}
                {taskDist.length === 0 && (
                  <div className="text-center text-muted small py-3">No data available</div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Customer Distribution */}
        <Col md={6} lg={4}>
          <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <Card.Body>
              <div className="d-flex align-items-center gap-2 mb-4">
                <div className="p-2 bg-warning-subtle rounded-3 text-warning">
                  <Building size={20} />
                </div>
                <h6 className="mb-0 fw-bold text-secondary">Customer Distribution</h6>
              </div>
              <div className="d-flex flex-column gap-3">
                {customerDist.slice(0, 8).map((item, idx) => (
                  <div key={idx}>
                    <div className="d-flex justify-content-between mb-1 small">
                      <span className="fw-medium text-truncate" style={{ maxWidth: '70%' }} title={item.label}>{item.label}</span>
                      <span className="text-muted">{item.count} ({item.percentage}%)</span>
                    </div>
                    <ProgressBar
                      now={item.percentage}
                      variant="warning"
                      style={{ height: '8px', borderRadius: '4px' }}
                    />
                  </div>
                ))}
                {customerDist.length === 0 && (
                  <div className="text-center text-muted small py-3">No data available</div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Users Distribution */}
        <Col md={6} lg={4}>
          <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <Card.Body>
              <div className="d-flex align-items-center gap-2 mb-4">
                <div className="p-2 bg-info-subtle rounded-3 text-info">
                  <Users size={20} />
                </div>
                <h6 className="mb-0 fw-bold text-secondary">Entries by Person</h6>
              </div>
              <div className="d-flex flex-column gap-3">
                {userDist.slice(0, 8).map((item, idx) => (
                  <div key={idx}>
                    <div className="d-flex justify-content-between mb-1 small">
                      <span className="fw-medium text-truncate" style={{ maxWidth: '70%' }} title={item.label}>{item.label}</span>
                      <span className="text-muted">{item.count}</span>
                    </div>
                    <ProgressBar
                      now={item.percentage}
                      variant="info"
                      style={{ height: '8px', borderRadius: '4px' }}
                    />
                  </div>
                ))}
                {userDist.length === 0 && (
                  <div className="text-center text-muted small py-3">No data available</div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
