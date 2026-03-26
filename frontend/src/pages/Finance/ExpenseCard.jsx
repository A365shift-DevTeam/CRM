import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, Button } from 'react-bootstrap'
import { Edit, Trash2, Receipt } from 'lucide-react'
import { formatGlobalCurrency } from '../../utils/currencyUtils'

const SortableExpenseCard = ({ expense, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: expense.id })

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
      transport: '#3b82f6',
      food: '#f59e0b',
      accommodation: '#8b5cf6',
      allowances: '#10b981'
    }
    return colors[category] || '#6b7280'
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="mb-3 expense-card"
      id={expense.id}
      {...attributes}
      {...listeners}
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="flex-grow-1">
            <div className="expense-amount mb-2" style={{ color: getCategoryColor(expense.category) }}>
              {formatCurrency(expense.amount)}
            </div>
            <div className="expense-description mb-2">
              {expense.description || 'No description'}
            </div>
            <div className="expense-meta small text-muted mb-2">
              <div>{formatDate(expense.date)}</div>
              {expense.employeeName && (
                <div>By: {expense.employeeName}</div>
              )}
              {expense.projectDepartment && (
                <div>{expense.projectDepartment}</div>
              )}
            </div>
            {expense.receiptUrl && (
              <div className="expense-receipt mt-2">
                <Receipt size={14} className="me-1" />
                <small>Receipt attached</small>
              </div>
            )}
          </div>
          <div className="d-flex gap-1 expense-actions">
            <Button
              variant="link"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(expense)
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
                if (window.confirm('Are you sure you want to delete this expense?')) {
                  onDelete(expense.id)
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

export default SortableExpenseCard
