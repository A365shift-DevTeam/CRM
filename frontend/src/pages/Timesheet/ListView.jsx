import { useState, useEffect, useRef, useCallback } from 'react'
import { Button, Form, Dropdown } from 'react-bootstrap'
import { Edit, Trash2, Eye, ArrowUp, ArrowDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Plus, Paperclip, FileText, Image, File, Clock } from 'lucide-react'
import { formatFileSize, getFileTypeLabel } from '../../services/storageService'

const getAttachmentIcon = (fileType) => {
  if (!fileType) return Paperclip
  if (fileType.startsWith('image/')) return Image
  if (fileType === 'application/pdf') return FileText
  return File
}

const formatValue = (value, column) => {
  if (value === null || value === undefined || value === '') return '-'

  if (column.type === 'datetime') {
    const date = new Date(value)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (column.type === 'date') {
    const date = new Date(value)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (column.type === 'time') {
    const date = new Date(value)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (column.type === 'file' && value) {
    // Handle new object format { url, fileName, fileType, fileSize }
    if (typeof value === 'object' && value.url) {
      const Icon = getAttachmentIcon(value.fileType)
      return (
        <a
          href={value.url}
          target="_blank"
          rel="noopener noreferrer"
          className="d-inline-flex align-items-center gap-2 text-decoration-none"
          style={{
            background: '#eff6ff',
            color: '#3b82f6',
            padding: '4px 10px',
            borderRadius: 8,
            fontSize: '0.8rem',
            fontWeight: 500,
            border: '1px solid #bfdbfe',
            maxWidth: 180,
            overflow: 'hidden'
          }}
          title={value.fileName}
        >
          <Icon size={14} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value.fileName || 'Attachment'}
          </span>
        </a>
      )
    }
    // Legacy string URL fallback
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="d-inline-flex align-items-center gap-1 text-primary"
        style={{ fontSize: '0.85rem' }}
      >
        <Paperclip size={14} /> View
      </a>
    )
  }

  return String(value)
}

const computeDuration = (entry) => {
  const startStr = entry.values?.['col-start-datetime']
  const endStr = entry.values?.['col-end-datetime']
  if (!startStr || !endStr) return '-'
  const start = new Date(startStr)
  const end = new Date(endStr)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '-'
  const diffMs = end.getTime() - start.getTime()
  if (diffMs <= 0) return '-'
  const hours = diffMs / (1000 * 60 * 60)
  return `${Math.round(hours * 10) / 10}h`
}

export const ListView = ({ entries, columns, sortBy, sortOrder, onSort, onEdit, onDelete, onPreview }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [columnWidths, setColumnWidths] = useState({})
  const [resizingColumn, setResizingColumn] = useState(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)
  const tableRef = useRef(null)

  const visibleColumns = columns.filter(col => col.visible !== false)

  const handleSort = (columnId) => {
    if (sortBy === columnId) {
      onSort(columnId, sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      onSort(columnId, 'asc')
    }
  }

  const getSortIcon = (columnId) => {
    if (sortBy !== columnId) return null
    return sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
  }

  const totalEntries = entries.length
  const totalPages = Math.ceil(totalEntries / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = Math.min(startIndex + rowsPerPage, totalEntries)
  const paginatedEntries = entries.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [entries.length, rowsPerPage])

  const handleRowsPerPageChange = (value) => {
    setRowsPerPage(Number(value))
    setCurrentPage(1)
  }

  const goToFirstPage = () => setCurrentPage(1)
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1))
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1))
  const goToLastPage = () => setCurrentPage(totalPages)

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

  useEffect(() => {
    const savedWidths = localStorage.getItem('timesheet_column_widths')
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
      localStorage.setItem('timesheet_column_widths', JSON.stringify(columnWidths))
    }
  }, [columnWidths])

  if (visibleColumns.length === 0) {
    return (
      <div className="text-center text-muted py-5">
        <p>No columns configured. Please add columns in Column Manager.</p>
      </div>
    )
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
    <div className="timesheet-list-view-container">
      <div
        className={`timesheet-scroll-container ${isDraggingScroll ? 'dragging' : ''}`}
        ref={scrollContainerRef}
        onMouseDown={handleDragScrollStart}
      >
        <table ref={tableRef} className="table table-hover resizable-table timesheet-table">
          <thead>
            <tr>
              {visibleColumns.map((column) => {
                const columnWidth = getColumnWidth(column.id)
                return (
                  <th
                    key={column.id}
                    style={{
                      cursor: 'pointer',
                      userSelect: 'none',
                      width: columnWidth || undefined,
                      minWidth: columnWidth || '100px',
                      position: 'relative'
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
              <th style={{ width: '90px', minWidth: '90px', position: 'relative' }}>
                <div className="d-flex align-items-center gap-1">
                  <Clock size={12} /> Duration
                </div>
              </th>
              <th style={{ width: '120px', position: 'relative' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEntries.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 2} className="text-center text-muted py-5">
                  No entries found. Create a new entry to get started.
                </td>
              </tr>
            ) : (
              paginatedEntries.map(entry => (
                <tr key={entry.id} className="timesheet-table-row">
                  {visibleColumns.map(column => {
                    const columnWidth = getColumnWidth(column.id)
                    const value = entry.values?.[column.id]
                    return (
                      <td
                        key={column.id}
                        style={{
                          width: columnWidth || undefined,
                          minWidth: columnWidth || '100px'
                        }}
                      >
                        {formatValue(value, column)}
                      </td>
                    )
                  })}
                  <td style={{ fontWeight: 600, color: '#10b981', fontSize: '0.875rem' }}>
                    {computeDuration(entry)}
                  </td>
                  <td>
                    <div className="d-flex gap-2 align-items-center">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => onPreview(entry)}
                        title="Preview"
                        className="p-0 text-info"
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => onEdit(entry)}
                        title="Edit"
                        className="p-0"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this entry?')) {
                            onDelete(entry.id)
                          }
                        }}
                        title="Delete"
                        className="p-0 text-danger"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalEntries > 0 && (
        <div className="timesheet-pagination d-flex align-items-center justify-content-between mt-3">
          <div className="d-flex align-items-center gap-2">
            <Dropdown>
              <Dropdown.Toggle
                className="timesheet-dropdown-toggle"
                id="rows-per-page-dropdown"
                size="sm"
                style={{ width: 'auto' }}
              >
                {rowsPerPage} per page
              </Dropdown.Toggle>
              <Dropdown.Menu className="timesheet-dropdown-menu">
                {[10, 25, 50, 100].map(val => (
                  <Dropdown.Item
                    key={val}
                    active={rowsPerPage === val}
                    onClick={() => handleRowsPerPageChange(val)}
                  >
                    {val} per page
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
            <span className="text-muted small">
              Showing {startIndex + 1} to {endIndex} of {totalEntries} entries
            </span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <Button variant="outline-secondary" size="sm" onClick={goToFirstPage} disabled={currentPage === 1} title="First page">
              <ChevronsLeft size={16} />
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1} title="Previous page">
              <ChevronLeft size={16} />
            </Button>
            <span className="mx-2 small">
              Page {currentPage} of {totalPages}
            </span>
            <Button variant="outline-secondary" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages} title="Next page">
              <ChevronRight size={16} />
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={goToLastPage} disabled={currentPage === totalPages} title="Last page">
              <ChevronsRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
