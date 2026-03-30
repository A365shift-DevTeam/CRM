import { StandardKanbanView } from '../../components/StandardKanban/StandardKanbanView'
import { Card, Button } from 'react-bootstrap'
import { Edit, Trash2 } from 'lucide-react'
import { FieldRenderer } from './FieldRenderers'

export const KanbanView = ({ tasks, columns, onTaskUpdate, onEdit, onDelete }) => {
  // Find the choice column to use for Kanban grouping (prefer 'Status')
  const kanbanColumn = columns.find(col =>
    (col.type === 'choice' || col.type === 'dropdown') && col.name.toLowerCase() === 'status'
  ) || columns.find(col => (col.type === 'choice' || col.type === 'dropdown') && col.config?.options)

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

  const renderTaskCard = (task, { isOverlay }) => {
    const titleColumn = columns.find(col => col.type === 'text' && col.visible) || columns[0]
    const visibleColumns = columns.filter(col => col.visible && col.id !== titleColumn?.id && col.type !== 'number').slice(0, 2)

    return (
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
          {!isOverlay && (
            <div className="std-kanban-card-actions d-flex flex-column gap-1">
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
          )}
        </div>
      </Card.Body>
    )
  }

  return (
    <StandardKanbanView
      items={tasks}
      columns={normalizedOptions}
      getItemColumn={(task) => {
        const value = task.values?.[kanbanColumn.id]
        const raw = Array.isArray(value) ? value[0] : value
        const key = raw ? String(raw).trim() : ''
        return normalizedOptions.includes(key) ? key : normalizedOptions[0] || ''
      }}
      onItemMove={(taskId, newColumn) => {
        const task = tasks.find(t => t.id === taskId)
        if (!task) return
        const newValues = {
          ...task.values,
          [kanbanColumn.id]: kanbanColumn.config.multiSelect ? [newColumn] : newColumn
        }
        onTaskUpdate(taskId, { values: newValues })
      }}
      renderCard={renderTaskCard}
      showColumnActions={false}
    />
  )
}
