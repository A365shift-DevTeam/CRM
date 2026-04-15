# CRM Conversion Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Swal confirmation dialogs with full detail modals at each pipeline conversion step (Company→Contact, Contact→Lead, Lead→Sales), enforce conversion-only creation for Contact and Lead, and move Tax & Financial fields from ContactModal to Company.

**Architecture:** Approach A — inline modals per page. Each page owns its own conversion modal state and logic. No shared components introduced. Existing Bootstrap Modal patterns are reused exactly as they appear in each file.

**Tech Stack:** React, React-Bootstrap (Modal, Form, Button), lucide-react icons, existing service layer (contactService, leadService, projectService)

---

## File Map

| File | Change |
|------|--------|
| `src/pages/Company/Company.jsx` | Add convert-to-contact modal; add Tax fields to add/edit form |
| `src/pages/Contact/Contacts/Contacts.jsx` | Upgrade convert modal to full lead form; remove Add Contact button |
| `src/pages/Contact/Contacts/ContactModal.jsx` | Remove Tax & Financial sections |
| `src/pages/Leads/Leads.jsx` | Replace qualify Swal with full modal; remove Add Lead button |

---

## Task 1: Move Tax & Financial Fields to Company.jsx

**Files:**
- Modify: `src/pages/Company/Company.jsx`
- Modify: `src/pages/Contact/Contacts/ContactModal.jsx`
- Modify: `src/pages/Contact/Contacts/Contacts.jsx`

### Step 1.1 — Add Tax fields to Company EMPTY_FORM

In `src/pages/Company/Company.jsx`, update `EMPTY_FORM` (currently at line 15) to include tax fields:

```js
const EMPTY_FORM = {
  name: '', industry: '', size: '', website: '',
  address: '', country: '', gstin: '', tags: '',
  pan: '', cin: '', msmeStatus: 'NON MSME',
  tdsSection: '', tdsRate: '', internationalTaxId: ''
};
```

- [ ] Make this change

### Step 1.2 — Add Tax fields to Company add/edit modal body

In `src/pages/Company/Company.jsx`, after the existing modal fields array (ends around line 202 with `gstin`), add Tax & Financial fields. Replace the modal `<Modal.Body>` contents with:

```jsx
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
    {(form.country === 'India' || !form.country) && <>
      <div className="col-12">
        <div className="small fw-bold text-muted mt-2 mb-1" style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em' }}>Tax & Financial Information</div>
      </div>
      {[
        { label: 'GSTIN / Tax ID', key: 'gstin', col: 6 },
        { label: 'PAN', key: 'pan', col: 6 },
        { label: 'CIN', key: 'cin', col: 6 },
        { label: 'TDS Section', key: 'tdsSection', col: 6 },
        { label: 'TDS Rate', key: 'tdsRate', col: 6 },
      ].map(f => (
        <div key={f.key} className={`col-${f.col}`}>
          <Form.Label className="small fw-semibold mb-1">{f.label}</Form.Label>
          <Form.Control size="sm" type="text" value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
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
    {form.country && form.country !== 'India' && (
      <div className="col-6">
        <Form.Label className="small fw-semibold mb-1">Intl Tax ID (VAT/EIN)</Form.Label>
        <Form.Control size="sm" type="text" value={form.internationalTaxId || ''} onChange={e => setForm(p => ({ ...p, internationalTaxId: e.target.value }))} />
      </div>
    )}
  </div>
</Modal.Body>
```

- [ ] Make this change

### Step 1.3 — Remove Tax sections from ContactModal.jsx

In `src/pages/Contact/Contacts/ContactModal.jsx`, find lines 316–317:

```jsx
{renderCategorySection('Tax & Financial Information', fieldCategories.taxIndia, isIndia)}
{renderCategorySection('Tax Information', fieldCategories.taxInternational, !isIndia)}
```

Delete both lines. Keep all other `renderCategorySection` calls untouched.

- [ ] Make this change

### Step 1.4 — Remove Tax columns from Contacts.jsx column list

In `src/pages/Contact/Contacts/Contacts.jsx`, in the `contactColumns` state (lines 48–65), remove these entries:

```js
{ id: 'gstin', name: 'GSTIN', type: 'text', visible: false },
{ id: 'pan', name: 'PAN', type: 'text', visible: false },
{ id: 'cin', name: 'CIN', type: 'text', visible: false },
{ id: 'internationalTaxId', name: 'Intl Tax ID (VAT/EIN)', type: 'text', visible: false },
{ id: 'msmeStatus', name: 'MSME Status', type: 'text', visible: false },
{ id: 'tdsSection', name: 'TDS Section', type: 'text', visible: false },
{ id: 'tdsRate', name: 'TDS Rate', type: 'number', visible: false },
```

- [ ] Make this change

### Step 1.5 — Commit

```bash
git add src/pages/Company/Company.jsx src/pages/Contact/Contacts/ContactModal.jsx src/pages/Contact/Contacts/Contacts.jsx
git commit -m "feat: move tax & financial fields from Contact to Company"
```

- [ ] Run commit

---

## Task 2: Company → Contact Full Conversion Modal

**Files:**
- Modify: `src/pages/Company/Company.jsx`

### Step 2.1 — Add conversion modal state

In `src/pages/Company/Company.jsx`, add these state variables below the existing `useState` declarations (after line 27):

```js
const [showConvertContactModal, setShowConvertContactModal] = useState(false);
const [convertingCompany, setConvertingCompany] = useState(null);
const [convertContactForm, setConvertContactForm] = useState({});
```

- [ ] Make this change

### Step 2.2 — Replace handleConvertToContact

Replace the existing `handleConvertToContact` function (lines 91–124) with:

```js
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
  } catch (e) {
    toast.error(e.message || 'Failed to create contact');
  }
};
```

- [ ] Make this change

### Step 2.3 — Add Company → Contact modal JSX

Add the following modal just before the closing `</div>` of the return (before line 230 `</div>`), after the existing Add/Edit modal:

```jsx
{/* CONVERT COMPANY → CONTACT MODAL */}
<Modal show={showConvertContactModal} onHide={() => setShowConvertContactModal(false)} centered size="lg">
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
    <Button variant="secondary" size="sm" onClick={() => setShowConvertContactModal(false)}>Cancel</Button>
    <Button variant="success" size="sm" onClick={handleSaveConvertContact}>
      <ArrowUpRight size={14} className="me-1" /> Create Contact
    </Button>
  </Modal.Footer>
</Modal>
```

- [ ] Make this change

### Step 2.4 — Commit

```bash
git add src/pages/Company/Company.jsx
git commit -m "feat: replace Company→Contact Swal with full detail modal"
```

- [ ] Run commit

---

## Task 3: Contact → Lead Full Conversion Modal

**Files:**
- Modify: `src/pages/Contact/Contacts/Contacts.jsx`

### Step 3.1 — Expand convert modal state

In `src/pages/Contact/Contacts/Contacts.jsx`, the existing convert state is (lines 78–82):

```js
const [showConvertModal, setShowConvertModal] = useState(false)
const [convertingContact, setConvertingContact] = useState(null)
const [convertType, setConvertType] = useState('Product')
const [convertBranding, setConvertBranding] = useState('')
const [convertClient, setConvertClient] = useState('')
```

Replace these 5 lines with a single form object state:

```js
const [showConvertModal, setShowConvertModal] = useState(false)
const [convertingContact, setConvertingContact] = useState(null)
const [convertLeadForm, setConvertLeadForm] = useState({})
```

- [ ] Make this change

### Step 3.2 — Update handleConvertToSales

Replace the existing `handleConvertToSales` function (lines 361–366) with:

```js
const handleConvertToSales = (contact) => {
  setConvertingContact(contact)
  setConvertLeadForm({
    contactName: contact.name || '',
    contactId: contact.id,
    company: contact.company || '',
    source: 'Inbound',
    score: 'Warm',
    stage: 'New',
    type: localStorage.getItem('app_product_label') ? 'Product' : 'Product',
    assignedTo: '',
    expectedValue: '',
    expectedCloseDate: '',
    notes: '',
  })
  setShowConvertModal(true)
}
```

- [ ] Make this change

### Step 3.3 — Update handleConfirmConvert

Replace the existing `handleConfirmConvert` function (lines 368–392) with:

```js
const handleConfirmConvert = async () => {
  if (!convertingContact) return
  try {
    await leadService.createLead({
      ...convertLeadForm,
      contactId: convertingContact.id,
      expectedValue: convertLeadForm.expectedValue !== '' ? parseFloat(convertLeadForm.expectedValue) : null,
      expectedCloseDate: convertLeadForm.expectedCloseDate || null,
    })
    toast.success(`Contact "${convertingContact.name}" converted to a Lead!`)
    setShowConvertModal(false)
    setConvertingContact(null)
  } catch (error) {
    console.error('Error converting contact to lead:', error)
    toast.error('Failed to convert contact. Please try again.')
  }
}
```

- [ ] Make this change

### Step 3.4 — Remove Add Contact button from PageToolbar

In `src/pages/Contact/Contacts/Contacts.jsx`, find the `actions` prop on `PageToolbar` (around line 449):

```js
actions={[
  { label: 'Contact', icon: <Plus size={16} />, variant: 'success', onClick: handleCreateContact },
  { label: 'AI', icon: <span>✨</span>, variant: 'purple', onClick: () => setShowAIAssist(true) }
]}
```

Change to (remove the Contact action, keep AI):

```js
actions={[
  { label: 'AI', icon: <span>✨</span>, variant: 'purple', onClick: () => setShowAIAssist(true) }
]}
```

- [ ] Make this change

### Step 3.5 — Replace the Convert Modal JSX

In `src/pages/Contact/Contacts/Contacts.jsx`, find the existing `{/* CONVERT TO SALES MODAL */}` block (lines 611–669) and replace the entire block with:

```jsx
{/* CONVERT CONTACT → LEAD MODAL */}
<Modal show={showConvertModal} onHide={() => setShowConvertModal(false)} centered size="lg">
  <Modal.Header closeButton className="border-0 pb-0">
    <Modal.Title className="h6 fw-bold">
      Convert to Lead — {convertingContact?.name}
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <div className="row g-3">
      <div className="col-6">
        <Form.Label className="small fw-semibold mb-1">Contact Name *</Form.Label>
        <Form.Control size="sm" type="text" value={convertLeadForm.contactName || ''} onChange={e => setConvertLeadForm(p => ({ ...p, contactName: e.target.value }))} />
      </div>
      <div className="col-6">
        <Form.Label className="small fw-semibold mb-1">Company</Form.Label>
        <Form.Control size="sm" type="text" value={convertLeadForm.company || ''} onChange={e => setConvertLeadForm(p => ({ ...p, company: e.target.value }))} />
      </div>
      <div className="col-6">
        <Form.Label className="small fw-semibold mb-1">Source</Form.Label>
        <Form.Select size="sm" value={convertLeadForm.source || 'Inbound'} onChange={e => setConvertLeadForm(p => ({ ...p, source: e.target.value }))}>
          {['Inbound', 'Referral', 'Campaign', 'Cold'].map(s => <option key={s}>{s}</option>)}
        </Form.Select>
      </div>
      <div className="col-6">
        <Form.Label className="small fw-semibold mb-1">Score</Form.Label>
        <Form.Select size="sm" value={convertLeadForm.score || 'Warm'} onChange={e => setConvertLeadForm(p => ({ ...p, score: e.target.value }))}>
          {['Hot', 'Warm', 'Cold'].map(s => <option key={s}>{s}</option>)}
        </Form.Select>
      </div>
      <div className="col-6">
        <Form.Label className="small fw-semibold mb-1">Stage</Form.Label>
        <Form.Select size="sm" value={convertLeadForm.stage || 'New'} onChange={e => setConvertLeadForm(p => ({ ...p, stage: e.target.value }))}>
          {['New', 'Contacted', 'Qualified', 'Disqualified'].map(s => <option key={s}>{s}</option>)}
        </Form.Select>
      </div>
      <div className="col-6">
        <Form.Label className="small fw-semibold mb-1">Project Type</Form.Label>
        <Form.Select size="sm" value={convertLeadForm.type || 'Product'} onChange={e => setConvertLeadForm(p => ({ ...p, type: e.target.value }))}>
          <option value="Product">{localStorage.getItem('app_product_label') || 'Products'}</option>
          <option value="Service">{localStorage.getItem('app_service_label') || 'Services'}</option>
        </Form.Select>
      </div>
      <div className="col-6">
        <Form.Label className="small fw-semibold mb-1">Expected Value</Form.Label>
        <Form.Control size="sm" type="number" value={convertLeadForm.expectedValue || ''} onChange={e => setConvertLeadForm(p => ({ ...p, expectedValue: e.target.value }))} />
      </div>
      <div className="col-6">
        <Form.Label className="small fw-semibold mb-1">Expected Close Date</Form.Label>
        <Form.Control size="sm" type="date" value={convertLeadForm.expectedCloseDate || ''} onChange={e => setConvertLeadForm(p => ({ ...p, expectedCloseDate: e.target.value }))} />
      </div>
      <div className="col-12">
        <Form.Label className="small fw-semibold mb-1">Assigned To</Form.Label>
        <Form.Control size="sm" type="text" value={convertLeadForm.assignedTo || ''} onChange={e => setConvertLeadForm(p => ({ ...p, assignedTo: e.target.value }))} />
      </div>
      <div className="col-12">
        <Form.Label className="small fw-semibold mb-1">Notes</Form.Label>
        <Form.Control as="textarea" rows={2} size="sm" value={convertLeadForm.notes || ''} onChange={e => setConvertLeadForm(p => ({ ...p, notes: e.target.value }))} />
      </div>
    </div>
  </Modal.Body>
  <Modal.Footer className="border-0 pt-0">
    <Button variant="light" size="sm" onClick={() => setShowConvertModal(false)}>Cancel</Button>
    <Button variant="success" size="sm" onClick={handleConfirmConvert} className="d-flex align-items-center gap-1">
      <ArrowUpRight size={14} /> Convert to Lead
    </Button>
  </Modal.Footer>
</Modal>
```

- [ ] Make this change

### Step 3.6 — Remove unused convert state variables from references

The old `convertType`, `convertBranding`, `convertClient` variables no longer exist. Check no other code references them:

```bash
grep -n "convertType\|convertBranding\|convertClient" src/pages/Contact/Contacts/Contacts.jsx
```

Expected: no results. If any remain, remove them.

- [ ] Run check, remove any remaining references

### Step 3.7 — Commit

```bash
git add src/pages/Contact/Contacts/Contacts.jsx
git commit -m "feat: upgrade Contact→Lead convert modal to full lead form; remove Add Contact button"
```

- [ ] Run commit

---

## Task 4: Lead → Sales Full Qualification Modal

**Files:**
- Modify: `src/pages/Leads/Leads.jsx`

### Step 4.1 — Add qualify modal state

In `src/pages/Leads/Leads.jsx`, add these state variables after existing `useState` declarations (after line 33):

```js
const [showQualifyModal, setShowQualifyModal] = useState(false);
const [qualifyingLead, setQualifyingLead] = useState(null);
const [qualifyForm, setQualifyForm] = useState({});
```

- [ ] Make this change

### Step 4.2 — Replace handleQualify

Replace the existing `handleQualify` function (lines 95–150) with:

```js
const handleQualify = (lead) => {
  const today = new Date();
  const date = String(today.getDate()).padStart(2, '0');
  const year = String(today.getFullYear()).slice(-2);
  const brandCode = (lead.company || 'A3').substring(0, 2).toUpperCase();
  const clientCode = (lead.contactName || 'C').slice(-1).toUpperCase();
  const customId = `${date}${brandCode}${clientCode}${year}`;

  setQualifyingLead(lead);
  setQualifyForm({
    title: `${lead.contactName} - ${lead.company || 'Direct'}`,
    clientName: lead.contactName || '',
    type: lead.type || 'Product',
    customId,
    dealValue: lead.expectedValue || '',
    expectedCloseDate: lead.expectedCloseDate || '',
  });
  setShowQualifyModal(true);
};

const handleConfirmQualify = async () => {
  if (!qualifyingLead) return;
  const lead = qualifyingLead;

  const STAGE_STORAGE_KEYS = { Product: 'sales_stages_product', Service: 'sales_stages_service' };
  const defaultStages = [
    { id: 0, label: 'Demo', color: 'cyan', ageing: 7 },
    { id: 1, label: 'Proposal', color: 'gray', ageing: 15 },
    { id: 2, label: 'Negotiation', color: 'gray', ageing: 30 },
    { id: 3, label: 'Approval', color: 'gray', ageing: 15 },
    { id: 4, label: 'Won', color: 'green', ageing: 30 },
    { id: 5, label: 'Closed', color: 'green', ageing: 90 },
    { id: 6, label: 'Lost', color: 'orange', ageing: 60 },
  ];
  let initialStages = defaultStages;
  try {
    const stored = localStorage.getItem(STAGE_STORAGE_KEYS[qualifyForm.type]);
    if (stored) initialStages = JSON.parse(stored);
  } catch (e) { /* use defaults */ }

  try {
    await projectService.create({
      activeStage: 0,
      history: [],
      type: qualifyForm.type,
      delay: 0,
      title: qualifyForm.title,
      clientName: qualifyForm.clientName,
      customId: qualifyForm.customId,
      dealValue: qualifyForm.dealValue !== '' ? parseFloat(qualifyForm.dealValue) : null,
      expectedCloseDate: qualifyForm.expectedCloseDate || null,
      stages: initialStages,
      leadId: lead.id,
    });
    await leadService.updateLead(lead.id, { ...lead, stage: 'Qualified' });
    toast.success(`Lead qualified — Sales deal created for ${lead.contactName}`);
    setShowQualifyModal(false);
    setQualifyingLead(null);
    loadLeads();
  } catch (e) {
    toast.error('Failed to qualify lead');
  }
};
```

- [ ] Make this change

### Step 4.3 — Remove Add Lead button from PageToolbar

In `src/pages/Leads/Leads.jsx`, find the `actions` prop on `PageToolbar` (line 194):

```js
actions={[{ label: 'Add Lead', variant: 'primary', onClick: openAdd }]}
```

Remove the `actions` prop entirely (leads are only created via Contact conversion):

```js
{/* actions prop removed — leads created via Contact conversion only */}
```

- [ ] Make this change

### Step 4.4 — Add Qualify modal JSX

Add the following modal just before the closing `</div>` of the return (before line 332 `</div>`), after the existing Add/Edit Lead modal:

```jsx
{/* QUALIFY LEAD → SALES MODAL */}
<Modal show={showQualifyModal} onHide={() => setShowQualifyModal(false)} centered size="lg">
  <Modal.Header closeButton className="border-0 pb-0">
    <Modal.Title className="h6 fw-bold">
      Qualify Lead → Sales Deal
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <div className="row g-3">
      <div className="col-12">
        <Form.Label className="small fw-semibold mb-1">Deal Title *</Form.Label>
        <Form.Control size="sm" type="text" value={qualifyForm.title || ''} onChange={e => setQualifyForm(p => ({ ...p, title: e.target.value }))} />
      </div>
      <div className="col-6">
        <Form.Label className="small fw-semibold mb-1">Client Name</Form.Label>
        <Form.Control size="sm" type="text" value={qualifyForm.clientName || ''} onChange={e => setQualifyForm(p => ({ ...p, clientName: e.target.value }))} />
      </div>
      <div className="col-6">
        <Form.Label className="small fw-semibold mb-1">Custom ID</Form.Label>
        <Form.Control size="sm" type="text" value={qualifyForm.customId || ''} onChange={e => setQualifyForm(p => ({ ...p, customId: e.target.value }))} />
      </div>
      <div className="col-6">
        <Form.Label className="small fw-semibold mb-1">Project Type</Form.Label>
        <Form.Select size="sm" value={qualifyForm.type || 'Product'} onChange={e => setQualifyForm(p => ({ ...p, type: e.target.value }))}>
          <option value="Product">{localStorage.getItem('app_product_label') || 'Products'}</option>
          <option value="Service">{localStorage.getItem('app_service_label') || 'Services'}</option>
        </Form.Select>
      </div>
      <div className="col-6">
        <Form.Label className="small fw-semibold mb-1">Deal Value</Form.Label>
        <Form.Control size="sm" type="number" value={qualifyForm.dealValue || ''} onChange={e => setQualifyForm(p => ({ ...p, dealValue: e.target.value }))} />
      </div>
      <div className="col-6">
        <Form.Label className="small fw-semibold mb-1">Expected Close Date</Form.Label>
        <Form.Control size="sm" type="date" value={qualifyForm.expectedCloseDate || ''} onChange={e => setQualifyForm(p => ({ ...p, expectedCloseDate: e.target.value }))} />
      </div>
    </div>
  </Modal.Body>
  <Modal.Footer className="border-0 pt-0">
    <Button variant="secondary" size="sm" onClick={() => setShowQualifyModal(false)}>Cancel</Button>
    <Button variant="success" size="sm" onClick={handleConfirmQualify} className="d-flex align-items-center gap-1">
      <ArrowUpRight size={14} /> Create Sales Deal
    </Button>
  </Modal.Footer>
</Modal>
```

- [ ] Make this change

### Step 4.5 — Commit

```bash
git add src/pages/Leads/Leads.jsx
git commit -m "feat: replace Lead→Sales Swal with full qualify modal; remove Add Lead button"
```

- [ ] Run commit

---

## Self-Review Checklist

- [x] **Spec coverage:** All 4 spec requirements covered — Company→Contact modal (Task 2), Contact→Lead modal (Task 3), Lead→Sales modal (Task 4), Tax fields moved (Task 1)
- [x] **Add Contact button removed** — Task 3.4
- [x] **Add Lead button removed** — Task 4.3
- [x] **Lead qualify button already conditionally disabled** — existing code at lines 227 and 258 checks `stage !== 'Qualified'`, no change needed
- [x] **companyId linked** — Task 2.2 `handleSaveConvertContact` passes `companyId: convertingCompany.id`
- [x] **contactId linked** — Task 3.3 `handleConfirmConvert` passes `contactId: convertingContact.id`
- [x] **leadId linked** — Task 4.2 `handleConfirmQualify` passes `leadId: lead.id`
- [x] **No placeholders** — all code blocks are complete
- [x] **Type consistency** — `convertLeadForm` used consistently across Steps 3.1–3.5; `qualifyForm` used consistently across Steps 4.1–4.4
