import React, { useState, useEffect } from 'react';
import { FaShieldHalved, FaUsers, FaUserGear, FaKey, FaToggleOn, FaToggleOff, FaPen, FaPlus, FaTrash, FaLock } from 'react-icons/fa6';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

export default function Admin() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [modalType, setModalType] = useState(null);
    const [modalData, setModalData] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [u, r, p] = await Promise.all([
                adminService.getUsers(),
                adminService.getRoles(),
                adminService.getPermissions()
            ]);
            setUsers(u);
            setRoles(r);
            setPermissions(p);
        } catch (err) {
            console.error('Failed to load admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    // ─── User Actions ──────────────────────────────────────────

    const handleToggleUserStatus = async (user) => {
        if (user.id === currentUser.id) return alert("You cannot deactivate yourself.");
        try {
            const updated = await adminService.updateUserStatus(user.id, !user.isActive);
            setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
        } catch (err) {
            alert(err.message);
        }
    };

    const handleSaveUserRoles = async (userId, roleIds) => {
        try {
            const updated = await adminService.updateUserRoles(userId, roleIds);
            setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
            setModalType(null);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteUser = async (user) => {
        if (user.id === currentUser.id) return alert("You cannot delete yourself.");
        if (!window.confirm(`Are you sure you want to delete "${user.displayName || user.email}"? This action cannot be undone.`)) return;
        try {
            await adminService.deleteUser(user.id);
            setUsers(prev => prev.filter(u => u.id !== user.id));
        } catch (err) {
            alert(err.message);
        }
    };

    const handleResetPassword = async (userId, newPassword) => {
        try {
            await adminService.resetUserPassword(userId, newPassword);
            setModalType(null);
            alert('Password has been reset successfully.');
        } catch (err) {
            alert(err.message);
        }
    };

    // ─── Role Actions ──────────────────────────────────────────

    const handleSaveRole = async (roleId, data) => {
        try {
            if (roleId) {
                const updated = await adminService.updateRole(roleId, data);
                setRoles(prev => prev.map(r => r.id === updated.id ? updated : r));
            } else {
                const created = await adminService.createRole(data);
                setRoles(prev => [...prev, created]);
            }
            setModalType(null);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteRole = async (roleId) => {
        if (!window.confirm('Delete this role?')) return;
        try {
            await adminService.deleteRole(roleId);
            setRoles(prev => prev.filter(r => r.id !== roleId));
        } catch (err) {
            alert(err.message);
        }
    };

    // ─── Render ────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="admin-page d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="spinner-border text-primary" />
            </div>
        );
    }

    return (
        <div className="admin-page">
            {/* Header */}
            <div className="admin-page-header">
                <h2><FaShieldHalved style={{ color: '#3b82f6' }} /> Admin Panel</h2>
                <p>Manage users, roles, and permissions</p>
            </div>

            {/* Stat Cards */}
            <div className="admin-stats-grid">
                <div className="admin-stat-card">
                    <div className="admin-stat-icon blue"><FaUsers size={24} /></div>
                    <div className="admin-stat-info">
                        <span className="admin-stat-label">Total Users</span>
                        <span className="admin-stat-number">{users.length}</span>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-icon green"><FaUserGear size={24} /></div>
                    <div className="admin-stat-info">
                        <span className="admin-stat-label">Roles</span>
                        <span className="admin-stat-number">{roles.length}</span>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-icon purple"><FaKey size={24} /></div>
                    <div className="admin-stat-info">
                        <span className="admin-stat-label">Permissions</span>
                        <span className="admin-stat-number">{permissions.length}</span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="admin-toolbar">
                <div className="admin-tabs">
                    <button className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                        <FaUsers size={14} /> Users <span className="tab-count">{users.length}</span>
                    </button>
                    <button className={`admin-tab ${activeTab === 'roles' ? 'active' : ''}`} onClick={() => setActiveTab('roles')}>
                        <FaUserGear size={14} /> Roles <span className="tab-count">{roles.length}</span>
                    </button>
                    <button className={`admin-tab ${activeTab === 'permissions' ? 'active' : ''}`} onClick={() => setActiveTab('permissions')}>
                        <FaKey size={14} /> Permissions <span className="tab-count">{permissions.length}</span>
                    </button>
                </div>

                {activeTab === 'roles' && (
                    <button className="admin-add-btn" onClick={() => { setModalType('createRole'); setModalData(null); }}>
                        <FaPlus size={12} /> New Role
                    </button>
                )}
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="admin-card">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Roles</th>
                                <th>Status</th>
                                <th>Last Login</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.displayName || '—'}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        {user.roles.map(r => (
                                            <span key={r} className={`role-badge ${r.toLowerCase()}`} style={{ marginRight: 4 }}>
                                                {r}
                                            </span>
                                        ))}
                                        {user.roles.length === 0 && <span style={{ color: '#94a3b8' }}>No role</span>}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                                            <span className={`status-dot ${user.isActive ? 'active' : 'inactive'}`} />
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td>
                                        <div className="admin-actions">
                                            <div
                                                className="admin-action-icon edit"
                                                title="Edit Roles"
                                                onClick={() => { setModalType('editUserRoles'); setModalData(user); }}
                                            >
                                                <FaPen size={14} />
                                            </div>
                                            <div
                                                className={`admin-action-icon toggle ${user.isActive ? '' : 'inactive'} ${user.id === currentUser.id ? 'disabled' : ''}`}
                                                title={user.isActive ? 'Deactivate' : 'Activate'}
                                                onClick={() => user.id !== currentUser.id && handleToggleUserStatus(user)}
                                            >
                                                {user.isActive ? <FaToggleOn size={18} /> : <FaToggleOff size={18} />}
                                            </div>
                                            <div
                                                className="admin-action-icon password"
                                                title="Change Password"
                                                onClick={() => { setModalType('resetPassword'); setModalData(user); }}
                                            >
                                                <FaLock size={14} />
                                            </div>
                                            <div
                                                className={`admin-action-icon delete ${user.id === currentUser.id ? 'disabled' : ''}`}
                                                title="Delete User"
                                                onClick={() => user.id !== currentUser.id && handleDeleteUser(user)}
                                            >
                                                <FaTrash size={14} />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Roles Tab */}
            {activeTab === 'roles' && (
                <div className="admin-card">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Role</th>
                                <th>Description</th>
                                <th>Permissions</th>
                                <th>Type</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map(role => (
                                <tr key={role.id}>
                                    <td style={{ fontWeight: 600 }}>
                                        <span className={`role-badge ${role.name.toLowerCase()}`}>{role.name}</span>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)' }}>{role.description || '—'}</td>
                                    <td>
                                        <span style={{ color: '#3b82f6', fontWeight: 700 }}>{role.permissions.length}</span>
                                        <span style={{ color: '#94a3b8', marginLeft: 4 }}>permissions</span>
                                    </td>
                                    <td>
                                        <span className={`type-badge ${role.isSystem ? 'system' : 'custom'}`}>
                                            {role.isSystem ? 'System' : 'Custom'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="admin-actions">
                                            <div
                                                className="admin-action-icon edit"
                                                title="Edit Role"
                                                onClick={() => { setModalType('editRole'); setModalData(role); }}
                                            >
                                                <FaPen size={14} />
                                            </div>
                                            {!role.isSystem && (
                                                <div
                                                    className="admin-action-icon delete"
                                                    title="Delete Role"
                                                    onClick={() => handleDeleteRole(role.id)}
                                                >
                                                    <FaTrash size={14} />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Permissions Tab */}
            {activeTab === 'permissions' && (
                <div className="admin-card">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Module</th>
                                <th>Action</th>
                                <th>Code</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {permissions.map(perm => (
                                <tr key={perm.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{perm.module}</td>
                                    <td>
                                        <span className={`action-badge ${perm.action.toLowerCase()}`}>
                                            {perm.action}
                                        </span>
                                    </td>
                                    <td><code style={{ fontSize: '0.8rem', color: '#6366f1' }}>{perm.code}</code></td>
                                    <td style={{ color: 'var(--text-muted)' }}>{perm.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ─── Modals ──────────────────────────────────────────── */}

            {modalType === 'editUserRoles' && modalData && (
                <EditUserRolesModal
                    user={modalData}
                    roles={roles}
                    onSave={handleSaveUserRoles}
                    onClose={() => setModalType(null)}
                />
            )}

            {modalType === 'resetPassword' && modalData && (
                <ResetPasswordModal
                    user={modalData}
                    onSave={handleResetPassword}
                    onClose={() => setModalType(null)}
                />
            )}

            {(modalType === 'editRole' || modalType === 'createRole') && (
                <EditRoleModal
                    role={modalType === 'editRole' ? modalData : null}
                    permissions={permissions}
                    onSave={handleSaveRole}
                    onClose={() => setModalType(null)}
                />
            )}
        </div>
    );
}

// ─── Edit User Roles Modal ─────────────────────────────────────

function EditUserRolesModal({ user, roles, onSave, onClose }) {
    const [selectedRoleIds, setSelectedRoleIds] = useState(
        roles.filter(r => user.roles.includes(r.name)).map(r => r.id)
    );

    const toggleRole = (id) => {
        setSelectedRoleIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-box-header">
                    <h3>Edit Roles — {user.displayName || user.email}</h3>
                </div>
                <div className="modal-box-body">
                    <div className="d-flex flex-column gap-2">
                        {roles.map(role => (
                            <label key={role.id} className={`perm-check ${selectedRoleIds.includes(role.id) ? 'checked' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={selectedRoleIds.includes(role.id)}
                                    onChange={() => toggleRole(role.id)}
                                />
                                <span style={{ fontWeight: 600 }}>{role.name}</span>
                                <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>— {role.description}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="modal-box-footer">
                    <button className="modal-btn cancel" onClick={onClose}>Cancel</button>
                    <button className="modal-btn primary" onClick={() => onSave(user.id, selectedRoleIds)}>
                        Save Roles
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Edit/Create Role Modal ─────────────────────────────────────

function EditRoleModal({ role, permissions, onSave, onClose }) {
    const [name, setName] = useState(role?.name || '');
    const [description, setDescription] = useState(role?.description || '');
    const [selectedPermIds, setSelectedPermIds] = useState(
        role ? permissions.filter(p => role.permissions.includes(p.code)).map(p => p.id) : []
    );

    const togglePerm = (id) => {
        setSelectedPermIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleModule = (module) => {
        const modulePerms = permissions.filter(p => p.module === module);
        const allSelected = modulePerms.every(p => selectedPermIds.includes(p.id));
        if (allSelected) {
            setSelectedPermIds(prev => prev.filter(id => !modulePerms.find(p => p.id === id)));
        } else {
            const newIds = modulePerms.map(p => p.id).filter(id => !selectedPermIds.includes(id));
            setSelectedPermIds(prev => [...prev, ...newIds]);
        }
    };

    const modules = [...new Set(permissions.map(p => p.module))];

    const handleSubmit = () => {
        if (!name.trim()) return alert('Role name is required.');
        onSave(role?.id || null, {
            name: name.trim(),
            description: description.trim(),
            permissionIds: selectedPermIds
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-box-header">
                    <h3>{role ? `Edit Role — ${role.name}` : 'Create New Role'}</h3>
                </div>
                <div className="modal-box-body">
                    <div className="mb-3">
                        <label className="form-label fw-bold" style={{ fontSize: '0.85rem' }}>Role Name</label>
                        <input
                            className="form-control form-control-sm"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            disabled={role?.isSystem}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-bold" style={{ fontSize: '0.85rem' }}>Description</label>
                        <input
                            className="form-control form-control-sm"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-bold" style={{ fontSize: '0.85rem' }}>
                            Permissions ({selectedPermIds.length} selected)
                        </label>
                        {modules.map(module => {
                            const modulePerms = permissions.filter(p => p.module === module);
                            const allChecked = modulePerms.every(p => selectedPermIds.includes(p.id));
                            const someChecked = modulePerms.some(p => selectedPermIds.includes(p.id));
                            return (
                                <div key={module} style={{ marginBottom: '0.75rem' }}>
                                    <label
                                        style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}
                                        onClick={() => toggleModule(module)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={allChecked}
                                            ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                                            readOnly
                                        />
                                        {module}
                                    </label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', paddingLeft: '1.5rem' }}>
                                        {modulePerms.map(perm => (
                                            <label key={perm.id} className={`perm-check ${selectedPermIds.includes(perm.id) ? 'checked' : ''}`} style={{ fontSize: '0.75rem' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPermIds.includes(perm.id)}
                                                    onChange={() => togglePerm(perm.id)}
                                                />
                                                {perm.action}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="modal-box-footer">
                    <button className="modal-btn cancel" onClick={onClose}>Cancel</button>
                    <button className="modal-btn primary" onClick={handleSubmit}>
                        {role ? 'Update Role' : 'Create Role'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Reset Password Modal ─────────────────────────────────────

function ResetPasswordModal({ user, onSave, onClose }) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = () => {
        if (!newPassword.trim()) return alert('Password is required.');
        if (newPassword.length < 6) return alert('Password must be at least 6 characters.');
        if (newPassword !== confirmPassword) return alert('Passwords do not match.');
        onSave(user.id, newPassword);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-box-header">
                    <h3>Change Password — {user.displayName || user.email}</h3>
                </div>
                <div className="modal-box-body">
                    <div className="mb-3">
                        <label className="form-label fw-bold" style={{ fontSize: '0.85rem' }}>New Password</label>
                        <input
                            type="password"
                            className="form-control form-control-sm"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-bold" style={{ fontSize: '0.85rem' }}>Confirm Password</label>
                        <input
                            type="password"
                            className="form-control form-control-sm"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                        />
                    </div>
                </div>
                <div className="modal-box-footer">
                    <button className="modal-btn cancel" onClick={onClose}>Cancel</button>
                    <button className="modal-btn warning" onClick={handleSubmit}>
                        Reset Password
                    </button>
                </div>
            </div>
        </div>
    );
}
