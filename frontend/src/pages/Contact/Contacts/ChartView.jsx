import React from 'react';
import { Card, Row, Col, ProgressBar } from 'react-bootstrap';
import { PieChart, BarChart, Users, Building, Flag } from 'lucide-react';

export const ChartView = ({ contacts }) => {
    // Calculate Stats
    const totalContacts = contacts.length;

    const getDistribution = (key) => {
        const dist = {};
        contacts.forEach(c => {
            const val = c[key] || 'Unknown';
            dist[val] = (dist[val] || 0) + 1;
        });
        return Object.entries(dist)
            .sort((a, b) => b[1] - a[1]) // Sort by count desc
            .map(([label, count]) => ({
                label,
                count,
                percentage: Math.round((count / totalContacts) * 100)
            }));
    };

    const statusDist = getDistribution('status');
    const typeDist = getDistribution('type');
    const companyDist = getDistribution('company');

    return (
        <div className="contacts-chart-view">
            <Row className="g-4">
                {/* Status Distribution */}
                <Col md={6} lg={4}>
                    <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                        <Card.Body>
                            <div className="d-flex align-items-center gap-2 mb-4">
                                <div className="p-2 bg-primary-subtle rounded-3 text-primary">
                                    <Flag size={20} />
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
                                            variant={idx === 0 ? 'success' : idx === 1 ? 'primary' : 'info'}
                                            style={{ height: '8px', borderRadius: '4px' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Type Distribution */}
                <Col md={6} lg={4}>
                    <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                        <Card.Body>
                            <div className="d-flex align-items-center gap-2 mb-4">
                                <div className="p-2 bg-warning-subtle rounded-3 text-warning">
                                    <Users size={20} />
                                </div>
                                <h6 className="mb-0 fw-bold text-secondary">Type Distribution</h6>
                            </div>

                            <div className="d-flex flex-column gap-3">
                                {typeDist.map((item, idx) => (
                                    <div key={idx}>
                                        <div className="d-flex justify-content-between mb-1 small">
                                            <span className="fw-medium">{item.label}</span>
                                            <span className="text-muted">{item.count} ({item.percentage}%)</span>
                                        </div>
                                        <ProgressBar
                                            now={item.percentage}
                                            variant="warning"
                                            style={{ height: '8px', borderRadius: '4px' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Company Distribution */}
                <Col md={6} lg={4}>
                    <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                        <Card.Body>
                            <div className="d-flex align-items-center gap-2 mb-4">
                                <div className="p-2 bg-info-subtle rounded-3 text-info">
                                    <Building size={20} />
                                </div>
                                <h6 className="mb-0 fw-bold text-secondary">Top Companies</h6>
                            </div>

                            <div className="d-flex flex-column gap-3">
                                {companyDist.slice(0, 5).map((item, idx) => (
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
