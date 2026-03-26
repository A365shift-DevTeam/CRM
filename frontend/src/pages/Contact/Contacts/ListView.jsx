import { useState, useEffect, useRef, useCallback } from 'react'
import { Button, Form } from 'react-bootstrap'
import { Edit, Trash2, Eye, ArrowUp, ArrowDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, MoreHorizontal, Building, User, Plus, ArrowUpRight } from 'lucide-react'

export const ListView = ({ contacts, columns: columnsProp, sortBy, sortOrder, onSort, onEdit, onDelete, onPreview, onConvertToSales }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const tableRef = useRef(null)

  // -- Resizing State --
  const [columnWidths, setColumnWidths] = useState({})
  const [resizingColumn, setResizingColumn] = useState(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)

  const defaultColumns = [
    { id: 'name', name: 'Name' },
    { id: 'jobTitle', name: 'Job Title' },
    { id: 'phone', name: 'Phone' },
    { id: 'company', name: 'Company' },
    { id: 'location', name: 'Location' },
    { id: 'address', name: 'Address' },
    { id: 'type', name: 'Entity Type' },
    { id: 'status', name: 'Status' }
  ]

  // Use columns prop (respecting visibility & order) or fallback to defaults
  const columns = columnsProp
    ? columnsProp.filter(c => c.visible !== false).map(c => ({ id: c.id, name: c.name }))
    : defaultColumns

  const handleSort = (columnId) => {
    onSort(columnId)
  }

  const getSortIcon = (columnId) => {
    if (sortBy !== columnId) return null
    return sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
  }

  // Pagination calculations
  const totalContacts = contacts.length
  const totalPages = Math.ceil(totalContacts / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = Math.min(startIndex + rowsPerPage, totalContacts)
  const paginatedContacts = contacts.slice(startIndex, endIndex)

  // Reset to first page when contacts change or rows per page changes
  useEffect(() => {
    setCurrentPage(1)
  }, [contacts.length, rowsPerPage])

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value))
    setCurrentPage(1)
  }

  const goToFirstPage = () => setCurrentPage(1)
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1))
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1))
  const goToLastPage = () => setCurrentPage(totalPages)

  // -- Resizing Logic --
  const visibleColumns = columns // All filtered columns are visible

  const handleResizeStart = useCallback((columnId, e) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingColumn(columnId)
    setResizeStartX(e.clientX)

    const table = tableRef.current
    if (table) {
      const headerCells = table.querySelectorAll('thead th')
      const columnIndex = visibleColumns.findIndex(col => col.id === columnId)
      if (headerCells[columnIndex]) {
        const currentWidth = headerCells[columnIndex].offsetWidth
        setResizeStartWidth(currentWidth)
      }
    }
  }, [visibleColumns])

  const handleResizeMove = useCallback((e) => {
    if (!resizingColumn) return
    const diff = e.clientX - resizeStartX
    const newWidth = Math.max(50, resizeStartWidth + diff)
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth
    }))
  }, [resizingColumn, resizeStartX, resizeStartWidth])

  const handleResizeEnd = useCallback(() => {
    setResizingColumn(null)
  }, [])

  useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeEnd)
      document.body.classList.add('resizing')
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleResizeMove)
        document.removeEventListener('mouseup', handleResizeEnd)
        document.body.classList.remove('resizing')
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [resizingColumn, handleResizeMove, handleResizeEnd])

  const getColumnWidth = (columnId) => {
    return columnWidths[columnId] || undefined
  }

  // Persist column widths
  useEffect(() => {
    const savedWidths = localStorage.getItem('contacts_column_widths')
    if (savedWidths) {
      try {
        setColumnWidths(JSON.parse(savedWidths))
      } catch (e) {
        console.error('Error loading column widths:', e)
      }
    }
  }, [])

  useEffect(() => {
    if (Object.keys(columnWidths).length > 0) {
      localStorage.setItem('contacts_column_widths', JSON.stringify(columnWidths))
    }
  }, [columnWidths])

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active': return 'badge-enterprise badge-green'
      case 'Lead': return 'badge-enterprise badge-blue'
      case 'Customer': return 'badge-enterprise badge-teal'
      case 'Inactive': return 'badge-enterprise badge-gray'
      default: return 'badge-enterprise badge-gray'
    }
  }

  const getTypeBadgeClass = (type) => {
    return type === 'Company' ? 'badge-enterprise badge-blue' : 'badge-enterprise badge-gray'
  }

  // --- Drag-to-scroll horizontally (hidden scrollbar) ---
  const scrollContainerRef = useRef(null)
  const [isDraggingScroll, setIsDraggingScroll] = useState(false)
  const dragStartXRef = useRef(0)
  const dragScrollLeftRef = useRef(0)

  const handleDragScrollStart = (e) => {
    if (e.button !== 0) return
    const tag = e.target.tagName
    if (['BUTTON', 'A', 'INPUT', 'SELECT', 'SVG', 'path', 'line', 'polyline'].includes(tag)) return
    setIsDraggingScroll(true)
    dragStartXRef.current = e.pageX
    dragScrollLeftRef.current = scrollContainerRef.current.scrollLeft
  }

  useEffect(() => {
    if (!isDraggingScroll) return

    const onMove = (e) => {
      e.preventDefault()
      const walk = (e.pageX - dragStartXRef.current) * 1.5
      scrollContainerRef.current.scrollLeft = dragScrollLeftRef.current - walk
    }
    const onUp = () => setIsDraggingScroll(false)

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [isDraggingScroll])

  return (
    <div className="contacts-list-view-container">
      <div className="contacts-table-container">
        <div
          className={`contacts-scroll-container ${isDraggingScroll ? 'dragging' : ''}`}
          ref={scrollContainerRef}
          onMouseDown={handleDragScrollStart}
        >
          <table ref={tableRef} className="table contacts-table resizable-table">
            <thead>
              <tr>
                {columns.map((column) => {
                  const columnWidth = getColumnWidth(column.id)
                  return (
                    <th
                      key={column.id}
                      style={{
                        cursor: 'pointer',
                        userSelect: 'none',
                        width: columnWidth || undefined,
                        minWidth: columnWidth || '100px',
                        position: 'relative',
                        whiteSpace: 'nowrap'
                      }}
                      onClick={() => handleSort(column.id)}
                      className="sortable-header resizable-column-header"
                    >
                      <div className="d-flex align-items-center gap-2">
                        {column.name}
                        {getSortIcon(column.id)}
                      </div>
                      <div
                        className="column-resize-handle"
                        onMouseDown={(e) => handleResizeStart(column.id, e)}
                        onClick={(e) => e.stopPropagation()}
                        title="Drag to resize column"
                      >
                        <div className="resize-handle-line"></div>
                        <div className="resize-handle-icon">
                          <Plus size={12} />
                        </div>
                      </div>
                    </th>
                  )
                })}
                <th style={{ width: '100px', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedContacts.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="text-center text-muted py-5">
                    No contacts found. Create a new contact to get started.
                  </td>
                </tr>
              ) : (
                paginatedContacts.map(contact => (
                  <tr key={contact.id} className="contacts-table-row">
                    {columns.map(column => {
                      const cellStyle = { width: getColumnWidth(column.id) || undefined, minWidth: getColumnWidth(column.id) || '100px' };
                      switch (column.id) {
                        case 'name':
                          return (
                            <td key={column.id} style={cellStyle}>
                              <div className="contact-cell-primary">
                                <span className="contact-name">{contact.name || '-'}</span>
                                <span className="contact-subtext">
                                  <Building size={12} /> {contact.company || 'No Company'}
                                </span>
                              </div>
                            </td>
                          );
                        case 'jobTitle':
                          return (
                            <td key={column.id} style={cellStyle}>
                              <div className="contact-cell-primary">
                                <span className="fw-medium text-dark">{contact.jobTitle || 'Unknown Role'}</span>
                                <span className="contact-subtext">{contact.department || contact.company}</span>
                              </div>
                            </td>
                          );
                        case 'phone':
                          return (
                            <td key={column.id} className="fw-medium text-secondary" style={cellStyle}>
                              {contact.phone || '-'}
                            </td>
                          );
                        case 'company':
                          return (
                            <td key={column.id} style={cellStyle}>
                              <div className="contact-cell-primary">
                                <span className="fw-medium text-dark">{contact.company || '-'}</span>
                              </div>
                            </td>
                          );
                        case 'location':
                          return (
                            <td key={column.id} className="text-secondary" style={cellStyle}>
                              {contact.location || '-'}
                            </td>
                          );
                        case 'address':
                          return (
                            <td key={column.id} className="text-secondary" style={cellStyle}>
                              {contact.address || '-'}
                            </td>
                          );
                        case 'type':
                          return (
                            <td key={column.id} style={cellStyle}>
                              <span className={getTypeBadgeClass(contact.type || 'Company')}>
                                {contact.type || 'Company'}
                              </span>
                            </td>
                          );
                        case 'status':
                          return (
                            <td key={column.id} style={cellStyle}>
                              <span className={getStatusBadgeClass(contact.status)}>
                                {contact.status || '-'}
                              </span>
                            </td>
                          );
                        default:
                          return (
                            <td key={column.id} className="text-secondary" style={cellStyle}>
                              {contact[column.id] || '-'}
                            </td>
                          );
                      }
                    })}
                    {/* Actions Column */}
                    <td className="text-center">
                      <div className="d-flex gap-3 justify-content-center">
                        <div className="action-icon-wrapper text-primary" onClick={() => onPreview(contact)} style={{ cursor: 'pointer' }}>
                          <Eye size={18} />
                        </div>
                        <div className="action-icon-wrapper text-info" onClick={() => onEdit(contact)} style={{ cursor: 'pointer' }}>
                          <Edit size={18} />
                        </div>
                        <div className="action-icon-wrapper text-danger" onClick={() => {
                          if (window.confirm('Are you sure you want to delete this contact?')) {
                            onDelete(contact.id)
                          }
                        }} style={{ cursor: 'pointer' }}>
                          <Trash2 size={18} />
                        </div>
                        <div className="action-icon-wrapper text-success" onClick={() => onConvertToSales(contact)} style={{ cursor: 'pointer' }} title="Convert to Sales Client">
                          <ArrowUpRight size={18} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalContacts > 0 && (
          <div className="contacts-pagination d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <Form.Select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                size="sm"
                className="border-secondary-subtle text-secondary"
                style={{ width: 'auto', cursor: 'pointer' }}
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </Form.Select>
              <span className="text-muted small ms-2">
                Showing {startIndex + 1} to {endIndex} of {totalContacts} contacts
              </span>
            </div>

            <div className="d-flex align-items-center gap-1">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                style={{ border: 'none' }}
                title="First Page"
              >
                <ChevronsLeft size={16} />
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                style={{ border: 'none' }}
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </Button>

              <span className="text-muted small mx-2">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline-secondary"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                style={{ border: 'none' }}
                title="Next Page"
              >
                <ChevronRight size={16} />
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                style={{ border: 'none' }}
                title="Last Page"
              >
                <ChevronsRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
