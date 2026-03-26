import React, { useEffect, useState } from 'react';
import { documentService } from '../services/documentService';
import { FaFile, FaTrash, FaDownload, FaPlus } from 'react-icons/fa6';

function formatSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function DocumentPanel({ entityType, entityId }) {
    const [docs, setDocs] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ fileName: '', fileUrl: '', fileType: '', fileSize: 0 });

    useEffect(() => {
        if (entityType && entityId) loadDocs();
    }, [entityType, entityId]);

    const loadDocs = async () => {
        try { const data = await documentService.getByEntity(entityType, entityId); setDocs(data || []); } catch (e) { console.error(e); }
    };

    const handleAdd = async () => {
        if (!form.fileName || !form.fileUrl) return;
        try { await documentService.create({ ...form, entityType, entityId }); setForm({ fileName: '', fileUrl: '', fileType: '', fileSize: 0 }); setShowForm(false); loadDocs(); } catch (e) { alert(e.message); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this document?')) return;
        try { await documentService.delete(id); setDocs(prev => prev.filter(d => d.id !== id)); } catch (e) { alert(e.message); }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-bold m-0" style={{ fontSize: '0.9rem', color: '#475569' }}>Documents</h6>
                <button onClick={() => setShowForm(!showForm)} style={{ background: 'none', border: '1px dashed #cbd5e1', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#64748b', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><FaPlus size={10} /> Add</button>
            </div>
            {showForm && (
                <div style={{ padding: '10px', marginBottom: '8px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <input className="glass-input mb-2" placeholder="File Name" value={form.fileName} onChange={e => setForm({ ...form, fileName: e.target.value })} style={{ width: '100%' }} />
                    <input className="glass-input mb-2" placeholder="File URL" value={form.fileUrl} onChange={e => setForm({ ...form, fileUrl: e.target.value })} style={{ width: '100%' }} />
                    <div className="d-flex gap-2">
                        <input className="glass-input" placeholder="Type (e.g. pdf)" value={form.fileType} onChange={e => setForm({ ...form, fileType: e.target.value })} style={{ flex: 1 }} />
                        <input className="glass-input" type="number" placeholder="Size (bytes)" value={form.fileSize || ''} onChange={e => setForm({ ...form, fileSize: parseInt(e.target.value) || 0 })} style={{ flex: 1 }} />
                    </div>
                    <div className="d-flex gap-2 mt-2">
                        <button onClick={handleAdd} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '0.8rem' }}>Save</button>
                        <button onClick={() => setShowForm(false)} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 12px', fontSize: '0.8rem', color: '#64748b' }}>Cancel</button>
                    </div>
                </div>
            )}
            {docs.map(d => (
                <div key={d.id} className="d-flex align-items-center justify-content-between py-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <div className="d-flex align-items-center gap-2">
                        <FaFile size={14} style={{ color: '#3b82f6' }} />
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{d.fileName}</div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{formatSize(d.fileSize)} - {new Date(d.createdAt).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        <a href={d.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}><FaDownload size={12} /></a>
                        <button onClick={() => handleDelete(d.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}><FaTrash size={12} /></button>
                    </div>
                </div>
            ))}
            {docs.length === 0 && !showForm && <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', margin: '8px 0' }}>No documents yet.</p>}
        </div>
    );
}
