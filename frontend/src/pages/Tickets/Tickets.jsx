import React, { useEffect, useState, useCallback } from 'react';
import { ticketService } from '../../services/ticketService';
import PageToolbar from '../../components/PageToolbar/PageToolbar';
import StatsGrid from '../../components/StatsGrid/StatsGrid';
import { useToast } from '../../components/Toast/ToastContext';
import { Plus, Sparkles, LayoutList, Columns, AlertCircle, Clock, CheckCircle, Zap } from 'lucide-react';
import { FaPen, FaTrash } from 'react-icons/fa6';
import Swal from 'sweetalert2';
import TicketModal from './TicketModal';
import AITicketModal from './AITicketModal';
import './Tickets.css';

const PRIORITY_BADGE = { Critical: 'tpb-critical', High: 'tpb-high', Medium: 'tpb-medium', Low: 'tpb-low' };
const TYPE_BADGE = { 'Client Support': 'ttb-client', 'Bug': 'ttb-bug', 'Internal Task': 'ttb-internal' };
const KANBAN_COLS = ['Open', 'In Progress', 'Pending', 'Resolved'];

const STATUS_BADGE = {
  'Open':        'badge-blue',
  'In Progress': 'badge-purple',
  'Pending':     'badge-orange',
  'Resolved':    'badge-green',
  'Closed':      'badge-gray',
};

export default function Tickets() {
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState('list');
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
    if (search) list = list.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.ticketNumber.toLowerCase().includes(search.toLowerCase()));
    if (typeFilter) list = list.filter(t => t.type === typeFilter);
    if (priorityFilter) list = list.filter(t => t.priority === priorityFilter);
    if (statusFilter) list = list.filter(t => t.status === statusFilter);
    setFiltered(list);
  }, [tickets, search, typeFilter, priorityFilter, statusFilter]);

  const openCreate = () => { setEditing(null); setShowModal(true); };
  const openEdit = (t) => { setEditing(t); setShowModal(true); };

  const handleSaved = async (payload) => {
    try {
      if (editing) { await ticketService.update(editing.id, payload); toast.success('Ticket updated'); }
      else { await ticketService.create(payload); toast.success('Ticket created'); }
      setShowModal(false);
      load();
    } catch (e) { toast.error(e.message || 'Failed to save ticket'); }
  };

  const handleAiConfirm = async (payload) => {
    try {
      await ticketService.create(payload);
      toast.success('AI ticket created');
      load();
    } catch (e) { toast.error(e.message || 'Failed to create ticket'); }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete ticket?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await ticketService.delete(id);
      toast.success('Ticket deleted');
      setTickets(prev => prev.filter(t => t.id !== id));
    } catch (e) { toast.error('Failed to delete ticket'); }
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
        title="Tickets"
        itemCount={filtered.length}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search tickets…"
        extraControls={
          <div style={{ display: 'flex', gap: 6 }}>
            <select className="glass-input" style={{ fontSize: 12, padding: '6px 10px', borderRadius: 8, border: '1px solid #E1E8F4' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {['Client Support', 'Bug', 'Internal Task'].map(t => <option key={t}>{t}</option>)}
            </select>
            <select className="glass-input" style={{ fontSize: 12, padding: '6px 10px', borderRadius: 8, border: '1px solid #E1E8F4' }} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
              <option value="">All Priorities</option>
              {['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
            </select>
            <select className="glass-input" style={{ fontSize: 12, padding: '6px 10px', borderRadius: 8, border: '1px solid #E1E8F4' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {['Open', 'In Progress', 'Pending', 'Resolved', 'Closed'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        }
        views={[
          { icon: <LayoutList size={15} />, key: 'list' },
          { icon: <Columns size={15} />, key: 'kanban' },
        ]}
        currentView={view}
        onViewChange={setView}
        actions={[
          { label: 'AI Generate', icon: <Sparkles size={16} />, variant: 'purple', onClick: () => setShowAiModal(true) },
          { label: 'New Ticket', icon: <Plus size={16} />, variant: 'primary', onClick: openCreate },
        ]}
      />

      {loading ? (
        <div className="text-center p-5"><div className="spinner-border text-primary" /></div>
      ) : view === 'list' ? (
        /* List View */
        <div style={{ background: '#FFF', border: '1px solid #E1E8F4', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
          <table className="table table-hover mb-0" style={{ fontSize: 13 }}>
            <thead style={{ background: '#F8FAFC', borderBottom: '2px solid #E1E8F4' }}>
              <tr>
                {['Ticket #', 'Title', 'Type', 'Priority', 'Status', 'Assigned', 'Due Date', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontWeight: 700, color: '#64748B', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-5 text-muted">No tickets found.</td></tr>
              ) : filtered.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }} onClick={() => openEdit(t)}>
                  <td style={{ padding: '10px 16px', fontWeight: 700, color: '#4361EE', fontFamily: 'monospace', fontSize: 12 }}>{t.ticketNumber}</td>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: '#0F172A', maxWidth: 280 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                    {t.isAiGenerated && <span className="ai-badge" style={{ marginTop: 3, display: 'inline-flex' }}><Sparkles size={9} />AI</span>}
                  </td>
                  <td style={{ padding: '10px 16px' }}><span className={`ticket-type-badge ${TYPE_BADGE[t.type] ?? ''}`}>{t.type}</span></td>
                  <td style={{ padding: '10px 16px' }}><span className={`ticket-priority-badge ${PRIORITY_BADGE[t.priority] ?? ''}`}><span className={`ticket-priority-dot priority-${t.priority.toLowerCase()}`} />{t.priority}</span></td>
                  <td style={{ padding: '10px 16px' }}><span className={`badge-enterprise ${STATUS_BADGE[t.status] ?? 'badge-gray'}`}>{t.status}</span></td>
                  <td style={{ padding: '10px 16px', color: '#64748B' }}>{t.assignedToName ?? '—'}</td>
                  <td style={{ padding: '10px 16px', color: '#64748B' }}>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '10px 16px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4, opacity: 0 }} className="row-actions">
                      <button className="action-icon-btn text-info" title="Edit" onClick={() => openEdit(t)}><FaPen size={12} /></button>
                      <button className="action-icon-btn text-danger" title="Delete" onClick={() => handleDelete(t.id)}><FaTrash size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Kanban View */
        <div className="ticket-kanban">
          {KANBAN_COLS.map(col => {
            const colTickets = filtered.filter(t => t.status === col);
            return (
              <div key={col} className="kanban-col">
                <div className="kanban-col-header">
                  <span className="kanban-col-title">{col}</span>
                  <span className="kanban-count">{colTickets.length}</span>
                </div>
                {colTickets.map(t => (
                  <div key={t.id} className="kanban-card" onClick={() => openEdit(t)}>
                    <div className="kanban-card-number">{t.ticketNumber}</div>
                    <div className="kanban-card-title">{t.title}</div>
                    <div className="kanban-card-footer">
                      <span className={`ticket-priority-badge ${PRIORITY_BADGE[t.priority] ?? ''}`} style={{ fontSize: 10 }}>
                        <span className={`ticket-priority-dot priority-${t.priority.toLowerCase()}`} />{t.priority}
                      </span>
                      {t.isAiGenerated && <span className="ai-badge" style={{ fontSize: 10 }}><Sparkles size={9} />AI</span>}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      <TicketModal show={showModal} onHide={() => setShowModal(false)} editing={editing} onSaved={handleSaved} />
      <AITicketModal show={showAiModal} onHide={() => setShowAiModal(false)} onConfirm={handleAiConfirm} />
    </div>
  );
}
