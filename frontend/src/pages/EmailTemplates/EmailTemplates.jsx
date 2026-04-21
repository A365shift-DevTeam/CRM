import React, { useEffect, useState } from 'react';
import { emailTemplateService } from '../../services/emailTemplateService';
import { FaPen, FaTrash } from 'react-icons/fa6';
import { Plus } from 'lucide-react';
import { Modal, Form, Button } from 'react-bootstrap';
import PageToolbar from '../../components/PageToolbar/PageToolbar';

const emptyForm = { name: '', subject: '', body: '', variables: '' };

export default function EmailTemplates() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { loadTemplates(); }, []);

    const loadTemplates = async () => {
        try { const data = await emailTemplateService.getAll(); setTemplates(data || []); } catch (e) { console.error(e); }
        setLoading(false);
    };

    const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
    const openEdit = (t) => { setEditing(t); setForm({ name: t.name, subject: t.subject, body: t.body, variables: t.variables || '' }); setShowModal(true); };

    const handleSave = async () => {
        try {
            if (editing) { await emailTemplateService.update(editing.id, form); }
            else { await emailTemplateService.create(form); }
            setShowModal(false); loadTemplates();
        } catch (e) { alert(e.message); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this template?')) return;
        try { await emailTemplateService.delete(id); setTemplates(prev => prev.filter(t => t.id !== id)); } catch (e) { alert(e.message); }
    };

    return (
        <div style={{ padding: '0 16px 24px' }}>
            <PageToolbar
                title="Email Templates"
                itemCount={templates.length}
                actions={[{ label: 'New Template', icon: <Plus size={16} />, variant: 'primary', onClick: openCreate }]}
            />
            {loading ? <div className="text-center p-4"><div className="spinner-border text-primary" /></div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                    {templates.length === 0 ? <p className="text-muted">No templates yet. Create one to get started.</p> :
                        templates.map(t => (
                            <div key={t.id} style={{ background: '#FFFFFF', border: '1px solid #E1E8F4', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' }}>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <h6 className="fw-bold m-0" style={{ color: '#0f172a' }}>{t.name}</h6>
                                    <div className="d-flex gap-1">
                                        <button className="action-icon-btn text-info" style={{ opacity: 1 }} title="Edit" onClick={() => openEdit(t)}><FaPen size={12} /></button>
                                        <button className="action-icon-btn text-danger" style={{ opacity: 1 }} title="Delete" onClick={() => handleDelete(t.id)}><FaTrash size={12} /></button>
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: '#475569', margin: 0 }}><strong>Subject:</strong> {t.subject}</p>
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.body}</p>
                            </div>
                        ))}
                </div>
            )}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton><Modal.Title style={{ fontSize: '1rem' }}>{editing ? 'Edit Template' : 'New Template'}</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3"><Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Name</Form.Label><Form.Control className="glass-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Form.Group>
                    <Form.Group className="mb-3"><Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Subject</Form.Label><Form.Control className="glass-input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></Form.Group>
                    <Form.Group className="mb-3"><Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Body</Form.Label><Form.Control as="textarea" rows={6} className="glass-input" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} /></Form.Group>
                    <Form.Group className="mb-3"><Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Variables (comma-separated)</Form.Label><Form.Control className="glass-input" placeholder="companyName, contactName" value={form.variables} onChange={e => setForm({ ...form, variables: e.target.value })} /></Form.Group>
                </Modal.Body>
                <Modal.Footer><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button onClick={handleSave} style={{ background: 'var(--button-brand, #5286A5)', border: 'none' }}>Save</Button></Modal.Footer>
            </Modal>
        </div>
    );
}
