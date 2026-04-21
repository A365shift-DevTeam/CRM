import { useState, useEffect } from 'react'
import { Modal, Button, Form, Badge, Nav, Tab } from 'react-bootstrap'
import { Plus, Trash2, Edit2, Settings, FileText, Info, X, GripVertical } from 'lucide-react'

const FIELD_TYPES = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Dropdown' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'email', label: 'Email' }
]

export const DEFAULT_EXPENSE_FIELDS = [
    { id: 'date', label: 'Date', type: 'date', required: true, system: true, order: 1 },
    { id: 'category', label: 'Category', type: 'select', required: true, system: true, order: 2, options: ['Food', 'Accommodation', 'Allowances', 'Silicon - Server', 'Travel', 'Salary', 'Bank Charges', 'Printing & Stationery', 'Rent', 'Professional Fees', 'Consultancy Charges', 'Telephone Internet', 'Software Expenses', 'Project Tax & Charges', 'General Expenses'] },
    { id: 'amount', label: 'Amount', type: 'number', required: true, system: true, order: 3 },
    { id: 'description', label: 'Description', type: 'text', required: true, system: true, order: 4 },
    { id: 'employeeName', label: 'Employee Emails', type: 'text', required: false, system: true, order: 5 },
    { id: 'projectDepartment', label: 'Project/Department', type: 'text', required: false, system: true, order: 6 },
]

export const DEFAULT_INCOME_FIELDS = [
    { id: 'date', label: 'Date', type: 'date', required: true, system: true, order: 1 },
    { id: 'category', label: 'Category', type: 'select', required: true, system: true, order: 2, options: ['Sales', 'Services', 'Investments', 'Other'] },
    { id: 'amount', label: 'Amount', type: 'number', required: true, system: true, order: 3 },
    { id: 'description', label: 'Description', type: 'text', required: true, system: true, order: 4 },
    { id: 'employeeName', label: 'Employee Name', type: 'text', required: false, system: true, order: 5 },
    { id: 'projectDepartment', label: 'Project/Department', type: 'text', required: false, system: true, order: 6 },
]

const FinanceSettingsModal = ({ show, onHide, currentConfig, onSaveConfig }) => {
    const [config, setConfig] = useState(currentConfig || {
        expenseFields: DEFAULT_EXPENSE_FIELDS,
        incomeFields: DEFAULT_INCOME_FIELDS
    })

    const [showEditModal, setShowEditModal] = useState(false)
    const [editingField, setEditingField] = useState(null)
    const [formData, setFormData] = useState({ label: '', type: 'text', required: false })
    const [selectOptions, setSelectOptions] = useState([])
    const [newOptionValue, setNewOptionValue] = useState('')
    const [errors, setErrors] = useState({})

    useEffect(() => {
        if (currentConfig) setConfig(currentConfig)
    }, [currentConfig])

    const handleEdit = (field, type, index) => {
        setEditingField({ type, field, index })
        setFormData({ label: field.label, type: field.type, required: field.required })
        setSelectOptions(field.options || [])
        setNewOptionValue('')
        setErrors({})
        setShowEditModal(true)
    }

    const handleAddNew = (type) => {
        setEditingField({ type, field: null, index: -1 })
        setFormData({ label: '', type: 'text', required: false })
        setSelectOptions([])
        setNewOptionValue('')
        setErrors({})
        setShowEditModal(true)
    }

    const validate = () => {
        const newErrors = {}
        if (!formData.label?.trim()) newErrors.label = 'Field label is required'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSaveField = () => {
        if (!validate()) return

        const { type, index } = editingField
        const listKey = type === 'expense' ? 'expenseFields' : 'incomeFields'
        const list = [...config[listKey]]

        const fieldData = {
            ...formData,
            id: editingField.field?.id || formData.label.toLowerCase().replace(/\s+/g, '_'),
            system: editingField.field?.system || false,
            order: editingField.field?.order || list.length + 1,
        }
        if (formData.type === 'select') {
            fieldData.options = selectOptions
        }

        if (index >= 0) {
            list[index] = { ...list[index], ...fieldData }
        } else {
            list.push(fieldData)
        }

        setConfig(prev => ({ ...prev, [listKey]: list }))
        setShowEditModal(false)
        setEditingField(null)
    }

    const handleDelete = (index, type) => {
        if (!window.confirm('Are you sure you want to delete this field?')) return
        const listKey = type === 'expense' ? 'expenseFields' : 'incomeFields'
        const list = [...config[listKey]]
        list.splice(index, 1)
        setConfig(prev => ({ ...prev, [listKey]: list }))
    }

    const handleFinalSave = () => {
        onSaveConfig(config)
        onHide()
    }

    const handleAddOption = () => {
        const trimmed = newOptionValue.trim()
        if (trimmed && !selectOptions.includes(trimmed)) {
            setSelectOptions([...selectOptions, trimmed])
            setNewOptionValue('')
        }
    }

    const handleRemoveOption = (index) => {
        setSelectOptions(selectOptions.filter((_, i) => i !== index))
    }

    const renderFieldList = (type) => {
        const list = type === 'expense' ? config.expenseFields : config.incomeFields

        return (
            <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0 fw-semibold text-dark">
                        {type === 'expense' ? 'Expense' : 'Income'} Fields
                        <Badge className="ms-2" pill style={{ background: '#10b981', fontSize: '0.75rem' }}>{list.length}</Badge>
                    </h6>
                    <Button
                        size="sm"
                        onClick={() => handleAddNew(type)}
                        className="d-flex align-items-center"
                        style={{ background: 'var(--button-brand, #5286A5)', borderColor: 'var(--button-brand, #5286A5)', fontWeight: 600 }}
                    >
                        <Plus size={16} className="me-1" />
                        Add Field
                    </Button>
                </div>

                {list.map((field, idx) => (
                    <div
                        key={idx}
                        className="timesheet-column-item d-flex align-items-center gap-3 p-3 border rounded mb-2 bg-white"
                    >
                        <div className="timesheet-column-drag-handle" style={{ cursor: 'default' }}>
                            <GripVertical size={18} className="text-muted" />
                        </div>
                        <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <strong className="timesheet-column-name">{field.label}</strong>
                                <Badge bg="secondary" className="timesheet-column-badge">
                                    {FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}
                                </Badge>
                                {field.required && (
                                    <Badge bg="danger" className="timesheet-column-badge">Required</Badge>
                                )}
                                {field.system && (
                                    <Badge bg="info" className="timesheet-column-badge">System</Badge>
                                )}
                            </div>
                            {field.type === 'select' && field.options && (
                                <div className="d-flex gap-1 flex-wrap mt-1">
                                    <span className="options-label">Options:</span>
                                    <div className="options-list">
                                        {field.options.slice(0, 4).map((opt, i) => (
                                            <span key={i} className="option-pill" style={{ background: '#f1f5f9', color: '#475569' }}>
                                                {opt}
                                            </span>
                                        ))}
                                    </div>
                                    {field.options.length > 4 && (
                                        <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>+{field.options.length - 4} more</span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="d-flex align-items-center gap-1">
                            <Button
                                variant="link"
                                size="sm"
                                onClick={() => handleEdit(field, type, idx)}
                                title="Edit"
                                className="timesheet-column-action-btn"
                            >
                                <Edit2 size={16} />
                            </Button>
                            {!field.system && (
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => handleDelete(idx, type)}
                                    title="Delete"
                                    className="timesheet-column-action-btn text-danger"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <>
            <Modal show={show} onHide={onHide} size="lg" centered className="timesheet-column-manager-modal finance-settings-modal">
                <Modal.Header className="border-bottom pb-2">
                    <Modal.Title className="mb-0 d-flex align-items-center gap-2">
                        <Settings size={20} className="text-muted" />
                        Manage Fields
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3 pb-3" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    <Tab.Container defaultActiveKey="expense">
                        <Nav variant="pills" className="finance-field-tabs mb-3 gap-2">
                            <Nav.Item>
                                <Nav.Link eventKey="expense">Expense Fields</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="income">Income Fields</Nav.Link>
                            </Nav.Item>
                        </Nav>
                        <Tab.Content>
                            <Tab.Pane eventKey="expense">
                                {renderFieldList('expense')}
                            </Tab.Pane>
                            <Tab.Pane eventKey="income">
                                {renderFieldList('income')}
                            </Tab.Pane>
                        </Tab.Content>
                    </Tab.Container>
                </Modal.Body>
                <Modal.Footer className="border-top pt-3">
                    <Button variant="secondary" onClick={onHide}>Close</Button>
                    <Button onClick={handleFinalSave} style={{ background: 'var(--button-brand, #5286A5)', borderColor: 'var(--button-brand, #5286A5)', fontWeight: 600 }}>
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Add/Edit Field Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered className="timesheet-column-edit-modal">
                <Modal.Header className="border-bottom pb-2">
                    <Modal.Title className="mb-0 d-flex align-items-center gap-2">
                        <FileText size={18} className="text-muted" />
                        {editingField?.field ? 'Edit Field' : 'Add New Field'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-3">
                    <Form.Group className="mb-3">
                        <Form.Label className="timesheet-form-label d-flex align-items-center gap-2">
                            <FileText size={16} className="text-muted" />
                            <span className="fw-semibold">
                                Field Label <span className="text-danger">*</span>
                            </span>
                        </Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.label}
                            onChange={e => setFormData({ ...formData, label: e.target.value })}
                            isInvalid={!!errors.label}
                            placeholder="Enter field label"
                            readOnly={editingField?.field?.system}
                            className="timesheet-form-control"
                        />
                        <Form.Control.Feedback type="invalid">{errors.label}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="timesheet-form-label d-flex align-items-center gap-2">
                            <Settings size={16} className="text-muted" />
                            <span className="fw-semibold">
                                Field Type <span className="text-danger">*</span>
                            </span>
                            <Info size={12} className="text-muted ms-1" />
                        </Form.Label>
                        <Form.Select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                            disabled={editingField?.field?.system}
                            className="timesheet-form-control"
                        >
                            {FIELD_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    {formData.type === 'select' && (
                        <Form.Group className="mb-3">
                            <Form.Label className="timesheet-form-label d-flex align-items-center gap-2">
                                <Settings size={16} className="text-muted" />
                                <span className="fw-semibold">Dropdown Options</span>
                            </Form.Label>
                            {selectOptions.length > 0 && (
                                <div className="d-flex flex-wrap gap-2 mb-2">
                                    {selectOptions.map((opt, idx) => (
                                        <Badge
                                            key={idx}
                                            bg="light"
                                            text="dark"
                                            className="d-flex align-items-center gap-1 border px-3 py-2"
                                            style={{ fontSize: '0.85rem', borderRadius: '8px' }}
                                        >
                                            {opt}
                                            <X
                                                size={14}
                                                className="ms-1 text-danger"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => handleRemoveOption(idx)}
                                            />
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            <div className="d-flex gap-2">
                                <Form.Control
                                    type="text"
                                    value={newOptionValue}
                                    onChange={e => setNewOptionValue(e.target.value)}
                                    placeholder="Type an option and press Add"
                                    className="timesheet-form-control"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleAddOption()
                                        }
                                    }}
                                />
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={handleAddOption}
                                    disabled={!newOptionValue.trim()}
                                    className="d-flex align-items-center"
                                    style={{ whiteSpace: 'nowrap' }}
                                >
                                    <Plus size={16} className="me-1" /> Add
                                </Button>
                            </div>
                        </Form.Group>
                    )}

                    <Form.Group className="mb-3">
                        <Form.Check
                            type="checkbox"
                            label="Required"
                            checked={formData.required}
                            onChange={e => setFormData({ ...formData, required: e.target.checked })}
                            className="timesheet-form-check"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-top pt-3">
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
                    <Button onClick={handleSaveField} style={{ background: 'var(--button-brand, #5286A5)', borderColor: 'var(--button-brand, #5286A5)', fontWeight: 600 }}>
                        {editingField?.field ? 'Update' : 'Add'} Field
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default FinanceSettingsModal
