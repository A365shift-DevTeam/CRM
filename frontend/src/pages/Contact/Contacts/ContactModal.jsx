import { useState, useEffect, useMemo } from 'react'
import { Modal, Form, Button, Row, Col } from 'react-bootstrap'

const STATUS_OPTIONS = ['Active', 'Inactive', 'Lead', 'Customer']

const JOB_TITLES = [
  'CEO',
  'CTO',
  'manager',
  'Software Engineer',
  'Product Manager',
  'Sales Representative',
  'Designer',
  'HR Manager',
  'Accountant',
  'Consultant',
  'Director',
  'Other'
];

const COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Germany',
  'Australia',
  'Japan',
  'Singapore',
  'United Arab Emirates',
  'France'
];

const LOCATIONS = [
  'New York, USA',
  'London, UK',
  'San Francisco, USA',
  'Toronto, Canada',
  'Berlin, Germany',
  'Sydney, Australia',
  'Tokyo, Japan',
  'Singapore',
  'Mumbai, India',
  'Paris, France'
];

const ENTITY_TYPES = ['Company', 'Individual', 'Vendor']

// Helper function to get default value for a field
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

// Helper function to render field based on column type
const renderField = (column, value, onChange, errors, formData) => {
  const fieldId = column.id
  const isRequired = column.required
  const isInvalid = !!errors[fieldId]

  // Special handling for entityType field (map to both 'type' and 'entityType')
  if (fieldId === 'type') {
    const options = column.config?.options?.map(o => typeof o === 'string' ? o : o.label) || ENTITY_TYPES
    return (
      <Form.Select
        size="sm"
        value={formData.entityType || formData.type || ''}
        onChange={(e) => {
          onChange('entityType', e.target.value)
          onChange('type', e.target.value)
        }}
        isInvalid={isInvalid}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </Form.Select>
    )
  }

  // Choice/Dropdown fields
  if (column.type === 'choice' && column.config?.options) {
    const options = column.config.options.map(o => typeof o === 'string' ? o : o.label)
    return (
      <Form.Select
        size="sm"
        value={value || ''}
        onChange={(e) => onChange(fieldId, e.target.value)}
        isInvalid={isInvalid}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </Form.Select>
    )
  }

  // Number fields
  if (column.type === 'number') {
    return (
      <Form.Control
        size="sm"
        type="number"
        step={column.config?.step || "0.01"}
        value={value || ''}
        onChange={(e) => onChange(fieldId, e.target.value)}
        isInvalid={isInvalid}
        placeholder={column.config?.placeholder || `Enter ${column.name}`}
      />
    )
  }

  // Location fields with datalist
  if (column.type === 'location') {
    return (
      <>
        <Form.Control
          size="sm"
          type="text"
          list={`location-suggestions-${fieldId}`}
          value={value || ''}
          onChange={(e) => onChange(fieldId, e.target.value)}
          isInvalid={isInvalid}
          placeholder={column.config?.placeholder || `Enter or select ${column.name}`}
        />
        <datalist id={`location-suggestions-${fieldId}`}>
          {LOCATIONS.map(loc => (
            <option key={loc} value={loc} />
          ))}
        </datalist>
      </>
    )
  }

  // Textarea for notes
  if (fieldId === 'notes' || column.type === 'textarea') {
    return (
      <Form.Control
        size="sm"
        as="textarea"
        rows={column.config?.rows || 2}
        value={value || ''}
        onChange={(e) => onChange(fieldId, e.target.value)}
        isInvalid={isInvalid}
        placeholder={column.config?.placeholder || `Enter ${column.name}`}
      />
    )
  }

  // Special handling for jobTitle with datalist
  if (fieldId === 'jobTitle') {
    return (
      <>
        <Form.Control
          size="sm"
          type="text"
          list="job-title-suggestions"
          value={value || ''}
          onChange={(e) => onChange(fieldId, e.target.value)}
          isInvalid={isInvalid}
          placeholder={column.config?.placeholder || "Enter or select Role"}
        />
        <datalist id="job-title-suggestions">
          {JOB_TITLES.map(title => (
            <option key={title} value={title} />
          ))}
        </datalist>
      </>
    )
  }

  // Email fields
  if (fieldId === 'email' || column.type === 'email') {
    return (
      <Form.Control
        size="sm"
        type="email"
        value={value || ''}
        onChange={(e) => onChange(fieldId, e.target.value)}
        isInvalid={isInvalid}
        placeholder={column.config?.placeholder || "Email Address"}
      />
    )
  }

  // Phone fields
  if (fieldId === 'phone' || column.type === 'tel') {
    return (
      <Form.Control
        size="sm"
        type="tel"
        value={value || ''}
        onChange={(e) => onChange(fieldId, e.target.value)}
        isInvalid={isInvalid}
        placeholder={column.config?.placeholder || "Phone Number"}
      />
    )
  }

  // URL fields (LinkedIn)
  if (fieldId === 'linkedin' || column.type === 'url') {
    return (
      <Form.Control
        size="sm"
        type="url"
        value={value || ''}
        onChange={(e) => onChange(fieldId, e.target.value)}
        isInvalid={isInvalid}
        placeholder={column.config?.placeholder || "Profile URL"}
      />
    )
  }

  // Country dropdown
  if (fieldId === 'clientCountry') {
    return (
      <Form.Select
        size="sm"
        value={value || 'India'}
        onChange={(e) => onChange(fieldId, e.target.value)}
        isInvalid={isInvalid}
      >
        {COUNTRIES.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
        <option value="Other">Other</option>
      </Form.Select>
    )
  }

  // MSME Status dropdown
  if (fieldId === 'msmeStatus') {
    return (
      <Form.Select
        size="sm"
        value={value || 'NON MSME'}
        onChange={(e) => onChange(fieldId, e.target.value)}
        isInvalid={isInvalid}
      >
        <option value="NON MSME">NON MSME</option>
        <option value="MSME">MSME</option>
      </Form.Select>
    )
  }

  // TDS Section dropdown
  if (fieldId === 'tdsSection') {
    return (
      <Form.Select
        size="sm"
        value={value || ''}
        onChange={(e) => onChange(fieldId, e.target.value)}
        isInvalid={isInvalid}
      >
        <option value="">Select Section</option>
        <option value="194J">194J (Professional Services)</option>
        <option value="194C">194C (Contracts)</option>
        <option value="194H">194H (Commission/Brokerage)</option>
        <option value="194I">194I (Rent)</option>
        <option value="Other">Other</option>
      </Form.Select>
    )
  }

  // Default text input
  return (
    <Form.Control
      size="sm"
      type="text"
      value={value || ''}
      onChange={(e) => onChange(fieldId, e.target.value)}
      isInvalid={isInvalid}
      placeholder={column.config?.placeholder || `Enter ${column.name}`}
    />
  )
}

export const ContactModal = ({ show, onHide, contact, columns = [], onSave, onDelete }) => {
  // Initialize formData dynamically from columns
  const initializeFormData = (cols, contactData = null) => {
    const initialData = {}
    cols.forEach(col => {
      if (col && col.id) {
        if (contactData) {
          // For editing: use contact data, fallback to defaults
          // Handle category field specifically - preserve empty strings
          if (col.id === 'category') {
            initialData[col.id] = contactData[col.id] !== undefined ? contactData[col.id] : ''
          } else {
            initialData[col.id] = contactData[col.id] !== undefined ? contactData[col.id] : getDefaultValue(col)
          }
          // Special handling for entityType/type
          if (col.id === 'type') {
            initialData.entityType = contactData.entityType || contactData.type || getDefaultValue(col)
          }
        } else {
          // For new contact: use defaults
          initialData[col.id] = getDefaultValue(col)
          if (col.id === 'type') {
            initialData.entityType = getDefaultValue(col)
          }
        }
      }
    })

    // Debug: Log initialized form data, especially category
    if (cols.some(col => col.id === 'category')) {
      console.log('Initialized formData with category:', initialData.category, 'from contact:', contactData?.category)
    }

    return initialData
  }

  const [formData, setFormData] = useState(() => initializeFormData(columns))
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (show && columns.length > 0) {
      const newFormData = initializeFormData(columns, contact)
      setFormData(newFormData)
      setErrors({})
    }
  }, [contact, show, columns])

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
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

      // Email validation
      if (col.id === 'email' && formData.email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address'
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      // Ensure both 'type' and 'entityType' are saved
      // Also ensure category is included even if not in columns config
      const dataToSave = {
        ...formData,
        type: formData.entityType || formData.type,
        entityType: formData.entityType || formData.type,
        // Explicitly include category field - check both formData and direct input
        category: formData.category !== undefined ? formData.category : ''
      }

      // Debug: Log category field
      console.log('Form data being saved:', {
        category: formData.category,
        categoryInFormData: 'category' in formData,
        allFields: Object.keys(formData),
        categoryValue: formData.category,
        dataToSaveCategory: dataToSave.category
      })

      onSave(dataToSave)
    }
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      onDelete(contact.id)
    }
  }

  // Use columns in the exact order they're defined (no sorting)
  const displayColumns = useMemo(() => {
    return columns.filter(col => col && col.id) // Filter out invalid columns only
  }, [columns])

  // Group columns for conditional rendering (India tax fields)
  const indiaTaxFields = ['gstin', 'pan', 'cin', 'msmeStatus', 'tdsSection', 'tdsRate']
  const isIndia = formData.clientCountry === 'India'

  // Categorize fields into logical groups
  const categorizeFields = (cols) => {
    const categories = {
      basic: [],      // Name, Job Title, Email, Phone, LinkedIn
      company: [],    // Company, Location, Client Address, Country
      classification: [], // Entity Type, Status, Category, and other custom choice fields
      taxIndia: [],   // GSTIN, PAN, CIN, MSME Status, TDS Section, TDS Rate
      taxInternational: [], // International Tax ID
      additional: []  // Notes and other text fields
    }

    cols.forEach(col => {
      const fieldId = col.id

      // Basic Information
      if (['name', 'jobTitle', 'email', 'phone', 'linkedin'].includes(fieldId)) {
        categories.basic.push(col)
      }
      // Company & Location
      else if (['company', 'location', 'clientAddress', 'clientCountry'].includes(fieldId)) {
        categories.company.push(col)
      }
      // Classification (Entity Type, Status, and other choice fields that aren't tax-related)
      else if (['type', 'status', 'category'].includes(fieldId) ||
        (col.type === 'choice' && !indiaTaxFields.includes(fieldId) && fieldId !== 'msmeStatus')) {
        categories.classification.push(col)
      }
      // India Tax Fields
      else if (indiaTaxFields.includes(fieldId)) {
        categories.taxIndia.push(col)
      }
      // International Tax
      else if (fieldId === 'internationalTaxId') {
        categories.taxInternational.push(col)
      }
      // Additional (Notes and other fields)
      else {
        categories.additional.push(col)
      }
    })

    return categories
  }

  const fieldCategories = useMemo(() => categorizeFields(displayColumns), [displayColumns])

  // Helper function to render a category section
  const renderCategorySection = (title, categoryFields, showCondition = true) => {
    if (!showCondition || !categoryFields || categoryFields.length === 0) return null

    return (
      <div className="mb-4">
        <h6 className="text-uppercase text-muted fw-bold small mb-3" style={{
          letterSpacing: '0.5px',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '8px'
        }}>
          {title}
        </h6>
        <Row className="g-2">
          {categoryFields.map(column => {
            const fieldId = column.id
            const value = formData[fieldId] || ''
            const isRequired = column.required
            const colSize = fieldId === 'notes' ? 12 : 4

            return (
              <Col md={colSize} key={fieldId}>
                <Form.Group>
                  <Form.Label className="small fw-bold mb-1">
                    {column.name}
                    {isRequired && <span className="text-danger"> *</span>}
                  </Form.Label>
                  {renderField(column, value, handleChange, errors, formData)}
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
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" keyboard={false}>
      <Modal.Header closeButton className="py-2 bg-light border-bottom-0">
        <Modal.Title className="fs-6 fw-bold">
          {contact ? 'Edit Contact' : 'New Contact'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-3">
          {/* Basic Information */}
          {renderCategorySection('Basic Information', fieldCategories.basic)}

          {/* Company & Location */}
          {renderCategorySection('Company & Location', fieldCategories.company)}

          {/* Classification */}
          {renderCategorySection('Classification', fieldCategories.classification)}

          {/* Tax & Financial Information (India) */}
          {renderCategorySection('Tax & Financial Information', fieldCategories.taxIndia, isIndia)}

          {/* International Tax */}
          {renderCategorySection('Tax Information', fieldCategories.taxInternational, !isIndia)}

          {/* Additional Information */}
          {renderCategorySection('Additional Information', fieldCategories.additional)}
        </Modal.Body>
        <Modal.Footer className="py-2 border-top-0 bg-light">
          {contact && (
            <Button
              variant="link"
              className="text-danger text-decoration-none p-0 me-auto small"
              onClick={handleDelete}
            >
              Delete Contact
            </Button>
          )}
          <Button variant="outline-secondary" size="sm" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="dark" type="submit" size="sm" className="px-4">
            {contact ? 'Save Changes' : 'Create Contact'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
