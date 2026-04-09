import { Eye, Edit, Trash2, ArrowUpRight, Building } from 'lucide-react'
import StandardListView from '../../../components/StandardListView/StandardListView'

export const ListView = ({ contacts, columns: columnsProp, sortBy, sortOrder, onSort, onEdit, onDelete, onPreview, onConvertToSales }) => {
  const defaultColumns = [
    { id: 'name', name: 'Name' },
    { id: 'jobTitle', name: 'Job Title' },
    { id: 'phone', name: 'Phone' },
    { id: 'company', name: 'Company' },
    { id: 'location', name: 'Location' },
    { id: 'address', name: 'Address' },
    { id: 'type', name: 'Entity Type' },
    { id: 'status', name: 'Status' }
  ]

  const columns = columnsProp
    ? columnsProp.filter(c => c.visible !== false).map(c => ({ id: c.id, name: c.name }))
    : defaultColumns

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active': return 'badge-enterprise badge-green'
      case 'Lead': return 'badge-enterprise badge-blue'
      case 'Customer': return 'badge-enterprise badge-teal'
      case 'Inactive': return 'badge-enterprise badge-gray'
      default: return 'badge-enterprise badge-gray'
    }
  }

  const getTypeBadgeClass = (type) => {
    return type === 'Company' ? 'badge-enterprise badge-blue' : 'badge-enterprise badge-gray'
  }

  const renderCell = (contact, column) => {
    switch (column.id) {
      case 'name':
        return (
          <div className="contact-cell-primary">
            <span className="contact-name">{contact.name || '-'}</span>
            <span className="contact-subtext">
              <Building size={12} /> {contact.company || 'No Company'}
            </span>
          </div>
        )
      case 'jobTitle':
        return (
          <div className="contact-cell-primary">
            <span className="fw-medium text-dark">{contact.jobTitle || 'Unknown Role'}</span>
            <span className="contact-subtext">{contact.department || contact.company}</span>
          </div>
        )
      case 'phone':
        return <span className="fw-medium text-secondary">{contact.phone || '-'}</span>
      case 'company':
        return <span className="fw-medium text-dark">{contact.company || '-'}</span>
      case 'location':
        return <span className="text-secondary">{contact.location || '-'}</span>
      case 'address':
        return <span className="text-secondary">{contact.address || '-'}</span>
      case 'type':
        return <span className={getTypeBadgeClass(contact.type || 'Company')}>{contact.type || 'Company'}</span>
      case 'status':
        return <span className={getStatusBadgeClass(contact.status)}>{contact.status || '-'}</span>
      default:
        return <span className="text-secondary">{contact[column.id] || '-'}</span>
    }
  }

  const renderActions = (contact) => (
    <div className="d-flex gap-3 justify-content-center">
      <div className="slv-action-icon text-primary" onClick={() => onPreview(contact)} style={{ cursor: 'pointer' }}>
        <Eye size={18} />
      </div>
      <div className="slv-action-icon text-info" onClick={() => onEdit(contact)} style={{ cursor: 'pointer' }}>
        <Edit size={18} />
      </div>
      <div className="slv-action-icon text-danger" onClick={() => {
        if (window.confirm('Are you sure you want to delete this contact?')) {
          onDelete(contact.id)
        }
      }} style={{ cursor: 'pointer' }}>
        <Trash2 size={18} />
      </div>
      <div className="slv-action-icon text-success" onClick={() => onConvertToSales(contact)} style={{ cursor: 'pointer' }} title="Convert to Sales Client">
        <ArrowUpRight size={18} />
      </div>
    </div>
  )

  return (
    <StandardListView
      items={contacts}
      columns={columns}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      renderCell={renderCell}
      renderActions={renderActions}
      storageKey="contacts"
      emptyMessage="No contacts found. Create a new contact to get started."
      itemLabel="contacts"
    />
  )
}
