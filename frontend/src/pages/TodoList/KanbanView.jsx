import { useState, forwardRef } from 'react'
import { Row, Col, Card, Button, Badge } from 'react-bootstrap'
import { Edit, Trash2 } from 'lucide-react'
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FieldRenderer } from './FieldRenderers'

// Droppable Column Component
const DroppableColumn = ({ id, children }) => {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`kanban-body ${isOver ? 'kanban-drop-active' : ''}`}
      style={{
        minHeight: '200px',
        transition: 'background-color 0.2s ease, border-color 0.2s ease'
      }}
    >
      {children}
    </div>
  )
}

const KanbanCard = forwardRef(({ task, columns, onEdit, onDelete, style, className, isDragging, ...props }, ref) => {
  const titleColumn = columns.find(col => col.type === 'text' && col.visible) || columns[0]
  const visibleColumns = columns.filter(col => col.visible && col.id !== titleColumn?.id && col.type !== 'number').slice(0, 2)

  const combinedStyle = {
    ...style,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={ref}
      style={combinedStyle}
      className={className || 'mb-2 kanban-card'}
      {...props}
    >
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1 pe-2">
            {titleColumn && (
              <div className="kanban-card-title mb-2">
                <FieldRenderer
                  column={titleColumn}
                  value={titleColumn.id === 'id' ? task.id : task.values?.[titleColumn.id]}
                  isEditing={false}
                />
              </div>
            )}
            {visibleColumns.map(column => (
              <div key={column.id} className="kanban-card-field mb-1">
                <span className="field-label">{column.name}: </span>
                <FieldRenderer
                  column={column}
                  value={column.id === 'id' ? task.id : task.values?.[column.id]}
                  isEditing={false}
                />
              </div>
            ))}

          </div>
          <div className="kanban-card-actions d-flex flex-column gap-1">
            <Button
              variant="link"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(task)
              }}
              title="Edit"
              className="p-1"
            >
              <Edit size={14} />
            </Button>
            <Button
              variant="link"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(task.id)
              }}
              title="Delete"
              className="p-1 text-danger"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  )
})

// Sortable Kanban Card Component
const SortableKanbanCard = ({ task, columns, onEdit, onDelete, isDragging: externalDragging }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: isDragging || externalDragging ? 0.4 : 1,
    cursor: 'grab',
    zIndex: isDragging ? 1000 : 1
  }

  return (
    <KanbanCard
      ref={setNodeRef}
      style={style}
      task={task}
      columns={columns}
      onEdit={onEdit}
      onDelete={onDelete}
      isDragging={isDragging}
      {...attributes}
      {...listeners}
    />
  )
}

// Drag Overlay Card (shown while dragging)
const DragOverlayCard = ({ task, columns }) => {
  const titleColumn = columns.find(col => col.type === 'text' && col.visible) || columns[0]

  return (
    <Card className="kanban-card kanban-card-overlay" style={{
      boxShadow: '0 15px 30px rgba(0,0,0,0.2)',
      transform: 'rotate(3deg) scale(1.02)',
      cursor: 'grabbing'
    }}>
      <Card.Body className="p-3">
        <div className="kanban-card-title">
          {titleColumn && task.values?.[titleColumn.id]}
        </div>
      </Card.Body>
    </Card>
  )
}

export const KanbanView = ({ tasks, columns, onTaskUpdate, onEdit, onDelete }) => {
  const [activeId, setActiveId] = useState(null)
  const [activeTask, setActiveTask] = useState(null)

  // Find the choice column to use for Kanban grouping (prefer 'Status')
  const kanbanColumn = columns.find(col =>
    (col.type === 'choice' || col.type === 'dropdown') && col.name.toLowerCase() === 'status'
  ) || columns.find(col => (col.type === 'choice' || col.type === 'dropdown') && col.config?.options)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  if (!kanbanColumn || !kanbanColumn.config?.options) {
    return (
      <div className="alert alert-info">
        <strong>No Choice Column Found:</strong> Kanban view requires a Choice type column with options.
        Please add a Choice column (e.g., Status) to use Kanban view.
      </div>
    )
  }

  // Normalize options to get labels (handle both string and object formats)
  const normalizedOptions = kanbanColumn.config.options.map(opt => {
    if (typeof opt === 'string') return opt
    return opt.label || ''
  }).filter(opt => opt)

  // Group tasks by column value
  const groupedTasks = {}
  normalizedOptions.forEach(option => {
    groupedTasks[option] = []
  })

  tasks.forEach(task => {
    const value = task.values?.[kanbanColumn.id]
    if (value) {
      // Handle array values (multi-select) by taking the first one for grouping, or single value
      const rawKey = Array.isArray(value) ? value[0] : value;
      const key = String(rawKey).trim();

      if (groupedTasks[key]) {
        groupedTasks[key].push(task)
      } else if (normalizedOptions.length > 0) {
        groupedTasks[normalizedOptions[0]].push(task)
      }
    } else if (normalizedOptions.length > 0) {
      groupedTasks[normalizedOptions[0]].push(task)
    }
  })

  const handleDragStart = (event) => {
    const { active } = event
    setActiveId(active.id)
    const task = tasks.find(t => t.id === active.id)
    setActiveTask(task)
  }

  const handleDragOver = (event) => {
    // Optional: can be used for real-time visual feedback
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)
    setActiveTask(null)

    if (!over) return

    const taskId = active.id
    const overId = over.id

    // Find which column was dropped on
    let newColumnValue = null

    // Check if dropped on a column (droppable area)
    if (normalizedOptions.includes(overId)) {
      newColumnValue = overId
    } else {
      // Find which column the dropped-on task belongs to
      for (const option of normalizedOptions) {
        const columnTasks = groupedTasks[option]
        if (columnTasks.some(t => t.id === overId)) {
          newColumnValue = option
          break
        }
      }
    }

    if (!newColumnValue) return

    // Find the task and check if column actually changed
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const currentValue = task.values?.[kanbanColumn.id]
    const currentColumnValue = Array.isArray(currentValue) ? currentValue[0] : currentValue

    if (currentColumnValue === newColumnValue) return // No change needed

    // Update task's column value
    const newValues = {
      ...task.values,
      [kanbanColumn.id]: kanbanColumn.config.multiSelect ? [newColumnValue] : newColumnValue
    }

    onTaskUpdate(taskId, { values: newValues })
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setActiveTask(null)
  }

  // Calculate column width based on number of options
  const colWidth = Math.max(3, Math.floor(12 / normalizedOptions.length))

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <Row className="kanban-container g-3">
        {normalizedOptions.map((option, index) => {
          const originalOption = kanbanColumn.config.options[index]
          const optionColor = typeof originalOption === 'object' && originalOption.color
            ? originalOption.color
            : ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ec4899'][index % 5]

          const columnTasks = groupedTasks[option] || []

          return (
            <Col key={option} md={colWidth} className="kanban-column-wrapper">
              <div className="kanban-column">
                <div
                  className="kanban-header"
                  style={{
                    borderTop: `3px solid ${optionColor}`,
                    background: `linear-gradient(to bottom, ${optionColor}10, transparent)`
                  }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="kanban-status-dot"
                      style={{ backgroundColor: optionColor }}
                    />
                    <h6 className="mb-0">{option}</h6>
                  </div>
                  <Badge
                    className="kanban-count"
                    style={{ backgroundColor: optionColor }}
                  >
                    {columnTasks.length}
                  </Badge>
                </div>
                <DroppableColumn id={option}>
                  <SortableContext
                    items={columnTasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {columnTasks.map(task => (
                      <SortableKanbanCard
                        key={task.id}
                        task={task}
                        columns={columns}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        isDragging={activeId === task.id}
                      />
                    ))}
                  </SortableContext>
                  {columnTasks.length === 0 && (
                    <div className="kanban-empty">
                      <span>Drop tasks here</span>
                    </div>
                  )}
                </DroppableColumn>
              </div>
            </Col>
          )
        })}
      </Row>

      {/* Drag Overlay - follows cursor smoothly */}
      <DragOverlay dropAnimation={{
        duration: 250,
        easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
      }}>
        {activeTask ? (
          <DragOverlayCard task={activeTask} columns={columns} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
