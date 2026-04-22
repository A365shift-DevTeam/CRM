import React from 'react';
import { Card, Row, Col, ProgressBar } from 'react-bootstrap';
import { Building, MapPin, Briefcase } from 'lucide-react';

export const ChartView = ({ companies }) => {
    const totalCompanies = companies.length;

    const getDistribution = (key) => {
        const dist = {};
        companies.forEach(c => {
            const val = c[key] || 'Unknown';
            dist[val] = (dist[val] || 0) + 1;
        });
        return Object.entries(dist)
            .sort((a, b) => b[1] - a[1]) // Sort by count desc
            .map(([label, count]) => ({
                label,
                count,
                percentage: Math.round((count / (totalCompanies || 1)) * 100)
            }));
    };

    const industryDist = getDistribution('industry');
    const sizeDist = getDistribution('size');
    const countryDist = getDistribution('country');

    return (
        <div className="companies-chart-view mt-3">
            <Row className="g-4">
                {/* Industry Distribution */}
                <Col md={6} lg={4}>
                    <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                        <Card.Body>
                            <div className="d-flex align-items-center gap-2 mb-4">
                                <div className="p-2 bg-primary-subtle rounded-3 text-primary">
                                    <Briefcase size={20} />
                                </div>
                                <h6 className="mb-0 fw-bold text-secondary">Industry Distribution</h6>
                            </div>

                            <div className="d-flex flex-column gap-3">
                                {industryDist.slice(0, 8).map((item, idx) => (
                                    <div key={idx}>
                                        <div className="d-flex justify-content-between mb-1 small">
                                            <span className="fw-medium">{item.label}</span>
                                            <span className="text-muted">{item.count} ({item.percentage}%)</span>
                                        </div>
                                        <ProgressBar
                                            now={item.percentage}
                                            variant={idx % 3 === 0 ? 'success' : idx % 3 === 1 ? 'primary' : 'info'}
                                            style={{ height: '8px', borderRadius: '4px' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Size Distribution */}
                <Col md={6} lg={4}>
                    <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                        <Card.Body>
                            <div className="d-flex align-items-center gap-2 mb-4">
                                <div className="p-2 bg-warning-subtle rounded-3 text-warning">
                                    <Building size={20} />
                                </div>
                                <h6 className="mb-0 fw-bold text-secondary">Size Distribution</h6>
                            </div>

                            <div className="d-flex flex-column gap-3">
                                {sizeDist.slice(0, 8).map((item, idx) => (
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

                {/* Country Distribution */}
                <Col md={6} lg={4}>
                    <Card className="h-100 border-0 shadow-sm" style={{ borderRadius: '16px' }}>
                        <Card.Body>
                            <div className="d-flex align-items-center gap-2 mb-4">
                                <div className="p-2 bg-info-subtle rounded-3 text-info">
                                    <MapPin size={20} />
                                </div>
                                <h6 className="mb-0 fw-bold text-secondary">Country Distribution</h6>
                            </div>

                            <div className="d-flex flex-column gap-3">
                                {countryDist.slice(0, 8).map((item, idx) => (
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
