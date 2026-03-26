import { Row, Col, Card, Button } from 'react-bootstrap'
import { Edit, Trash2 } from 'lucide-react'
import { FieldRenderer } from './FieldRenderers'

export const GridView = ({ tasks, columns, onEdit, onDelete }) => {
  const visibleColumns = columns.filter(col => col.visible)
  const primaryColumns = visibleColumns.slice(0, 3) // Show first 3 columns prominently
  const secondaryColumns = visibleColumns.slice(3)

  if (tasks.length === 0) {
    return (
      <div className="text-center text-muted py-5">
        No tasks found. Create a new task to get started.
      </div>
    )
  }

  return (
    <Row>
      {tasks.map(task => (
        <Col key={task.id} md={6} lg={4} className="mb-3">
          <Card className="h-100 todo-grid-card">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="flex-grow-1">
                  {primaryColumns.map(column => (
                    <div key={column.id} className="mb-2">
                      <small className="text-muted d-block">{column.name}</small>
                      <div className="fw-semibold">
                        <FieldRenderer
                          column={column}
                          value={task.values?.[column.id]}
                          isEditing={false}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="d-flex gap-1">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => onEdit(task)}
                    title="Edit"
                    className="p-0"
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => onDelete(task.id)}
                    title="Delete"
                    className="p-0 text-danger"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
              {secondaryColumns.length > 0 && (
                <div className="border-top pt-2 mt-2">
                  {secondaryColumns.map(column => (
                    <div key={column.id} className="mb-1 small">
                      <span className="text-muted">{column.name}: </span>
                      <FieldRenderer
                        column={column}
                        value={task.values?.[column.id]}
                        isEditing={false}
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  )
}
