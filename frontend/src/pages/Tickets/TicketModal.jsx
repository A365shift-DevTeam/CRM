import React, { useState, useEffect, useRef } from 'react';
import { Modal } from 'react-bootstrap';
import { Send, Sparkles, X } from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { useToast } from '../../components/Toast/ToastContext';

const CATEGORIES = [
  { value: 'Technical', label: '🔧 Technical Issue', desc: 'Software bugs, errors, or not working as expected' },
  { value: 'Billing', label: '💳 Billing', desc: 'Invoices, payments, subscription questions' },
  { value: 'Account Access', label: '🔐 Account Access', desc: 'Login problems, permissions, password reset' },
  { value: 'Feature Request', label: '💡 Feature Request', desc: 'Suggest new features or improvements' },
  { value: 'General Enquiry', label: '💬 General Enquiry', desc: 'Any other question or feedback' },
  { value: 'Other', label: '📋 Other', desc: 'Something else not listed above' },
];

const PRIORITY_OPTIONS = [
  { value: 'Low', label: 'Low', desc: 'Not urgent, can wait', color: '#94A3B8' },
  { value: 'Medium', label: 'Medium', desc: 'Affects my work but has a workaround', color: '#4361EE' },
  { value: 'High', label: 'High', desc: 'Significantly impacting my work', color: '#F59E0B' },
  { value: 'Critical', label: 'Critical', desc: 'Completely blocked, urgent', color: '#F43F5E' },
];

const STATUS_COLOR = {
  'Open': { bg: '#EFF6FF', text: '#3B82F6', border: '#BFDBFE' },
  'In Progress': { bg: '#F5F3FF', text: '#8B5CF6', border: '#DDD6FE' },
  'Pending': { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  'Resolved': { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  'Closed': { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0' },
};

export default function TicketModal({ show, onHide, editing, onSaved, currentUserName }) {
  const toast = useToast();
  const threadRef = useRef(null);

  // New ticket form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Existing ticket view state
  const [comments, setComments] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    if (show) {
      if (editing) {
        setComments(editing.comments ?? []);
      } else {
        setTitle(''); setCategory(''); setPriority('Medium'); setDescription('');
      }
      setReplyText('');
    }
  }, [editing, show]);

  // Scroll to bottom of thread when comments change
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [comments]);

  const handleCreate = async () => {
    if (!title.trim()) { toast.error('Please enter a title for your issue.'); return; }
    if (!description.trim()) { toast.error('Please describe your issue.'); return; }
    if (!category) { toast.error('Please select a category.'); return; }
    setSubmitting(true);
    try {
      await onSaved({ title, category, priority, description, type: 'Client Support', status: 'Open' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !editing) return;
    setSendingReply(true);
    try {
      const newComment = await ticketService.addComment(editing.id, {
        comment: replyText,
        isInternal: false,
        authorName: currentUserName || 'Me',
      });
      setComments(prev => [...prev, newComment]);
      setReplyText('');
    } catch (e) {
      toast.error(e.message || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const statusStyle = editing ? (STATUS_COLOR[editing.status] ?? STATUS_COLOR['Open']) : null;

  return (
    <Modal show={show} onHide={onHide} centered size="lg" contentClassName="ticket-modal-content">
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh', borderRadius: 16, overflow: 'hidden', background: '#fff' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              {editing ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4361EE', fontSize: 13 }}>{editing.ticketNumber}</span>
                    <span style={{
                      padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                      background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}`
                    }}>{editing.status}</span>
                    {editing.isAiGenerated && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600, background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.2)' }}>
                        <Sparkles size={9} />AI
                      </span>
                    )}
                  </div>
                  <h5 style={{ margin: 0, fontWeight: 700, color: '#0F172A', fontSize: 15, lineHeight: 1.4 }}>{editing.title}</h5>
                  <div style={{ marginTop: 4, fontSize: 12, color: '#94A3B8' }}>
                    {editing.category && <span style={{ marginRight: 12 }}>Category: <strong style={{ color: '#64748B' }}>{editing.category}</strong></span>}
                    <span>Raised: <strong style={{ color: '#64748B' }}>{new Date(editing.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></span>
                  </div>
                </>
              ) : (
                <h5 style={{ margin: 0, fontWeight: 700, color: '#0F172A', fontSize: 16 }}>Raise a Support Ticket</h5>
              )}
            </div>
            <button onClick={onHide} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4, borderRadius: 6, display: 'flex' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        {editing ? (
          /* ── Existing ticket: conversation thread ── */
          <>
            <div ref={threadRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Original description bubble */}
              {editing.description && (
                <div style={{ display: 'flex', flexDirection: 'row', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#4361EE', fontSize: 13, flexShrink: 0 }}>
                    {(currentUserName || 'U')[0].toUpperCase()}
                  </div>
                  <div style={{ maxWidth: '78%' }}>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>
                      <strong style={{ color: '#64748B' }}>{currentUserName || 'You'}</strong> · {new Date(editing.createdAt).toLocaleString()}
                    </div>
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px 12px 12px 12px', padding: '10px 14px', fontSize: 13.5, color: '#0F172A', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {editing.description}
                    </div>
                  </div>
                </div>
              )}

              {/* Comment thread */}
              {comments.length === 0 && !editing.description && (
                <div style={{ textAlign: 'center', color: '#94A3B8', padding: '24px 0', fontSize: 13 }}>No replies yet — our team will respond shortly.</div>
              )}
              {comments.map(c => {
                const isMe = c.authorName === currentUserName || c.authorUserId === editing?.userId;
                const isAdmin = !isMe;
                if (c.isInternal) return null; // hide internal notes from users
                return (
                  <div key={c.id} style={{ display: 'flex', flexDirection: isAdmin ? 'row' : 'row-reverse', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff', background: isAdmin ? '#10b981' : '#4361EE' }}>
                      {c.authorName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div style={{ maxWidth: '78%' }}>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4, textAlign: isAdmin ? 'left' : 'right' }}>
                        <strong style={{ color: isAdmin ? '#10b981' : '#4361EE' }}>{isAdmin ? c.authorName + ' (Support)' : 'You'}</strong> · {new Date(c.createdAt).toLocaleString()}
                      </div>
                      <div style={{
                        background: isAdmin ? '#F0FDF4' : '#EEF2FF',
                        border: `1px solid ${isAdmin ? '#BBF7D0' : '#C7D7FD'}`,
                        borderRadius: isAdmin ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                        padding: '10px 14px', fontSize: 13.5, color: '#0F172A', lineHeight: 1.6, whiteSpace: 'pre-wrap'
                      }}>
                        {c.comment}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply box — only if not closed/resolved */}
            {!['Closed'].includes(editing.status) && (
              <div style={{ padding: '14px 24px', borderTop: '1px solid #F1F5F9', flexShrink: 0, background: '#FAFBFF' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#4361EE', fontSize: 13, flexShrink: 0 }}>
                    {(currentUserName || 'U')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <textarea
                      rows={2}
                      style={{ width: '100%', borderRadius: 10, border: '1.5px solid #E2E8F0', padding: '9px 12px', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', background: '#fff', transition: 'border-color 0.2s' }}
                      placeholder="Add a reply… (Ctrl+Enter to send)"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onFocus={e => { e.target.style.borderColor = '#4361EE'; }}
                      onBlur={e => { e.target.style.borderColor = '#E2E8F0'; }}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSendReply(); }}
                    />
                  </div>
                  <button
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyText.trim()}
                    style={{ height: 38, padding: '0 16px', background: '#4361EE', color: '#fff', border: 'none', borderRadius: 10, cursor: sendingReply || !replyText.trim() ? 'not-allowed' : 'pointer', opacity: !replyText.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, flexShrink: 0 }}
                  >
                    <Send size={13} />
                    {sendingReply ? '…' : 'Send'}
                  </button>
                </div>
              </div>
            )}
            {editing.status === 'Closed' && (
              <div style={{ padding: '12px 24px', borderTop: '1px solid #F1F5F9', textAlign: 'center', fontSize: 12, color: '#94A3B8' }}>
                This ticket is closed. Raise a new ticket if you need further help.
              </div>
            )}
          </>
        ) : (
          /* ── New ticket form ── */
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

            {/* Category picker */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#334155', marginBottom: 10 }}>
                What do you need help with? <span style={{ color: '#F43F5E' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    style={{
                      textAlign: 'left', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                      border: `1.5px solid ${category === cat.value ? '#4361EE' : '#E2E8F0'}`,
                      background: category === cat.value ? '#EEF2FF' : '#F8FAFC',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13, color: category === cat.value ? '#4361EE' : '#0F172A' }}>{cat.label}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{cat.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#334155', marginBottom: 6 }}>
                Subject <span style={{ color: '#F43F5E' }}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Brief summary of your issue"
                style={{ width: '100%', padding: '9px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13.5, outline: 'none', fontFamily: 'inherit', background: '#F8FAFC', transition: 'border-color 0.2s' }}
                onFocus={e => { e.target.style.borderColor = '#4361EE'; e.target.style.background = '#fff'; }}
                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC'; }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#334155', marginBottom: 6 }}>
                Describe your issue <span style={{ color: '#F43F5E' }}>*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Please describe your issue in as much detail as possible. Include what you were doing, what you expected, and what happened instead."
                style={{ width: '100%', padding: '9px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13.5, resize: 'vertical', outline: 'none', fontFamily: 'inherit', background: '#F8FAFC', lineHeight: 1.6, transition: 'border-color 0.2s' }}
                onFocus={e => { e.target.style.borderColor = '#4361EE'; e.target.style.background = '#fff'; }}
                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC'; }}
              />
            </div>

            {/* Priority */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: '#334155', marginBottom: 8 }}>Priority</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {PRIORITY_OPTIONS.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    title={p.desc}
                    style={{
                      flex: 1, padding: '7px 6px', borderRadius: 8, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                      border: `1.5px solid ${priority === p.value ? p.color : '#E2E8F0'}`,
                      background: priority === p.value ? `${p.color}14` : '#F8FAFC',
                      fontWeight: 600, fontSize: 12, color: priority === p.value ? p.color : '#94A3B8',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 5 }}>
                {PRIORITY_OPTIONS.find(p => p.value === priority)?.desc}
              </div>
            </div>
          </div>
        )}

        {/* Footer — only for new ticket */}
        {!editing && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
            <button onClick={onHide} style={{ padding: '9px 20px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={submitting}
              style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: '#4361EE', color: '#fff', fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, boxShadow: '0 4px 14px rgba(67,97,238,0.35)' }}
            >
              {submitting ? 'Submitting…' : 'Submit Ticket'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
