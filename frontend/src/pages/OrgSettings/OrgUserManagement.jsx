import React, { useEffect, useState, useCallback } from 'react';
import { organizationService } from '../../services/organizationService';
import { apiClient } from '../../services/apiClient';
import {
  Users, UserPlus, Ban, UserCheck, ShieldCheck, Mail,
  AlertCircle, CheckCircle, Clock, X, Sliders, RefreshCw,
  Pencil, Trash2, Save
} from 'lucide-react';

// ── Helpers ─────────────────────────────────────────────────────
function userInitials(name = '', email = '') {
  const src = name || email;
  return src.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}

const ROLE_COLORS = {
  ORG_ADMIN: { bg: 'rgba(67,97,238,0.10)',   text: '#4361EE' },
  MANAGER:   { bg: 'rgba(6,182,212,0.10)',   text: '#0891B2' },
  EMPLOYEE:  { bg: 'rgba(16,185,129,0.10)',  text: '#059669' },
};
const AVATAR_GRADIENTS = [
  ['#4361EE','#7C3AED'],['#0891B2','#0E7490'],['#059669','#047857'],
  ['#D97706','#B45309'],['#E11D48','#BE123C'],['#7C3AED','#6D28D9'],
];
function avatarGrad(id) { return AVATAR_GRADIENTS[(id || 0) % AVATAR_GRADIENTS.length]; }

// ── Small modal shell ────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children, footer }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
      backdropFilter: 'blur(4px)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20,
        boxShadow: '0 24px 64px rgba(15,23,42,0.20)', width: '100%', maxWidth: 480,
        maxHeight: '88vh', overflowY: 'auto',
        animation: 'oum-slide 0.22s cubic-bezier(0.34,1.56,0.64,1)',
      }} onClick={e => e.stopPropagation()}>
        <style>{`@keyframes oum-slide{from{opacity:0;transform:translateY(14px) scale(0.97)}to{opacity:1;transform:none}}`}</style>
        {/* Header */}
        <div style={{ padding: '22px 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.4px' }}>{title}</h3>
            {subtitle && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', flexShrink: 0 }}>
            <X size={14} />
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: '20px 24px' }}>{children}</div>
        {/* Footer */}
        {footer && <div style={{ padding: '0 24px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>{footer}</div>}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, letterSpacing: '0.01em' }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 13px', border: '1.5px solid #E1E8F4',
  borderRadius: 10, fontSize: 14, fontFamily: 'DM Sans, sans-serif',
  color: '#0F172A', background: '#F8FAFC', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};
const selectStyle = { ...inputStyle };
const btnPrimary = {
  background: 'var(--button-brand,#5286A5)', color: '#fff', border: 'none',
  borderRadius: 10, padding: '9px 20px', fontSize: 13.5, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s',
  display: 'inline-flex', alignItems: 'center', gap: 6,
  boxShadow: '0 3px 12px rgba(82,134,165,0.28)',
};
const btnCancel = {
  background: 'transparent', color: '#64748B', border: '1.5px solid #E1E8F4',
  borderRadius: 10, padding: '9px 16px', fontSize: 13.5, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.14s',
};

// ── Create User Modal ────────────────────────────────────────────
function CreateUserModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ email: '', displayName: '', role: 'EMPLOYEE' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email.trim()) return;
    setSaving(true); setError('');
    try {
      const user = await organizationService.createUser(form);
      onCreate(user);
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Add User"
      subtitle="Creates an account and sends a welcome email with a temporary password"
      onClose={onClose}
      footer={
        <>
          <button style={btnCancel} onClick={onClose}>Cancel</button>
          <button style={btnPrimary} onClick={handleSubmit} disabled={saving}>
            <UserPlus size={14} />{saving ? 'Creating…' : 'Create & Send Email'}
          </button>
        </>
      }
    >
      {error && (
        <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.20)', borderRadius: 10, padding: '12px 16px', color: '#E11D48', fontSize: 13, fontWeight: 500, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={14} />{error}
        </div>
      )}
      <Field label="Email Address">
        <input style={inputStyle} type="email" placeholder="user@company.com"
          value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
      </Field>
      <Field label="Display Name (optional)">
        <input style={inputStyle} placeholder="John Doe"
          value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} />
      </Field>
      <Field label="Role">
        <select style={selectStyle} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
          <option value="EMPLOYEE">Employee</option>
          <option value="MANAGER">Manager</option>
        </select>
      </Field>
      <div style={{ background: 'rgba(67,97,238,0.05)', border: '1px solid rgba(67,97,238,0.15)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#4361EE', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Mail size={13} style={{ flexShrink: 0, marginTop: 1 }} />
        A welcome email with a temporary password will be sent. The user must reset it on first login.
      </div>
    </Modal>
  );
}

// ── Edit User Modal (CXO) ────────────────────────────────────────
function EditUserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    displayName: user.displayName || '',
    role: user.role === 'ORG_ADMIN' ? 'ORG_ADMIN' : user.role,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const updated = await organizationService.updateUser(user.id, {
        displayName: form.displayName.trim() || null,
        role: user.role === 'ORG_ADMIN' ? undefined : form.role,
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
      subtitle={`Editing ${user.email}`}
      onClose={onClose}
      footer={
        <>
          <button style={btnCancel} onClick={onClose}>Cancel</button>
          <button style={btnPrimary} onClick={handleSave} disabled={saving}>
            <Save size={14} />{saving ? 'Saving…' : 'Save Changes'}
          </button>
        </>
      }
    >
      {error && (
        <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.20)', borderRadius: 10, padding: '12px 16px', color: '#E11D48', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={14} />{error}
        </div>
      )}
      <Field label="Display Name">
        <input style={inputStyle} placeholder="Full name"
          value={form.displayName}
          onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} />
      </Field>
      {user.role !== 'ORG_ADMIN' && (
        <Field label="Role">
          <select style={selectStyle} value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            <option value="EMPLOYEE">Employee</option>
            <option value="MANAGER">Manager</option>
          </select>
        </Field>
      )}
      {user.role === 'ORG_ADMIN' && (
        <div style={{ background: 'rgba(67,97,238,0.05)', border: '1px solid rgba(67,97,238,0.15)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#4361EE', display: 'flex', gap: 8 }}>
          <ShieldCheck size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          Org Admin role cannot be changed from this panel.
        </div>
      )}
    </Modal>
  );
}

// ── Permissions Modal ────────────────────────────────────────────
function PermissionsModal({ role, onClose }) {
  const [allPerms, setAllPerms] = useState([]);
  const [rolePerms, setRolePerms] = useState([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get('/admin/permissions'),
      organizationService.getRolePermissions(role),
    ]).then(([all, codes]) => {
      setAllPerms(all || []);
      setRolePerms(codes || []);
    }).catch(() => {});
  }, [role]);

  const grouped = allPerms.reduce((acc, p) => {
    (acc[p.module] = acc[p.module] || []).push(p);
    return acc;
  }, {});

  async function save() {
    setSaving(true);
    try {
      await organizationService.setRolePermissions(role, rolePerms);
      setSuccess(true);
      setTimeout(onClose, 800);
    } catch {}
    finally { setSaving(false); }
  }

  return (
    <Modal
      title={`${role} Permissions`}
      subtitle={`Configure which modules ${role.toLowerCase()}s can access`}
      onClose={onClose}
      footer={
        <>
          <button style={btnCancel} onClick={onClose}>Cancel</button>
          <button style={btnPrimary} onClick={save} disabled={saving}>
            <ShieldCheck size={14} />{success ? 'Saved!' : saving ? 'Saving…' : 'Save Permissions'}
          </button>
        </>
      }
    >
      <p style={{ color: '#64748B', fontSize: 13, marginBottom: 16, marginTop: 0 }}>
        Select which modules {role}s can access in your organization.
      </p>
      {Object.entries(grouped).map(([module, perms]) => (
        <div key={module} style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13, marginBottom: 6 }}>{module}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {perms.map(p => (
              <label key={p.code} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, cursor: 'pointer', background: rolePerms.includes(p.code) ? 'rgba(67,97,238,0.08)' : '#F8FAFC', border: `1px solid ${rolePerms.includes(p.code) ? 'rgba(67,97,238,0.25)' : '#E1E8F4'}`, borderRadius: 7, padding: '4px 10px', transition: 'all 0.14s', color: rolePerms.includes(p.code) ? '#4361EE' : '#64748B', fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={rolePerms.includes(p.code)}
                  style={{ accentColor: '#4361EE' }}
                  onChange={e => {
                    if (e.target.checked) setRolePerms(r => [...r, p.code]);
                    else setRolePerms(r => r.filter(c => c !== p.code));
                  }}
                />
                {p.action}
              </label>
            ))}
          </div>
        </div>
      ))}
    </Modal>
  );
}

// ── Main Component ───────────────────────────────────────────────
export default function OrgUserManagement() {
  const [users, setUsers]           = useState([]);
  const [org, setOrg]               = useState(null);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [permRole, setPermRole]     = useState(null);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [busyId, setBusyId]         = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [usersData, orgData] = await Promise.all([
        organizationService.getUsers(),
        organizationService.getProfile(),
      ]);
      setUsers(usersData || []);
      setOrg(orgData || null);
    } catch (e) {
      setError(e?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleToggleActive(user) {
    const action = user.isActive ? 'Deactivate' : 'Activate';
    if (!confirm(`${action} ${user.displayName || user.email}?`)) return;
    setBusyId(user.id);
    try {
      const updated = await organizationService.updateUser(user.id, { isActive: !user.isActive });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: updated.isActive } : u));
      showSuccess(`User ${updated.isActive ? 'activated' : 'deactivated'}.`);
    } catch (e) {
      setError(e?.message || 'Failed to update user.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(user) {
    if (!confirm(`Remove ${user.displayName || user.email} from your organization? This cannot be undone.`)) return;
    setBusyId(user.id);
    try {
      await organizationService.deactivateUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      showSuccess('User removed.');
    } catch (e) {
      setError(e?.message || 'Failed to remove user.');
    } finally {
      setBusyId(null);
    }
  }

  function showSuccess(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  }

  // Capacity info
  const activeCount = users.filter(u => u.isActive).length;
  const totalCount = users.length;
  const userLimit = org?.userLimit ?? null;
  const limitPct = userLimit ? Math.min(100, Math.round((totalCount / userLimit) * 100)) : null;
  const atLimit = userLimit !== null && totalCount >= userLimit;
  const nearLimit = userLimit !== null && limitPct !== null && limitPct >= 80 && !atLimit;

  return (
    <div style={{ padding: '1.75rem', fontFamily: 'DM Sans, sans-serif', background: 'var(--bg-primary,#EEF2F8)', minHeight: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontWeight: 800, color: '#0F172A', margin: 0, fontFamily: 'Outfit, sans-serif', fontSize: 20, letterSpacing: '-0.5px' }}>
            User Management
          </h2>
          <p style={{ color: '#94A3B8', fontSize: 13, margin: '3px 0 0' }}>
            Manage your team members and their access roles
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            style={{ ...btnCancel, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => setPermRole('MANAGER')}
          >
            <ShieldCheck size={13} /> Manager Perms
          </button>
          <button
            style={{ ...btnCancel, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => setPermRole('EMPLOYEE')}
          >
            <ShieldCheck size={13} /> Employee Perms
          </button>
          <button
            style={{ ...btnCancel, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={load}
            title="Refresh"
          >
            <RefreshCw size={13} />
          </button>
          <button
            style={{
              ...btnPrimary,
              opacity: atLimit ? 0.5 : 1,
              cursor: atLimit ? 'not-allowed' : 'pointer',
            }}
            onClick={() => { if (!atLimit) setShowCreate(true); }}
            disabled={atLimit}
            title={atLimit ? `User limit reached (${userLimit})` : 'Add a new user'}
          >
            <UserPlus size={14} /> Add User
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.20)', borderRadius: 10, padding: '12px 16px', color: '#E11D48', fontSize: 13, fontWeight: 500, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={14} />{error}
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#E11D48' }}><X size={13} /></button>
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.20)', borderRadius: 10, padding: '12px 16px', color: '#059669', fontSize: 13, fontWeight: 500, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={14} />{success}
        </div>
      )}

      {/* Capacity card */}
      {org && (
        <div style={{
          background: '#fff', border: `1px solid ${atLimit ? 'rgba(244,63,94,0.25)' : nearLimit ? 'rgba(245,158,11,0.25)' : '#E1E8F4'}`,
          borderRadius: 16, padding: '18px 20px', marginBottom: 20,
          boxShadow: '0 2px 12px rgba(15,23,42,0.06)', position: 'relative', overflow: 'hidden',
        }}>
          {/* Left accent */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: atLimit ? '#E11D48' : nearLimit ? '#F59E0B' : 'linear-gradient(180deg,#4361EE,#10B981)', borderRadius: '20px 0 0 20px' }} />
          <div style={{ paddingLeft: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: userLimit ? 10 : 0 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={14} color="#4361EE" />
                  Team Capacity
                </div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                  {activeCount} active · {totalCount - activeCount} inactive · {totalCount} total
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {userLimit ? (
                  <>
                    <div style={{ fontSize: 22, fontWeight: 800, color: atLimit ? '#E11D48' : nearLimit ? '#D97706' : '#0F172A', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.5px' }}>
                      {totalCount} <span style={{ fontSize: 14, fontWeight: 500, color: '#94A3B8' }}>/ {userLimit}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>users used</div>
                  </>
                ) : (
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#4361EE' }}>Unlimited</div>
                )}
              </div>
            </div>

            {userLimit && (
              <>
                <div style={{ height: 6, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{
                    height: '100%', borderRadius: 999,
                    width: `${limitPct}%`,
                    background: atLimit ? '#E11D48' : nearLimit ? '#F59E0B' : 'linear-gradient(90deg,#4361EE,#7C3AED)',
                    transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
                  }} />
                </div>
                <div style={{ fontSize: 11.5, color: atLimit ? '#E11D48' : nearLimit ? '#D97706' : '#94A3B8', fontWeight: atLimit || nearLimit ? 700 : 400 }}>
                  {atLimit
                    ? `User limit reached — contact your Super Admin to increase the limit`
                    : nearLimit
                      ? `${userLimit - totalCount} slots remaining before reaching your limit`
                      : `${userLimit - totalCount} of ${userLimit} slots available`}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Users list */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 32, height: 32, border: '3px solid #E1E8F4', borderTopColor: '#4361EE', borderRadius: '50%', animation: 'oum-spin 0.75s linear infinite' }} />
          <style>{`@keyframes oum-spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : users.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E1E8F4', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', padding: '56px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>👥</div>
          <h4 style={{ fontWeight: 700, color: '#475569', margin: '0 0 6px', fontFamily: 'Outfit, sans-serif' }}>No users yet</h4>
          <p style={{ color: '#94A3B8', fontSize: 13, margin: '0 0 20px' }}>Add your first team member to get started.</p>
          {!atLimit && (
            <button style={btnPrimary} onClick={() => setShowCreate(true)}>
              <UserPlus size={14} /> Add First User
            </button>
          )}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E1E8F4', boxShadow: '0 2px 12px rgba(15,23,42,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E1E8F4' }}>
                {['User', 'Role', 'Status', 'First Login', 'Last Login', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const [g1, g2] = avatarGrad(u.id);
                const rc = ROLE_COLORS[u.role] || ROLE_COLORS.EMPLOYEE;
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#FAFBFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                          background: `linear-gradient(135deg,${g1},${g2})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 800, color: '#fff', fontFamily: 'Outfit',
                          opacity: u.isActive ? 1 : 0.4,
                        }}>
                          {userInitials(u.displayName, u.email)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: u.isActive ? '#0F172A' : '#94A3B8', fontSize: 13.5 }}>
                            {u.displayName || '—'}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#94A3B8' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: rc.bg, color: rc.text }}>
                        {u.role === 'ORG_ADMIN' ? 'CXO / Admin' : u.role}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: u.isActive ? '#059669' : '#E11D48' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      {u.isFirstLogin
                        ? <span style={{ fontSize: 11.5, fontWeight: 600, color: '#D97706', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />Pending</span>
                        : <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={13} /><span style={{ fontSize: 11.5, color: '#64748B' }}>Done</span></span>}
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: 12, color: '#94A3B8' }}>
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {/* Edit */}
                        <button
                          disabled={busyId === u.id}
                          onClick={() => setEditingUser(u)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '5px 10px', borderRadius: 7, fontSize: 11.5, fontWeight: 600,
                            border: '1px solid rgba(67,97,238,0.2)', cursor: 'pointer',
                            background: 'rgba(67,97,238,0.08)', color: '#4361EE',
                            transition: 'all 0.14s',
                          }}
                        >
                          <Pencil size={11} /> Edit
                        </button>

                        {/* Toggle active — only for non-admins */}
                        {u.role !== 'ORG_ADMIN' && (
                          <button
                            disabled={busyId === u.id}
                            onClick={() => handleToggleActive(u)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '5px 10px', borderRadius: 7, fontSize: 11.5, fontWeight: 600,
                              border: `1px solid ${u.isActive ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)'}`,
                              cursor: 'pointer', transition: 'all 0.14s',
                              background: u.isActive ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
                              color: u.isActive ? '#D97706' : '#059669',
                              opacity: busyId === u.id ? 0.5 : 1,
                            }}
                          >
                            {u.isActive ? <><Ban size={11} /> Deactivate</> : <><UserCheck size={11} /> Activate</>}
                          </button>
                        )}

                        {/* Delete — only for non-admins */}
                        {u.role !== 'ORG_ADMIN' && (
                          <button
                            disabled={busyId === u.id}
                            onClick={() => handleDelete(u)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '5px 10px', borderRadius: 7, fontSize: 11.5, fontWeight: 600,
                              border: '1px solid rgba(244,63,94,0.2)', cursor: 'pointer',
                              background: 'rgba(244,63,94,0.08)', color: '#E11D48',
                              transition: 'all 0.14s', opacity: busyId === u.id ? 0.5 : 1,
                            }}
                          >
                            <Trash2 size={11} /> Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreate={newUser => {
            setUsers(prev => [...prev, newUser]);
            showSuccess('User created. Welcome email sent.');
          }}
        />
      )}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={updated => {
            setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
            showSuccess('User updated.');
          }}
        />
      )}
      {permRole && (
        <PermissionsModal role={permRole} onClose={() => setPermRole(null)} />
      )}
    </div>
  );
}
