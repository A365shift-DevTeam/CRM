import { Button } from 'react-bootstrap'
import { FieldRenderer } from './FieldRenderers'
import { Edit, Trash2, Bell } from 'lucide-react'
import StandardListView from '../../components/StandardListView/StandardListView'

export const ListView = ({ tasks, columns, sortBy, sortOrder, onSort, onEdit, onDelete }) => {
  const validColumns = Array.isArray(columns) ? columns.filter(col => col && col.id && col.name) : []

  const renderCell = (task, column) => {
    const value = column.id === 'id' ? task.id : task.values?.[column.id]
    return (
      <FieldRenderer
        column={column}
        value={value}
        isEditing={false}
      />
    )
  }

  const renderActions = (task) => (
    <div className="d-flex gap-1 align-items-center justify-content-center">
      {task.notify && (
        <span className="text-info" title="Notifications enabled" style={{ opacity: 0.8 }}>
          <Bell size={14} fill="currentColor" />
        </span>
      )}
      <button className="slv-action-icon text-primary" onClick={() => onEdit(task)} title="Edit">
        <Edit size={14} />
      </button>
      <button className="slv-action-icon text-danger" onClick={() => onDelete(task.id)} title="Delete">
        <Trash2 size={14} />
      </button>
    </div>
  )

  return (
    <StandardListView
      items={tasks}
      columns={validColumns}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={(columnId) => {
        onSort(columnId)
      }}
      renderCell={renderCell}
      renderActions={renderActions}
      storageKey="todolist"
      emptyMessage="No tasks found. Create a new task to get started."
      itemLabel="tasks"
      rowsPerPageOptions={[5, 10, 25, 50, 100]}
    />
  )
}
