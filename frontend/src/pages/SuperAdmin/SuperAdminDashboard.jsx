import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { superAdminService } from '../../services/organizationService';
import './SuperAdminDashboard.css';

import {
  Building2, Users, ShieldCheck, LogOut, Plus, RefreshCw,
  Search, X, ChevronRight, UserPlus, ToggleLeft, ToggleRight,
  Clock, Calendar, Hash, Mail, Eye, AlertCircle, CheckCircle,
  Pause, Play, Globe, Sliders, Ticket, MessageSquare, Send,
  Shield, Ban, UserCheck, ChevronDown, ArrowUpRight, Filter,
  Inbox, CircleDot, CheckCheck, AlertTriangle, Zap, Pencil, Trash2
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────
const ORG_COLORS = [
  ['#4361EE', '#7C3AED'], ['#0891B2', '#0E7490'], ['#059669', '#047857'],
  ['#D97706', '#B45309'], ['#E11D48', '#BE123C'], ['#7C3AED', '#6D28D9'],
];

function orgColor(id) { return ORG_COLORS[(id || 0) % ORG_COLORS.length]; }
function orgInitials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '??';
}
function userInitials(name = '', email = '') {
  const src = name || email;
  return src.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}
function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Status Badge ────────────────────────────────────────────────
function StatusBadge({ status }) {
  const labels = { ACTIVE: 'Active', TRIAL: 'Trial', SUSPENDED: 'Suspended' };
  return (
    <span className={`sa-status-badge ${status}`}>
      <span className="sa-status-dot" />
      {labels[status] || status}
    </span>
  );
}

// ── Role Badge ──────────────────────────────────────────────────
function RoleBadge({ role }) {
  const labels = { SUPER_ADMIN: 'Super Admin', ORG_ADMIN: 'CXO / Org Admin', MANAGER: 'Manager', EMPLOYEE: 'Employee' };
  return <span className={`sa-role-badge ${role}`}>{labels[role] || role}</span>;
}

// ── Ticket Status Badge ─────────────────────────────────────────
function TicketStatusBadge({ status }) {
  const map = {
    Open:        { cls: 'open',        icon: <CircleDot size={10} /> },
    'In Progress': { cls: 'in-progress', icon: <Zap size={10} /> },
    Resolved:    { cls: 'resolved',    icon: <CheckCheck size={10} /> },
    Closed:      { cls: 'closed',      icon: <X size={10} /> },
    Pending:     { cls: 'pending',     icon: <Clock size={10} /> },
  };
  const m = map[status] || { cls: 'open', icon: null };
  return (
    <span className={`sa-ticket-status ${m.cls}`}>
      {m.icon}{status}
    </span>
  );
}

// ── Ticket Priority Badge ───────────────────────────────────────
function PriorityBadge({ priority }) {
  const map = {
    Critical: 'critical', High: 'high', Medium: 'medium', Low: 'low',
  };
  return <span className={`sa-ticket-priority ${map[priority] || 'medium'}`}>{priority}</span>;
}

// ── Modal ───────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children, footer, wide, extraWide }) {
  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div
        className={`sa-modal${wide ? ' wide' : ''}${extraWide ? ' extra-wide' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="sa-modal-header">
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="sa-modal-close" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="sa-modal-body">{children}</div>
        {footer && <div className="sa-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="sa-field">
      <label className="sa-label">{label}</label>
      {children}
    </div>
  );
}

// ── Set User Limit Modal ────────────────────────────────────────
function SetUserLimitModal({ org, onClose, onSaved }) {
  const [limit, setLimit] = useState(org.userLimit || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e) {
    e.preventDefault();
    const val = parseInt(limit, 10);
    if (!val || val < 1) { setError('Enter a valid limit (minimum 1).'); return; }
    if (val < (org.userCount || 0)) {
      setError(`Limit cannot be less than current user count (${org.userCount}).`);
      return;
    }
    setSaving(true); setError('');
    try {
      await superAdminService.setUserLimit(org.id, val);
      onSaved(val);
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to set limit.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Set User Limit"
      subtitle={`Control max users for ${org.name}`}
      onClose={onClose}
      footer={
        <>
          <button className="sa-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="sa-btn-primary" onClick={handleSave} disabled={saving}>
            <Sliders size={14} />{saving ? 'Saving…' : 'Save Limit'}
          </button>
        </>
      }
    >
      {error && <div className="sa-error"><AlertCircle size={14} />{error}</div>}

      <div className="sa-limit-info-row">
        <div className="sa-limit-info-box">
          <span className="sa-limit-info-label">Current Users</span>
          <span className="sa-limit-info-val">{org.userCount || 0}</span>
        </div>
        <div className="sa-limit-info-box accent">
          <span className="sa-limit-info-label">Current Limit</span>
          <span className="sa-limit-info-val">{org.userLimit ? org.userLimit : '∞ Unlimited'}</span>
        </div>
      </div>

      <Field label="New User Limit">
        <input
          className="sa-input"
          type="number"
          min="1"
          placeholder="e.g. 25"
          value={limit}
          onChange={e => setLimit(e.target.value)}
          autoFocus
        />
      </Field>

      <div className="sa-info-hint">
        <Shield size={13} />
        CXO will not be able to add users beyond this limit. Set to a high number for near-unlimited access.
      </div>
    </Modal>
  );
}

// ── Create Org Modal ────────────────────────────────────────────
function CreateOrgModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', slug: '', trialEndsAt: '', userLimit: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function autoSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) return;
    setSaving(true); setError('');
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        trialEndsAt: form.trialEndsAt || null,
        userLimit: form.userLimit ? parseInt(form.userLimit, 10) : null,
      };
      const org = await superAdminService.createOrganization(payload);
      onCreated(org);
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to create organization.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="New Organization"
      subtitle="Create a new tenant on the platform"
      onClose={onClose}
      footer={
        <>
          <button className="sa-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="sa-btn-primary" onClick={handleSubmit} disabled={saving}>
            <Plus size={14} />{saving ? 'Creating…' : 'Create Organization'}
          </button>
        </>
      }
    >
      {error && <div className="sa-error"><AlertCircle size={14} />{error}</div>}
      <Field label="Organization Name">
        <input
          className="sa-input"
          placeholder="Acme Corp"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: autoSlug(e.target.value) }))}
          required
        />
      </Field>
      <Field label="Slug (unique URL identifier)">
        <input
          className="sa-input"
          placeholder="acme-corp"
          value={form.slug}
          onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
          style={{ fontFamily: 'monospace' }}
          required
        />
      </Field>
      <Field label="User Limit (optional — leave blank for unlimited)">
        <input
          className="sa-input"
          type="number"
          min="1"
          placeholder="e.g. 25"
          value={form.userLimit}
          onChange={e => setForm(f => ({ ...f, userLimit: e.target.value }))}
        />
      </Field>
      <Field label="Trial Ends (optional)">
        <input
          className="sa-input"
          type="date"
          value={form.trialEndsAt}
          onChange={e => setForm(f => ({ ...f, trialEndsAt: e.target.value }))}
        />
      </Field>
    </Modal>
  );
}

// ── Create CXO Modal ────────────────────────────────────────────
function CreateCxoModal({ org, onClose, onCreated }) {
  const [form, setForm] = useState({ email: '', displayName: '', role: 'ORG_ADMIN' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email.trim()) return;
    setSaving(true); setError('');
    try {
      const user = await superAdminService.createOrgAdmin(org.id, form);
      onCreated(user);
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`Add Admin to ${org.name}`}
      subtitle="Creates an Org Admin account and sends a welcome email"
      onClose={onClose}
      footer={
        <>
          <button className="sa-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="sa-btn-primary" onClick={handleSubmit} disabled={saving}>
            <UserPlus size={14} />{saving ? 'Creating…' : 'Create & Send Email'}
          </button>
        </>
      }
    >
      {error && <div className="sa-error"><AlertCircle size={14} />{error}</div>}
      <Field label="Email Address">
        <input className="sa-input" type="email" placeholder="cxo@company.com"
          value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
      </Field>
      <Field label="Display Name (optional)">
        <input className="sa-input" placeholder="John Smith"
          value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} />
      </Field>
      <Field label="Role">
        <select className="sa-select" value={form.role}
          onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
          <option value="ORG_ADMIN">Org Admin (CXO)</option>
          <option value="MANAGER">Manager</option>
          <option value="EMPLOYEE">Employee</option>
        </select>
      </Field>
      <div className="sa-info-hint">
        <Mail size={13} />
        A welcome email with a temporary password will be sent. The user must reset it on first login.
      </div>
    </Modal>
  );
}

// ── Edit User Modal (SuperAdmin) ────────────────────────────────
function EditUserModal({ orgId, user, onClose, onSaved }) {
  const [form, setForm] = useState({
    displayName: user.displayName || '',
    role: user.role,
    isActive: user.isActive,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const updated = await superAdminService.updateOrgUser(orgId, user.id, {
        displayName: form.displayName.trim() || null,
        role: form.role,
        isActive: form.isActive,
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Edit User"
      subtitle={user.email}
      onClose={onClose}
      footer={
        <>
          <button className="sa-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="sa-btn-primary" onClick={handleSave} disabled={saving}>
            <CheckCircle size={14} />{saving ? 'Saving…' : 'Save Changes'}
          </button>
        </>
      }
    >
      {error && <div className="sa-error"><AlertCircle size={14} />{error}</div>}
      <Field label="Display Name">
        <input className="sa-input" placeholder="Full name"
          value={form.displayName}
          onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} />
      </Field>
      <Field label="Role">
        <select className="sa-select" value={form.role}
          onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
          <option value="ORG_ADMIN">Org Admin (CXO)</option>
          <option value="MANAGER">Manager</option>
          <option value="EMPLOYEE">Employee</option>
        </select>
      </Field>
      <Field label="Status">
        <div style={{ display: 'flex', gap: 8 }}>
          {[true, false].map(val => (
            <button
              key={String(val)}
              type="button"
              onClick={() => setForm(f => ({ ...f, isActive: val }))}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 10, border: '1.5px solid',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.14s',
                borderColor: form.isActive === val
                  ? (val ? 'rgba(16,185,129,0.4)' : 'rgba(244,63,94,0.4)')
                  : '#E1E8F4',
                background: form.isActive === val
                  ? (val ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)')
                  : '#F8FAFC',
                color: form.isActive === val
                  ? (val ? '#059669' : '#E11D48')
                  : '#94A3B8',
              }}
            >
              {val ? '● Active' : '● Inactive'}
            </button>
          ))}
        </div>
      </Field>
    </Modal>
  );
}

// ── Org Users Modal ─────────────────────────────────────────────
function OrgUsersModal({ org, onClose, onUserLimitChange }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [orgData, setOrgData] = useState(org);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    superAdminService.getOrgUsers(org.id)
      .then(setUsers).catch(() => {}).finally(() => setLoading(false));
  }, [org.id]);

  async function toggleActive(user) {
    setBusyId(user.id);
    try {
      await superAdminService.toggleUserActive(org.id, user.id, !user.isActive);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
    } catch {}
    finally { setBusyId(null); }
  }

  async function deleteUser(user) {
    if (!window.confirm(`Remove "${user.displayName || user.email}" from this organization? This cannot be undone.`)) return;
    setBusyId(user.id);
    try {
      await superAdminService.deleteOrgUser(org.id, user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } catch {}
    finally { setBusyId(null); }
  }

  const activeCount = users.filter(u => u.isActive).length;
  const limitPct = orgData.userLimit ? Math.min(100, Math.round((users.length / orgData.userLimit) * 100)) : null;

  return (
    <Modal
      title={`${org.name} — Users`}
      subtitle={`${users.length} member${users.length !== 1 ? 's' : ''} in this organization`}
      onClose={onClose}
      wide
      footer={<button className="sa-btn-cancel" onClick={onClose}>Close</button>}
    >
      {/* Capacity bar */}
      {orgData.userLimit && (
        <div className="sa-limit-bar-wrap">
          <div className="sa-limit-bar-header">
            <span className="sa-limit-bar-label"><Users size={12} />User Capacity</span>
            <span className="sa-limit-bar-count"><strong>{users.length}</strong> / {orgData.userLimit} users</span>
          </div>
          <div className="sa-limit-bar-track">
            <div className={`sa-limit-bar-fill ${limitPct >= 90 ? 'danger' : limitPct >= 70 ? 'warning' : ''}`} style={{ width: `${limitPct}%` }} />
          </div>
          <div className="sa-limit-bar-sub">{limitPct}% capacity · {activeCount} active</div>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="sa-action-btn primary" onClick={() => setShowAdd(true)}>
            <UserPlus size={13} /> Add User
          </button>
          <button className="sa-action-btn ghost" onClick={() => setShowLimitModal(true)}>
            <Sliders size={13} /> Set Limit
          </button>
        </div>
        <span style={{ fontSize: 12, color: '#94A3B8' }}>{activeCount} active · {users.length - activeCount} inactive</span>
      </div>

      {loading ? (
        <div className="sa-spinner"><div className="sa-spinner-ring" /></div>
      ) : users.length === 0 ? (
        <div className="sa-empty">
          <div className="sa-empty-icon">👥</div>
          <h4>No users yet</h4>
          <p>Add a user to get started.</p>
        </div>
      ) : (
        <table className="sa-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: `linear-gradient(135deg, ${orgColor(u.id)[0]}, ${orgColor(u.id)[1]})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800, color: '#fff', fontFamily: 'Outfit',
                      opacity: u.isActive ? 1 : 0.45,
                    }}>
                      {userInitials(u.displayName, u.email)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: u.isActive ? '#0F172A' : '#94A3B8' }}>
                        {u.displayName || '—'}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#94A3B8' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td><RoleBadge role={u.role} /></td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: u.isActive ? '#059669' : '#E11D48' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: '#94A3B8' }}>{timeAgo(u.lastLoginAt)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                    {/* Edit */}
                    <button
                      className="sa-action-btn primary"
                      style={{ fontSize: 11 }}
                      onClick={() => setEditingUser(u)}
                      disabled={busyId === u.id}
                      title="Edit user"
                    >
                      <Pencil size={11} /> Edit
                    </button>
                    {/* Toggle active */}
                    <button
                      className={`sa-action-btn ${u.isActive ? 'warning' : 'success'}`}
                      style={{ fontSize: 11 }}
                      onClick={() => toggleActive(u)}
                      disabled={busyId === u.id}
                      title={u.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {u.isActive ? <><Ban size={11} /> Deactivate</> : <><UserCheck size={11} /> Activate</>}
                    </button>
                    {/* Delete */}
                    <button
                      className="sa-action-btn danger"
                      style={{ fontSize: 11 }}
                      onClick={() => deleteUser(u)}
                      disabled={busyId === u.id}
                      title="Remove from org"
                    >
                      <Trash2 size={11} /> Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showAdd && (
        <CreateCxoModal
          org={org}
          onClose={() => setShowAdd(false)}
          onCreated={u => setUsers(prev => [...prev, u])}
        />
      )}
      {editingUser && (
        <EditUserModal
          orgId={org.id}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={updated => {
            setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
            setEditingUser(null);
          }}
        />
      )}
      {showLimitModal && (
        <SetUserLimitModal
          org={{ ...orgData, userCount: users.length }}
          onClose={() => setShowLimitModal(false)}
          onSaved={newLimit => {
            setOrgData(d => ({ ...d, userLimit: newLimit }));
            onUserLimitChange && onUserLimitChange(newLimit);
          }}
        />
      )}
    </Modal>
  );
}

// ── Ticket Detail Modal ─────────────────────────────────────────
function TicketDetailModal({ ticket, onClose, onUpdated }) {
  const [status, setStatus] = useState(ticket.status || 'Open');
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);
  const [replying, setReplying] = useState(false);
  const [saved, setSaved] = useState(false);

  async function saveStatus() {
    setSaving(true);
    try {
      await superAdminService.updateSupportTicket(ticket.id, { status });
      onUpdated({ ...ticket, status });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    finally { setSaving(false); }
  }

  async function sendReply() {
    if (!reply.trim()) return;
    setReplying(true);
    try {
      await superAdminService.replySupportTicket(ticket.id, reply.trim());
      setReply('');
    } catch {}
    finally { setReplying(false); }
  }

  const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

  return (
    <Modal
      title={`Ticket #${ticket.ticketNumber || ticket.id}`}
      subtitle={ticket.subject || ticket.title}
      onClose={onClose}
      wide
      footer={
        <button className="sa-btn-cancel" onClick={onClose}>Close</button>
      }
    >
      {/* Meta row */}
      <div className="sa-ticket-detail-meta">
        <div className="sa-ticket-meta-item">
          <span className="sa-ticket-meta-label">Raised by</span>
          <span className="sa-ticket-meta-val">
            <div className="sa-mini-avatar">{userInitials(ticket.raisedBy || ticket.createdByName, ticket.createdByEmail)}</div>
            {ticket.raisedBy || ticket.createdByName || '—'}
          </span>
        </div>
        <div className="sa-ticket-meta-item">
          <span className="sa-ticket-meta-label">Organization</span>
          <span className="sa-ticket-meta-val"><Building2 size={11} />{ticket.orgName || '—'}</span>
        </div>
        <div className="sa-ticket-meta-item">
          <span className="sa-ticket-meta-label">Priority</span>
          <PriorityBadge priority={ticket.priority || 'Medium'} />
        </div>
        <div className="sa-ticket-meta-item">
          <span className="sa-ticket-meta-label">Raised</span>
          <span className="sa-ticket-meta-val"><Clock size={11} />{timeAgo(ticket.createdAt)}</span>
        </div>
      </div>

      {/* Description */}
      {ticket.description && (
        <div className="sa-ticket-description">
          <div className="sa-ticket-desc-label">Description</div>
          <p>{ticket.description}</p>
        </div>
      )}

      {/* Status update */}
      <div className="sa-ticket-status-row">
        <div className="sa-ticket-status-group">
          <label className="sa-label">Update Status</label>
          <div className="sa-ticket-status-pills">
            {STATUSES.map(s => (
              <button
                key={s}
                className={`sa-status-pill ${s.toLowerCase().replace(' ', '-')} ${status === s ? 'selected' : ''}`}
                onClick={() => setStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <button
          className={`sa-btn-primary ${saved ? 'saved' : ''}`}
          onClick={saveStatus}
          disabled={saving || status === ticket.status}
          style={{ alignSelf: 'flex-end', minWidth: 110 }}
        >
          {saved ? <><CheckCheck size={14} />Saved</> : saving ? 'Saving…' : <><Shield size={14} />Update</>}
        </button>
      </div>

      {/* Reply box */}
      <div className="sa-reply-section">
        <label className="sa-label">Reply to CXO</label>
        <textarea
          className="sa-textarea"
          placeholder="Type your response or resolution notes…"
          value={reply}
          onChange={e => setReply(e.target.value)}
          rows={3}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            className="sa-btn-primary"
            onClick={sendReply}
            disabled={replying || !reply.trim()}
          >
            <Send size={13} />{replying ? 'Sending…' : 'Send Reply'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Org Card ────────────────────────────────────────────────────
function OrgCard({ org: orgProp, onRefresh, onViewUsers, onCreateCxo, onSetLimit }) {
  const [org, setOrg] = useState(orgProp);
  const [updating, setUpdating] = useState(false);
  const colors = orgColor(org.id);

  useEffect(() => { setOrg(orgProp); }, [orgProp]);

  async function changeStatus(status) {
    if (!window.confirm(`Set "${org.name}" to ${status}?`)) return;
    setUpdating(true);
    try {
      await superAdminService.updateOrgStatus(org.id, status);
      onRefresh();
    } catch {}
    finally { setUpdating(false); }
  }

  const limitPct = org.userLimit
    ? Math.min(100, Math.round(((org.userCount || 0) / org.userLimit) * 100))
    : null;

  return (
    <div className="sa-org-card">
      <div className="sa-org-card-top">
        <div className="sa-org-avatar" style={{ background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)` }}>
          {orgInitials(org.name)}
        </div>
        <div className="sa-org-info">
          <div className="sa-org-name">{org.name}</div>
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="sa-org-slug">/{org.slug}</span>
          </div>
        </div>
        <StatusBadge status={org.status} />
      </div>

      {/* User limit progress bar */}
      {org.userLimit ? (
        <div className="sa-org-capacity">
          <div className="sa-org-capacity-row">
            <span><Users size={11} /> Users</span>
            <span className={`sa-capacity-count ${limitPct >= 90 ? 'danger' : limitPct >= 70 ? 'warning' : ''}`}>
              {org.userCount || 0} / {org.userLimit}
            </span>
          </div>
          <div className="sa-org-capacity-track">
            <div
              className={`sa-org-capacity-fill ${limitPct >= 90 ? 'danger' : limitPct >= 70 ? 'warning' : ''}`}
              style={{ width: `${limitPct}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="sa-org-meta">
          <span className="sa-org-meta-item"><Users size={12} /><span>{org.userCount} user{org.userCount !== 1 ? 's' : ''}</span></span>
          <span className="sa-org-meta-item"><Calendar size={12} /><span>Created {formatDate(org.createdAt)}</span></span>
          {org.trialEndsAt && org.status === 'TRIAL' && (
            <span className="sa-org-meta-item" style={{ color: '#D97706' }}><Clock size={12} /><span>Trial ends {formatDate(org.trialEndsAt)}</span></span>
          )}
        </div>
      )}

      {org.userLimit && (
        <div className="sa-org-meta" style={{ paddingTop: 0 }}>
          <span className="sa-org-meta-item"><Calendar size={12} /><span>Created {formatDate(org.createdAt)}</span></span>
          {org.trialEndsAt && org.status === 'TRIAL' && (
            <span className="sa-org-meta-item" style={{ color: '#D97706' }}><Clock size={12} /><span>Trial ends {formatDate(org.trialEndsAt)}</span></span>
          )}
          {org.suspendedAt && (
            <span className="sa-org-meta-item" style={{ color: '#E11D48' }}><AlertCircle size={12} /><span>Suspended {formatDate(org.suspendedAt)}</span></span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="sa-org-actions">
        <button className="sa-action-btn primary" onClick={() => onViewUsers(org)}>
          <Eye size={11} /> Users
        </button>
        <button className="sa-action-btn primary" onClick={() => onCreateCxo(org)}>
          <UserPlus size={11} /> Add Admin
        </button>
        <button className="sa-action-btn ghost" onClick={() => onSetLimit(org)}>
          <Sliders size={11} /> Set Limit
        </button>

        {org.status !== 'ACTIVE' && (
          <button className="sa-action-btn success" onClick={() => changeStatus('ACTIVE')} disabled={updating}>
            <Play size={11} /> Activate
          </button>
        )}
        {org.status !== 'TRIAL' && (
          <button className="sa-action-btn warning" onClick={() => changeStatus('TRIAL')} disabled={updating}>
            <Clock size={11} /> Trial
          </button>
        )}
        {org.status !== 'SUSPENDED' && (
          <button className="sa-action-btn danger" onClick={() => changeStatus('SUSPENDED')} disabled={updating}>
            <Pause size={11} /> Suspend
          </button>
        )}
      </div>
    </div>
  );
}

// ── Tickets Tab ─────────────────────────────────────────────────
function TicketsTab({ search }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTicket, setSelectedTicket] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await superAdminService.getSupportTickets();
      setTickets(data || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleUpdated(updated) {
    setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    if (selectedTicket?.id === updated.id) setSelectedTicket(updated);
  }

  const filtered = tickets.filter(t => {
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchSearch = !search ||
      (t.subject || t.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.createdByName || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.orgName || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const ticketStats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    inProgress: tickets.filter(t => t.status === 'In Progress').length,
    resolved: tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length,
  };

  const STATUS_OPTIONS = ['ALL', 'Open', 'In Progress', 'Resolved', 'Closed'];

  return (
    <div>
      {/* Ticket stats */}
      <div className="sa-stats-row" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 24 }}>
        {[
          { label: 'Total Tickets', value: ticketStats.total, color: '#4361EE', icon: <Ticket size={18} />, bg: 'rgba(67,97,238,0.10)' },
          { label: 'Open',          value: ticketStats.open,  color: '#E11D48', icon: <CircleDot size={18} />, bg: 'rgba(244,63,94,0.10)' },
          { label: 'In Progress',   value: ticketStats.inProgress, color: '#8B5CF6', icon: <Zap size={18} />, bg: 'rgba(139,92,246,0.10)' },
          { label: 'Resolved',      value: ticketStats.resolved,   color: '#059669', icon: <CheckCheck size={18} />, bg: 'rgba(16,185,129,0.10)' },
        ].map((s, i) => (
          <div key={i} className="sa-stat-card" style={{ '--sa-accent': s.color }}>
            <div className="sa-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div>
              <div className="sa-stat-value">{s.value}</div>
              <div className="sa-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Status filter tabs */}
      <div className="sa-tabs" style={{ marginBottom: 20 }}>
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            className={`sa-tab ${statusFilter === s ? 'active' : ''}`}
            onClick={() => setStatusFilter(s)}
          >
            {s !== 'ALL' && (
              <span className="sa-tab-dot" style={{
                background: s === 'Open' ? '#E11D48' : s === 'In Progress' ? '#8B5CF6' : s === 'Resolved' ? '#059669' : '#94A3B8',
              }} />
            )}
            {s === 'ALL' ? 'All Tickets' : s}
            <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>
              {s === 'ALL' ? tickets.length : tickets.filter(t => t.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {/* Tickets table */}
      <div className="sa-card">
        {loading ? (
          <div className="sa-spinner"><div className="sa-spinner-ring" /></div>
        ) : filtered.length === 0 ? (
          <div className="sa-empty">
            <div className="sa-empty-icon">🎫</div>
            <h4>{search || statusFilter !== 'ALL' ? 'No tickets match filters' : 'No support tickets yet'}</h4>
            <p>CXO users raise support tickets to the Superadmin from their portal.</p>
          </div>
        ) : (
          <table className="sa-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Subject</th>
                <th>Raised by</th>
                <th>Organization</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="sa-ticket-row" onClick={() => setSelectedTicket(t)} style={{ cursor: 'pointer' }}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: 11.5, color: '#94A3B8', fontWeight: 600 }}>
                      #{t.ticketNumber || t.id}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.subject || t.title || '—'}
                    </div>
                    {t.description && (
                      <div style={{ fontSize: 11.5, color: '#94A3B8', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="sa-mini-avatar">{userInitials(t.createdByName || t.raisedBy, t.createdByEmail)}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{t.createdByName || t.raisedBy || '—'}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>{t.createdByEmail || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#475569', fontWeight: 500 }}>
                      <Building2 size={12} color="#94A3B8" />{t.orgName || '—'}
                    </span>
                  </td>
                  <td><PriorityBadge priority={t.priority || 'Medium'} /></td>
                  <td><TicketStatusBadge status={t.status || 'Open'} /></td>
                  <td style={{ fontSize: 12, color: '#94A3B8' }}>{timeAgo(t.createdAt)}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <button
                      className="sa-action-btn primary"
                      onClick={() => setSelectedTicket(t)}
                      style={{ fontSize: 11 }}
                    >
                      <Eye size={11} /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────
export default function SuperAdminDashboard() {
  const { currentUser, logout } = useAuth();
  const [tab, setTab] = useState('orgs');
  const [orgs, setOrgs] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [viewUsersOrg, setViewUsersOrg]   = useState(null);
  const [createCxoOrg, setCreateCxoOrg]   = useState(null);
  const [setLimitOrg, setSetLimitOrg]     = useState(null);

  const loadOrgs = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await superAdminService.getOrganizations();
      setOrgs(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to load organizations.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllUsers = useCallback(async () => {
    if (orgs.length === 0) return;
    try {
      const results = await Promise.allSettled(
        orgs.map(o => superAdminService.getOrgUsers(o.id).then(users => users.map(u => ({ ...u, orgName: o.name }))))
      );
      setAllUsers(results.flatMap(r => r.status === 'fulfilled' ? r.value : []));
    } catch {}
  }, [orgs]);

  useEffect(() => { loadOrgs(); }, [loadOrgs]);
  useEffect(() => { if (tab === 'users') loadAllUsers(); }, [tab, loadAllUsers]);

  const stats = {
    total:     orgs.length,
    active:    orgs.filter(o => o.status === 'ACTIVE').length,
    trial:     orgs.filter(o => o.status === 'TRIAL').length,
    suspended: orgs.filter(o => o.status === 'SUSPENDED').length,
  };

  const filteredOrgs = orgs.filter(o => {
    const matchSearch = !search ||
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredUsers = allUsers.filter(u =>
    !search ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.orgName || '').toLowerCase().includes(search.toLowerCase())
  );

  const initials = userInitials(currentUser?.displayName, currentUser?.email);

  const TAB_LABELS = {
    orgs: 'Organizations',
    users: 'All Users',
    tickets: 'Support Tickets',
  };

  return (
    <div className="sa-root">

      {/* ── Sidebar ──────────────────────────────── */}
      <aside className="sa-sidebar">
        <div className="sa-sidebar-brand">
          <div className="sa-brand-logo"><span>AB</span></div>
          <div className="sa-brand-text">
            <div className="sa-brand-name">Ambot365 Tracker</div>
            <div className="sa-brand-sub">Platform Admin</div>
          </div>
        </div>

        <div className="sa-platform-badge">
          <div className="sa-platform-badge-pill">
            <span className="sa-platform-dot" />
            SUPER ADMIN PORTAL
          </div>
        </div>

        <nav className="sa-nav">
          <div className="sa-nav-section">
            <div className="sa-nav-section-title">Platform</div>
            <button className={`sa-nav-item ${tab === 'orgs' ? 'active' : ''}`} onClick={() => setTab('orgs')}>
              <span className="sa-nav-item-icon"><Building2 size={15} /></span>
              Organizations
              {orgs.length > 0 && <span className="sa-nav-count">{orgs.length}</span>}
            </button>
            <button className={`sa-nav-item ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
              <span className="sa-nav-item-icon"><Users size={15} /></span>
              All Users
              {allUsers.length > 0 && <span className="sa-nav-count">{allUsers.length}</span>}
            </button>
            <button className={`sa-nav-item ${tab === 'tickets' ? 'active' : ''}`} onClick={() => setTab('tickets')}>
              <span className="sa-nav-item-icon"><Ticket size={15} /></span>
              Support Tickets
            </button>
          </div>

          <div className="sa-nav-section">
            <div className="sa-nav-section-title">Quick Filters</div>
            {['ACTIVE', 'TRIAL', 'SUSPENDED'].map(s => (
              <button
                key={s}
                className={`sa-nav-item ${statusFilter === s && tab === 'orgs' ? 'active' : ''}`}
                onClick={() => { setTab('orgs'); setStatusFilter(s); }}
              >
                <span className="sa-nav-item-icon">
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
                    background: s === 'ACTIVE' ? '#059669' : s === 'TRIAL' ? '#D97706' : '#E11D48',
                  }} />
                </span>
                {s.charAt(0) + s.slice(1).toLowerCase()}
                <span className="sa-nav-count">{orgs.filter(o => o.status === s).length}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="sa-sidebar-footer">
          <div className="sa-user-card">
            <div className="sa-user-avatar">{initials}</div>
            <div className="sa-user-info">
              <div className="sa-user-name">{currentUser?.displayName || currentUser?.email}</div>
              <div className="sa-user-role">Super Admin</div>
            </div>
            <button className="sa-logout-btn" onClick={logout} title="Sign out">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────── */}
      <div className="sa-main">

        {/* Topbar */}
        <div className="sa-topbar">
          <div className="sa-topbar-title">
            <h1>{TAB_LABELS[tab]}</h1>
            <p>
              {tab === 'orgs'
                ? `${stats.active} active · ${stats.trial} trial · ${stats.suspended} suspended`
                : tab === 'users'
                  ? `${allUsers.length} users across ${orgs.length} organizations`
                  : 'Review and respond to tickets raised by CXO users'}
            </p>
          </div>

          <div className="sa-search-wrap" style={{ width: 220 }}>
            <Search size={13} className="sa-search-icon" />
            <input
              className="sa-input sa-search"
              placeholder={tab === 'orgs' ? 'Search orgs…' : tab === 'users' ? 'Search users…' : 'Search tickets…'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ fontSize: 13, padding: '7px 12px 7px 34px' }}
            />
          </div>

          {tab === 'orgs' && (
            <button className="sa-btn-primary" onClick={() => setShowCreateOrg(true)}>
              <Plus size={14} /> New Organization
            </button>
          )}
          <button
            onClick={loadOrgs}
            style={{ background: 'transparent', border: '1.5px solid #E1E8F4', borderRadius: 9, padding: '7px 9px', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', transition: 'all 0.14s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#4361EE'; e.currentTarget.style.borderColor = 'rgba(67,97,238,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = '#E1E8F4'; }}
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="sa-content">
          {error && <div className="sa-error"><AlertCircle size={14} />{error}</div>}

          {/* ── Orgs tab ── */}
          {tab === 'orgs' && (
            <div>
              <div className="sa-stats-row">
                {[
                  { label: 'Total Orgs', value: stats.total,     color: '#4361EE', icon: <Building2 size={18} />,    bg: 'rgba(67,97,238,0.10)' },
                  { label: 'Active',     value: stats.active,    color: '#059669', icon: <CheckCircle size={18} />,  bg: 'rgba(16,185,129,0.10)' },
                  { label: 'Trial',      value: stats.trial,     color: '#D97706', icon: <Clock size={18} />,        bg: 'rgba(245,158,11,0.10)' },
                  { label: 'Suspended',  value: stats.suspended, color: '#E11D48', icon: <Pause size={18} />,        bg: 'rgba(244,63,94,0.10)' },
                ].map((s, i) => (
                  <div key={i} className="sa-stat-card" style={{ '--sa-accent': s.color }}>
                    <div className="sa-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                    <div>
                      <div className="sa-stat-value">{s.value}</div>
                      <div className="sa-stat-label">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 20 }}>
                <div className="sa-tabs">
                  {['ALL', 'ACTIVE', 'TRIAL', 'SUSPENDED'].map(s => (
                    <button
                      key={s}
                      className={`sa-tab ${statusFilter === s ? 'active' : ''}`}
                      onClick={() => setStatusFilter(s)}
                    >
                      {s !== 'ALL' && (
                        <span className="sa-tab-dot" style={{
                          background: s === 'ACTIVE' ? '#059669' : s === 'TRIAL' ? '#D97706' : '#E11D48',
                        }} />
                      )}
                      {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                      <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>
                        {s === 'ALL' ? orgs.length : orgs.filter(o => o.status === s).length}
                      </span>
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="sa-spinner"><div className="sa-spinner-ring" /></div>
                ) : filteredOrgs.length === 0 ? (
                  <div className="sa-card">
                    <div className="sa-empty">
                      <div className="sa-empty-icon">🏢</div>
                      <h4>{search ? 'No results found' : 'No organizations yet'}</h4>
                      <p>{search ? 'Try a different search term.' : 'Create your first organization to get started.'}</p>
                      {!search && (
                        <button className="sa-btn-primary" onClick={() => setShowCreateOrg(true)}>
                          <Plus size={14} /> Create Organization
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="sa-org-grid">
                    {filteredOrgs.map(org => (
                      <OrgCard
                        key={org.id}
                        org={org}
                        onRefresh={loadOrgs}
                        onViewUsers={setViewUsersOrg}
                        onCreateCxo={setCreateCxoOrg}
                        onSetLimit={setSetLimitOrg}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Users tab ── */}
          {tab === 'users' && (
            <div className="sa-card">
              {filteredUsers.length === 0 && !loading ? (
                <div className="sa-empty">
                  <div className="sa-empty-icon">👤</div>
                  <h4>{search ? 'No users found' : 'No users across organizations'}</h4>
                  <p>Create organizations and add users to see them here.</p>
                </div>
              ) : (
                <table className="sa-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Organization</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>First Login</th>
                      <th>Last Login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => {
                      const colors = orgColor(u.id);
                      return (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                                background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 800, color: '#fff', fontFamily: 'Outfit',
                                opacity: u.isActive ? 1 : 0.5,
                              }}>
                                {userInitials(u.displayName, u.email)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 13.5, color: u.isActive ? '#0F172A' : '#94A3B8' }}>
                                  {u.displayName || '—'}
                                </div>
                                <div style={{ fontSize: 11.5, color: '#94A3B8' }}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td><span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{u.orgName}</span></td>
                          <td><RoleBadge role={u.role} /></td>
                          <td>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              fontSize: 12, fontWeight: 600,
                              color: u.isActive ? '#059669' : '#E11D48',
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                              {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            {u.isFirstLogin
                              ? <span style={{ fontSize: 11.5, fontWeight: 600, color: '#D97706', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />Pending</span>
                              : <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={13} /><span style={{ fontSize: 11.5, color: '#64748B' }}>Done</span></span>}
                          </td>
                          <td style={{ fontSize: 12, color: '#94A3B8' }}>{timeAgo(u.lastLoginAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── Tickets tab ── */}
          {tab === 'tickets' && <TicketsTab search={search} />}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────── */}
      {showCreateOrg && (
        <CreateOrgModal
          onClose={() => setShowCreateOrg(false)}
          onCreated={org => setOrgs(prev => [...prev, org])}
        />
      )}
      {viewUsersOrg && (
        <OrgUsersModal
          org={viewUsersOrg}
          onClose={() => setViewUsersOrg(null)}
          onUserLimitChange={newLimit => {
            setOrgs(prev => prev.map(o => o.id === viewUsersOrg.id ? { ...o, userLimit: newLimit } : o));
          }}
        />
      )}
      {createCxoOrg && (
        <CreateCxoModal
          org={createCxoOrg}
          onClose={() => setCreateCxoOrg(null)}
          onCreated={() => loadOrgs()}
        />
      )}
      {setLimitOrg && (
        <SetUserLimitModal
          org={setLimitOrg}
          onClose={() => setSetLimitOrg(null)}
          onSaved={newLimit => {
            setOrgs(prev => prev.map(o => o.id === setLimitOrg.id ? { ...o, userLimit: newLimit } : o));
          }}
        />
      )}
    </div>
  );
}
