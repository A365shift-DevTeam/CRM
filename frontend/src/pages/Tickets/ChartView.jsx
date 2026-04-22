import React from 'react';
import { Card, Row, Col, ProgressBar } from 'react-bootstrap';
import { AlertCircle, Clock, CheckCircle, Zap } from 'lucide-react';

export const ChartView = ({ tickets }) => {
    const totalTickets = tickets.length;

    const getDistribution = (key) => {
        const dist = {};
        tickets.forEach(t => {
            const val = t[key] || 'Unknown';
            dist[val] = (dist[val] || 0) + 1;
        });
        return Object.entries(dist)
            .sort((a, b) => b[1] - a[1]) // Sort by count desc
            .map(([label, count]) => ({
                label,
                count,
                percentage: Math.round((count / (totalTickets || 1)) * 100)
            }));
    };

    const statusDist = getDistribution('status');
    const priorityDist = getDistribution('priority');

    return (
        <div className="tickets-chart-view mt-3">
            <Row className="g-4">
                {/* Status Distribution */}
                <Col md={6}>
                    <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                        <Card.Body>
                            <div className="d-flex align-items-center gap-2 mb-4">
                                <div className="p-2 bg-primary-subtle rounded-3 text-primary">
                                    <Clock size={20} />
                                </div>
                                <h6 className="mb-0 fw-bold text-secondary">Status Distribution</h6>
                            </div>

                            <div className="d-flex flex-column gap-3">
                                {statusDist.map((item, idx) => (
                                    <div key={idx}>
                                        <div className="d-flex justify-content-between mb-1 small">
                                            <span className="fw-medium">{item.label}</span>
                                            <span className="text-muted">{item.count} ({item.percentage}%)</span>
                                        </div>
                                        <ProgressBar
                                            now={item.percentage}
                                            variant={item.label === 'Resolved' || item.label === 'Closed' ? 'success' : item.label === 'In Progress' ? 'primary' : 'warning'}
                                            style={{ height: '8px', borderRadius: '4px' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Priority Distribution */}
                <Col md={6}>
                    <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                        <Card.Body>
                            <div className="d-flex align-items-center gap-2 mb-4">
                                <div className="p-2 bg-danger-subtle rounded-3 text-danger">
                                    <Zap size={20} />
                                </div>
                                <h6 className="mb-0 fw-bold text-secondary">Priority Distribution</h6>
                            </div>

                            <div className="d-flex flex-column gap-3">
                                {priorityDist.map((item, idx) => (
                                    <div key={idx}>
                                        <div className="d-flex justify-content-between mb-1 small">
                                            <span className="fw-medium">{item.label}</span>
                                            <span className="text-muted">{item.count} ({item.percentage}%)</span>
                                        </div>
                                        <ProgressBar
                                            now={item.percentage}
                                            variant={item.label === 'Critical' ? 'danger' : item.label === 'High' ? 'warning' : 'info'}
                                            style={{ height: '8px', borderRadius: '4px' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};
