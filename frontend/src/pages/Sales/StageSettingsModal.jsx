import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Modal, Button, Form, Table } from 'react-bootstrap'
import { Trash, Plus, ArrowUp, ArrowDown } from 'lucide-react'

const StageSettingsModal = ({ show, handleClose, currentStages, onSave, productLabel, serviceLabel }) => {
    const [stages, setStages] = useState([])
    const [localProductLabel, setLocalProductLabel] = useState(productLabel || 'Product')
    const [localServiceLabel, setLocalServiceLabel] = useState(serviceLabel || 'Service')

    // Load stages when modal opens
    useEffect(() => {
        if (show) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setStages(currentStages.map(s => ({ ...s, ageing: s.ageing || 30 }))) // Deep copy with default ageing
            setLocalProductLabel(productLabel || 'Product')
            setLocalServiceLabel(serviceLabel || 'Service')
        }
    }, [show, currentStages, productLabel, serviceLabel])

    const handleLabelChange = (index, value) => {
        const newStages = [...stages]
        newStages[index].label = value
        setStages(newStages)
    }

    const handleColorChange = (index, value) => {
        const newStages = [...stages]
        newStages[index].color = value
        setStages(newStages)
    }

    const handleAgeingChange = (index, value) => {
        const newStages = [...stages]
        newStages[index].ageing = parseInt(value) || 0
        setStages(newStages)
    }

    const handleAddStage = () => {
        const newId = Math.max(...stages.map(s => s.id), 0) + 1
        // Auto-assign a color based on new index roughly
        const colors = ['gray', 'cyan', 'green', 'orange', 'purple', 'red', 'blue']
        const color = colors[stages.length % colors.length]

        setStages([
            ...stages,
            { id: newId, label: 'New Stage', color, ageing: 30 }
        ])
    }

    const handleDelete = (index) => {
        if (stages.length <= 1) return // Prevent deleting all
        const newStages = stages.filter((_, i) => i !== index)
        setStages(newStages)
    }

    const moveStage = (index, direction) => {
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === stages.length - 1) return

        const newStages = [...stages]
        const targetIndex = direction === 'up' ? index - 1 : index + 1

        // Swap
        const temp = newStages[index]
        newStages[index] = newStages[targetIndex]
        newStages[targetIndex] = temp

        setStages(newStages)
    }

    // Use Portal to render at document.body level for proper centering
    return createPortal(
        <Modal
            show={show}
            onHide={handleClose}
            size="xl"
            centered
            style={{ zIndex: 2000 }}
            dialogClassName="stage-settings-centered-modal"
        >
            <Modal.Header closeButton style={{ borderBottom: '1px solid #e2e8f0' }}>
                <Modal.Title style={{
                    color: '#8B9DC3',
                    fontWeight: 500,
                    fontFamily: 'Georgia, "Times New Roman", Times, serif',
                    fontStyle: 'italic',
                    fontSize: '1.75rem'
                }}>Configure Stages</Modal.Title>
            </Modal.Header>
            <Modal.Body
                style={{
                    padding: '20px'
                }}
            >
                <div>
                    <div className="row mb-4">
                        <div className="col-md-6">
                            <Form.Group>
                                <Form.Label className="fw-bold text-muted small">Product Label</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={localProductLabel}
                                    onChange={(e) => setLocalProductLabel(e.target.value)}
                                />
                            </Form.Group>
                        </div>
                        <div className="col-md-6">
                            <Form.Group>
                                <Form.Label className="fw-bold text-muted small">Service Label</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={localServiceLabel}
                                    onChange={(e) => setLocalServiceLabel(e.target.value)}
                                />
                            </Form.Group>
                        </div>
                    </div>
                    <Table hover size="sm" style={{ marginBottom: '20px', minWidth: '700px' }}>

                        <thead>
                            <tr>
                                <th style={{ width: '8%' }}>Sort</th>
                                <th style={{ width: '30%' }}>Stage Name</th>
                                <th style={{ width: '22%' }}>Ageing (Days)</th>
                                <th style={{ width: '22%' }}>Color</th>
                                <th style={{ width: '18%' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stages.map((stage, index) => (
                                <tr key={index}>
                                    <td className="align-middle">
                                        <div className="d-flex flex-column gap-1">
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-0 text-muted"
                                                onClick={() => moveStage(index, 'up')}
                                                disabled={index === 0}
                                            >
                                                <ArrowUp size={16} />
                                            </Button>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-0 text-muted"
                                                onClick={() => moveStage(index, 'down')}
                                                disabled={index === stages.length - 1}
                                            >
                                                <ArrowDown size={16} />
                                            </Button>
                                        </div>
                                    </td>
                                    <td className="align-middle">
                                        <Form.Control
                                            type="text"
                                            value={stage.label}
                                            onChange={(e) => handleLabelChange(index, e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </td>
                                    <td className="align-middle">
                                        <Form.Select
                                            value={stage.ageing || 30}
                                            onChange={(e) => handleAgeingChange(index, e.target.value)}
                                            size="sm"
                                            style={{ width: '100%' }}
                                        >
                                            <option value="3">3 days</option>
                                            <option value="7">7 days</option>
                                            <option value="15">15 days</option>
                                            <option value="30">30 days</option>
                                            <option value="45">45 days</option>
                                            <option value="60">60 days</option>
                                            <option value="90">90 days</option>
                                        </Form.Select>
                                    </td>
                                    <td className="align-middle">
                                        <Form.Select
                                            value={stage.color}
                                            onChange={(e) => handleColorChange(index, e.target.value)}
                                            style={{ width: '100%' }}
                                        >
                                            <option value="gray">Gray</option>
                                            <option value="cyan">Cyan</option>
                                            <option value="green">Green</option>
                                            <option value="orange">Orange</option>
                                            <option value="purple">Purple</option>
                                            <option value="red">Red</option>
                                            <option value="blue">Blue</option>
                                        </Form.Select>
                                    </td>
                                    <td className="align-middle">
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleDelete(index)}
                                            disabled={stages.length <= 1}
                                        >
                                            <Trash size={16} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <Button variant="outline-primary" size="sm" onClick={handleAddStage}>
                        <Plus size={16} className="me-1" /> Add Stage
                    </Button>
                </div>
            </Modal.Body>
            <Modal.Footer style={{ borderTop: '1px solid #e2e8f0', padding: '12px 20px' }}>
                <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                <Button variant="primary" onClick={() => onSave(stages, { productLabel: localProductLabel, serviceLabel: localServiceLabel })}>Save Changes</Button>
            </Modal.Footer>
        </Modal>,
        document.body
    )
}

export default StageSettingsModal
