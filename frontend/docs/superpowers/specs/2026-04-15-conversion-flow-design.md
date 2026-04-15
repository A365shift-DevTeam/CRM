# CRM Conversion Pipeline — Design Spec
**Date:** 2026-04-15  
**Author:** Newman  
**Status:** Approved

---

## Overview

Replace the existing simple Swal confirmation dialogs with full detail modals at each conversion step in the CRM pipeline. The pipeline is conversion-only — records flow Company → Contact → Lead → Sales. No standalone "Add" buttons for Contact or Lead.

---

## Pipeline Rules

| Step | Source | Target | Cardinality | Source after convert |
|------|--------|--------|-------------|----------------------|
| 1 | Company | Contact | 1 Company → Many Contacts | Stays active |
| 2 | Contact | Lead | 1 Contact → Many Leads | Stays active |
| 3 | Lead | Sales Deal | 1 Lead → 1 Deal only | Marked Qualified, button disabled |

---

## Changes by File

### 1. `Company.jsx` — Company → Contact Conversion Modal

**What changes:**  
Replace `handleConvertToContact` Swal confirm with a full Bootstrap Modal (same style as existing Add/Edit modal).

**Pre-fill mapping from Company:**

| Contact Field | Source |
|---------------|--------|
| name | `company.name` |
| company | `company.name` (dropdown) |
| email | blank |
| phone | blank |
| jobTitle | blank (dropdown) |
| status | `'Active'` |
| location | `company.country` |
| clientAddress | `company.address` |
| clientCountry | `company.country` |

**On save:**  
`contactService.createContact({ ...form, companyId: company.id })`

**No changes to card layout or existing Add/Edit modal.**

---

### 2. `Contacts.jsx` — Contact → Lead Conversion Modal

**What changes:**  
Upgrade the existing 3-field convert modal to a full lead form modal. Remove the "Add Contact" / standalone create button — contacts are created only via Company conversion.

**Pre-fill mapping from Contact:**

| Lead Field | Source |
|------------|--------|
| contactName | `contact.name` |
| contactId | `contact.id` |
| company | `contact.company` |
| source | `'Inbound'` |
| score | `'Warm'` |
| stage | `'New'` |
| type (Project Type) | `'Product'` |
| assignedTo | blank |
| expectedValue | blank |
| expectedCloseDate | blank |
| notes | blank |

**On save:**  
`leadService.createLead({ ...form, contactId: contact.id })`

**No changes to card/list/kanban views.**

---

### 3. `Leads.jsx` — Lead → Sales Qualification Modal

**What changes:**  
Replace `handleQualify` Swal confirm with a full Bootstrap Modal. Remove the "Add Lead" standalone button — leads are created only via Contact conversion.

**Pre-fill mapping from Lead:**

| Deal Field | Source |
|------------|--------|
| title | `lead.contactName + ' - ' + lead.company` |
| clientName | `lead.contactName` |
| type (Project Type) | `lead.type \|\| 'Product'` |
| customId | auto-generated (date+brand+client+year) |
| dealValue | `lead.expectedValue` |
| expectedCloseDate | `lead.expectedCloseDate` |
| stages | from localStorage defaults (display only) |

**On save:**  
`projectService.create({ ...form, leadId: lead.id })`  
then `leadService.updateLead(lead.id, { ...lead, stage: 'Qualified' })`

**After qualifying:** disable the qualify/convert button on that lead card (check `lead.stage === 'Qualified'`).

---

### 4. `ContactModal.jsx` → `Company.jsx` — Tax & Financial Information

**What changes:**  
Move Tax & Financial fields out of the Contact add/edit modal and into the Company add/edit form.

**Fields to move:**

| Field | Current location | New location |
|-------|-----------------|--------------|
| gstin | ContactModal | Company.jsx modal |
| pan | ContactModal | Company.jsx modal |
| cin | ContactModal | Company.jsx modal |
| msmeStatus | ContactModal | Company.jsx modal |
| tdsSection | ContactModal | Company.jsx modal |
| tdsRate | ContactModal | Company.jsx modal |
| internationalTaxId | ContactModal | Company.jsx modal |

These fields render conditionally (India tax fields show when country is India, international shows otherwise) — preserve that logic in Company form.

**Remove** the `Tax & Financial Information` and `Tax Information` sections from ContactModal entirely.

---

## What Does NOT Change

- Card layouts, list views, kanban views — untouched
- CSS / styling — untouched  
- Existing Add/Edit modals for Company, Lead, Sales — untouched
- All other page behavior — untouched

---

## Implementation Approach

**Approach A — Inline modals per page**  
Each page owns its own conversion modal. No shared component introduced. Existing modal patterns copy-pasted and adapted. Lowest risk, minimal refactoring.

---

## Success Criteria

- [ ] Company convert button opens full Contact form modal, pre-filled, saves with `companyId`
- [ ] Contact convert button opens full Lead form modal, pre-filled, saves with `contactId`
- [ ] Lead qualify button opens full Sales deal modal, pre-filled, saves with `leadId`, marks lead Qualified
- [ ] Lead qualify button is disabled when `lead.stage === 'Qualified'`
- [ ] "Add Contact" button removed from Contacts page
- [ ] "Add Lead" button removed from Leads page
- [ ] Tax & Financial fields moved to Company form, removed from Contact form
