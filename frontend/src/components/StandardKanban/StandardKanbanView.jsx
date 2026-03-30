import { useState, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Card, Button, Dropdown, Form } from 'react-bootstrap'
import { MoreVertical, Check, X, Plus } from 'lucide-react'
import {
  DndContext, pointerWithin, rectIntersection,
  KeyboardSensor, PointerSensor, useSensor, useSensors,
  useDroppable, DragOverlay, defaultDropAnimationSideEffects, MeasuringStrategy
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './StandardKanban.css'

const COLUMN_COLORS = ['#3b82f6', '#f97316', '#22c55e', '#6366f1', '#ec4899', '#64748b']
const getColumnColor = (index) => COLUMN_COLORS[index % COLUMN_COLORS.length]

const AVATAR_COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#06b6d4', '#0f172a', '#64748b']

export const getInitials = (name) => {
  if (!name) return '??'
  return String(name).split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
}

export const getAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[6]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

/* Droppable column wrapper */
const DroppableColumn = ({ id, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className={'std-kanban-droppable' + (isOver ? ' std-kanban-droppable-active' : '')}>
      {children}
    </div>
  )
}

/* Sortable card wrapper */
const SortableCard = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    transition: { duration: 150, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }
  })
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    position: 'relative',
    touchAction: 'none',
  }
  if (isDragging) style.pointerEvents = 'none'
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  )
}

/**
 * StandardKanbanView - Unified CRM Kanban Board.
 *
 * Props:
 *   items           - Array of data items
 *   columns         - Array of column names (statuses)
 *   getItemColumn   - (item) => columnName
 *   getItemId       - (item) => id  (default: item.id)
 *   onItemMove      - (itemId, newColumn) => void
 *   renderCard      - (item, { isOverlay }) => JSX
 *   onAddColumn     - optional
 *   onEditColumn    - optional: (oldName, newName) => void
 *   onDeleteColumn  - optional: (name) => void
 *   showColumnActions - default true
 */
export const StandardKanbanView = ({
  items = [],
  columns = [],
  getItemColumn,
  getItemId = (item) => item.id,
  onItemMove,
  renderCard,
  onAddColumn,
  onEditColumn,
  onDeleteColumn,
  showColumnActions = true,
}) => {
  const [activeId, setActiveId] = useState(null)
  const [overColumn, setOverColumn] = useState(null)
  const [editingColumnId, setEditingColumnId] = useState(null)
  const [editedColumnTitle, setEditedColumnTitle] = useState('')
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Group items into columns
  const grouped = useMemo(() => {
    const groups = {}
    columns.forEach(col => { groups[col] = [] })
    items.forEach(item => {
      const col = getItemColumn(item)
      if (groups[col]) groups[col].push(item)
      else if (groups[columns[0]]) groups[columns[0]].push(item)
    })
    return groups
  }, [items, columns, getItemColumn])

  const findColumnForItem = useCallback((itemId) => {
    for (const [col, list] of Object.entries(grouped)) {
      if (list.some(item => getItemId(item) === itemId)) return col
    }
    return null
  }, [grouped, getItemId])

  const resolveOverColumn = useCallback((overId) => {
    if (!overId) return null
    const id = String(overId)
    if (columns.includes(id)) return id
    const item = items.find(i => getItemId(i) === overId)
    if (item) return getItemColumn(item)
    return null
  }, [columns, items, getItemId, getItemColumn])

  const customCollisionDetection = useCallback((args) => {
    const pc = pointerWithin(args)
    return pc.length > 0 ? pc : rectIntersection(args)
  }, [])

  // Drag handlers
  const handleDragStart = (e) => {
    setActiveId(e.active.id)
    document.body.style.cursor = 'grabbing'
  }
  const handleDragOver = (e) => {
    setOverColumn(e.over ? resolveOverColumn(e.over.id) : null)
  }
  const handleDragEnd = (e) => {
    const { active, over } = e
    setActiveId(null)
    setOverColumn(null)
    document.body.style.cursor = ''
    if (!over || !onItemMove) return
    const newCol = resolveOverColumn(over.id)
    if (!newCol) return
    if (findColumnForItem(active.id) !== newCol) onItemMove(active.id, newCol)
  }
  const handleDragCancel = () => {
    setActiveId(null)
    setOverColumn(null)
    document.body.style.cursor = ''
  }

  // Column editing
  const saveColumnEdit = (col) => {
    if (editedColumnTitle.trim() && editedColumnTitle !== col && onEditColumn) {
      onEditColumn(col, editedColumnTitle.trim())
    }
    setEditingColumnId(null)
    setEditedColumnTitle('')
  }
  const saveNewColumn = () => {
    if (newColumnTitle.trim() && onAddColumn) {
      onAddColumn(newColumnTitle.trim())
      setNewColumnTitle('')
      setIsAddingColumn(false)
    }
  }

  const activeItem = activeId ? items.find(i => getItemId(i) === activeId) : null
  const activeItemColumn = activeId ? findColumnForItem(activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
    >
      <div className="std-kanban-container">
        {columns.map((column, index) => {
          const isDropTarget = activeId && overColumn === column && activeItemColumn !== column
          const color = getColumnColor(index)
          const columnItems = grouped[column] || []

          return (
            <div key={column} className="std-kanban-column-wrapper">
              <div className={'std-kanban-column' + (isDropTarget ? ' std-kanban-column-highlight' : '')}>
                {/* Column Header */}
                <div className="std-kanban-header" style={{ borderTopColor: color }}>
                  {editingColumnId === column ? (
                    <div className="d-flex gap-1 w-100">
                      <Form.Control
                        size="sm"
                        value={editedColumnTitle}
                        onChange={e => setEditedColumnTitle(e.target.value)}
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') saveColumnEdit(column) }}
                      />
                      <Button size="sm" variant="success" onClick={() => saveColumnEdit(column)}>
                        <Check size={14} />
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditingColumnId(null)}>
                        <X size={14} />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="d-flex align-items-center gap-2">
                        <div className="std-kanban-color-dot" style={{ background: color }} />
                        <h6 className="std-kanban-column-title">{column}</h6>
                        <span className="std-kanban-count">{columnItems.length}</span>
                      </div>
                      {showColumnActions && (onEditColumn || onDeleteColumn) && (
                        <Dropdown align="end">
                          <Dropdown.Toggle as="button" className="std-kanban-menu-btn">
                            <MoreVertical size={16} />
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            {onEditColumn && (
                              <Dropdown.Item onClick={() => {
                                setEditingColumnId(column)
                                setEditedColumnTitle(column)
                              }}>
                                Rename
                              </Dropdown.Item>
                            )}
                            {onDeleteColumn && (
                              <Dropdown.Item
                                className="text-danger"
                                onClick={() => onDeleteColumn(column)}
                              >
                                Delete
                              </Dropdown.Item>
                            )}
                          </Dropdown.Menu>
                        </Dropdown>
                      )}
                    </>
                  )}
                </div>

                {/* Droppable Area */}
                <DroppableColumn id={column}>
                  <div className="std-kanban-cards">
                    <SortableContext
                      items={columnItems.map(i => getItemId(i))}
                      strategy={verticalListSortingStrategy}
                    >
                      {columnItems.map(item => (
                        <SortableCard key={getItemId(item)} id={getItemId(item)}>
                          <Card className="std-kanban-card">
                            {renderCard(item, { isOverlay: false })}
                          </Card>
                        </SortableCard>
                      ))}
                    </SortableContext>
                    {columnItems.length === 0 && (
                      <div className="std-kanban-empty">Drop items here</div>
                    )}
                  </div>
                </DroppableColumn>
              </div>
            </div>
          )
        })}

        {/* Add Column Button */}
        {onAddColumn && (
          <div className="std-kanban-add-column">
            {isAddingColumn ? (
              <div className="std-kanban-add-form">
                <Form.Control
                  size="sm"
                  placeholder="Column name..."
                  value={newColumnTitle}
                  onChange={e => setNewColumnTitle(e.target.value)}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') saveNewColumn() }}
                  className="mb-2"
                />
                <div className="d-flex gap-2">
                  <Button size="sm" variant="primary" onClick={saveNewColumn} className="flex-grow-1">
                    Add
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => { setIsAddingColumn(false); setNewColumnTitle('') }}>
                    <X size={14} />
                  </Button>
                </div>
              </div>
            ) : (
              <button className="std-kanban-add-btn" onClick={() => setIsAddingColumn(true)}>
                <Plus size={16} className="me-1" /> Add Column
              </button>
            )}
          </div>
        )}
      </div>

      {/* Drag Overlay */}
      {createPortal(
        <DragOverlay
          dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: { active: { opacity: '0.4' } }
            })
          }}
        >
          {activeItem ? (
            <div className="std-kanban-overlay-card">
              <Card className="std-kanban-card">
                {renderCard(activeItem, { isOverlay: true })}
              </Card>
            </div>
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  )
}
