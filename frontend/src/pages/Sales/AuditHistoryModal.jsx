import React from 'react'
import { Modal } from 'react-bootstrap'
import { Clock } from 'lucide-react'
import './AuditHistoryModal.css'

export default function AuditHistoryModal({ show, onHide, project }) {
    if (!project) return null

    const history = project.history || []

    const salesHistory = history.filter(h => !h.dept || h.dept === 'sales')
    const deliveryHistory = history.filter(h => h.dept === 'delivery')
    const financeHistory = history.filter(h => h.dept === 'finance')
    const legalHistory = history.filter(h => h.dept === 'legal')

    const columns = [
        { id: 'sales', label: 'Sales History', items: salesHistory, color: '#3b82f6' },
        { id: 'delivery', label: 'Delivery History', items: deliveryHistory, color: '#AF52DE' },
        { id: 'finance', label: 'Finance History', items: financeHistory, color: '#34C759' },
        { id: 'legal', label: 'Legal History', items: legalHistory, color: '#FF9500' }
    ]

    const renderCard = (item, idx, color) => (
        <div key={idx} className="audit-kanban-card" style={{ borderLeft: `3px solid ${color}` }}>
            <div className="audit-kanban-card-header">
                <strong>{item.transition}</strong>
            </div>
            <div className="audit-kanban-card-body">
                {item.description && <div className="audit-desc">{item.description}</div>}
                {item.amount > 0 && <div className="audit-amount">Amt: {item.currency} {item.amount}</div>}
                <div className="audit-date">
                    <Clock size={12} className="me-1"/>
                    {new Date(item.timestamp).toLocaleString()}
                </div>
            </div>
        </div>
    )

    return (
        <Modal show={show} onHide={onHide} fullscreen={true} className="audit-history-modal">
            <Modal.Header closeButton>
                <Modal.Title className="d-flex align-items-center gap-2">
                    <Clock size={18} className="text-muted" />
                    Audit History — {project.clientName}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4" style={{ backgroundColor: '#F8FAFC' }}>
                <div className="audit-kanban-board">
                    {columns.map(col => (
                        <div key={col.id} className="audit-kanban-column">
                            <div className="audit-kanban-column-header" style={{ borderTop: `4px solid ${col.color}` }}>
                                {col.label} <span className="badge rounded-pill bg-light text-dark">{col.items.length}</span>
                            </div>
                            <div className="audit-kanban-column-body">
                                {col.items.length === 0 ? (
                                    <div className="text-center text-muted small py-3">No history</div>
                                ) : (
                                    col.items.map((item, idx) => renderCard(item, idx, col.color))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Modal.Body>
        </Modal>
    )
}
