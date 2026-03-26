import { useState, useMemo, useCallback } from 'react'
import { Card, Button, Badge, Dropdown, Form, OverlayTrigger, Tooltip, Row, Col } from 'react-bootstrap'
import { Edit, Trash2, Eye, MoreVertical, Check, X, Calendar, User, Briefcase } from 'lucide-react'
import { DndContext, pointerWithin, rectIntersection, KeyboardSensor, PointerSensor, useSensor, useSensors, useDroppable, DragOverlay, defaultDropAnimationSideEffects } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const getInitials = (name) => {
  if (!name) return '??'
  return String(name).split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
}

const getAvatarColor = (name) => {
  const colors = ['bg-primary', 'bg-success', 'bg-danger', 'bg-warning', 'bg-info', 'bg-dark', 'bg-secondary']
  if (!name) return 'bg-secondary'
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const getColumnColor = (index) => {
  const colors = ['#3b82f6', '#f97316', '#22c55e', '#64748b', '#8b5cf6', '#ec4899']
  return colors[index % colors.length]
}

const DroppableColumn = ({ id, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`kanban-body ${isOver ? 'kanban-drop-active' : ''}`}
      style={{
        minHeight: '150px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isOver ? 'rgba(0,0,0,0.02)' : 'transparent',
        transition: 'background-color 0.2s',
        flexGrow: 1
      }}
    >
      {children}
    </div>
  )
}

const SortableTimesheetCard = ({ entry, onEdit, onDelete, onPreview, isOverlay = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: entry.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    cursor: isOverlay ? 'grabbing' : 'grab',
    position: 'relative',
    touchAction: 'none'
  }

  const values = entry.values || {}
  const taskName = values['col-task'] || 'Untitled Task'
  const customer = values['col-customer']
  const user = values['col-name']
  const dateStr = values['col-start-datetime'] ? new Date(values['col-start-datetime']).toLocaleDateString() : ''

  const renderContent = () => (
    <Card.Body className="p-3">
      <div className="d-flex justify-content-between align-items-start">
        <div className="flex-grow-1 pe-2">
          <div className="d-flex align-items-center gap-2 mb-2">
            <div className={`rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm ${getAvatarColor(taskName)}`}
              style={{ width: '24px', height: '24px', fontSize: '10px', flexShrink: 0 }}>
              {getInitials(taskName)}
            </div>
            <div className="kanban-card-title fw-semibold text-dark" title={taskName}>
              {taskName}
            </div>
          </div>
          <div className="d-flex flex-column gap-1">
            {customer && (
              <div className="kanban-card-field small text-muted text-truncate">
                <Briefcase size={12} className="me-1" />{customer}
              </div>
            )}
            {user && (
              <div className="kanban-card-field small text-muted text-truncate">
                <User size={12} className="me-1" />{user}
              </div>
            )}
            {dateStr && (
              <div className="kanban-card-field small text-muted text-truncate">
                <Calendar size={12} className="me-1" />{dateStr}
              </div>
            )}
          </div>
        </div>
        {!isOverlay && (
          <div className="kanban-card-actions d-flex flex-column gap-1 opacity-50 ms-1">
            <OverlayTrigger overlay={<Tooltip>Preview</Tooltip>}>
              <Eye size={14} className="cursor-pointer hover-primary" onClick={(e) => { e.stopPropagation(); onPreview(entry) }} />
            </OverlayTrigger>
            <OverlayTrigger overlay={<Tooltip>Edit</Tooltip>}>
              <Edit size={14} className="cursor-pointer hover-primary" onClick={(e) => { e.stopPropagation(); onEdit(entry) }} />
            </OverlayTrigger>
            <OverlayTrigger overlay={<Tooltip>Delete</Tooltip>}>
              <Trash2 size={14} className="cursor-pointer hover-danger" onClick={(e) => { e.stopPropagation(); window.confirm('Delete?') && onDelete(entry.id) }} />
            </OverlayTrigger>
          </div>
        )}
      </div>
    </Card.Body>
  )

  if (isOverlay) {
    return (
      <Card className="timesheet-kanban-card shadow-lg border-primary border-2 bg-white" style={{ width: '100%', cursor: 'grabbing', transform: 'scale(1.05) rotate(2deg)' }}>
        {renderContent()}
      </Card>
    )
  }

  return (
    <Card ref={setNodeRef} style={style} className={`timesheet-kanban-card mb-2 border-0 shadow-sm ${isDragging ? 'dragging' : ''}`} {...attributes} {...listeners}>
      {renderContent()}
    </Card>
  )
}

export const KanbanView = ({
  entries,
  columns,
  groupBy,
  onEntryUpdate,
  onEdit,
  onDelete,
  onPreview,
  onAddColumn,
  onEditColumn,
  onDeleteColumn
}) => {
  const [activeId, setActiveId] = useState(null)
  const [editingColumnId, setEditingColumnId] = useState(null)
  const [editedColumnTitle, setEditedColumnTitle] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const groupedEntries = useMemo(() => {
    const groups = {}
    columns.forEach(col => { groups[col] = [] })
    entries.forEach(entry => {
      const val = entry.values?.[groupBy] || 'Unassigned'
      if (groups[val]) {
        groups[val].push(entry)
      } else {
        const fallback = groups['Unassigned'] ? 'Unassigned' : columns[0]
        if (groups[fallback]) groups[fallback].push(entry)
      }
    })
    return groups
  }, [entries, columns, groupBy])

  const customCollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) return pointerCollisions
    return rectIntersection(args)
  }, [])

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const entryId = active.id
    const overId = String(over.id)

    let newGroupValue = null

    if (columns.includes(overId)) {
      newGroupValue = overId
    } else {
      const overEntry = entries.find(e => e.id === overId)
      if (overEntry) {
        newGroupValue = overEntry.values?.[groupBy] || columns[0]
      }
    }

    if (newGroupValue) {
      const entry = entries.find(e => e.id === entryId)
      const currentGroupValue = entry?.values?.[groupBy] || 'Unassigned'

      if (entry && currentGroupValue !== newGroupValue) {
        onEntryUpdate(entryId, newGroupValue)
      }
    }
  }

  const saveColumnEdit = (col) => {
    if (editedColumnTitle.trim() && editedColumnTitle !== col) onEditColumn(col, editedColumnTitle.trim())
    setEditingColumnId(null)
    setEditedColumnTitle('')
  }

  const activeEntry = activeId ? entries.find(e => e.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Row className="kanban-container g-3 flex-nowrap overflow-auto py-2 h-100">
        {columns.map((column, index) => (
          <Col key={column} style={{ minWidth: '300px', maxWidth: '350px' }}>
            <div className="kanban-column h-100 bg-white bg-opacity-50 rounded-3 border border-light shadow-sm">
              {/* Header */}
              <div
                className="kanban-header p-3 border-bottom d-flex justify-content-between align-items-center sticky-top bg-white rounded-top-3"
                style={{ borderTop: `4px solid ${getColumnColor(index)}` }}
              >
                {editingColumnId === column ? (
                  <div className="d-flex gap-1 w-100">
                    <Form.Control size="sm" value={editedColumnTitle} onChange={e => setEditedColumnTitle(e.target.value)} autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') saveColumnEdit(column) }} />
                    <Button size="sm" variant="success" onClick={() => saveColumnEdit(column)}><Check size={14} /></Button>
                    <Button size="sm" variant="danger" onClick={() => setEditingColumnId(null)}><X size={14} /></Button>
                  </div>
                ) : (
                  <>
                    <div className="d-flex align-items-center gap-2">
                      <h6 className="mb-0 fw-bold text-dark text-uppercase small ls-1">{column}</h6>
                      <Badge bg="light" text="dark" className="border rounded-pill ms-1">{groupedEntries[column]?.length || 0}</Badge>
                    </div>
                    <Dropdown align="end">
                      <Dropdown.Toggle as="button" className="btn btn-sm btn-link text-muted p-0 no-arrow"><MoreVertical size={16} /></Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => { setEditingColumnId(column); setEditedColumnTitle(column) }}>Rename</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </>
                )}
              </div>

              {/* Droppable Area */}
              <DroppableColumn id={column}>
                <div className="p-2 d-flex flex-column gap-2" style={{ minHeight: '100px' }}>
                  <SortableContext items={(groupedEntries[column] || []).map(e => e.id)} strategy={verticalListSortingStrategy}>
                    {(groupedEntries[column] || []).map(entry => (
                      <SortableTimesheetCard
                        key={entry.id}
                        entry={entry}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onPreview={onPreview}
                      />
                    ))}
                  </SortableContext>
                  {(!groupedEntries[column] || groupedEntries[column].length === 0) && (
                    <div className="text-center text-muted py-4 small border-2 border-dashed rounded opacity-50 m-2">
                      Drop items here
                    </div>
                  )}
                </div>
              </DroppableColumn>
            </div>
          </Col>
        ))}
      </Row>

      <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
        {activeEntry ? <SortableTimesheetCard entry={activeEntry} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}
