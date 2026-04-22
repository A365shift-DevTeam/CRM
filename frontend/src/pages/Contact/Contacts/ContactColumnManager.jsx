import { useState, useEffect } from 'react'
import { Button, Form, Modal, Badge, Dropdown } from 'react-bootstrap'
import { Plus, Eye, EyeOff, Trash2, Edit2, GripVertical, Settings, FileText, Info, X } from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { contactService } from '../../../services/contactService'
import { useToast } from '../../../components/Toast/ToastContext'

const COLUMN_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'date', label: 'Date' },
  { value: 'choice', label: 'Choice/Dropdown' },
  { value: 'location', label: 'Location' },
  { value: 'currency', label: 'Currency' }
]

const defaultColumnIds = ['name', 'jobTitle', 'phone', 'company', 'location', 'clientAddress', 'clientCountry', 'type', 'status']

const SortableColumnItem = ({ column, onToggleVisibility, onEdit, onDelete, isDefault }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="timesheet-column-item d-flex align-items-center gap-3 p-3 border rounded mb-2 bg-white"
    >
      <div {...attributes} {...listeners} style={{ cursor: 'grab' }} className="timesheet-column-drag-handle">
        <GripVertical size={18} className="text-muted" />
      </div>
      <div className="flex-grow-1">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <strong className="timesheet-column-name">{column.name}</strong>
          <Badge bg="secondary" className="timesheet-column-badge">{column.type}</Badge>
          {column.required && <Badge bg="danger" className="timesheet-column-badge">Required</Badge>}
          {isDefault && <Badge bg="info" className="timesheet-column-badge">Default</Badge>}
        </div>
      </div>
      <div className="d-flex align-items-center gap-1">
        <Button
          variant="link"
          size="sm"
          onClick={() => onToggleVisibility(column.id)}
          title={column.visible !== false ? 'Hide' : 'Show'}
          className="timesheet-column-action-btn"
        >
          {column.visible !== false ? <Eye size={16} /> : <EyeOff size={16} />}
        </Button>
        <Button
          variant="link"
          size="sm"
          onClick={() => onEdit(column)}
          title="Edit"
          className="timesheet-column-action-btn"
        >
          <Edit2 size={16} />
        </Button>
        {!isDefault && (
          <Button
            variant="link"
            size="sm"
            onClick={() => onDelete(column.id)}
            title="Delete"
            className="timesheet-column-action-btn text-danger"
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>
    </div>
  )
}

export const ContactColumnManager = ({ show, onHide, columns, onColumnsChange }) => {
  const toast = useToast()
  const [editingColumn, setEditingColumn] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'text',
    required: false,
    visible: true
  })
  const [choiceOptions, setChoiceOptions] = useState([])
  const [newChoiceValue, setNewChoiceValue] = useState('')
  const [errors, setErrors] = useState({})

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (show) {
      setEditingColumn(null)
      setShowAddModal(false)
      setFormData({ name: '', type: 'text', required: false, visible: true })
      setErrors({})
    }
  }, [show])

  const handleToggleVisibility = async (columnId) => {
    try {
      const column = columns.find(col => col.id === columnId)
      if (column) {
        await contactService.updateColumn(column.colId || column.id, {
          visible: column.visible === false ? true : false
        })
        const updatedColumns = columns.map(col =>
          col.id === columnId ? { ...col, visible: col.visible === false ? true : false } : col
        )
        onColumnsChange(updatedColumns)
      }
    } catch (error) {
      console.error('Error toggling column visibility:', error)
      toast.error('Failed to toggle visibility')
    }
  }

  const handleEdit = (column) => {
    setEditingColumn(column)
    setFormData({
      name: column.name || '',
      type: column.type || 'text',
      required: column.required || false,
      visible: column.visible !== false
    })
    setChoiceOptions(column.config?.options || [])
    setNewChoiceValue('')
    setShowAddModal(true)
  }

  const handleDelete = async (columnId) => {
    if (window.confirm('Are you sure you want to delete this column?')) {
      try {
        const column = columns.find(col => col.id === columnId)
        await contactService.deleteColumn(column?.colId || columnId)
        const updatedColumns = columns.filter(col => col.id !== columnId)
        onColumnsChange(updatedColumns)
        toast.success('Column deleted')
      } catch (error) {
        console.error('Error deleting column:', error)
        toast.error('Failed to delete column')
      }
    }
  }

  const handleAddNew = () => {
    setEditingColumn(null)
    setFormData({ name: '', type: 'text', required: false, visible: true })
    setChoiceOptions([])
    setNewChoiceValue('')
    setShowAddModal(true)
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name?.trim()) {
      newErrors.name = 'Column name is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveColumn = async () => {
    if (!validate()) return

    try {
      const saveData = { ...formData }
      if (formData.type === 'choice') {
        saveData.config = { ...(saveData.config || {}), options: choiceOptions }
      }

      if (editingColumn) {
        await contactService.updateColumn(editingColumn.colId || editingColumn.id, saveData)
        const updatedColumns = columns.map(col =>
          col.id === editingColumn.id ? { ...col, ...saveData } : col
        )
        onColumnsChange(updatedColumns)
        toast.success('Column updated')
      } else {
        const newColumn = await contactService.addColumn(saveData)
        const mapped = { ...newColumn, id: newColumn.colId || newColumn.id, config: newColumn.config || {} }
        onColumnsChange([...columns, mapped])
        toast.success('Column added')
      }
      setShowAddModal(false)
      setEditingColumn(null)
      setFormData({ name: '', type: 'text', required: false, visible: true })
      setChoiceOptions([])
      setNewChoiceValue('')
    } catch (error) {
      console.error('Error saving column:', error)
      toast.error('Failed to save column: ' + (error.message || 'Unknown error'))
    }
  }

  const handleAddChoice = () => {
    const trimmed = newChoiceValue.trim()
    if (trimmed && !choiceOptions.includes(trimmed)) {
      setChoiceOptions([...choiceOptions, trimmed])
      setNewChoiceValue('')
    }
  }

  const handleRemoveChoice = (index) => {
    setChoiceOptions(choiceOptions.filter((_, i) => i !== index))
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = columns.findIndex(col => col.id === active.id)
      const newIndex = columns.findIndex(col => col.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedColumns = arrayMove(columns, oldIndex, newIndex)
        try {
          await contactService.reorderColumns(reorderedColumns.map(col => col.colId || col.id))
          onColumnsChange(reorderedColumns)
        } catch (error) {
          console.error('Error reordering columns:', error)
        }
      }
    }
  }

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl" centered className="timesheet-column-manager-modal">
        <Modal.Header className="border-bottom pb-2">
          <Modal.Title className="mb-0 d-flex align-items-center gap-2">
            <Settings size={20} className="text-muted" />
            Manage Columns
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3 pb-3" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0 fw-semibold text-dark">Columns</h6>
            <Button variant="primary" size="sm" onClick={handleAddNew} className="d-flex align-items-center">
              <Plus size={16} className="me-1" />
              Add Column
            </Button>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={columns.map(col => col.id)}
              strategy={undefined}
            >
              {columns.map(column => (
                <SortableColumnItem
                  key={column.id}
                  column={column}
                  isDefault={defaultColumnIds.includes(column.id)}
                  onToggleVisibility={handleToggleVisibility}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
        </Modal.Body>
        <Modal.Footer className="border-top pt-3">
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add/Edit Column Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered size="lg" className="timesheet-column-edit-modal">
        <Modal.Header className="border-bottom pb-2">
          <Modal.Title className="mb-0 d-flex align-items-center gap-2">
            <FileText size={18} className="text-muted" />
            {editingColumn ? 'Edit Column' : 'Add New Column'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          <Form.Group className="mb-3">
            <Form.Label className="timesheet-form-label d-flex align-items-center gap-2">
              <FileText size={16} className="text-muted" />
              <span className="fw-semibold">
                Column Name <span className="text-danger">*</span>
              </span>
            </Form.Label>
            <Form.Control
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              isInvalid={!!errors.name}
              placeholder="Enter column name"
              className="timesheet-form-control"
            />
            <Form.Control.Feedback type="invalid">
              {errors.name}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="timesheet-form-label d-flex align-items-center gap-2">
              <Settings size={16} className="text-muted" />
              <span className="fw-semibold">
                Column Type <span className="text-danger">*</span>
              </span>
              <Info size={12} className="text-muted ms-1" />
            </Form.Label>
            <Form.Select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="timesheet-form-control"
            >
              <option value="" disabled>Select type</option>
              {COLUMN_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {formData.type === 'choice' && (
            <Form.Group className="mb-3">
              <Form.Label className="timesheet-form-label d-flex align-items-center gap-2">
                <Settings size={16} className="text-muted" />
                <span className="fw-semibold">Choice Options</span>
              </Form.Label>
              {choiceOptions.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mb-2">
                  {choiceOptions.map((opt, idx) => (
                    <Badge
                      key={idx}
                      bg="light"
                      text="dark"
                      className="d-flex align-items-center gap-1 border px-3 py-2"
                      style={{ fontSize: '0.85rem', borderRadius: '8px' }}
                    >
                      {typeof opt === 'string' ? opt : opt.label || opt}
                      <X
                        size={14}
                        className="ms-1 text-danger"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleRemoveChoice(idx)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
              <div className="d-flex gap-2">
                <Form.Control
                  type="text"
                  value={newChoiceValue}
                  onChange={(e) => setNewChoiceValue(e.target.value)}
                  placeholder="Type an option and press Add"
                  className="timesheet-form-control"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddChoice()
                    }
                  }}
                />
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={handleAddChoice}
                  disabled={!newChoiceValue.trim()}
                  className="d-flex align-items-center"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <Plus size={16} className="me-1" />
                  Add
                </Button>
              </div>
              {choiceOptions.length === 0 && (
                <Form.Text className="text-muted">
                  Add at least one option for the dropdown.
                </Form.Text>
              )}
            </Form.Group>
          )}

          <div className="row">
            <Form.Group className="mb-3 col-md-6">
              <Form.Check
                type="checkbox"
                label="Required"
                checked={formData.required}
                onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                className="timesheet-form-check"
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Check
                type="checkbox"
                label="Visible"
                checked={formData.visible}
                onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                className="timesheet-form-check"
              />
            </Form.Group>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-top pt-3">
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveColumn}>
            {editingColumn ? 'Update Column' : 'Add Column'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
