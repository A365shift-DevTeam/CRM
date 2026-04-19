import React, { useState, useEffect } from 'react';
import { FaShieldHalved, FaShield, FaUsers, FaUserGear, FaKey, FaToggleOn, FaToggleOff, FaPen, FaPlus, FaTrash, FaLock, FaUserPlus, FaMobileScreen } from 'react-icons/fa6';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast/ToastContext';
import './Admin.css';

export default function Admin() {
    const { currentUser } = useAuth();
    const toast = useToast();
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
        if (user.id === currentUser.id) return toast.warning("You cannot deactivate yourself.");
        try {
            const updated = await adminService.updateUserStatus(user.id, !user.isActive);
            setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
            toast.success(`User ${updated.isActive ? 'activated' : 'deactivated'} successfully`);
        } catch (err) {
            toast.error(err.message || 'Failed to update user status');
        }
    };

    const handleSaveUserRoles = async (userId, roleIds) => {
        try {
            const updated = await adminService.updateUserRoles(userId, roleIds);
            setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
            setModalType(null);
            toast.success('User roles updated successfully');
        } catch (err) {
            toast.error(err.message || 'Failed to update user roles');
        }
    };

    const handleDeleteUser = async (user) => {
        if (user.id === currentUser.id) return toast.warning("You cannot delete yourself.");
        if (!window.confirm(`Are you sure you want to delete "${user.displayName || user.email}"? This action cannot be undone.`)) return;
        try {
            await adminService.deleteUser(user.id);
            setUsers(prev => prev.filter(u => u.id !== user.id));
            toast.success('User deleted successfully');
        } catch (err) {
            toast.error(err.message || 'Failed to delete user');
        }
    };

    const handleCreateUser = async (data) => {
        try {
            const created = await adminService.createUser(data);
            setUsers(prev => [...prev, created]);
            setModalType(null);
            toast.success(`User "${created.displayName || created.email}" created successfully`);
        } catch (err) {
            toast.error(err.message || 'Failed to create user');
        }
    };

    const handleUpdateUser = async (userId, data) => {
        try {
            const updated = await adminService.updateUser(userId, data);
            setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
            setModalType(null);
            toast.success(`User "${updated.displayName || updated.email}" updated successfully`);
        } catch (err) {
            toast.error(err.message || 'Failed to update user');
        }
    };

    const handleResetPassword = async (userId, newPassword) => {
        try {
            await adminService.resetUserPassword(userId, newPassword);
            setModalType(null);
            toast.success('Password has been reset successfully');
        } catch (err) {
            toast.error(err.message || 'Failed to reset password');
        }
    };

    const handleSave2FA = async (userId, enabled, method) => {
        try {
            if (enabled) {
                await adminService.setUserTwoFactor(userId, true, method);
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, twoFactorRequired: true, twoFactorMethod: method } : u));
                toast.success('Email OTP enabled for user');
            } else {
                await adminService.removeUserTwoFactor(userId);
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, twoFactorRequired: false } : u));
                toast.success('2FA requirement removed for user');
            }
            setModalType(null);
        } catch (err) {
            toast.error(err.message || 'Failed to update 2FA setting');
        }
    };

    const handleResetTotp = async (userId) => {
        try {
            await adminService.resetUserTotp(userId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isTotpEnabled: false, twoFactorRequired: false, twoFactorMethod: 'email' } : u));
            toast.success('TOTP has been reset for this user');
            setModalType(null);
        } catch (err) {
            toast.error(err.message || 'Failed to reset TOTP');
        }
    };

    const handleRequireTotp = async (userId) => {
        try {
            await adminService.requireUserTotp(userId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, twoFactorRequired: true, twoFactorMethod: 'totp' } : u));
            toast.success('TOTP required — user must set it up via Settings');
            setModalType(null);
        } catch (err) {
            toast.error(err.message || 'Failed to require TOTP');
        }
    };

    // ─── Role Actions ──────────────────────────────────────────

    const handleSaveRole = async (roleId, data) => {
        try {
            if (roleId) {
                const updated = await adminService.updateRole(roleId, data);
                setRoles(prev => prev.map(r => r.id === updated.id ? updated : r));
                toast.success(`Role "${updated.name}" updated successfully`);
            } else {
                const created = await adminService.createRole(data);
                setRoles(prev => [...prev, created]);
                toast.success(`Role "${created.name}" created successfully`);
            }
            setModalType(null);
        } catch (err) {
            toast.error(err.message || 'Failed to save role');
        }
    };

    const handleDeleteRole = async (roleId) => {
        if (!window.confirm('Delete this role?')) return;
        try {
            await adminService.deleteRole(roleId);
            setRoles(prev => prev.filter(r => r.id !== roleId));
            toast.success('Role deleted successfully');
        } catch (err) {
            toast.error(err.message || 'Failed to delete role');
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

                {activeTab === 'users' && (
                    <button className="admin-add-btn" onClick={() => { setModalType('createUser'); setModalData(null); }}>
                        <FaUserPlus size={12} /> New User
                    </button>
                )}

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
                                <th>2FA</th>
                                <th>Last Login</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => {
                                const twoFALabel = user.isTotpEnabled
                                    ? 'TOTP'
                                    : user.twoFactorRequired
                                        ? 'Email OTP'
                                        : 'Off';
                                const twoFAColor = user.isTotpEnabled
                                    ? { background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }
                                    : user.twoFactorRequired
                                        ? { background: 'rgba(67,97,238,0.12)', color: '#4361EE', border: '1px solid rgba(67,97,238,0.3)' }
                                        : { background: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)' };
                                return (
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
                                    <td>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, ...twoFAColor }}>
                                            {user.isTotpEnabled ? <FaMobileScreen size={10} /> : <FaShield size={10} />}
                                            {twoFALabel}
                                        </span>
                                    </td>
                                    <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td>
                                        <div className="admin-actions">
                                            <div
                                                className="admin-action-icon edit"
                                                title="Edit User"
                                                onClick={() => { setModalType('editUser'); setModalData(user); }}
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
                                                title="Manage 2FA"
                                                onClick={() => { setModalType('manage2FA'); setModalData(user); }}
                                                style={{ color: (user.twoFactorRequired || user.isTotpEnabled) ? '#4361EE' : undefined }}
                                            >
                                                <FaShield size={14} />
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
                                );
                            })}
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

            {(modalType === 'createUser' || modalType === 'editUser') && (
                <CreateEditUserModal
                    user={modalType === 'editUser' ? modalData : null}
                    roles={roles}
                    onCreate={handleCreateUser}
                    onUpdate={handleUpdateUser}
                    onClose={() => setModalType(null)}
                />
            )}

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

            {modalType === 'manage2FA' && modalData && (
                <Manage2FAModal
                    user={modalData}
                    onSaveEmailOtp={handleSave2FA}
                    onResetTotp={handleResetTotp}
                    onRequireTotp={handleRequireTotp}
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

// ─── Create / Edit User Modal ──────────────────────────────────

function CreateEditUserModal({ user, roles, onCreate, onUpdate, onClose }) {
    const isEdit = !!user;
    const [email, setEmail] = useState(user?.email || '');
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isActive, setIsActive] = useState(user?.isActive ?? true);
    const [selectedRoleIds, setSelectedRoleIds] = useState(
        user ? roles.filter(r => user.roles.includes(r.name)).map(r => r.id) : []
    );

    const toggleRole = (id) => {
        setSelectedRoleIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSubmit = () => {
        if (!email.trim()) return alert('Email is required.');
        if (!isEdit) {
            if (!password.trim()) return alert('Password is required.');
            if (password.length < 6) return alert('Password must be at least 6 characters.');
            if (password !== confirmPassword) return alert('Passwords do not match.');
            onCreate({
                email: email.trim(),
                displayName: displayName.trim() || null,
                password,
                roleIds: selectedRoleIds,
                isActive
            });
        } else {
            onUpdate(user.id, {
                email: email.trim(),
                displayName: displayName.trim() || null,
                roleIds: selectedRoleIds,
                isActive
            });
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-box-header">
                    <h3>{isEdit ? `Edit User — ${user.displayName || user.email}` : 'Create New User'}</h3>
                </div>
                <div className="modal-box-body">
                    <div className="mb-3">
                        <label className="form-label fw-bold" style={{ fontSize: '0.85rem' }}>Display Name</label>
                        <input
                            className="form-control form-control-sm"
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            placeholder="Enter display name"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-bold" style={{ fontSize: '0.85rem' }}>Email</label>
                        <input
                            type="email"
                            className="form-control form-control-sm"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Enter email address"
                        />
                    </div>

                    {!isEdit && (
                        <>
                            <div className="mb-3">
                                <label className="form-label fw-bold" style={{ fontSize: '0.85rem' }}>Password</label>
                                <input
                                    type="password"
                                    className="form-control form-control-sm"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter password (min 6 characters)"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-bold" style={{ fontSize: '0.85rem' }}>Confirm Password</label>
                                <input
                                    type="password"
                                    className="form-control form-control-sm"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm password"
                                />
                            </div>
                        </>
                    )}

                    <div className="mb-3">
                        <label className="form-label fw-bold" style={{ fontSize: '0.85rem' }}>Roles</label>
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

                    <div className="mb-3">
                        <label className="form-label fw-bold" style={{ fontSize: '0.85rem' }}>Status</label>
                        <div
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                            onClick={() => setIsActive(prev => !prev)}
                        >
                            {isActive ? <FaToggleOn size={22} color="#22c55e" /> : <FaToggleOff size={22} color="#94a3b8" />}
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isActive ? '#22c55e' : '#94a3b8' }}>
                                {isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="modal-box-footer">
                    <button className="modal-btn cancel" onClick={onClose}>Cancel</button>
                    <button className="modal-btn primary" onClick={handleSubmit}>
                        {isEdit ? 'Update User' : 'Create User'}
                    </button>
                </div>
            </div>
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

// ─── Manage 2FA Modal ─────────────────────────────────────────

function Manage2FAModal({ user, onSaveEmailOtp, onResetTotp, onRequireTotp, onClose }) {
    const emailOtpOn = user.twoFactorRequired && user.twoFactorMethod === 'email' && !user.isTotpEnabled;
    const totpRequiredNotSetup = user.twoFactorRequired && user.twoFactorMethod === 'totp' && !user.isTotpEnabled;
    const [emailEnabled, setEmailEnabled] = useState(emailOtpOn);
    const [confirm, setConfirm] = useState(null); // 'reset-totp' | 'require-totp'

    const statusLabel = user.isTotpEnabled
        ? 'TOTP (authenticator app)'
        : totpRequiredNotSetup
            ? 'TOTP required — setup pending'
            : user.twoFactorRequired
                ? 'Email OTP'
                : 'None';
    const statusColor = user.isTotpEnabled
        ? '#10b981'
        : totpRequiredNotSetup
            ? '#f59e0b'
            : user.twoFactorRequired
                ? '#4361EE'
                : '#94a3b8';

    const sectionStyle = { padding: '14px 16px', borderRadius: 10, marginBottom: 12, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(248,250,252,0.6)' };

    if (confirm === 'reset-totp') {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-box" onClick={e => e.stopPropagation()}>
                    <div className="modal-box-header">
                        <h3>Reset TOTP — {user.displayName || user.email}</h3>
                    </div>
                    <div className="modal-box-body">
                        <div className="p-3 rounded mb-3" style={{ background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.2)', fontSize: '0.85rem', color: '#f43f5e' }}>
                            This will <strong>permanently remove</strong> the user's authenticator app setup. They will need to re-enroll via Settings &gt; Security.
                        </div>
                    </div>
                    <div className="modal-box-footer">
                        <button className="modal-btn cancel" onClick={() => setConfirm(null)}>Cancel</button>
                        <button className="modal-btn warning" onClick={() => onResetTotp(user.id)}>Reset TOTP</button>
                    </div>
                </div>
            </div>
        );
    }

    if (confirm === 'require-totp') {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-box" onClick={e => e.stopPropagation()}>
                    <div className="modal-box-header">
                        <h3>Require TOTP — {user.displayName || user.email}</h3>
                    </div>
                    <div className="modal-box-body">
                        <div className="p-3 rounded mb-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', fontSize: '0.85rem', color: '#d97706' }}>
                            The user will be allowed to log in but will see a prompt to set up their authenticator app via <strong>Settings &gt; Security</strong> before full access is enforced.
                        </div>
                    </div>
                    <div className="modal-box-footer">
                        <button className="modal-btn cancel" onClick={() => setConfirm(null)}>Cancel</button>
                        <button className="modal-btn primary" onClick={() => onRequireTotp(user.id)}>Require TOTP</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-box-header">
                    <h3>Manage 2FA — {user.displayName || user.email}</h3>
                </div>
                <div className="modal-box-body">

                    {/* Status row */}
                    <div className="mb-3 p-3 rounded d-flex align-items-center gap-2" style={{ background: 'rgba(67,97,238,0.05)', border: '1px solid rgba(67,97,238,0.12)' }}>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Current 2FA:</span>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: statusColor }}>{statusLabel}</span>
                    </div>

                    {/* ── Email OTP section ── */}
                    <div style={sectionStyle}>
                        <div className="d-flex align-items-center justify-content-between mb-1">
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                Email OTP
                            </div>
                            {!user.isTotpEnabled && !totpRequiredNotSetup && (
                                <div
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                                    onClick={() => setEmailEnabled(prev => !prev)}
                                >
                                    {emailEnabled ? <FaToggleOn size={20} color="#4361EE" /> : <FaToggleOff size={20} color="#94a3b8" />}
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: emailEnabled ? '#4361EE' : '#94a3b8' }}>
                                        {emailEnabled ? 'On' : 'Off'}
                                    </span>
                                </div>
                            )}
                        </div>
                        <p style={{ fontSize: '0.77rem', color: '#94a3b8', margin: 0 }}>
                            User receives a 6-digit code by email on each login.
                        </p>
                        {(user.isTotpEnabled || totpRequiredNotSetup) && (
                            <p style={{ fontSize: '0.77rem', color: '#f59e0b', marginTop: 4 }}>
                                TOTP is {user.isTotpEnabled ? 'active' : 'required'}. Disable it first to switch to Email OTP.
                            </p>
                        )}
                    </div>

                    {/* ── TOTP section ── */}
                    <div style={sectionStyle}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                            Authenticator App (TOTP)
                        </div>
                        {user.isTotpEnabled ? (
                            <div>
                                <p style={{ fontSize: '0.77rem', color: '#10b981', marginBottom: 8 }}>
                                    Active — user has configured their authenticator app.
                                </p>
                                <button
                                    onClick={() => setConfirm('reset-totp')}
                                    className="px-3 py-1 rounded-lg text-xs font-medium"
                                    style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', cursor: 'pointer' }}
                                >
                                    Reset TOTP
                                </button>
                            </div>
                        ) : totpRequiredNotSetup ? (
                            <div>
                                <p style={{ fontSize: '0.77rem', color: '#d97706', marginBottom: 8 }}>
                                    Required by admin — user has not yet set it up.
                                </p>
                                <button
                                    onClick={() => onResetTotp(user.id)}
                                    className="px-3 py-1 rounded-lg text-xs font-medium"
                                    style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', cursor: 'pointer' }}
                                >
                                    Cancel Requirement
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p style={{ fontSize: '0.77rem', color: '#94a3b8', marginBottom: 8 }}>
                                    Not enabled. Admin can require the user to set it up.
                                </p>
                                <button
                                    onClick={() => setConfirm('require-totp')}
                                    className="px-3 py-1 rounded-lg text-xs font-medium text-white"
                                    style={{ background: '#10b981', border: 'none', cursor: 'pointer' }}
                                >
                                    Require TOTP
                                </button>
                            </div>
                        )}
                    </div>

                </div>
                <div className="modal-box-footer">
                    <button className="modal-btn cancel" onClick={onClose}>Cancel</button>
                    {!user.isTotpEnabled && !totpRequiredNotSetup && (
                        <button className="modal-btn primary" onClick={() => onSaveEmailOtp(user.id, emailEnabled, 'email')}>
                            Save
                        </button>
                    )}
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
