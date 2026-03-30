import { useState, useEffect } from 'react'
import { Form, Button } from 'react-bootstrap'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { FieldRenderer } from './FieldRenderers'
import { StandardModal } from '../../components/StandardModal/StandardModal'

export const TaskModal = ({ show, onHide, task, columns, onSave, onDelete, onAddColumn, onEditColumn, onDeleteColumn }) => {
  const [formValues, setFormValues] = useState({})
  const [errors, setErrors] = useState({})
  const [notify, setNotify] = useState(false)

  useEffect(() => {
    if (show) {
      if (task) {
        setFormValues(task.values || {})
        setNotify(task.notify || false)
      } else {
        // Initialize with empty values
        const initialValues = {}
        if (Array.isArray(columns) && columns.length > 0) {
          columns.forEach(col => {
            if (col && col.id) {
              if ((col.type === 'choice' || col.type === 'dropdown') && col.config?.multiSelect) {
                initialValues[col.id] = []
              } else {
                initialValues[col.id] = null
              }
            }
          })
        }
        setFormValues(initialValues)
        setNotify(false)
      }
      setErrors({})
    }
  }, [task, columns, show])

  const handleFieldChange = (columnId, value) => {
    setFormValues({
      ...formValues,
      [columnId]: value
    })
    // Clear error for this field
    if (errors[columnId]) {
      setErrors({
        ...errors,
        [columnId]: null
      })
    }
  }

  const validate = () => {
    if (!Array.isArray(columns) || columns.length === 0) {
      console.warn('TaskModal: No columns configured')
      return false
    }

    const newErrors = {}
    columns.forEach(col => {
      // Skip auto-generated/readOnly columns in validation
      if (col?.config?.readOnly || col?.config?.autoIncrement) {
        return
      }
      if (col && col.required) {
        const value = formValues[col.id]
        if (value === null || value === undefined || value === '' ||
          (Array.isArray(value) && value.length === 0)) {
          newErrors[col.id] = `${col.name} is required`
        }
      }
    })
    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!Array.isArray(columns) || columns.length === 0) {
      console.warn('TaskModal: Cannot save - no columns configured')
      return
    }

    if (validate()) {
      try {
        onSave(formValues, notify)
        onHide()
      } catch (error) {
        console.error('Error in handleSave:', error)
        setErrors({ _general: 'Failed to save task: ' + (error.message || 'Unknown error') })
      }
    }
  }

  // Filter out auto-generated/readOnly columns from form
  const editableColumns = Array.isArray(columns)
    ? columns.filter(col => col && col.id && !col.config?.readOnly && !col.config?.autoIncrement)
    : []

  return (
    <StandardModal
      show={show}
      onHide={onHide}
      title={task ? 'Edit Task' : 'Create New Task'}
      onSubmit={handleSave}
      submitLabel={task ? 'Update Task' : 'Create Task'}
      onDelete={task && onDelete ? () => { if (window.confirm('Delete?')) onDelete(task.id) } : undefined}
      deleteLabel="Delete"
    >
        {editableColumns.length === 0 ? (
          <div className="text-center text-muted py-4">
            <p>No columns configured.</p>
          </div>
        ) : (
          <Form>
            {/* General error display */}
            {errors._general && (
              <div className="alert alert-danger mb-3" role="alert">
                {errors._general}
              </div>
            )}

            {/* Render specific fields in order if they exist, otherwise fallback or dynamic loop could be better but for strict design we check specifically */}
            {/* Title */}
            {editableColumns.find(c => c.id === 'title') && (
              <Form.Group className="mb-4">
                <Form.Label className="task-form-label">
                  Title <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter text"
                  className="task-form-control"
                  value={formValues['title'] || ''}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                />
                {errors['title'] && <Form.Text className="text-danger">{errors['title']}</Form.Text>}
              </Form.Group>
            )}

            {/* Status */}
            {(() => {
              const statusCol = editableColumns.find(c => c.id === 'status');
              return statusCol && (
                <Form.Group className="mb-4">
                  <Form.Label className="task-form-label">Status</Form.Label>
                  <Form.Select
                    className="task-form-control"
                    value={formValues['status'] || ''}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                  >
                    <option value="">Select...</option>
                    {statusCol.config?.options?.map((opt, idx) => (
                      <option key={idx} value={opt.label}>{opt.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              );
            })()}

            {/* Priority */}
            {(() => {
              const priorityCol = editableColumns.find(c => c.id === 'priority');
              return priorityCol && (
                <Form.Group className="mb-4">
                  <Form.Label className="task-form-label">Priority</Form.Label>
                  <Form.Select
                    className="task-form-control"
                    value={formValues['priority'] || ''}
                    onChange={(e) => handleFieldChange('priority', e.target.value)}
                  >
                    <option value="">Select...</option>
                    {priorityCol.config?.options?.map((opt, idx) => (
                      <option key={idx} value={opt.label}>{opt.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              );
            })()}

            {/* Due Date */}
            {editableColumns.find(c => c.id === 'dueDate') && (
              <Form.Group className="mb-4">
                <Form.Label className="task-form-label">Due Date</Form.Label>
                <Form.Control
                  type="date"
                  className="task-form-control"
                  value={formValues['dueDate'] ? new Date(formValues['dueDate']).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                  placeholder="dd-mm-yyyy"
                />
              </Form.Group>
            )}

            {/* Render any newly added custom columns */}
            {editableColumns
              .filter(c => !['title', 'status', 'priority', 'dueDate'].includes(c.id))
              .map(col => (
                <Form.Group key={col.id} className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <Form.Label className="task-form-label mb-0">
                      {col.name} {col.required && <span className="text-danger">*</span>}
                    </Form.Label>
                    <div className="d-flex gap-2">
                      <Button variant="link" size="sm" className="p-0 text-muted" onClick={() => onEditColumn && onEditColumn(col)} title="Edit Field">
                        <Edit2 size={14} />
                      </Button>
                      <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => onDeleteColumn && onDeleteColumn(col.id)} title="Delete Field">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  <div className="task-field-wrapper">
                    <FieldRenderer
                      column={col}
                      value={formValues[col.id]}
                      onChange={(val) => handleFieldChange(col.id, val)}
                      isEditing={true}
                    />
                  </div>
                  {errors[col.id] && <Form.Text className="text-danger">{errors[col.id]}</Form.Text>}
                </Form.Group>
            ))}

            {/* Notification Checkbox */}
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="task-notify"
                label={<span className="fw-semibold text-dark">Notify this task</span>}
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
              />
              <Form.Text className="text-muted d-block mt-1">
                Enable notifications for this task. A notification icon will appear in the action column.
              </Form.Text>
            </Form.Group>

          </Form>
        )}
    </StandardModal>
  )
}
