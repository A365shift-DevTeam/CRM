import { Button } from 'react-bootstrap'
import { Edit, Trash2, Eye, Paperclip, FileText, Image, File, Clock } from 'lucide-react'
import { formatFileSize, getFileTypeLabel } from '../../services/storageService'
import StandardListView from '../../components/StandardListView/StandardListView'

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
  const visibleColumns = columns.filter(col => col.visible !== false)

  const renderCell = (entry, column) => {
    const value = entry.values?.[column.id]
    return formatValue(value, column)
  }

  const renderActions = (entry) => (
    <div className="d-flex gap-2 align-items-center justify-content-center">
      <button className="slv-action-icon text-info" onClick={() => onPreview(entry)} title="Preview">
        <Eye size={16} />
      </button>
      <button className="slv-action-icon text-primary" onClick={() => onEdit(entry)} title="Edit">
        <Edit size={16} />
      </button>
      <button
        className="slv-action-icon text-danger"
        onClick={() => {
          if (window.confirm('Are you sure you want to delete this entry?')) {
            onDelete(entry.id)
          }
        }}
        title="Delete"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )

  return (
    <StandardListView
      items={entries}
      columns={visibleColumns}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={(columnId) => {
        if (sortBy === columnId) {
          onSort(columnId, sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
          onSort(columnId, 'asc')
        }
      }}
      renderCell={renderCell}
      renderActions={renderActions}
      extraColumns={[
        {
          id: 'duration',
          name: 'Duration',
          width: '90px',
          render: (entry) => (
            <span style={{ fontWeight: 600, color: '#10b981', fontSize: '0.875rem' }}>
              {computeDuration(entry)}
            </span>
          )
        }
      ]}
      storageKey="timesheet"
      emptyMessage="No entries found. Create a new entry to get started."
      itemLabel="entries"
    />
  )
}
