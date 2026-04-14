import React, { useEffect, useState, useCallback } from 'react';
import { legalService } from '../../services/legalService';
import PageToolbar from '../../components/PageToolbar/PageToolbar';
import { Plus, FileText, Shield, AlertTriangle, Clock } from 'lucide-react';
import { FaPen, FaTrash } from 'react-icons/fa6';
import LegalModal from './LegalModal';
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
  const [agreements, setAgreements] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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
    setFiltered(list);
  }, [agreements, search, typeFilter, statusFilter]);

  const openCreate = () => { setEditing(null); setShowModal(true); };
  const openEdit = (a) => { setEditing(a); setShowModal(true); };

  const handleSaved = async (payload) => {
    try {
      if (editing) {
        await legalService.update(editing.id, payload);
      } else {
        await legalService.create(payload);
      }
      setShowModal(false);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this agreement?')) return;
    try {
      await legalService.delete(id);
      setAgreements(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      alert(e.message);
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

  const stats = [
    { label: 'Total', value: total, icon: <FileText size={18} />, color: '#4361EE' },
    { label: 'Active (Signed)', value: active, icon: <Shield size={18} />, color: '#10B981' },
    { label: 'Expiring Soon', value: expiring, icon: <AlertTriangle size={18} />, color: '#F59E0B' },
    { label: 'Drafts', value: drafts, icon: <Clock size={18} />, color: '#64748B' },
  ];

  return (
    <div style={{ padding: '0 16px 24px' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: '#FFF', border: '1px solid #E1E8F4', borderRadius: 12, padding: '14px 18px', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{s.label}</span>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-display)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <PageToolbar
        title="Legal Agreements"
        itemCount={filtered.length}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search agreements…"
        extraControls={
          <div style={{ display: 'flex', gap: 6 }}>
            <select className="glass-input" style={{ fontSize: 12, padding: '6px 10px', borderRadius: 8, border: '1px solid #E1E8F4' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {['MSA', 'NDA', 'SOW', 'Internal Approval'].map(t => <option key={t}>{t}</option>)}
            </select>
            <select className="glass-input" style={{ fontSize: 12, padding: '6px 10px', borderRadius: 8, border: '1px solid #E1E8F4' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              {['Draft', 'Under Review', 'Approved', 'Signed', 'Expired', 'Terminated'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        }
        actions={[{ label: 'New Agreement', icon: <Plus size={16} />, variant: 'primary', onClick: openCreate }]}
      />

      {loading ? (
        <div className="text-center p-5"><div className="spinner-border text-primary" /></div>
      ) : (
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
      )}

      <LegalModal
        show={showModal}
        onHide={() => setShowModal(false)}
        editing={editing}
        onSaved={handleSaved}
      />

      <style>{`tr:hover .row-actions { opacity: 1 !important; }`}</style>
    </div>
  );
}
