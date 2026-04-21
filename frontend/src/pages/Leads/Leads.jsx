import { useState, useEffect } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { User, Building, Target, Edit, Trash2, ArrowUpRight, List, Columns } from 'lucide-react';
import Swal from 'sweetalert2';
import { leadService } from '../../services/leadService';
import { projectService } from '../../services/api';
import { useToast } from '../../components/Toast/ToastContext';
import PageToolbar from '../../components/PageToolbar/PageToolbar';
import Pagination from '../../components/Pagination/Pagination';
import StatsGrid from '../../components/StatsGrid/StatsGrid';
import AuditPanel from '../../components/AuditPanel/AuditPanel';
import './Leads.css';

const KANBAN_STAGES = ['New', 'Contacted', 'Qualified', 'Disqualified'];
const SOURCES = ['Inbound', 'Referral', 'Campaign', 'Cold'];
const SCORES = ['Hot', 'Warm', 'Cold'];

const STAGE_STORAGE_KEYS = { Product: 'sales_stages_product', Service: 'sales_stages_service' };
const DEFAULT_SALES_STAGES = [
  { id: 0, label: 'Demo', color: 'cyan', ageing: 7 },
  { id: 1, label: 'Proposal', color: 'gray', ageing: 15 },
  { id: 2, label: 'Negotiation', color: 'gray', ageing: 30 },
  { id: 3, label: 'Approval', color: 'gray', ageing: 15 },
  { id: 4, label: 'Won', color: 'green', ageing: 30 },
  { id: 5, label: 'Closed', color: 'green', ageing: 90 },
  { id: 6, label: 'Lost', color: 'orange', ageing: 60 },
];

const EMPTY_FORM = {
  contactId: '', contactName: '', company: '',
  source: 'Inbound', score: 'Warm',
  assignedTo: '', notes: '', expectedValue: '', expectedCloseDate: '',
  stage: 'New'
};

export default function Leads() {
  const toast = useToast();
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showQualifyModal, setShowQualifyModal] = useState(false);
  const [qualifyingLead, setQualifyingLead] = useState(null);
  const [qualifyForm, setQualifyForm] = useState({});
  const [panelFilterValues, setPanelFilterValues] = useState({});
  const [filterBy, setFilterBy] = useState('all');
  const [filterValue, setFilterValue] = useState('');
  const [sortBy, setSortBy] = useState('contactName');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => { loadLeads(); }, [page, pageSize]);

  const loadLeads = async () => {
    try {
      setIsLoading(true);
      const data = await leadService.getLeads(page, pageSize);
      setLeads(data?.items || []);
      setTotalPages(data?.totalPages || 1);
    } catch (e) {
      console.error('Error loading leads:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const openEdit = (l) => { setEditing(l); setForm({ ...EMPTY_FORM, ...l }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.contactName.trim()) { toast.error('Contact name is required'); return; }
    const payload = {
      ...form,
      contactId: form.contactId !== '' ? parseInt(form.contactId) : null,
      expectedValue: form.expectedValue !== '' ? parseFloat(form.expectedValue) : null,
      expectedCloseDate: form.expectedCloseDate || null,
    };
    try {
      if (editing) {
        await leadService.updateLead(editing.id, payload);
        toast.success('Lead updated');
      } else {
        await leadService.createLead(payload);
        toast.success('Lead created');
      }
      setShowModal(false);
      loadLeads();
    } catch (e) {
      toast.error(e.message || 'Failed to save lead');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete lead?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await leadService.deleteLead(id);
      toast.success('Lead deleted');
      loadLeads();
    } catch (e) {
      toast.error('Failed to delete lead');
    }
  };

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
    if (!qualifyForm.title?.trim()) {
      toast.error('Deal title is required');
      return;
    }
    const lead = qualifyingLead;

    let initialStages = DEFAULT_SALES_STAGES;
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

  const getFilterOptions = (col) => {
    const vals = [...new Set(leads.map(l => l[col]).filter(Boolean))].sort();
    return vals;
  };

  const filtered = leads.filter(l => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !searchQuery || l.contactName?.toLowerCase().includes(q) || l.company?.toLowerCase().includes(q);
    const matchLegacy = filterBy === 'all' || !filterValue || String(l[filterBy] ?? '') === filterValue;
    const matchStage = !panelFilterValues.stage || l.stage === panelFilterValues.stage;
    const matchScore = !panelFilterValues.score || l.score === panelFilterValues.score;
    const matchSource = !panelFilterValues.source || l.source === panelFilterValues.source;
    return matchSearch && matchLegacy && matchStage && matchScore && matchSource;
  }).sort((a, b) => {
    const av = String(a[sortBy] ?? '').toLowerCase();
    const bv = String(b[sortBy] ?? '').toLowerCase();
    return sortOrder === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

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
        onSearchChange={(q) => { setSearchQuery(q); setPage(1); }}
        filters={[
          { id: 'stage', name: 'Stage' },
          { id: 'score', name: 'Score' },
          { id: 'source', name: 'Source' },
        ]}
        filterBy={filterBy}
        filterValue={filterValue}
        onFilterChange={(fb, fv) => { setFilterBy(fb); setFilterValue(fv); setPage(1); }}
        getFilterOptions={getFilterOptions}
        sortOptions={[
          { id: 'contactName', name: 'Name' },
          { id: 'company', name: 'Company' },
          { id: 'score', name: 'Score' },
          { id: 'stage', name: 'Stage' },
        ]}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(sb, so) => { setSortBy(sb); setSortOrder(so); }}
        panelFilters={[
          { id: 'stage', label: 'Stage', type: 'select', options: KANBAN_STAGES },
          { id: 'score', label: 'Score', type: 'select', options: SCORES },
          { id: 'source', label: 'Source', type: 'select', options: SOURCES },
        ]}
        panelFilterValues={panelFilterValues}
        onPanelFilterChange={(id, val) => setPanelFilterValues(prev => ({ ...prev, [id]: val }))}
        onClearPanelFilters={() => setPanelFilterValues({})}
        viewModes={[
          { id: 'list', icon: <List size={15} />, label: 'List' },
          { id: 'kanban', icon: <Columns size={15} />, label: 'Kanban' },
        ]}
        activeView={viewMode}
        onViewChange={setViewMode}
        actions={[]}
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
                    <div className="d-flex gap-1 align-items-center">
                      <button className="action-icon-btn text-info" title="Edit" onClick={() => openEdit(l)}><Edit size={15} /></button>
                      {l.stage !== 'Qualified' && l.stage !== 'Disqualified' && (
                        <button className="action-icon-btn text-success" title="Qualify → Sales" onClick={() => handleQualify(l)}>
                          <ArrowUpRight size={15} />
                        </button>
                      )}
                      <button className="action-icon-btn text-danger" title="Delete" onClick={() => handleDelete(l.id)}><Trash2 size={15} /></button>
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
                    <div className="d-flex gap-1 mt-2 align-items-center">
                      <button className="action-icon-btn text-info" style={{ opacity: 1 }} title="Edit" onClick={() => openEdit(l)}><Edit size={14} /></button>
                      {stage !== 'Qualified' && stage !== 'Disqualified' && (
                        <button className="action-icon-btn text-success" style={{ opacity: 1 }} title="Qualify → Sales" onClick={() => handleQualify(l)}><ArrowUpRight size={14} /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
      />

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h6 fw-bold">Edit Lead</Modal.Title>
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
          {editing?.id && (
            <div style={{ marginTop: 16, borderTop: '1px solid #E1E8F4', paddingTop: 12 }}>
              <div className="small fw-bold mb-2" style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Change History</div>
              <AuditPanel entityName="Lead" entityId={editing.id} />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleSave}>Update Lead</Button>
        </Modal.Footer>
      </Modal>

      {/* QUALIFY LEAD → SALES MODAL */}
      <Modal show={showQualifyModal} onHide={() => { setShowQualifyModal(false); setQualifyingLead(null); }} centered size="lg">
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
          <Button variant="secondary" size="sm" onClick={() => { setShowQualifyModal(false); setQualifyingLead(null); }}>Cancel</Button>
          <Button variant="success" size="sm" onClick={handleConfirmQualify} className="d-flex align-items-center gap-1">
            <ArrowUpRight size={14} /> Create Sales Deal
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
