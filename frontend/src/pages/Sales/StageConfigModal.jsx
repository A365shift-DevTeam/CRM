import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "./StageConfigModal.css";

const StageConfigModal = ({ show, onHide, currentStages, onSave }) => {
    const [stages, setStages] = useState([]);

    // Load stages when modal opens
    useEffect(() => {
        if (show && currentStages) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setStages(currentStages.map(s => ({
                ...s,
                ageing: s.ageing || 30,
                color: s.color || "green"
            })));
        }
    }, [show, currentStages]);

    const deleteStage = (id) => {
        if (stages.length <= 1) return; // Prevent deleting all
        setStages(stages.filter((s) => s.id !== id));
    };

    const moveStage = (index, direction) => {
        const newStages = [...stages];
        const targetIndex = index + direction;

        if (targetIndex < 0 || targetIndex >= stages.length) return;

        [newStages[index], newStages[targetIndex]] = [
            newStages[targetIndex],
            newStages[index],
        ];

        setStages(newStages);
    };

    const addStage = () => {
        const newId = Math.max(...stages.map(s => s.id), 0) + 1;
        setStages([...stages, {
            id: newId,
            label: 'New Stage',
            ageing: 30,
            color: "green"
        }]);
    };

    const handleSave = () => {
        onSave(stages);
        onHide();
    };

    if (!show) return null;

    return createPortal(
        <Modal
            show={show}
            onHide={onHide}
            size="lg"
            centered
            backdrop="static"
            className="stage-modal"
        >
            <Modal.Header closeButton>
                <Modal.Title className="stage-modal-title">
                    Configure Stages
                </Modal.Title>
            </Modal.Header>

            {/* Header Row */}
            <div className="stage-table-header px-4 py-2">
                <Row className="fw-semibold text-muted small text-center">
                    <Col md={1}>Sort</Col>
                    <Col md={4} className="text-start">Stage Name</Col>
                    <Col md={2}>Ageing (Days)</Col>
                    <Col md={3}>Color</Col>
                    <Col md={2}>Action</Col>
                </Row>
            </div>

            {/* Body */}
            <Modal.Body className="stage-body">
                {stages.map((stage, index) => (
                    <Row
                        key={stage.id}
                        className="align-items-center mb-3 stage-row"
                    >
                        <Col md={1} className="sort-icons">
                            <div
                                onClick={() => moveStage(index, -1)}
                                className={index === 0 ? 'disabled' : ''}
                            >↑</div>
                            <div
                                onClick={() => moveStage(index, 1)}
                                className={index === stages.length - 1 ? 'disabled' : ''}
                            >↓</div>
                        </Col>

                        <Col md={4}>
                            <Form.Control
                                value={stage.label || stage.name || ''}
                                onChange={(e) => {
                                    const updated = [...stages];
                                    updated[index].label = e.target.value;
                                    setStages(updated);
                                }}
                                placeholder="Stage name"
                            />
                        </Col>

                        <Col md={2}>
                            <Form.Select
                                value={stage.ageing}
                                className="text-center"
                                onChange={(e) => {
                                    const updated = [...stages];
                                    updated[index].ageing = parseInt(e.target.value);
                                    setStages(updated);
                                }}
                            >
                                <option value="3">3 days</option>
                                <option value="5">5 days</option>
                                <option value="7">7 days</option>
                                <option value="15">15 days</option>
                                <option value="30">30 days</option>
                                <option value="45">45 days</option>
                                <option value="60">60 days</option>
                                <option value="90">90 days</option>
                            </Form.Select>
                        </Col>

                        <Col md={3}>
                            <Form.Select
                                value={stage.color}
                                className="text-center"
                                onChange={(e) => {
                                    const updated = [...stages];
                                    updated[index].color = e.target.value;
                                    setStages(updated);
                                }}
                            >
                                <option value="cyan">Cyan</option>
                                <option value="green">Green</option>
                                <option value="gray">Gray</option>
                                <option value="red">Red</option>
                                <option value="orange">Orange</option>
                                <option value="white">White</option>
                            </Form.Select>
                        </Col>

                        <Col md={2} className="text-center">
                            <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => deleteStage(stage.id)}
                                disabled={stages.length <= 1}
                            >
                                Delete
                            </Button>
                        </Col>
                    </Row>
                ))}

                <div className="mt-3">
                    <Button variant="outline-success" size="sm" onClick={addStage}>
                        + Add Stage
                    </Button>
                </div>
            </Modal.Body>

            {/* Footer */}
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Cancel
                </Button>
                <Button variant="success" onClick={handleSave}>
                    Save Changes
                </Button>
            </Modal.Footer>
        </Modal>,
        document.body
    );
};

export default StageConfigModal;
