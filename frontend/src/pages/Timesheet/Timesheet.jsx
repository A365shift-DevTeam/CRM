import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, Dropdown, Form, Badge, Modal } from 'react-bootstrap'
import { Plus, Search, Settings, Calendar, Clock, FileText, User, Building2, CheckCircle, Paperclip, ListChecks, Info, MapPin } from 'lucide-react'
import { timesheetService } from '../../services/timesheetService'
import { ListView } from './ListView'
import { KanbanView } from './KanbanView'
import { ChartView } from './ChartView'
import { TimesheetModal } from './TimesheetModal'
import { ColumnManager } from './ColumnManager'
import './Timesheet.css'

const Timesheet = () => {
  const [entries, setEntries] = useState([])
  const [columns, setColumns] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // View State
  const [viewMode, setViewMode] = useState('list')

  const [showEntryModal, setShowEntryModal] = useState(false)
  const [showColumnManager, setShowColumnManager] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewingEntry, setPreviewingEntry] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterBy, setFilterBy] = useState('all')
  const [filterValue, setFilterValue] = useState('')
  const [sortBy, setSortBy] = useState('col-start-datetime')
  const [sortOrder, setSortOrder] = useState('desc')
  const [groupBy, setGroupBy] = useState('none')
  const [initialEntryValues, setInitialEntryValues] = useState({})

  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  // Handle navigation from Sales
  useEffect(() => {
    if (location.state?.createNewEntry && location.state?.project) {
      const project = location.state.project;
      const newValues = {
        'col-customer': project.clientName,
        'col-task': project.title || project.name, // Use project title as task
        'col-notes': `Project: ${project.title} (${project.customId})`,
        'col-start-datetime': new Date().toISOString()
      };
      setInitialEntryValues(newValues);
      setEditingEntry(null);
      setShowEntryModal(true);

      // Clear state to prevent reopening on reload
      window.history.replaceState({}, document.title)
    }
  }, [location])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [entriesData, columnsData] = await Promise.all([
        timesheetService.getEntries(),
        timesheetService.getColumns()
      ])
      setEntries(entriesData || [])
      // Deduplicate columns by id — prevents doubled fields even if Firestore has duplicates
      const seen = new Set()
      const uniqueColumns = (columnsData || []).filter(col => {
        if (seen.has(col.id)) return false
        seen.add(col.id)
        return true
      })
      setColumns(uniqueColumns)
    } catch (error) {
      console.error('Error loading timesheet data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getFilterOptions = (columnId) => {
    const values = new Set()
    entries.forEach(entry => {
      const value = entry.values?.[columnId]
      if (value) values.add(value)
    })
    return Array.from(values).sort()
  }

  const processedEntries = useMemo(() => {
    let filtered = [...entries]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(entry => {
        return Object.values(entry.values || {}).some(value => {
          if (value === null || value === undefined) return false
          return String(value).toLowerCase().includes(query)
        })
      })
    }

    if (filterBy !== 'all' && filterValue) {
      filtered = filtered.filter(entry => {
        const value = entry.values?.[filterBy]
        return String(value || '').toLowerCase() === filterValue.toLowerCase()
      })
    }

    filtered.sort((a, b) => {
      let aValue = a.values?.[sortBy] || ''
      let bValue = b.values?.[sortBy] || ''

      if (sortBy.includes('datetime') || sortBy.includes('date')) {
        aValue = new Date(aValue).getTime() || 0
        bValue = new Date(bValue).getTime() || 0
      } else if (typeof aValue === 'string') {
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
  }, [entries, searchQuery, filterBy, filterValue, sortBy, sortOrder])

  const groupedEntries = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All': processedEntries }
    }

    const groups = {}
    processedEntries.forEach(entry => {
      const groupKey = entry.values?.[groupBy] || 'Unassigned'
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(entry)
    })

    const sortedGroups = {}
    Object.keys(groups).sort().forEach(key => {
      sortedGroups[key] = groups[key]
    })

    return sortedGroups
  }, [processedEntries, groupBy])

  const getKanbanColumns = () => {
    if (groupBy === 'none') {
      return ['All']
    }
    const values = new Set()
    entries.forEach(e => {
      const val = e.values?.[groupBy] || 'Unassigned'
      values.add(val)
    })
    return Array.from(values).sort()
  }

  const handleSort = (columnId, order) => {
    setSortBy(columnId)
    setSortOrder(order)
  }

  const handleCreateEntry = () => {
    setEditingEntry(null)
    setShowEntryModal(true)
  }

  const handleEditEntry = (entry) => {
    setEditingEntry(entry)
    setShowEntryModal(true)
  }

  const handlePreviewEntry = (entry) => {
    setPreviewingEntry(entry)
    setShowPreviewModal(true)
  }

  const handleSaveEntry = async (entryData) => {
    try {
      if (editingEntry) {
        await timesheetService.updateEntry(editingEntry.id, { values: entryData })
      } else {
        await timesheetService.createEntry({ values: entryData })
      }
      await loadData()
      setShowEntryModal(false)
      setEditingEntry(null)
    } catch (error) {
      console.error('Error saving entry:', error)
      alert('Failed to save entry: ' + (error.message || 'Unknown error'))
    }
  }

  const handleDeleteEntry = async (entryId) => {
    try {
      await timesheetService.deleteEntry(entryId)
      await loadData()
      setShowEntryModal(false)
      setEditingEntry(null)
    } catch (error) {
      console.error('Error deleting entry:', error)
      alert('Failed to delete entry: ' + (error.message || 'Unknown error'))
    }
  }

  const handleEntryFieldUpdate = async (entryId, newValue) => {
    if (groupBy === 'none') return

    try {
      const entry = entries.find(e => e.id === entryId)
      if (!entry) return

      const updatedValues = { ...entry.values, [groupBy]: newValue }

      // Optimistic Update
      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, values: updatedValues } : e))

      await timesheetService.updateEntry(entryId, { values: updatedValues })
    } catch (error) {
      console.error('Error updating entry field:', error)
      await loadData()
    }
  }

  const handleColumnsChange = async (newColumns) => {
    try {
      const updatedColumns = await timesheetService.getColumns()
      // Deduplicate by id
      const seen = new Set()
      const unique = updatedColumns.filter(col => {
        if (seen.has(col.id)) return false
        seen.add(col.id)
        return true
      })
      setColumns(unique)
    } catch (error) {
      console.error('Error updating columns:', error)
      // Deduplicate fallback too
      const seen = new Set()
      const unique = (newColumns || []).filter(col => {
        if (seen.has(col.id)) return false
        seen.add(col.id)
        return true
      })
      setColumns(unique)
    }
  }

  const formatDateTimePreview = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

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

  const shouldDisplayAsBadge = (columnId) => {
    return ['col-task', 'col-name', 'col-customer'].includes(columnId)
  }

  const getBadgeColor = (columnId) => {
    if (columnId === 'col-customer') return 'success'
    return 'info'
  }

  // Auto-select a grouping when switching to Kanban
  useEffect(() => {
    if (viewMode === 'kanban' && groupBy === 'none') {
      setGroupBy('col-customer')
    }
  }, [viewMode, groupBy])

  if (isLoading && entries.length === 0) {
    return (
      <div className="timesheet-container">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  const visibleColumns = columns.filter(col => col.visible !== false)
  const filterableColumns = columns.filter(col =>
    col.visible !== false &&
    col.id !== 'col-id' &&
    col.id !== 'col-notes' &&
    col.id !== 'col-attachments' &&
    col.type !== 'file'
  )

  return (
    <div className="timesheet-container">

      {/* Stats Grid — flat, no wrapper */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper blue"><ListChecks size={24} /></div>
            <div className="stat-content">
              <div className="stat-title">Total Entries</div>
              <div className="stat-value">{processedEntries.length}</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper green"><Clock size={24} /></div>
            <div className="stat-content">
              <div className="stat-title">Total Hours</div>
              <div className="stat-value">
                {(() => {
                  const totalHours = processedEntries.reduce((total, entry) => {
                    const startStr = entry.values?.['col-start-datetime']
                    const endStr = entry.values?.['col-end-datetime']
                    if (!startStr || !endStr) return total
                    const start = new Date(startStr)
                    const end = new Date(endStr)
                    if (isNaN(start.getTime()) || isNaN(end.getTime())) return total
                    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
                    if (diff <= 0 || isNaN(diff)) return total
                    return total + diff
                  }, 0)
                  const rounded = Math.round(totalHours * 10) / 10
                  return isNaN(rounded) ? '0h' : `${rounded}h`
                })()}
              </div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper orange"><User size={24} /></div>
            <div className="stat-content">
              <div className="stat-title">Customers</div>
              <div className="stat-value">
                {new Set(processedEntries.map(e => e.values?.['col-customer']).filter(Boolean)).size}
              </div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper purple"><MapPin size={24} /></div>
            <div className="stat-content">
              <div className="stat-title">Sites</div>
              <div className="stat-value">
                {new Set(processedEntries.map(e => e.values?.['col-site']).filter(Boolean)).size}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar — flat row */}
      <div className="timesheet-toolbar mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
        {/* Search */}
        <div className="search-wrapper position-relative" style={{ width: '240px' }}>
          <Form.Control
            type="text"
            placeholder="Search entries..."
            className="ps-5 bg-white border-secondary-subtle"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ borderRadius: '8px', fontSize: '13px' }}
          />
          <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style={{ zIndex: 10 }} />
        </div>

        {/* Right side buttons */}
        <div className="d-flex align-items-center gap-2">
          {/* Filter */}
          <Dropdown align="end">
            <Dropdown.Toggle as="button" className="icon-btn">
              <div className={`icon-wrapper ${filterBy !== 'all' ? 'active' : ''}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
              </div>
            </Dropdown.Toggle>
            <Dropdown.Menu className="timesheet-dropdown-menu p-3" style={{ minWidth: '280px' }}>
              <div className="mb-3">
                <Form.Label className="small text-muted fw-bold mb-2">FILTER BY COLUMN</Form.Label>
                <Form.Select value={filterBy} onChange={(e) => { setFilterBy(e.target.value); setFilterValue('') }} className="form-select-sm">
                  <option value="all">All Columns</option>
                  {filterableColumns.map(col => (
                    <option key={col.id} value={col.id}>{col.name}</option>
                  ))}
                </Form.Select>
              </div>
              {filterBy !== 'all' && (
                <div>
                  <Form.Label className="small text-muted fw-bold mb-2">FILTER VALUE</Form.Label>
                  <Form.Select value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="form-select-sm">
                    <option value="">Select value...</option>
                    {getFilterOptions(filterBy).map(value => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </Form.Select>
                </div>
              )}
              {filterBy !== 'all' && (
                <div className="mt-3 pt-2 border-top text-end">
                  <button className="btn btn-link btn-sm text-danger text-decoration-none p-0" onClick={() => { setFilterBy('all'); setFilterValue('') }}>
                    Clear Filters
                  </button>
                </div>
              )}
            </Dropdown.Menu>
          </Dropdown>

          {/* Group */}
          <Dropdown align="end">
            <Dropdown.Toggle as="button" className="icon-btn">
              <div className={`icon-wrapper ${groupBy !== 'none' ? 'active' : ''}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              </div>
            </Dropdown.Toggle>
            <Dropdown.Menu className="timesheet-dropdown-menu p-3" style={{ minWidth: '250px' }}>
              <Form.Label className="small text-muted fw-bold mb-2">GROUP BY</Form.Label>
              {filterableColumns.map(col => (
                <Dropdown.Item key={col.id} active={groupBy === col.id} onClick={() => setGroupBy(col.id)} className="rounded">{col.name}</Dropdown.Item>
              ))}
              <Dropdown.Divider />
              <Dropdown.Item active={groupBy === 'none'} onClick={() => setGroupBy('none')} className="rounded">None</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          {/* Sort */}
          <Dropdown align="end">
            <Dropdown.Toggle as="button" className="icon-btn">
              <div className="icon-wrapper">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline>
                </svg>
              </div>
            </Dropdown.Toggle>
            <Dropdown.Menu className="timesheet-dropdown-menu p-3" style={{ minWidth: '250px' }}>
              <div className="mb-3">
                <Form.Label className="small text-muted fw-bold mb-2">SORT BY</Form.Label>
                <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-select-sm">
                  {visibleColumns.map(col => (<option key={col.id} value={col.id}>{col.name}</option>))}
                </Form.Select>
              </div>
              <div>
                <Form.Label className="small text-muted fw-bold mb-2">ORDER</Form.Label>
                <div className="d-flex gap-2">
                  <Button variant={sortOrder === 'asc' ? 'primary' : 'light'} size="sm" className="flex-grow-1" onClick={() => setSortOrder('asc')}>Ascending</Button>
                  <Button variant={sortOrder === 'desc' ? 'primary' : 'light'} size="sm" className="flex-grow-1" onClick={() => setSortOrder('desc')}>Descending</Button>
                </div>
              </div>
            </Dropdown.Menu>
          </Dropdown>

          <div className="vr opacity-25 mx-2"></div>

          {/* View Toggle */}
          <div className="view-toggle-group">
            <button className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="List View">
              <svg style={{ minWidth: 18, minHeight: 18, display: 'block' }} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" />
                <line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" />
              </svg>
            </button>
            <button className={`view-toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')} title="Kanban View">
              <svg style={{ minWidth: 18, minHeight: 18, display: 'block' }} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 5v11" /><path d="M12 5v6" /><path d="M18 5v14" />
              </svg>
            </button>
            <button className={`view-toggle-btn ${viewMode === 'chart' ? 'active' : ''}`} onClick={() => setViewMode('chart')} title="Chart View">
              <svg style={{ minWidth: 18, minHeight: 18, display: 'block' }} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
              </svg>
            </button>
          </div>

          <Button variant="outline-secondary" size="sm" onClick={() => setShowColumnManager(true)} className="d-flex align-items-center gap-2 btn-icon-text">
            <Settings size={16} /> Manage Columns
          </Button>
          <Button variant="primary" size="sm" onClick={handleCreateEntry} className="d-flex align-items-center gap-2 ms-1 btn-icon-text timesheet-add-btn">
            <Plus size={16} /> Add Entry
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="timesheet-content">
        {viewMode === 'list' && (
          groupBy === 'none' ? (
            <ListView
              entries={processedEntries}
              columns={visibleColumns}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              onEdit={handleEditEntry}
              onDelete={handleDeleteEntry}
              onPreview={handlePreviewEntry}
            />
          ) : (
            <div className="timesheet-grouped-view">
              {Object.entries(groupedEntries).map(([groupKey, groupEntries]) => (
                <div key={groupKey} className="timesheet-group mb-4">
                  <div className="timesheet-group-header">
                    <h5 className="mb-0">{groupKey}</h5>
                    <Badge bg="primary">{groupEntries.length}</Badge>
                  </div>
                  <ListView
                    entries={groupEntries}
                    columns={visibleColumns}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    onEdit={handleEditEntry}
                    onDelete={handleDeleteEntry}
                    onPreview={handlePreviewEntry}
                  />
                </div>
              ))}
            </div>
          )
        )}

        {viewMode === 'kanban' && (
          <KanbanView
            entries={processedEntries}
            columns={getKanbanColumns()}
            groupBy={groupBy === 'none' ? 'col-customer' : groupBy}
            onEntryUpdate={handleEntryFieldUpdate}
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
            onPreview={handlePreviewEntry}
            onAddColumn={() => { }}
            onEditColumn={() => { }}
            onDeleteColumn={() => { }}
          />
        )}

        {viewMode === 'chart' && (
          <ChartView entries={processedEntries} />
        )}
      </div>

      <TimesheetModal
        show={showEntryModal}
        onHide={() => {
          setShowEntryModal(false)
          setEditingEntry(null)
        }}
        entry={editingEntry}
        columns={columns}
        onSave={handleSaveEntry}
        onDelete={handleDeleteEntry}
        initialValues={initialEntryValues}
      />

      <ColumnManager
        show={showColumnManager}
        onHide={() => setShowColumnManager(false)}
        columns={columns}
        onColumnsChange={handleColumnsChange}
      />

      {/* Preview Modal */}
      <Modal
        show={showPreviewModal}
        onHide={() => {
          setShowPreviewModal(false)
          setPreviewingEntry(null)
        }}
        centered
        size="xl"
        className="timesheet-preview-modal"
      >
        <Modal.Header className="border-bottom pb-2">
          <Modal.Title className="w-100 mb-0">
            {previewingEntry?.values?.['col-notes'] || 'Timesheet Entry Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-3 pb-3" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {previewingEntry && (
            <div className="timesheet-preview-content">
              <div className="row g-3">
                {visibleColumns
                  .filter(col => col.id !== 'col-id')
                  .sort((a, b) => {
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
                  .map(column => {
                    const value = previewingEntry.values?.[column.id]
                    const IconComponent = getColumnIcon(column.id)
                    const isBadge = shouldDisplayAsBadge(column.id)
                    const isDateTime = column.type === 'datetime' || column.type === 'date'
                    const isFile = column.type === 'file'
                    const isNotes = column.id === 'col-notes'
                    const colClass = isNotes ? 'col-12' : 'col-md-6'

                    return (
                      <div key={column.id} className={colClass}>
                        <div className="timesheet-preview-field">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <IconComponent size={16} className="text-muted" />
                            <span className="timesheet-preview-label fw-semibold text-dark">
                              {column.name}
                            </span>
                            {isDateTime && (
                              <Info size={12} className="text-muted ms-1" />
                            )}
                          </div>
                          <div className="timesheet-preview-value ps-4">
                            {isBadge && value ? (
                              <Badge
                                bg={getBadgeColor(column.id)}
                                className="px-2 py-1 rounded-pill"
                                style={{
                                  backgroundColor: column.id === 'col-customer'
                                    ? '#10b981'
                                    : '#3b82f6',
                                  fontSize: '0.8125rem',
                                  fontWeight: 500
                                }}
                              >
                                {value}
                              </Badge>
                            ) : isDateTime ? (
                              <span className="text-dark fw-medium" style={{ fontSize: '0.875rem' }}>
                                {formatDateTimePreview(value)}
                              </span>
                            ) : isFile && value ? (
                              (() => {
                                const attachment = typeof value === 'object' && value.url ? value : { url: value, fileName: 'Attachment' }
                                return (
                                  <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="d-inline-flex align-items-center gap-2 text-decoration-none"
                                    style={{
                                      background: '#eff6ff',
                                      color: '#3b82f6',
                                      padding: '6px 14px',
                                      borderRadius: 10,
                                      fontSize: '0.84rem',
                                      fontWeight: 500,
                                      border: '1px solid #bfdbfe'
                                    }}
                                  >
                                    <Paperclip size={14} />
                                    {attachment.fileName || 'View Attachment'}
                                  </a>
                                )
                              })()
                            ) : value ? (
                              <span className="text-dark" style={{ fontSize: '0.875rem' }}>{value}</span>
                            ) : (
                              <span className="text-muted" style={{ fontSize: '0.875rem' }}>-</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top pt-3">
          <Button
            variant="secondary"
            onClick={() => {
              setShowPreviewModal(false)
              setPreviewingEntry(null)
            }}
          >
            Close
          </Button>
          {previewingEntry && (
            <Button
              variant="primary"
              onClick={() => {
                setShowPreviewModal(false)
                setPreviewingEntry(null)
                handleEditEntry(previewingEntry)
              }}
            >
              Edit Entry
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default Timesheet
