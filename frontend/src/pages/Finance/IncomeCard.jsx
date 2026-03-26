import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, Button } from 'react-bootstrap'
import { Edit, Trash2, Receipt } from 'lucide-react'
import { formatGlobalCurrency } from '../../utils/currencyUtils'

const SortableIncomeCard = ({ income, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: income.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  }

  const formatCurrency = (amount) => {
    return formatGlobalCurrency(amount, 'INR');
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getCategoryColor = (category) => {
    const colors = {
      sales: '#10b981',
      services: '#3b82f6',
      investments: '#8b5cf6',
      other: '#f59e0b'
    }
    return colors[category] || '#6b7280'
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="mb-3 income-card"
      id={income.id}
      {...attributes}
      {...listeners}
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="flex-grow-1">
            <div className="income-amount mb-2" style={{ color: getCategoryColor(income.category) }}>
              {formatCurrency(income.amount)}
            </div>
            <div className="income-description mb-2">
              {income.description || 'No description'}
            </div>
            <div className="income-meta small text-muted mb-2">
              <div>{formatDate(income.date)}</div>
              {income.employeeName && (
                <div>By: {income.employeeName}</div>
              )}
              {income.projectDepartment && (
                <div>{income.projectDepartment}</div>
              )}
            </div>
            {income.receiptUrl && (
              <div className="income-receipt mt-2">
                <Receipt size={14} className="me-1" />
                <small>Receipt attached</small>
              </div>
            )}
          </div>
          <div className="d-flex gap-1 income-actions">
            <Button
              variant="link"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(income)
              }}
              title="Edit"
              className="p-0"
            >
              <Edit size={14} />
            </Button>
            <Button
              variant="link"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                if (window.confirm('Are you sure you want to delete this income?')) {
                  onDelete(income.id)
                }
              }}
              title="Delete"
              className="p-0 text-danger"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}

export default SortableIncomeCard
