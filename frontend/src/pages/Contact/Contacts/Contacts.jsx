import { useState, useEffect, useMemo } from 'react'
import { Button, Dropdown, Form, Badge, Modal, Card, Row, Col } from 'react-bootstrap'
import {
  Plus, Filter, MoreVertical,
  ArrowUpDown, Check, X, Layers, User, Flag, Briefcase, Building, Phone, Edit, Settings, ArrowUpRight,
  GripVertical, Eye, EyeOff, Trash2
} from 'lucide-react'
import { contactService } from '../../../services/contactService'
import { projectService } from '../../../services/api'
import { leadService } from '../../../services/leadService'

import { ListView } from './ListView'
import { KanbanView } from './KanbanView'
import { ChartView } from './ChartView'
import { ContactModal } from './ContactModal'
import { AIAssistModal } from './AIAssistModal'
import { useToast } from '../../../components/Toast/ToastContext'
import { ContactColumnManager } from './ContactColumnManager'
import PageToolbar from '../../../components/PageToolbar/PageToolbar'
import StatsGrid from '../../../components/StatsGrid/StatsGrid'
import './Contacts.css'

const DEFAULT_STATUS_COLUMNS = ['Active', 'Inactive', 'Lead', 'Prospect', 'Customer']

const Contacts = () => {
  const toast = useToast()
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
        // Map backend colId to frontend id for compatibility
        const mapped = cols.map(col => ({
          ...col,
          id: col.colId || col.id,
          config: col.config || {}
        }))
        setContactColumns(mapped)
      }
    } catch (error) {
      console.error('Error loading columns:', error)
    } finally {
      setColumnsLoaded(true)
    }
  }

  const handleColumnsChange = async (newColumns) => {
    try {
      const updatedColumns = await contactService.getColumns()
      const mapped = (updatedColumns || []).map(col => ({
        ...col,
        id: col.colId || col.id,
        config: col.config || {}
      }))
      setContactColumns(mapped)
    } catch (error) {
      console.error('Error refreshing columns:', error)
      setContactColumns(newColumns || [])
    }
  }

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
      toast.warning('Can only add columns when grouping by Status')
    }
  }

  const handleCreateColumnConfirm = () => {
    if (newColumnName.trim()) {
      handleAddColumn(newColumnName.trim())
      setNewColumnName('')
      setShowAddColumnModal(false)
      toast.success('Status column added')
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
      toast.warning('Can only modify columns when grouping by Status')
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
        toast.info('Column deleted')
      }
    } else {
      toast.warning('Can only delete columns when grouping by Status')
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

      if (editingContact) {
        await contactService.updateContact(editingContact.id, cleanedData)
        await loadContacts()
        setShowContactModal(false)
        setEditingContact(null)
        toast.success('Contact updated successfully')
      } else {
        await contactService.createContact(cleanedData)
        await loadContacts()
        setShowContactModal(false)
        setEditingContact(null)
        toast.success('Contact created successfully')
      }
    } catch (error) {
      console.error('Error saving contact:', error)
      toast.error('Failed to save contact')
    }
  }

  const handleDeleteContact = async (contactId) => {
    try {
      await contactService.deleteContact(contactId)
      await loadContacts()
      setShowContactModal(false)
      setEditingContact(null)
      toast.success('Contact deleted successfully')
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast.error('Failed to delete contact')
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

  // --- Convert to Lead ---
  const handleConvertToSales = (contact) => {
    setConvertingContact(contact)
    setConvertBranding(contact.company || '')
    setConvertClient(contact.name || '')
    setShowConvertModal(true)
  }

  const handleConfirmConvert = async () => {
    if (!convertingContact) return
    const c = convertingContact
    try {
      await leadService.createLead({
        contactId: c.id,
        contactName: convertClient || c.name,
        company: convertBranding || c.company || '',
        source: 'Inbound',
        score: 'Warm',
        stage: 'New',
        notes: '',
        type: convertType,
        expectedValue: null,
        expectedCloseDate: null,
        assignedTo: '',
      })
      toast.success(`Contact "${c.name}" converted to a Lead!`)
      setShowConvertModal(false)
      setConvertingContact(null)
    } catch (error) {
      console.error('Error converting contact to lead:', error)
      toast.error('Failed to convert contact. Please try again.')
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

      <StatsGrid stats={[
        { label: 'Total Contacts', value: stats.total, icon: <User size={22} />, color: 'blue' },
        { label: 'Total Leads', value: stats.leads, icon: <Flag size={22} />, color: 'green' },
        { label: 'Customers', value: stats.customers, icon: <Briefcase size={22} />, color: 'blue' },
        { label: 'Companies', value: stats.companies, icon: <Building size={22} />, color: 'purple' },
      ]} />

      {/* Standardized Toolbar */}
      <PageToolbar
        title="Contacts"
        itemCount={contacts.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search contacts..."
        filters={filterableColumns}
        filterBy={filterBy}
        filterValue={filterValue}
        onFilterChange={(fb, fv) => { setFilterBy(fb); setFilterValue(fv); }}
        getFilterOptions={getFilterOptions}
        sortOptions={[
          { id: 'name', name: 'Name' },
          { id: 'company', name: 'Company' },
          { id: 'status', name: 'Status' },
          { id: 'type', name: 'Type' }
        ]}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(sb, so) => { setSortBy(sb); setSortOrder(so); }}
        groupOptions={[
          { id: 'status', name: 'Status' },
          { id: 'type', name: 'Type' },
          { id: 'company', name: 'Company' }
        ]}
        groupBy={groupBy}
        onGroupChange={setGroupBy}
        groupDisabled={viewMode !== 'kanban'}
        onManageColumns={() => setShowColumnManager(true)}
        viewModes={[
          { id: 'list', label: 'List' },
          { id: 'kanban', label: 'Kanban' },
          { id: 'chart', label: 'Chart' }
        ]}
        activeView={viewMode}
        onViewChange={setViewMode}
        actions={[
          { label: 'Contact', icon: <Plus size={16} />, variant: 'success', onClick: handleCreateContact },
          { label: 'AI', icon: <span>✨</span>, variant: 'purple', onClick: () => setShowAIAssist(true) }
        ]}
      />

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
          <Modal.Title className="h6 fw-bold">Convert to Lead</Modal.Title>
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

      {/* Column Manager Modal */}
      <ContactColumnManager
        show={showColumnManager}
        onHide={() => setShowColumnManager(false)}
        columns={contactColumns}
        onColumnsChange={handleColumnsChange}
      />

    </div>
  )
}

export default Contacts
