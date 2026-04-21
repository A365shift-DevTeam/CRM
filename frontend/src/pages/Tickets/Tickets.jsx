import React, { useEffect, useState, useCallback } from 'react';
import { ticketService } from '../../services/ticketService';
import PageToolbar from '../../components/PageToolbar/PageToolbar';
import StatsGrid from '../../components/StatsGrid/StatsGrid';
import { useToast } from '../../components/Toast/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, Sparkles, AlertCircle, Clock, CheckCircle, Zap, MessageSquare } from 'lucide-react';
import { FaTrash } from 'react-icons/fa6';
import Swal from 'sweetalert2';
import TicketModal from './TicketModal';
import AITicketModal from './AITicketModal';
import './Tickets.css';

const PRIORITY_COLOR = { Critical: '#F43F5E', High: '#F59E0B', Medium: '#4361EE', Low: '#94A3B8' };

const STATUS_STYLE = {
  'Open':        { bg: '#EFF6FF', text: '#3B82F6', border: '#BFDBFE' },
  'In Progress': { bg: '#F5F3FF', text: '#8B5CF6', border: '#DDD6FE' },
  'Pending':     { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  'Resolved':    { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  'Closed':      { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

export default function Tickets() {
  const toast = useToast();
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [panelFilterValues, setPanelFilterValues] = useState({});
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showModal, setShowModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, s] = await Promise.all([ticketService.getAll(), ticketService.getStats()]);
      setTickets(data);
      setStats(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let list = tickets;
    if (search) list = list.filter(t =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.ticketNumber.toLowerCase().includes(search.toLowerCase())
    );
    const pf = panelFilterValues;
    if (pf.priority) list = list.filter(t => t.priority === pf.priority);
    if (pf.status) list = list.filter(t => t.status === pf.status);
    list = [...list].sort((a, b) => {
      const av = String(a[sortBy] ?? '').toLowerCase();
      const bv = String(b[sortBy] ?? '').toLowerCase();
      return sortOrder === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    setFiltered(list);
  }, [tickets, search, panelFilterValues, sortBy, sortOrder]);

  const openView = async (t) => {
    // Fetch full ticket with comments before opening
    try {
      const full = await ticketService.getById(t.id);
      setEditing(full ?? t);
    } catch {
      setEditing(t);
    }
    setShowModal(true);
  };

  const openCreate = () => { setEditing(null); setShowModal(true); };

  const handleSaved = async (payload) => {
    try {
      await ticketService.create(payload);
      toast.success('Ticket submitted! Our team will get back to you shortly.');
      setShowModal(false);
      load();
    } catch (e) {
      toast.error(e.message || 'Failed to submit ticket');
    }
  };

  const handleAiConfirm = async (payload) => {
    try {
      await ticketService.create(payload);
      toast.success('Ticket created');
      load();
    } catch (e) {
      toast.error(e.message || 'Failed to create ticket');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete ticket?',
      text: 'This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await ticketService.delete(id);
      toast.success('Ticket deleted');
      setTickets(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      toast.error('Failed to delete ticket');
    }
  };

  const statCards = stats ? [
    { label: 'Open', value: stats.open, icon: <AlertCircle size={18} />, color: 'blue' },
    { label: 'In Progress', value: stats.inProgress, icon: <Clock size={18} />, color: 'orange' },
    { label: 'Resolved', value: stats.resolved, icon: <CheckCircle size={18} />, color: 'green' },
    { label: 'Critical', value: stats.critical, icon: <Zap size={18} />, color: 'red' },
  ] : [];

  return (
    <div style={{ padding: '0 16px 24px' }}>
      {stats && <StatsGrid stats={statCards} />}

      <PageToolbar
        title="My Tickets"
        itemCount={filtered.length}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search tickets…"
        sortOptions={[
          { id: 'createdAt', name: 'Date Created' },
          { id: 'priority', name: 'Priority' },
          { id: 'status', name: 'Status' },
          { id: 'title', name: 'Title' },
        ]}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(sb, so) => { setSortBy(sb); setSortOrder(so); }}
        panelFilters={[
          { id: 'priority', label: 'Priority', type: 'select', options: ['Critical', 'High', 'Medium', 'Low'] },
          { id: 'status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'] },
        ]}
        panelFilterValues={panelFilterValues}
        onPanelFilterChange={(id, val) => setPanelFilterValues(prev => ({ ...prev, [id]: val }))}
        onClearPanelFilters={() => setPanelFilterValues({})}
        actions={[
          { label: 'AI Generate', icon: <Sparkles size={16} />, variant: 'purple', onClick: () => setShowAiModal(true) },
          { label: 'Raise a Ticket', icon: <Plus size={16} />, variant: 'primary', onClick: openCreate },
        ]}
      />

      {loading ? (
        <div className="text-center p-5"><div className="spinner-border text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
          <AlertCircle size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontWeight: 600, fontSize: 15, color: '#64748B', marginBottom: 6 }}>No tickets yet</div>
          <div style={{ fontSize: 13 }}>Click "Raise a Ticket" to get help from our support team.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(t => {
            const st = STATUS_STYLE[t.status] ?? STATUS_STYLE['Open'];
            const replyCount = t.comments?.filter(c => !c.isInternal).length ?? 0;
            const hasAdminReply = t.comments?.some(c => c.authorName !== currentUser?.displayName && !c.isInternal);
            return (
              <div
                key={t.id}
                onClick={() => openView(t)}
                style={{
                  background: '#fff',
                  border: hasAdminReply ? '1.5px solid #C7D7FD' : '1px solid #E2E8F0',
                  borderRadius: 12,
                  padding: '14px 18px',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.15s, border-color 0.15s',
                  boxShadow: hasAdminReply ? '0 0 0 3px rgba(67,97,238,0.06)' : '0 1px 4px rgba(15,23,42,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,23,42,0.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = hasAdminReply ? '0 0 0 3px rgba(67,97,238,0.06)' : '0 1px 4px rgba(15,23,42,0.04)'}
              >
                {/* Priority strip */}
                <div style={{ width: 4, height: 44, borderRadius: 4, background: PRIORITY_COLOR[t.priority] ?? '#94A3B8', flexShrink: 0 }} />

                {/* Main content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#4361EE' }}>{t.ticketNumber}</span>
                    {t.category && <span style={{ fontSize: 11, color: '#94A3B8' }}>· {t.category}</span>}
                    {t.isAiGenerated && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, color: '#8B5CF6', background: 'rgba(139,92,246,0.1)', padding: '1px 6px', borderRadius: 999 }}>
                        <Sparkles size={8} />AI
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.title}
                  </div>
                </div>

                {/* Right side meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  {/* Reply count */}
                  {replyCount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: hasAdminReply ? '#4361EE' : '#94A3B8', fontWeight: hasAdminReply ? 700 : 400 }}>
                      <MessageSquare size={13} />
                      {replyCount}
                      {hasAdminReply && <span style={{ fontSize: 10, background: '#4361EE', color: '#fff', borderRadius: 999, padding: '1px 5px', marginLeft: 2 }}>New</span>}
                    </div>
                  )}

                  {/* Status badge */}
                  <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                    {t.status}
                  </span>

                  {/* Time */}
                  <span style={{ fontSize: 11, color: '#94A3B8', minWidth: 50, textAlign: 'right' }}>{timeAgo(t.createdAt)}</span>

                  {/* Delete */}
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(t.id); }}
                    title="Delete ticket"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 4, borderRadius: 6, display: 'flex', transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#F43F5E'}
                    onMouseLeave={e => e.currentTarget.style.color = '#CBD5E1'}
                  >
                    <FaTrash size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TicketModal
        show={showModal}
        onHide={() => setShowModal(false)}
        editing={editing}
        onSaved={handleSaved}
        currentUserName={currentUser?.displayName || currentUser?.email}
      />
      <AITicketModal show={showAiModal} onHide={() => setShowAiModal(false)} onConfirm={handleAiConfirm} />
    </div>
  );
}
