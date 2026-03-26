import { useState, useEffect, useRef, useCallback } from 'react'
import { FieldRenderer } from './FieldRenderers'
import { Button, Form } from 'react-bootstrap'
import { Edit, Trash2, ArrowUp, ArrowDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Plus, Bell } from 'lucide-react'

export const ListView = ({ tasks, columns, sortBy, sortOrder, onSort, onEdit, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [columnWidths, setColumnWidths] = useState({})
  const [resizingColumn, setResizingColumn] = useState(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)
  const tableRef = useRef(null)

  // Filter out invalid columns and ensure they have required properties
  const validColumns = Array.isArray(columns) ? columns.filter(col => col && col.id && col.name) : []
  const visibleColumns = validColumns.filter(col => col.visible !== false)

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

  // Pagination calculations
  const totalTasks = tasks.length
  const totalPages = Math.ceil(totalTasks / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = Math.min(startIndex + rowsPerPage, totalTasks)
  const paginatedTasks = tasks.slice(startIndex, endIndex)

  // Reset to first page when tasks change or rows per page changes
  useEffect(() => {
    setCurrentPage(1)
  }, [tasks.length, rowsPerPage])

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value))
    setCurrentPage(1)
  }

  const goToFirstPage = () => setCurrentPage(1)
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1))
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1))
  const goToLastPage = () => setCurrentPage(totalPages)

  // Column resizing handlers
  const handleResizeStart = useCallback((columnId, e) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingColumn(columnId)
    setResizeStartX(e.clientX)

    // Get current width of the column
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
    const newWidth = Math.max(50, resizeStartWidth + diff) // Minimum width of 50px

    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth
    }))
  }, [resizingColumn, resizeStartX, resizeStartWidth])

  const handleResizeEnd = useCallback(() => {
    setResizingColumn(null)
  }, [])

  // Set up global mouse event listeners for resizing
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

  // Get column width
  const getColumnWidth = (columnId) => {
    return columnWidths[columnId] || undefined
  }

  // If no columns, show a message
  if (visibleColumns.length === 0) {
    return (
      <div className="text-center text-muted py-5">
        <p>No columns configured. Please add columns in View Settings.</p>
      </div>
    )
  }

  // Always show table structure, even when empty (like SharePoint)
  return (
    <div className="list-view-container">
      <div className="table-responsive">
        <table ref={tableRef} className="table table-hover todo-table resizable-table">
          <thead>
            <tr>
              {visibleColumns.map((column, index) => {
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
              <th style={{ width: '100px', position: 'relative' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTasks.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="text-center text-muted py-5">
                  No tasks found. Create a new task to get started.
                </td>
              </tr>
            ) : (
              paginatedTasks.map(task => (
                <tr key={task.id}>
                  {visibleColumns.map(column => {
                    const columnWidth = getColumnWidth(column.id)
                    // ID is at root of task object, others are in values
                    const value = column.id === 'id' ? task.id : task.values?.[column.id]
                    return (
                      <td
                        key={column.id}
                        style={{
                          width: columnWidth || undefined,
                          minWidth: columnWidth || '100px'
                        }}
                      >
                        <FieldRenderer
                          column={column}
                          value={value}
                          isEditing={false}
                        />
                      </td>
                    )
                  })}

                  <td>
                    <div className="d-flex gap-1 align-items-center">
                      {task.notify && (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-info notification-icon"
                          title="This task has notifications enabled"
                          disabled
                          style={{ cursor: 'default', opacity: 1 }}
                        >
                          <Bell size={14} fill="currentColor" />
                        </Button>
                      )}
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => onEdit(task)}
                        title="Edit"
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => onDelete(task.id)}
                        title="Delete"
                        className="text-danger"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalTasks > 0 && (
        <div className="pagination-controls">
          <div className="pagination-left">
            <span className="rows-per-page-label">Rows per page:</span>
            <Form.Select
              className="rows-per-page-select"
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </Form.Select>
            <span className="page-range">
              {startIndex + 1}-{endIndex} of {totalTasks}
            </span>
          </div>
          <div className="pagination-right">
            <button
              className="pagination-button"
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              title="Go to first page"
            >
              <ChevronsLeft size={18} />
            </button>
            <button
              className="pagination-button"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              title="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="pagination-button"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              title="Next page"
            >
              <ChevronRight size={18} />
            </button>
            <button
              className="pagination-button"
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              title="Go to last page"
            >
              <ChevronsRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
