# CRM Flow Redesign — Design Spec
**Date:** 2026-04-10  
**Type:** Full-stack Business OS — CRM Flow Audit & Improvement  
**Approach:** Option B — Proper Pipeline with Linked Entities

---

## 1. Problem Statement

The existing CRM has solid individual modules but the end-to-end flow is broken in three places:

1. **Company** and **Leads** modules are placeholders — the pipeline has no entry point
2. **Sales "Won"** has no automatic handoff to Finance or Invoice
3. **Invoice** has no multi-party breakdown (Devs, Investors, Clients, Company margin)
4. **Calendar**, **Reports**, and **Activity Log** are built but not surfaced in navigation

---

## 2. Corrected End-to-End Flow

```
Company
  └── Contact (belongs to Company)
        └── Lead (Contact + interest/source/score)
              └── Sales Pipeline
                    [Demo → Proposal → Negotiation → Approval → Won / Lost]
                          │
                         Won
                          │
                    Invoice (auto-created from Won deal)
                    ┌─────────────────────────────────┐
                    │  Client Bill   (what client pays)│
                    │  Dev Cost      (team expenses)   │
                    │  Investor Share (if applicable)  │
                    │  Company Margin (profit)         │
                    └─────────────────────────────────┘
                          │
                    Finance (P&L — income auto-created on Invoice Paid)
```

---

## 3. Module Designs

### 3.1 Company *(new — replaces placeholder)*
- **Fields:** Name, Industry, Size, Website, Address, Country, GSTIN/Tax ID, Tags
- **Relations:** One Company → many Contacts, many Deals
- **Display:** Contact list tab, associated deals count, total revenue from company
- **Service:** New `companyService.js` backed by existing `apiClient.js`

### 3.2 Contact *(updated)*
- **Change:** Add `companyId` lookup field linking to Company module
- **Status options:** Lead → Prospect → Active → Inactive → Customer *(add "Prospect")*
- **Change:** Replace "Convert to Sales" button with **"Convert to Lead"** → creates a Lead record linked to this Contact

### 3.3 Leads *(new — replaces placeholder)*
- **Fields:** Contact (linked), Company (inherited), Source (Inbound / Referral / Campaign / Cold), Score (Hot / Warm / Cold), Assigned To, Notes, Expected Value, Expected Close Date
- **Views:** List view + Kanban (New → Contacted → Qualified → Disqualified)
- **Action:** "Qualify Lead" button → creates a Sales deal and links Lead ID to the deal
- **Service:** New `leadService.js`

### 3.4 Sales *(updated)*
- **Change:** Each card displays linked Lead and linked Contact/Company
- **Change:** On stage change to **Won** → show dialog: *"Create Invoice for this deal?"*
  - If confirmed → auto-create Invoice record with deal name, client, and value pre-filled
  - Invoice is linked to the Sales deal via `dealId`

### 3.5 Invoice *(enhanced)*
- **Linked to:** Sales deal (optional — can also be standalone)
- **4-party breakdown tabs:**
  | Tab | Purpose |
  |-----|---------|
  | Client | What the client is billed — line items: services, milestones |
  | Devs | Team cost allocation — who worked, at what rate |
  | Investors | Payout / equity share if applicable |
  | Company | Margin = Client Bill − Dev Cost − Investor Share |
- **Status flow:** Draft → Sent → Paid → Overdue
- **On Paid:** Auto-create a Finance income record tagged `source: invoice` with back-link to Invoice ID

### 3.6 Finance *(updated)*
- **Change:** Income records from invoices carry `source: invoice` and `invoiceId` for traceability
- **Change:** P&L dashboard groups revenue by Company/Client
- No structural changes to expense tracking

---

## 4. Navigation Structure

```
Dashboard

CRM
  ├── Company       (new)
  ├── Contacts      (existing)
  ├── Leads         (new)
  └── Sales         (existing)

Execution
  ├── Projects      (existing)
  ├── Timesheet     (existing)
  └── To-Do         (existing)

Operations
  ├── Finance       (existing)
  ├── Invoice       (existing — enhanced)
  ├── Documents     (existing)
  └── Calendar      (existing — surface from hidden)

People
  └── HR            (placeholder — defer)

Reports             (existing — surface from hidden, promote to top-level)

AI
  └── Agent AI      (existing)

Settings / Admin
  └── Activity Log  (existing — surface inside Settings or Reports)
```

---

## 5. Data Relationships

```
Company (1) ──── (N) Contact
Contact (1) ──── (N) Lead
Lead    (1) ──── (1) Sales Deal
Sales Deal (1) ── (1) Invoice
Invoice (1) ───── (1) Finance Income Record  [on Paid]
```

---

## 6. Changes to Existing Files

| File | Change |
|------|--------|
| `src/layouts/MainLayout.jsx` | Add Company, Leads, Calendar, Reports nav entries |
| `src/App.jsx` | Add routes for `/company`, `/leads`, `/calendar`, `/reports` (remove placeholders) |
| `src/pages/Contact/Contacts/Contacts.jsx` | Add companyId field, replace "Convert to Sales" with "Convert to Lead" |
| `src/pages/Sales/Sales.jsx` | Show linked Lead/Contact/Company on cards; add Won → Invoice dialog |
| `src/pages/Invoice/ProjectTrackerComplete.jsx` | Add 4-party tabs (Client, Devs, Investors, Company); add `dealId` link; auto-create Finance record on Paid |
| `src/pages/Finance/Finance.jsx` | Tag income with `source: invoice` + `invoiceId`; group P&L by client |

### New Files
| File | Purpose |
|------|---------|
| `src/pages/Company/Company.jsx` | Company list/detail page |
| `src/pages/Leads/Leads.jsx` | Leads list + kanban page |
| `src/services/companyService.js` | Company CRUD via apiClient |
| `src/services/leadService.js` | Lead CRUD via apiClient |

---

## 7. Out of Scope (This Spec)
- HR module build-out
- Legal module
- Links module
- Email sending from Invoice (template exists, wiring deferred)
- AI Agents enhancements
