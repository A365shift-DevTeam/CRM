import { useState, useEffect, useMemo } from 'react'
import { Button, Dropdown, Form, Badge, Modal, Card, Row, Col } from 'react-bootstrap'
import {
  Plus, Filter, MoreVertical,
  ArrowUpDown, Check, X, Layers, User, Flag, Briefcase, Building, Phone, Edit, Settings, ArrowUpRight,
  GripVertical, Eye, EyeOff, Trash2
} from 'lucide-react'
import { contactService } from '../../../services/contactService'
import { projectService } from '../../../services/api'

import { ListView } from './ListView'
import { KanbanView } from './KanbanView'
import { ChartView } from './ChartView'
import { ContactModal } from './ContactModal'
import { AIAssistModal } from './AIAssistModal'
import './Contacts.css'

const DEFAULT_STATUS_COLUMNS = ['Active', 'Inactive', 'Lead', 'Customer']

const Contacts = () => {
  const [contacts, setContacts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // View State
  const [viewMode, setViewMode] = useState('list') // 'list', 'kanban', 'chart'
  const [showContactModal, setShowContactModal] = useState(false)
  const [showAIAssist, setShowAIAssist] = useState(false)
  const [editingContact, setEditingContact] = useState(null)

  // Filter & Sort State (Project Page Style)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBy, setFilterBy] = useState('all')
  const [filterValue, setFilterValue] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [groupBy, setGroupBy] = useState('status') // 'status', 'type', 'company'

  // Dynamic Columns State (for Kanban)
  const [statusColumns, setStatusColumns] = useState(DEFAULT_STATUS_COLUMNS)

  // Column Management
  const [contactColumns, setContactColumns] = useState([
    { id: 'name', name: 'Name', type: 'text', visible: true, required: true },
    { id: 'jobTitle', name: 'Job Title', type: 'text', visible: true },
    { id: 'phone', name: 'Phone', type: 'text', visible: true },
    { id: 'company', name: 'Company', type: 'text', visible: true },
    { id: 'location', name: 'Location', type: 'location', visible: true },
    { id: 'clientAddress', name: 'Client Address', type: 'text', visible: true },
    { id: 'clientCountry', name: 'Country', type: 'text', visible: true },
    { id: 'gstin', name: 'GSTIN', type: 'text', visible: false },
    { id: 'pan', name: 'PAN', type: 'text', visible: false },
    { id: 'cin', name: 'CIN', type: 'text', visible: false },
    { id: 'internationalTaxId', name: 'Intl Tax ID (VAT/EIN)', type: 'text', visible: false },
    { id: 'msmeStatus', name: 'MSME Status', type: 'text', visible: false },
    { id: 'tdsSection', name: 'TDS Section', type: 'text', visible: false },
    { id: 'tdsRate', name: 'TDS Rate', type: 'number', visible: false },
    { id: 'type', name: 'Entity Type', type: 'choice', visible: true, config: { options: [{ label: 'Company', color: '#3b82f6' }, { label: 'Individual', color: '#8b5cf6' }, { label: 'Vendor', color: '#10b981' }] } },
    { id: 'status', name: 'Status', type: 'choice', visible: true, config: { options: [{ label: 'Active', color: '#10b981' }, { label: 'Inactive', color: '#94a3b8' }, { label: 'Lead', color: '#3b82f6' }, { label: 'Customer', color: '#06b6d4' }] } }
  ])
  const [columnsLoaded, setColumnsLoaded] = useState(false)
  const [showColumnManager, setShowColumnManager] = useState(false)
  const [draggingColumnId, setDraggingColumnId] = useState(null)
  const [showAddColForm, setShowAddColForm] = useState(false)
  const [addColData, setAddColData] = useState({ name: '', type: 'text', required: false, visible: true, config: {} })
  const [showEditColForm, setShowEditColForm] = useState(false)
  const [editColData, setEditColData] = useState({ id: '', name: '', type: 'text', required: false, visible: true, config: {} })

  // Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewingContact, setPreviewingContact] = useState(null)

  // Add Column Modal
  const [showAddColumnModal, setShowAddColumnModal] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')

  // Convert to Sales State
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [convertingContact, setConvertingContact] = useState(null)
  const [convertType, setConvertType] = useState('Product')
  const [convertBranding, setConvertBranding] = useState('')
  const [convertClient, setConvertClient] = useState('')

  // Global Labels
  const productLabel = localStorage.getItem('app_product_label') || 'Products'
  const serviceLabel = localStorage.getItem('app_service_label') || 'Services'

  useEffect(() => {
    loadContacts()
    loadColumns()
  }, [])

  const loadColumns = async () => {
    try {
      const cols = await contactService.getColumns()
      if (cols && cols.length > 0) {
        setContactColumns(cols)
      }
    } catch (error) {
      console.error('Error loading columns:', error)
    } finally {
      setColumnsLoaded(true)
    }
  }

  useEffect(() => {
    if (columnsLoaded) {
      contactService.saveColumns(contactColumns).catch(console.error)
    }
  }, [contactColumns, columnsLoaded])

  const loadContacts = async () => {
    try {
      setIsLoading(true)
      const data = await contactService.getContacts()
      setContacts(data || [])
    } catch (error) {
      console.error('Error loading contacts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // --- Stats Calculation ---
  const stats = useMemo(() => {
    const total = contacts.length
    const leads = contacts.filter(c => c.status === 'Lead').length
    const customers = contacts.filter(c => c.status === 'Customer').length
    const uniqueCompanies = new Set(contacts.map(c => c.company).filter(Boolean)).size
    return { total, leads, customers, companies: uniqueCompanies }
  }, [contacts])

  // --- Dynamic Options for Filters ---
  const filterableColumns = [
    { id: 'status', name: 'Status' },
    { id: 'type', name: 'Type' },
    { id: 'company', name: 'Company' },
    { id: 'location', name: 'Location' },
    { id: 'clientAddress', name: 'Client Address' }
  ]

  const getFilterOptions = (columnId) => {
    const values = new Set()
    contacts.forEach(c => {
      const val = c[columnId]
      if (val) values.add(val)
    })
    return Array.from(values).sort()
  }

  // --- Filtering & Sorting Logic ---
  const processedContacts = useMemo(() => {
    let filtered = [...contacts]

    // 1. Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(contact =>
        contact.name?.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.company?.toLowerCase().includes(query)
      )
    }

    // 2. Filter (Project Style)
    if (filterBy !== 'all' && filterValue) {
      filtered = filtered.filter(contact => {
        const value = String(contact[filterBy] || '')
        return value.toLowerCase() === filterValue.toLowerCase()
      })
    }

    // 3. Sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || ''
      let bValue = b[sortBy] || ''

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })

    return filtered
  }, [contacts, searchQuery, filterBy, filterValue, sortBy, sortOrder])

  // --- Column Management (CRUD) ---
  const getActiveColumns = () => {
    if (groupBy === 'status') return statusColumns
    // For other groupings, generate columns dynamically
    const values = new Set()
    contacts.forEach(c => {
      if (c[groupBy]) values.add(c[groupBy])
    })
    if (values.size === 0) return ['Unassigned']
    return Array.from(values).sort()
  }

  const handleAddColumn = (newCol) => {
    if (groupBy === 'status') {
      if (newCol && !statusColumns.includes(newCol)) {
        setStatusColumns([...statusColumns, newCol])
      }
    } else {
      alert('Can only add columns when grouping by Status')
    }
  }

  const handleCreateColumnConfirm = () => {
    if (newColumnName.trim()) {
      handleAddColumn(newColumnName.trim())
      setNewColumnName('')
      setShowAddColumnModal(false)
    }
  }

  const handleEditColumn = (oldCol, newCol) => {
    if (groupBy === 'status') {
      // Update columns list
      setStatusColumns(prev => prev.map(c => c === oldCol ? newCol : c))
      // Update all contacts that had this status
      // Note: In a real app, you'd batch update via API. Here we assume generic update.
      // We can't easily update all contacts without backend support for batch, 
      // or we loop and update individually (inefficient but works for demo).
      const contactsToUpdate = contacts.filter(c => c.status === oldCol)
      contactsToUpdate.forEach(c => {
        handleTaskUpdate(c.id, { status: newCol }) // Optimistic update
      })
    } else {
      alert('Can only modify columns when grouping by Status')
    }
  }

  const handleDeleteColumn = (colToDelete) => {
    if (groupBy === 'status') {
      if (confirm(`Delete column "${colToDelete}"? Contacts in this column will be moved to default.`)) {
        setStatusColumns(prev => prev.filter(c => c !== colToDelete))
        // Move contacts to first available column or ''
        const fallback = statusColumns.find(c => c !== colToDelete) || 'Active'
        const contactsToMove = contacts.filter(c => c.status === colToDelete)
        contactsToMove.forEach(c => {
          handleTaskUpdate(c.id, { status: fallback })
        })
      }
    } else {
      alert('Can only delete columns when grouping by Status')
    }
  }

  // --- Handlers ---
  const handleCreateContact = () => {
    setEditingContact(null)
    setShowContactModal(true)
  }

  const handleEditContact = (contact) => {
    setEditingContact(contact)
    setShowContactModal(true)
  }

  const handlePreviewContact = (contact) => {
    setPreviewingContact(contact)
    setShowPreviewModal(true)
  }

  const handleSaveContact = async (contactData) => {
    try {
      // Ensure both 'type' and 'entityType' are saved for compatibility
      // Also ensure category field is explicitly included (even if empty)
      const dataToSave = {
        ...contactData,
        type: contactData.entityType || contactData.type, // Save as 'type' for column compatibility
        entityType: contactData.entityType || contactData.type, // Also save as 'entityType'
        // Explicitly include category field - Firestore updateDoc might skip undefined fields
        category: contactData.category !== undefined ? contactData.category : null
      }

      // Remove undefined values but keep null and empty strings for category
      const cleanedData = {}
      Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key] !== undefined) {
          cleanedData[key] = dataToSave[key]
        }
      })

      // Debug: Log all fields being saved, especially category
      console.log('Saving contact data:', {
        originalCategory: contactData.category,
        categoryType: typeof contactData.category,
        allFields: Object.keys(contactData),
        cleanedData: cleanedData,
        categoryInCleaned: cleanedData.category
      })

      if (editingContact) {
        console.log('Updating contact:', editingContact.id, 'with data:', cleanedData)
        await contactService.updateContact(editingContact.id, cleanedData)
        console.log('Contact updated successfully')
      } else {
        console.log('Creating new contact with data:', cleanedData)
        await contactService.createContact(cleanedData)
        console.log('Contact created successfully')
      }
      await loadContacts()
      setShowContactModal(false)
      setEditingContact(null)
    } catch (error) {
      console.error('Error saving contact:', error)
      alert('Failed to save contact')
    }
  }

  const handleDeleteContact = async (contactId) => {
    try {
      await contactService.deleteContact(contactId)
      await loadContacts()
      setShowContactModal(false)
      setEditingContact(null)
    } catch (error) {
      console.error('Error deleting contact:', error)
      alert('Failed to delete contact')
    }
  }

  const handleTaskUpdate = async (contactId, updates) => {
    try {
      // Optimistic update locally
      setContacts(prev => prev.map(c => c.id === contactId ? { ...c, ...updates } : c))
      await contactService.updateContact(contactId, updates)
      // await loadContacts() // No need to reload if optimistic is correct
    } catch (error) {
      console.error('Error updating contact:', error)
      loadContacts() // Revert on error
    }
  }

  const handleAIFilterApply = (filters) => {
    if (filters.status && filters.status !== 'all') {
      setFilterBy('status')
      setFilterValue(filters.status)
    }
  }

  // --- Convert to Sales ---
  const handleConvertToSales = (contact) => {
    setConvertingContact(contact)
    setConvertType('Product')
    setConvertBranding(contact.company || '')
    setConvertClient(contact.name || '')
    setShowConvertModal(true)
  }

  const handleConfirmConvert = async () => {
    if (!convertingContact) return
    const c = convertingContact
    const today = new Date()
    const date = String(today.getDate()).padStart(2, '0')
    const year = String(today.getFullYear()).slice(-2)
    const brandCode = (c.company || 'A3').substring(0, 2).toUpperCase()
    const clientCode = (c.name || 'C').slice(-1).toUpperCase()
    const customId = `${date}${brandCode}${clientCode}${year}`

    const newProject = {
      activeStage: 0,
      history: [],
      type: convertType,
      rating: 4.0,
      delay: 0,
      title: `${convertClient} - ${convertBranding || 'Direct'}`,
      clientName: convertClient || 'New Client',
      brandingName: convertBranding || 'A365Shift',
      customId,
      // Map new contact fields
      clientEmail: c.email || '',
      clientPhone: c.phone || '',
      clientAddress: c.clientAddress || '',
      clientGstin: c.gstin || '',
      clientPan: c.pan || '',
      clientCin: c.cin || '',
      msmeStatus: c.msmeStatus || 'NON MSME',
      tdsSection: c.tdsSection || '',
      tdsRate: c.tdsRate || ''
    }

    try {
      await projectService.create(newProject)
      const typeLabel = convertType === 'Product' ? productLabel : serviceLabel
      alert(`✅ Contact "${c.name}" converted to a ${typeLabel} sales project!`)
      setShowConvertModal(false)
      setConvertingContact(null)
    } catch (error) {
      console.error('Error converting contact to sales:', error)
      alert('Failed to convert contact. Please try again.')
    }
  }

  if (isLoading && contacts.length === 0) {
    return (
      <div className="contacts-container d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    )
  }

  return (
    <div className="contacts-container">

      {/* Stats Grid */}
      {/* Stats Grid - MATCHING IMAGE EXACTLY */}
      <div className="stats-grid mb-4">
        <div className="stat-card-new">
          <div className="stat-icon-box blue-soft">
            <User size={22} className="text-primary" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Contacts</span>
            <h3 className="stat-number">{stats.total}</h3>
          </div>
        </div>

        <div className="stat-card-new">
          <div className="stat-icon-box green-soft">
            <Flag size={22} className="text-success" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Leads</span>
            <h3 className="stat-number">{stats.leads}</h3>
          </div>
        </div>

        <div className="stat-card-new">
          <div className="stat-icon-box teal-soft">
            <Briefcase size={22} className="text-info" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Customers</span>
            <h3 className="stat-number">{stats.customers}</h3>
          </div>
        </div>

        <div className="stat-card-new">
          <div className="stat-icon-box purple-soft">
            <Building size={22} className="text-purple" />
          </div>
          <div className="stat-info">
            <span className="stat-label">Companies</span>
            <h3 className="stat-number">{stats.companies}</h3>
          </div>
        </div>
      </div>

      {/* Header & Toolbar - MATCHING IMAGE EXACTLY */}
      <div className="contacts-toolbar-wrapper mb-4">
        <div className="d-flex align-items-center gap-4">
          <h3 className="mb-0 fw-bold text-dark">Contacts</h3>

          <div className="search-pill-container">
            <div className="search-pill">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input-clean"
              />
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 ms-auto">
          {/* Filter, Group By, Sort Icons with Dropdowns */}
          <div className="icon-group me-3 d-flex gap-2">

            {/* Filter Dropdown */}
            <Dropdown align="end">
              <Dropdown.Toggle as="button" bsPrefix="p-0 border-0 bg-transparent" className={`icon-btn-clean ${filterBy !== 'all' ? 'active' : ''}`} title="Filter">
                <Filter size={18} />
              </Dropdown.Toggle>
              <Dropdown.Menu className="p-3 shadow-lg border-0" style={{ minWidth: '260px', borderRadius: '12px' }}>
                <div className="mb-3">
                  <label className="small text-muted fw-bold mb-2">FILTER BY</label>
                  <Form.Select size="sm" value={filterBy} onChange={(e) => { setFilterBy(e.target.value); setFilterValue(''); }}>
                    <option value="all">None</option>
                    {filterableColumns.map(col => (
                      <option key={col.id} value={col.id}>{col.name}</option>
                    ))}
                  </Form.Select>
                </div>
                {filterBy !== 'all' && (
                  <div>
                    <label className="small text-muted fw-bold mb-2">SELECT VALUE</label>
                    <Form.Select size="sm" value={filterValue} onChange={(e) => setFilterValue(e.target.value)}>
                      <option value="">Select...</option>
                      {getFilterOptions(filterBy).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </Form.Select>
                  </div>
                )}
                {filterBy !== 'all' && (
                  <div className="mt-3 pt-2 border-top text-end">
                    <Button variant="link" size="sm" className="text-danger text-decoration-none p-0" onClick={() => { setFilterBy('all'); setFilterValue(''); }}>
                      Clear Filters
                    </Button>
                  </div>
                )}
              </Dropdown.Menu>
            </Dropdown>

            {/* Group By Dropdown (used in Kanban) */}
            <Dropdown align="end">
              <Dropdown.Toggle as="button" bsPrefix="p-0 border-0 bg-transparent" className={`icon-btn-clean ${groupBy !== 'status' ? 'active' : ''}`} title="Group By" disabled={viewMode !== 'kanban'}>
                <Layers size={18} />
              </Dropdown.Toggle>
              <Dropdown.Menu className="p-3 shadow-lg border-0" style={{ minWidth: '240px', borderRadius: '12px' }}>
                <div className="mb-2">
                  <label className="small text-muted fw-bold mb-2">GROUP BY (KANBAN)</label>
                  <Form.Select size="sm" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                    <option value="status">Status</option>
                    <option value="type">Type</option>
                    <option value="company">Company</option>
                  </Form.Select>
                </div>
              </Dropdown.Menu>
            </Dropdown>

            {/* Sort Dropdown  */}
            <Dropdown align="end">
              <Dropdown.Toggle as="button" bsPrefix="p-0 border-0 bg-transparent" className="icon-btn-clean" title="Sort">
                <ArrowUpDown size={18} />
              </Dropdown.Toggle>
              <Dropdown.Menu className="p-3 shadow-lg border-0" style={{ minWidth: '240px', borderRadius: '12px' }}>
                <div className="mb-3">
                  <label className="small text-muted fw-bold mb-2">SORT BY</label>
                  <Form.Select size="sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="name">Name</option>
                    <option value="company">Company</option>
                    <option value="status">Status</option>
                    <option value="type">Type</option>
                  </Form.Select>
                </div>
                <div>
                  <label className="small text-muted fw-bold mb-2">ORDER</label>
                  <div className="d-flex gap-2">
                    <Button variant={sortOrder === 'asc' ? 'primary' : 'light'} size="sm" className="flex-grow-1" onClick={() => setSortOrder('asc')}>Asc</Button>
                    <Button variant={sortOrder === 'desc' ? 'primary' : 'light'} size="sm" className="flex-grow-1" onClick={() => setSortOrder('desc')}>Desc</Button>
                  </div>
                </div>
              </Dropdown.Menu>
            </Dropdown>

            <button className="icon-btn-clean" title="Customize Columns" onClick={() => setShowColumnManager(true)}>
              <Settings size={18} />
            </button>
          </div>

          <div className="vr h-50 my-auto opacity-25"></div>

          {/* View Toggle */}
          <div className="view-toggle-clean mx-3">
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></svg>
            </button>
            <button
              className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 5v11" /><path d="M12 5v6" /><path d="M18 5v14" /></svg>
            </button>
            <button
              className={`view-btn ${viewMode === 'chart' ? 'active' : ''}`}
              onClick={() => setViewMode('chart')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></svg>
            </button>
          </div>

          <Button
            className="btn-success-soft d-flex align-items-center gap-2"
            onClick={handleCreateContact}
          >
            <Plus size={18} /> Contact
          </Button>

          <Button
            className="btn-purple-soft d-flex align-items-center gap-2"
            onClick={() => setShowAIAssist(true)}
          >
            ✨ AI
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="contacts-content-wrapper">
        {viewMode === 'list' && (
          <ListView
            contacts={processedContacts}
            columns={contactColumns}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={(col) => {
              if (sortBy === col) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
              else { setSortBy(col); setSortOrder('asc'); }
            }}
            onEdit={handleEditContact}
            onDelete={handleDeleteContact}
            onPreview={handlePreviewContact}
            onConvertToSales={handleConvertToSales}
          />
        )}

        {viewMode === 'kanban' && (
          <KanbanView
            contacts={processedContacts}
            columns={getActiveColumns()}
            onContactUpdate={(id, updates) => {
              // If grouped by something else, we might need to map the update key
              const key = groupBy; // 'status' or 'type' etc
              handleTaskUpdate(id, { [key]: updates.status }) // KanBanView passes 'status' property, but we map it to groupBy
            }}
            onEdit={handleEditContact}
            onDelete={handleDeleteContact}
            onPreview={handlePreviewContact}
            onAddColumn={handleAddColumn}
            onEditColumn={handleEditColumn}
            onDeleteColumn={handleDeleteColumn}
          />
        )}

        {viewMode === 'chart' && (
          <ChartView contacts={processedContacts} />
        )}
      </div>

      {/* Modals */}
      <ContactModal
        show={showContactModal}
        onHide={() => { setShowContactModal(false); setEditingContact(null); }}
        contact={editingContact}
        columns={contactColumns}
        onSave={handleSaveContact}
        onDelete={handleDeleteContact}
      />

      {/* PREVIEW MODAL - UPDATED */}
      <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} centered size="md" className="contact-preview-modal">
        <Modal.Header closeButton className="border-0 pb-0 pt-4 px-4">
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold" style={{ width: '48px', height: '48px', fontSize: '18px' }}>
              {previewingContact?.name?.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <Modal.Title className="fw-bold h5 mb-0">{previewingContact?.name}</Modal.Title>
              <span className="text-muted small">{previewingContact?.type || 'Contact'}</span>
            </div>
          </div>
        </Modal.Header>
        <Modal.Body className="px-4 py-4">
          {previewingContact && (
            <div className="d-flex flex-column gap-4">
              {/* Compnay & Status */}
              <Row className="g-3">
                <Col xs={12}>
                  <div className="p-3 bg-light rounded-3 border border-light-subtle">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted small fw-bold text-uppercase ls-1">Company</span>
                      <Badge bg={previewingContact.status === 'Active' ? 'success' : 'secondary'} className="px-3 py-1 rounded-pill">
                        {previewingContact.status}
                      </Badge>
                    </div>
                    <div className="d-flex align-items-center gap-2 text-dark fw-medium">
                      <Building size={16} className="text-muted" />
                      {previewingContact.company || 'No Company'}
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Contact Info */}
              <div>
                <h6 className="text-muted small fw-bold text-uppercase mb-3 ls-1">Contact Information</h6>
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <div className="icon-box bg-white border rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                      <User size={16} className="text-secondary" />
                    </div>
                    <div>
                      <label className="d-block text-muted x-small">Email Address</label>
                      <span className="text-dark fw-medium">{previewingContact.email}</span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-3">
                    <div className="icon-box bg-white border rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                      <Phone size={16} className="text-secondary" />
                    </div>
                    <div>
                      <label className="d-block text-muted x-small">Phone Number</label>
                      <span className="text-dark fw-medium">{previewingContact.phone || 'Not Set'}</span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-3">
                    <div className="icon-box bg-white border rounded-circle d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                      <Briefcase size={16} className="text-secondary" />
                    </div>
                    <div>
                      <label className="d-block text-muted x-small">Job Title</label>
                      <span className="text-dark fw-medium">{previewingContact.role || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 px-4 pb-4 pt-0">
          <Button variant="light" onClick={() => setShowPreviewModal(false)} className="flex-grow-1">Close</Button>
          <Button variant="primary" onClick={() => { setShowPreviewModal(false); handleEditContact(previewingContact); }} className="flex-grow-1">
            <Edit size={16} className="me-2" /> Edit Contact
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ADD COLUMN MODAL */}
      <Modal show={showAddColumnModal} onHide={() => setShowAddColumnModal(false)} centered size="sm">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h6 fw-bold">Add New Status</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          <Form.Group>
            <Form.Label className="small text-muted">Status Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="e.g. Review"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateColumnConfirm()}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" size="sm" onClick={() => setShowAddColumnModal(false)}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleCreateColumnConfirm} disabled={!newColumnName.trim()}>Add Status</Button>
        </Modal.Footer>
      </Modal>

      {/* CONVERT TO SALES MODAL */}
      <Modal show={showConvertModal} onHide={() => setShowConvertModal(false)} centered size="sm">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h6 fw-bold">Convert to Sales Client</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3">
          {convertingContact && (
            <div className="mb-3">
              <div className="d-flex align-items-center gap-2 mb-3 p-2 bg-light rounded-3">
                <div className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center fw-bold" style={{ width: 36, height: 36, fontSize: 14 }}>
                  {convertingContact.name?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="fw-bold small">{convertingContact.name}</div>
                  <div className="text-muted" style={{ fontSize: 11 }}>{convertingContact.company || 'No Company'}</div>
                </div>
              </div>

              <Form.Group className="mb-2">
                <Form.Label className="small text-muted fw-bold">Client Name</Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  value={convertClient}
                  onChange={(e) => setConvertClient(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="small text-muted fw-bold">Branding Name</Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  value={convertBranding}
                  onChange={(e) => setConvertBranding(e.target.value)}
                />
              </Form.Group>

              <Form.Group>
                <Form.Label className="small text-muted fw-bold">Project Type</Form.Label>
                <Form.Select
                  size="sm"
                  value={convertType}
                  onChange={(e) => setConvertType(e.target.value)}
                >
                  <option value="Product">{productLabel}</option>
                  <option value="Service">{serviceLabel}</option>
                </Form.Select>
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" size="sm" onClick={() => setShowConvertModal(false)}>Cancel</Button>
          <Button variant="success" size="sm" onClick={handleConfirmConvert} className="d-flex align-items-center gap-1">
            <ArrowUpRight size={14} /> Convert
          </Button>
        </Modal.Footer>
      </Modal>

      <AIAssistModal
        show={showAIAssist}
        onHide={() => setShowAIAssist(false)}
        contacts={contacts}
        onApplyFilters={handleAIFilterApply}
        onCreateContact={() => { setShowAIAssist(false); handleCreateContact(); }}
      />

      {/* CUSTOMIZE COLUMNS MODAL */}
      {showColumnManager && (
        <div className="column-manager-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowColumnManager(false); }}>
          <div className="column-manager-modal">
            <div className="column-manager-modal-header">
              <div>
                <h4 className="column-manager-modal-title">Customize Columns</h4>
                <p className="column-manager-modal-subtitle">Drag to reorder, toggle visibility, or add new columns</p>
              </div>
              <button className="column-manager-close-btn" onClick={() => setShowColumnManager(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="column-manager-modal-body">
              <div className="column-manager-container">
                <div className="column-manager-header">
                  <div className="column-manager-title-section">
                    <h6 className="column-manager-title">Columns</h6>
                    <span className="column-count-badge">{contactColumns.length}</span>
                  </div>
                  <Button className="add-column-btn" size="sm" onClick={() => { setAddColData({ name: '', type: 'text', required: false, visible: true, config: {} }); setShowAddColForm(true); }}>
                    <Plus size={16} /> Add Column
                  </Button>
                </div>
                <div className="columns-list">
                  {contactColumns.map((column, idx) => (
                    <div
                      key={column.id}
                      className="sortable-column-item"
                      draggable
                      onDragStart={() => setDraggingColumnId(column.id)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (draggingColumnId && draggingColumnId !== column.id) {
                          const fromIdx = contactColumns.findIndex(c => c.id === draggingColumnId);
                          const toIdx = idx;
                          if (fromIdx !== -1 && fromIdx !== toIdx) {
                            const newCols = [...contactColumns];
                            const [moved] = newCols.splice(fromIdx, 1);
                            newCols.splice(toIdx, 0, moved);
                            setContactColumns(newCols);
                          }
                        }
                      }}
                      onDragEnd={() => setDraggingColumnId(null)}
                      style={{ opacity: draggingColumnId === column.id ? 0.5 : 1 }}
                    >
                      <div className="column-drag-handle">
                        <GripVertical size={18} />
                      </div>
                      <div className="column-content">
                        <div className="column-header-row">
                          <div className="column-name-section">
                            <strong className="column-name">{column.name.toUpperCase()}</strong>
                            <div className="column-badges">
                              <Badge className="column-type-badge">{column.type}</Badge>
                              {column.required && <Badge className="column-required-badge">Required</Badge>}
                            </div>
                          </div>
                        </div>
                        {column.config && column.config.options && (
                          <div className="column-config-info">
                            <div className="column-options-preview">
                              <span className="options-label">Options:</span>
                              <div className="options-list">
                                {column.config.options.map((opt, oi) => {
                                  const label = typeof opt === 'string' ? opt : opt.label;
                                  const color = typeof opt === 'string' ? '#3b82f6' : opt.color || '#3b82f6';
                                  const textColor = parseInt(color.slice(1, 3), 16) * 0.299 + parseInt(color.slice(3, 5), 16) * 0.587 + parseInt(color.slice(5, 7), 16) * 0.114 > 128 ? '#000' : '#fff';
                                  return (
                                    <span key={oi} className="option-pill" style={{ backgroundColor: color, color: textColor }}>
                                      {label}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="column-actions">
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => {
                            setEditColData(JSON.parse(JSON.stringify(column)));
                            setShowEditColForm(true);
                          }}
                          title="Edit column"
                          className="action-btn edit-btn"
                        >
                          <Edit size={18} />
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => {
                            setContactColumns(prev => prev.map(c =>
                              c.id === column.id ? { ...c, visible: !c.visible } : c
                            ));
                          }}
                          title={column.visible ? 'Hide column' : 'Show column'}
                          className={`action-btn visibility-btn ${!column.visible ? 'hidden' : ''}`}
                        >
                          {column.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                        </Button>
                        {!column.required && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`Delete column "${column.name}"?`)) {
                                setContactColumns(prev => prev.filter(c => c.id !== column.id));
                              }
                            }}
                            title="Delete column"
                            className="action-btn delete-btn"
                          >
                            <Trash2 size={18} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD COLUMN SUB-MODAL */}
      <Modal show={showAddColForm} onHide={() => setShowAddColForm(false)} centered size="md" className="add-column-modal">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h5 fw-bold">Add Column</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3 px-4">
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold small">Column Name *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter column name"
              value={addColData.name}
              onChange={(e) => setAddColData({ ...addColData, name: e.target.value })}
              style={{ borderRadius: '8px', padding: '10px 14px' }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold small">Field Type *</Form.Label>
            <Form.Select
              value={addColData.type}
              onChange={(e) => {
                const newType = e.target.value;
                const newConfig = (newType === 'choice' || newType === 'dropdown')
                  ? { options: [{ label: '', color: '#3b82f6' }] }
                  : {};
                setAddColData({ ...addColData, type: newType, config: newConfig });
              }}
              style={{ borderRadius: '8px', padding: '10px 14px' }}
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="choice">Choice</option>
              <option value="dropdown">Dropdown</option>
              <option value="currency">Currency</option>
              <option value="location">Location</option>
              <option value="datetime">Date and Time</option>
            </Form.Select>
          </Form.Group>

          <Form.Check
            type="checkbox"
            label="Required"
            checked={addColData.required}
            onChange={(e) => setAddColData({ ...addColData, required: e.target.checked })}
            className="mb-2"
          />

          <Form.Check
            type="checkbox"
            label="Visible by default"
            checked={addColData.visible}
            onChange={(e) => setAddColData({ ...addColData, visible: e.target.checked })}
            className="mb-3"
          />

          {addColData.type === 'text' && (
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">Max Length</Form.Label>
              <Form.Control
                type="number"
                placeholder="No limit"
                value={addColData.config.maxLength || ''}
                onChange={(e) => setAddColData({ ...addColData, config: { ...addColData.config, maxLength: e.target.value ? Number(e.target.value) : undefined } })}
                style={{ borderRadius: '8px', padding: '10px 14px' }}
              />
            </Form.Group>
          )}

          {(addColData.type === 'choice' || addColData.type === 'dropdown') && (
            <Form.Group className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label className="fw-semibold small mb-0">Options *</Form.Label>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setAddColData({
                    ...addColData,
                    config: { ...addColData.config, options: [...(addColData.config.options || []), { label: '', color: '#3b82f6' }] }
                  })}
                  style={{ fontSize: '0.75rem', borderRadius: '6px' }}
                >
                  + Add Option
                </Button>
              </div>
              {(addColData.config.options || []).map((opt, oi) => (
                <div key={oi} className="d-flex align-items-center gap-2 mb-2">
                  <input
                    type="color"
                    value={opt.color || '#3b82f6'}
                    onChange={(e) => {
                      const newOpts = [...addColData.config.options];
                      if (typeof newOpts[oi] === 'string') {
                        newOpts[oi] = { label: newOpts[oi], color: e.target.value };
                      } else {
                        newOpts[oi] = { ...newOpts[oi], color: e.target.value };
                      }
                      setAddColData({ ...addColData, config: { ...addColData.config, options: newOpts } });
                    }}
                    style={{ width: 32, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }}
                  />
                  <Form.Control
                    size="sm"
                    type="text"
                    placeholder={`Option ${oi + 1}`}
                    value={typeof opt === 'string' ? opt : (opt.label || '')}
                    onChange={(e) => {
                      const newOpts = [...addColData.config.options];
                      if (typeof newOpts[oi] === 'string') {
                        newOpts[oi] = { label: e.target.value, color: '#3b82f6' };
                      } else {
                        newOpts[oi] = { ...newOpts[oi], label: e.target.value };
                      }
                      setAddColData({ ...addColData, config: { ...addColData.config, options: newOpts } });
                    }}
                    style={{ borderRadius: '6px' }}
                  />
                  <Button
                    variant="link"
                    size="sm"
                    className="text-danger p-0"
                    onClick={() => {
                      const newOpts = addColData.config.options.filter((_, i) => i !== oi);
                      setAddColData({ ...addColData, config: { ...addColData.config, options: newOpts } });
                    }}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer style={{ background: '#f8fafc' }} className="border-0">
          <Button variant="secondary" onClick={() => setShowAddColForm(false)} style={{ borderRadius: '8px', fontWeight: 600, padding: '8px 20px' }}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!addColData.name.trim()) return;
              const newId = addColData.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
              const newColumn = {
                id: newId,
                name: addColData.name.trim(),
                type: addColData.type,
                visible: addColData.visible,
                required: addColData.required,
                config: addColData.config
              };
              setContactColumns(prev => [...prev, newColumn]);
              setShowAddColForm(false);
            }}
            disabled={!addColData.name.trim()}
            style={{ borderRadius: '8px', fontWeight: 600, padding: '8px 20px' }}
          >
            Add Column
          </Button>
        </Modal.Footer>
      </Modal>

      {/* EDIT COLUMN SUB-MODAL */}
      <Modal show={showEditColForm} onHide={() => setShowEditColForm(false)} centered size="md" className="add-column-modal">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h5 fw-bold">Edit Column</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3 px-4">
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold small">Column Name *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter column name"
              value={editColData.name}
              onChange={(e) => setEditColData({ ...editColData, name: e.target.value })}
              style={{ borderRadius: '8px', padding: '10px 14px' }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold small">Field Type *</Form.Label>
            <Form.Select
              value={editColData.type}
              onChange={(e) => {
                const newType = e.target.value;
                const newConfig = (newType === 'choice' || newType === 'dropdown')
                  ? { options: [{ label: '', color: '#3b82f6' }] }
                  : {};
                setEditColData({ ...editColData, type: newType, config: newConfig });
              }}
              style={{ borderRadius: '8px', padding: '10px 14px' }}
              disabled={editColData.id === 'name' || editColData.id === 'type' || editColData.id === 'status'}
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="choice">Choice</option>
              <option value="dropdown">Dropdown</option>
              <option value="currency">Currency</option>
              <option value="location">Location</option>
              <option value="datetime">Date and Time</option>
            </Form.Select>
          </Form.Group>

          <Form.Check
            type="checkbox"
            label="Required"
            checked={editColData.required}
            onChange={(e) => setEditColData({ ...editColData, required: e.target.checked })}
            className="mb-2"
            disabled={editColData.id === 'name'}
          />

          <Form.Check
            type="checkbox"
            label="Visible by default"
            checked={editColData.visible}
            onChange={(e) => setEditColData({ ...editColData, visible: e.target.checked })}
            className="mb-3"
          />

          {editColData.type === 'text' && (
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">Max Length</Form.Label>
              <Form.Control
                type="number"
                placeholder="No limit"
                value={editColData.config?.maxLength || ''}
                onChange={(e) => setEditColData({ ...editColData, config: { ...editColData.config, maxLength: e.target.value ? Number(e.target.value) : undefined } })}
                style={{ borderRadius: '8px', padding: '10px 14px' }}
              />
            </Form.Group>
          )}

          {(editColData.type === 'choice' || editColData.type === 'dropdown') && (
            <Form.Group className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label className="fw-semibold small mb-0">Options *</Form.Label>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setEditColData({
                    ...editColData,
                    config: { ...editColData.config, options: [...(editColData.config?.options || []), { label: '', color: '#3b82f6' }] }
                  })}
                  style={{ fontSize: '0.75rem', borderRadius: '6px' }}
                >
                  + Add Option
                </Button>
              </div>
              {(editColData.config?.options || []).map((opt, oi) => (
                <div key={oi} className="d-flex align-items-center gap-2 mb-2">
                  <input
                    type="color"
                    value={opt.color || '#3b82f6'}
                    onChange={(e) => {
                      const newOpts = [...editColData.config.options];
                      if (typeof newOpts[oi] === 'string') {
                        newOpts[oi] = { label: newOpts[oi], color: e.target.value };
                      } else {
                        newOpts[oi] = { ...newOpts[oi], color: e.target.value };
                      }
                      setEditColData({ ...editColData, config: { ...editColData.config, options: newOpts } });
                    }}
                    style={{ width: 32, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }}
                  />
                  <Form.Control
                    size="sm"
                    type="text"
                    placeholder={`Option ${oi + 1}`}
                    value={typeof opt === 'string' ? opt : (opt.label || '')}
                    onChange={(e) => {
                      const newOpts = [...editColData.config.options];
                      if (typeof newOpts[oi] === 'string') {
                        newOpts[oi] = { label: e.target.value, color: '#3b82f6' };
                      } else {
                        newOpts[oi] = { ...newOpts[oi], label: e.target.value };
                      }
                      setEditColData({ ...editColData, config: { ...editColData.config, options: newOpts } });
                    }}
                    style={{ borderRadius: '6px' }}
                  />
                  <Button
                    variant="link"
                    size="sm"
                    className="text-danger p-0"
                    onClick={() => {
                      const newOpts = editColData.config.options.filter((_, i) => i !== oi);
                      setEditColData({ ...editColData, config: { ...editColData.config, options: newOpts } });
                    }}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer style={{ background: '#f8fafc' }} className="border-0">
          <Button variant="secondary" onClick={() => setShowEditColForm(false)} style={{ borderRadius: '8px', fontWeight: 600, padding: '8px 20px' }}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!editColData.name.trim()) return;
              setContactColumns(prev => prev.map(c => c.id === editColData.id ? editColData : c));
              setShowEditColForm(false);
            }}
            disabled={!editColData.name.trim()}
            style={{ borderRadius: '8px', fontWeight: 600, padding: '8px 20px' }}
          >
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  )
}

export default Contacts
