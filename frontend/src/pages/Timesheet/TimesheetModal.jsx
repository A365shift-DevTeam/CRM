import { useState, useEffect } from 'react'
import { Modal, Form, Button, Dropdown, InputGroup, Spinner, ProgressBar } from 'react-bootstrap'
import { Calendar, Clock, FileText, User, Building2, CheckCircle, Paperclip, ListChecks, Info, X, Upload, File, Image, FileSpreadsheet } from 'lucide-react'
import { uploadFile, deleteFile, formatFileSize, getFileTypeLabel } from '../../services/storageService'

const getColumnIcon = (columnId) => {
  const iconMap = {
    'col-task': ListChecks,
    'col-start-datetime': Calendar,
    'col-end-datetime': Calendar,
    'col-notes': FileText,
    'col-name': User,
    'col-customer': CheckCircle,
    'col-site': Building2,
    'col-attachments': Paperclip
  }
  return iconMap[columnId] || FileText
}

/* ── File type icon helper ──────────────────────────── */
const getFileIcon = (fileType) => {
  if (!fileType) return File
  if (fileType.startsWith('image/')) return Image
  if (fileType === 'application/pdf') return FileText
  if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType === 'text/csv') return FileSpreadsheet
  return File
}

/* ── Attachment upload widget ───────────────────────── */
const FileUploadField = ({ column, value, onChange, errors }) => {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const isRequired = column.required
  const hasError = !!errors[column.id]
  const IconComponent = getColumnIcon(column.id)

  // value is expected to be an object: { url, fileName, fileType, fileSize, publicId } or a legacy string URL
  const attachment = typeof value === 'object' && value !== null ? value : (value ? { url: value, fileName: 'Attachment', fileType: '', fileSize: 0, publicId: '' } : null)

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file size (max 10MB for free plan)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File too large. Maximum size is 10 MB.')
      return
    }

    try {
      setUploading(true)
      setUploadError(null)

      const result = await uploadFile(file, 'timesheet-attachments')

      onChange(column.id, {
        url: result.url,
        fileName: result.fileName,
        fileType: result.fileType,
        fileSize: result.fileSize,
        publicId: result.publicId
      })
    } catch (err) {
      console.error('Upload failed:', err)
      // Show user-friendly error message
      let errorMessage = err.message || 'Upload failed. Please try again.'

      // Provide helpful hints for common errors
      if (errorMessage.includes('Authentication')) {
        errorMessage += ' Please log out and log back in.'
      }

      setUploadError(errorMessage)
    } finally {
      setUploading(false)
      // Reset file input so the same file can be re-selected
      e.target.value = ''
    }
  }

  const handleRemove = async () => {
    if (attachment?.publicId) {
      try {
        await deleteFile(attachment.publicId)
      } catch (err) {
        console.error('Failed to delete from storage:', err)
      }
    }
    onChange(column.id, null)
  }

  const FileIcon = attachment ? getFileIcon(attachment.fileType) : File

  return (
    <Form.Group className="mb-3">
      <Form.Label className="timesheet-form-label d-flex align-items-center gap-2">
        <IconComponent size={16} className="text-muted" />
        <span className="fw-semibold">
          {column.name} {isRequired && <span className="text-danger">*</span>}
        </span>
      </Form.Label>

      {/* Show existing attachment */}
      {attachment && !uploading && (
        <div className="attachment-preview d-flex align-items-center gap-3 p-3 rounded-3 mb-2"
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0'
          }}
        >
          <div className="d-flex align-items-center justify-content-center rounded-2"
            style={{
              width: 42,
              height: 42,
              background: attachment.fileType?.startsWith('image/') ? '#eff6ff' : attachment.fileType === 'application/pdf' ? '#fef2f2' : '#f0fdf4',
              color: attachment.fileType?.startsWith('image/') ? '#3b82f6' : attachment.fileType === 'application/pdf' ? '#ef4444' : '#10b981',
              flexShrink: 0
            }}
          >
            <FileIcon size={20} />
          </div>
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <div className="fw-semibold text-truncate" style={{ fontSize: '0.875rem', color: '#0f172a' }}>
              {attachment.fileName || 'Attachment'}
            </div>
            <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {attachment.fileType && <span>{getFileTypeLabel(attachment.fileType)}</span>}
              {attachment.fileSize > 0 && <span>• {formatFileSize(attachment.fileSize)}</span>}
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              style={{ fontSize: '0.78rem', borderRadius: 8 }}
            >
              View
            </a>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center"
              style={{ width: 32, height: 32, borderRadius: 8, padding: 0 }}
              onClick={handleRemove}
              title="Remove attachment"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Upload area */}
      {!attachment && !uploading && (
        <label
          className="d-flex flex-column align-items-center justify-content-center gap-2 p-4 rounded-3"
          style={{
            border: '2px dashed #cbd5e1',
            background: '#fafbfc',
            cursor: 'pointer',
            transition: 'all 0.2s',
            minHeight: 110
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6'
            e.currentTarget.style.background = '#eff6ff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1'
            e.currentTarget.style.background = '#fafbfc'
          }}
        >
          <Upload size={24} style={{ color: '#94a3b8' }} />
          <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>
            Click to upload a file
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Images, PDFs, Documents up to 10 MB
          </div>
          <input
            type="file"
            className="d-none"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.pptx,.zip,.rar"
          />
        </label>
      )}

      {/* Uploading state */}
      {uploading && (
        <div className="d-flex align-items-center gap-3 p-3 rounded-3"
          style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
        >
          <Spinner animation="border" size="sm" variant="primary" />
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1e40af' }}>Uploading...</div>
            <div style={{ fontSize: '0.75rem', color: '#60a5fa' }}>Please wait</div>
          </div>
        </div>
      )}

      {/* Replace button when attachment exists */}
      {attachment && !uploading && (
        <label
          className="d-inline-flex align-items-center gap-1 mt-1"
          style={{ fontSize: '0.78rem', color: '#3b82f6', cursor: 'pointer', fontWeight: 500 }}
        >
          <Upload size={12} /> Replace file
          <input
            type="file"
            className="d-none"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.pptx,.zip,.rar"
          />
        </label>
      )}

      {/* Error messages */}
      {uploadError && (
        <div
          className="mt-2 p-2 rounded"
          style={{
            fontSize: '0.8rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            fontWeight: 500
          }}
        >
          ⚠️ {uploadError}
        </div>
      )}
      {hasError && (
        <div className="invalid-feedback d-block">{errors[column.id]}</div>
      )}
    </Form.Group>
  )
}

const renderField = (column, value, onChange, errors) => {
  const fieldId = `field-${column.id}`
  const isRequired = column.required
  const hasError = !!errors[column.id]
  const IconComponent = getColumnIcon(column.id)
  const isDateTime = column.type === 'datetime' || column.type === 'date'

  switch (column.type) {
    case 'text':
      if (column.config?.multiline) {
        return (
          <Form.Group className="mb-3">
            <Form.Label className="timesheet-form-label d-flex align-items-center gap-2">
              <IconComponent size={16} className="text-muted" />
              <span className="fw-semibold">
                {column.name} {isRequired && <span className="text-danger">*</span>}
              </span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={value || ''}
              onChange={(e) => onChange(column.id, e.target.value)}
              isInvalid={hasError}
              placeholder={`Enter ${column.name.toLowerCase()}`}
              className="timesheet-form-control"
            />
            {hasError && (
              <Form.Control.Feedback type="invalid">
                {errors[column.id]}
              </Form.Control.Feedback>
            )}
          </Form.Group>
        )
      }
      return (
        <Form.Group className="mb-3">
          <Form.Label className="timesheet-form-label d-flex align-items-center gap-2">
            <IconComponent size={16} className="text-muted" />
            <span className="fw-semibold">
              {column.name} {isRequired && <span className="text-danger">*</span>}
            </span>
          </Form.Label>
          <Form.Control
            type="text"
            value={value || ''}
            onChange={(e) => onChange(column.id, e.target.value)}
            isInvalid={hasError}
            disabled={column.config?.readOnly}
            placeholder={`Enter ${column.name.toLowerCase()}`}
            className="timesheet-form-control"
          />
          {hasError && (
            <Form.Control.Feedback type="invalid">
              {errors[column.id]}
            </Form.Control.Feedback>
          )}
        </Form.Group>
      )

    case 'number':
      return (
        <Form.Group className="mb-3">
          <Form.Label className="timesheet-form-label d-flex align-items-center gap-2">
            <IconComponent size={16} className="text-muted" />
            <span className="fw-semibold">
              {column.name} {isRequired && <span className="text-danger">*</span>}
            </span>
          </Form.Label>
          <Form.Control
            type="number"
            value={value || ''}
            onChange={(e) => onChange(column.id, e.target.value ? Number(e.target.value) : '')}
            isInvalid={hasError}
            placeholder={`Enter ${column.name.toLowerCase()}`}
            className="timesheet-form-control"
          />
          {hasError && (
            <Form.Control.Feedback type="invalid">
              {errors[column.id]}
            </Form.Control.Feedback>
          )}
        </Form.Group>
      )

    case 'datetime':
    case 'date': {
      const getLocalDateTime = (isoString) => {
        if (!isoString) return ''
        const date = new Date(isoString)
        if (isNaN(date.getTime())) return ''
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        if (column.type === 'date') {
          return `${year}-${month}-${day}`
        }
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}`
      }

      return (
        <Form.Group className="mb-3">
          <Form.Label className="timesheet-form-label d-flex align-items-center gap-2">
            <IconComponent size={16} className="text-muted" />
            <span className="fw-semibold">
              {column.name} {isRequired && <span className="text-danger">*</span>}
            </span>
            {isDateTime && (
              <Info size={12} className="text-muted ms-1" />
            )}
          </Form.Label>
          <InputGroup className="timesheet-input-group">
            <Form.Control
              id={fieldId}
              type={column.type === 'date' ? 'date' : 'datetime-local'}
              value={getLocalDateTime(value)}
              onChange={(e) => {
                const localValue = e.target.value
                if (localValue) {
                  const date = new Date(localValue)
                  onChange(column.id, date.toISOString())
                } else {
                  onChange(column.id, '')
                }
              }}
              isInvalid={hasError}
              className="timesheet-form-control border-end-0"
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
            />
            <InputGroup.Text
              className="bg-transparent border-start-0 text-muted"
              onClick={() => {
                const input = document.getElementById(fieldId)
                if (input && typeof input.showPicker === 'function') {
                  input.showPicker()
                }
              }}
              style={{
                cursor: 'pointer',
                borderColor: 'rgba(0, 0, 0, 0.12)',
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderLeft: 'none'
              }}
            >
              <Calendar size={16} />
            </InputGroup.Text>
            {hasError && (
              <Form.Control.Feedback type="invalid">
                {errors[column.id]}
              </Form.Control.Feedback>
            )}
          </InputGroup>
        </Form.Group>
      )
    }

    case 'time': {
      const getLocalTime = (isoString) => {
        if (!isoString) return ''
        const date = new Date(isoString)
        if (isNaN(date.getTime())) return ''
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${hours}:${minutes}`
      }

      return (
        <Form.Group className="mb-3">
          <Form.Label className="timesheet-form-label d-flex align-items-center gap-2">
            <IconComponent size={16} className="text-muted" />
            <span className="fw-semibold">
              {column.name} {isRequired && <span className="text-danger">*</span>}
            </span>
          </Form.Label>
          <Form.Control
            type="time"
            value={getLocalTime(value)}
            onChange={(e) => {
              const timeValue = e.target.value
              if (timeValue) {
                const [hours, minutes] = timeValue.split(':')
                const date = new Date()
                date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
                onChange(column.id, date.toISOString())
              } else {
                onChange(column.id, '')
              }
            }}
            isInvalid={hasError}
            className="timesheet-form-control"
          />
          {hasError && (
            <Form.Control.Feedback type="invalid">
              {errors[column.id]}
            </Form.Control.Feedback>
          )}
        </Form.Group>
      )
    }

    case 'file':
      return (
        <FileUploadField
          column={column}
          value={value}
          onChange={onChange}
          errors={errors}
        />
      )

    case 'choice': {
      const options = column.config?.options || []
      const selectedOption = options.find(opt => {
        const optionValue = typeof opt === 'string' ? opt : opt.label || opt.value
        return optionValue === value
      })
      const displayValue = selectedOption
        ? (typeof selectedOption === 'string' ? selectedOption : selectedOption.label || selectedOption.value)
        : (value || `Select ${column.name.toLowerCase()}`)

      return (
        <Form.Group className="mb-3">
          <Form.Label className="timesheet-form-label d-flex align-items-center gap-2">
            <IconComponent size={16} className="text-muted" />
            <span className="fw-semibold">
              {column.name} {isRequired && <span className="text-danger">*</span>}
            </span>
          </Form.Label>
          <Dropdown>
            <Dropdown.Toggle
              className={`timesheet-dropdown-toggle w-100 ${hasError ? 'is-invalid' : ''}`}
              id={`choice-${column.id}`}
            >
              {displayValue}
            </Dropdown.Toggle>
            <Dropdown.Menu className="timesheet-dropdown-menu">
              <Dropdown.Item
                active={!value}
                onClick={() => onChange(column.id, '')}
              >
                Select {column.name.toLowerCase()}
              </Dropdown.Item>
              {options.map((opt, idx) => {
                const optionValue = typeof opt === 'string' ? opt : opt.label || opt.value
                return (
                  <Dropdown.Item
                    key={idx}
                    active={value === optionValue}
                    onClick={() => onChange(column.id, optionValue)}
                  >
                    {optionValue}
                  </Dropdown.Item>
                )
              })}
            </Dropdown.Menu>
          </Dropdown>
          {hasError && (
            <div className="invalid-feedback d-block">
              {errors[column.id]}
            </div>
          )}
        </Form.Group>
      )
    }

    default:
      return (
        <Form.Group className="mb-3">
          <Form.Label className="timesheet-form-label d-flex align-items-center gap-2">
            <IconComponent size={16} className="text-muted" />
            <span className="fw-semibold">
              {column.name} {isRequired && <span className="text-danger">*</span>}
            </span>
          </Form.Label>
          <Form.Control
            type="text"
            value={value || ''}
            onChange={(e) => onChange(column.id, e.target.value)}
            isInvalid={hasError}
            placeholder={`Enter ${column.name.toLowerCase()}`}
            className="timesheet-form-control"
          />
          {hasError && (
            <Form.Control.Feedback type="invalid">
              {errors[column.id]}
            </Form.Control.Feedback>
          )}
        </Form.Group>
      )
  }
}

export const TimesheetModal = ({ show, onHide, entry, columns, onSave, onDelete, initialValues = {} }) => {
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (show) {
      if (entry) {
        setFormData(entry.values || {})
      } else {
        const initialData = { ...initialValues } // Merge initial values
        columns.forEach(col => {
          if (!initialData[col.id]) {
            initialData[col.id] = col.config?.readOnly ? `TS-${Date.now()}` : ''
          }
        })
        setFormData(initialData)
      }
      setErrors({})
      setSaving(false)
    }
  }, [entry, columns, show, initialValues])

  const handleChange = (columnId, value) => {
    setFormData(prev => ({
      ...prev,
      [columnId]: value
    }))
    if (errors[columnId]) {
      setErrors(prev => ({
        ...prev,
        [columnId]: null
      }))
    }
  }

  const validate = () => {
    const newErrors = {}
    columns.forEach(column => {
      if (column.required && !formData[column.id]) {
        newErrors[column.id] = `${column.name} is required`
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (validate()) {
      setSaving(true)
      try {
        await onSave(formData)
      } catch (err) {
        console.error('Save error:', err)
      } finally {
        setSaving(false)
      }
    }
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      onDelete(entry.id)
    }
  }

  const visibleColumns = columns.filter(col => col.visible !== false)

  const sortedColumns = [...visibleColumns].sort((a, b) => {
    const order = [
      'col-task',
      'col-start-datetime',
      'col-end-datetime',
      'col-notes',
      'col-name',
      'col-customer',
      'col-site',
      'col-attachments'
    ]
    const aIndex = order.indexOf(a.id)
    const bIndex = order.indexOf(b.id)
    if (aIndex === -1 && bIndex === -1) return 0
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  return (
    <Modal show={show} onHide={onHide} size="xl" centered className="timesheet-edit-modal">
      <Modal.Header className="border-bottom pb-2">
        <Modal.Title className="mb-0">
          {entry ? 'Edit Timesheet Entry' : 'Create New Timesheet Entry'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="pt-3 pb-3" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <div className="row g-3">
            {sortedColumns
              .filter(col => col.id !== 'col-id')
              .map(column => {
                const value = formData[column.id]
                const isNotes = column.id === 'col-notes'
                const isAttachment = column.type === 'file'
                const colClass = (isNotes || isAttachment) ? 'col-12' : 'col-md-6'

                return (
                  <div key={column.id} className={colClass}>
                    {renderField(column, value, handleChange, errors)}
                  </div>
                )
              })}
          </div>
        </Modal.Body>
        <Modal.Footer className="border-top pt-3">
          {entry && (
            <Button
              variant="outline-danger"
              onClick={handleDelete}
              className="me-auto"
              disabled={saving}
            >
              Delete
            </Button>
          )}
          <Button variant="secondary" onClick={onHide} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              <>{entry ? 'Update' : 'Create'} Entry</>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
