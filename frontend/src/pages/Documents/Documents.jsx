import React, { useEffect, useState, useMemo } from 'react';
import { documentService } from '../../services/documentService';
import { FaFile, FaTrash, FaDownload } from 'react-icons/fa6';

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function Documents() {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('All');

    useEffect(() => {
        (async () => {
            try { const data = await documentService.getAll(); setDocs(data || []); } catch (e) { console.error(e); }
            setLoading(false);
        })();
    }, []);

    const filtered = useMemo(() => {
        if (filterType === 'All') return docs;
        return docs.filter(d => d.entityType === filterType);
    }, [docs, filterType]);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this document?')) return;
        try { await documentService.delete(id); setDocs(prev => prev.filter(d => d.id !== id)); } catch (e) { alert(e.message); }
    };

    const entityTypes = ['All', ...new Set(docs.map(d => d.entityType))];

    return (
        <div style={{ padding: '20px' }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                    <FaFile size={20} style={{ color: '#3b82f6' }} />
                    <h4 className="m-0 fw-bold" style={{ color: '#0f172a' }}>Documents</h4>
                </div>
                <select className="glass-input" style={{ width: 'auto' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
                    {entityTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            {loading ? <div className="text-center p-4"><div className="spinner-border text-primary" /></div> : (
                <table className="table" style={{ fontSize: '0.875rem' }}>
                    <thead><tr style={{ color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                        <th>File Name</th><th>Entity</th><th>Type</th><th>Size</th><th>Date</th><th>Actions</th>
                    </tr></thead>
                    <tbody>
                        {filtered.length === 0 ? <tr><td colSpan={6} className="text-center text-muted py-4">No documents found.</td></tr> :
                            filtered.map(doc => (
                                <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ fontWeight: 500 }}>{doc.fileName}</td>
                                    <td>{doc.entityType} #{doc.entityId}</td>
                                    <td style={{ color: '#64748b' }}>{doc.fileType || '—'}</td>
                                    <td style={{ color: '#64748b' }}>{formatSize(doc.fileSize)}</td>
                                    <td style={{ color: '#64748b' }}>{new Date(doc.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <a href={doc.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}><FaDownload /></a>
                                            <button onClick={() => handleDelete(doc.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><FaTrash /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
