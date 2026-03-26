import React, { useState } from 'react';
import { FaTrash, FaArrowUpFromBracket, FaArrowsRotate } from 'react-icons/fa6';
import { Modal, Button } from 'react-bootstrap';

export default function BulkActionBar({ selectedCount, onBulkDelete, onBulkStatusChange, onBulkExport, statusOptions = [] }) {
    const [showConfirm, setShowConfirm] = useState(false);

    if (selectedCount === 0) return null;

    return (
        <>
            <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', padding: '10px 24px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '16px', animation: 'slideUp 0.2s ease' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>{selectedCount} selected</span>
                <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }} />
                {onBulkDelete && <button onClick={() => setShowConfirm(true)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 500 }}><FaTrash size={12} /> Delete</button>}
                {onBulkStatusChange && statusOptions.length > 0 && (
                    <select onChange={(e) => { if (e.target.value) onBulkStatusChange(e.target.value); e.target.value = ''; }} style={{ background: 'rgba(59,130,246,0.1)', border: 'none', borderRadius: '8px', padding: '6px 12px', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}>
                        <option value="">Change Status</option>
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                )}
                {onBulkExport && <button onClick={onBulkExport} style={{ background: 'rgba(16,185,129,0.1)', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 500 }}><FaArrowUpFromBracket size={12} /> Export CSV</button>}
            </div>
            <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered size="sm">
                <Modal.Body className="text-center py-4">
                    <p style={{ fontWeight: 600, fontSize: '1rem' }}>Delete {selectedCount} items?</p>
                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>This action cannot be undone.</p>
                    <div className="d-flex gap-2 justify-content-center mt-3">
                        <Button variant="secondary" size="sm" onClick={() => setShowConfirm(false)}>Cancel</Button>
                        <Button variant="danger" size="sm" onClick={() => { setShowConfirm(false); onBulkDelete(); }}>Delete</Button>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
}
