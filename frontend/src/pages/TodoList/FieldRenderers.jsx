import { useState, useRef } from 'react'
import { Form, Button, Badge } from 'react-bootstrap'
import { Upload, X, MapPin, Calendar } from 'lucide-react'

// Helper to determine text color based on background color (for contrast)
const getContrastColor = (hexColor) => {
  if (!hexColor) return '#ffffff'
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? '#000000' : '#ffffff'
}

// Helper to get option color (supports both string and object formats)
const getOptionColor = (options, optionValue) => {
  if (!options || !Array.isArray(options) || !optionValue) return '#6c757d' // Default gray

  const normalizedValue = String(optionValue).trim()

  // First try exact match (case-sensitive)
  let option = options.find(opt => {
    if (typeof opt === 'string') {
      return String(opt).trim() === normalizedValue
    }
    if (opt && typeof opt === 'object') {
      return String(opt.label || '').trim() === normalizedValue
    }
    return false
  })

  // If not found, try case-insensitive match
  if (!option) {
    const lowerValue = normalizedValue.toLowerCase()
    option = options.find(opt => {
      if (typeof opt === 'string') {
        return String(opt).trim().toLowerCase() === lowerValue
      }
      if (opt && typeof opt === 'object') {
        return String(opt.label || '').trim().toLowerCase() === lowerValue
      }
      return false
    })
  }

  if (!option) {
    // If not found, return default gray
    return '#6c757d'
  }

  // Extract color based on option format
  if (typeof option === 'string') {
    // For string options, use default colors based on index
    const defaultColors = ['#0078d4', '#107c10', '#ffaa44', '#e81123', '#8764b8', '#00bcf2', '#ff8c00', '#737373']
    const index = options.findIndex(opt => opt === option)
    return defaultColors[index % defaultColors.length]
  }

  // For object format, return the color property
  if (option && typeof option === 'object' && option.color) {
    return option.color
  }

  // Fallback to default blue
  return '#0078d4'
}

// Helper to normalize options (convert strings to objects for backward compatibility)
const normalizeOptionsForDisplay = (options) => {
  if (!options || !Array.isArray(options)) return []
  return options.map((opt, idx) => {
    if (typeof opt === 'string') {
      const defaultColors = ['#0078d4', '#107c10', '#ffaa44', '#e81123', '#8764b8', '#00bcf2', '#ff8c00', '#737373']
      return {
        label: String(opt).trim(),
        color: defaultColors[idx % defaultColors.length]
      }
    }
    if (opt && typeof opt === 'object' && opt !== null) {
      // Ensure we preserve the exact label and color
      const label = String(opt.label || '').trim()
      const color = opt.color || '#0078d4'
      return { label, color }
    }
    return { label: '', color: '#0078d4' }
  })
}

// Email validation helper
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

// Text Field Renderer
export const TextRenderer = ({ column, value, onChange, isEditing = false }) => {
  if (!isEditing) {
    return <span>{value || '-'}</span>
  }

  return (
    <Form.Control
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      maxLength={column.config?.maxLength}
      placeholder={column.config?.placeholder || 'Enter text'}
    />
  )
}

// Number Field Renderer
export const NumberRenderer = ({ column, value, onChange, isEditing = false }) => {
  const isReadOnly = column.config?.readOnly || false

  if (!isEditing || isReadOnly) {
    return <span style={{ fontWeight: 600, color: '#374151' }}>{value ?? '-'}</span>
  }

  return (
    <Form.Control
      type="number"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
      min={column.config?.min}
      max={column.config?.max}
      step={column.config?.step || 1}
      placeholder={column.config?.placeholder || 'Enter number'}
      readOnly={isReadOnly}
    />
  )
}

// Email Field Renderer
export const EmailRenderer = ({ column, value, onChange, isEditing = false }) => {
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const emailValue = e.target.value
    onChange(emailValue)

    // Validate email if not empty
    if (emailValue && !isValidEmail(emailValue)) {
      setError('Please enter a valid email address')
    } else {
      setError(null)
    }
  }

  if (!isEditing) {
    if (!value) return <span className="text-muted">-</span>
    return (
      <a href={`mailto:${value}`} className="text-decoration-none">
        {value}
      </a>
    )
  }

  return (
    <div>
      <Form.Control
        type="email"
        value={value || ''}
        onChange={handleChange}
        placeholder="user@example.com"
        isInvalid={!!error}
      />
      {error && (
        <Form.Text className="text-danger">{error}</Form.Text>
      )}
      {value && isValidEmail(value) && (
        <Form.Text className="text-success">
          ✓ Valid email address
        </Form.Text>
      )}
    </div>
  )
}

// Image Field Renderer
export const ImageRenderer = ({ column: _column, value, onChange, isEditing = false }) => {
  const [preview, setPreview] = useState(value || null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result
        setPreview(base64String)
        onChange(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange(null)
  }

  if (!isEditing) {
    if (!value) return <span className="text-muted">-</span>
    return (
      <img
        src={value}
        alt="Task"
        style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover', borderRadius: '4px' }}
      />
    )
  }

  return (
    <div>
      {preview && (
        <div className="mb-2 position-relative d-inline-block">
          <img
            src={preview}
            alt="Preview"
            style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover', borderRadius: '4px' }}
          />
          <Button
            variant="danger"
            size="sm"
            className="position-absolute top-0 end-0"
            style={{ transform: 'translate(50%, -50%)' }}
            onClick={handleRemove}
          >
            <X size={14} />
          </Button>
        </div>
      )}
      <Form.Control
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  )
}

// Choice Field Renderer
export const ChoiceRenderer = ({ column, value, onChange, isEditing = false }) => {
  const options = column.config?.options || []
  const multiSelect = column.config?.multiSelect || false

  const normalizedOptions = normalizeOptionsForDisplay(options)

  // Debug logging - check what we're working with
  if (process.env.NODE_ENV === 'development' && value) {
    console.log('ChoiceRenderer Debug:', {
      columnName: column.name,
      value: value,
      valueType: typeof value,
      options: options,
      normalizedOptions: normalizedOptions,
      optionsLength: options.length
    })
  }

  // Helper to get color from normalized options - direct and reliable
  const getColorFromNormalized = (optionValue) => {
    if (!optionValue) {
      if (process.env.NODE_ENV === 'development') {
        console.log('getColorFromNormalized: No value provided')
      }
      return '#6c757d'
    }

    const searchValue = String(optionValue).trim()

    if (process.env.NODE_ENV === 'development') {
      console.log(`getColorFromNormalized: Searching for "${searchValue}" in`, normalizedOptions.map(o => `"${o.label}"`))
    }

    // Direct search in normalized options array - this is the source of truth for colors
    for (let i = 0; i < normalizedOptions.length; i++) {
      const opt = normalizedOptions[i]
      const optLabel = String(opt.label || '').trim()

      if (process.env.NODE_ENV === 'development') {
        console.log(`  Comparing "${searchValue}" with "${optLabel}" (exact: ${optLabel === searchValue}, case-insensitive: ${optLabel.toLowerCase() === searchValue.toLowerCase()})`)
      }

      // Try exact match first
      if (optLabel === searchValue) {
        const foundColor = opt.color || '#0078d4'
        if (process.env.NODE_ENV === 'development') {
          console.log(`✓ Exact match found at index ${i}: "${searchValue}" -> color: ${foundColor}`)
        }
        return foundColor
      }

      // Try case-insensitive match
      if (optLabel.toLowerCase() === searchValue.toLowerCase()) {
        const foundColor = opt.color || '#0078d4'
        if (process.env.NODE_ENV === 'development') {
          console.log(`✓ Case-insensitive match found at index ${i}: "${searchValue}" -> color: ${foundColor}`)
        }
        return foundColor
      }
    }

    // If still not found, log warning
    if (process.env.NODE_ENV === 'development') {
      console.warn(`✗ No match found for value: "${searchValue}" in column: "${column.name}"`, {
        searchValue,
        searchValueType: typeof searchValue,
        searchValueLength: searchValue.length,
        normalizedOptions: normalizedOptions.map((o, idx) => ({
          index: idx,
          label: o.label,
          labelType: typeof o.label,
          labelLength: String(o.label).length,
          color: o.color
        })),
        originalOptions: options
      })
    }

    // Return default gray if no match
    return '#6c757d'
  }

  if (!isEditing) {
    if (!value) return <span className="text-muted">-</span>
    if (multiSelect && Array.isArray(value)) {
      return (
        <div className="d-flex flex-wrap gap-1">
          {value.map((v, idx) => {
            const color = getColorFromNormalized(v)
            if (process.env.NODE_ENV === 'development') {
              console.log(`Rendering multi-select badge: value="${v}", color="${color}"`)
            }
            return (
              <span
                key={idx}
                className="badge choice-badge me-1"
                style={{
                  backgroundColor: color,
                  color: getContrastColor(color),
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  display: 'inline-block'
                }}
              >
                {v}
              </span>
            )
          })}
        </div>
      )
    }
    const color = getColorFromNormalized(value)
    if (process.env.NODE_ENV === 'development') {
      console.log(`Rendering single badge: column="${column.name}", value="${value}", color="${color}"`)
    }
    // Use span instead of Badge to avoid Bootstrap's default styling
    return (
      <span
        className="badge choice-badge"
        style={{
          backgroundColor: color,
          color: getContrastColor(color),
          border: 'none',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 500,
          display: 'inline-block'
        }}
      >
        {value}
      </span>
    )
  }

  // Helper to get option label (supports both string and object formats)
  const getOptionLabel = (option) => {
    return typeof option === 'string' ? option : option.label
  }

  if (multiSelect) {
    const selectedValues = Array.isArray(value) ? value : []

    return (
      <div>
        {normalizedOptions.map((option, idx) => {
          const optionLabel = option.label
          const optionColor = option.color || '#0078d4'
          return (
            <Form.Check
              key={idx}
              type="checkbox"
              checked={selectedValues.includes(optionLabel)}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange([...selectedValues, optionLabel])
                } else {
                  onChange(selectedValues.filter(v => v !== optionLabel))
                }
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: optionColor,
                    border: '1px solid #ced4da',
                    borderRadius: '3px',
                    flexShrink: 0
                  }}
                />
                <span>{optionLabel}</span>
              </div>
            </Form.Check>
          )
        })}
      </div>
    )
  }

  return (
    <Form.Select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">Select...</option>
      {normalizedOptions.map((option, idx) => {
        const optionLabel = getOptionLabel(option)
        return (
          <option key={idx} value={optionLabel}>
            {optionLabel}
          </option>
        )
      })}
    </Form.Select>
  )
}

// Currency Field Renderer
export const CurrencyRenderer = ({ column, value, onChange, isEditing = false }) => {
  const currency = column.config?.currency || 'USD'
  const decimals = column.config?.decimals !== undefined ? column.config.decimals : 2
  const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥'
  }
  const symbol = currencySymbols[currency] || currency

  if (!isEditing) {
    if (value === null || value === undefined) return <span className="text-muted">-</span>
    return <span>{symbol}{parseFloat(value).toFixed(decimals)}</span>
  }

  return (
    <div className="input-group">
      <span className="input-group-text">{symbol}</span>
      <Form.Control
        type="number"
        step="0.01"
        value={value || ''}
        onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
        placeholder="0.00"
      />
    </div>
  )
}

// Location Field Renderer
export const LocationRenderer = ({ column: _column, value, onChange, isEditing = false }) => {
  const locationValue = value || { address: '', lat: null, lng: null }

  const handleAddressChange = (address) => {
    onChange({ ...locationValue, address })
  }

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onChange({
            ...locationValue,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          alert('Unable to get location: ' + error.message)
        }
      )
    } else {
      alert('Geolocation is not supported by this browser')
    }
  }

  if (!isEditing) {
    if (!locationValue.address && !locationValue.lat) {
      return <span className="text-muted">-</span>
    }
    return (
      <div>
        {locationValue.address && <div>{locationValue.address}</div>}
        {locationValue.lat && locationValue.lng && (
          <small className="text-muted">
            {locationValue.lat.toFixed(4)}, {locationValue.lng.toFixed(4)}
          </small>
        )}
      </div>
    )
  }

  return (
    <div>
      <Form.Control
        type="text"
        value={locationValue.address || ''}
        onChange={(e) => handleAddressChange(e.target.value)}
        placeholder="Enter address"
        className="mb-2"
      />
      <Button
        variant="outline-secondary"
        size="sm"
        onClick={handleGetLocation}
      >
        <MapPin size={14} className="me-1" />
        Get Current Location
      </Button>
      {locationValue.lat && locationValue.lng && (
        <div className="mt-2 small text-muted">
          Coordinates: {locationValue.lat.toFixed(4)}, {locationValue.lng.toFixed(4)}
        </div>
      )}
    </div>
  )
}

// Date/Time Field Renderer
export const DateTimeRenderer = ({ column, value, onChange, isEditing = false }) => {
  const config = column.config || {}
  const dateOnly = config.dateOnly || false
  const includeTime = config.includeTime !== false
  const hiddenInputRef = useRef(null)

  const formatDisplayValue = (val) => {
    if (!val) return ''
    const date = new Date(val)
    if (isNaN(date.getTime())) return ''

    // Format as dd-mm-yyyy or dd-mm-yyyy hh:mm
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()

    if (dateOnly || !includeTime) {
      return `${day}-${month}-${year}`
    }

    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}-${month}-${year} ${hours}:${minutes}`
  }

  const formatHiddenValue = (val) => {
    if (!val) return ''
    const date = new Date(val)
    if (isNaN(date.getTime())) return ''

    if (dateOnly) {
      return date.toISOString().split('T')[0]
    }
    if (includeTime) {
      const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      return localDate.toISOString().slice(0, 16)
    }
    return date.toISOString().split('T')[0]
  }

  const formatReadOnlyDisplay = (val) => {
    if (!val) return '-'
    const date = new Date(val)
    if (isNaN(date.getTime())) return '-'

    if (dateOnly) {
      return date.toLocaleDateString()
    }
    if (includeTime) {
      return date.toLocaleString()
    }
    return date.toLocaleDateString()
  }

  const openDatePicker = () => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.showPicker?.() || hiddenInputRef.current.click()
    }
  }

  const handleDateChange = (e) => {
    const val = e.target.value
    if (val) {
      const date = new Date(val)
      onChange(date.toISOString())
    } else {
      onChange(null)
    }
  }

  if (!isEditing) {
    return <span>{formatReadOnlyDisplay(value)}</span>
  }

  const inputType = dateOnly ? 'date' : includeTime ? 'datetime-local' : 'date'

  return (
    <div className="date-input-wrapper">
      {/* Hidden native date input - only used for its picker */}
      <input
        ref={hiddenInputRef}
        type={inputType}
        value={formatHiddenValue(value)}
        onChange={handleDateChange}
        className="date-hidden-input"
        tabIndex={-1}
      />
      {/* Visible text display */}
      <Form.Control
        type="text"
        value={formatDisplayValue(value)}
        onClick={openDatePicker}
        onFocus={openDatePicker}
        placeholder="dd-mm-yyyy"
        readOnly
        className="date-display-input"
      />
      <button
        type="button"
        className="date-calendar-btn"
        onClick={openDatePicker}
        tabIndex={-1}
      >
        <Calendar size={16} />
      </button>
    </div>
  )
}

// Main Field Renderer Component
export const FieldRenderer = ({ column, value, onChange, isEditing = false }) => {
  const renderers = {
    text: TextRenderer,
    number: NumberRenderer,
    email: EmailRenderer,
    image: ImageRenderer,
    choice: ChoiceRenderer,
    currency: CurrencyRenderer,
    location: LocationRenderer,
    datetime: DateTimeRenderer
  }

  const Renderer = renderers[column.type]
  if (!Renderer) {
    return <span className="text-muted">Unknown field type</span>
  }

  return (
    <Renderer
      column={column}
      value={value}
      onChange={onChange}
      isEditing={isEditing}
    />
  )
}

// Export email validation for use in other components
export { isValidEmail }
