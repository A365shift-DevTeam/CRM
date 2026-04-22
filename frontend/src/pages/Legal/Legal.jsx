import React, { useEffect, useState, useCallback } from 'react';
import { legalService } from '../../services/legalService';
import PageToolbar from '../../components/PageToolbar/PageToolbar';
import StatsGrid from '../../components/StatsGrid/StatsGrid';
import { useToast } from '../../components/Toast/ToastContext';
import { Plus, FileText, Shield, AlertTriangle, Clock, List, Columns, Target } from 'lucide-react';
import { FaPen, FaTrash } from 'react-icons/fa6';
import Swal from 'sweetalert2';
import LegalModal from './LegalModal';
import { ChartView } from './ChartView';
import './Legal.css';

const TYPE_CLASS = {
  'MSA': 'legal-type-msa',
  'NDA': 'legal-type-nda',
  'SOW': 'legal-type-sow',
  'Internal Approval': 'legal-type-internal',
};

const STATUS_CLASS = {
  'Draft': 'legal-status-draft',
  'Under Review': 'legal-status-under-review',
  'Approved': 'legal-status-approved',
  'Signed': 'legal-status-signed',
  'Expired': 'legal-status-expired',
  'Terminated': 'legal-status-terminated',
};

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - Date.now()) / 86400000);
}

function ExpiryCell({ expiryDate }) {
  if (!expiryDate) return <span style={{ color: '#CBD5E1' }}>—</span>;
  const days = daysUntil(expiryDate);
  const label = new Date(expiryDate).toLocaleDateString();
  if (days < 0) return <span className="legal-expiry-danger">{label} (Expired)</span>;
  if (days <= 30) return <span className="legal-expiry-warning">{label} ({days}d)</span>;
  return <span>{label}</span>;
}

export default function Legal() {
  const toast = useToast();
  const [agreements, setAgreements] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await legalService.getAll();
      setAgreements(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let list = agreements;
    if (search) list = list.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || (a.counterSignatory ?? '').toLowerCase().includes(search.toLowerCase()));
    if (typeFilter) list = list.filter(a => a.type === typeFilter);
    if (statusFilter) list = list.filter(a => a.status === statusFilter);
    list = [...list].sort((a, b) => {
      const av = String(a[sortBy] ?? '').toLowerCase();
      const bv = String(b[sortBy] ?? '').toLowerCase();
      return sortOrder === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    setFiltered(list);
  }, [agreements, search, typeFilter, statusFilter, sortBy, sortOrder]);

  const openCreate = () => { setEditing(null); setShowModal(true); };
  const openEdit = (a) => { setEditing(a); setShowModal(true); };

  const handleSaved = async (payload) => {
    try {
      if (editing) {
        await legalService.update(editing.id, payload);
        toast.success('Agreement updated');
      } else {
        await legalService.create(payload);
        toast.success('Agreement created');
      }
      setShowModal(false);
      load();
    } catch (e) {
      toast.error(e.message || 'Failed to save agreement');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete agreement?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await legalService.delete(id);
      toast.success('Agreement deleted');
      setAgreements(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      toast.error('Failed to delete agreement');
    }
  };

  // Stats
  const total = agreements.length;
  const active = agreements.filter(a => a.status === 'Signed').length;
  const expiring = agreements.filter(a => {
    const d = daysUntil(a.expiryDate);
    return d !== null && d >= 0 && d <= 30 && a.status !== 'Expired' && a.status !== 'Terminated';
  }).length;
  const drafts = agreements.filter(a => a.status === 'Draft').length;

  const statsData = [
    { label: 'Total', value: total, icon: <FileText size={18} />, color: 'blue' },
    { label: 'Active (Signed)', value: active, icon: <Shield size={18} />, color: 'green' },
    { label: 'Expiring Soon', value: expiring, icon: <AlertTriangle size={18} />, color: 'orange' },
    { label: 'Drafts', value: drafts, icon: <Clock size={18} />, color: 'purple' },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <StatsGrid stats={statsData} />

      <PageToolbar
        title="Legal Agreements"
        itemCount={filtered.length}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search agreements…"
        panelFilters={[
          { id: 'type', label: 'Type', type: 'select', options: ['MSA', 'NDA', 'SOW', 'Internal Approval'] },
          { id: 'status', label: 'Status', type: 'select', options: ['Draft', 'Under Review', 'Approved', 'Signed', 'Expired', 'Terminated'] },
        ]}
        panelFilterValues={{ type: typeFilter, status: statusFilter }}
        onPanelFilterChange={(id, val) => { if (id === 'type') setTypeFilter(val); else setStatusFilter(val); }}
        onClearPanelFilters={() => { setTypeFilter(''); setStatusFilter(''); }}
        sortOptions={[
          { id: 'title', name: 'Title' },
          { id: 'type', name: 'Type' },
          { id: 'status', name: 'Status' },
          { id: 'effectiveDate', name: 'Effective Date' },
          { id: 'expiryDate', name: 'Expiry Date' },
        ]}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(sb, so) => { setSortBy(sb); setSortOrder(so); }}
        viewModes={[
          { id: 'list', label: 'List' },
          { id: 'kanban', label: 'Kanban' },
          { id: 'chart', label: 'Chart' },
        ]}
        activeView={viewMode}
        onViewChange={setViewMode}
        actions={[{ label: 'New Agreement', icon: <Plus size={16} />, variant: 'primary', onClick: openCreate }]}
      />

      {loading ? (
        <div className="text-center p-5"><div className="spinner-border text-primary" /></div>
      ) : viewMode === 'list' ? (
        <div style={{ background: '#FFF', border: '1px solid #E1E8F4', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
          <table className="table table-hover mb-0" style={{ fontSize: 13 }}>
            <thead style={{ background: '#F8FAFC', borderBottom: '2px solid #E1E8F4' }}>
              <tr>
                <th style={{ padding: '10px 16px', fontWeight: 700, color: '#64748B', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</th>
                <th style={{ padding: '10px 16px', fontWeight: 700, color: '#64748B', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                <th style={{ padding: '10px 16px', fontWeight: 700, color: '#64748B', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '10px 16px', fontWeight: 700, color: '#64748B', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Counter-party</th>
                <th style={{ padding: '10px 16px', fontWeight: 700, color: '#64748B', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Effective</th>
                <th style={{ padding: '10px 16px', fontWeight: 700, color: '#64748B', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expiry</th>
                <th style={{ padding: '10px 16px', width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-5 text-muted">No agreements found.</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }} onClick={() => openEdit(a)}>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: '#0F172A' }}>
                    {a.title}
                    {a.version && <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 6 }}>{a.version}</span>}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span className={`legal-type-badge ${TYPE_CLASS[a.type] ?? ''}`}>{a.type}</span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span className={`badge-enterprise ${STATUS_CLASS[a.status] ?? ''}`}>{a.status}</span>
                  </td>
                  <td style={{ padding: '10px 16px', color: '#475569' }}>{a.counterSignatory ?? '—'}</td>
                  <td style={{ padding: '10px 16px', color: '#64748B' }}>
                    {a.effectiveDate ? new Date(a.effectiveDate).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '10px 16px' }}><ExpiryCell expiryDate={a.expiryDate} /></td>
                  <td style={{ padding: '10px 16px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4, opacity: 0 }} className="row-actions">
                      <button className="action-icon-btn text-info" title="Edit" onClick={() => openEdit(a)}><FaPen size={12} /></button>
                      <button className="action-icon-btn text-danger" title="Delete" onClick={() => handleDelete(a.id)}><FaTrash size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="row flex-nowrap overflow-auto pb-3 mt-1" style={{ minHeight: 400 }}>
          {['Draft', 'Under Review', 'Approved', 'Signed', 'Expired', 'Terminated'].map(status => (
            <div key={status} className="col-11 col-sm-6 col-md-4 col-lg-3" style={{ minWidth: 260 }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E1E8F4', borderRadius: 12, padding: 12, height: '100%' }}>
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{status}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, background: '#E1E8F4', color: '#64748B', padding: '1px 8px', borderRadius: 999 }}>
                    {filtered.filter(a => a.status === status).length}
                  </div>
                </div>
                <div className="d-flex flex-column gap-2">
                  {filtered.filter(a => a.status === status).map(a => (
                    <div key={a.id} onClick={() => openEdit(a)} style={{ background: '#FFF', border: '1px solid #E1E8F4', borderRadius: 10, padding: 12, cursor: 'pointer', boxShadow: '0 1px 2px rgba(15,23,42,0.03)' }}>
                      <div className="fw-semibold text-dark mb-1" style={{ fontSize: 13 }}>{a.title}</div>
                      <div className="text-muted mb-2" style={{ fontSize: 11 }}>{a.counterSignatory ?? 'No counter-party'}</div>
                      <div className="d-flex align-items-center justify-content-between">
                        <span className={`legal-type-badge ${TYPE_CLASS[a.type] ?? ''}`}>{a.type}</span>
                        <div style={{ fontSize: 11 }}><ExpiryCell expiryDate={a.expiryDate} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'chart' ? (
        <ChartView agreements={filtered} />
      ) : null}

      <LegalModal
        show={showModal}
        onHide={() => setShowModal(false)}
        editing={editing}
        onSaved={handleSaved}
      />

    </div>
  );
}
