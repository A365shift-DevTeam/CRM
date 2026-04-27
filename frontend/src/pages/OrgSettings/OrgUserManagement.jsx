import React, { useEffect, useState } from 'react';
import { organizationService } from '../../services/organizationService';
import { apiClient } from '../../services/apiClient';

export default function OrgUserManagement() {
    const [users, setUsers] = useState([]);
    const [allPerms, setAllPerms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [permRole, setPermRole] = useState(null); // 'MANAGER' | 'EMPLOYEE'
    const [rolePerms, setRolePerms] = useState([]);
    const [form, setForm] = useState({ email: '', displayName: '', role: 'EMPLOYEE' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => { loadUsers(); loadAllPerms(); }, []);

    async function loadUsers() {
        try {
            const data = await organizationService.getUsers();
            setUsers(data);
        } catch (e) {
            setError(e?.message || 'Failed to load users.');
        } finally {
            setLoading(false);
        }
    }

    async function loadAllPerms() {
        try {
            const data = await apiClient.get('/admin/permissions');
            setAllPerms(data);
        } catch { /* ignore */ }
    }

    async function openPermissions(role) {
        setPermRole(role);
        const codes = await organizationService.getRolePermissions(role);
        setRolePerms(codes);
    }

    async function savePermissions() {
        try {
            await organizationService.setRolePermissions(permRole, rolePerms);
            setSuccess(`${permRole} permissions saved.`);
            setPermRole(null);
        } catch (e) {
            setError(e?.message || 'Failed to save permissions.');
        }
    }

    async function handleCreate(e) {
        e.preventDefault();
        try {
            await organizationService.createUser(form);
            setShowCreate(false);
            setForm({ email: '', displayName: '', role: 'EMPLOYEE' });
            setSuccess('User created. Welcome email sent.');
            loadUsers();
        } catch (e) {
            setError(e?.message || 'Failed to create user.');
        }
    }

    async function handleDeactivate(userId) {
        if (!confirm('Deactivate this user?')) return;
        try {
            await organizationService.deactivateUser(userId);
            loadUsers();
        } catch (e) {
            setError(e?.message || 'Failed to deactivate user.');
        }
    }

    const grouped = allPerms.reduce((acc, p) => {
        (acc[p.module] = acc[p.module] || []).push(p);
        return acc;
    }, {});

    const s = {
        wrap: { padding: '1.5rem' },
        card: { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '0.75rem' },
        btn: (v = 'primary') => ({
            padding: '0.45rem 1rem', borderRadius: '7px', fontWeight: 600, cursor: 'pointer', border: 'none', fontSize: '13px',
            background: v === 'primary' ? '#4361EE' : v === 'danger' ? '#ef4444' : '#f1f5f9',
            color: v === 'ghost' ? '#374151' : '#fff',
        }),
        input: { width: '100%', padding: '0.55rem 0.85rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', marginBottom: '0.7rem' },
        select: { width: '100%', padding: '0.55rem 0.85rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', marginBottom: '0.7rem' },
    };

    return (
        <div style={s.wrap}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontWeight: 800, color: '#1e293b', margin: 0 }}>User Management</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={s.btn('ghost')} onClick={() => openPermissions('MANAGER')}>MANAGER Permissions</button>
                    <button style={s.btn('ghost')} onClick={() => openPermissions('EMPLOYEE')}>EMPLOYEE Permissions</button>
                    <button style={s.btn('primary')} onClick={() => setShowCreate(true)}>+ Add User</button>
                </div>
            </div>

            {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '0.65rem 1rem', color: '#dc2626', marginBottom: '1rem', fontSize: '13px' }}>{error}</div>}
            {success && <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', padding: '0.65rem 1rem', color: '#16a34a', marginBottom: '1rem', fontSize: '13px' }}>{success}</div>}

            {loading ? <p style={{ color: '#64748b' }}>Loading…</p> : users.map(u => (
                <div key={u.id} style={s.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontWeight: 700, color: '#1e293b' }}>{u.displayName || u.email}</div>
                            <div style={{ color: '#64748b', fontSize: '13px' }}>{u.email} · <strong>{u.role}</strong></div>
                            {u.isFirstLogin && <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 600 }}>First login pending</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: u.isActive ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                {u.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {u.isActive && u.role !== 'ORG_ADMIN' && (
                                <button style={s.btn('danger')} onClick={() => handleDeactivate(u.id)}>Deactivate</button>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {/* Create user modal */}
            {showCreate && (
                <Modal title="Add User" onClose={() => setShowCreate(false)}>
                    <form onSubmit={handleCreate}>
                        <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Email</label>
                        <input style={s.input} type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@company.com" />
                        <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Display Name</label>
                        <input style={s.input} value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} placeholder="John Doe" />
                        <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Role</label>
                        <select style={s.select} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                            <option value="EMPLOYEE">Employee</option>
                            <option value="MANAGER">Manager</option>
                        </select>
                        <button type="submit" style={{ ...s.btn('primary'), width: '100%', padding: '0.7rem' }}>Create & Send Welcome Email</button>
                    </form>
                </Modal>
            )}

            {/* Permissions modal */}
            {permRole && (
                <Modal title={`${permRole} Permissions`} onClose={() => setPermRole(null)}>
                    <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '1rem' }}>
                        Select which modules {permRole}s can access in your organization.
                    </p>
                    {Object.entries(grouped).map(([module, perms]) => (
                        <div key={module} style={{ marginBottom: '1rem' }}>
                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '13px', marginBottom: '0.4rem' }}>{module}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {perms.map(p => (
                                    <label key={p.code} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '13px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={rolePerms.includes(p.code)}
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
                    <button style={{ ...s.btn('primary'), width: '100%', padding: '0.7rem', marginTop: '0.75rem' }} onClick={savePermissions}>
                        Save Permissions
                    </button>
                </Modal>
            )}
        </div>
    );
}

function Modal({ title, onClose, children }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '1.75rem', width: '100%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontWeight: 700, color: '#1e293b', margin: 0 }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#64748b' }}>✕</button>
                </div>
                {children}
            </div>
        </div>
    );
}
