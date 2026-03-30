import { StandardKanbanView, getInitials, getAvatarColor } from '../../../components/StandardKanban/StandardKanbanView'
import { Card } from 'react-bootstrap'
import { Edit, Trash2, Mail, Building } from 'lucide-react'

export const KanbanView = ({
  contacts,
  columns,
  onContactUpdate,
  onEdit,
  onDelete,
  onPreview,
  onAddColumn,
  onEditColumn,
  onDeleteColumn
}) => {
  const renderContactCard = (contact, { isOverlay }) => (
    <Card.Body style={{ padding: '14px' }}>
      <div className="d-flex justify-content-between align-items-start mb-2">
        <div className="d-flex align-items-center gap-2">
          <div
            className="std-kanban-avatar"
            style={{ backgroundColor: getAvatarColor(contact.name) }}
          >
            {getInitials(contact.name)}
          </div>
          <div>
            <div className="std-kanban-card-title" title={contact.name}>
              {contact.name}
            </div>
          </div>
        </div>

        {!isOverlay && onEdit && onDelete && (
          <div className="std-kanban-card-actions">
            <button
              className="btn btn-link p-0 text-muted"
              onClick={(e) => { e.stopPropagation(); onEdit(contact) }}
            >
              <Edit size={14} />
            </button>
            <button
              className="btn btn-link p-0 text-muted"
              onClick={(e) => { e.stopPropagation(); confirm('Delete?') && onDelete(contact.id) }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="d-flex flex-column gap-1 mt-2">
        <div className="std-kanban-card-field">
          <span className="fw-medium text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Type: </span>
          <span style={{ fontSize: '12px' }}>{contact.type || 'Contact'}</span>
        </div>

        {contact.company && (
          <div className="std-kanban-card-field d-flex align-items-center gap-1">
            <Building size={12} className="text-secondary opacity-75" />
            <span>{contact.company}</span>
          </div>
        )}

        {contact.email && (
          <div className="std-kanban-card-field text-truncate d-flex align-items-center gap-1">
            <Mail size={12} className="text-secondary opacity-75" />
            <span>{contact.email}</span>
          </div>
        )}
      </div>
    </Card.Body>
  )

  return (
    <StandardKanbanView
      items={contacts}
      columns={columns}
      getItemColumn={(c) => c.status || columns[0]}
      getItemId={(c) => c.id}
      onItemMove={(id, newCol) => onContactUpdate(id, { status: newCol })}
      renderCard={renderContactCard}
      onAddColumn={onAddColumn}
      onEditColumn={onEditColumn}
      onDeleteColumn={onDeleteColumn}
    />
  )
}
