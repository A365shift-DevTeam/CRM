import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Nav, Tab } from 'react-bootstrap';
import { Send, Lock } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import AuditPanel from '../../components/AuditPanel/AuditPanel';
import { ticketService } from '../../services/ticketService';

const TYPES = ['Client Support', 'Bug', 'Internal Task'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'];
const CATEGORIES = ['Billing', 'Technical', 'Feature Request', 'HR', 'Legal', 'Other'];

const emptyForm = {
  title: '', description: '', type: 'Internal Task', priority: 'Medium',
  status: 'Open', category: '', contactId: '', companyId: '', projectId: '',
  leadId: '', assignedToUserId: '', assignedToName: '', dueDate: '',
};

const PRIORITY_COLOR = { Critical: '#F43F5E', High: '#F59E0B', Medium: '#4361EE', Low: '#94A3B8' };

export default function TicketModal({ show, onHide, editing, onSaved, currentUserName }) {
  const [form, setForm] = useState(emptyForm);
  const [tab, setTab] = useState('details');
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title ?? '',
        description: editing.description ?? '',
        type: editing.type ?? 'Internal Task',
        priority: editing.priority ?? 'Medium',
        status: editing.status ?? 'Open',
        category: editing.category ?? '',
        contactId: editing.contactId ?? '',
        companyId: editing.companyId ?? '',
        projectId: editing.projectId ?? '',
        leadId: editing.leadId ?? '',
        assignedToUserId: editing.assignedToUserId ?? '',
        assignedToName: editing.assignedToName ?? '',
        dueDate: editing.dueDate ? editing.dueDate.split('T')[0] : '',
      });
      setComments(editing.comments ?? []);
    } else {
      setForm(emptyForm);
      setComments([]);
    }
    setTab('details');
    setCommentText('');
  }, [editing, show]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.title.trim()) { alert('Title is required'); return; }
    const payload = {
      ...form,
      contactId: form.contactId ? parseInt(form.contactId) : null,
      companyId: form.companyId ? parseInt(form.companyId) : null,
      projectId: form.projectId ? parseInt(form.projectId) : null,
      leadId: form.leadId ? parseInt(form.leadId) : null,
      assignedToUserId: form.assignedToUserId ? parseInt(form.assignedToUserId) : null,
      dueDate: form.dueDate || null,
    };
    onSaved(payload);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !editing) return;
    setSubmittingComment(true);
    try {
      const newComment = await ticketService.addComment(editing.id, {
        comment: commentText,
        isInternal,
        authorName: currentUserName ?? 'Me',
      });
      setComments(prev => [...prev, newComment]);
      setCommentText('');
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <div>
          <Modal.Title style={{ fontSize: '1rem', fontWeight: 700 }}>
            {editing ? editing.ticketNumber : 'New Ticket'}
          </Modal.Title>
          {editing?.isAiGenerated && (
            <span className="ai-badge" style={{ fontSize: 10.5, marginTop: 4, display: 'inline-flex' }}>
              <Sparkles size={10} />AI Generated · {Math.round((editing.aiConfidence ?? 0) * 100)}%
            </span>
          )}
        </div>
      </Modal.Header>

      <Tab.Container activeKey={tab} onSelect={setTab}>
        <Modal.Body style={{ padding: 0 }}>
          <Nav variant="tabs" style={{ padding: '0 20px', borderBottom: '1px solid #E1E8F4', background: '#F8FAFC' }}>
            <Nav.Item><Nav.Link eventKey="details" style={{ fontSize: 13 }}>Details</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="comments" style={{ fontSize: 13 }}>Comments {comments.length > 0 ? `(${comments.length})` : ''}</Nav.Link></Nav.Item>
            {editing && <Nav.Item><Nav.Link eventKey="history" style={{ fontSize: 13 }}>History</Nav.Link></Nav.Item>}
          </Nav>

          <div style={{ padding: 20 }}>
            <Tab.Content>
              {/* Details Tab */}
              <Tab.Pane eventKey="details">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Title *</Form.Label>
                  <Form.Control className="glass-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Brief description of the issue" />
                </Form.Group>
                <div className="row g-3 mb-3">
                  <div className="col-4">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Type</Form.Label>
                    <Form.Select className="glass-input" value={form.type} onChange={e => set('type', e.target.value)}>
                      {TYPES.map(t => <option key={t}>{t}</option>)}
                    </Form.Select>
                  </div>
                  <div className="col-4">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Priority</Form.Label>
                    <Form.Select className="glass-input" value={form.priority} onChange={e => set('priority', e.target.value)}
                      style={{ borderLeft: `3px solid ${PRIORITY_COLOR[form.priority]}` }}>
                      {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                    </Form.Select>
                  </div>
                  <div className="col-4">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Status</Form.Label>
                    <Form.Select className="glass-input" value={form.status} onChange={e => set('status', e.target.value)}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </Form.Select>
                  </div>
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Category</Form.Label>
                    <Form.Select className="glass-input" value={form.category} onChange={e => set('category', e.target.value)}>
                      <option value="">— None —</option>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </Form.Select>
                  </div>
                  <div className="col-6">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Due Date</Form.Label>
                    <Form.Control className="glass-input" type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
                  </div>
                </div>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Description</Form.Label>
                  <Form.Control as="textarea" rows={4} className="glass-input" value={form.description} onChange={e => set('description', e.target.value)} />
                </Form.Group>
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Assigned To</Form.Label>
                    <Form.Control className="glass-input" value={form.assignedToName} onChange={e => set('assignedToName', e.target.value)} placeholder="Name" />
                  </div>
                  <div className="col-6">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Contact ID</Form.Label>
                    <Form.Control className="glass-input" type="number" value={form.contactId} onChange={e => set('contactId', e.target.value)} placeholder="Optional" />
                  </div>
                </div>
                <div className="row g-3">
                  <div className="col-4">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Company ID</Form.Label>
                    <Form.Control className="glass-input" type="number" value={form.companyId} onChange={e => set('companyId', e.target.value)} placeholder="Optional" />
                  </div>
                  <div className="col-4">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Project ID</Form.Label>
                    <Form.Control className="glass-input" type="number" value={form.projectId} onChange={e => set('projectId', e.target.value)} placeholder="Optional" />
                  </div>
                  <div className="col-4">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Lead ID</Form.Label>
                    <Form.Control className="glass-input" type="number" value={form.leadId} onChange={e => set('leadId', e.target.value)} placeholder="Optional" />
                  </div>
                </div>
              </Tab.Pane>

              {/* Comments Tab */}
              <Tab.Pane eventKey="comments">
                <div className="comment-thread mb-3">
                  {comments.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94A3B8', padding: '20px 0', fontSize: 13 }}>No comments yet.</div>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className={`comment-item ${c.isInternal ? 'internal' : ''}`}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="comment-author">{c.authorName}</span>
                            {c.isInternal && <span className="comment-internal-label"><Lock size={9} /> Internal</span>}
                          </div>
                          <span className="comment-time">{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="comment-body">{c.comment}</div>
                      </div>
                    ))
                  )}
                </div>

                {editing && (
                  <div style={{ borderTop: '1px solid #E1E8F4', paddingTop: 12 }}>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      className="glass-input mb-2"
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder="Add a comment…"
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Form.Check
                        type="switch"
                        id="internal-switch"
                        label={<span style={{ fontSize: 12 }}>Internal note</span>}
                        checked={isInternal}
                        onChange={e => setIsInternal(e.target.checked)}
                      />
                      <button
                        className="pt-action-btn pt-action-primary"
                        style={{ padding: '6px 14px', fontSize: 12 }}
                        onClick={handleAddComment}
                        disabled={submittingComment || !commentText.trim()}
                      >
                        <Send size={12} style={{ marginRight: 4 }} />
                        {submittingComment ? 'Sending…' : 'Send'}
                      </button>
                    </div>
                  </div>
                )}
              </Tab.Pane>

              {/* History Tab */}
              {editing && (
                <Tab.Pane eventKey="history">
                  <AuditPanel entityName="Ticket" entityId={editing?.id} />
                </Tab.Pane>
              )}
            </Tab.Content>
          </div>
        </Modal.Body>
      </Tab.Container>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button onClick={handleSave} style={{ background: '#4361EE', border: 'none' }}>
          {editing ? 'Save Changes' : 'Create Ticket'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
