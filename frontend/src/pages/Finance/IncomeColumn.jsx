import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Badge } from 'react-bootstrap'
import SortableIncomeCard from './IncomeCard'

const IncomeColumn = ({ category, incomes, stats, onEdit, onDelete, formatCurrency, index }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: category.id
  })

  return (
    <div
      className="finance-column"
      id={category.id}
      data-category={category.id}
      style={{
        borderTopColor: category.color,
        backgroundColor: isOver ? 'rgba(16, 185, 129, 0.05)' : undefined,
        borderColor: isOver ? 'rgba(16, 185, 129, 0.3)' : undefined
      }}
    >
      <div className="finance-column-header">
        <div className="d-flex align-items-center gap-2">
          <span
            className="category-dot"
            style={{ backgroundColor: category.color }}
          />
          <h6 className="mb-0">{category.label}</h6>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="finance-column-total-header">
            {formatCurrency(stats.total)}
          </span>
          <span className="serial-number-badge">{index + 1}</span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className="finance-column-body"
        id={`column-body-${category.id}`}
      >
        <SortableContext
          id={category.id}
          items={incomes.map(inc => inc.id)}
          strategy={verticalListSortingStrategy}
        >
          {incomes.map(income => (
            <SortableIncomeCard
              key={income.id}
              income={income}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
        {incomes.length === 0 && (
          <div className="text-center text-muted py-4 small">
            No income
          </div>
        )}
      </div>
    </div>
  )
}

export default IncomeColumn
