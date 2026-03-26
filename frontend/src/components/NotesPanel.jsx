import React, { useEffect, useState } from 'react';
import { noteService } from '../services/noteService';
import { FaPen, FaTrash, FaPlus } from 'react-icons/fa6';

export default function NotesPanel({ entityType, entityId }) {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        if (entityType && entityId) loadNotes();
    }, [entityType, entityId]);

    const loadNotes = async () => {
        try { const data = await noteService.getByEntity(entityType, entityId); setNotes(data || []); } catch (e) { console.error(e); }
    };

    const addNote = async () => {
        if (!newNote.trim()) return;
        try { await noteService.create({ entityType, entityId, content: newNote }); setNewNote(''); loadNotes(); } catch (e) { alert(e.message); }
    };

    const saveEdit = async (id) => {
        try { await noteService.update(id, { content: editContent }); setEditingId(null); loadNotes(); } catch (e) { alert(e.message); }
    };

    const deleteNote = async (id) => {
        if (!window.confirm('Delete this note?')) return;
        try { await noteService.delete(id); setNotes(prev => prev.filter(n => n.id !== id)); } catch (e) { alert(e.message); }
    };

    return (
        <div>
            <h6 className="fw-bold mb-2" style={{ fontSize: '0.9rem', color: '#475569' }}>Notes</h6>
            <div className="d-flex gap-2 mb-3">
                <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note..." className="glass-input" rows={2} style={{ flex: 1, resize: 'none' }} />
                <button onClick={addNote} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', alignSelf: 'flex-end' }}><FaPlus size={12} /></button>
            </div>
            {notes.map(n => (
                <div key={n.id} style={{ padding: '10px 12px', marginBottom: '8px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {editingId === n.id ? (
                        <div>
                            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="glass-input" rows={2} style={{ width: '100%', resize: 'none', marginBottom: '8px' }} />
                            <div className="d-flex gap-2">
                                <button onClick={() => saveEdit(n.id)} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 12px', fontSize: '0.8rem' }}>Save</button>
                                <button onClick={() => setEditingId(null)} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 12px', fontSize: '0.8rem', color: '#64748b' }}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#0f172a' }}>{n.content}</p>
                            <div className="d-flex justify-content-between align-items-center mt-1">
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(n.createdAt).toLocaleString()}</span>
                                <div className="d-flex gap-2">
                                    <button onClick={() => { setEditingId(n.id); setEditContent(n.content); }} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: 0 }}><FaPen size={11} /></button>
                                    <button onClick={() => deleteNote(n.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}><FaTrash size={11} /></button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
            {notes.length === 0 && <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>No notes yet.</p>}
        </div>
    );
}
