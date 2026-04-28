import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaShieldHalved, FaShield, FaUsers, FaKey, FaToggleOn, FaToggleOff, FaMobileScreen, FaTicket, FaReply } from 'react-icons/fa6';
import { Send, Lock, UserPlus, Pencil, UserCheck, Ban, Save, X, Trash2, Plus, ShieldCheck } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { organizationService } from '../../services/organizationService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast/ToastContext';
import StatsGrid from '../../components/StatsGrid/StatsGrid';
import PageHeader from '../../components/PageHeader/PageHeader';
import './Admin.css';

const PRIORITY_BADGE_COLOR = { Critical: '#F43F5E', High: '#F59E0B', Medium: '#4361EE', Low: '#94A3B8' };
const STATUS_BADGE = { 'Open': '#3b82f6', 'In Progress': '#8b5cf6', 'Pending': '#f59e0b', 'Resolved': '#10b981', 'Closed': '#64748b' };
const TICKET_STATUSES = ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'];
const ROLE_COLORS = {
    SUPER_ADMIN: { bg: 'rgba(239,68,68,0.1)', color: '#dc2626' },
    ORG_ADMIN:   { bg: 'rgba(139,92,246,0.1)', color: '#7c3aed' },
    MANAGER:     { bg: 'rgba(67,97,238,0.1)', color: '#4361EE' },
    EMPLOYEE:    { bg: 'rgba(34,197,94,0.1)', color: '#16a34a' },
};

export default function Admin() {
    const { currentUser } = useAuth();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [tickets, setTickets] = useState([]);
    const [ticketsLoading, setTicketsLoading] = useState(false);
    const [ticketPage, setTicketPage] = useState(1);
    const [ticketTotal, setTicketTotal] = useState(0);
    const [replyTicket, setReplyTicket] = useState(null);

    const [modal2FA, setModal2FA] = useState(null); // user object
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [rolePermissionsModal, setRolePermissionsModal] = useState(null);
    const [busyUserId, setBusyUserId] = useState(null);
    const [orgRoles, setOrgRoles] = useState([]);
    const [showCreateRole, setShowCreateRole] = useState(false);
    const ticketsLoadedRef = useRef(false);

    const loadTickets = useCallback(async (page = 1) => {
        setTicketsLoading(true);
        try {
            const result = await adminService.getTickets(page, 20);
            setTickets(result?.items ?? []);
            setTicketTotal(result?.totalCount ?? 0);
            setTicketPage(page);
        } catch {
            toast.error('Failed to load tickets');
        } finally {
            setTicketsLoading(false);
        }
    }, [toast]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [u, p, r] = await Promise.all([
                adminService.getUsers(),
                adminService.getPermissions(),
                organizationService.getRoles(),
            ]);
            setUsers(u ?? []);
            setPermissions(p ?? []);
            setOrgRoles(r ?? []);
        } catch (err) {
            toast.error('Failed to load admin data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { loadData(); }, [loadData]);
    useEffect(() => {
        if (activeTab === 'tickets' && !ticketsLoadedRef.current) {
            ticketsLoadedRef.current = true;
            loadTickets(1);
        }
    }, [activeTab, loadTickets]);

    const handleSave2FA = async (userId, enabled, method) => {
        try {
            if (enabled) {
                await adminService.setUserTwoFactor(userId, true, method);
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, twoFactorRequired: true, twoFactorMethod: method } : u));
                toast.success('Email OTP enabled for user');
            } else {
                await adminService.removeUserTwoFactor(userId);
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, twoFactorRequired: false } : u));
                toast.success('2FA requirement removed');
            }
            setModal2FA(null);
        } catch (err) {
            toast.error(err.message || 'Failed to update 2FA');
        }
    };

    const handleResetTotp = async (userId) => {
        try {
            await adminService.resetUserTotp(userId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isTotpEnabled: false, twoFactorRequired: false, twoFactorMethod: 'email' } : u));
            toast.success('TOTP reset');
            setModal2FA(null);
        } catch (err) {
            toast.error(err.message || 'Failed to reset TOTP');
        }
    };

    const handleRequireTotp = async (userId) => {
        try {
            await adminService.requireUserTotp(userId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, twoFactorRequired: true, twoFactorMethod: 'totp' } : u));
            toast.success('TOTP required');
            setModal2FA(null);
        } catch (err) {
            toast.error(err.message || 'Failed to require TOTP');
        }
    };

    const handleDeactivateUser = async (user) => {
        if (user.id === currentUser.id) return toast.warning("You cannot deactivate yourself.");
        if (!window.confirm(`Deactivate "${user.displayName || user.email}"?`)) return;
        setBusyUserId(user.id);
        try {
            await organizationService.deactivateUser(user.id);
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: false } : u));
            toast.success('User deactivated');
        } catch (err) {
            toast.error(err.message || 'Failed to deactivate user');
        } finally {
            setBusyUserId(null);
        }
    };

    const handleActivateUser = async (user) => {
        setBusyUserId(user.id);
        try {
            const updated = await organizationService.updateUser(user.id, { isActive: true });
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...updated } : u));
            toast.success('User activated');
        } catch (err) {
            toast.error(err.message || 'Failed to activate user');
        } finally {
            setBusyUserId(null);
        }
    };

    const handleDeleteUser = async (user) => {
        if (user.id === currentUser.id) return toast.warning("You cannot remove yourself.");
        if (!window.confirm(`Remove "${user.displayName || user.email}" from the organization? This cannot be undone.`)) return;
        setBusyUserId(user.id);
        try {
            await organizationService.deactivateUser(user.id);
            setUsers(prev => prev.filter(u => u.id !== user.id));
            toast.success('User removed');
        } catch (err) {
            toast.error(err.message || 'Failed to remove user');
        } finally {
            setBusyUserId(null);
        }
    };

    const handleCreateUser = async (payload) => {
        const created = await organizationService.createUser(payload);
        setUsers(prev => [...prev, created]);
        toast.success('User created. Welcome email sent.');
        setShowCreateUser(false);
    };

    const handleUpdateUser = async (userId, payload) => {
        const updated = await organizationService.updateUser(userId, payload);
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updated } : u));
        toast.success('User updated');
        setEditingUser(null);
    };

    if (loading) {
        return (
            <div className="admin-page d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="spinner-border text-primary" />
            </div>
        );
    }

    return (
        <div className="admin-page">
            <PageHeader
                title="Admin Panel"
                description="Manage users, permissions, and support tickets"
                icon={FaShieldHalved}
                iconColor="#3b82f6"
            />

            <StatsGrid stats={[
                { label: 'Total Users', value: users.length, icon: <FaUsers size={22} />, color: 'blue' },
                { label: 'Permissions', value: permissions.length, icon: <FaKey size={22} />, color: 'purple' },
                { label: 'Open Tickets', value: ticketTotal, icon: <FaTicket size={22} />, color: 'green' },
            ]} />

            <div className="admin-toolbar">
                <div className="admin-tabs">
                    <button className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                        <FaUsers size={14} /> Users <span className="tab-count">{users.length}</span>
                    </button>
                    <button className={`admin-tab ${activeTab === 'permissions' ? 'active' : ''}`} onClick={() => setActiveTab('permissions')}>
                        <FaKey size={14} /> Permissions <span className="tab-count">{permissions.length}</span>
                    </button>
                    <button className={`admin-tab ${activeTab === 'roles' ? 'active' : ''}`} onClick={() => setActiveTab('roles')}>
                        <ShieldCheck size={14} /> Roles <span className="tab-count">{orgRoles.length}</span>
                    </button>
                    <button className={`admin-tab ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => setActiveTab('tickets')}>
                        <FaTicket size={14} /> Support Tickets {ticketTotal > 0 && <span className="tab-count">{ticketTotal}</span>}
                    </button>
                </div>
                <div className="admin-toolbar-actions">
                    {activeTab === 'users' && (
                        <button className="admin-add-btn" onClick={() => setShowCreateUser(true)}>
                            <UserPlus size={14} /> Add User
                        </button>
                    )}
                    {activeTab === 'roles' && (
                        <button className="admin-add-btn" onClick={() => setShowCreateRole(true)}>
                            <Plus size={14} /> Create Role
                        </button>
                    )}
                    {activeTab === 'permissions' && (
                        <>
                            <button className="admin-secondary-btn" onClick={() => setRolePermissionsModal('MANAGER')}>
                                <FaKey size={13} /> Manager Role
                            </button>
                            <button className="admin-secondary-btn" onClick={() => setRolePermissionsModal('EMPLOYEE')}>
                                <FaKey size={13} /> Employee Role
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="admin-card">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>First Login</th>
                                <th>2FA</th>
                                <th>Last Login</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-4 text-muted">No users found.</td></tr>
                            ) : users.map(user => {
                                const roleStyle = ROLE_COLORS[user.role] || { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' };
                                const twoFALabel = user.isTotpEnabled ? 'TOTP' : user.twoFactorRequired ? 'Email OTP' : 'Off';
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
                                            <span style={{
                                                display: 'inline-block', padding: '2px 8px', borderRadius: 999,
                                                fontSize: 11, fontWeight: 700,
                                                background: roleStyle.bg, color: roleStyle.color,
                                            }}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                                                <span className={`status-dot ${user.isActive ? 'active' : 'inactive'}`} />
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            {user.isFirstLogin
                                                ? <span style={{ fontSize: 11, color: '#d97706', fontWeight: 600 }}>Pending</span>
                                                : <span style={{ fontSize: 11, color: '#94a3b8' }}>Done</span>}
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
                                                {/* 2FA */}
                                                <div
                                                    className="admin-action-icon password"
                                                    title="Manage 2FA"
                                                    onClick={() => setModal2FA(user)}
                                                    style={{ color: (user.twoFactorRequired || user.isTotpEnabled) ? '#4361EE' : undefined }}
                                                >
                                                    <FaShield size={14} />
                                                </div>

                                                {/* Edit — all except SUPER_ADMIN */}
                                                {user.role !== 'SUPER_ADMIN' && (
                                                    <div
                                                        className={`admin-action-icon edit${busyUserId === user.id ? ' disabled' : ''}`}
                                                        title="Edit user"
                                                        onClick={() => setEditingUser(user)}
                                                    >
                                                        <Pencil size={14} />
                                                    </div>
                                                )}

                                                {/* Deactivate / Activate — all except SUPER_ADMIN and self */}
                                                {user.role !== 'SUPER_ADMIN' && user.id !== currentUser?.id && (
                                                    user.isActive ? (
                                                        <div
                                                            className={`admin-action-icon delete${busyUserId === user.id ? ' disabled' : ''}`}
                                                            title="Deactivate"
                                                            onClick={() => handleDeactivateUser(user)}
                                                        >
                                                            <Ban size={14} />
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className={`admin-action-icon toggle${busyUserId === user.id ? ' disabled' : ''}`}
                                                            title="Activate"
                                                            onClick={() => handleActivateUser(user)}
                                                        >
                                                            <UserCheck size={14} />
                                                        </div>
                                                    )
                                                )}

                                                {/* Remove — all except SUPER_ADMIN and self */}
                                                {user.role !== 'SUPER_ADMIN' && user.id !== currentUser?.id && (
                                                    <div
                                                        className={`admin-action-icon delete${busyUserId === user.id ? ' disabled' : ''}`}
                                                        title="Remove from org"
                                                        onClick={() => handleDeleteUser(user)}
                                                        style={{ color: '#94a3b8' }}
                                                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                                        onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                                                    >
                                                        <Trash2 size={14} />
                                                    </div>
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

            {/* Roles Tab */}
            {activeTab === 'roles' && (
                <div className="admin-card">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Role Name</th>
                                <th>Type</th>
                                <th>Permissions</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orgRoles.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-4 text-muted">No roles yet. Create your first custom role.</td></tr>
                            ) : orgRoles.map(role => (
                                <tr key={role.name}>
                                    <td style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>
                                        {role.name}
                                    </td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block', padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                                            background: role.isBuiltIn ? 'rgba(139,92,246,0.10)' : 'rgba(67,97,238,0.10)',
                                            color: role.isBuiltIn ? '#7C3AED' : '#4361EE',
                                        }}>
                                            {role.isBuiltIn ? 'Built-in' : 'Custom'}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: 12, color: '#64748b' }}>
                                        {role.permissionCodes.length === 0
                                            ? <span style={{ color: '#CBD5E1' }}>No permissions assigned</span>
                                            : `${role.permissionCodes.length} permission${role.permissionCodes.length !== 1 ? 's' : ''}`}
                                    </td>
                                    <td>
                                        <div className="admin-actions">
                                            <div
                                                className="admin-action-icon edit"
                                                title="Edit permissions"
                                                onClick={() => setRolePermissionsModal(role.name)}
                                            >
                                                <Pencil size={14} />
                                            </div>
                                            {!role.isBuiltIn && (
                                                <div
                                                    className="admin-action-icon delete"
                                                    title="Delete role"
                                                    onClick={async () => {
                                                        if (!window.confirm(`Delete role "${role.name}"? Users with this role will be downgraded to Employee.`)) return;
                                                        try {
                                                            await organizationService.deleteRole(role.name);
                                                            setOrgRoles(prev => prev.filter(r => r.name !== role.name));
                                                            toast.success(`Role "${role.name}" deleted`);
                                                        } catch (e) { toast.error(e.message || 'Failed to delete role'); }
                                                    }}
                                                >
                                                    <Trash2 size={14} />
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
                                        <span className={`action-badge ${perm.action.toLowerCase()}`}>{perm.action}</span>
                                    </td>
                                    <td><code style={{ fontSize: '0.8rem', color: '#6366f1' }}>{perm.code}</code></td>
                                    <td style={{ color: 'var(--text-muted)' }}>{perm.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="admin-permission-footer">
                        <button className="admin-secondary-btn" onClick={() => setRolePermissionsModal('MANAGER')}>
                            <FaKey size={13} /> Configure Manager Permissions
                        </button>
                        <button className="admin-secondary-btn" onClick={() => setRolePermissionsModal('EMPLOYEE')}>
                            <FaKey size={13} /> Configure Employee Permissions
                        </button>
                    </div>
                </div>
            )}

            {/* Tickets Tab */}
            {activeTab === 'tickets' && (
                <div className="admin-card">
                    {ticketsLoading ? (
                        <div className="text-center p-4"><div className="spinner-border text-primary spinner-border-sm" /></div>
                    ) : (
                        <>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Ticket #</th>
                                        <th>Title</th>
                                        <th>Raised By</th>
                                        <th>Priority</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th style={{ textAlign: 'center' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-4 text-muted">No tickets found.</td></tr>
                                    ) : tickets.map(t => (
                                        <tr key={t.id}>
                                            <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4361EE', fontSize: 12 }}>{t.ticketNumber}</td>
                                            <td style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</td>
                                            <td style={{ fontSize: 12, color: '#64748b' }}>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>{t.createdByName || '—'}</div>
                                            </td>
                                            <td>
                                                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: `${PRIORITY_BADGE_COLOR[t.priority]}18`, color: PRIORITY_BADGE_COLOR[t.priority] }}>
                                                    {t.priority}
                                                </span>
                                            </td>
                                            <td>
                                                <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: `${STATUS_BADGE[t.status]}18`, color: STATUS_BADGE[t.status] }}>
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button
                                                    className="admin-action-icon edit"
                                                    title="Reply"
                                                    onClick={async () => {
                                                        const full = await adminService.getTicket(t.id);
                                                        setReplyTicket(full);
                                                    }}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 12 }}
                                                >
                                                    <FaReply size={11} /> Reply
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {ticketTotal > 20 && (
                                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '12px 0' }}>
                                    <button className="modal-btn cancel" disabled={ticketPage === 1} onClick={() => loadTickets(ticketPage - 1)} style={{ padding: '4px 12px', fontSize: 12 }}>Prev</button>
                                    <span style={{ fontSize: 12, color: '#64748b', alignSelf: 'center' }}>Page {ticketPage}</span>
                                    <button className="modal-btn cancel" disabled={ticketPage * 20 >= ticketTotal} onClick={() => loadTickets(ticketPage + 1)} style={{ padding: '4px 12px', fontSize: 12 }}>Next</button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* 2FA Modal */}
            {modal2FA && (
                <Manage2FAModal
                    user={modal2FA}
                    onSaveEmailOtp={handleSave2FA}
                    onResetTotp={handleResetTotp}
                    onRequireTotp={handleRequireTotp}
                    onClose={() => setModal2FA(null)}
                />
            )}

            {showCreateUser && (
                <UserFormModal
                    mode="create"
                    orgRoles={orgRoles}
                    onClose={() => setShowCreateUser(false)}
                    onSubmit={handleCreateUser}
                />
            )}

            {editingUser && (
                <UserFormModal
                    mode="edit"
                    user={editingUser}
                    orgRoles={orgRoles}
                    onClose={() => setEditingUser(null)}
                    onSubmit={(payload) => handleUpdateUser(editingUser.id, payload)}
                />
            )}

            {showCreateRole && (
                <CreateRoleModal
                    permissions={permissions}
                    onClose={() => setShowCreateRole(false)}
                    onCreated={role => {
                        setOrgRoles(prev => [...prev.filter(r => r.name !== role.name), role]);
                        toast.success(`Role "${role.name}" created`);
                    }}
                />
            )}

            {rolePermissionsModal && (
                <RolePermissionsModal
                    role={rolePermissionsModal}
                    permissions={permissions}
                    onClose={() => setRolePermissionsModal(null)}
                />
            )}

            {/* Ticket Reply Modal */}
            {replyTicket && (
                <TicketReplyModal
                    ticket={replyTicket}
                    adminName={currentUser?.displayName || 'Admin'}
                    onClose={() => setReplyTicket(null)}
                    onReplySent={(comment) => {
                        setReplyTicket(prev => ({ ...prev, comments: [...(prev.comments ?? []), comment] }));
                        setTickets(prev => prev.map(t => t.id === replyTicket.id ? { ...t, status: t.status === 'Open' ? 'In Progress' : t.status } : t));
                    }}
                    onStatusChanged={(updated) => {
                        setReplyTicket(prev => ({ ...prev, status: updated.status }));
                        setTickets(prev => prev.map(t => t.id === updated.id ? { ...t, status: updated.status } : t));
                    }}
                />
            )}
        </div>
    );
}

// ─── Create Role Modal ─────────────────────────────────────────

function CreateRoleModal({ permissions, onClose, onCreated }) {
    const toast = useToast();
    const [name, setName] = useState('');
    const [selected, setSelected] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const grouped = permissions.reduce((acc, p) => {
        (acc[p.module] = acc[p.module] || []).push(p);
        return acc;
    }, {});

    const toggle = (code) => setSelected(prev =>
        prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );

    const save = async () => {
        if (!name.trim()) { setError('Role name is required.'); return; }
        setSaving(true); setError('');
        try {
            const role = await organizationService.createRole(name.trim(), selected);
            onCreated(role);
            onClose();
        } catch (e) {
            setError(e?.message || 'Failed to create role.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box admin-role-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-box-header">
                    <div>
                        <h3>Create Custom Role</h3>
                        <p>Name your role and assign permissions</p>
                    </div>
                    <button className="admin-modal-close" type="button" onClick={onClose}><X size={15} /></button>
                </div>
                <div className="modal-box-body">
                    {error && <div className="admin-form-error">{error}</div>}
                    <label className="admin-field">
                        <span>Role Name</span>
                        <input
                            value={name}
                            placeholder='e.g. "Sales Rep", "HR Manager"'
                            onChange={e => setName(e.target.value)}
                            autoFocus
                        />
                    </label>
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#374151', marginBottom: 10 }}>Permissions</div>
                    {Object.entries(grouped).map(([module, modulePerms]) => (
                        <section className="admin-permission-group" key={module}>
                            <div className="admin-permission-group-title">{module}</div>
                            <div className="admin-permission-grid">
                                {modulePerms.map(perm => (
                                    <label
                                        className={`admin-permission-chip ${selected.includes(perm.code) ? 'selected' : ''}`}
                                        key={perm.code}
                                    >
                                        <input type="checkbox" checked={selected.includes(perm.code)} onChange={() => toggle(perm.code)} />
                                        <span>{perm.action}</span>
                                    </label>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
                <div className="modal-box-footer">
                    <button className="modal-btn cancel" type="button" onClick={onClose}>Cancel</button>
                    <button className="modal-btn primary" type="button" onClick={save} disabled={saving}>
                        <Plus size={14} />{saving ? 'Creating…' : 'Create Role'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Manage 2FA Modal ─────────────────────────────────────────

function UserFormModal({ mode, user, orgRoles = [], onSubmit, onClose }) {
    const isEdit = mode === 'edit';
    const [form, setForm] = useState({
        email: user?.email || '',
        displayName: user?.displayName || '',
        role: user?.role || 'EMPLOYEE',
        isActive: user?.isActive ?? true,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isEdit && !form.email.trim()) {
            setError('Email address is required.');
            return;
        }

        setSaving(true);
        setError('');
        try {
            const payload = {
                displayName: form.displayName.trim() || null,
                role: form.role,
            };
            if (isEdit) payload.isActive = form.isActive;
            else payload.email = form.email.trim();

            await onSubmit(payload);
        } catch (err) {
            setError(err?.message || `Failed to ${isEdit ? 'update' : 'create'} user.`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <form className="modal-box admin-user-modal" onSubmit={handleSubmit} onClick={e => e.stopPropagation()}>
                <div className="modal-box-header">
                    <div>
                        <h3>{isEdit ? 'Edit User' : 'Add User'}</h3>
                        <p>{isEdit ? 'Update role and account status' : 'Create a Manager or Employee inside this organization'}</p>
                    </div>
                    <button className="admin-modal-close" type="button" onClick={onClose} aria-label="Close">
                        <X size={15} />
                    </button>
                </div>
                <div className="modal-box-body">
                    {error && <div className="admin-form-error">{error}</div>}

                    {!isEdit && (
                        <label className="admin-field">
                            <span>Email Address</span>
                            <input
                                type="email"
                                value={form.email}
                                placeholder="user@company.com"
                                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                                autoFocus
                            />
                        </label>
                    )}

                    <label className="admin-field">
                        <span>Display Name</span>
                        <input
                            value={form.displayName}
                            placeholder="Full name"
                            onChange={e => setForm(prev => ({ ...prev, displayName: e.target.value }))}
                            autoFocus={isEdit}
                        />
                    </label>

                    <label className="admin-field">
                        <span>Role</span>
                        <select value={form.role} onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}>
                            {isEdit && <option value="ORG_ADMIN">Org Admin (CXO)</option>}
                            <option value="MANAGER">Manager</option>
                            <option value="EMPLOYEE">Employee</option>
                            {orgRoles.filter(r => !r.isBuiltIn).map(r => (
                                <option key={r.name} value={r.name}>{r.name}</option>
                            ))}
                        </select>
                    </label>

                    {isEdit && (
                        <div className="admin-status-picker">
                            <button type="button" className={form.isActive ? 'active' : ''} onClick={() => setForm(prev => ({ ...prev, isActive: true }))}>
                                <UserCheck size={14} /> Active
                            </button>
                            <button type="button" className={!form.isActive ? 'inactive' : ''} onClick={() => setForm(prev => ({ ...prev, isActive: false }))}>
                                <Ban size={14} /> Inactive
                            </button>
                        </div>
                    )}

                    {!isEdit && (
                        <div className="admin-info-note">
                            A welcome email with a temporary password will be sent. Organization user limits still apply.
                        </div>
                    )}
                </div>
                <div className="modal-box-footer">
                    <button className="modal-btn cancel" type="button" onClick={onClose}>Cancel</button>
                    <button className="modal-btn primary" type="submit" disabled={saving}>
                        {isEdit ? <Save size={14} /> : <UserPlus size={14} />}
                        {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create User'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function RolePermissionsModal({ role, permissions, onClose }) {
    const toast = useToast();
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let alive = true;
        organizationService.getRolePermissions(role)
            .then(codes => { if (alive) setSelected(codes || []); })
            .catch(err => toast.error(err?.message || 'Failed to load role permissions'))
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [role, toast]);

    const grouped = permissions.reduce((acc, perm) => {
        (acc[perm.module] = acc[perm.module] || []).push(perm);
        return acc;
    }, {});

    const toggle = (code) => {
        setSelected(prev => prev.includes(code)
            ? prev.filter(item => item !== code)
            : [...prev, code]);
    };

    const BUILT_IN = ['SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'EMPLOYEE'];

    const save = async () => {
        setSaving(true);
        try {
            if (BUILT_IN.includes(role)) {
                await organizationService.setRolePermissions(role, selected);
            } else {
                await organizationService.createRole(role, selected);
            }
            toast.success(`${role} permissions updated`);
            onClose();
        } catch (err) {
            toast.error(err?.message || 'Failed to save permissions');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box admin-role-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-box-header">
                    <div>
                        <h3>{role} Permissions</h3>
                        <p>Choose what this role can access inside the organization</p>
                    </div>
                    <button className="admin-modal-close" type="button" onClick={onClose} aria-label="Close">
                        <X size={15} />
                    </button>
                </div>
                <div className="modal-box-body">
                    {loading ? (
                        <div className="text-center p-4"><div className="spinner-border text-primary spinner-border-sm" /></div>
                    ) : (
                        Object.entries(grouped).map(([module, modulePerms]) => (
                            <section className="admin-permission-group" key={module}>
                                <div className="admin-permission-group-title">{module}</div>
                                <div className="admin-permission-grid">
                                    {modulePerms.map(perm => (
                                        <label className={`admin-permission-chip ${selected.includes(perm.code) ? 'selected' : ''}`} key={perm.code}>
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(perm.code)}
                                                onChange={() => toggle(perm.code)}
                                            />
                                            <span>{perm.action}</span>
                                        </label>
                                    ))}
                                </div>
                            </section>
                        ))
                    )}
                </div>
                <div className="modal-box-footer">
                    <button className="modal-btn cancel" type="button" onClick={onClose}>Cancel</button>
                    <button className="modal-btn primary" type="button" onClick={save} disabled={saving || loading}>
                        <Save size={14} /> {saving ? 'Saving...' : 'Save Permissions'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Manage2FAModal({ user, onSaveEmailOtp, onResetTotp, onRequireTotp, onClose }) {
    const emailOtpOn = user.twoFactorRequired && user.twoFactorMethod === 'email' && !user.isTotpEnabled;
    const totpRequiredNotSetup = user.twoFactorRequired && user.twoFactorMethod === 'totp' && !user.isTotpEnabled;
    const [emailEnabled, setEmailEnabled] = useState(emailOtpOn);
    const [confirm, setConfirm] = useState(null);

    const statusLabel = user.isTotpEnabled ? 'TOTP (authenticator app)'
        : totpRequiredNotSetup ? 'TOTP required — setup pending'
        : user.twoFactorRequired ? 'Email OTP' : 'None';
    const statusColor = user.isTotpEnabled ? '#10b981' : totpRequiredNotSetup ? '#f59e0b' : user.twoFactorRequired ? '#4361EE' : '#94a3b8';

    const sectionStyle = { padding: '14px 16px', borderRadius: 10, marginBottom: 12, border: '1px solid rgba(148,163,184,0.15)', background: 'rgba(248,250,252,0.6)' };

    if (confirm === 'reset-totp') {
        return (
            <div className="modal-overlay" onClick={onClose}><div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-box-header"><h3>Reset TOTP — {user.displayName || user.email}</h3></div>
                <div className="modal-box-body">
                    <div className="p-3 rounded mb-3" style={{ background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.2)', fontSize: '0.85rem', color: '#f43f5e' }}>
                        This will <strong>permanently remove</strong> the user's authenticator app setup.
                    </div>
                </div>
                <div className="modal-box-footer">
                    <button className="modal-btn cancel" onClick={() => setConfirm(null)}>Cancel</button>
                    <button className="modal-btn warning" onClick={() => onResetTotp(user.id)}>Reset TOTP</button>
                </div>
            </div></div>
        );
    }

    if (confirm === 'require-totp') {
        return (
            <div className="modal-overlay" onClick={onClose}><div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-box-header"><h3>Require TOTP — {user.displayName || user.email}</h3></div>
                <div className="modal-box-body">
                    <div className="p-3 rounded mb-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', fontSize: '0.85rem', color: '#d97706' }}>
                        The user will be prompted to set up their authenticator app via Settings on next login.
                    </div>
                </div>
                <div className="modal-box-footer">
                    <button className="modal-btn cancel" onClick={() => setConfirm(null)}>Cancel</button>
                    <button className="modal-btn primary" onClick={() => onRequireTotp(user.id)}>Require TOTP</button>
                </div>
            </div></div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}><div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-box-header"><h3>Manage 2FA — {user.displayName || user.email}</h3></div>
            <div className="modal-box-body">
                <div className="mb-3 p-3 rounded d-flex align-items-center gap-2" style={{ background: 'rgba(67,97,238,0.05)', border: '1px solid rgba(67,97,238,0.12)' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Current 2FA:</span>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: statusColor }}>{statusLabel}</span>
                </div>

                <div style={sectionStyle}>
                    <div className="d-flex align-items-center justify-content-between mb-1">
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Email OTP</div>
                        {!user.isTotpEnabled && !totpRequiredNotSetup && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }} onClick={() => setEmailEnabled(prev => !prev)}>
                                {emailEnabled ? <FaToggleOn size={20} color="#4361EE" /> : <FaToggleOff size={20} color="#94a3b8" />}
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: emailEnabled ? '#4361EE' : '#94a3b8' }}>{emailEnabled ? 'On' : 'Off'}</span>
                            </div>
                        )}
                    </div>
                    <p style={{ fontSize: '0.77rem', color: '#94a3b8', margin: 0 }}>User receives a 6-digit code by email on each login.</p>
                </div>

                <div style={sectionStyle}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>Authenticator App (TOTP)</div>
                    {user.isTotpEnabled ? (
                        <div>
                            <p style={{ fontSize: '0.77rem', color: '#10b981', marginBottom: 8 }}>Active — user has configured their authenticator app.</p>
                            <button onClick={() => setConfirm('reset-totp')} style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}>Reset TOTP</button>
                        </div>
                    ) : totpRequiredNotSetup ? (
                        <div>
                            <p style={{ fontSize: '0.77rem', color: '#d97706', marginBottom: 8 }}>Required — user has not yet set it up.</p>
                            <button onClick={() => onResetTotp(user.id)} style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}>Cancel Requirement</button>
                        </div>
                    ) : (
                        <div>
                            <p style={{ fontSize: '0.77rem', color: '#94a3b8', marginBottom: 8 }}>Not enabled.</p>
                            <button onClick={() => setConfirm('require-totp')} style={{ background: '#4361EE', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}>Require TOTP</button>
                        </div>
                    )}
                </div>
            </div>
            <div className="modal-box-footer">
                <button className="modal-btn cancel" onClick={onClose}>Cancel</button>
                {!user.isTotpEnabled && !totpRequiredNotSetup && (
                    <button className="modal-btn primary" onClick={() => onSaveEmailOtp(user.id, emailEnabled, 'email')}>Save</button>
                )}
            </div>
        </div></div>
    );
}

// ─── Ticket Reply Modal ───────────────────────────────────────

function TicketReplyModal({ ticket, adminName, onClose, onReplySent, onStatusChanged }) {
    const [commentText, setCommentText] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState(ticket.status);
    const [savingStatus, setSavingStatus] = useState(false);
    const toast = useToast();

    const handleReply = async () => {
        if (!commentText.trim()) return;
        setSending(true);
        try {
            const comment = await adminService.replyToTicket(ticket.id, commentText, isInternal, adminName);
            onReplySent(comment);
            setCommentText('');
            toast.success('Reply sent');
        } catch (e) {
            toast.error(e.message || 'Failed to send reply');
        } finally {
            setSending(false);
        }
    };

    const handleStatusSave = async () => {
        if (status === ticket.status) return;
        setSavingStatus(true);
        try {
            const updated = await adminService.setTicketStatus(ticket.id, status);
            onStatusChanged(updated);
            toast.success(`Status set to ${status}`);
        } catch (e) {
            toast.error(e.message || 'Failed to update status');
        } finally {
            setSavingStatus(false);
        }
    };

    const comments = ticket.comments ?? [];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" style={{ maxWidth: 640, width: '95vw' }} onClick={e => e.stopPropagation()}>
                <div className="modal-box-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ marginBottom: 4 }}>{ticket.ticketNumber} — {ticket.title}</h3>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                            Raised by <strong style={{ color: '#64748b' }}>{ticket.createdByName || 'User'}</strong>
                            <span> · {new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: `1.5px solid ${STATUS_BADGE[status] || '#e2e8f0'}`, color: STATUS_BADGE[status], fontWeight: 600, background: `${STATUS_BADGE[status]}14`, cursor: 'pointer' }}
                        >
                            {TICKET_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {status !== ticket.status && (
                            <button className="modal-btn primary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={handleStatusSave} disabled={savingStatus}>
                                {savingStatus ? '…' : 'Save'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="modal-box-body" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                    {ticket.description && (
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#334155', whiteSpace: 'pre-wrap' }}>
                            {ticket.description}
                        </div>
                    )}
                    {comments.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '16px 0', fontSize: 13 }}>No replies yet.</div>
                    ) : comments.map(c => {
                        const isAdminComment = c.authorName === adminName;
                        return (
                            <div key={c.id} style={{ display: 'flex', flexDirection: isAdminComment ? 'row-reverse' : 'row', gap: 8, marginBottom: 10 }}>
                                <div style={{ maxWidth: '80%', padding: '8px 12px', borderRadius: 10, fontSize: 13, background: isAdminComment ? 'rgba(67,97,238,0.1)' : '#f1f5f9', border: isAdminComment ? '1px solid rgba(67,97,238,0.2)' : '1px solid #e2e8f0', color: '#0f172a' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexDirection: isAdminComment ? 'row-reverse' : 'row' }}>
                                        <span style={{ fontWeight: 700, fontSize: 12, color: isAdminComment ? '#4361EE' : '#64748b' }}>{c.authorName}</span>
                                        {c.isInternal && <span style={{ fontSize: 10, background: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d', borderRadius: 4, padding: '0 4px' }}><Lock size={8} /> Internal</span>}
                                        <span style={{ fontSize: 10, color: '#94a3b8' }}>{new Date(c.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{c.comment}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0' }}>
                    <textarea
                        rows={3}
                        style={{ width: '100%', borderRadius: 8, border: '1px solid #e2e8f0', padding: '8px 12px', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
                        placeholder="Write your reply…"
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleReply(); }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b', cursor: 'pointer' }}>
                            <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                            Internal note (not visible to user)
                        </label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="modal-btn cancel" onClick={onClose}>Close</button>
                            <button className="modal-btn primary" onClick={handleReply} disabled={sending || !commentText.trim()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Send size={13} />
                                {sending ? 'Sending…' : 'Send Reply'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
