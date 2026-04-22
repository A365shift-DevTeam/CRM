import React from 'react';
import { Card, Row, Col, ProgressBar } from 'react-bootstrap';
import { FileText, Clock, AlertTriangle } from 'lucide-react';

export const ChartView = ({ agreements }) => {
    const totalAgreements = agreements.length;

    const getDistribution = (key) => {
        const dist = {};
        agreements.forEach(a => {
            const val = a[key] || 'Unknown';
            dist[val] = (dist[val] || 0) + 1;
        });
        return Object.entries(dist)
            .sort((a, b) => b[1] - a[1]) // Sort by count desc
            .map(([label, count]) => ({
                label,
                count,
                percentage: Math.round((count / (totalAgreements || 1)) * 100)
            }));
    };

    const typeDist = getDistribution('type');
    const statusDist = getDistribution('status');

    return (
        <div className="legal-chart-view mt-3">
            <Row className="g-4">
                {/* Type Distribution */}
                <Col md={6}>
                    <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                        <Card.Body>
                            <div className="d-flex align-items-center gap-2 mb-4">
                                <div className="p-2 bg-primary-subtle rounded-3 text-primary">
                                    <FileText size={20} />
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
                                            variant={idx % 3 === 0 ? 'primary' : idx % 3 === 1 ? 'info' : 'success'}
                                            style={{ height: '8px', borderRadius: '4px' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Status Distribution */}
                <Col md={6}>
                    <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                        <Card.Body>
                            <div className="d-flex align-items-center gap-2 mb-4">
                                <div className="p-2 bg-warning-subtle rounded-3 text-warning">
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
                                            variant={item.label === 'Signed' || item.label === 'Approved' ? 'success' : item.label === 'Expired' || item.label === 'Terminated' ? 'danger' : 'warning'}
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
