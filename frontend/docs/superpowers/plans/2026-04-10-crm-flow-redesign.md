# CRM Flow Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full Company → Contact → Lead → Sales → Invoice → Finance pipeline with correct data relationships and surface hidden nav pages.

**Architecture:** New Company and Leads pages follow the existing service+page pattern (`apiClient` → `*Service.js` → `Page.jsx`). Existing modules (Contacts, Sales, Invoice, Finance) are surgically updated to add links and handoffs. Navigation in `MainLayout.jsx` and routes in `App.jsx` are updated last.

**Tech Stack:** React 19, Vite, Tailwind + Bootstrap, Recharts, Framer Motion, Lucide icons, React Router v6, `apiClient.js` (fetch + Bearer token)

---

## File Map

### New Files
| File | Responsibility |
|------|----------------|
| `src/services/companyService.js` | Company CRUD via apiClient |
| `src/services/leadService.js` | Lead CRUD via apiClient |
| `src/pages/Company/Company.jsx` | Company list page (list view + add/edit modal) |
| `src/pages/Company/Company.css` | Company page styles |
| `src/pages/Leads/Leads.jsx` | Leads list + kanban (New→Contacted→Qualified→Disqualified) |
| `src/pages/Leads/Leads.css` | Leads page styles |

### Modified Files
| File | Change |
|------|--------|
| `src/pages/Contact/Contacts/Contacts.jsx` | Add `companyId` field; add "Prospect" status; replace "Convert to Sales" with "Convert to Lead" flow |
| `src/pages/Sales/Sales.jsx` | Show linked contact/company on cards; add Won → Invoice dialog |
| `src/pages/Invoice/ProjectTrackerComplete.jsx` | Add 4-party tabs (Client, Devs, Investors, Company margin); add `dealId` prop; auto-create Finance income on Paid |
| `src/pages/Finance/Finance.jsx` | Tag income with `source` + `invoiceId`; add client grouping in P&L |
| `src/layouts/MainLayout.jsx` | Add Company, Leads, Calendar, Reports nav entries |
| `src/App.jsx` | Wire `/company`, `/leads`, `/calendar`, `/reports` routes |

---

## Task 1: companyService.js

**Files:**
- Create: `src/services/companyService.js`

- [ ] **Step 1: Create the service file**

```js
import { apiClient } from './apiClient';

export const companyService = {
    getCompanies: async () => {
        return await apiClient.get('/companies');
    },
    createCompany: async (data) => {
        return await apiClient.post('/companies', data);
    },
    updateCompany: async (id, updates) => {
        return await apiClient.put(`/companies/${id}`, updates);
    },
    deleteCompany: async (id) => {
        await apiClient.delete(`/companies/${id}`);
        return id;
    },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/services/companyService.js
git commit -m "feat: add companyService"
```

---

## Task 2: leadService.js

**Files:**
- Create: `src/services/leadService.js`

- [ ] **Step 1: Create the service file**

```js
import { apiClient } from './apiClient';

export const leadService = {
    getLeads: async () => {
        return await apiClient.get('/leads');
    },
    createLead: async (data) => {
        return await apiClient.post('/leads', data);
    },
    updateLead: async (id, updates) => {
        return await apiClient.put(`/leads/${id}`, updates);
    },
    deleteLead: async (id) => {
        await apiClient.delete(`/leads/${id}`);
        return id;
    },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/services/leadService.js
git commit -m "feat: add leadService"
```

---

## Task 3: Company Page

**Files:**
- Create: `src/pages/Company/Company.jsx`
- Create: `src/pages/Company/Company.css`

- [ ] **Step 1: Create Company.css**

```css
.company-container { padding: 0 16px 24px; }
.company-card {
  background: #fff;
  border: 1px solid #E8EDF5;
  border-radius: 12px;
  padding: 16px;
  transition: box-shadow 0.2s;
}
.company-card:hover { box-shadow: 0 4px 16px rgba(67,97,238,0.10); }
.company-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}
```

- [ ] **Step 2: Create Company.jsx**

```jsx
import { useState, useEffect } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { Plus, Building, Globe, MapPin, Edit, Trash2, Users, Briefcase } from 'lucide-react';
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
                    {c.industry && <div className="text-muted small">{c.industry} {c.size ? `· ${c.size} employees` : ''}</div>}
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
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Company/Company.jsx src/pages/Company/Company.css
git commit -m "feat: add Company module (list + add/edit modal)"
```

---

## Task 4: Leads Page

**Files:**
- Create: `src/pages/Leads/Leads.jsx`
- Create: `src/pages/Leads/Leads.css`

- [ ] **Step 1: Create Leads.css**

```css
.leads-container { padding: 0 16px 24px; }
.lead-card {
  background: #fff;
  border: 1px solid #E8EDF5;
  border-radius: 12px;
  padding: 14px 16px;
  transition: box-shadow 0.2s;
}
.lead-card:hover { box-shadow: 0 4px 16px rgba(67,97,238,0.10); }
.score-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}
.score-hot { background: #FEE2E2; color: #DC2626; }
.score-warm { background: #FEF3C7; color: #D97706; }
.score-cold { background: #DBEAFE; color: #2563EB; }
.kanban-col {
  background: #F8FAFC;
  border-radius: 12px;
  min-height: 200px;
  padding: 12px;
}
.kanban-col-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748B;
  margin-bottom: 10px;
}
```

- [ ] **Step 2: Create Leads.jsx**

```jsx
import { useState, useEffect } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { Plus, User, Building, Target, Edit, Trash2, ArrowUpRight, List, Columns } from 'lucide-react';
import { leadService } from '../../services/leadService';
import { contactService } from '../../services/contactService';
import { projectService } from '../../services/api';
import { useToast } from '../../components/Toast/ToastContext';
import PageToolbar from '../../components/PageToolbar/PageToolbar';
import StatsGrid from '../../components/StatsGrid/StatsGrid';
import './Leads.css';

const KANBAN_STAGES = ['New', 'Contacted', 'Qualified', 'Disqualified'];
const SOURCES = ['Inbound', 'Referral', 'Campaign', 'Cold'];
const SCORES = ['Hot', 'Warm', 'Cold'];

const EMPTY_FORM = {
  contactId: '', contactName: '', company: '',
  source: 'Inbound', score: 'Warm',
  assignedTo: '', notes: '', expectedValue: '', expectedCloseDate: '',
  stage: 'New'
};

export default function Leads() {
  const toast = useToast();
  const [leads, setLeads] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { loadLeads(); loadContacts(); }, []);

  const loadLeads = async () => {
    try {
      setIsLoading(true);
      const data = await leadService.getLeads();
      setLeads(data || []);
    } catch (e) {
      console.error('Error loading leads:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const data = await contactService.getContacts();
      setContacts(data || []);
    } catch (e) { console.error(e); }
  };

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (l) => { setEditing(l); setForm({ ...EMPTY_FORM, ...l }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.contactName.trim()) { toast.error('Contact name is required'); return; }
    try {
      if (editing) {
        await leadService.updateLead(editing.id, form);
        toast.success('Lead updated');
      } else {
        await leadService.createLead(form);
        toast.success('Lead created');
      }
      setShowModal(false);
      loadLeads();
    } catch (e) {
      toast.error(e.message || 'Failed to save lead');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await leadService.deleteLead(id);
      toast.success('Lead deleted');
      loadLeads();
    } catch (e) {
      toast.error('Failed to delete lead');
    }
  };

  const handleQualify = async (lead) => {
    if (!window.confirm(`Qualify "${lead.contactName}" and create a Sales deal?`)) return;
    const today = new Date();
    const date = String(today.getDate()).padStart(2, '0');
    const year = String(today.getFullYear()).slice(-2);
    const brandCode = (lead.company || 'A3').substring(0, 2).toUpperCase();
    const clientCode = (lead.contactName || 'C').slice(-1).toUpperCase();
    const customId = `${date}${brandCode}${clientCode}${year}`;

    try {
      await projectService.create({
        activeStage: 0,
        history: [],
        type: 'Service',
        rating: 4.0,
        delay: 0,
        title: `${lead.contactName} - ${lead.company || 'Direct'}`,
        clientName: lead.contactName,
        brandingName: lead.company || 'A365Shift',
        customId,
        leadId: lead.id,
      });
      await leadService.updateLead(lead.id, { ...lead, stage: 'Qualified' });
      toast.success(`Lead qualified — Sales deal created for ${lead.contactName}`);
      loadLeads();
    } catch (e) {
      toast.error('Failed to qualify lead');
    }
  };

  const handleStageChange = async (lead, newStage) => {
    try {
      await leadService.updateLead(lead.id, { ...lead, stage: newStage });
      loadLeads();
    } catch (e) {
      toast.error('Failed to update lead stage');
    }
  };

  const scoreBadgeClass = (score) => {
    if (score === 'Hot') return 'score-badge score-hot';
    if (score === 'Warm') return 'score-badge score-warm';
    return 'score-badge score-cold';
  };

  const filtered = leads.filter(l =>
    l.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: 'Total Leads', value: leads.length, icon: <User size={22} />, color: 'blue' },
    { label: 'Hot Leads', value: leads.filter(l => l.score === 'Hot').length, icon: <Target size={22} />, color: 'red' },
    { label: 'Qualified', value: leads.filter(l => l.stage === 'Qualified').length, icon: <ArrowUpRight size={22} />, color: 'green' },
    { label: 'Companies', value: new Set(leads.map(l => l.company).filter(Boolean)).size, icon: <Building size={22} />, color: 'purple' },
  ];

  return (
    <div className="leads-container">
      <StatsGrid stats={stats} />

      <PageToolbar
        title="Leads"
        itemCount={filtered.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAdd={openAdd}
        addLabel="Add Lead"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        viewModes={[
          { value: 'list', icon: <List size={15} />, label: 'List' },
          { value: 'kanban', icon: <Columns size={15} />, label: 'Kanban' },
        ]}
      />

      {isLoading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" />
        </div>
      ) : viewMode === 'list' ? (
        <div className="mt-2">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Contact</th><th>Company</th><th>Score</th>
                <th>Source</th><th>Stage</th><th>Expected Value</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id}>
                  <td className="fw-semibold">{l.contactName}</td>
                  <td className="text-muted">{l.company || '—'}</td>
                  <td><span className={scoreBadgeClass(l.score)}>{l.score}</span></td>
                  <td>{l.source}</td>
                  <td>
                    <Form.Select size="sm" value={l.stage || 'New'} style={{ width: 130 }}
                      onChange={e => handleStageChange(l, e.target.value)}>
                      {KANBAN_STAGES.map(s => <option key={s}>{s}</option>)}
                    </Form.Select>
                  </td>
                  <td>{l.expectedValue ? `${l.expectedValue}` : '—'}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-light" onClick={() => openEdit(l)}><Edit size={13} /></button>
                      {l.stage !== 'Qualified' && l.stage !== 'Disqualified' && (
                        <button className="btn btn-sm btn-success" title="Qualify → Sales" onClick={() => handleQualify(l)}>
                          <ArrowUpRight size={13} />
                        </button>
                      )}
                      <button className="btn btn-sm btn-light text-danger" onClick={() => handleDelete(l.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted py-4">No leads found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="row g-3 mt-1">
          {KANBAN_STAGES.map(stage => (
            <div key={stage} className="col-12 col-md-6 col-xl-3">
              <div className="kanban-col">
                <div className="kanban-col-title">{stage} ({filtered.filter(l => (l.stage || 'New') === stage).length})</div>
                {filtered.filter(l => (l.stage || 'New') === stage).map(l => (
                  <div key={l.id} className="lead-card mb-2">
                    <div className="d-flex justify-content-between">
                      <div className="fw-semibold small">{l.contactName}</div>
                      <span className={scoreBadgeClass(l.score)}>{l.score}</span>
                    </div>
                    {l.company && <div className="text-muted" style={{ fontSize: 11 }}>{l.company}</div>}
                    <div className="d-flex gap-1 mt-2">
                      <button className="btn btn-sm btn-light py-0 px-1" onClick={() => openEdit(l)}><Edit size={12} /></button>
                      {stage !== 'Qualified' && stage !== 'Disqualified' && (
                        <button className="btn btn-sm btn-success py-0 px-1" onClick={() => handleQualify(l)}><ArrowUpRight size={12} /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h6 fw-bold">{editing ? 'Edit Lead' : 'Add Lead'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row g-3">
            <div className="col-6">
              <Form.Label className="small fw-semibold mb-1">Contact Name *</Form.Label>
              <Form.Control size="sm" value={form.contactName} onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))} />
            </div>
            <div className="col-6">
              <Form.Label className="small fw-semibold mb-1">Company</Form.Label>
              <Form.Control size="sm" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} />
            </div>
            <div className="col-6">
              <Form.Label className="small fw-semibold mb-1">Source</Form.Label>
              <Form.Select size="sm" value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}>
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </Form.Select>
            </div>
            <div className="col-6">
              <Form.Label className="small fw-semibold mb-1">Score</Form.Label>
              <Form.Select size="sm" value={form.score} onChange={e => setForm(p => ({ ...p, score: e.target.value }))}>
                {SCORES.map(s => <option key={s}>{s}</option>)}
              </Form.Select>
            </div>
            <div className="col-6">
              <Form.Label className="small fw-semibold mb-1">Expected Value</Form.Label>
              <Form.Control size="sm" type="number" value={form.expectedValue} onChange={e => setForm(p => ({ ...p, expectedValue: e.target.value }))} />
            </div>
            <div className="col-6">
              <Form.Label className="small fw-semibold mb-1">Expected Close Date</Form.Label>
              <Form.Control size="sm" type="date" value={form.expectedCloseDate} onChange={e => setForm(p => ({ ...p, expectedCloseDate: e.target.value }))} />
            </div>
            <div className="col-6">
              <Form.Label className="small fw-semibold mb-1">Assigned To</Form.Label>
              <Form.Control size="sm" value={form.assignedTo} onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))} />
            </div>
            <div className="col-6">
              <Form.Label className="small fw-semibold mb-1">Stage</Form.Label>
              <Form.Select size="sm" value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))}>
                {KANBAN_STAGES.map(s => <option key={s}>{s}</option>)}
              </Form.Select>
            </div>
            <div className="col-12">
              <Form.Label className="small fw-semibold mb-1">Notes</Form.Label>
              <Form.Control as="textarea" rows={2} size="sm" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSave}>{editing ? 'Update' : 'Create'} Lead</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Leads/Leads.jsx src/pages/Leads/Leads.css
git commit -m "feat: add Leads module (list + kanban + qualify to sales)"
```

---

## Task 5: Update Contacts — Add companyId field + "Convert to Lead"

**Files:**
- Modify: `src/pages/Contact/Contacts/Contacts.jsx`

The key changes are:
1. Add `'Prospect'` to the default status columns (line ~22)
2. Change `handleConvertToSales` to `handleConvertToLead` which creates a lead record instead of a project
3. Rename the "Convert to Sales" modal to "Convert to Lead"

- [ ] **Step 1: Add "Prospect" to DEFAULT_STATUS_COLUMNS (line 22)**

Find:
```js
const DEFAULT_STATUS_COLUMNS = ['Active', 'Inactive', 'Lead', 'Customer']
```
Replace with:
```js
const DEFAULT_STATUS_COLUMNS = ['Active', 'Inactive', 'Lead', 'Prospect', 'Customer']
```

- [ ] **Step 2: Import leadService at top of Contacts.jsx**

Find:
```js
import { contactService } from '../../../services/contactService'
import { projectService } from '../../../services/api'
```
Replace with:
```js
import { contactService } from '../../../services/contactService'
import { projectService } from '../../../services/api'
import { leadService } from '../../../services/leadService'
```

- [ ] **Step 3: Replace handleConvertToSales with handleConvertToLead (line ~359)**

Find:
```js
  // --- Convert to Sales ---
  const handleConvertToSales = (contact) => {
    setConvertingContact(contact)
    setConvertType('Product')
    setConvertBranding(contact.company || '')
    setConvertClient(contact.name || '')
    setShowConvertModal(true)
  }

  const handleConfirmConvert = async () => {
    if (!convertingContact) return
    const c = convertingContact
    const today = new Date()
    const date = String(today.getDate()).padStart(2, '0')
    const year = String(today.getFullYear()).slice(-2)
    const brandCode = (c.company || 'A3').substring(0, 2).toUpperCase()
    const clientCode = (c.name || 'C').slice(-1).toUpperCase()
    const customId = `${date}${brandCode}${clientCode}${year}`

    const newProject = {
      activeStage: 0,
      history: [],
      type: convertType,
      rating: 4.0,
      delay: 0,
      title: `${convertClient} - ${convertBranding || 'Direct'}`,
      clientName: convertClient || 'New Client',
      brandingName: convertBranding || 'A365Shift',
      customId,
      // Map new contact fields
      clientEmail: c.email || '',
      clientPhone: c.phone || '',
      clientAddress: c.clientAddress || '',
      clientGstin: c.gstin || '',
      clientPan: c.pan || '',
      clientCin: c.cin || '',
      msmeStatus: c.msmeStatus || 'NON MSME',
      tdsSection: c.tdsSection || '',
      tdsRate: c.tdsRate || ''
    }

    try {
      await projectService.create(newProject)
      const typeLabel = convertType === 'Product' ? productLabel : serviceLabel
      toast.success(`Contact "${c.name}" converted to a ${typeLabel} sales project!`)
      setShowConvertModal(false)
      setConvertingContact(null)
    } catch (error) {
      console.error('Error converting contact to sales:', error)
      toast.error('Failed to convert contact. Please try again.')
    }
  }
```
Replace with:
```js
  // --- Convert to Lead ---
  const handleConvertToSales = (contact) => {
    setConvertingContact(contact)
    setConvertBranding(contact.company || '')
    setConvertClient(contact.name || '')
    setShowConvertModal(true)
  }

  const handleConfirmConvert = async () => {
    if (!convertingContact) return
    const c = convertingContact
    try {
      await leadService.createLead({
        contactId: c.id,
        contactName: convertClient || c.name,
        company: convertBranding || c.company || '',
        source: 'Inbound',
        score: 'Warm',
        stage: 'New',
        notes: '',
        expectedValue: '',
        expectedCloseDate: '',
        assignedTo: '',
      })
      toast.success(`Contact "${c.name}" converted to a Lead!`)
      setShowConvertModal(false)
      setConvertingContact(null)
    } catch (error) {
      console.error('Error converting contact to lead:', error)
      toast.error('Failed to convert contact. Please try again.')
    }
  }
```

- [ ] **Step 4: Update the Convert Modal title (line ~632)**

Find:
```jsx
          <Modal.Title className="h6 fw-bold">Convert to Sales Client</Modal.Title>
```
Replace with:
```jsx
          <Modal.Title className="h6 fw-bold">Convert to Lead</Modal.Title>
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/Contact/Contacts/Contacts.jsx
git commit -m "feat: contacts — add Prospect status, convert to Lead instead of Sales"
```

---

## Task 6: Update Sales — Show linked contact/company + Won → Invoice dialog

**Files:**
- Modify: `src/pages/Sales/Sales.jsx`

- [ ] **Step 1: Add Won→Invoice dialog state to the Sales function (after line ~299, inside `function Sales()`)**

Find:
```js
    // Projects state
    const [projects, setProjects] = useState([])
    const [, setLoading] = useState(true)
```
Replace with:
```js
    // Projects state
    const [projects, setProjects] = useState([])
    const [, setLoading] = useState(true)

    // Won → Invoice dialog
    const [showWonDialog, setShowWonDialog] = useState(false)
    const [wonProject, setWonProject] = useState(null)
```

- [ ] **Step 2: Intercept stage change to "Won" in `updateProjectStage` to show the dialog**

Find:
```js
        try {
            // Call API
            await projectService.update(projectId, apiUpdates);
            toast.success(`Stage updated: ${transitionStr}`);
        } catch (error) {
            console.error('Failed to update project stage:', error);
            toast.error('Failed to update project stage');
            // Revert on error
            loadProjects();
            return; // Don't proceed with finance calls if stage update failed
        }
```
Replace with:
```js
        try {
            // Call API
            await projectService.update(projectId, apiUpdates);
            toast.success(`Stage updated: ${transitionStr}`);
            // Prompt to create invoice when deal is Won
            if (newStageLabel === 'Won') {
                setWonProject({ ...p, activeStage: newStageIndex });
                setShowWonDialog(true);
            }
        } catch (error) {
            console.error('Failed to update project stage:', error);
            toast.error('Failed to update project stage');
            // Revert on error
            loadProjects();
            return; // Don't proceed with finance calls if stage update failed
        }
```

- [ ] **Step 3: Add Won→Invoice dialog JSX to the Sales return (just before the closing `</div>` of the Sales return)**

Find the last closing tag of the Sales component JSX. It will look like:
```jsx
        </div>
    )
}
```

Replace the last instance with:
```jsx
        {/* Won → Invoice Dialog */}
        <Modal show={showWonDialog} onHide={() => setShowWonDialog(false)} centered size="sm">
            <Modal.Header closeButton className="border-0 pb-0">
                <Modal.Title className="h6 fw-bold">Deal Won!</Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-2">
                {wonProject && (
                    <p className="text-muted small mb-0">
                        <strong>{wonProject.title}</strong> is marked as Won.<br />
                        Create an Invoice for this deal now?
                    </p>
                )}
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
                <Button variant="secondary" size="sm" onClick={() => setShowWonDialog(false)}>Later</Button>
                <Button variant="success" size="sm" onClick={() => {
                    setShowWonDialog(false);
                    if (wonProject) navigate(`/invoice?dealId=${wonProject.id}&client=${encodeURIComponent(wonProject.clientName || '')}&value=${wonProject.dealValue || ''}`);
                }}>Create Invoice</Button>
            </Modal.Footer>
        </Modal>

        </div>
    )
}
```

- [ ] **Step 4: Show linked contact/company on SalesCard (inside `SalesCard`, after the title row `<div className="sales-card-title">`)**

Find:
```jsx
            {/* Header Row: ID + Meta + Icons */}
```
Replace with:
```jsx
            {/* Contact / Company row */}
            {(clientName || brandingName) && (
                <div className="d-flex gap-2 mb-1" style={{ fontSize: 11, color: '#64748B' }}>
                    {clientName && <span>👤 {clientName}</span>}
                    {brandingName && brandingName !== 'A365Shift' && <span>🏢 {brandingName}</span>}
                </div>
            )}

            {/* Header Row: ID + Meta + Icons */}
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/Sales/Sales.jsx
git commit -m "feat: sales — show linked contact/company, add Won→Invoice dialog"
```

---

## Task 7: Update Invoice — 4-party tabs + dealId link + auto Finance on Paid

**Files:**
- Modify: `src/pages/Invoice/ProjectTrackerComplete.jsx`

- [ ] **Step 1: Read search params for dealId pre-fill**

At the top of `ProjectTrackerComplete` component (find `const [searchParams] = useSearchParams()`), it already imports `useSearchParams`. Find where the component initialises project state and add pre-fill logic.

Find:
```js
    const [searchParams] = useSearchParams();
```
If this line already exists, after it add:
```js
    const dealIdFromUrl = searchParams.get('dealId') || '';
    const clientFromUrl = searchParams.get('client') || '';
    const valueFromUrl = searchParams.get('value') || '';
```

If `useSearchParams` is not yet imported, find:
```js
import { useLocation, useSearchParams } from 'react-router-dom';
```
It already exists (line 4). Add the three const lines after the first use of `useSearchParams`.

- [ ] **Step 2: Locate the project detail form state in ProjectTrackerComplete**

Search for where `details` state is initialised (it will look like `useState({ projectId: ... })`). Add `dealId` to that initial state:

Find the initial details state object (it will contain `projectId`, `clientName`, `dealValue`, etc.) and add `dealId: dealIdFromUrl` to it. Also pre-fill clientName and dealValue from URL params if present.

Find:
```js
    const [details, setDetails] = useState({
```
The next few lines define the initial object. After the opening brace of that object, add `dealId: dealIdFromUrl,` as the first property, and ensure `clientName` and `dealValue` use the URL params as defaults where the current default is empty string or 0.

- [ ] **Step 3: Add the 4-party tabs to the project detail view**

In the project detail section (where milestones, stakeholders are shown), add a tab bar. Find the section that renders stakeholders (look for `stakeholders.map`) and wrap it in a tabbed panel.

Add state at the top of the ProjectTrackerComplete component:
```js
const [activePartyTab, setActivePartyTab] = useState('client');
```

Then find the heading `Stakeholder Distribution` or the stakeholders render section and wrap it:
```jsx
{/* 4-Party Billing Tabs */}
<div className="d-flex gap-2 mb-3 flex-wrap">
  {[
    { key: 'client', label: 'Client Bill' },
    { key: 'devs', label: 'Dev Cost' },
    { key: 'investors', label: 'Investors' },
    { key: 'company', label: 'Company Margin' },
  ].map(tab => (
    <button key={tab.key}
      className={`btn btn-sm ${activePartyTab === tab.key ? 'btn-primary' : 'btn-outline-secondary'}`}
      onClick={() => setActivePartyTab(tab.key)}>
      {tab.label}
    </button>
  ))}
</div>

{activePartyTab === 'client' && (
  /* existing milestones / client billing section */
  <div>{/* milestones table already exists here — keep it as-is */}</div>
)}
{activePartyTab === 'devs' && (
  <div className="text-muted small p-3 bg-light rounded">
    Dev cost allocation — team members and rates recorded via Timesheet module.
  </div>
)}
{activePartyTab === 'investors' && (
  /* existing stakeholders section — move it here */
  <div>{/* stakeholders table already exists — move it under this tab */}</div>
)}
{activePartyTab === 'company' && (
  <CompanyMarginTab details={details} stakeholders={stakeholders} milestones={milestones} taxes={taxes} />
)}
```

Add `CompanyMarginTab` as a small component above `ProjectTrackerComplete`:
```jsx
function CompanyMarginTab({ details, stakeholders, milestones, taxes }) {
  const chargesList = Array.isArray(taxes) ? taxes : [];
  const totalTaxRate = chargesList.reduce((s, c) => s + (parseFloat(c.percentage) || 0), 0);
  const clientTotal = milestones.reduce((s, m) => {
    const base = (details.dealValue * m.percentage) / 100;
    return s + base + (base * totalTaxRate) / 100;
  }, 0);
  const devCost = 0; // sourced from Timesheet
  const investorShare = stakeholders.reduce((s, sh) => s + (details.dealValue * sh.percentage) / 100, 0);
  const margin = clientTotal - devCost - investorShare;
  const fmt = (n) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
  return (
    <table className="table table-sm">
      <tbody>
        <tr><td className="text-muted">Client Billed</td><td className="fw-semibold text-end">{details.currency} {fmt(clientTotal)}</td></tr>
        <tr><td className="text-muted">Dev Cost (Timesheet)</td><td className="fw-semibold text-end text-danger">− {details.currency} {fmt(devCost)}</td></tr>
        <tr><td className="text-muted">Investor Share</td><td className="fw-semibold text-end text-warning">− {details.currency} {fmt(investorShare)}</td></tr>
        <tr className="table-success"><td className="fw-bold">Company Margin</td><td className="fw-bold text-end">{details.currency} {fmt(margin)}</td></tr>
      </tbody>
    </table>
  );
}
```

- [ ] **Step 4: Auto-create Finance income on milestone Paid**

Find the code that handles setting a milestone status to `'Paid'`. It will be in the milestone status update handler. After the existing API call for a Paid milestone, add:

```js
// Auto-create Finance income record when a milestone is marked Paid
if (newStatus === 'Paid') {
  try {
    await incomeService.createIncome({
      description: `${details.clientName} — ${milestone.name}`,
      amount: base + (base * totalTaxRate) / 100,
      category: 'sales',
      date: new Date().toISOString().split('T')[0],
      source: 'invoice',
      invoiceId: details.projectId,
    });
  } catch (e) {
    console.error('Auto-income creation failed:', e);
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/Invoice/ProjectTrackerComplete.jsx
git commit -m "feat: invoice — 4-party tabs, dealId pre-fill from URL, auto Finance income on Paid"
```

---

## Task 8: Update Finance — Tag income + group P&L by client

**Files:**
- Modify: `src/pages/Finance/Finance.jsx`

- [ ] **Step 1: Add client grouping to P&L stats**

Find the `totalSplits` useMemo block (line ~118). After it, add a new memo for client revenue grouping:

```js
  const revenueByClient = useMemo(() => {
    const map = {};
    incomes.forEach(inc => {
      const key = inc.description?.split('—')[0]?.trim() || 'Unknown';
      map[key] = (map[key] || 0) + (parseFloat(inc.amount) || 0);
    });
    return Object.entries(map)
      .map(([client, total]) => ({ client, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [incomes]);
```

- [ ] **Step 2: Surface revenueByClient in the Finance UI**

Find where the Finance page renders its charts or stats section and add a "Top Clients by Revenue" table. Find the end of the stats cards render and add:

```jsx
{revenueByClient.length > 0 && (
  <div className="card border-0 shadow-sm mt-3">
    <div className="card-body p-3">
      <div className="fw-semibold mb-2" style={{ fontSize: 13 }}>Top Clients by Revenue</div>
      <table className="table table-sm mb-0">
        <tbody>
          {revenueByClient.map(({ client, total }) => (
            <tr key={client}>
              <td className="text-muted small">{client}</td>
              <td className="fw-semibold text-end small">{formatGlobalCurrency(total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Finance/Finance.jsx
git commit -m "feat: finance — add client revenue grouping in P&L"
```

---

## Task 9: Wire routes and navigation

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/layouts/MainLayout.jsx`

- [ ] **Step 1: Update App.jsx — import new pages and fix routes**

Find:
```js
import Dashboard from './pages/Dashboard/Dashboard';
```
Add after it:
```js
import Company from './pages/Company/Company';
import Leads from './pages/Leads/Leads';
```

Also find where Calendar and Reports are imported (or add if missing):
```js
import Calendar from './pages/Calendar/Calendar';
import Reports from './pages/Reports/Reports';
```

- [ ] **Step 2: Replace placeholder routes with real routes in App.jsx**

Find:
```jsx
            <Route path="company" element={<PrivateRoute permission="contacts.view"><PlaceholderPage title="Company" /></PrivateRoute>} />
            <Route path="leads" element={<PrivateRoute permission="sales.view"><PlaceholderPage title="Leads" /></PrivateRoute>} />
```
Replace with:
```jsx
            <Route path="company" element={<PrivateRoute permission="contacts.view"><Company /></PrivateRoute>} />
            <Route path="leads" element={<PrivateRoute permission="sales.view"><Leads /></PrivateRoute>} />
```

Find:
```jsx
            <Route path="hr" element={<PrivateRoute permission="dashboard.view"><PlaceholderPage title="HR" /></PrivateRoute>} />
```
Add after it:
```jsx
            <Route path="calendar" element={<PrivateRoute permission="dashboard.view"><Calendar /></PrivateRoute>} />
            <Route path="reports" element={<PrivateRoute permission="dashboard.view"><Reports /></PrivateRoute>} />
```

- [ ] **Step 3: Update MainLayout.jsx nav — add Calendar, Reports entries**

Find the Operations category:
```js
    {
      title: 'Operations',
      items: [
        { path: '/finance',   icon: <FaMoneyBillWave size={14} />, label: 'Finance',   permission: 'finance.view' },
        { path: '/invoice',   icon: <FaFileInvoice size={14} />,   label: 'Invoice',   permission: 'invoice.view' },
        { path: '/legal',     icon: <FaFileInvoice size={14} />,   label: 'Legal',     permission: 'invoice.view' },
        { path: '/documents', icon: <FaFileInvoice size={14} />,   label: 'Documents', permission: 'dashboard.view' },
        { path: '/links',     icon: <FaHouse size={14} />,         label: 'Links',     permission: 'dashboard.view' },
      ],
    },
```
Replace with:
```js
    {
      title: 'Operations',
      items: [
        { path: '/finance',   icon: <FaMoneyBillWave size={14} />, label: 'Finance',   permission: 'finance.view' },
        { path: '/invoice',   icon: <FaFileInvoice size={14} />,   label: 'Invoice',   permission: 'invoice.view' },
        { path: '/documents', icon: <FaFileInvoice size={14} />,   label: 'Documents', permission: 'dashboard.view' },
        { path: '/calendar',  icon: <FaHouse size={14} />,         label: 'Calendar',  permission: 'dashboard.view' },
      ],
    },
    {
      title: 'Reports',
      items: [
        { path: '/reports',   icon: <FaChartColumn size={14} />,   label: 'Reports',   permission: 'dashboard.view' },
      ],
    },
```

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx src/layouts/MainLayout.jsx
git commit -m "feat: wire Company, Leads, Calendar, Reports routes and nav entries"
```

---

## Task 10: Smoke test the full pipeline

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test each flow step**

1. Navigate to `/company` → create a company → confirm it appears in list
2. Navigate to `/contact` → open a contact → click "Convert to Lead" → confirm lead appears in `/leads`
3. Navigate to `/leads` → click Qualify (arrow) on a lead → confirm a deal appears in `/sales`
4. Navigate to `/sales` → drag a card to "Won" → confirm the "Create Invoice?" dialog appears → click "Create Invoice" → confirm redirect to `/invoice` with client name pre-filled
5. Navigate to `/invoice` → mark a milestone as "Paid" → navigate to `/finance` → confirm a new income record appears tagged as `source: invoice`
6. Navigate to `/calendar` → confirm page loads
7. Navigate to `/reports` → confirm page loads

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete CRM flow — Company→Contact→Lead→Sales→Invoice→Finance pipeline"
```
