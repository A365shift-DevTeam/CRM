import { useState, useEffect } from 'react'
import { Form, Button } from 'react-bootstrap'
import { StandardModal } from '../../components/StandardModal/StandardModal'

const CATEGORIES = [
  { value: 'sales', label: 'Sales', color: '#10b981' },
  { value: 'services', label: 'Services', color: '#3b82f6' },
  { value: 'investments', label: 'Investments', color: '#8b5cf6' },
  { value: 'other', label: 'Other', color: '#f59e0b' }
]

export const IncomeModal = ({ show, onHide, income, onSave, onDelete, fields }) => {
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)

  useEffect(() => {
    if (show) {
      const initialData = {
        receiptUrl: ''
      }
      if (fields) {
        fields.forEach(f => {
          initialData[f.id] = ''
        })
      }
      initialData.date = new Date().toISOString().split('T')[0]
      initialData.category = 'sales'

      if (income) {
        Object.keys(income).forEach(key => {
          let val = income[key]
          if (key === 'date' && val) val = val.split('T')[0]
          if (key === 'amount') val = val?.toString()
          initialData[key] = val
        })
        if (!initialData.date) initialData.date = new Date().toISOString().split('T')[0]
        if (!initialData.category) initialData.category = 'sales'

        setFilePreview(income.receiptUrl || null)
      } else {
        setFilePreview(null)
      }
      setFormData(initialData)
      setSelectedFile(null)
      setErrors({})
    }
  }, [income, show, fields])

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}

    // Config validation
    if (fields) {
      fields.forEach(f => {
        if (f.required && !formData[f.id]) {
          newErrors[f.id] = `${f.label} is required`
        }
        if (f.type === 'number' && formData[f.id] && parseFloat(formData[f.id]) <= 0 && f.id === 'amount') {
          newErrors[f.id] = 'Amount must be greater than 0'
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        setErrors(prev => ({ ...prev, receiptFile: 'Please select an image or PDF file' }))
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, receiptFile: 'File size must be less than 5MB' }))
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setFilePreview(reader.result)
        setFormData(prev => ({ ...prev, receiptUrl: reader.result }))
      }
      reader.readAsDataURL(file)
      if (errors.receiptFile) setErrors(prev => ({ ...prev, receiptFile: null }))
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    setFormData(prev => ({ ...prev, receiptUrl: '' }))
  }

  const handleSave = () => {
    if (validate()) {
      const incomeData = {
        ...formData,
        amount: formData.amount ? parseFloat(formData.amount) : 0,
        date: new Date(formData.date).toISOString(),
        receiptUrl: formData.receiptUrl || null
      }
      onSave(incomeData)
      onHide()
    }
  }

  const renderField = (field) => {
    const commonProps = {
      value: formData[field.id] || '',
      onChange: (e) => handleChange(field.id, e.target.value),
      isInvalid: !!errors[field.id],
      required: field.required
    }

    if (field.id === 'category') {
      const selectedCategory = CATEGORIES.find(cat => cat.value === formData.category)
      return (
        <Form.Group className="mb-3" key={field.id}>
          <Form.Label>{field.label} {field.required && <span className="text-danger">*</span>}</Form.Label>
          <Form.Select {...commonProps}>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </Form.Select>
          {selectedCategory && (
            <Form.Text className="d-flex align-items-center gap-2 mt-1">
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: selectedCategory.color, display: 'inline-block' }} />
              <span>{selectedCategory.label}</span>
            </Form.Text>
          )}
          {errors.category && <Form.Text className="text-danger d-block">{errors.category}</Form.Text>}
        </Form.Group>
      )
    }

    if (field.type === 'select') {
      const ops = field.options || []
      return (
        <Form.Group className="mb-3" key={field.id}>
          <Form.Label>{field.label} {field.required && <span className="text-danger">*</span>}</Form.Label>
          <Form.Select {...commonProps}>
            <option value="">Select...</option>
            {ops.map(o => <option key={o} value={o}>{o}</option>)}
          </Form.Select>
          {errors[field.id] && <Form.Control.Feedback type="invalid">{errors[field.id]}</Form.Control.Feedback>}
        </Form.Group>
      )
    }

    if (field.type === 'textarea') {
      return (
        <Form.Group className="mb-3" key={field.id}>
          <Form.Label>{field.label} {field.required && <span className="text-danger">*</span>}</Form.Label>
          <Form.Control as="textarea" rows={3} {...commonProps} />
          {errors[field.id] && <Form.Control.Feedback type="invalid">{errors[field.id]}</Form.Control.Feedback>}
        </Form.Group>
      )
    }

    return (
      <Form.Group className="mb-3" key={field.id}>
        <Form.Label>{field.label} {field.required && <span className="text-danger">*</span>}</Form.Label>
        <Form.Control type={field.type} {...commonProps} />
        {errors[field.id] && <Form.Control.Feedback type="invalid">{errors[field.id]}</Form.Control.Feedback>}
      </Form.Group>
    )
  }

  return (
    <StandardModal
      show={show}
      onHide={onHide}
      title={income ? 'Edit Income' : 'Create New Income'}
      size="lg"
      onSubmit={handleSave}
      submitLabel={income ? 'Update Income' : 'Create Income'}
      onDelete={income ? () => { if (window.confirm('Delete?')) { onDelete(income.id); onHide(); } } : undefined}
      deleteLabel="Delete"
    >
          {fields && fields.sort((a, b) => (a.order || 99) - (b.order || 99)).map(field => {
            if (field.id === 'receipt') return null
            return renderField(field)
          })}

          {/* Receipt */}
          <Form.Group className="mb-3">
            <Form.Label>Receipt</Form.Label>
            <Form.Control
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              isInvalid={!!errors.receiptFile}
            />
            {errors.receiptFile && (
              <Form.Text className="text-danger d-block">{errors.receiptFile}</Form.Text>
            )}
            <Form.Text className="text-muted">
              Upload an image or PDF file (max 5MB)
            </Form.Text>
            {filePreview && (
              <div className="mt-3">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="text-muted small">Receipt Preview:</span>
                  <Button variant="link" size="sm" className="text-danger p-0" onClick={handleRemoveFile}>Remove</Button>
                </div>
                {filePreview.startsWith('data:image/') ? (
                  <img src={filePreview} alt="Receipt preview" style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #dee2e6', borderRadius: '4px', padding: '4px' }} />
                ) : (
                  <div className="border p-3 rounded bg-light">PDF file selected</div>
                )}
              </div>
            )}
          </Form.Group>
    </StandardModal>
  )
}
