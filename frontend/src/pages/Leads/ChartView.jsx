import React from 'react';
import { Card, Row, Col, ProgressBar } from 'react-bootstrap';
import { Target, Flag, Zap } from 'lucide-react';

export const ChartView = ({ leads }) => {
    const totalLeads = leads.length;

    const getDistribution = (key) => {
        const dist = {};
        leads.forEach(l => {
            const val = l[key] || 'Unknown';
            dist[val] = (dist[val] || 0) + 1;
        });
        return Object.entries(dist)
            .sort((a, b) => b[1] - a[1]) // Sort by count desc
            .map(([label, count]) => ({
                label,
                count,
                percentage: Math.round((count / (totalLeads || 1)) * 100)
            }));
    };

    const stageDist = getDistribution('stage');
    const scoreDist = getDistribution('score');
    const sourceDist = getDistribution('source');

    return (
        <div className="leads-chart-view mt-3">
            <Row className="g-4">
                {/* Stage Distribution */}
                <Col md={6} lg={4}>
                    <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                        <Card.Body>
                            <div className="d-flex align-items-center gap-2 mb-4">
                                <div className="p-2 bg-primary-subtle rounded-3 text-primary">
                                    <Flag size={20} />
                                </div>
                                <h6 className="mb-0 fw-bold text-secondary">Stage Distribution</h6>
                            </div>

                            <div className="d-flex flex-column gap-3">
                                {stageDist.map((item, idx) => (
                                    <div key={idx}>
                                        <div className="d-flex justify-content-between mb-1 small">
                                            <span className="fw-medium">{item.label}</span>
                                            <span className="text-muted">{item.count} ({item.percentage}%)</span>
                                        </div>
                                        <ProgressBar
                                            now={item.percentage}
                                            variant={idx === 0 ? 'success' : idx === 1 ? 'primary' : 'info'}
                                            style={{ height: '8px', borderRadius: '4px' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Score Distribution */}
                <Col md={6} lg={4}>
                    <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                        <Card.Body>
                            <div className="d-flex align-items-center gap-2 mb-4">
                                <div className="p-2 bg-danger-subtle rounded-3 text-danger">
                                    <Target size={20} />
                                </div>
                                <h6 className="mb-0 fw-bold text-secondary">Score Distribution</h6>
                            </div>

                            <div className="d-flex flex-column gap-3">
                                {scoreDist.map((item, idx) => (
                                    <div key={idx}>
                                        <div className="d-flex justify-content-between mb-1 small">
                                            <span className="fw-medium">{item.label}</span>
                                            <span className="text-muted">{item.count} ({item.percentage}%)</span>
                                        </div>
                                        <ProgressBar
                                            now={item.percentage}
                                            variant={item.label === 'Hot' ? 'danger' : item.label === 'Warm' ? 'warning' : 'primary'}
                                            style={{ height: '8px', borderRadius: '4px' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Source Distribution */}
                <Col md={6} lg={4}>
                    <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                        <Card.Body>
                            <div className="d-flex align-items-center gap-2 mb-4">
                                <div className="p-2 bg-info-subtle rounded-3 text-info">
                                    <Zap size={20} />
                                </div>
                                <h6 className="mb-0 fw-bold text-secondary">Source Distribution</h6>
                            </div>

                            <div className="d-flex flex-column gap-3">
                                {sourceDist.map((item, idx) => (
                                    <div key={idx}>
                                        <div className="d-flex justify-content-between mb-1 small">
                                            <span className="fw-medium">{item.label}</span>
                                            <span className="text-muted">{item.count}</span>
                                        </div>
                                        <ProgressBar
                                            now={item.percentage}
                                            variant="info"
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
