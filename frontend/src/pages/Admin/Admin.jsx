import React, { useState, useEffect } from 'react';
import { FaShieldHalved, FaUsers, FaUserGear, FaKey, FaToggleOn, FaToggleOff, FaPen, FaPlus, FaTrash } from 'react-icons/fa6';
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
    const [modalType, setModalType] = useState(null); // 'editUserRoles' | 'editRole' | 'createRole'
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
            <h2><FaShieldHalved style={{ color: '#3b82f6' }} /> Admin Panel</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Manage users, roles, and permissions</p>

            <div className="admin-tabs">
                <button className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                    <FaUsers className="me-2" />Users ({users.length})
                </button>
                <button className={`admin-tab ${activeTab === 'roles' ? 'active' : ''}`} onClick={() => setActiveTab('roles')}>
                    <FaUserGear className="me-2" />Roles ({roles.length})
                </button>
                <button className={`admin-tab ${activeTab === 'permissions' ? 'active' : ''}`} onClick={() => setActiveTab('permissions')}>
                    <FaKey className="me-2" />Permissions ({permissions.length})
                </button>
            </div>

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
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td style={{ fontWeight: 600 }}>{user.displayName || '—'}</td>
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
                                        <span className={`status-dot ${user.isActive ? 'active' : 'inactive'}`} />
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </td>
                                    <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-outline-primary me-1"
                                            title="Edit Roles"
                                            onClick={() => { setModalType('editUserRoles'); setModalData(user); }}
                                        >
                                            <FaPen size={12} />
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-secondary"
                                            title={user.isActive ? 'Deactivate' : 'Activate'}
                                            onClick={() => handleToggleUserStatus(user)}
                                            disabled={user.id === currentUser.id}
                                        >
                                            {user.isActive ? <FaToggleOn size={14} /> : <FaToggleOff size={14} />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'roles' && (
                <>
                    <div className="mb-3">
                        <button className="btn btn-primary btn-sm" onClick={() => { setModalType('createRole'); setModalData(null); }}>
                            <FaPlus className="me-1" /> New Role
                        </button>
                    </div>
                    <div className="admin-card">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Role</th>
                                    <th>Description</th>
                                    <th>Permissions</th>
                                    <th>Type</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roles.map(role => (
                                    <tr key={role.id}>
                                        <td style={{ fontWeight: 600 }}>
                                            <span className={`role-badge ${role.name.toLowerCase()}`}>{role.name}</span>
                                        </td>
                                        <td style={{ color: '#64748b' }}>{role.description || '—'}</td>
                                        <td>
                                            <span style={{ color: '#3b82f6', fontWeight: 600 }}>{role.permissions.length}</span>
                                            <span style={{ color: '#94a3b8' }}> permissions</span>
                                        </td>
                                        <td>{role.isSystem ? 'System' : 'Custom'}</td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-outline-primary me-1"
                                                onClick={() => { setModalType('editRole'); setModalData(role); }}
                                            >
                                                <FaPen size={12} />
                                            </button>
                                            {!role.isSystem && (
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDeleteRole(role.id)}
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

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
                                    <td style={{ fontWeight: 600 }}>{perm.module}</td>
                                    <td>
                                        <span style={{
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            background: perm.action === 'View' ? 'rgba(34,197,94,0.1)' :
                                                perm.action === 'Create' ? 'rgba(59,130,246,0.1)' :
                                                    perm.action === 'Edit' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                                            color: perm.action === 'View' ? '#16a34a' :
                                                perm.action === 'Create' ? '#2563eb' :
                                                    perm.action === 'Edit' ? '#d97706' : '#dc2626'
                                        }}>
                                            {perm.action}
                                        </span>
                                    </td>
                                    <td><code style={{ fontSize: '0.8rem', color: '#6366f1' }}>{perm.code}</code></td>
                                    <td style={{ color: '#64748b' }}>{perm.description}</td>
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
                <h3>Edit Roles — {user.displayName || user.email}</h3>
                <div className="d-flex flex-column gap-2 mb-3">
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
                <div className="d-flex gap-2 justify-content-end">
                    <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-sm btn-primary" onClick={() => onSave(user.id, selectedRoleIds)}>
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
                <h3>{role ? `Edit Role — ${role.name}` : 'Create New Role'}</h3>

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

                <div className="d-flex gap-2 justify-content-end">
                    <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-sm btn-primary" onClick={handleSubmit}>
                        {role ? 'Update Role' : 'Create Role'}
                    </button>
                </div>
            </div>
        </div>
    );
}
