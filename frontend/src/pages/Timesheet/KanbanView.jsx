import { StandardKanbanView, getInitials, getAvatarColor } from '../../components/StandardKanban/StandardKanbanView'
import { Card } from 'react-bootstrap'
import { Edit, Trash2, Eye, Calendar, User, Briefcase } from 'lucide-react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

const renderTimesheetCard = (entry, { isOverlay }, { onEdit, onDelete, onPreview }) => {
  const values = entry.values || {}
  const taskName = values['col-task'] || 'Untitled Task'
  const customer = values['col-customer']
  const user = values['col-name']
  const dateStr = values['col-start-datetime'] ? new Date(values['col-start-datetime']).toLocaleDateString() : ''

  return (
    <Card.Body className="p-3">
      <div className="d-flex justify-content-between align-items-start">
        <div className="flex-grow-1 pe-2">
          <div className="d-flex align-items-center gap-2 mb-2">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
              style={{ width: '24px', height: '24px', fontSize: '10px', flexShrink: 0, backgroundColor: getAvatarColor(taskName) }}
            >
              {getInitials(taskName)}
            </div>
            <div className="std-kanban-card-title fw-semibold text-dark" title={taskName}>
              {taskName}
            </div>
          </div>
          <div className="d-flex flex-column gap-1">
            {customer && (
              <div className="std-kanban-card-field small text-muted text-truncate">
                <Briefcase size={12} className="me-1" />{customer}
              </div>
            )}
            {user && (
              <div className="std-kanban-card-field small text-muted text-truncate">
                <User size={12} className="me-1" />{user}
              </div>
            )}
            {dateStr && (
              <div className="std-kanban-card-field small text-muted text-truncate">
                <Calendar size={12} className="me-1" />{dateStr}
              </div>
            )}
          </div>
        </div>
        {!isOverlay && (
          <div className="std-kanban-card-actions d-flex flex-column gap-1 opacity-50 ms-1">
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
  return (
    <StandardKanbanView
      items={entries}
      columns={columns}
      getItemColumn={(entry) => entry.values?.[groupBy] || 'Unassigned'}
      getItemId={(entry) => entry.id}
      onItemMove={(id, newCol) => onEntryUpdate(id, newCol)}
      renderCard={(entry, opts) => renderTimesheetCard(entry, opts, { onEdit, onDelete, onPreview })}
      onAddColumn={onAddColumn}
      onEditColumn={onEditColumn}
      onDeleteColumn={onDeleteColumn}
    />
  )
}
