import { useState, useEffect } from 'react'
import { Button, Form, Modal, Dropdown, Badge } from 'react-bootstrap'
import { Plus, GripVertical, Eye, EyeOff, Trash2, Edit2, X } from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'image', label: 'Image' },
  { value: 'choice', label: 'Choice' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'currency', label: 'Currency' },
  { value: 'location', label: 'Location' },
  { value: 'datetime', label: 'Date and Time' }
]

// Helper to normalize options to object format (for backward compatibility)
const normalizeOptions = (options) => {
  if (!options || !Array.isArray(options)) return []
  return options.map((opt, idx) => {
    if (typeof opt === 'string') {
      const defaultColors = ['#0078d4', '#107c10', '#ffaa44', '#e81123', '#8764b8', '#00bcf2', '#ff8c00', '#737373']
      return { label: String(opt).trim(), color: defaultColors[idx % defaultColors.length] }
    }
    if (opt && typeof opt === 'object' && opt !== null) {
      // Preserve existing colors, only use default if color is missing
      return {
        label: String(opt.label || '').trim(),
        color: opt.color || '#0078d4'
      }
    }
    return { label: '', color: '#0078d4' }
  })
}

// Helper to determine text color based on background color (for contrast)
const getContrastColor = (hexColor) => {
  if (!hexColor) return '#ffffff'
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? '#000000' : '#ffffff'
}

const SortableColumnItem = ({ column, onToggleVisibility, onEdit, onDelete }) => {
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
      className="sortable-column-item"
    >
      <div className="column-drag-handle" {...attributes}  {...listeners}>
        <GripVertical size={18} />
      </div>

      <div className="column-content">
        <div className="column-header-row">
          <div className="column-name-section">
            <strong className="column-name">{column.name}</strong>
            <div className="column-badges">
              <Badge className="column-type-badge">{column.type}</Badge>
              {column.required && <Badge className="column-required-badge">Required</Badge>}
            </div>
          </div>
        </div>

        {column.config && (
          <div className="column-config-info">
            {(column.type === 'choice' || column.type === 'dropdown') && column.config.options && (
              <div className="column-options-preview">
                <span className="options-label">Options:</span>
                <div className="options-list">
                  {column.config.options.map((opt, idx) => {
                    const optionLabel = typeof opt === 'string' ? opt : opt.label
                    const optionColor = typeof opt === 'string'
                      ? ['#0078d4', '#107c10', '#ffaa44', '#e81123', '#8764b8', '#00bcf2', '#ff8c00', '#737373'][idx % 8]
                      : (opt.color || '#0078d4')
                    return (
                      <span
                        key={idx}
                        className="option-pill"
                        style={{
                          backgroundColor: optionColor,
                          color: getContrastColor(optionColor)
                        }}
                      >
                        {optionLabel}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
            {column.type === 'currency' && column.config.currency && (
              <span className="config-detail">Currency: {column.config.currency}</span>
            )}
            {column.type === 'datetime' && (
              <span className="config-detail">
                Format: {column.config.dateOnly ? 'Date only' : column.config.includeTime ? 'Date & Time' : 'Date'}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="column-actions">
        <Button
          variant="link"
          size="sm"
          onClick={() => onToggleVisibility(column.id)}
          title={column.visible ? 'Hide column' : 'Show column'}
          className={`action-btn visibility-btn ${!column.visible ? 'hidden' : ''}`}
        >
          {column.visible ? <Eye size={18} /> : <EyeOff size={18} />}
        </Button>
        <Button
          variant="link"
          size="sm"
          onClick={() => onEdit(column)}
          title="Edit column"
          className="action-btn edit-btn"
        >
          <Edit2 size={18} />
        </Button>
        <Button
          variant="link"
          size="sm"
          onClick={() => onDelete(column.id)}
          title="Delete column"
          className="action-btn delete-btn"
        >
          <Trash2 size={18} />
        </Button>
      </div>
    </div>
  )
}

export const ColumnConfigModal = ({ show, onHide, column, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    name: column?.name || '',
    type: column?.type || 'text',
    required: column?.required || false,
    visible: column?.visible !== undefined ? column.visible : true,
    config: column?.config || {}
  })

  // Reset form when modal opens/closes or column changes
  useEffect(() => {
    if (show) {
      if (column) {
        // Editing existing column - normalize choice options if needed
        let config = column.config || {}
        if (column.type === 'choice' && config.options) {
          config = {
            ...config,
            options: normalizeOptions(config.options)
          }
        }

        setFormData({
          name: column.name || '',
          type: column.type || 'text',
          required: column.required || false,
          visible: column.visible !== undefined ? column.visible : true,
          config: config
        })
      } else {
        // New column
        setFormData({
          name: '',
          type: 'text',
          required: false,
          visible: true,
          config: {}
        })
      }
    }
  }, [show, column])

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Column name is required')
      return
    }

    // Validate config based on type
    if (formData.type === 'choice' || formData.type === 'dropdown') {
      // Filter out empty options and normalize to object format
      const normalizedOptions = normalizeOptions(formData.config.options || [])
      const validOptions = normalizedOptions.filter(opt => {
        if (typeof opt === 'string') {
          return opt && opt.trim()
        }
        return opt && opt.label && opt.label.trim()
      })

      if (validOptions.length === 0) {
        alert('Please add at least one option for choice field')
        return
      }

      // Ensure all options have colors
      const optionsWithColors = validOptions.map(opt => {
        if (typeof opt === 'string') {
          const defaultColors = ['#0078d4', '#107c10', '#ffaa44', '#e81123', '#8764b8', '#00bcf2', '#ff8c00', '#737373']
          return { label: opt, color: defaultColors[validOptions.indexOf(opt) % defaultColors.length] }
        }
        return { label: opt.label.trim(), color: opt.color || '#0078d4' }
      })

      // Update config with normalized options
      formData.config.options = optionsWithColors
    }

    try {
      console.log('Saving column:', formData)
      onSave(formData)
      onHide()
    } catch (error) {
      console.error('Error saving column:', error)
      alert('Failed to save column. Please try again.')
    }
  }

  const updateConfig = (key, value) => {
    setFormData({
      ...formData,
      config: { ...formData.config, [key]: value }
    })
  }

  const handleAddOption = () => {
    const options = formData.config.options || []
    // Default colors for new options (SharePoint-like colors)
    const defaultColors = ['#0078d4', '#107c10', '#ffaa44', '#e81123', '#8764b8', '#00bcf2', '#ff8c00', '#737373']
    const colorIndex = options.length % defaultColors.length

    // Support both string format (backward compatibility) and object format
    const newOption = typeof options[0] === 'string'
      ? '' // If existing options are strings, add string for compatibility
      : { label: '', color: defaultColors[colorIndex] } // Otherwise use object format

    updateConfig('options', [...options, newOption])
  }

  const handleOptionChange = (index, value) => {
    const options = [...(formData.config.options || [])]
    // Handle both string and object formats
    if (typeof options[index] === 'string') {
      options[index] = value
    } else {
      options[index] = { ...options[index], label: value }
    }
    updateConfig('options', options)
  }

  const handleOptionColorChange = (index, color) => {
    const options = [...(formData.config.options || [])]
    // Convert string to object format if needed
    if (typeof options[index] === 'string') {
      options[index] = { label: options[index], color: color }
    } else {
      options[index] = { ...options[index], color: color }
    }
    updateConfig('options', options)
  }

  const handleRemoveOption = (index) => {
    const options = [...(formData.config.options || [])]
    options.splice(index, 1)
    updateConfig('options', options)
  }

  // Use the module-level normalizeOptions function

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{column ? 'Edit Column' : 'Add Column'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Column Name *</Form.Label>
            <Form.Control
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter column name"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Field Type *</Form.Label>
            <Form.Select
              value={formData.type}
              onChange={(e) => {
                const newType = e.target.value
                // For choice type, initialize with object format (label + color)
                const newConfig = (newType === 'choice' || newType === 'dropdown')
                  ? { options: [{ label: '', color: '#0078d4' }] }
                  : {}
                setFormData({ ...formData, type: newType, config: newConfig })
              }}
              disabled={!!column}
            >
              {fieldTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Check
            type="checkbox"
            label="Required"
            checked={formData.required}
            onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
            className="mb-3"
          />

          <Form.Check
            type="checkbox"
            label="Visible by default"
            checked={formData.visible}
            onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
            className="mb-3"
          />

          {/* Text Config */}
          {formData.type === 'text' && (
            <Form.Group className="mb-3">
              <Form.Label>Max Length</Form.Label>
              <Form.Control
                type="number"
                value={formData.config.maxLength || ''}
                onChange={(e) => updateConfig('maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="No limit"
              />
            </Form.Group>
          )}

          {/* Email Config */}
          {formData.type === 'email' && (
            <Form.Group className="mb-3">
              <Form.Text className="text-muted">
                <strong>Tip:</strong> Name this column "Assigned To" or "Assigned" to enable automatic email notifications for overdue tasks.
                When a task has notifications enabled and is past its due date, an email will be sent to the assigned user.
              </Form.Text>
            </Form.Group>
          )}

          {/* Choice Config */}
          {(formData.type === 'choice' || formData.type === 'dropdown') && (
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label>Options *</Form.Label>
                <Button variant="outline-primary" size="sm" onClick={handleAddOption}>
                  <Plus size={14} className="me-1" />
                  Add Option
                </Button>
              </div>
              {normalizeOptions(formData.config.options || []).map((option, index) => (
                <div key={index} className="d-flex gap-2 mb-2 align-items-center">
                  <Form.Control
                    type="text"
                    value={option.label}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-grow-1"
                  />
                  <div className="d-flex align-items-center gap-2">
                    <Form.Label className="mb-0" style={{ fontSize: '0.875rem', whiteSpace: 'nowrap', minWidth: '50px' }}>
                      Color:
                    </Form.Label>
                    <div className="d-flex align-items-center gap-1">
                      <input
                        type="color"
                        value={option.color || '#0078d4'}
                        onChange={(e) => handleOptionColorChange(index, e.target.value)}
                        className="option-color-input"
                        title="Choose color for this option"
                      />
                      <div
                        className="option-color-preview"
                        style={{
                          backgroundColor: option.color || '#0078d4'
                        }}
                        title={`Current color: ${option.color || '#0078d4'}`}
                      />
                    </div>
                  </div>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleRemoveOption(index)}
                    title="Remove option"
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
              <Form.Check
                type="checkbox"
                label="Allow multiple selection"
                checked={formData.config.multiSelect || false}
                onChange={(e) => updateConfig('multiSelect', e.target.checked)}
                className="mt-2"
              />
            </div>
          )}

          {/* Currency Config */}
          {formData.type === 'currency' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Currency Code</Form.Label>
                <Form.Select
                  value={formData.config.currency || 'USD'}
                  onChange={(e) => updateConfig('currency', e.target.value)}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Decimal Places</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  max="4"
                  value={formData.config.decimals !== undefined ? formData.config.decimals : 2}
                  onChange={(e) => updateConfig('decimals', parseInt(e.target.value) || 2)}
                />
              </Form.Group>
            </>
          )}

          {/* DateTime Config */}
          {formData.type === 'datetime' && (
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Date only (no time)"
                checked={formData.config.dateOnly || false}
                onChange={(e) => updateConfig('dateOnly', e.target.checked)}
                className="mb-2"
              />
              {!formData.config.dateOnly && (
                <Form.Check
                  type="checkbox"
                  label="Include time"
                  checked={formData.config.includeTime !== false}
                  onChange={(e) => updateConfig('includeTime', e.target.checked)}
                />
              )}
            </Form.Group>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        {column && (
          <Button variant="danger" onClick={() => {
            if (window.confirm('Are you sure you want to delete this column? All data in this column will be lost.')) {
              onDelete(column.id)
              onHide()
            }
          }}>
            Delete Column
          </Button>
        )}
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          {column ? 'Update' : 'Add'} Column
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export const ColumnManager = ({ columns, onColumnsChange, onReorder }) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingColumn, setEditingColumn] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const currentColumns = Array.isArray(columns) ? columns : []
      const oldIndex = currentColumns.findIndex(col => col.id === active.id)
      const newIndex = currentColumns.findIndex(col => col.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        const newColumns = arrayMove(currentColumns, oldIndex, newIndex)
        onReorder(newColumns.map(col => col.id))
      }
    }
  }

  const handleAddColumn = (columnData) => {
    try {
      console.log('Adding column:', columnData)
      const newColumn = {
        ...columnData,
        id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
      // Ensure columns is an array
      const currentColumns = Array.isArray(columns) ? columns : []
      console.log('Current columns:', currentColumns)
      console.log('New columns array:', [...currentColumns, newColumn])
      onColumnsChange([...currentColumns, newColumn])
    } catch (error) {
      console.error('Error adding column:', error)
      alert('Failed to add column. Please try again.')
    }
  }

  const handleUpdateColumn = (columnData) => {
    const currentColumns = Array.isArray(columns) ? columns : []
    const updatedColumns = currentColumns.map(col =>
      col.id === editingColumn.id ? { ...col, ...columnData } : col
    )
    onColumnsChange(updatedColumns)
    setEditingColumn(null)
  }

  const handleToggleVisibility = (columnId) => {
    const currentColumns = Array.isArray(columns) ? columns : []
    const updatedColumns = currentColumns.map(col =>
      col.id === columnId ? { ...col, visible: !col.visible } : col
    )
    onColumnsChange(updatedColumns)
  }

  const handleDeleteColumn = (columnId) => {
    if (window.confirm('Are you sure you want to delete this column? All data in this column will be lost.')) {
      const currentColumns = Array.isArray(columns) ? columns : []
      const updatedColumns = currentColumns.filter(col => col.id !== columnId)
      onColumnsChange(updatedColumns)
    }
  }

  return (
    <div className="column-manager-container">
      <div className="column-manager-header">
        <div className="column-manager-title-section">
          <h6 className="column-manager-title">Columns</h6>
          <span className="column-count-badge">{Array.isArray(columns) ? columns.length : 0}</span>
        </div>
        <Button
          className="add-column-btn"
          size="sm"
          onClick={() => {
            setEditingColumn(null)
            setShowAddModal(true)
          }}
        >
          <Plus size={18} className="me-2" />
          Add Column
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={(Array.isArray(columns) ? columns : []).map(col => col.id)}>
          <div className="columns-list">
            {(Array.isArray(columns) ? columns : []).map(column => (
              <SortableColumnItem
                key={column.id}
                column={column}
                onToggleVisibility={handleToggleVisibility}
                onEdit={(col) => {
                  setEditingColumn(col)
                  setShowAddModal(true)
                }}
                onDelete={handleDeleteColumn}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {(!Array.isArray(columns) || columns.length === 0) && (
        <div className="empty-columns-state">
          <div className="empty-icon">📋</div>
          <p className="empty-title">No columns yet</p>
          <p className="empty-description">Add your first column to get started with your task list</p>
        </div>
      )}

      <ColumnConfigModal
        show={showAddModal}
        onHide={() => {
          setShowAddModal(false)
          setEditingColumn(null)
        }}
        column={editingColumn}
        onSave={editingColumn ? handleUpdateColumn : handleAddColumn}
        onDelete={handleDeleteColumn}
      />
    </div>
  )
}
