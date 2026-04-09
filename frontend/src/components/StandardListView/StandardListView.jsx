import { useState, useEffect, useRef, useCallback } from 'react'
import { Button, Form } from 'react-bootstrap'
import { ArrowUp, ArrowDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Plus } from 'lucide-react'
import './StandardListView.css'

/**
 * StandardListView — reusable table component with:
 * - Column resize (drag handles, persisted to localStorage)
 * - Pagination (rows-per-page selector + first/prev/next/last)
 * - Sort headers with arrow indicators
 * - Drag-to-scroll horizontally
 *
 * Props:
 *   items          — array of data items
 *   columns        — array of { id, name, visible? } column definitions
 *   sortBy         — current sort column id
 *   sortOrder      — 'asc' | 'desc'
 *   onSort         — (columnId) => void  (toggle sort)
 *   renderCell     — (item, column) => ReactNode
 *   renderActions  — (item) => ReactNode  (action buttons per row)
 *   extraColumns   — array of { id, name, width, render: (item) => ReactNode } for extra columns like Duration
 *   storageKey     — localStorage key prefix for persisting column widths
 *   emptyMessage   — message when no items
 *   itemLabel      — label for pagination text (e.g. "contacts", "entries")
 *   rowsPerPageOptions — array of numbers (default [10, 20, 50, 100])
 *   defaultRowsPerPage — default rows per page (default 10)
 *   className      — additional className for the container
 */
export default function StandardListView({
  items = [],
  columns: columnsProp = [],
  sortBy,
  sortOrder,
  onSort,
  renderCell,
  renderActions,
  extraColumns = [],
  storageKey = 'standard_list',
  emptyMessage = 'No items found.',
  itemLabel = 'items',
  rowsPerPageOptions = [10, 20, 50, 100],
  defaultRowsPerPage = 10,
  className = '',
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage)
  const [columnWidths, setColumnWidths] = useState({})
  const [resizingColumn, setResizingColumn] = useState(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)
  const tableRef = useRef(null)

  // Filter to visible columns
  const visibleColumns = columnsProp.filter(c => c.visible !== false)

  // --- Sort ---
  const handleSort = (columnId) => {
    if (onSort) onSort(columnId)
  }

  const getSortIcon = (columnId) => {
    if (sortBy !== columnId) return null
    return sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
  }

  // --- Pagination ---
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems)
  const paginatedItems = items.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [items.length, rowsPerPage])

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value))
    setCurrentPage(1)
  }

  const goToFirstPage = () => setCurrentPage(1)
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1))
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1))
  const goToLastPage = () => setCurrentPage(totalPages)

  // --- Column Resize ---
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
        setResizeStartWidth(headerCells[columnIndex].offsetWidth)
      }
    }
  }, [visibleColumns])

  const handleResizeMove = useCallback((e) => {
    if (!resizingColumn) return
    const diff = e.clientX - resizeStartX
    const newWidth = Math.max(50, resizeStartWidth + diff)
    setColumnWidths(prev => ({ ...prev, [resizingColumn]: newWidth }))
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

  const getColumnWidth = (columnId) => columnWidths[columnId] || undefined

  // Persist column widths
  useEffect(() => {
    const saved = localStorage.getItem(`${storageKey}_column_widths`)
    if (saved) {
      try { setColumnWidths(JSON.parse(saved)) } catch (e) { /* ignore */ }
    }
  }, [storageKey])

  useEffect(() => {
    if (Object.keys(columnWidths).length > 0) {
      localStorage.setItem(`${storageKey}_column_widths`, JSON.stringify(columnWidths))
    }
  }, [columnWidths, storageKey])

  // --- Drag-to-scroll horizontally ---
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

  if (visibleColumns.length === 0) {
    return (
      <div className="text-center text-muted py-5">
        <p>No columns configured. Please add columns in settings.</p>
      </div>
    )
  }

  const hasActions = !!renderActions
  const totalColSpan = visibleColumns.length + extraColumns.length + (hasActions ? 1 : 0)

  return (
    <div className={`slv-container ${className}`}>
      <div className="slv-table-wrapper">
        <div
          className={`slv-scroll-container ${isDraggingScroll ? 'dragging' : ''}`}
          ref={scrollContainerRef}
          onMouseDown={handleDragScrollStart}
        >
          <table ref={tableRef} className="table slv-table resizable-table">
            <thead>
              <tr>
                {visibleColumns.map((column) => {
                  const w = getColumnWidth(column.id)
                  return (
                    <th
                      key={column.id}
                      style={{
                        cursor: 'pointer',
                        userSelect: 'none',
                        width: w || undefined,
                        minWidth: w || '100px',
                        position: 'relative',
                        whiteSpace: 'nowrap',
                      }}
                      onClick={() => handleSort(column.id)}
                      className="slv-sortable-header slv-resizable-header"
                    >
                      <div className="d-flex align-items-center gap-2">
                        {column.name}
                        {getSortIcon(column.id)}
                      </div>
                      <div
                        className="slv-resize-handle"
                        onMouseDown={(e) => handleResizeStart(column.id, e)}
                        onClick={(e) => e.stopPropagation()}
                        title="Drag to resize column"
                      >
                        <div className="slv-resize-line" />
                        <div className="slv-resize-icon"><Plus size={12} /></div>
                      </div>
                    </th>
                  )
                })}
                {extraColumns.map(ec => (
                  <th key={ec.id} style={{ width: ec.width || '100px', minWidth: ec.width || '100px', position: 'relative' }}>
                    {ec.name}
                  </th>
                ))}
                {hasActions && (
                  <th style={{ width: '120px', position: 'relative', textAlign: 'center' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={totalColSpan} className="text-center text-muted py-5">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => (
                  <tr key={item.id ?? idx} className="slv-row">
                    {visibleColumns.map(column => {
                      const w = getColumnWidth(column.id)
                      return (
                        <td key={column.id} style={{ width: w || undefined, minWidth: w || '100px' }}>
                          {renderCell ? renderCell(item, column) : (item.values?.[column.id] ?? item[column.id] ?? '-')}
                        </td>
                      )
                    })}
                    {extraColumns.map(ec => (
                      <td key={ec.id}>{ec.render ? ec.render(item) : '-'}</td>
                    ))}
                    {hasActions && (
                      <td className="text-center">{renderActions(item)}</td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="slv-pagination">
          <div className="slv-pagination-left">
            <Form.Select
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              size="sm"
              className="slv-rows-select"
            >
              {rowsPerPageOptions.map(n => (
                <option key={n} value={n}>{n} per page</option>
              ))}
            </Form.Select>
            <span className="slv-pagination-info">
              Showing {startIndex + 1} to {endIndex} of {totalItems} {itemLabel}
            </span>
          </div>
          <div className="slv-pagination-right">
            <Button variant="outline-secondary" size="sm" onClick={goToFirstPage} disabled={currentPage === 1} title="First page" className="slv-page-btn">
              <ChevronsLeft size={16} />
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1} title="Previous page" className="slv-page-btn">
              <ChevronLeft size={16} />
            </Button>
            <span className="slv-page-indicator">
              Page {currentPage} of {totalPages}
            </span>
            <Button variant="outline-secondary" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages} title="Next page" className="slv-page-btn">
              <ChevronRight size={16} />
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={goToLastPage} disabled={currentPage === totalPages} title="Last page" className="slv-page-btn">
              <ChevronsRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
