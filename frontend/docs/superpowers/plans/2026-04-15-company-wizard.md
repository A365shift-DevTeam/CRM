# Company Creation Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Add Company" button with a 3-step wizard (Company → Contact → Lead) that creates all three records in one flow, eliminating manual navigation between pages.

**Architecture:** Option A — single inline `<Modal>` with `wizardStep` state (1/2/3), flat `wizardForm` object with prefixed keys (`company_*`, `contact_*`, `lead_*`). All logic in `Company.jsx`. Existing add/edit modal kept for editing. No new files or shared components.

**Tech Stack:** React, React-Bootstrap (Modal, Form, Button), lucide-react, existing companyService / contactService / leadService

---

## File Map

| File | Change |
|------|--------|
| `src/pages/Company/Company.jsx` | Add leadService import; add 3 state vars + `buildCompanyPayload` helper; add 5 handler functions; add wizard Modal JSX; rewire toolbar button |

---

## Task 1: Add state, helpers, and handlers

**Files:**
- Modify: `src/pages/Company/Company.jsx`

### Step 1.1 — Add leadService import

At line 5 (after `contactService` import), add:

```js
import { leadService } from '../../services/leadService';
```

- [ ] Make this change

### Step 1.2 — Add wizard state variables

In `Company.jsx`, after line 32 (`const [convertContactForm, setConvertContactForm] = useState({});`), add:

```js
const [showWizard, setShowWizard]   = useState(false);
const [wizardStep, setWizardStep]   = useState(1);
const [wizardForm, setWizardForm]   = useState({});
```

- [ ] Make this change

### Step 1.3 — Add `buildCompanyPayload` at module scope

After the `EMPTY_FORM` constant (after line 20), add:

```js
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
```

- [ ] Make this change

### Step 1.4 — Add `openWizard` and `closeWizard`

After `openEdit` (line 49), add:

```js
const openWizard  = () => { setWizardForm({}); setWizardStep(1); setShowWizard(true); };
const closeWizard = () => { setShowWizard(false); setWizardStep(1); setWizardForm({}); };
```

- [ ] Make this change

### Step 1.5 — Add `handleWizardNext`

After `closeWizard`, add:

```js
const handleWizardNext = () => {
  if (wizardStep === 1) {
    if (!wizardForm.company_name?.trim()) { toast.error('Company name is required'); return; }
    setWizardForm(p => ({
      ...p,
      contact_name:         p.contact_name         || p.company_name    || '',
      contact_clientCountry: p.contact_clientCountry || p.company_country || '',
      contact_clientAddress: p.contact_clientAddress || p.company_address || '',
    }));
    setWizardStep(2);
  } else if (wizardStep === 2) {
    if (!wizardForm.contact_name?.trim()) { toast.error('Contact name is required'); return; }
    setWizardForm(p => ({
      ...p,
      lead_contactName: p.lead_contactName || p.contact_name  || '',
      lead_company:     p.lead_company     || p.company_name  || '',
    }));
    setWizardStep(3);
  }
};
```

- [ ] Make this change

### Step 1.6 — Add `handleWizardBack`, `handleWizardSkip`, `handleWizardSave`

Directly after `handleWizardNext`, add:

```js
const handleWizardBack = () => setWizardStep(s => s - 1);

const handleWizardSkip = async () => {
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
  try {
    const company = await companyService.createCompany(buildCompanyPayload(wizardForm));

    const contact = await contactService.createContact({
      name:          wizardForm.contact_name         || '',
      email:         wizardForm.contact_email        || '',
      phone:         wizardForm.contact_phone        || '',
      jobTitle:      wizardForm.contact_jobTitle     || '',
      status:        wizardForm.contact_status       || 'Active',
      location:      wizardForm.contact_location     || '',
      clientCountry: wizardForm.contact_clientCountry || '',
      clientAddress: wizardForm.contact_clientAddress || '',
      company:       wizardForm.company_name         || '',
      entityType:    'Company',
      companyId:     company.id,
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
      contactId:         contact.id,
    });

    toast.success('Company, Contact & Lead created');
    closeWizard();
    loadCompanies();
  } catch (e) {
    toast.error(e.message || 'Failed to save — please try again');
  }
};
```

- [ ] Make this change

### Step 1.7 — Rewire the toolbar button

Find (line 156):
```js
actions={[{ label: 'Add Company', variant: 'primary', onClick: openAdd }]}
```

Change to:
```js
actions={[{ label: 'Add Company', variant: 'primary', onClick: openWizard }]}
```

- [ ] Make this change

### Step 1.8 — Commit

```bash
git add src/pages/Company/Company.jsx
git commit -m "feat: add wizard state, handlers, and leadService import to Company.jsx"
```

- [ ] Run commit

---

## Task 2: Add wizard Modal JSX

**Files:**
- Modify: `src/pages/Company/Company.jsx`

### Step 2.1 — Add the wizard Modal

In `Company.jsx`, just before the closing `</div>` of the return (after the `{/* CONVERT COMPANY → CONTACT MODAL */}` closing `</Modal>` tag, before line 328 `</div>`), add the complete wizard modal:

```jsx
{/* COMPANY CREATION WIZARD */}
<Modal show={showWizard} onHide={closeWizard} centered size="lg">
  <Modal.Header closeButton className="border-0 pb-0">
    <Modal.Title className="h6 fw-bold">New Company</Modal.Title>
  </Modal.Header>
  <Modal.Body>

    {/* ── Step indicator ── */}
    <div className="d-flex align-items-center justify-content-center mb-4">
      {[{ n: 1, label: 'Company' }, { n: 2, label: 'Contact' }, { n: 3, label: 'Lead' }].map((s, i) => (
        <div key={s.n} className="d-flex align-items-center">
          <div className="d-flex flex-column align-items-center">
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600,
              background: wizardStep >= s.n ? '#0d6efd' : '#e2e8f0',
              color: wizardStep >= s.n ? '#fff' : '#94a3b8',
              transition: 'all 0.2s',
            }}>
              {wizardStep > s.n ? '✓' : s.n}
            </div>
            <span style={{ fontSize: 11, marginTop: 4, fontWeight: wizardStep === s.n ? 600 : 400, color: wizardStep >= s.n ? '#0d6efd' : '#94a3b8' }}>
              {s.label}
            </span>
          </div>
          {i < 2 && (
            <div style={{ width: 60, height: 2, background: wizardStep > s.n ? '#0d6efd' : '#e2e8f0', margin: '0 8px', marginBottom: 20, transition: 'all 0.2s' }} />
          )}
        </div>
      ))}
    </div>

    {/* ── Step 1: Company Details ── */}
    {wizardStep === 1 && (
      <div className="row g-3">
        <div className="col-12">
          <Form.Label className="small fw-semibold mb-1">Company Name *</Form.Label>
          <Form.Control size="sm" type="text" value={wizardForm.company_name || ''} onChange={e => setWizardForm(p => ({ ...p, company_name: e.target.value }))} />
        </div>
        <div className="col-6">
          <Form.Label className="small fw-semibold mb-1">Website</Form.Label>
          <Form.Control size="sm" type="text" value={wizardForm.company_website || ''} onChange={e => setWizardForm(p => ({ ...p, company_website: e.target.value }))} />
        </div>
        <div className="col-6">
          <Form.Label className="small fw-semibold mb-1">Country</Form.Label>
          <Form.Control size="sm" type="text" value={wizardForm.company_country || ''} onChange={e => setWizardForm(p => ({ ...p, company_country: e.target.value }))} />
        </div>
        <div className="col-12">
          <Form.Label className="small fw-semibold mb-1">Address</Form.Label>
          <Form.Control size="sm" type="text" value={wizardForm.company_address || ''} onChange={e => setWizardForm(p => ({ ...p, company_address: e.target.value }))} />
        </div>
        <div className="col-6">
          <Form.Label className="small fw-semibold mb-1">Industry</Form.Label>
          <Form.Select size="sm" value={wizardForm.company_industry || ''} onChange={e => setWizardForm(p => ({ ...p, company_industry: e.target.value }))}>
            <option value="">Select industry</option>
            {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
          </Form.Select>
        </div>
        <div className="col-6">
          <Form.Label className="small fw-semibold mb-1">Company Size</Form.Label>
          <Form.Select size="sm" value={wizardForm.company_size || ''} onChange={e => setWizardForm(p => ({ ...p, company_size: e.target.value }))}>
            <option value="">Select size</option>
            {SIZES.map(s => <option key={s}>{s}</option>)}
          </Form.Select>
        </div>
        <div className="col-12">
          <Form.Label className="small fw-semibold mb-1">Tags (comma separated)</Form.Label>
          <Form.Control size="sm" type="text" value={wizardForm.company_tags || ''} onChange={e => setWizardForm(p => ({ ...p, company_tags: e.target.value }))} />
        </div>
        {(wizardForm.company_country?.trim().toLowerCase() === 'india' || !wizardForm.company_country) && <>
          <div className="col-12">
            <div className="small fw-bold text-muted mt-2 mb-1" style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em' }}>Tax & Financial Information</div>
          </div>
          {[
            { label: 'GSTIN / Tax ID', key: 'company_gstin' },
            { label: 'PAN',            key: 'company_pan' },
            { label: 'CIN',            key: 'company_cin' },
            { label: 'TDS Section',    key: 'company_tdsSection' },
          ].map(f => (
            <div key={f.key} className="col-6">
              <Form.Label className="small fw-semibold mb-1">{f.label}</Form.Label>
              <Form.Control size="sm" type="text" value={wizardForm[f.key] || ''} onChange={e => setWizardForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}
          <div className="col-6">
            <Form.Label className="small fw-semibold mb-1">TDS Rate</Form.Label>
            <Form.Control size="sm" type="number" value={wizardForm.company_tdsRate || ''} onChange={e => setWizardForm(p => ({ ...p, company_tdsRate: e.target.value }))} />
          </div>
          <div className="col-6">
            <Form.Label className="small fw-semibold mb-1">MSME Status</Form.Label>
            <Form.Select size="sm" value={wizardForm.company_msmeStatus || 'NON MSME'} onChange={e => setWizardForm(p => ({ ...p, company_msmeStatus: e.target.value }))}>
              <option value="NON MSME">NON MSME</option>
              <option value="MSME">MSME</option>
            </Form.Select>
          </div>
        </>}
        {wizardForm.company_country && wizardForm.company_country.trim().toLowerCase() !== 'india' && (
          <div className="col-6">
            <Form.Label className="small fw-semibold mb-1">Intl Tax ID (VAT/EIN)</Form.Label>
            <Form.Control size="sm" type="text" value={wizardForm.company_internationalTaxId || ''} onChange={e => setWizardForm(p => ({ ...p, company_internationalTaxId: e.target.value }))} />
          </div>
        )}
      </div>
    )}

    {/* ── Step 2: Contact Details ── */}
    {wizardStep === 2 && (
      <div className="row g-3">
        <div className="col-12">
          <Form.Label className="small fw-semibold mb-1">Name *</Form.Label>
          <Form.Control size="sm" type="text" value={wizardForm.contact_name || ''} onChange={e => setWizardForm(p => ({ ...p, contact_name: e.target.value }))} />
        </div>
        <div className="col-6">
          <Form.Label className="small fw-semibold mb-1">Email</Form.Label>
          <Form.Control size="sm" type="email" value={wizardForm.contact_email || ''} onChange={e => setWizardForm(p => ({ ...p, contact_email: e.target.value }))} />
        </div>
        <div className="col-6">
          <Form.Label className="small fw-semibold mb-1">Phone</Form.Label>
          <Form.Control size="sm" type="text" value={wizardForm.contact_phone || ''} onChange={e => setWizardForm(p => ({ ...p, contact_phone: e.target.value }))} />
        </div>
        <div className="col-6">
          <Form.Label className="small fw-semibold mb-1">Job Title</Form.Label>
          <Form.Select size="sm" value={wizardForm.contact_jobTitle || ''} onChange={e => setWizardForm(p => ({ ...p, contact_jobTitle: e.target.value }))}>
            <option value="">Select title</option>
            {['CEO', 'CTO', 'Manager', 'Software Engineer', 'Product Manager', 'Sales Representative', 'Designer', 'HR Manager', 'Accountant', 'Consultant', 'Director', 'Other'].map(t => <option key={t}>{t}</option>)}
          </Form.Select>
        </div>
        <div className="col-6">
          <Form.Label className="small fw-semibold mb-1">Status</Form.Label>
          <Form.Select size="sm" value={wizardForm.contact_status || 'Active'} onChange={e => setWizardForm(p => ({ ...p, contact_status: e.target.value }))}>
            {['Active', 'Inactive', 'Lead', 'Customer'].map(s => <option key={s}>{s}</option>)}
          </Form.Select>
        </div>
        <div className="col-6">
          <Form.Label className="small fw-semibold mb-1">Location</Form.Label>
          <Form.Control size="sm" type="text" value={wizardForm.contact_location || ''} onChange={e => setWizardForm(p => ({ ...p, contact_location: e.target.value }))} />
        </div>
        <div className="col-6">
          <Form.Label className="small fw-semibold mb-1">Country</Form.Label>
          <Form.Control size="sm" type="text" value={wizardForm.contact_clientCountry || ''} onChange={e => setWizardForm(p => ({ ...p, contact_clientCountry: e.target.value }))} />
        </div>
        <div className="col-12">
          <Form.Label className="small fw-semibold mb-1">Address</Form.Label>
          <Form.Control size="sm" type="text" value={wizardForm.contact_clientAddress || ''} onChange={e => setWizardForm(p => ({ ...p, contact_clientAddress: e.target.value }))} />
        </div>
      </div>
    )}

    {/* ── Step 3: Lead Details ── */}
    {wizardStep === 3 && (
      <div className="row g-3">
        <div className="col-6">
          <Form.Label className="small fw-semibold mb-1">Contact Name</Form.Label>
          <Form.Control size="sm" type="text" value={wizardForm.lead_contactName || ''} onChange={e => setWizardForm(p => ({ ...p, lead_contactName: e.target.value }))} />
        </div>
        <div className="col-6">
          <Form.Label className="small fw-semibold mb-1">Company</Form.Label>
          <Form.Control size="sm" type="text" value={wizardForm.lead_company || ''} onChange={e => setWizardForm(p => ({ ...p, lead_company: e.target.value }))} />
        </div>
        <div className="col-6">
          <Form.Label className="small fw-semibold mb-1">Source</Form.Label>
          <Form.Select size="sm" value={wizardForm.lead_source || 'Inbound'} onChange={e => setWizardForm(p => ({ ...p, lead_source: e.target.value }))}>
            {['Inbound', 'Referral', 'Campaign', 'Cold'].map(s => <option key={s}>{s}</option>)}
          </Form.Select>
        </div>
        <div className="col-6">
          <Form.Label className="small fw-semibold mb-1">Score</Form.Label>
          <Form.Select size="sm" value={wizardForm.lead_score || 'Warm'} onChange={e => setWizardForm(p => ({ ...p, lead_score: e.target.value }))}>
            {['Hot', 'Warm', 'Cold'].map(s => <option key={s}>{s}</option>)}
          </Form.Select>
        </div>
        <div className="col-6">
          <Form.Label className="small fw-semibold mb-1">Stage</Form.Label>
          <Form.Select size="sm" value={wizardForm.lead_stage || 'New'} onChange={e => setWizardForm(p => ({ ...p, lead_stage: e.target.value }))}>
            {['New', 'Contacted', 'Qualified', 'Disqualified'].map(s => <option key={s}>{s}</option>)}
          </Form.Select>
        </div>
        <div className="col-6">
          <Form.Label className="small fw-semibold mb-1">Project Type</Form.Label>
          <Form.Select size="sm" value={wizardForm.lead_type || 'Product'} onChange={e => setWizardForm(p => ({ ...p, lead_type: e.target.value }))}>
            <option value="Product">{localStorage.getItem('app_product_label') || 'Products'}</option>
            <option value="Service">{localStorage.getItem('app_service_label') || 'Services'}</option>
          </Form.Select>
        </div>
        <div className="col-6">
          <Form.Label className="small fw-semibold mb-1">Expected Value</Form.Label>
          <Form.Control size="sm" type="number" value={wizardForm.lead_expectedValue || ''} onChange={e => setWizardForm(p => ({ ...p, lead_expectedValue: e.target.value }))} />
        </div>
        <div className="col-6">
          <Form.Label className="small fw-semibold mb-1">Expected Close Date</Form.Label>
          <Form.Control size="sm" type="date" value={wizardForm.lead_expectedCloseDate || ''} onChange={e => setWizardForm(p => ({ ...p, lead_expectedCloseDate: e.target.value }))} />
        </div>
        <div className="col-12">
          <Form.Label className="small fw-semibold mb-1">Assigned To</Form.Label>
          <Form.Control size="sm" type="text" value={wizardForm.lead_assignedTo || ''} onChange={e => setWizardForm(p => ({ ...p, lead_assignedTo: e.target.value }))} />
        </div>
        <div className="col-12">
          <Form.Label className="small fw-semibold mb-1">Notes</Form.Label>
          <Form.Control as="textarea" rows={2} size="sm" value={wizardForm.lead_notes || ''} onChange={e => setWizardForm(p => ({ ...p, lead_notes: e.target.value }))} />
        </div>
      </div>
    )}

  </Modal.Body>
  <Modal.Footer className="border-0 pt-0">
    <Button variant="secondary" size="sm" onClick={closeWizard}>Cancel</Button>
    {wizardStep > 1 && (
      <Button variant="light" size="sm" onClick={handleWizardBack}>← Back</Button>
    )}
    {wizardStep === 2 && (
      <Button variant="outline-secondary" size="sm" onClick={handleWizardSkip}>Skip</Button>
    )}
    {wizardStep < 3 && (
      <Button variant="primary" size="sm" onClick={handleWizardNext}>Next →</Button>
    )}
    {wizardStep === 3 && (
      <Button variant="success" size="sm" onClick={handleWizardSave} className="d-flex align-items-center gap-1">
        <ArrowUpRight size={14} /> Save All
      </Button>
    )}
  </Modal.Footer>
</Modal>
```

- [ ] Make this change

### Step 2.2 — Verify in browser

Start the dev server if not already running:
```bash
cd frontend && npm run dev
```

Check each path manually:
- [ ] Click "Add Company" → wizard opens on Step 1, step indicator shows `● Company ─── ○ Contact ─── ○ Lead`
- [ ] Leave Name empty → click Next → toast error "Company name is required"
- [ ] Fill Name + Country "India" → Tax & Financial section appears
- [ ] Fill Name + Country "USA" → Intl Tax ID field appears, no India tax section
- [ ] Click Next → advances to Step 2, contact_name pre-filled from company_name, step indicator updates
- [ ] Click ← Back → returns to Step 1 with all data intact
- [ ] On Step 2 click Skip → only company created, wizard closes, company appears in list
- [ ] Full path: Step 1 → Next → Step 2 → Next → Step 3 → Save All → success toast, company in list
- [ ] Cancel at any step → wizard closes, state resets (re-open shows fresh Step 1)
- [ ] Edit button on a company card still opens the old edit modal (not the wizard)

### Step 2.3 — Commit

```bash
git add src/pages/Company/Company.jsx
git commit -m "feat: add 3-step company creation wizard (Company → Contact → Lead)"
```

- [ ] Run commit

---

## Self-Review Checklist

- [x] **Spec coverage — Step indicator:** ✓ Task 2.1 step indicator with filled/empty circles
- [x] **Spec coverage — Step 1 fields:** ✓ All company fields including India/Intl tax conditional
- [x] **Spec coverage — Step 2 pre-fill:** ✓ `handleWizardNext` sets `contact_name`, `contact_clientCountry`, `contact_clientAddress` from company values
- [x] **Spec coverage — Step 3 pre-fill:** ✓ `handleWizardNext` sets `lead_contactName`, `lead_company` from prior steps
- [x] **Spec coverage — Skip path:** ✓ `handleWizardSkip` creates company only
- [x] **Spec coverage — Full save path:** ✓ `handleWizardSave` creates company → contact (with companyId) → lead (with contactId)
- [x] **Spec coverage — Error handling:** ✓ All three API calls are inside a single try/catch; toast.error shown, wizard stays open
- [x] **Spec coverage — Validation:** ✓ company_name checked in Step 1, contact_name checked in Step 2 (Next only)
- [x] **Spec coverage — Cancel/close resets:** ✓ `closeWizard` resets step to 1 and clears form
- [x] **Spec coverage — Edit modal untouched:** ✓ `openEdit` and the add/edit Modal JSX are not changed
- [x] **Type consistency:** `buildCompanyPayload`, `handleWizardNext`, `handleWizardBack`, `handleWizardSkip`, `handleWizardSave`, `openWizard`, `closeWizard` all used consistently
- [x] **No placeholders:** All code blocks are complete
