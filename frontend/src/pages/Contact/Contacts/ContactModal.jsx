import { useState, useEffect, useMemo } from 'react'
import { Form, Row, Col } from 'react-bootstrap'
import { StandardModal } from '../../../components/StandardModal/StandardModal'
import { companyService } from '../../../services/companyService'
import AuditPanel from '../../../components/AuditPanel/AuditPanel'

const STATUS_OPTIONS = ['Active', 'Inactive', 'Lead', 'Customer']

const JOB_TITLES = [
  'CEO', 'CTO', 'manager', 'Software Engineer', 'Product Manager',
  'Sales Representative', 'Designer', 'HR Manager', 'Accountant',
  'Consultant', 'Director', 'Other'
]

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Germany',
  'Australia', 'Japan', 'Singapore', 'United Arab Emirates', 'France'
]

const LOCATIONS = [
  'New York, USA', 'London, UK', 'San Francisco, USA', 'Toronto, Canada',
  'Berlin, Germany', 'Sydney, Australia', 'Tokyo, Japan', 'Singapore',
  'Mumbai, India', 'Paris, France'
]

// Entity Type field removed from UI — company is now a dropdown from backend

const getDefaultValue = (column) => {
  if (column.type === 'choice' && column.config?.options) {
    return column.config.options[0]?.label || column.config.options[0] || ''
  }
  if (column.id === 'clientCountry') return 'India'
  if (column.id === 'msmeStatus') return 'NON MSME'
  if (column.id === 'status') return 'Active'
  if (column.id === 'entityType' || column.id === 'type') return 'Individual'
  if (column.type === 'number') return ''
  return ''
}

const renderField = (column, value, onChange, errors, formData, companies = []) => {
  const fieldId = column.id
  const isInvalid = !!errors[fieldId]

  if (fieldId === 'company') {
    return (
      <Form.Select size="sm" value={value || ''}
        onChange={(e) => onChange(fieldId, e.target.value)}
        isInvalid={isInvalid}>
        <option value="">Select Company</option>
        {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
      </Form.Select>
    )
  }

  if (column.type === 'choice' && column.config?.options) {
    const options = column.config.options.map(o => typeof o === 'string' ? o : o.label)
    return (
      <Form.Select size="sm" value={value || ''} onChange={(e) => onChange(fieldId, e.target.value)} isInvalid={isInvalid}>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </Form.Select>
    )
  }

  if (column.type === 'number') {
    return <Form.Control size="sm" type="number" step={column.config?.step || "0.01"} value={value || ''}
      onChange={(e) => onChange(fieldId, e.target.value)} isInvalid={isInvalid}
      placeholder={column.config?.placeholder || `Enter ${column.name}`} />
  }

  if (column.type === 'location') {
    return (
      <>
        <Form.Control size="sm" type="text" list={`location-suggestions-${fieldId}`} value={value || ''}
          onChange={(e) => onChange(fieldId, e.target.value)} isInvalid={isInvalid}
          placeholder={column.config?.placeholder || `Enter or select ${column.name}`} />
        <datalist id={`location-suggestions-${fieldId}`}>
          {LOCATIONS.map(loc => <option key={loc} value={loc} />)}
        </datalist>
      </>
    )
  }

  if (fieldId === 'notes' || column.type === 'textarea') {
    return <Form.Control size="sm" as="textarea" rows={column.config?.rows || 2} value={value || ''}
      onChange={(e) => onChange(fieldId, e.target.value)} isInvalid={isInvalid}
      placeholder={column.config?.placeholder || `Enter ${column.name}`} />
  }

  if (fieldId === 'jobTitle') {
    return (
      <>
        <Form.Control size="sm" type="text" list="job-title-suggestions" value={value || ''}
          onChange={(e) => onChange(fieldId, e.target.value)} isInvalid={isInvalid}
          placeholder={column.config?.placeholder || "Enter or select Role"} />
        <datalist id="job-title-suggestions">
          {JOB_TITLES.map(title => <option key={title} value={title} />)}
        </datalist>
      </>
    )
  }

  if (fieldId === 'email' || column.type === 'email') {
    return <Form.Control size="sm" type="email" value={value || ''}
      onChange={(e) => onChange(fieldId, e.target.value)} isInvalid={isInvalid}
      placeholder={column.config?.placeholder || "Email Address"} />
  }

  if (fieldId === 'phone' || column.type === 'tel') {
    return <Form.Control size="sm" type="tel" value={value || ''}
      onChange={(e) => onChange(fieldId, e.target.value)} isInvalid={isInvalid}
      placeholder={column.config?.placeholder || "Phone Number"} />
  }

  if (fieldId === 'linkedin' || column.type === 'url') {
    return <Form.Control size="sm" type="url" value={value || ''}
      onChange={(e) => onChange(fieldId, e.target.value)} isInvalid={isInvalid}
      placeholder={column.config?.placeholder || "Profile URL"} />
  }

  if (fieldId === 'clientCountry') {
    return (
      <Form.Select size="sm" value={value || 'India'} onChange={(e) => onChange(fieldId, e.target.value)} isInvalid={isInvalid}>
        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
        <option value="Other">Other</option>
      </Form.Select>
    )
  }

  if (fieldId === 'msmeStatus') {
    return (
      <Form.Select size="sm" value={value || 'NON MSME'} onChange={(e) => onChange(fieldId, e.target.value)} isInvalid={isInvalid}>
        <option value="NON MSME">NON MSME</option>
        <option value="MSME">MSME</option>
      </Form.Select>
    )
  }

  if (fieldId === 'tdsSection') {
    return (
      <Form.Select size="sm" value={value || ''} onChange={(e) => onChange(fieldId, e.target.value)} isInvalid={isInvalid}>
        <option value="">Select Section</option>
        <option value="194J">194J (Professional Services)</option>
        <option value="194C">194C (Contracts)</option>
        <option value="194H">194H (Commission/Brokerage)</option>
        <option value="194I">194I (Rent)</option>
        <option value="Other">Other</option>
      </Form.Select>
    )
  }

  return <Form.Control size="sm" type="text" value={value || ''}
    onChange={(e) => onChange(fieldId, e.target.value)} isInvalid={isInvalid}
    placeholder={column.config?.placeholder || `Enter ${column.name}`} />
}

export const ContactModal = ({ show, onHide, contact, columns = [], onSave, onDelete }) => {
  const [companies, setCompanies] = useState([])

  useEffect(() => {
    if (show) {
      companyService.getCompanies()
        .then(data => setCompanies(data || []))
        .catch(err => console.error('Error loading companies:', err))
    }
  }, [show])

  const initializeFormData = (cols, contactData = null) => {
    const initialData = {}
    cols.forEach(col => {
      if (col && col.id) {
        if (contactData) {
          if (col.id === 'category') {
            initialData[col.id] = contactData[col.id] !== undefined ? contactData[col.id] : ''
          } else {
            initialData[col.id] = contactData[col.id] !== undefined ? contactData[col.id] : getDefaultValue(col)
          }
          if (col.id === 'type') {
            initialData.entityType = contactData.entityType || contactData.type || getDefaultValue(col)
          }
        } else {
          initialData[col.id] = getDefaultValue(col)
          if (col.id === 'type') {
            initialData.entityType = getDefaultValue(col)
          }
        }
      }
    })
    return initialData
  }

  const [formData, setFormData] = useState(() => initializeFormData(columns))
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (show && columns.length > 0) {
      setFormData(initializeFormData(columns, contact))
      setErrors({})
    }
  }, [contact, show, columns])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  const validate = () => {
    const newErrors = {}
    columns.forEach(col => {
      if (col.required) {
        const value = formData[col.id]
        if (!value || (typeof value === 'string' && !value.trim())) {
          newErrors[col.id] = `${col.name} is required`
        }
      }
      if (col.id === 'email' && formData.email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address'
        }
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validate()) {
      const dataToSave = {
        ...formData,
        type: formData.entityType || formData.type,
        entityType: formData.entityType || formData.type,
        category: formData.category !== undefined ? formData.category : ''
      }
      onSave(dataToSave)
    }
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      onDelete(contact.id)
    }
  }

  const displayColumns = useMemo(() => {
    return columns.filter(col => col && col.id && col.id !== 'type')
  }, [columns])

  const categorizeFields = (cols) => {
    const categories = {
      basic: [], company: [], classification: [], additional: []
    }
    cols.forEach(col => {
      const fieldId = col.id
      if (['name', 'jobTitle', 'email', 'phone', 'linkedin'].includes(fieldId)) categories.basic.push(col)
      else if (['company', 'location', 'clientAddress', 'clientCountry'].includes(fieldId)) categories.company.push(col)
      else if (['status', 'category'].includes(fieldId) ||
        (col.type === 'choice' && fieldId !== 'type')) categories.classification.push(col)
      else categories.additional.push(col)
    })
    return categories
  }

  const fieldCategories = useMemo(() => categorizeFields(displayColumns), [displayColumns])

  const renderCategorySection = (title, categoryFields, showCondition = true) => {
    if (!showCondition || !categoryFields || categoryFields.length === 0) return null
    return (
      <div className="mb-4">
        <div className="standard-modal-section-title">{title}</div>
        <Row className="g-2">
          {categoryFields.map(column => {
            const fieldId = column.id
            const value = formData[fieldId] || ''
            const colSize = fieldId === 'notes' ? 12 : 4
            return (
              <Col md={colSize} key={fieldId}>
                <Form.Group>
                  <Form.Label className="small fw-bold mb-1">
                    {column.name}
                    {column.required && <span className="text-danger"> *</span>}
                  </Form.Label>
                  {renderField(column, value, handleChange, errors, formData, companies)}
                  {errors[fieldId] && (
                    <Form.Control.Feedback type="invalid" className="d-block">
                      {errors[fieldId]}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            )
          })}
        </Row>
      </div>
    )
  }

  return (
    <StandardModal
      show={show}
      onHide={onHide}
      title={contact ? 'Edit Contact' : 'New Contact'}
      size="lg"
      onSubmit={handleSubmit}
      submitLabel={contact ? 'Save Changes' : 'Create Contact'}
      onDelete={contact ? handleDelete : undefined}
      deleteLabel="Delete Contact"
    >
      {renderCategorySection('Basic Information', fieldCategories.basic)}
      {renderCategorySection('Company & Location', fieldCategories.company)}
      {renderCategorySection('Classification', fieldCategories.classification)}
      {renderCategorySection('Additional Information', fieldCategories.additional)}
      {contact?.id && (
        <div style={{ marginTop: 16, borderTop: '1px solid #E1E8F4', paddingTop: 12 }}>
          <div className="standard-modal-section-title">Change History</div>
          <AuditPanel entityName="Contact" entityId={contact.id} />
        </div>
      )}
    </StandardModal>
  )
}
