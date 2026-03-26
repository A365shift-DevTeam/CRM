import { useState, useEffect } from 'react'
import { Modal, Button, Form, Table, Nav, Tab } from 'react-bootstrap'
import { Plus, Trash2, Edit } from 'lucide-react'

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
    { id: 'category', label: 'Category', type: 'select', required: true, system: true, order: 2, options: ['Transport', 'Food', 'Accommodation', 'Allowances'] }, // Options handled by system logic mostly
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

const FieldEditor = ({ field, onSave, onCancel }) => {
    const [data, setData] = useState(field || {
        id: '',
        label: '',
        type: 'text',
        required: false,
        optionsString: ''
    })

    const handleChange = (f, v) => setData(p => ({ ...p, [f]: v }))

    const handleSubmit = () => {
        const toSave = { ...data }
        if (!toSave.id) {
            toSave.id = toSave.label.toLowerCase().replace(/\s+/g, '_')
        }
        if (toSave.type === 'select' && typeof toSave.optionsString === 'string') {
            toSave.options = toSave.optionsString.split(',').map(s => s.trim()).filter(Boolean)
        }
        onSave(toSave)
    }

    return (
        <div className="p-3 border rounded bg-light mb-3">
            <h6 className="mb-3">{field ? 'Edit Field' : 'Add New Field'}</h6>
            <div className="row">
                <Form.Group className="col-md-6 mb-2">
                    <Form.Label>Label</Form.Label>
                    <Form.Control
                        type="text"
                        value={data.label}
                        onChange={e => handleChange('label', e.target.value)}
                        readOnly={field?.system} // Can't rename system field keys/labels easily without breaking logic
                    />
                </Form.Group>
                <Form.Group className="col-md-6 mb-2">
                    <Form.Label>Type</Form.Label>
                    <Form.Select
                        value={data.type}
                        onChange={e => handleChange('type', e.target.value)}
                        disabled={field?.system}
                    >
                        {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </Form.Select>
                </Form.Group>
                <Form.Group className="col-md-12 mb-2">
                    <Form.Check
                        type="checkbox"
                        label="Required"
                        checked={data.required}
                        onChange={e => handleChange('required', e.target.checked)}
                    />
                </Form.Group>
                {data.type === 'select' && (
                    <Form.Group className="col-md-12 mb-2">
                        <Form.Label>Options (comma separated)</Form.Label>
                        <Form.Control
                            type="text"
                            value={data.optionsString || (data.options || []).join(', ')}
                            onChange={e => handleChange('optionsString', e.target.value)}
                            disabled={field?.system && field?.id === 'category'} // Lock category options if system
                        />
                    </Form.Group>
                )}
            </div>
            <div className="d-flex justify-content-end gap-2 mt-2">
                <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={handleSubmit}>Save Field</Button>
            </div>
        </div>
    )
}

const FinanceSettingsModal = ({ show, onHide, currentConfig, onSaveConfig }) => {
    const [config, setConfig] = useState(currentConfig || {
        expenseFields: DEFAULT_EXPENSE_FIELDS,
        incomeFields: DEFAULT_INCOME_FIELDS
    })

    const [editingFieldData, setEditingFieldData] = useState(null) // { type: 'expense'|'income', field:Obj, index:Int }
    const [isAdding, setIsAdding] = useState(null) // 'expense' or 'income'

    useEffect(() => {
        if (currentConfig) setConfig(currentConfig)
    }, [currentConfig])

    const handleSaveField = (field, type) => {
        const listKey = type === 'expense' ? 'expenseFields' : 'incomeFields'
        const list = [...config[listKey]]

        if (editingFieldData && editingFieldData.type === type) {
            // Edit
            list[editingFieldData.index] = { ...list[editingFieldData.index], ...field }
            setEditingFieldData(null)
        } else {
            // Add
            list.push({ ...field, system: false, order: list.length + 1 })
            setIsAdding(null)
        }

        setConfig(p => ({ ...p, [listKey]: list }))
    }

    const handleDelete = (index, type) => {
        const listKey = type === 'expense' ? 'expenseFields' : 'incomeFields'
        const list = [...config[listKey]]
        list.splice(index, 1)
        setConfig(p => ({ ...p, [listKey]: list }))
    }

    const handleFinalSave = () => {
        onSaveConfig(config)
        onHide()
    }

    const renderFieldList = (type) => { // 'expense' or 'income'
        const list = type === 'expense' ? config.expenseFields : config.incomeFields
        const isEditingThisType = editingFieldData?.type === type
        const isAddingThisType = isAdding === type

        return (
            <div>
                {isAddingThisType && (
                    <FieldEditor
                        onSave={f => handleSaveField(f, type)}
                        onCancel={() => setIsAdding(null)}
                    />
                )}
                {isEditingThisType && (
                    <FieldEditor
                        field={editingFieldData.field}
                        onSave={f => handleSaveField(f, type)}
                        onCancel={() => setEditingFieldData(null)}
                    />
                )}

                <div className="table-responsive">
                    <Table hover size="sm">
                        <thead>
                            <tr>
                                <th>Label</th>
                                <th>Type</th>
                                <th>Required</th>
                                <th style={{ width: '100px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map((field, idx) => (
                                <tr key={idx}>
                                    <td>{field.label} {field.system && <small className="text-muted">(System)</small>}</td>
                                    <td>{FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}</td>
                                    <td>{field.required ? 'Yes' : 'No'}</td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <Button variant="link" size="sm" className="p-0 text-primary" onClick={() => {
                                                setEditingFieldData({ type, field, index: idx })
                                                setIsAdding(null)
                                            }}>
                                                <Edit size={16} />
                                            </Button>
                                            {!field.system && (
                                                <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => handleDelete(idx, type)}>
                                                    <Trash2 size={16} />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
                {!isAddingThisType && !isEditingThisType && (
                    <Button variant="outline-primary" size="sm" onClick={() => setIsAdding(type)}>
                        <Plus size={16} /> Add Field
                    </Button>
                )}
            </div>
        )
    }

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Finance Page Settings</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Tab.Container defaultActiveKey="expense">
                    <Nav variant="tabs" className="mb-3">
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
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Cancel</Button>
                <Button variant="primary" onClick={handleFinalSave}>Save Changes</Button>
            </Modal.Footer>
        </Modal>
    )
}

export default FinanceSettingsModal
