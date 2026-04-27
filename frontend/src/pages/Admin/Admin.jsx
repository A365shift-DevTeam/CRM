import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaShieldHalved, FaShield, FaUsers, FaKey, FaToggleOn, FaToggleOff, FaMobileScreen, FaTicket, FaReply } from 'react-icons/fa6';
import { Send, Lock } from 'lucide-react';
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

    useEffect(() => { loadData(); }, []);
    useEffect(() => {
        if (activeTab === 'tickets' && !ticketsLoadedRef.current) {
            ticketsLoadedRef.current = true;
            loadTickets(1);
        }
    }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadData = async () => {
        setLoading(true);
        try {
            const [u, p] = await Promise.all([
                adminService.getUsers(),
                adminService.getPermissions(),
            ]);
            setUsers(u ?? []);
            setPermissions(p ?? []);
        } catch (err) {
            toast.error('Failed to load admin data');
            console.error(err);
        } finally {
            setLoading(false);
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
        try {
            await organizationService.deactivateUser(user.id);
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: false } : u));
            toast.success('User deactivated');
        } catch (err) {
            toast.error(err.message || 'Failed to deactivate user');
        }
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
                    <button className={`admin-tab ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => setActiveTab('tickets')}>
                        <FaTicket size={14} /> Support Tickets {ticketTotal > 0 && <span className="tab-count">{ticketTotal}</span>}
                    </button>
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
                                                <div
                                                    className="admin-action-icon password"
                                                    title="Manage 2FA"
                                                    onClick={() => setModal2FA(user)}
                                                    style={{ color: (user.twoFactorRequired || user.isTotpEnabled) ? '#4361EE' : undefined }}
                                                >
                                                    <FaShield size={14} />
                                                </div>
                                                {user.isActive && user.role !== 'ORG_ADMIN' && user.id !== currentUser?.id && (
                                                    <div
                                                        className="admin-action-icon delete"
                                                        title="Deactivate"
                                                        onClick={() => handleDeactivateUser(user)}
                                                    >
                                                        <FaToggleOn size={18} />
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

// ─── Manage 2FA Modal ─────────────────────────────────────────

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
