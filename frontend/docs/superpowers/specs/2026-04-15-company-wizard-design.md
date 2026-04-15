# Company Creation Wizard — Design Spec

**Date:** 2026-04-15  
**Goal:** Replace the single-step "Add Company" modal with a 3-step wizard that creates Company → Contact → Lead in one flow, reducing manual data entry across three separate pages.

---

## Architecture

**Approach A — inline modal, step state.**  
Single `<Modal>` added to `Company.jsx`. The existing add/edit modal is retained for **editing** companies. The wizard fires only for **new** company creation.

### New State (3 variables)

```js
const [showWizard, setShowWizard]   = useState(false)
const [wizardStep, setWizardStep]   = useState(1)      // 1 | 2 | 3
const [wizardForm, setWizardForm]   = useState({})     // flat, all steps
```

`wizardForm` is a single flat object with prefixed keys (`company_*`, `contact_*`, `lead_*`) to prevent collisions. Resets to `{}` on open.

### Trigger

The existing "Add Company" `PageToolbar` button is rewired to call `openWizard()` instead of the old `setShowModal(true)`. No new button is added.

---

## UI Layout

### Step Indicator

Three labeled nodes at the top of `<Modal.Body>`, connected by a line:

```
● Company ——— ○ Contact ——— ○ Lead
```

- Filled circle + bold label = active step  
- Filled circle + muted label = completed step  
- Empty circle + muted label = upcoming step  
- Implemented with inline CSS — no extra library

---

### Step 1 — Company Details

| Field | Type | Col |
|-------|------|-----|
| Company Name * | text | 12 |
| Website | text | 6 |
| Country | text | 6 |
| Address | text | 12 |
| Industry | select (INDUSTRIES) | 6 |
| Size | select (SIZES) | 6 |
| Tags | text | 12 |
| Tax & Financial (India) | GSTIN, PAN, CIN, TDS Section, TDS Rate, MSME Status | conditional on country = India or empty |
| Intl Tax ID | text | conditional on country ≠ India |

**Footer:** `Cancel` | `Next →` (primary)  
**Validation:** `company_name` must not be empty.

---

### Step 2 — Contact Details

Pre-fills `contact_name` from `company_name`, `contact_country` from `company_country` on advancing from Step 1.

| Field | Type | Col |
|-------|------|-----|
| Name * | text | 12 |
| Email | email | 6 |
| Phone | text | 6 |
| Job Title | select | 6 |
| Status | select (Active / Inactive / Lead / Customer) | 6 |
| Location | text | 6 |
| Country | text | 6 |
| Address | text | 12 |

**Footer:** `Cancel` | `← Back` | `Skip` (secondary) | `Next →` (primary)  
**Validation (Next only):** `contact_name` must not be empty.  
**Skip:** saves company only → closes wizard.

---

### Step 3 — Lead Details

Pre-fills `lead_contactName` from `contact_name`, `lead_company` from `company_name` on advancing from Step 2.

| Field | Type | Col |
|-------|------|-----|
| Contact Name | text (editable, pre-filled) | 6 |
| Company | text (editable, pre-filled) | 6 |
| Source | select (Inbound / Referral / Campaign / Cold) | 6 |
| Score | select (Hot / Warm / Cold) | 6 |
| Stage | select (New / Contacted / Qualified / Disqualified) | 6 |
| Type | select (Product / Service) | 6 |
| Expected Value | number | 6 |
| Expected Close Date | date | 6 |
| Assigned To | text | 12 |
| Notes | textarea (2 rows) | 12 |

**Footer:** `Cancel` | `← Back` | `Save All` (success)  
**Validation:** none required beyond Step 1 & 2 gates.

---

## Data Flow

### Pre-fill on step advance

```
Step 1 → Step 2:  contact_name  ← company_name
                  contact_country ← company_country

Step 2 → Step 3:  lead_contactName ← contact_name
                  lead_company     ← company_name
```

### Save — Skip path (Step 2 Skip button)

```
1. createCompany(company_* fields)
2. toast.success("Company created")
3. loadCompanies() / closeWizard()
```

### Save — Full path (Step 3 Save All button)

```
1. createCompany(company_* fields)        → companyId
2. createContact({ contact_* fields, companyId })  → contactId
3. createLead({ lead_* fields, contactId,
                expectedCloseDate: ToUtc(date) })
4. toast.success("Company, Contact & Lead created")
5. loadCompanies() / closeWizard()
```

If any step throws, `toast.error` is shown and the wizard stays open. No silent partial-save.

### Wizard close / cancel

Any cancel or × resets: `setWizardStep(1)` + `setWizardForm({})`.

Back button never clears data — `wizardForm` persists across step changes.

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| `company_name` empty on Next (Step 1) | `toast.error`, stay on Step 1 |
| `contact_name` empty on Next (Step 2) | `toast.error`, stay on Step 2 |
| API error on createCompany | `toast.error`, stay on active step |
| API error on createContact | `toast.error`, note: company already created — wizard stays open, user can retry |
| API error on createLead | `toast.error`, note: company + contact already created — wizard stays open |

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/Company/Company.jsx` | Add 3 state vars; add `openWizard()` / `closeWizard()` handlers; add `handleWizardNext()` / `handleWizardBack()` / `handleWizardSkip()` / `handleWizardSave()`; add wizard Modal JSX; rewire Add button |

No new files. No shared components. Existing add/edit modal untouched.
