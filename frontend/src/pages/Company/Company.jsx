import { useState, useEffect } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { Building, Globe, MapPin, Edit, Trash2, Users, Briefcase } from 'lucide-react';
import { companyService } from '../../services/companyService';
import { useToast } from '../../components/Toast/ToastContext';
import PageToolbar from '../../components/PageToolbar/PageToolbar';
import StatsGrid from '../../components/StatsGrid/StatsGrid';
import './Company.css';

const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Education', 'Real Estate', 'Consulting', 'Other'];
const SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

const EMPTY_FORM = {
  name: '', industry: '', size: '', website: '',
  address: '', country: '', gstin: '', tags: ''
};

export default function Company() {
  const toast = useToast();
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { loadCompanies(); }, []);

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      const data = await companyService.getCompanies();
      setCompanies(data || []);
    } catch (e) {
      console.error('Error loading companies:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...EMPTY_FORM, ...c }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Company name is required'); return; }
    try {
      if (editing) {
        await companyService.updateCompany(editing.id, form);
        toast.success('Company updated');
      } else {
        await companyService.createCompany(form);
        toast.success('Company created');
      }
      setShowModal(false);
      loadCompanies();
    } catch (e) {
      toast.error(e.message || 'Failed to save company');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this company?')) return;
    try {
      await companyService.deleteCompany(id);
      toast.success('Company deleted');
      loadCompanies();
    } catch (e) {
      toast.error('Failed to delete company');
    }
  };

  const filtered = companies.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: 'Total Companies', value: companies.length, icon: <Building size={22} />, color: 'blue' },
    { label: 'Industries', value: new Set(companies.map(c => c.industry).filter(Boolean)).size, icon: <Briefcase size={22} />, color: 'purple' },
    { label: 'Countries', value: new Set(companies.map(c => c.country).filter(Boolean)).size, icon: <Globe size={22} />, color: 'green' },
    { label: 'Total Contacts', value: companies.reduce((s, c) => s + (c.contactCount || 0), 0), icon: <Users size={22} />, color: 'orange' },
  ];

  return (
    <div className="company-container">
      <StatsGrid stats={stats} />

      <PageToolbar
        title="Companies"
        itemCount={filtered.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAdd={openAdd}
        addLabel="Add Company"
      />

      {isLoading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" />
        </div>
      ) : (
        <div className="row g-3 mt-1">
          {filtered.map(c => (
            <div key={c.id} className="col-12 col-md-6 col-xl-4">
              <div className="company-card">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fw-bold fs-6">{c.name}</div>
                    {c.industry && <div className="text-muted small">{c.industry}{c.size ? ` · ${c.size} employees` : ''}</div>}
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-light" onClick={() => openEdit(c)}><Edit size={14} /></button>
                    <button className="btn btn-sm btn-light text-danger" onClick={() => handleDelete(c.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="mt-2 d-flex flex-wrap gap-2">
                  {c.country && <span className="text-muted small"><MapPin size={12} className="me-1" />{c.country}</span>}
                  {c.website && <a href={c.website} target="_blank" rel="noreferrer" className="text-primary small"><Globe size={12} className="me-1" />{c.website}</a>}
                </div>
                {c.tags && (
                  <div className="mt-2">
                    {c.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                      <span key={t} className="company-badge bg-light text-secondary me-1">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-muted py-5">No companies found. Add your first company.</div>
          )}
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h6 fw-bold">{editing ? 'Edit Company' : 'Add Company'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row g-3">
            {[
              { label: 'Company Name *', key: 'name', type: 'text', col: 12 },
              { label: 'Website', key: 'website', type: 'text', col: 6 },
              { label: 'Country', key: 'country', type: 'text', col: 6 },
              { label: 'Address', key: 'address', type: 'text', col: 12 },
              { label: 'GSTIN / Tax ID', key: 'gstin', type: 'text', col: 6 },
              { label: 'Tags (comma separated)', key: 'tags', type: 'text', col: 6 },
            ].map(f => (
              <div key={f.key} className={`col-${f.col}`}>
                <Form.Label className="small fw-semibold mb-1">{f.label}</Form.Label>
                <Form.Control size="sm" type={f.type} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div className="col-6">
              <Form.Label className="small fw-semibold mb-1">Industry</Form.Label>
              <Form.Select size="sm" value={form.industry || ''} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}>
                <option value="">Select industry</option>
                {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
              </Form.Select>
            </div>
            <div className="col-6">
              <Form.Label className="small fw-semibold mb-1">Company Size</Form.Label>
              <Form.Select size="sm" value={form.size || ''} onChange={e => setForm(p => ({ ...p, size: e.target.value }))}>
                <option value="">Select size</option>
                {SIZES.map(s => <option key={s}>{s}</option>)}
              </Form.Select>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSave}>{editing ? 'Update' : 'Create'} Company</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
