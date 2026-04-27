import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { superAdminService } from '../../services/organizationService';
import './SuperAdminDashboard.css';

// ── Icons (lucide-react — already in project) ──────────────────
import {
  Building2, Users, ShieldCheck, LogOut, Plus, RefreshCw,
  Search, X, ChevronRight, UserPlus, ToggleLeft, ToggleRight,
  Clock, Calendar, Hash, Mail, Eye, AlertCircle, CheckCircle,
  Pause, Play, Globe
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────

const ORG_COLORS = [
  ['#4361EE', '#7C3AED'], ['#0891B2', '#0E7490'], ['#059669', '#047857'],
  ['#D97706', '#B45309'], ['#E11D48', '#BE123C'], ['#7C3AED', '#6D28D9'],
];

function orgColor(id) {
  return ORG_COLORS[(id || 0) % ORG_COLORS.length];
}

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
  const labels = { SUPER_ADMIN: 'Super Admin', ORG_ADMIN: 'Org Admin', MANAGER: 'Manager', EMPLOYEE: 'Employee' };
  return <span className={`sa-role-badge ${role}`}>{labels[role] || role}</span>;
}

// ── Modal ───────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children, footer, wide }) {
  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className={`sa-modal${wide ? ' wide' : ''}`} onClick={e => e.stopPropagation()}>
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

// ── Create Org Modal ────────────────────────────────────────────
function CreateOrgModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', slug: '', trialEndsAt: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function autoSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) return;
    setSaving(true);
    setError('');
    try {
      const org = await superAdminService.createOrganization({
        name: form.name.trim(),
        slug: form.slug.trim(),
        trialEndsAt: form.trialEndsAt || null,
      });
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
    setSaving(true);
    setError('');
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
      subtitle="Creates an Org Admin account and sends a welcome email with a temporary password"
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
        <input
          className="sa-input"
          type="email"
          placeholder="cxo@company.com"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          required
        />
      </Field>
      <Field label="Display Name (optional)">
        <input
          className="sa-input"
          placeholder="John Smith"
          value={form.displayName}
          onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
        />
      </Field>
      <Field label="Role">
        <select
          className="sa-select"
          value={form.role}
          onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
        >
          <option value="ORG_ADMIN">Org Admin (CXO)</option>
          <option value="MANAGER">Manager</option>
          <option value="EMPLOYEE">Employee</option>
        </select>
      </Field>
      <div style={{ background: 'rgba(67,97,238,0.05)', border: '1px solid rgba(67,97,238,0.15)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#4361EE', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Mail size={13} style={{ flexShrink: 0, marginTop: 1 }} />
        A welcome email with a temporary password will be sent. The user must reset it on first login.
      </div>
    </Modal>
  );
}

// ── Org Users Modal ─────────────────────────────────────────────
function OrgUsersModal({ org, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    superAdminService.getOrgUsers(org.id)
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [org.id]);

  return (
    <Modal
      title={`${org.name} — Users`}
      subtitle={`${users.length} member${users.length !== 1 ? 's' : ''} in this organization`}
      onClose={onClose}
      wide
      footer={
        <button className="sa-btn-cancel" onClick={onClose}>Close</button>
      }
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button className="sa-btn-primary" onClick={() => setShowAdd(true)}>
          <UserPlus size={14} /> Add Admin
        </button>
      </div>

      {loading ? (
        <div className="sa-spinner"><div className="sa-spinner-ring" /></div>
      ) : users.length === 0 ? (
        <div className="sa-empty">
          <div className="sa-empty-icon">👥</div>
          <h4>No users yet</h4>
          <p>Add an Org Admin to get started.</p>
        </div>
      ) : (
        <table className="sa-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>First Login</th>
              <th>Last Login</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: `linear-gradient(135deg, ${orgColor(u.id)[0]}, ${orgColor(u.id)[1]})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800, color: '#fff', fontFamily: 'Outfit',
                      flexShrink: 0,
                    }}>
                      {userInitials(u.displayName, u.email)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{u.displayName || '—'}</div>
                      <div style={{ fontSize: 11.5, color: '#94A3B8' }}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td><RoleBadge role={u.role} /></td>
                <td>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 11, fontWeight: 600,
                    color: u.isActive ? '#059669' : '#E11D48',
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  {u.isFirstLogin
                    ? <span style={{ fontSize: 11, fontWeight: 600, color: '#D97706', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} />Pending</span>
                    : <CheckCircle size={13} color="#059669" />}
                </td>
                <td style={{ fontSize: 12, color: '#94A3B8' }}>{timeAgo(u.lastLoginAt)}</td>
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
    </Modal>
  );
}

// ── Org Card ────────────────────────────────────────────────────
function OrgCard({ org, onRefresh, onViewUsers, onCreateCxo }) {
  const [updating, setUpdating] = useState(false);
  const colors = orgColor(org.id);

  async function changeStatus(status) {
    if (!window.confirm(`Set "${org.name}" to ${status}?`)) return;
    setUpdating(true);
    try {
      await superAdminService.updateOrgStatus(org.id, status);
      onRefresh();
    } catch {}
    finally { setUpdating(false); }
  }

  return (
    <div className="sa-org-card">
      <div className="sa-org-card-top">
        {/* Avatar */}
        <div
          className="sa-org-avatar"
          style={{ background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)` }}
        >
          {orgInitials(org.name)}
        </div>

        <div className="sa-org-info">
          <div className="sa-org-name">{org.name}</div>
          <div style={{ marginTop: 5 }}>
            <span className="sa-org-slug">/{org.slug}</span>
          </div>
        </div>

        <StatusBadge status={org.status} />
      </div>

      {/* Meta */}
      <div className="sa-org-meta">
        <span className="sa-org-meta-item">
          <Users size={12} />
          <span>{org.userCount} user{org.userCount !== 1 ? 's' : ''}</span>
        </span>
        <span className="sa-org-meta-item">
          <Calendar size={12} />
          <span>Created {formatDate(org.createdAt)}</span>
        </span>
        {org.trialEndsAt && org.status === 'TRIAL' && (
          <span className="sa-org-meta-item" style={{ color: '#D97706' }}>
            <Clock size={12} />
            <span>Trial ends {formatDate(org.trialEndsAt)}</span>
          </span>
        )}
        {org.suspendedAt && (
          <span className="sa-org-meta-item" style={{ color: '#E11D48' }}>
            <AlertCircle size={12} />
            <span>Suspended {formatDate(org.suspendedAt)}</span>
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="sa-org-actions">
        <button className="sa-action-btn primary" onClick={() => onViewUsers(org)}>
          <Eye size={11} /> Users
        </button>
        <button className="sa-action-btn primary" onClick={() => onCreateCxo(org)}>
          <UserPlus size={11} /> Add Admin
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

  // Modals
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [viewUsersOrg, setViewUsersOrg]   = useState(null);
  const [createCxoOrg, setCreateCxoOrg]   = useState(null);

  const loadOrgs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await superAdminService.getOrganizations();
      setOrgs(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to load organizations.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load users across all orgs when switching to users tab
  const loadAllUsers = useCallback(async () => {
    if (orgs.length === 0) return;
    try {
      const results = await Promise.allSettled(
        orgs.map(o => superAdminService.getOrgUsers(o.id).then(users => users.map(u => ({ ...u, orgName: o.name }))))
      );
      const users = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
      setAllUsers(users);
    } catch {}
  }, [orgs]);

  useEffect(() => { loadOrgs(); }, [loadOrgs]);
  useEffect(() => { if (tab === 'users') loadAllUsers(); }, [tab, loadAllUsers]);

  // Derived stats
  const stats = {
    total:     orgs.length,
    active:    orgs.filter(o => o.status === 'ACTIVE').length,
    trial:     orgs.filter(o => o.status === 'TRIAL').length,
    suspended: orgs.filter(o => o.status === 'SUSPENDED').length,
  };

  // Filter orgs
  const filteredOrgs = orgs.filter(o => {
    const matchSearch = !search ||
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Filter users
  const filteredUsers = allUsers.filter(u =>
    !search ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.orgName || '').toLowerCase().includes(search.toLowerCase())
  );

  const initials = userInitials(currentUser?.displayName, currentUser?.email);

  return (
    <div className="sa-root">

      {/* ── Sidebar ──────────────────────────────── */}
      <aside className="sa-sidebar">
        {/* Brand */}
        <div className="sa-sidebar-brand">
          <div className="sa-brand-logo"><span>AB</span></div>
          <div className="sa-brand-text">
            <div className="sa-brand-name">Ambot365 Tracker</div>
            <div className="sa-brand-sub">Platform Admin</div>
          </div>
        </div>

        {/* Platform indicator */}
        <div className="sa-platform-badge">
          <div className="sa-platform-badge-pill">
            <span className="sa-platform-dot" />
            SUPER ADMIN PORTAL
          </div>
        </div>

        {/* Nav */}
        <nav className="sa-nav">
          <div className="sa-nav-section">
            <div className="sa-nav-section-title">Platform</div>
            <button
              className={`sa-nav-item ${tab === 'orgs' ? 'active' : ''}`}
              onClick={() => setTab('orgs')}
            >
              <span className="sa-nav-item-icon"><Building2 size={15} /></span>
              Organizations
              {orgs.length > 0 && <span className="sa-nav-count">{orgs.length}</span>}
            </button>
            <button
              className={`sa-nav-item ${tab === 'users' ? 'active' : ''}`}
              onClick={() => setTab('users')}
            >
              <span className="sa-nav-item-icon"><Users size={15} /></span>
              All Users
              {allUsers.length > 0 && <span className="sa-nav-count">{allUsers.length}</span>}
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
                  <span className={`sa-status-dot`} style={{
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

        {/* User card */}
        <div className="sa-sidebar-footer">
          <div className="sa-user-card">
            <div className="sa-user-avatar">{initials}</div>
            <div className="sa-user-info">
              <div className="sa-user-name">{currentUser?.displayName || currentUser?.email}</div>
              <div className="sa-user-role">Super Admin</div>
            </div>
            <button
              className="sa-logout-btn"
              onClick={logout}
              title="Sign out"
            >
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
            <h1>
              {tab === 'orgs' ? 'Organizations' : 'All Users'}
            </h1>
            <p>
              {tab === 'orgs'
                ? `${stats.active} active · ${stats.trial} trial · ${stats.suspended} suspended`
                : `${allUsers.length} users across ${orgs.length} organizations`}
            </p>
          </div>

          {/* Search */}
          <div className="sa-search-wrap" style={{ width: 220 }}>
            <Search size={13} className="sa-search-icon" />
            <input
              className="sa-input sa-search"
              placeholder={tab === 'orgs' ? 'Search orgs…' : 'Search users…'}
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

          {/* ── Stats row ── */}
          <div className="sa-stats-row">
            {[
              { label: 'Total Orgs', value: stats.total, color: '#4361EE', icon: <Building2 size={18} />, bg: 'rgba(67,97,238,0.10)' },
              { label: 'Active',     value: stats.active,    color: '#059669', icon: <CheckCircle size={18} />, bg: 'rgba(16,185,129,0.10)' },
              { label: 'Trial',      value: stats.trial,     color: '#D97706', icon: <Clock size={18} />, bg: 'rgba(245,158,11,0.10)' },
              { label: 'Suspended',  value: stats.suspended, color: '#E11D48', icon: <Pause size={18} />, bg: 'rgba(244,63,94,0.10)' },
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

          {/* ── Status tab pills (org view) ── */}
          {tab === 'orgs' && (
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

              {/* Org grid */}
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
                    />
                  ))}
                </div>
              )}
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
                              }}>
                                {userInitials(u.displayName, u.email)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>
                                  {u.displayName || '—'}
                                </div>
                                <div style={{ fontSize: 11.5, color: '#94A3B8' }}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{u.orgName}</span>
                          </td>
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
        </div>
      </div>

      {/* ── Modals ──────────────────────────────── */}
      {showCreateOrg && (
        <CreateOrgModal
          onClose={() => setShowCreateOrg(false)}
          onCreated={org => { setOrgs(prev => [...prev, org]); }}
        />
      )}
      {viewUsersOrg && (
        <OrgUsersModal org={viewUsersOrg} onClose={() => setViewUsersOrg(null)} />
      )}
      {createCxoOrg && (
        <CreateCxoModal
          org={createCxoOrg}
          onClose={() => setCreateCxoOrg(null)}
          onCreated={() => loadOrgs()}
        />
      )}
    </div>
  );
}
