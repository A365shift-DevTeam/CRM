import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { Upload, FileText, X } from 'lucide-react';
import AuditPanel from '../../components/AuditPanel/AuditPanel';
import { uploadFile } from '../../services/storageService';

const TYPES = ['MSA', 'NDA', 'SOW', 'Internal Approval'];
const STATUSES = ['Draft', 'Under Review', 'Approved', 'Signed', 'Expired', 'Terminated'];

const emptyForm = {
  title: '', type: 'MSA', status: 'Draft', version: '',
  description: '', ourSignatory: '', counterSignatory: '',
  effectiveDate: '', expiryDate: '', signedDate: '',
  autoRenew: false, renewalNoticeDays: '',
  fileUrl: '', fileName: '', notes: '',
  contactId: '', companyId: '', projectId: '', leadId: '',
};

const TYPE_META = {
  MSA: { color: '#0062CC', bg: 'rgba(0,122,255,0.08)', border: 'rgba(0,122,255,0.25)' },
  NDA: { color: '#8944AB', bg: 'rgba(175,82,222,0.08)', border: 'rgba(175,82,222,0.25)' },
  SOW: { color: '#248A3D', bg: 'rgba(52,199,89,0.08)', border: 'rgba(52,199,89,0.25)' },
  'Internal Approval': { color: '#C93400', bg: 'rgba(255,149,0,0.08)', border: 'rgba(255,149,0,0.25)' },
};

function Label({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
      {children}
    </div>
  );
}

export default function LegalModal({ show, onHide, editing, onSaved, initialValues }) {
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!show) return;
    if (editing) {
      setForm({
        title: editing.title ?? '',
        type: editing.type ?? 'MSA',
        status: editing.status ?? 'Draft',
        version: editing.version ?? '',
        description: editing.description ?? '',
        ourSignatory: editing.ourSignatory ?? '',
        counterSignatory: editing.counterSignatory ?? '',
        effectiveDate: editing.effectiveDate ? editing.effectiveDate.split('T')[0] : '',
        expiryDate: editing.expiryDate ? editing.expiryDate.split('T')[0] : '',
        signedDate: editing.signedDate ? editing.signedDate.split('T')[0] : '',
        autoRenew: editing.autoRenew ?? false,
        renewalNoticeDays: editing.renewalNoticeDays ?? '',
        fileUrl: editing.fileUrl ?? '',
        fileName: editing.fileName ?? '',
        notes: editing.notes ?? '',
        contactId: editing.contactId ?? '',
        companyId: editing.companyId ?? '',
        projectId: editing.projectId ?? '',
        leadId: editing.leadId ?? '',
      });
    } else {
      setForm({ ...emptyForm, ...(initialValues ?? {}) });
    }
    setShowHistory(false);
  }, [editing, show]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, 'legal');
      set('fileUrl', url);
      set('fileName', file.name);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!form.title.trim()) { alert('Title is required'); return; }
    onSaved({
      ...form,
      contactId: form.contactId ? parseInt(form.contactId) : null,
      companyId: form.companyId ? parseInt(form.companyId) : null,
      projectId: form.projectId ? parseInt(form.projectId) : null,
      leadId: form.leadId ? parseInt(form.leadId) : null,
      renewalNoticeDays: form.renewalNoticeDays ? parseInt(form.renewalNoticeDays) : null,
      effectiveDate: form.effectiveDate || null,
      expiryDate: form.expiryDate || null,
      signedDate: form.signedDate || null,
    });
  };

  const meta = TYPE_META[form.type] ?? TYPE_META.MSA;

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton style={{ paddingBottom: 14 }}>
        <Modal.Title style={{ fontSize: '1rem', fontWeight: 700 }}>
          {editing ? 'Edit Agreement' : 'New Legal Agreement'}
        </Modal.Title>
        {editing && (
          <button
            onClick={() => setShowHistory(v => !v)}
            style={{ marginLeft: 'auto', marginRight: 12, fontSize: 12, fontWeight: 600, color: '#64748B', background: 'none', border: '1px solid #E1E8F4', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}
          >
            {showHistory ? 'Back to Form' : 'History'}
          </button>
        )}
      </Modal.Header>

      <Modal.Body style={{ padding: '20px 24px', maxHeight: '72vh', overflowY: 'auto' }}>
        {showHistory && editing ? (
          <AuditPanel entityName="LegalAgreement" entityId={editing.id} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Type selector — pill tabs */}
            <div>
              <Label>Agreement Type *</Label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {TYPES.map(t => {
                  const m = TYPE_META[t] ?? TYPE_META.MSA;
                  const active = form.type === t;
                  return (
                    <button
                      key={t}
                      onClick={() => set('type', t)}
                      style={{
                        padding: '7px 16px', borderRadius: 999, border: `1.5px solid ${active ? m.color : '#E1E8F4'}`,
                        background: active ? m.bg : '#fff', color: active ? m.color : '#64748B',
                        fontWeight: active ? 700 : 500, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title + Status row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
              <div>
                <Label>Title *</Label>
                <Form.Control className="glass-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder={`e.g. Acme Corp ${form.type} 2026`} autoFocus />
              </div>
              <div style={{ minWidth: 150 }}>
                <Label>Status</Label>
                <Form.Select className="glass-input" value={form.status} onChange={e => set('status', e.target.value)}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </Form.Select>
              </div>
            </div>

            {/* Signatories */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <Label>Our Signatory</Label>
                <Form.Control className="glass-input" value={form.ourSignatory} onChange={e => set('ourSignatory', e.target.value)} placeholder="e.g. CEO Name" />
              </div>
              <div>
                <Label>Counter-party Signatory</Label>
                <Form.Control className="glass-input" value={form.counterSignatory} onChange={e => set('counterSignatory', e.target.value)} placeholder="e.g. Client Name" />
              </div>
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <Label>Effective Date</Label>
                <Form.Control className="glass-input" type="date" value={form.effectiveDate} onChange={e => set('effectiveDate', e.target.value)} />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Form.Control className="glass-input" type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
              </div>
              <div>
                <Label>Signed Date</Label>
                <Form.Control className="glass-input" type="date" value={form.signedDate} onChange={e => set('signedDate', e.target.value)} />
              </div>
            </div>

            {/* Version + Auto-renew */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'end' }}>
              <div>
                <Label>Version</Label>
                <Form.Control className="glass-input" value={form.version} onChange={e => set('version', e.target.value)} placeholder="v1.0" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 2 }}>
                <Form.Check
                  type="switch"
                  id="auto-renew-sw"
                  label="Auto-renew"
                  checked={form.autoRenew}
                  onChange={e => set('autoRenew', e.target.checked)}
                  style={{ fontSize: 13 }}
                />
                {form.autoRenew && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Form.Control
                      className="glass-input"
                      type="number"
                      style={{ width: 72 }}
                      value={form.renewalNoticeDays}
                      onChange={e => set('renewalNoticeDays', e.target.value)}
                      placeholder="30"
                      min={1}
                    />
                    <span style={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>days before</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <Label>Description</Label>
              <Form.Control as="textarea" rows={2} className="glass-input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description of this agreement…" />
            </div>

            {/* Notes */}
            <div>
              <Label>Notes</Label>
              <Form.Control as="textarea" rows={2} className="glass-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Internal notes, renewal conditions, etc." />
            </div>

            {/* File upload */}
            <div>
              <Label>Document</Label>
              <div
                className={`legal-file-area ${form.fileUrl ? 'has-file' : ''}`}
                onClick={() => document.getElementById('legal-file-input-flat').click()}
              >
                {form.fileUrl ? (
                  <div>
                    <FileText size={24} style={{ color: '#10B981', marginBottom: 6 }} />
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#0F172A' }}>{form.fileName}</p>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                      <button
                        style={{ background: 'none', border: '1px solid #E1E8F4', borderRadius: 7, fontSize: 12, color: '#64748B', padding: '3px 10px', cursor: 'pointer' }}
                        onClick={e => { e.stopPropagation(); window.open(form.fileUrl, '_blank'); }}
                      >
                        View
                      </button>
                      <button
                        style={{ background: 'none', border: 'none', fontSize: 12, color: '#EF4444', cursor: 'pointer' }}
                        onClick={e => { e.stopPropagation(); set('fileUrl', ''); set('fileName', ''); }}
                      >
                        <X size={11} style={{ marginRight: 3 }} />Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload size={22} style={{ color: '#94A3B8', marginBottom: 6 }} />
                    <p style={{ margin: 0, fontSize: 13, color: '#475569', fontWeight: 500 }}>
                      {uploading ? 'Uploading…' : 'Click to upload agreement document'}
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: 11, color: '#94A3B8' }}>PDF, DOCX, PNG — max 10MB</p>
                  </div>
                )}
              </div>
              <input
                id="legal-file-input-flat"
                type="file"
                accept=".pdf,.docx,.doc,.png,.jpg"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
            </div>

          </div>
        )}
      </Modal.Body>

      <Modal.Footer style={{ borderTop: '1px solid #F1F5F9' }}>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button onClick={handleSave} style={{ background: 'var(--button-brand, #5286A5)', border: 'none' }}>
          {editing ? 'Save Changes' : 'Create Agreement'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
