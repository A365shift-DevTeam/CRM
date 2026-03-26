import { useState, useEffect } from 'react'
import { Modal, Form, Button } from 'react-bootstrap'

const CATEGORIES = [
  { value: 'food', label: 'Food', color: '#f59e0b' },
  { value: 'accommodation', label: 'Accommodation', color: '#8b5cf6' },
  { value: 'allowances', label: 'Allowances', color: '#10b981' },
  { value: 'silicon_server', label: 'Silicon - Server', color: '#6366f1' },
  { value: 'travel', label: 'Travel', color: '#8b5cf6' },
  { value: 'salary', label: 'Salary', color: '#14b8a6' },
  { value: 'bank_charges', label: 'Bank Charges', color: '#f43f5e' },
  { value: 'printing_stationery', label: 'Printing & Stationery', color: '#d946ef' },
  { value: 'rent', label: 'Rent', color: '#0ea5e9' },
  { value: 'professional_fees', label: 'Professional Fees', color: '#84cc16' },
  { value: 'consultancy_charges', label: 'Consultancy Charges', color: '#eab308' },
  { value: 'telephone_internet', label: 'Telephone Internet', color: '#06b6d4' },
  { value: 'software_expenses', label: 'Software Expenses', color: '#a855f7' },
  { value: 'project_tax', label: 'Project Tax & Charges', color: '#ea580c' },
  { value: 'general_expenses', label: 'General Expenses', color: '#64748b' }
]

export const ExpenseModal = ({ show, onHide, expense, onSave, onDelete, fields }) => {
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)

  // Initialize form data based on fields and expense prop
  useEffect(() => {
    if (show) {
      const initialData = {
        details: {}, // Ensure details object exists
        receiptUrl: ''
      }

      // Load defaults from fields config
      if (fields) {
        fields.forEach(f => {
          initialData[f.id] = ''
        })
      }
      // System defaults that might not be in config (if corrupted) or are objects
      initialData.date = new Date().toISOString().split('T')[0]
      initialData.category = 'travel'

      if (expense) {
        // Merge expense data
        Object.keys(expense).forEach(key => {
          // value handling
          let val = expense[key]
          if (key === 'date' && val) val = val.split('T')[0]
          if (key === 'amount') val = val?.toString()
          initialData[key] = val
        })
        // Ensure defaults if missing in expense
        if (!initialData.date) initialData.date = new Date().toISOString().split('T')[0]
        if (!initialData.category) initialData.category = 'travel'

        setFilePreview(expense.receiptUrl || null)
      } else {
        setFilePreview(null)
      }

      setFormData(initialData)
      setSelectedFile(null)
      setErrors({})
    }
  }, [expense, show, fields])

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handleDetailChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [field]: value
      }
    }))
  }

  const validate = () => {
    const newErrors = {}

    // Validate based on Config
    if (fields) {
      fields.forEach(f => {
        if (f.required && !formData[f.id]) {
          newErrors[f.id] = `${f.label} is required`
        }
        if (f.type === 'number' && formData[f.id] && parseFloat(formData[f.id]) <= 0 && f.id === 'amount') {
          newErrors[f.id] = 'Amount must be greater than 0'
        }
        if (f.id === 'employeeName' && formData[f.id]) {
          // Simple email list check if not empty
          // logic moved below to be consistent
        }
      })
    }

    // Specific hardcoded validations (if fields exist in config)
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const validateEmails = (str) => {
      if (!str) return true
      const emails = str.split(',').map(e => e.trim()).filter(e => e)
      if (emails.length === 0) return false
      return emails.every(email => emailRegex.test(email))
    }

    if (formData.category !== 'food' && formData.employeeName) {
      if (!validateEmails(formData.employeeName)) {
        newErrors.employeeName = 'Please enter valid email addresses (comma separated)'
      }
    }

    if (formData.category === 'food' && formData.details?.attendees) {
      if (!validateEmails(formData.details.attendees)) {
        newErrors.attendees = 'Please enter valid email addresses (comma separated)'
      }
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
      const expenseData = {
        ...formData,
        amount: formData.amount ? parseFloat(formData.amount) : 0,
        date: new Date(formData.date).toISOString(),
        receiptUrl: formData.receiptUrl || null
      }
      onSave(expenseData)
      onHide()
    }
  }

  const renderCategoryDetails = () => {
    const category = formData.category
    if (!category) return null

    return (
      <div className="card bg-light border-0 p-3 mb-3">
        <h6 className="mb-3 text-muted" style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
          {CATEGORIES.find(c => c.value === category)?.label || category} Details
        </h6>

        {category === 'food' && (
          <div className="row">
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Meal Type</Form.Label>
              <Form.Select
                value={formData.details?.mealType || ''}
                onChange={(e) => handleDetailChange('mealType', e.target.value)}
              >
                <option value="">Select Meal</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snacks">Snacks</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Attendee Emails</Form.Label>
              <Form.Control
                type="text"
                placeholder="comma separated"
                value={formData.details?.attendees || ''}
                onChange={(e) => handleDetailChange('attendees', e.target.value)}
                isInvalid={!!errors.attendees}
              />
              {errors.attendees && <Form.Control.Feedback type="invalid">{errors.attendees}</Form.Control.Feedback>}
            </Form.Group>
          </div>
        )}
        {category === 'accommodation' && (
          <div className="row">
            <Form.Group className="mb-3 col-12">
              <Form.Label>Hotel/Place Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter hotel name"
                value={formData.details?.hotelName || ''}
                onChange={(e) => handleDetailChange('hotelName', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>City</Form.Label>
              <Form.Control
                type="text"
                placeholder="City"
                value={formData.details?.city || ''}
                onChange={(e) => handleDetailChange('city', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-3">
              <Form.Label>Check-in</Form.Label>
              <Form.Control
                type="date"
                value={formData.details?.checkIn || ''}
                onChange={(e) => handleDetailChange('checkIn', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-3">
              <Form.Label>Check-out</Form.Label>
              <Form.Control
                type="date"
                value={formData.details?.checkOut || ''}
                onChange={(e) => handleDetailChange('checkOut', e.target.value)}
              />
            </Form.Group>
          </div>
        )}
        {category === 'allowances' && (
          <div className="row">
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Type</Form.Label>
              <Form.Select
                value={formData.details?.allowanceType || ''}
                onChange={(e) => handleDetailChange('allowanceType', e.target.value)}
              >
                <option value="">Select Type</option>
                <option value="per_diem">Per Diem</option>
                <option value="shift">Shift Allowance</option>
                <option value="hardship">Hardship</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Days/Units</Form.Label>
              <Form.Control
                type="number"
                placeholder="e.g. 5"
                value={formData.details?.units || ''}
                onChange={(e) => handleDetailChange('units', e.target.value)}
              />
            </Form.Group>
          </div>
        )}
        {category === 'silicon_server' && (
          <div className="row">
            <Form.Group className="mb-3 col-md-12">
              <Form.Label>Server Name / ID</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. AWS EC2 Instance 1"
                value={formData.details?.serverName || ''}
                onChange={(e) => handleDetailChange('serverName', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Billing Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.date || ''}
                onChange={(e) => handleChange('date', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                placeholder="Amount"
                value={formData.amount || ''}
                onChange={(e) => handleChange('amount', e.target.value)}
              />
            </Form.Group>
          </div>
        )}
        {category === 'travel' && (
          <div className="row">
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Origin</Form.Label>
              <Form.Control
                type="text"
                placeholder="From"
                value={formData.details?.origin || ''}
                onChange={(e) => handleDetailChange('origin', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Destination</Form.Label>
              <Form.Control
                type="text"
                placeholder="To / Location"
                value={formData.details?.location || ''}
                onChange={(e) => handleDetailChange('location', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Travel Purpose</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Client Meeting"
                value={formData.details?.purpose || ''}
                onChange={(e) => handleDetailChange('purpose', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Mode</Form.Label>
              <Form.Select
                value={formData.details?.mode || ''}
                onChange={(e) => handleDetailChange('mode', e.target.value)}
              >
                <option value="">Select Mode</option>
                <option value="taxi">Taxi/Uber</option>
                <option value="bus">Bus</option>
                <option value="train">Train</option>
                <option value="flight">Flight</option>
                <option value="personal">Personal Car</option>
              </Form.Select>
            </Form.Group>
            {formData.details?.mode === 'personal' && (
              <Form.Group className="mb-3 col-md-6">
                <Form.Label>Distance (km)</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.details?.distance || ''}
                  onChange={(e) => handleDetailChange('distance', e.target.value)}
                />
              </Form.Group>
            )}
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Transaction Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.date || ''}
                onChange={(e) => handleChange('date', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-4">
              <Form.Label>Currency</Form.Label>
              <Form.Select
                value={formData.currency || 'INR'}
                onChange={(e) => handleChange('currency', e.target.value)}
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="AED">AED (د.إ)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3 col-md-4">
              <Form.Label>Total Amount</Form.Label>
              <Form.Control
                type="number"
                placeholder="Amount"
                value={formData.amount || ''}
                onChange={(e) => handleChange('amount', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.details?.startDate || ''}
                onChange={(e) => handleDetailChange('startDate', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>End Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.details?.endDate || ''}
                onChange={(e) => handleDetailChange('endDate', e.target.value)}
              />
            </Form.Group>
          </div>
        )}
        {category === 'salary' && (
          <div className="row">
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Person Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Employee Name"
                value={formData.details?.personName || ''}
                onChange={(e) => {
                  handleDetailChange('personName', e.target.value)
                  handleChange('employeeName', e.target.value)
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Email ID</Form.Label>
              <Form.Control
                type="email"
                placeholder="Employee Email"
                value={formData.details?.email || ''}
                onChange={(e) => handleDetailChange('email', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Salary Amount</Form.Label>
              <Form.Control
                type="number"
                placeholder="Amount"
                value={formData.amount || ''}
                onChange={(e) => handleChange('amount', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Salary Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.date || ''}
                onChange={(e) => handleChange('date', e.target.value)}
              />
            </Form.Group>
          </div>
        )}
        {category === 'bank_charges' && (
          <div className="row">
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Charge Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.date || ''}
                onChange={(e) => handleChange('date', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                placeholder="Amount"
                value={formData.amount || ''}
                onChange={(e) => handleChange('amount', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Bank Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. HDFC, Chase"
                value={formData.details?.bankName || ''}
                onChange={(e) => handleDetailChange('bankName', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Charge Type</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Monthly Maintenance, Transfer Fee"
                value={formData.details?.chargeType || ''}
                onChange={(e) => handleDetailChange('chargeType', e.target.value)}
              />
            </Form.Group>
          </div>
        )}
        {category === 'printing_stationery' && (
          <div className="row">
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Purchase Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.date || ''}
                onChange={(e) => handleChange('date', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                placeholder="Amount"
                value={formData.amount || ''}
                onChange={(e) => handleChange('amount', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-8">
              <Form.Label>Item Description</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Printer Ink, Paper reams"
                value={formData.details?.itemDescription || ''}
                onChange={(e) => {
                  handleDetailChange('itemDescription', e.target.value)
                  handleChange('description', e.target.value)
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-4">
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="number"
                placeholder="e.g. 5"
                value={formData.details?.quantity || ''}
                onChange={(e) => handleDetailChange('quantity', e.target.value)}
              />
            </Form.Group>
          </div>
        )}
        {category === 'rent' && (
          <div className="row">
            <Form.Group className="mb-3 col-md-12">
              <Form.Label>Property / Space Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Main Office"
                value={formData.details?.propertyName || ''}
                onChange={(e) => handleDetailChange('propertyName', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Rent Period Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.date || ''}
                onChange={(e) => handleChange('date', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Rent Amount</Form.Label>
              <Form.Control
                type="number"
                placeholder="Amount"
                value={formData.amount || ''}
                onChange={(e) => handleChange('amount', e.target.value)}
              />
            </Form.Group>
          </div>
        )}
        {category === 'professional_fees' && (
          <div className="row">
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.date || ''}
                onChange={(e) => handleChange('date', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Fee Amount</Form.Label>
              <Form.Control
                type="number"
                placeholder="Amount"
                value={formData.amount || ''}
                onChange={(e) => handleChange('amount', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Professional / Firm Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. ABC Legal Services"
                value={formData.details?.professionalName || ''}
                onChange={(e) => handleDetailChange('professionalName', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Service Provided</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Audit, Legal Consultation"
                value={formData.details?.service || ''}
                onChange={(e) => handleDetailChange('service', e.target.value)}
              />
            </Form.Group>
          </div>
        )}
        {category === 'consultancy_charges' && (
          <div className="row">
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.date || ''}
                onChange={(e) => handleChange('date', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                placeholder="Amount"
                value={formData.amount || ''}
                onChange={(e) => handleChange('amount', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Consultant Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. John Doe Consulting"
                value={formData.details?.consultantName || ''}
                onChange={(e) => handleDetailChange('consultantName', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Project / Engagement</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Q3 Strategy Review"
                value={formData.details?.engagement || ''}
                onChange={(e) => handleDetailChange('engagement', e.target.value)}
              />
            </Form.Group>
          </div>
        )}
        {category === 'telephone_internet' && (
          <div className="row">
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Bill Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.date || ''}
                onChange={(e) => handleChange('date', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                placeholder="Amount"
                value={formData.amount || ''}
                onChange={(e) => handleChange('amount', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Provider</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Airtel, Jio"
                value={formData.details?.provider || ''}
                onChange={(e) => handleDetailChange('provider', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Account / Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. 9876543210"
                value={formData.details?.accountNumber || ''}
                onChange={(e) => handleDetailChange('accountNumber', e.target.value)}
              />
            </Form.Group>
          </div>
        )}
        {category === 'software_expenses' && (
          <div className="row">
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Purchase Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.date || ''}
                onChange={(e) => handleChange('date', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                placeholder="Amount"
                value={formData.amount || ''}
                onChange={(e) => handleChange('amount', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Software / Tool Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Adobe CC, GitHub"
                value={formData.details?.softwareName || ''}
                onChange={(e) => handleDetailChange('softwareName', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Subscription Period</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Oct 2023 - Oct 2024"
                value={formData.details?.subscriptionPeriod || ''}
                onChange={(e) => handleDetailChange('subscriptionPeriod', e.target.value)}
              />
            </Form.Group>
          </div>
        )}
        {category === 'project_tax' && (
          <div className="row">
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Project ID</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. PROJ-123"
                value={formData.details?.projectId || ''}
                onChange={(e) => handleDetailChange('projectId', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Client Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Client Name"
                value={formData.details?.clientName || ''}
                onChange={(e) => handleDetailChange('clientName', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-12">
              <Form.Label>Tax Details / Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Details of taxes or project charges..."
                value={formData.details?.taxDetails || ''}
                onChange={(e) => {
                  handleDetailChange('taxDetails', e.target.value)
                  handleChange('description', e.target.value)
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.date || ''}
                onChange={(e) => handleChange('date', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                placeholder="Amount"
                value={formData.amount || ''}
                onChange={(e) => handleChange('amount', e.target.value)}
              />
            </Form.Group>
          </div>
        )}
        {category === 'general_expenses' && (
          <div className="row">
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.date || ''}
                onChange={(e) => handleChange('date', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-6">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                placeholder="Amount"
                value={formData.amount || ''}
                onChange={(e) => handleChange('amount', e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3 col-md-12">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Enter details of the expense"
                value={formData.description || ''}
                onChange={(e) => {
                  handleDetailChange('description', e.target.value)
                  handleChange('description', e.target.value)
                }}
              />
            </Form.Group>
          </div>
        )}
      </div>
    )
  }

  // Helper to render a single field (generic or system)
  const renderField = (field) => {
    const commonProps = {
      value: formData[field.id] || '',
      onChange: (e) => handleChange(field.id, e.target.value),
      isInvalid: !!errors[field.id],
      required: field.required
    }

    // Special System Fields with Specific Logic
    if (field.id === 'category') {
      const selectedCategory = CATEGORIES.find(cat => cat.value === formData.category)
      // Also render Details block after this?
      return (
        <Form.Group className="mb-3" key={field.id}>
          <Form.Label>{field.label} {field.required && <span className="text-danger">*</span>}</Form.Label>
          <Form.Select {...commonProps}>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </Form.Select>
          {/* Visual Indicator */}
          {selectedCategory && (
            <Form.Text className="d-flex align-items-center gap-2 mt-1">
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: selectedCategory.color, display: 'inline-block' }} />
              <span>{selectedCategory.label}</span>
            </Form.Text>
          )}
          {errors.category && <Form.Text className="text-danger d-block">{errors.category}</Form.Text>}

          {/* Category Details Logic */}
          <div className="mt-3">
            {renderCategoryDetails()}
          </div>
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
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header>
        <Modal.Title>{expense ? 'Edit Expense' : 'Create New Expense'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {fields && fields.sort((a, b) => (a.order || 99) - (b.order || 99)).map(field => {
            // Skip Receipt as it's separate at bottom
            if (field.id === 'receipt') return null
            // Hide employeeName if category is Food (handled in details)
            if (field.id === 'employeeName' && formData.category === 'food') return null

            const customCategories = ['silicon_server', 'travel', 'salary', 'bank_charges', 'printing_stationery', 'rent', 'professional_fees', 'consultancy_charges', 'telephone_internet', 'software_expenses', 'project_tax', 'general_expenses']
            if (customCategories.includes(formData.category)) {
              if (['date', 'amount', 'description', 'employeeName', 'projectDepartment'].includes(field.id)) {
                return null
              }
            }

            return renderField(field)
          })}

          {/* Receipt (Hardcoded at end) */}
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
            {filePreview && (
              <div className="mt-3">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="text-muted small">Receipt Preview:</span>
                  <Button variant="link" size="sm" className="text-danger p-0" onClick={handleRemoveFile}>Remove</Button>
                </div>
                {filePreview.startsWith('data:image/') ? (
                  <img src={filePreview} alt="Receipt preview" style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #dee2e6', borderRadius: '4px', padding: '4px' }} />
                ) : (
                  <div className="border p-3 rounded bg-light">
                    <p className="mb-0 small text-muted">PDF file selected</p>
                  </div>
                )}
              </div>
            )}
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        {expense && (
          <Button variant="danger" onClick={() => { if (window.confirm('Delete?')) { onDelete(expense.id); onHide(); } }}>Delete</Button>
        )}
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={handleSave}>{expense ? 'Update' : 'Create'} Expense</Button>
      </Modal.Footer>
    </Modal>
  )
}
