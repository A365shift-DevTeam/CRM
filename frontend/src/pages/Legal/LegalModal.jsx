import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Nav, Tab } from 'react-bootstrap';
import { Upload, FileText, X } from 'lucide-react';
import AuditPanel from '../../components/AuditPanel/AuditPanel';
import { uploadFile } from '../../services/storageService';

const TYPES = ['MSA', 'NDA', 'SOW', 'Internal Approval'];
const STATUSES = ['Draft', 'Under Review', 'Approved', 'Signed', 'Expired', 'Terminated'];

const emptyForm = {
  title: '', type: 'MSA', status: 'Draft', version: '', description: '',
  contactId: '', companyId: '', projectId: '', leadId: '',
  ourSignatory: '', counterSignatory: '',
  effectiveDate: '', expiryDate: '', signedDate: '',
  autoRenew: false, renewalNoticeDays: '',
  fileUrl: '', fileName: '', notes: ''
};

export default function LegalModal({ show, onHide, editing, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [tab, setTab] = useState('details');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title ?? '',
        type: editing.type ?? 'MSA',
        status: editing.status ?? 'Draft',
        version: editing.version ?? '',
        description: editing.description ?? '',
        contactId: editing.contactId ?? '',
        companyId: editing.companyId ?? '',
        projectId: editing.projectId ?? '',
        leadId: editing.leadId ?? '',
        ourSignatory: editing.ourSignatory ?? '',
        counterSignatory: editing.counterSignatory ?? '',
        effectiveDate: editing.effectiveDate ? editing.effectiveDate.split('T')[0] : '',
        expiryDate: editing.expiryDate ? editing.expiryDate.split('T')[0] : '',
        signedDate: editing.signedDate ? editing.signedDate.split('T')[0] : '',
        autoRenew: editing.autoRenew ?? false,
        renewalNoticeDays: editing.renewalNoticeDays ?? '',
        fileUrl: editing.fileUrl ?? '',
        fileName: editing.fileName ?? '',
        notes: editing.notes ?? ''
      });
    } else {
      setForm(emptyForm);
    }
    setTab('details');
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
    if (!form.type) { alert('Type is required'); return; }
    const payload = {
      ...form,
      contactId: form.contactId ? parseInt(form.contactId) : null,
      companyId: form.companyId ? parseInt(form.companyId) : null,
      projectId: form.projectId ? parseInt(form.projectId) : null,
      leadId: form.leadId ? parseInt(form.leadId) : null,
      renewalNoticeDays: form.renewalNoticeDays ? parseInt(form.renewalNoticeDays) : null,
      effectiveDate: form.effectiveDate || null,
      expiryDate: form.expiryDate || null,
      signedDate: form.signedDate || null,
    };
    onSaved(payload);
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: '1rem', fontWeight: 700 }}>
          {editing ? 'Edit Agreement' : 'New Legal Agreement'}
        </Modal.Title>
      </Modal.Header>

      <Tab.Container activeKey={tab} onSelect={setTab}>
        <Modal.Body style={{ padding: '0' }}>
          <Nav variant="tabs" style={{ padding: '0 20px', borderBottom: '1px solid #E1E8F4', background: '#F8FAFC' }}>
            <Nav.Item><Nav.Link eventKey="details" style={{ fontSize: 13 }}>Details</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="parties" style={{ fontSize: 13 }}>Parties & Dates</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="document" style={{ fontSize: 13 }}>Document</Nav.Link></Nav.Item>
            {editing && <Nav.Item><Nav.Link eventKey="history" style={{ fontSize: 13 }}>History</Nav.Link></Nav.Item>}
          </Nav>

          <div style={{ padding: '20px' }}>
            <Tab.Content>
              {/* Details Tab */}
              <Tab.Pane eventKey="details">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Title *</Form.Label>
                  <Form.Control className="glass-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Acme Corp MSA 2026" />
                </Form.Group>
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Type *</Form.Label>
                    <Form.Select className="glass-input" value={form.type} onChange={e => set('type', e.target.value)}>
                      {TYPES.map(t => <option key={t}>{t}</option>)}
                    </Form.Select>
                  </div>
                  <div className="col-6">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Status</Form.Label>
                    <Form.Select className="glass-input" value={form.status} onChange={e => set('status', e.target.value)}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </Form.Select>
                  </div>
                </div>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Version</Form.Label>
                  <Form.Control className="glass-input" value={form.version} onChange={e => set('version', e.target.value)} placeholder="v1.0" />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Description</Form.Label>
                  <Form.Control as="textarea" rows={3} className="glass-input" value={form.description} onChange={e => set('description', e.target.value)} />
                </Form.Group>
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Contact ID</Form.Label>
                    <Form.Control className="glass-input" type="number" value={form.contactId} onChange={e => set('contactId', e.target.value)} placeholder="Optional" />
                  </div>
                  <div className="col-6">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Company ID</Form.Label>
                    <Form.Control className="glass-input" type="number" value={form.companyId} onChange={e => set('companyId', e.target.value)} placeholder="Optional" />
                  </div>
                </div>
                <div className="row g-3">
                  <div className="col-6">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Project ID</Form.Label>
                    <Form.Control className="glass-input" type="number" value={form.projectId} onChange={e => set('projectId', e.target.value)} placeholder="Optional" />
                  </div>
                  <div className="col-6">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Lead ID</Form.Label>
                    <Form.Control className="glass-input" type="number" value={form.leadId} onChange={e => set('leadId', e.target.value)} placeholder="Optional" />
                  </div>
                </div>
              </Tab.Pane>

              {/* Parties & Dates Tab */}
              <Tab.Pane eventKey="parties">
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Our Signatory</Form.Label>
                    <Form.Control className="glass-input" value={form.ourSignatory} onChange={e => set('ourSignatory', e.target.value)} placeholder="e.g. CEO Name" />
                  </div>
                  <div className="col-6">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Counter-party Signatory</Form.Label>
                    <Form.Control className="glass-input" value={form.counterSignatory} onChange={e => set('counterSignatory', e.target.value)} placeholder="e.g. Client Name" />
                  </div>
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-4">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Effective Date</Form.Label>
                    <Form.Control className="glass-input" type="date" value={form.effectiveDate} onChange={e => set('effectiveDate', e.target.value)} />
                  </div>
                  <div className="col-4">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Expiry Date</Form.Label>
                    <Form.Control className="glass-input" type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
                  </div>
                  <div className="col-4">
                    <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Signed Date</Form.Label>
                    <Form.Control className="glass-input" type="date" value={form.signedDate} onChange={e => set('signedDate', e.target.value)} />
                  </div>
                </div>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <Form.Check
                    type="switch"
                    id="auto-renew-switch"
                    label="Auto-renew"
                    checked={form.autoRenew}
                    onChange={e => set('autoRenew', e.target.checked)}
                  />
                  {form.autoRenew && (
                    <div className="d-flex align-items-center gap-2">
                      <Form.Control
                        className="glass-input"
                        type="number"
                        style={{ width: 80 }}
                        value={form.renewalNoticeDays}
                        onChange={e => set('renewalNoticeDays', e.target.value)}
                        placeholder="30"
                        min={1}
                      />
                      <span style={{ fontSize: 13, color: '#64748B' }}>days before expiry</span>
                    </div>
                  )}
                </div>
                <Form.Group>
                  <Form.Label className="fw-bold" style={{ fontSize: '0.85rem' }}>Notes</Form.Label>
                  <Form.Control as="textarea" rows={4} className="glass-input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Internal notes, renewal conditions, etc." />
                </Form.Group>
              </Tab.Pane>

              {/* Document Tab */}
              <Tab.Pane eventKey="document">
                <div className={`legal-file-area ${form.fileUrl ? 'has-file' : ''}`} onClick={() => document.getElementById('legal-file-input').click()}>
                  {form.fileUrl ? (
                    <div>
                      <FileText size={28} style={{ color: '#10B981', marginBottom: 8 }} />
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#0F172A' }}>{form.fileName}</p>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748B' }}>Click to replace</p>
                      <button
                        className="btn btn-sm mt-3"
                        style={{ background: 'none', border: '1px solid #E1E8F4', borderRadius: 8, fontSize: 12, color: '#64748B' }}
                        onClick={e => { e.stopPropagation(); window.open(form.fileUrl, '_blank'); }}
                      >
                        View Document
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload size={28} style={{ color: '#94A3B8', marginBottom: 8 }} />
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#475569' }}>
                        {uploading ? 'Uploading…' : 'Click to upload agreement document'}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94A3B8' }}>PDF, DOCX, PNG — max 10MB</p>
                    </div>
                  )}
                </div>
                <input
                  id="legal-file-input"
                  type="file"
                  accept=".pdf,.docx,.doc,.png,.jpg"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                {form.fileUrl && (
                  <button
                    className="btn btn-sm mt-2"
                    style={{ color: '#EF4444', background: 'none', border: 'none', fontSize: 12, padding: 0 }}
                    onClick={() => { set('fileUrl', ''); set('fileName', ''); }}
                  >
                    <X size={12} style={{ marginRight: 4 }} />Remove file
                  </button>
                )}
              </Tab.Pane>

              {/* History Tab */}
              {editing && (
                <Tab.Pane eventKey="history">
                  <AuditPanel entityName="LegalAgreement" entityId={editing?.id} />
                </Tab.Pane>
              )}
            </Tab.Content>
          </div>
        </Modal.Body>
      </Tab.Container>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button onClick={handleSave} style={{ background: '#4361EE', border: 'none' }}>
          {editing ? 'Save Changes' : 'Create Agreement'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
