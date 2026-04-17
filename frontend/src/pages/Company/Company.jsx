import { useState, useEffect } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { Building, Globe, MapPin, Edit, Trash2, Users, Briefcase, ArrowUpRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { companyService } from '../../services/companyService';
import { contactService } from '../../services/contactService';
import { leadService } from '../../services/leadService';
import { useToast } from '../../components/Toast/ToastContext';
import PageToolbar from '../../components/PageToolbar/PageToolbar';
import StatsGrid from '../../components/StatsGrid/StatsGrid';
import './Company.css';

const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Education', 'Real Estate', 'Consulting', 'Other'];
const SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

// Fix #14: centralise India-country check used in both Edit modal and Wizard
const isIndia = (country) => !country || country.trim().toLowerCase() === 'india';

const EMPTY_FORM = {
  name: '', industry: '', size: '', website: '',
  address: '', country: '', gstin: '', tags: '',
  pan: '', cin: '', msmeStatus: 'NON MSME',
  tdsSection: '', tdsRate: '', internationalTaxId: ''
};

const buildCompanyPayload = (wf) => ({
  name:               wf.company_name || '',
  industry:           wf.company_industry || '',
  size:               wf.company_size || '',
  website:            wf.company_website || '',
  address:            wf.company_address || '',
  country:            wf.company_country || '',
  gstin:              wf.company_gstin || '',
  pan:                wf.company_pan || '',
  cin:                wf.company_cin || '',
  msmeStatus:         wf.company_msmeStatus || 'NON MSME',
  tdsSection:         wf.company_tdsSection || '',
  tdsRate:            wf.company_tdsRate || '',
  internationalTaxId: wf.company_internationalTaxId || '',
  tags:               wf.company_tags || '',
});

export default function Company() {
  const toast = useToast();
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showConvertContactModal, setShowConvertContactModal] = useState(false);
  const [convertingCompany, setConvertingCompany] = useState(null);
  const [convertContactForm, setConvertContactForm] = useState({});
  const [showWizard, setShowWizard]   = useState(false);
  const [wizardStep, setWizardStep]   = useState(1);
  const [wizardForm, setWizardForm]   = useState({});
  // Fix #15: read labels once into state instead of calling localStorage inside JSX
  const [productLabel] = useState(() => localStorage.getItem('app_product_label') || 'Products');
  const [serviceLabel] = useState(() => localStorage.getItem('app_service_label') || 'Services');

  useEffect(() => { loadCompanies(); }, []);

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      const data = await companyService.getCompanies();
      setCompanies((data?.items ?? data) || []);
    } catch (e) {
      console.error('Error loading companies:', e);
    } finally {
      setIsLoading(false);
    }
  };

const openEdit = (c) => { setEditing(c); setForm({ ...EMPTY_FORM, ...c }); setShowModal(true); };

  const openWizard  = () => { setWizardForm({}); setWizardStep(1); setShowWizard(true); };
  const closeWizard = () => { setShowWizard(false); setWizardStep(1); setWizardForm({}); };

  const handleWizardNext = () => {
    if (wizardStep === 1) {
      if (!wizardForm.company_name?.trim()) { toast.error('Company name is required'); return; }
      // Fix #9: always re-derive from current company fields so going Back then changing
      // company data properly propagates — only pre-fill if the contact field is still blank
      setWizardForm(p => ({
        ...p,
        contact_name:          p.contact_name          || p.company_name    || '',
        contact_clientCountry: p.company_country || '',
        contact_clientAddress: p.company_address || '',
      }));
      setWizardStep(2);
    } else if (wizardStep === 2) {
      if (!wizardForm.contact_name?.trim()) { toast.error('Contact name is required'); return; }
      // Fix #9: always use the latest contact_name / company_name so editing on step 2
      // and going back then forward does not carry stale values into step 3
      setWizardForm(p => ({
        ...p,
        lead_contactName: p.contact_name  || '',
        lead_company:     p.company_name  || '',
      }));
      setWizardStep(3);
    }
  };

  const handleWizardBack = () => setWizardStep(s => s - 1);

  const handleWizardSkipLead = async () => {
    if (!wizardForm.company_name?.trim())  { toast.error('Company name is required'); return; }
    if (!wizardForm.contact_name?.trim())  { toast.error('Contact name is required'); return; }
    // Fix #1: track created entities for rollback on partial failure
    let createdCompany = null;
    try {
      createdCompany = await companyService.createCompany(buildCompanyPayload(wizardForm));
      await contactService.createContact({
        name:          wizardForm.contact_name          || '',
        email:         wizardForm.contact_email         || '',
        phone:         wizardForm.contact_phone         || '',
        jobTitle:      wizardForm.contact_jobTitle      || '',
        status:        wizardForm.contact_status        || 'Active',
        location:      wizardForm.contact_location      || '',
        clientCountry: wizardForm.contact_clientCountry || '',
        clientAddress: wizardForm.contact_clientAddress || '',
        company:       wizardForm.company_name          || '',
        entityType:    'Company',
        companyId:     createdCompany.id,
      });
      toast.success('Company & Contact created');
      closeWizard();
      loadCompanies();
    } catch (e) {
      // Rollback: delete company if contact creation failed
      if (createdCompany?.id) {
        try { await companyService.deleteCompany(createdCompany.id); } catch {}
      }
      toast.error(e.message || 'Failed to save — please try again');
    }
  };

  const handleWizardSkip = async () => {
    if (!wizardForm.company_name?.trim()) { toast.error('Company name is required'); return; }
    try {
      await companyService.createCompany(buildCompanyPayload(wizardForm));
      toast.success('Company created');
      closeWizard();
      loadCompanies();
    } catch (e) {
      toast.error(e.message || 'Failed to create company');
    }
  };

  const handleWizardSave = async () => {
    if (!wizardForm.company_name?.trim())  { toast.error('Company name is required'); return; }
    if (!wizardForm.contact_name?.trim())  { toast.error('Contact name is required'); return; }
    // Fix #1: track each created entity so we can roll back on partial failure
    let createdCompany = null;
    let createdContact = null;
    try {
      createdCompany = await companyService.createCompany(buildCompanyPayload(wizardForm));

      createdContact = await contactService.createContact({
        name:          wizardForm.contact_name          || '',
        email:         wizardForm.contact_email         || '',
        phone:         wizardForm.contact_phone         || '',
        jobTitle:      wizardForm.contact_jobTitle      || '',
        status:        wizardForm.contact_status        || 'Active',
        location:      wizardForm.contact_location      || '',
        clientCountry: wizardForm.contact_clientCountry || '',
        clientAddress: wizardForm.contact_clientAddress || '',
        company:       wizardForm.company_name          || '',
        entityType:    'Company',
        companyId:     createdCompany.id,
      });

      await leadService.createLead({
        contactName:       wizardForm.lead_contactName || wizardForm.contact_name || '',
        company:           wizardForm.lead_company     || wizardForm.company_name  || '',
        source:            wizardForm.lead_source      || 'Inbound',
        score:             wizardForm.lead_score       || 'Warm',
        stage:             wizardForm.lead_stage       || 'New',
        type:              wizardForm.lead_type        || 'Product',
        expectedValue:     wizardForm.lead_expectedValue !== '' ? parseFloat(wizardForm.lead_expectedValue) || null : null,
        expectedCloseDate: wizardForm.lead_expectedCloseDate || null,
        assignedTo:        wizardForm.lead_assignedTo  || '',
        notes:             wizardForm.lead_notes       || '',
        contactId:         createdContact.id,
      });

      toast.success('Company, Contact & Lead created');
      closeWizard();
      loadCompanies();
    } catch (e) {
      // Rollback in reverse order: contact first, then company
      if (createdContact?.id) {
        try { await contactService.deleteContact(createdContact.id); } catch {}
      }
      if (createdCompany?.id) {
        try { await companyService.deleteCompany(createdCompany.id); } catch {}
      }
      toast.error(e.message || 'Failed to save — please try again');
    }
  };

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
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this company deletion!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!',
      customClass: {
        popup: 'premium-swal-popup',
        title: 'premium-swal-title',
        confirmButton: 'premium-swal-confirm-danger',
        cancelButton: 'premium-swal-cancel'
      }
    });

    if (result.isConfirmed) {
      try {
        await companyService.deleteCompany(id);
        toast.success('Company deleted');
        loadCompanies();
      } catch (e) {
        toast.error('Failed to delete company');
      }
    }
  };

  const handleConvertToContact = (company) => {
    setConvertingCompany(company);
    setConvertContactForm({
      name: company.name || '',
      company: company.name || '',
      email: '',
      phone: '',
      jobTitle: '',
      status: 'Active',
      location: company.country || '',
      clientAddress: company.address || '',
      clientCountry: company.country || '',
      type: 'Company',
      entityType: 'Company',
      // Tax fields (gstin, pan, etc.) intentionally excluded — owned by Company, not Contact
    });
    setShowConvertContactModal(true);
  };

  const handleSaveConvertContact = async () => {
    if (!convertContactForm.name?.trim()) {
      toast.error('Contact name is required');
      return;
    }
    try {
      await contactService.createContact({
        ...convertContactForm,
        companyId: convertingCompany.id,
      });
      toast.success(`Contact created from "${convertingCompany.name}"`);
      setShowConvertContactModal(false);
      setConvertingCompany(null);
      setConvertContactForm({});
      loadCompanies();
    } catch (e) {
      toast.error(e.message || 'Failed to create contact');
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
        actions={[{ label: 'Add Company', variant: 'primary', onClick: openWizard }]}
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
                  <div className="d-flex gap-1 align-items-center">
                    <button className="action-icon-btn text-info" style={{ opacity: 1 }} title="Edit" onClick={() => openEdit(c)}><Edit size={15} /></button>
                    <button className="action-icon-btn text-success" style={{ opacity: 1 }} title="Convert to Contact" onClick={() => handleConvertToContact(c)}><ArrowUpRight size={15} /></button>
                    <button className="action-icon-btn text-danger" style={{ opacity: 1 }} title="Delete" onClick={() => handleDelete(c.id)}><Trash2 size={15} /></button>
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
              { label: 'Tags (comma separated)', key: 'tags', type: 'text', col: 6 },
            ].map(f => (
              <div key={f.key} className={`col-${f.key === 'name' || f.key === 'address' ? '12' : '6'}`}>
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

            {/* Tax & Financial — India */}
            {isIndia(form.country) && <>
              <div className="col-12">
                <div className="small fw-bold text-muted mt-2 mb-1" style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em' }}>Tax & Financial Information</div>
              </div>
              {[
                { label: 'GSTIN / Tax ID', key: 'gstin', col: 6 },
                { label: 'PAN', key: 'pan', col: 6 },
                { label: 'CIN', key: 'cin', col: 6 },
                { label: 'TDS Section', key: 'tdsSection', col: 6 },
                { label: 'TDS Rate', key: 'tdsRate', type: 'number', col: 6 },
              ].map(f => (
                <div key={f.key} className={`col-${f.col}`}>
                  <Form.Label className="small fw-semibold mb-1">{f.label}</Form.Label>
                  <Form.Control size="sm" type={f.type || 'text'} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div className="col-6">
                <Form.Label className="small fw-semibold mb-1">MSME Status</Form.Label>
                <Form.Select size="sm" value={form.msmeStatus || 'NON MSME'} onChange={e => setForm(p => ({ ...p, msmeStatus: e.target.value }))}>
                  <option value="NON MSME">NON MSME</option>
                  <option value="MSME">MSME</option>
                </Form.Select>
              </div>
            </>}

            {/* Tax — International */}
            {form.country && !isIndia(form.country) && (
              <div className="col-6">
                <Form.Label className="small fw-semibold mb-1">Intl Tax ID (VAT/EIN)</Form.Label>
                <Form.Control size="sm" type="text" value={form.internationalTaxId || ''} onChange={e => setForm(p => ({ ...p, internationalTaxId: e.target.value }))} />
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSave}>{editing ? 'Update' : 'Create'} Company</Button>
        </Modal.Footer>
      </Modal>

      {/* CONVERT COMPANY → CONTACT MODAL */}
      <Modal show={showConvertContactModal} onHide={() => { setShowConvertContactModal(false); setConvertingCompany(null); }} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h6 fw-bold">
            Convert to Contact — {convertingCompany?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row g-3">
            <div className="col-12">
              <Form.Label className="small fw-semibold mb-1">Name *</Form.Label>
              <Form.Control size="sm" type="text" value={convertContactForm.name || ''} onChange={e => setConvertContactForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="col-6">
              <Form.Label className="small fw-semibold mb-1">Email</Form.Label>
              <Form.Control size="sm" type="email" value={convertContactForm.email || ''} onChange={e => setConvertContactForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="col-6">
              <Form.Label className="small fw-semibold mb-1">Phone</Form.Label>
              <Form.Control size="sm" type="text" value={convertContactForm.phone || ''} onChange={e => setConvertContactForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="col-6">
              <Form.Label className="small fw-semibold mb-1">Job Title</Form.Label>
              <Form.Select size="sm" value={convertContactForm.jobTitle || ''} onChange={e => setConvertContactForm(p => ({ ...p, jobTitle: e.target.value }))}>
                <option value="">Select title</option>
                {['CEO', 'CTO', 'Manager', 'Software Engineer', 'Product Manager', 'Sales Representative', 'Designer', 'HR Manager', 'Accountant', 'Consultant', 'Director', 'Other'].map(t => <option key={t}>{t}</option>)}
              </Form.Select>
            </div>
            <div className="col-6">
              <Form.Label className="small fw-semibold mb-1">Status</Form.Label>
              <Form.Select size="sm" value={convertContactForm.status || 'Active'} onChange={e => setConvertContactForm(p => ({ ...p, status: e.target.value }))}>
                {['Active', 'Inactive', 'Lead', 'Customer'].map(s => <option key={s}>{s}</option>)}
              </Form.Select>
            </div>
            <div className="col-6">
              <Form.Label className="small fw-semibold mb-1">Location</Form.Label>
              <Form.Control size="sm" type="text" value={convertContactForm.location || ''} onChange={e => setConvertContactForm(p => ({ ...p, location: e.target.value }))} />
            </div>
            <div className="col-6">
              <Form.Label className="small fw-semibold mb-1">Country</Form.Label>
              <Form.Control size="sm" type="text" value={convertContactForm.clientCountry || ''} onChange={e => setConvertContactForm(p => ({ ...p, clientCountry: e.target.value }))} />
            </div>
            <div className="col-12">
              <Form.Label className="small fw-semibold mb-1">Address</Form.Label>
              <Form.Control size="sm" type="text" value={convertContactForm.clientAddress || ''} onChange={e => setConvertContactForm(p => ({ ...p, clientAddress: e.target.value }))} />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" size="sm" onClick={() => { setShowConvertContactModal(false); setConvertingCompany(null); }}>Cancel</Button>
          <Button variant="success" size="sm" onClick={handleSaveConvertContact}>
            <ArrowUpRight size={14} className="me-1" /> Create Contact
          </Button>
        </Modal.Footer>
      </Modal>

      {/* COMPANY CREATION WIZARD */}
      <Modal show={showWizard} onHide={closeWizard} centered size="lg" dialogClassName="wizard-modal-dialog">
        <Modal.Body className="p-0">
          <div className="wizard-layout">

            {/* ══ Progress Header ══ */}
            <div className="wizard-progress-header">
              <button className="wizard-progress-close" onClick={closeWizard} aria-label="Close">✕</button>
              <div className="wizard-progress-title">Create Your Profile</div>

              {/* ── Horizontal Stepper ── */}
              <div className="wizard-stepper">
                {[
                  { n: 1, label: 'Company' },
                  { n: 2, label: 'Contact' },
                  { n: 3, label: 'Lead' },
                ].map((s, idx, arr) => {
                  const stepClass = wizardStep === s.n ? 'active' : wizardStep > s.n ? 'done' : '';
                  return (
                    <div key={s.n} className="wizard-stepper-step-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                      <div className={`wizard-stepper-step ${stepClass}`}>
                        {/* Businessman SVG icon above circle */}
                        <div className="wizard-stepper-icon-wrapper">
                          <svg className="wizard-businessman-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="32" cy="18" r="10" fill={stepClass === 'active' ? '#2ecc71' : stepClass === 'done' ? '#27ae60' : '#c5cad3'} opacity="0.85"/>
                            <path d="M16 54c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke={stepClass === 'active' ? '#2ecc71' : stepClass === 'done' ? '#27ae60' : '#c5cad3'} strokeWidth="4" strokeLinecap="round" fill={stepClass === 'active' ? '#d5f5e3' : stepClass === 'done' ? '#d5f5e3' : '#eef1f5'}/>
                            <rect x="26" y="26" width="12" height="14" rx="2" fill={stepClass === 'active' ? '#2ecc71' : stepClass === 'done' ? '#27ae60' : '#c5cad3'} opacity="0.6"/>
                            <path d="M30 26v-3a2 2 0 012-2h0a2 2 0 012 2v3" stroke={stepClass === 'active' ? '#1a9c54' : stepClass === 'done' ? '#1a9c54' : '#b0b8c9'} strokeWidth="1.5"/>
                            <circle cx="29" cy="16" r="1.2" fill="#fff"/>
                            <circle cx="35" cy="16" r="1.2" fill="#fff"/>
                          </svg>
                        </div>

                        {/* Number Circle */}
                        <div className="wizard-stepper-circle">
                          <span className="wizard-stepper-check">✓</span>
                          <span className="wizard-stepper-number">{s.n}</span>
                        </div>

                        {/* Label */}
                        <div className="wizard-stepper-label">{s.label}</div>
                      </div>

                      {/* Connector Line */}
                      {idx < arr.length - 1 && (
                        <div
                          className={`wizard-stepper-connector${wizardStep > s.n ? ' completed' : ''}`}
                          style={{
                            position: 'absolute',
                            top: '55px',
                            left: '50%',
                            width: '100%',
                            height: '3px',
                            zIndex: 1,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ══ Content Panel ══ */}
            <div className="wizard-content">
              <div className="wizard-content-scroll">

                {/* Step 1 — Company Details */}
                {wizardStep === 1 && <>
                  <div className="wizard-step-title">Company Information</div>
                  <div className="wizard-step-desc">Provide the necessary details to register your company with us</div>
                  <div className="row g-0">
                    <div className="col-12 wizard-field">
                      <label className="wizard-label">Company Name *</label>
                      <input className="wizard-input" type="text" placeholder="e.g. Acme Corp" value={wizardForm.company_name || ''} onChange={e => setWizardForm(p => ({ ...p, company_name: e.target.value }))} />
                    </div>
                    <div className="col-6 pe-3 wizard-field">
                      <label className="wizard-label">Website</label>
                      <input className="wizard-input" type="text" placeholder="acme.com" value={wizardForm.company_website || ''} onChange={e => setWizardForm(p => ({ ...p, company_website: e.target.value }))} />
                    </div>
                    <div className="col-6 wizard-field">
                      <label className="wizard-label">Country</label>
                      <input className="wizard-input" type="text" placeholder="India" value={wizardForm.company_country || ''} onChange={e => setWizardForm(p => ({ ...p, company_country: e.target.value }))} />
                    </div>
                    <div className="col-12 wizard-field">
                      <label className="wizard-label">Address</label>
                      <input className="wizard-input" type="text" placeholder="Street, City, State" value={wizardForm.company_address || ''} onChange={e => setWizardForm(p => ({ ...p, company_address: e.target.value }))} />
                    </div>
                    <div className="col-6 pe-3 wizard-field">
                      <label className="wizard-label">Industry</label>
                      <div className="wizard-select-wrapper">
                        <select className="wizard-select" value={wizardForm.company_industry || ''} onChange={e => setWizardForm(p => ({ ...p, company_industry: e.target.value }))}>
                          <option value="">Select industry</option>
                          {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="col-6 wizard-field">
                      <label className="wizard-label">Company Size</label>
                      <div className="wizard-select-wrapper">
                        <select className="wizard-select" value={wizardForm.company_size || ''} onChange={e => setWizardForm(p => ({ ...p, company_size: e.target.value }))}>
                          <option value="">Select size</option>
                          {SIZES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="col-12 wizard-field">
                      <label className="wizard-label">Tags (comma separated)</label>
                      <input className="wizard-input" type="text" placeholder="enterprise, saas, partner" value={wizardForm.company_tags || ''} onChange={e => setWizardForm(p => ({ ...p, company_tags: e.target.value }))} />
                    </div>

                    {isIndia(wizardForm.company_country) && <>
                      <div className="col-12">
                        <div className="wizard-section-divider">Tax &amp; Financial Information</div>
                      </div>
                      {[
                        { label: 'GSTIN / Tax ID', key: 'company_gstin', ph: '22AAAAA0000A1Z5' },
                        { label: 'PAN',             key: 'company_pan',   ph: 'AAAAA0000A' },
                        { label: 'CIN',             key: 'company_cin',   ph: 'U12345MH2000PLC000000' },
                        { label: 'TDS Section',     key: 'company_tdsSection', ph: '194C' },
                      ].map((f, idx) => (
                        <div key={f.key} className={`col-6 wizard-field${idx % 2 === 0 ? ' pe-3' : ''}`}>
                          <label className="wizard-label">{f.label}</label>
                          <input className="wizard-input" type="text" placeholder={f.ph} value={wizardForm[f.key] || ''} onChange={e => setWizardForm(p => ({ ...p, [f.key]: e.target.value }))} />
                        </div>
                      ))}
                      <div className="col-6 pe-3 wizard-field">
                        <label className="wizard-label">TDS Rate (%)</label>
                        <input className="wizard-input" type="number" placeholder="10" value={wizardForm.company_tdsRate || ''} onChange={e => setWizardForm(p => ({ ...p, company_tdsRate: e.target.value }))} />
                      </div>
                      <div className="col-6 wizard-field">
                        <label className="wizard-label">MSME Status</label>
                        <div className="wizard-select-wrapper">
                          <select className="wizard-select" value={wizardForm.company_msmeStatus || 'NON MSME'} onChange={e => setWizardForm(p => ({ ...p, company_msmeStatus: e.target.value }))}>
                            <option value="NON MSME">NON MSME</option>
                            <option value="MSME">MSME</option>
                          </select>
                        </div>
                      </div>
                    </>}

                    {wizardForm.company_country && !isIndia(wizardForm.company_country) && (
                      <div className="col-6 wizard-field">
                        <label className="wizard-label">Intl Tax ID (VAT / EIN)</label>
                        <input className="wizard-input" type="text" placeholder="VAT / EIN number" value={wizardForm.company_internationalTaxId || ''} onChange={e => setWizardForm(p => ({ ...p, company_internationalTaxId: e.target.value }))} />
                      </div>
                    )}
                  </div>
                </>}

                {/* Step 2 — Contact Details */}
                {wizardStep === 2 && <>
                  <div className="wizard-step-title">Contact Information</div>
                  <div className="wizard-step-desc">Add the primary point of contact at this company</div>
                  <div className="row g-0">
                    <div className="col-12 wizard-field">
                      <label className="wizard-label">Full Name *</label>
                      <input className="wizard-input" type="text" placeholder="Jane Smith" value={wizardForm.contact_name || ''} onChange={e => setWizardForm(p => ({ ...p, contact_name: e.target.value }))} />
                    </div>
                    <div className="col-6 pe-3 wizard-field">
                      <label className="wizard-label">Email</label>
                      <input className="wizard-input" type="email" placeholder="jane@acme.com" value={wizardForm.contact_email || ''} onChange={e => setWizardForm(p => ({ ...p, contact_email: e.target.value }))} />
                    </div>
                    <div className="col-6 wizard-field">
                      <label className="wizard-label">Phone</label>
                      <input className="wizard-input" type="text" placeholder="+91 98765 43210" value={wizardForm.contact_phone || ''} onChange={e => setWizardForm(p => ({ ...p, contact_phone: e.target.value }))} />
                    </div>
                    <div className="col-6 pe-3 wizard-field">
                      <label className="wizard-label">Job Title</label>
                      <div className="wizard-select-wrapper">
                        <select className="wizard-select" value={wizardForm.contact_jobTitle || ''} onChange={e => setWizardForm(p => ({ ...p, contact_jobTitle: e.target.value }))}>
                          <option value="">Select title</option>
                          {['CEO', 'CTO', 'Manager', 'Software Engineer', 'Product Manager', 'Sales Representative', 'Designer', 'HR Manager', 'Accountant', 'Consultant', 'Director', 'Other'].map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="col-6 wizard-field">
                      <label className="wizard-label">Status</label>
                      <div className="wizard-select-wrapper">
                        <select className="wizard-select" value={wizardForm.contact_status || 'Active'} onChange={e => setWizardForm(p => ({ ...p, contact_status: e.target.value }))}>
                          {['Active', 'Inactive', 'Lead', 'Customer'].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="col-6 pe-3 wizard-field">
                      <label className="wizard-label">Location</label>
                      <input className="wizard-input" type="text" placeholder="Mumbai" value={wizardForm.contact_location || ''} onChange={e => setWizardForm(p => ({ ...p, contact_location: e.target.value }))} />
                    </div>
                    <div className="col-6 wizard-field">
                      <label className="wizard-label">Country</label>
                      <input className="wizard-input" type="text" placeholder="India" value={wizardForm.contact_clientCountry || ''} onChange={e => setWizardForm(p => ({ ...p, contact_clientCountry: e.target.value }))} />
                    </div>
                    <div className="col-12 wizard-field">
                      <label className="wizard-label">Address</label>
                      <input className="wizard-input" type="text" placeholder="Street, City, State" value={wizardForm.contact_clientAddress || ''} onChange={e => setWizardForm(p => ({ ...p, contact_clientAddress: e.target.value }))} />
                    </div>
                  </div>
                </>}

                {/* Step 3 — Lead Details */}
                {wizardStep === 3 && <>
                  <div className="wizard-step-title">Lead Information</div>
                  <div className="wizard-step-desc">Capture the opportunity tied to this company</div>
                  <div className="row g-0">
                    <div className="col-6 pe-3 wizard-field">
                      <label className="wizard-label">Contact Name</label>
                      <input className="wizard-input" type="text" value={wizardForm.lead_contactName || ''} onChange={e => setWizardForm(p => ({ ...p, lead_contactName: e.target.value }))} />
                    </div>
                    <div className="col-6 wizard-field">
                      <label className="wizard-label">Company</label>
                      <input className="wizard-input" type="text" value={wizardForm.lead_company || ''} onChange={e => setWizardForm(p => ({ ...p, lead_company: e.target.value }))} />
                    </div>
                    <div className="col-6 pe-3 wizard-field">
                      <label className="wizard-label">Source</label>
                      <div className="wizard-select-wrapper">
                        <select className="wizard-select" value={wizardForm.lead_source || 'Inbound'} onChange={e => setWizardForm(p => ({ ...p, lead_source: e.target.value }))}>
                          {['Inbound', 'Referral', 'Campaign', 'Cold'].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="col-6 wizard-field">
                      <label className="wizard-label">Score</label>
                      <div className="wizard-select-wrapper">
                        <select className="wizard-select" value={wizardForm.lead_score || 'Warm'} onChange={e => setWizardForm(p => ({ ...p, lead_score: e.target.value }))}>
                          {['Hot', 'Warm', 'Cold'].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="col-6 pe-3 wizard-field">
                      <label className="wizard-label">Stage</label>
                      <div className="wizard-select-wrapper">
                        <select className="wizard-select" value={wizardForm.lead_stage || 'New'} onChange={e => setWizardForm(p => ({ ...p, lead_stage: e.target.value }))}>
                          {['New', 'Contacted', 'Qualified', 'Disqualified'].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="col-6 wizard-field">
                      <label className="wizard-label">Project Type</label>
                      <div className="wizard-select-wrapper">
                        <select className="wizard-select" value={wizardForm.lead_type || 'Product'} onChange={e => setWizardForm(p => ({ ...p, lead_type: e.target.value }))}>
                          <option value="Product">{productLabel}</option>
                          <option value="Service">{serviceLabel}</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-6 pe-3 wizard-field">
                      <label className="wizard-label">Expected Value</label>
                      <input className="wizard-input" type="number" placeholder="0" value={wizardForm.lead_expectedValue || ''} onChange={e => setWizardForm(p => ({ ...p, lead_expectedValue: e.target.value }))} />
                    </div>
                    <div className="col-6 wizard-field">
                      <label className="wizard-label">Expected Close Date</label>
                      <input className="wizard-input" type="date" value={wizardForm.lead_expectedCloseDate || ''} onChange={e => setWizardForm(p => ({ ...p, lead_expectedCloseDate: e.target.value }))} />
                    </div>
                    <div className="col-12 wizard-field">
                      <label className="wizard-label">Assigned To</label>
                      <input className="wizard-input" type="text" placeholder="Team member name" value={wizardForm.lead_assignedTo || ''} onChange={e => setWizardForm(p => ({ ...p, lead_assignedTo: e.target.value }))} />
                    </div>
                    <div className="col-12 wizard-field">
                      <label className="wizard-label">Notes</label>
                      <textarea className="wizard-textarea" rows={2} placeholder="Any context or next steps…" value={wizardForm.lead_notes || ''} onChange={e => setWizardForm(p => ({ ...p, lead_notes: e.target.value }))} />
                    </div>
                  </div>
                </>}

              </div>{/* /scroll */}

              {/* ── Footer ── */}
              <div className="wizard-footer">
                <button className="wizard-btn wizard-btn-back" onClick={wizardStep > 1 ? handleWizardBack : closeWizard} style={{ color: '#2ecc71' }}>
                  {wizardStep > 1 ? '‹ Previous' : 'Cancel'}
                </button>
                <div className="wizard-footer-spacer" />
                {wizardStep === 2 && (
                  <button className="wizard-btn wizard-btn-skip" onClick={handleWizardSkip}>Skip contact</button>
                )}
                {wizardStep === 3 && (
                  <button className="wizard-btn wizard-btn-skip" onClick={handleWizardSkipLead}>Skip lead</button>
                )}
                {wizardStep < 3 && (
                  <button className="wizard-btn wizard-btn-primary" onClick={handleWizardNext}>Next ›</button>
                )}
                {wizardStep === 3 && (
                  <button className="wizard-btn wizard-btn-save" onClick={handleWizardSave}>
                    <ArrowUpRight size={14} /> Save All
                  </button>
                )}
              </div>

            </div>{/* /wizard-content */}
          </div>{/* /wizard-layout */}
        </Modal.Body>
      </Modal>
    </div>
  );
}
