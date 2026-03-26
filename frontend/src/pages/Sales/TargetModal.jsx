import { useState, useEffect } from 'react'
import { Modal, Button, Form, Row, Col } from 'react-bootstrap'
import './TargetModal.css'

const TargetModal = ({ show, handleClose, handleSave, projectId, stages = [], activeStage, targetStage }) => {
    const initialStage = targetStage !== undefined ? targetStage : activeStage;
    const [viewedStage, setViewedStage] = useState(initialStage);

    useEffect(() => {
        if (show) {
            const newStage = targetStage !== undefined ? targetStage : activeStage;
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setViewedStage(newStage);
        }
    }, [show, targetStage, activeStage]);

    // Safety check
    if (!stages || stages.length === 0) {
        return null;
    }

    const currentStageLabel = stages[viewedStage]?.label || 'Stage';

    return (
        <Modal
            show={show}
            onHide={handleClose}
            size="xl"
            centered
            backdrop="static"
        >
            <Modal.Header className="border-0 pb-0">
                <div className="w-100">
                    {/* Stage Pills */}
                    <div className="d-flex gap-2 mb-3 overflow-auto pb-2">
                        {stages.map((stage, index) => (
                            <button
                                key={index}
                                type="button"
                                className={`stage-pill-btn ${index <= viewedStage ? 'active' : ''} ${index === viewedStage ? 'current' : ''}`}
                                onClick={() => setViewedStage(index)}
                            >
                                {stage.label || 'Stage'}
                            </button>
                        ))}
                    </div>

                    {/* Header Title */}
                    <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Business Process - Project ID {projectId} - {currentStageLabel}</h5>
                        <button type="button" className="btn-close" onClick={handleClose}></button>
                    </div>
                </div>
            </Modal.Header>

            <Modal.Body className="p-0">
                <Row className="g-0">
                    {/* Left Panel - Form */}
                    <Col md={5} className="border-end bg-light p-4">
                        <Form>
                            <Row className="mb-3">
                                <Col>
                                    <Form.Group>
                                        <Form.Label className="small fw-semibold">Target Date</Form.Label>
                                        <Form.Control type="date" size="sm" />
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Group>
                                        <Form.Label className="small fw-semibold">Revised Date</Form.Label>
                                        <Form.Control type="date" size="sm" />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-semibold">Amount</Form.Label>
                                <Form.Control type="number" size="sm" placeholder="Enter amount" />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-semibold">Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={5}
                                    size="sm"
                                    placeholder={`Enter details for ${currentStageLabel}...`}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-semibold">Attachment</Form.Label>
                                <Form.Control type="text" size="sm" placeholder="File path or URL" />
                            </Form.Group>
                        </Form>
                    </Col>

                    {/* Right Panel - Status */}
                    <Col md={7} className="p-4">
                        <div className="status-header-box mb-3">
                            <h6 className="text-white mb-0 text-center">Status</h6>
                        </div>
                        <div className="status-content-area">
                            <p className="text-muted">
                                History/Logs for {currentStageLabel} would appear here.
                            </p>
                        </div>
                    </Col>
                </Row>
            </Modal.Body>

            <Modal.Footer className="border-top">
                <Button variant="dark" size="sm" onClick={() => handleSave({ stageIndex: viewedStage })}>
                    Save
                </Button>
                <Button variant="secondary" size="sm" onClick={handleClose}>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default TargetModal
