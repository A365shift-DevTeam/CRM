import React, { useState, useEffect } from 'react';
import { projectService } from '../../services/projectService';
import Pagination from '../../components/Pagination/Pagination';
import { useToast } from '../../components/Toast/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { FaPlus, FaTrash, FaPenToSquare } from 'react-icons/fa6';
import {
  FileText, AlertCircle, CheckCircle2, Layers,
  Search, X, LayoutGrid, GanttChart as GanttIcon, CalendarDays,
  Plus, Minus, Settings2,
  Tag, User, Briefcase, History
} from 'lucide-react';
import { Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuditPanel from '../../components/AuditPanel/AuditPanel';

const DEFAULT_STAGE_COLORS = ['#4361EE','#8B5CF6','#06B6D4','#10B981','#F59E0B','#F97316','#F43F5E'];
const STAGE_COLORS = ['#06B6D4','#F59E0B','#F97316','#8B5CF6','#10B981','#64748B','#F43F5E'];
const STAGE_LABELS = ['Demo','Proposal','Negotiation','Approval','Won','Closed','Lost'];

const TYPE_META = {
  Standard: { color: '#4361EE', bg: 'rgba(67,97,238,0.09)' },
  Product:  { color: '#10B981', bg: 'rgba(16,185,129,0.09)' },
  Service:  { color: '#8B5CF6', bg: 'rgba(139,92,246,0.09)' },
  Internal: { color: '#F59E0B', bg: 'rgba(245,158,11,0.09)' },
};

function hashColor(str) {
  const palette = ['#4361EE','#10B981','#F59E0B','#8B5CF6','#06B6D4','#F43F5E','#F97316'];
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('default', { day: 'numeric', month: 'short' });
}

function toInputDate(d) {
  if (!d) return '';
  return typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0];
}

// ─────────────────────────────────────────────
// PROJECT CARD
// ─────────────────────────────────────────────
function ProjectCard({ project, onEdit, onDelete, onInvoice, index }) {
  const navigate = useNavigate();
  const stages   = Array.isArray(project.stages) && project.stages.length ? project.stages : STAGE_LABELS.map((l, i) => ({ id: i, label: l }));
  const active   = project.activeStage ?? 0;
  const stageLabel = stages[active]?.label || `Stage ${active}`;
  const stageColor = STAGE_COLORS[active % STAGE_COLORS.length];
  const progress   = Math.round((active / Math.max(stages.length - 1, 1)) * 100);
  const isDelayed  = (project.delay || 0) > 0;
  const typeMeta   = TYPE_META[project.type] || TYPE_META.Standard;
  const clientColor = hashColor(project.clientName);
  const initials   = (project.clientName || 'NA').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <motion.div
      className="proj-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
    >
      <div className="proj-card-strip" style={{ background: stageColor }} />
      <div className="proj-card-header">
        <div className="proj-client-avatar" style={{ background: `${clientColor}18`, color: clientColor }}>{initials}</div>
        <div className="proj-card-meta">
          <div className="proj-card-title">{project.title || 'Untitled Project'}</div>
          <div className="proj-card-client">{project.clientName || 'No Client'}</div>
        </div>
        {isDelayed && <div className="proj-delay-badge"><AlertCircle size={11} />{project.delay}d delay</div>}
        {active === 4 && !isDelayed && <div className="proj-won-badge"><CheckCircle2 size={11} />Won</div>}
      </div>
      <div className="proj-card-stage-row">
        <span className="proj-stage-pill" style={{ color: stageColor, background: `${stageColor}12`, border: `1px solid ${stageColor}24` }}>{stageLabel}</span>
        <span className="proj-progress-pct" style={{ color: stageColor }}>{progress}%</span>
      </div>
      <div className="proj-progress-track">
        <motion.div className="proj-progress-fill" style={{ background: stageColor }}
          initial={{ width: 0 }} animate={{ width: `${progress}%` }}
          transition={{ duration: 0.7, delay: index * 0.05 + 0.2, ease: 'easeOut' }} />
      </div>
      <div className="proj-card-info-row">
        <span className="proj-type-tag" style={{ color: typeMeta.color, background: typeMeta.bg }}>
          <Layers size={10} />{project.type || 'Standard'}
        </span>
        {project.customId && <span className="proj-id-tag">#{project.customId}</span>}
        {project.startDate && (
          <span className="proj-date-tag">
            <CalendarDays size={10} />
            {fmtDate(project.startDate)}{project.endDate && ` → ${fmtDate(project.endDate)}`}
          </span>
        )}
      </div>
      <div className="proj-card-actions">
        <button className="proj-action-btn" onClick={() => onEdit(project)}><FaPenToSquare size={13} />Edit</button>
        <button className="proj-action-btn invoice" onClick={() => onInvoice(project.id)}><FileText size={13} />Invoice</button>
        <button className="proj-action-btn danger" onClick={() => onDelete(project.id)}><FaTrash size={12} /></button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// GANTT VIEW
// ─────────────────────────────────────────────
function GanttView({ projects, themeColor, onEdit, onProjectUpdate }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [expandedIds, setExpandedIds] = React.useState(new Set());
  const [editingStage, setEditingStage] = React.useState(null); // { projectId, stageIndex }
  const [stageForm, setStageForm] = React.useState({ label: '', color: '#4361EE', startDate: '', endDate: '' });

  const expandAll   = () => setExpandedIds(new Set(projects.map(p => p.id)));
  const collapseAll = () => setExpandedIds(new Set());
  const toggleExpand = id => setExpandedIds(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  // ── Timeline bounds ──────────────────────────
  const collectDates = () => {
    const dates = [];
    projects.forEach(p => {
      if (p.startDate) dates.push(new Date(p.startDate));
      if (p.endDate)   dates.push(new Date(p.endDate));
      if (Array.isArray(p.stages)) p.stages.forEach(s => {
        if (s.startDate) dates.push(new Date(s.startDate));
        if (s.endDate)   dates.push(new Date(s.endDate));
      });
    });
    return dates;
  };
  const allDates = collectDates();
  const hasAnyDate = allDates.length > 0;
  const minRaw  = hasAnyDate ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const maxRaw  = hasAnyDate ? new Date(Math.max(...allDates.map(d => d.getTime()), today.getTime())) : new Date(today.getFullYear(), today.getMonth() + 5, 0);
  const minDate = new Date(minRaw); minDate.setDate(1); minDate.setDate(minDate.getDate() - 3);
  const maxDate = new Date(maxRaw); maxDate.setDate(maxDate.getDate() + 15);
  const span = maxDate - minDate;

  const pct = d => Math.max(0, Math.min(100, ((new Date(d) - minDate) / span) * 100));
  const widthPct = (start, end) => {
    const s = new Date(start), e = end ? new Date(end) : new Date(+new Date(start) + 30 * 86400000);
    return Math.max(1.5, ((Math.min(e, maxDate) - Math.max(s, minDate)) / span) * 100);
  };
  const todayPct = pct(today);

  // Month column headers
  const months = [];
  const mc = new Date(minDate); mc.setDate(1);
  while (mc <= maxDate) {
    months.push({ label: mc.toLocaleString('default', { month: 'short' }), year: mc.getFullYear(), pos: pct(mc) });
    mc.setMonth(mc.getMonth() + 1);
  }

  // ── Stage editor helpers ──────────────────────
  const openStageEdit = (project, si) => {
    const stages = getStages(project);
    const s = stages[si];
    setStageForm({
      label:     s.label     || '',
      color:     s.color     || DEFAULT_STAGE_COLORS[si % DEFAULT_STAGE_COLORS.length],
      startDate: toInputDate(s.startDate),
      endDate:   toInputDate(s.endDate),
    });
    setEditingStage({ projectId: project.id, stageIndex: si });
  };

  const saveStageEdit = async () => {
    if (!editingStage) return;
    const project = projects.find(p => p.id === editingStage.projectId);
    if (!project) return;
    const stages = getStages(project).map((s, i) =>
      i === editingStage.stageIndex ? { ...s, ...stageForm } : s
    );
    await onProjectUpdate(project, { stages });
    setEditingStage(null);
  };

  const getStages = project =>
    Array.isArray(project.stages) && project.stages.length
      ? project.stages
      : STAGE_LABELS.map((label, i) => ({ id: i, label, color: DEFAULT_STAGE_COLORS[i] }));

  // ── Bar label (e.g. "Jan–Aug") ────────────────
  const barLabel = (start, end) => {
    const fmt = d => new Date(d).toLocaleString('default', { month: 'short' });
    if (!start) return '';
    return end ? `${fmt(start)}–${fmt(end)}` : fmt(start);
  };

  const projectColor = '#4361EE';

  return (
    <div className="gantt-wrap">
      {/* ── Legend + controls ── */}
      <div className="gantt-top-bar">
        <div className="gantt-legend-row">
          <span className="gl-item"><span className="gl-dot" style={{ background: projectColor }} />Project</span>
          <span className="gl-item"><span className="gl-dot" style={{ background: '#8B5CF6' }} />Stage</span>
          <span className="gl-item"><span className="gl-dot" style={{ background: '#06B6D4', opacity: 0.6 }} />Sub-stage</span>
        </div>
        <div className="gantt-ctrl-row">
          <button className="gantt-ctrl-btn" onClick={expandAll}>Expand All</button>
          <button className="gantt-ctrl-btn" onClick={collapseAll}>Collapse All</button>
        </div>
      </div>

      {/* ── Header row ── */}
      <div className="gantt-header">
        <div className="gantt-label-col gantt-header-label">Project / Stage</div>
        <div className="gantt-track-col gantt-month-header">
          {months.map((m, i) => (
            <div key={i} className="gantt-month-cell" style={{ left: `${m.pos}%` }}>
              <div className="gantt-month-rule" />
              <span className="gantt-month-name">{m.label}</span>
            </div>
          ))}
          {todayPct >= 0 && todayPct <= 100 && (
            <div className="gantt-today-line" style={{ left: `${todayPct}%` }}>
              <span className="gantt-today-tag">Today</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="gantt-body">
        {projects.map((project, idx) => {
          const stages      = getStages(project);
          const active      = project.activeStage ?? 0;
          const hasDate     = !!project.startDate;
          const isExpanded  = expandedIds.has(project.id);
          const clientColor = hashColor(project.clientName);
          const initials    = (project.clientName || 'NA').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

          return (
            <React.Fragment key={project.id}>
              {/* ── Project row ── */}
              <motion.div
                className="gantt-row gantt-proj-row"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
              >
                <div className="gantt-label-col gantt-proj-label">
                  <button className="gantt-toggle-btn" onClick={() => toggleExpand(project.id)}>
                    {isExpanded ? <Minus size={11} /> : <Plus size={11} />}
                  </button>
                  <div className="gantt-avatar" style={{ background: `${clientColor}18`, color: clientColor }}>{initials}</div>
                  <div className="gantt-proj-info">
                    <div className="gantt-proj-title">{project.title || 'Untitled'}</div>
                    <div className="gantt-proj-sub">{project.clientName || '—'} · {project.type || 'Standard'}</div>
                  </div>
                  <button className="gantt-edit-btn" onClick={() => onEdit(project)} title="Edit project">
                    <FaPenToSquare size={11} />
                  </button>
                </div>

                <div className="gantt-track-col gantt-track">
                  {months.map((m, i) => <div key={i} className="gantt-grid-col" style={{ left: `${m.pos}%` }} />)}
                  {todayPct >= 0 && todayPct <= 100 && <div className="gantt-row-today" style={{ left: `${todayPct}%` }} />}
                  {hasDate && (() => {
                    const l = pct(project.startDate);
                    const w = widthPct(project.startDate, project.endDate);
                    const lbl = barLabel(project.startDate, project.endDate);
                    return (
                      <div className="gantt-bar gantt-proj-bar" style={{ left: `${l}%`, width: `${w}%`, background: projectColor }}>
                        {w > 6 && <span className="gantt-bar-lbl">{lbl}</span>}
                      </div>
                    );
                  })()}
                  {!hasDate && <div className="gantt-no-date"><CalendarDays size={12} />No dates — click edit</div>}
                </div>
              </motion.div>

              {/* ── Stage rows ── */}
              {isExpanded && stages.map((stage, si) => {
                const sc       = stage.color || DEFAULT_STAGE_COLORS[si % DEFAULT_STAGE_COLORS.length];
                const isDone   = si < active;
                const isActive = si === active;
                const hasStageDates = !!stage.startDate;
                const isEditingThis = editingStage?.projectId === project.id && editingStage?.stageIndex === si;

                return (
                  <React.Fragment key={`${project.id}-s${si}`}>
                    <motion.div
                      className={`gantt-row gantt-stage-row${isActive ? ' is-active' : ''}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.18, delay: si * 0.025 }}
                    >
                      <div className="gantt-label-col gantt-stage-label-col">
                        <span className="gantt-s-indent" />
                        <span className={`gantt-s-dot ${isDone ? 'done' : isActive ? 'active-dot' : ''}`}
                          style={isDone || isActive ? { background: sc, boxShadow: isActive ? `0 0 0 3px ${sc}33` : 'none' } : {}} />
                        <span className="gantt-s-name" style={{ color: isActive ? sc : isDone ? '#334155' : '#94A3B8' }}>
                          {si + 1}. {stage.label}
                        </span>
                        {isDone && <CheckCircle2 size={11} style={{ color: '#10B981', flexShrink: 0 }} />}
                        {isActive && <span className="gantt-active-pill" style={{ color: sc, borderColor: `${sc}44`, background: `${sc}12` }}>Active</span>}
                        <button className="gantt-s-edit-btn" onClick={() => isEditingThis ? setEditingStage(null) : openStageEdit(project, si)} title="Edit stage">
                          <Settings2 size={11} />
                        </button>
                      </div>

                      <div className="gantt-track-col gantt-track">
                        {months.map((m, i) => <div key={i} className="gantt-grid-col" style={{ left: `${m.pos}%` }} />)}
                        {todayPct >= 0 && todayPct <= 100 && <div className="gantt-row-today" style={{ left: `${todayPct}%`, opacity: 0.35 }} />}
                        {hasStageDates && (() => {
                          const l = pct(stage.startDate);
                          const w = widthPct(stage.startDate, stage.endDate);
                          const lbl = barLabel(stage.startDate, stage.endDate);
                          return (
                            <div
                              className={`gantt-bar gantt-stage-bar${isDone ? ' done' : isActive ? ' active-bar' : ' pending'}`}
                              style={{ left: `${l}%`, width: `${w}%`, background: isDone ? sc : isActive ? sc : 'transparent', borderColor: sc }}
                            >
                              {w > 5 && <span className="gantt-bar-lbl" style={{ color: isDone || isActive ? '#fff' : sc }}>{lbl}</span>}
                            </div>
                          );
                        })()}
                        {!hasStageDates && (
                          <div className="gantt-no-date" style={{ paddingLeft: 16, fontSize: 11 }}>
                            <CalendarDays size={11} />Click ⚙ to set stage dates
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* ── Inline stage editor ── */}
                    {isEditingThis && (
                      <div className="gantt-stage-editor">
                        <div className="gse-field">
                          <label>Stage Name</label>
                          <input value={stageForm.label} onChange={e => setStageForm(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Development" />
                        </div>
                        <div className="gse-field">
                          <label>Color</label>
                          <div className="gse-color-row">
                            {DEFAULT_STAGE_COLORS.map(c => (
                              <button key={c} className={`gse-color-swatch${stageForm.color === c ? ' selected' : ''}`}
                                style={{ background: c }} onClick={() => setStageForm(p => ({ ...p, color: c }))} />
                            ))}
                          </div>
                        </div>
                        <div className="gse-field">
                          <label>Start Date</label>
                          <input type="date" value={stageForm.startDate} onChange={e => setStageForm(p => ({ ...p, startDate: e.target.value }))} />
                        </div>
                        <div className="gse-field">
                          <label>End Date</label>
                          <input type="date" value={stageForm.endDate} onChange={e => setStageForm(p => ({ ...p, endDate: e.target.value }))} />
                        </div>
                        <div className="gse-actions">
                          <button className="gse-cancel" onClick={() => setEditingStage(null)}>Cancel</button>
                          <button className="gse-save" style={{ background: stageForm.color }} onClick={saveStageEdit}>Save Stage</button>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}

        {projects.length === 0 && <div className="gantt-empty">No projects to display.</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────
export default function Projects() {
  const { themeColor } = useTheme();
  const toast    = useToast();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch]     = useState('');
  const [filterType, setFilterType] = useState('All');
  const [viewMode, setViewMode] = useState('cards');

  const [showModal, setShowModal]           = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [modalTab, setModalTab]             = useState('details');
  const [formData, setFormData] = useState({
    title: '', clientName: '', type: 'Standard', startDate: '', endDate: ''
  });

  useEffect(() => {
    loadProjects();
    // Re-fetch when Sales page (or any other page) updates a project
    const handler = () => loadProjects();
    window.addEventListener('crm:projects-updated', handler);
    return () => window.removeEventListener('crm:projects-updated', handler);
  }, [page, pageSize]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getProjects(page, pageSize);
      setProjects((data?.items ?? data) || []);
      setTotalPages(data?.totalPages || 1);
    } catch { toast.error('Failed to load projects'); }
    finally  { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await projectService.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success('Project deleted');
    } catch { toast.error('Failed to delete project'); }
  };

  const handleOpenModal = (project = null) => {
    setEditingProject(project);
    setModalTab('details');
    setFormData(project ? {
      title:      project.title      || '',
      clientName: project.clientName || '',
      type:       project.type       || 'Standard',
      startDate:  toInputDate(project.startDate),
      endDate:    toInputDate(project.endDate),
    } : { title: '', clientName: '', type: 'Standard', startDate: '', endDate: '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const startDate = formData.startDate || null;
      const endDate   = formData.endDate   || null;
      if (editingProject) {
        const payload = {
          ...editingProject,
          title:      formData.title,
          clientName: formData.clientName,
          type:       formData.type,
          startDate,
          endDate,
        };
        const updated = await projectService.updateProject(editingProject.id, payload);
        setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, ...updated } : p));
        toast.success('Project updated');
      } else {
        const created = await projectService.createProject({
          title:       formData.title,
          clientName:  formData.clientName,
          type:        formData.type,
          activeStage: 0,
          delay:       0,
          startDate,
          endDate,
        });
        setProjects(prev => [...prev, created]);
        toast.success('Project created');
      }
      setShowModal(false);
    } catch (err) { toast.error(err?.message || 'Failed to save project'); }
  };

  // Called from GanttView when a stage is edited
  const handleProjectUpdate = async (project, updates) => {
    try {
      const payload = { ...project, ...updates };
      await projectService.updateProject(project.id, payload);
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, ...updates } : p));
      toast.success('Stage updated');
    } catch { toast.error('Failed to update stage'); }
  };

  const types    = ['All', ...new Set(projects.map(p => p.type || 'Standard'))];
  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    return (!search || p.title?.toLowerCase().includes(q) || p.clientName?.toLowerCase().includes(q))
      && (filterType === 'All' || p.type === filterType);
  });

  const stats = [
    { label: 'Total',   value: projects.length,                                                       color: '#4361EE' },
    { label: 'Active',  value: projects.filter(p => (p.activeStage ?? 0) < 4).length,                color: '#10B981' },
    { label: 'Won',     value: projects.filter(p => (p.activeStage ?? 0) === 4).length,              color: '#8B5CF6' },
    { label: 'Delayed', value: projects.filter(p => (p.delay || 0) > 0).length,                      color: '#F43F5E' },
  ];

  return (
    <div className="projects-page">
      {/* ── Header ── */}
      <div className="projects-header">
        <div className="projects-title-block">
          <h2 className="projects-title">Projects</h2>
          <p className="projects-subtitle">{filtered.length} of {projects.length} projects</p>
        </div>
        <div className="projects-stats-row">
          {stats.map(s => (
            <div key={s.label} className="projects-stat-pill">
              <span className="ps-value" style={{ color: s.color }}>{s.value}</span>
              <span className="ps-label">{s.label}</span>
            </div>
          ))}
        </div>
        <button className="projects-add-btn" style={{ background: themeColor }} onClick={() => handleOpenModal()}>
          <FaPlus size={13} /> New Project
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className="projects-toolbar">
        <div className="projects-search-wrap">
          <Search size={15} className="projects-search-icon" />
          <input className="projects-search" type="text" placeholder="Search projects or clients…"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="projects-search-clear" onClick={() => setSearch('')}><X size={14} /></button>}
        </div>
        <div className="projects-type-filters">
          {types.map(t => (
            <button key={t}
              className={`projects-type-btn${filterType === t ? ' active' : ''}`}
              style={filterType === t ? { color: themeColor, borderColor: themeColor, background: `${themeColor}10` } : {}}
              onClick={() => setFilterType(t)}>{t}</button>
          ))}
        </div>
        <div className="projects-view-toggle">
          <button className={`pvt-btn${viewMode === 'cards' ? ' active' : ''}`}
            style={viewMode === 'cards' ? { color: themeColor } : {}} onClick={() => setViewMode('cards')}>
            <LayoutGrid size={14} /> Cards
          </button>
          <button className={`pvt-btn${viewMode === 'gantt' ? ' active' : ''}`}
            style={viewMode === 'gantt' ? { color: themeColor } : {}} onClick={() => setViewMode('gantt')}>
            <GanttIcon size={14} /> Gantt
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="projects-loading">
          <div className="projects-spinner" style={{ borderTopColor: themeColor }} />
          <p>Loading projects…</p>
        </div>
      ) : viewMode === 'gantt' ? (
        <GanttView projects={filtered} themeColor={themeColor} onEdit={handleOpenModal} onProjectUpdate={handleProjectUpdate} />
      ) : filtered.length === 0 ? (
        <div className="projects-empty">
          <Layers size={40} style={{ color: '#CBD5E1', marginBottom: 12 }} />
          <p>No projects found.</p>
          <button className="projects-add-btn small" style={{ background: themeColor }} onClick={() => handleOpenModal()}>
            <FaPlus size={12} /> Create Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {filtered.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i}
              onEdit={handleOpenModal} onDelete={handleDelete}
              onInvoice={id => navigate(`/invoice?projectId=${id}`)} />
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

      {/* ── Project Modal ── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered dialogClassName="proj-modal-dialog">
        <div className="proj-modal-inner">
          {/* Header */}
          <div className="proj-modal-head">
            <div className="proj-modal-head-left">
              <div className="proj-modal-icon" style={{ background: `${themeColor}15`, color: themeColor }}>
                <Briefcase size={16} />
              </div>
              <div>
                <div className="proj-modal-title">{editingProject ? 'Edit Project' : 'New Project'}</div>
                {editingProject && <div className="proj-modal-sub">#{editingProject.customId || editingProject.id}</div>}
              </div>
            </div>
            <button className="proj-modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
          </div>

          {/* Tabs — only when editing */}
          {editingProject && (
            <div className="proj-modal-tabs">
              <button className={`proj-modal-tab${modalTab === 'details' ? ' active' : ''}`}
                style={modalTab === 'details' ? { color: themeColor, borderBottomColor: themeColor } : {}}
                onClick={() => setModalTab('details')}>
                <Briefcase size={13} />Details
              </button>
              <button className={`proj-modal-tab${modalTab === 'history' ? ' active' : ''}`}
                style={modalTab === 'history' ? { color: themeColor, borderBottomColor: themeColor } : {}}
                onClick={() => setModalTab('history')}>
                <History size={13} />History
              </button>
            </div>
          )}

          {/* Body */}
          <div className="proj-modal-body">
            {modalTab === 'history' && editingProject ? (
              <AuditPanel entityName="Project" entityId={editingProject.id} />
            ) : (
              <form onSubmit={handleSave} id="proj-form">
                {/* Project Title */}
                <div className="pm-field-group">
                  <label className="pm-label"><Tag size={12} />Project Title</label>
                  <input required className="pm-input" type="text"
                    placeholder="e.g. Website Redesign"
                    value={formData.title}
                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} />
                </div>

                {/* Client Name */}
                <div className="pm-field-group">
                  <label className="pm-label"><User size={12} />Client Name</label>
                  <input required className="pm-input" type="text"
                    placeholder="e.g. Acme Corp"
                    value={formData.clientName}
                    onChange={e => setFormData(p => ({ ...p, clientName: e.target.value }))} />
                </div>

                {/* Project Type */}
                <div className="pm-field-group">
                  <label className="pm-label"><Layers size={12} />Project Type</label>
                  <select className="pm-input pm-select" value={formData.type}
                    onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}>
                    <option value="Standard">Standard</option>
                    <option value="Product">Product</option>
                    <option value="Service">Service</option>
                    <option value="Internal">Internal</option>
                  </select>
                </div>

                {/* Dates */}
                <div className="pm-date-row">
                  <div className="pm-field-group">
                    <label className="pm-label"><CalendarDays size={12} />Start Date</label>
                    <input className="pm-input" type="date"
                      value={formData.startDate}
                      onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))} />
                  </div>
                  <div className="pm-field-group">
                    <label className="pm-label"><CalendarDays size={12} />End Date</label>
                    <input className="pm-input" type="date"
                      value={formData.endDate}
                      onChange={e => setFormData(p => ({ ...p, endDate: e.target.value }))} />
                  </div>
                </div>

                {editingProject && (
                  <div className="pm-hint">
                    <Settings2 size={11} />
                    Stage dates can be set from the Gantt view — click ⚙ on any stage row.
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Footer — only show Save on details tab */}
          {modalTab === 'details' && (
            <div className="proj-modal-foot">
              <button type="button" className="pm-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" form="proj-form" className="pm-btn-save" style={{ background: themeColor }}>
                {editingProject ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          )}
        </div>
      </Modal>

      <style>{`
        /* ── Page layout ── */
        .projects-page { padding: 24px 28px 40px; max-width: 1600px; margin: 0 auto; font-family: var(--font-family,'DM Sans',sans-serif); }
        .projects-header { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; margin-bottom: 20px; }
        .projects-title-block { flex: 0 0 auto; }
        .projects-title { font-family: var(--font-display,'Outfit',sans-serif); font-size: 22px; font-weight: 800; color: #0F172A; margin: 0; letter-spacing: -0.03em; }
        .projects-subtitle { font-size: 12px; color: #94A3B8; margin: 2px 0 0; }
        .projects-stats-row { display: flex; gap: 10px; flex-wrap: wrap; flex: 1; }
        .projects-stat-pill { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #E1E8F4; border-radius: 999px; padding: 6px 14px; box-shadow: 0 1px 4px rgba(15,23,42,0.05); }
        .ps-value { font-family: var(--font-display,'Outfit',sans-serif); font-size: 16px; font-weight: 800; letter-spacing: -0.03em; }
        .ps-label { font-size: 11.5px; font-weight: 500; color: #94A3B8; }
        .projects-add-btn { display: flex; align-items: center; gap: 7px; color: #fff; border: none; padding: 9px 18px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; font-family: var(--font-family,'DM Sans',sans-serif); transition: filter .15s, transform .15s; box-shadow: 0 4px 12px rgba(0,0,0,.15); }
        .projects-add-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .projects-add-btn.small { margin-top: 12px; }
        .projects-toolbar { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 22px; }
        .projects-search-wrap { position: relative; flex: 1; min-width: 220px; max-width: 360px; }
        .projects-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94A3B8; }
        .projects-search { width: 100%; padding: 9px 36px; border: 1px solid #E1E8F4; border-radius: 10px; font-size: 13px; font-family: var(--font-family,'DM Sans',sans-serif); background: #fff; color: #0F172A; outline: none; transition: border-color .15s; }
        .projects-search:focus { border-color: #4361EE; box-shadow: 0 0 0 3px rgba(67,97,238,.1); }
        .projects-search-clear { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94A3B8; padding: 2px; }
        .projects-type-filters { display: flex; gap: 6px; flex-wrap: wrap; }
        .projects-type-btn { padding: 7px 14px; border-radius: 9px; border: 1px solid #E1E8F4; background: #fff; font-size: 12px; font-weight: 600; cursor: pointer; color: #64748B; transition: all .15s; font-family: var(--font-family,'DM Sans',sans-serif); }
        .projects-type-btn:hover { background: #F4F7FD; }
        .projects-type-btn.active { font-weight: 700; }
        .projects-view-toggle { display: flex; background: #F1F5F9; border-radius: 10px; padding: 3px; gap: 2px; margin-left: auto; }
        .pvt-btn { display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 14px; border: none; border-radius: 8px; background: transparent; font-size: 12.5px; font-weight: 500; color: #64748B; cursor: pointer; transition: all .16s; font-family: var(--font-family,'DM Sans',sans-serif); }
        .pvt-btn:hover:not(.active) { background: rgba(0,0,0,.04); }
        .pvt-btn.active { background: #fff; font-weight: 700; box-shadow: 0 1px 4px rgba(15,23,42,.1); }
        .projects-loading, .projects-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 260px; gap: 8px; color: #94A3B8; font-size: 14px; font-weight: 500; }
        .projects-spinner { width: 32px; height: 32px; border: 3px solid #E1E8F4; border-radius: 50%; animation: pspin .75s linear infinite; }
        @keyframes pspin { to { transform: rotate(360deg); } }
        .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; }

        /* ── Project Card ── */
        .proj-card { background: #fff; border: 1px solid #E1E8F4; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(15,23,42,.06); transition: box-shadow .25s, transform .25s; display: flex; flex-direction: column; }
        .proj-card:hover { box-shadow: 0 8px 28px rgba(67,97,238,.1); transform: translateY(-3px); }
        .proj-card-strip { height: 3px; width: 100%; border-radius: 16px 16px 0 0; flex-shrink: 0; }
        .proj-card-header { display: flex; align-items: flex-start; gap: 12px; padding: 16px 18px 10px; }
        .proj-client-avatar { width: 38px; height: 38px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; flex-shrink: 0; font-family: var(--font-display,'Outfit',sans-serif); }
        .proj-card-meta { flex: 1; min-width: 0; }
        .proj-card-title { font-size: 14px; font-weight: 700; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: var(--font-display,'Outfit',sans-serif); }
        .proj-card-client { font-size: 11.5px; color: #94A3B8; margin-top: 2px; font-weight: 500; }
        .proj-delay-badge { display: flex; align-items: center; gap: 4px; font-size: 10.5px; font-weight: 700; background: rgba(244,63,94,.1); color: #E11D48; border: 1px solid rgba(244,63,94,.2); padding: 3px 9px; border-radius: 999px; white-space: nowrap; flex-shrink: 0; }
        .proj-won-badge { display: flex; align-items: center; gap: 4px; font-size: 10.5px; font-weight: 700; background: rgba(16,185,129,.1); color: #059669; border: 1px solid rgba(16,185,129,.2); padding: 3px 9px; border-radius: 999px; white-space: nowrap; flex-shrink: 0; }
        .proj-card-stage-row { display: flex; align-items: center; justify-content: space-between; padding: 0 18px 8px; }
        .proj-stage-pill { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
        .proj-progress-pct { font-size: 12px; font-weight: 800; font-family: var(--font-display,'Outfit',sans-serif); }
        .proj-progress-track { height: 4px; background: #EEF2F8; margin: 0 18px 14px; border-radius: 999px; overflow: hidden; }
        .proj-progress-fill { height: 100%; border-radius: 999px; }
        .proj-card-info-row { display: flex; align-items: center; gap: 8px; padding: 0 18px 14px; flex-wrap: wrap; }
        .proj-type-tag { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 7px; }
        .proj-id-tag { font-size: 10.5px; font-weight: 600; color: #94A3B8; }
        .proj-date-tag { display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; color: #64748B; font-weight: 500; }
        .proj-card-actions { display: flex; align-items: center; gap: 6px; padding: 12px 18px; border-top: 1px solid #EEF2F8; background: #F8FAFC; margin-top: auto; }
        .proj-action-btn { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 8px; border: 1px solid #E1E8F4; background: #fff; color: #475569; cursor: pointer; font-family: var(--font-family,'DM Sans',sans-serif); transition: all .15s; }
        .proj-action-btn:hover { background: #F4F7FD; color: #0F172A; }
        .proj-action-btn.invoice { color: #4361EE; border-color: rgba(67,97,238,.25); }
        .proj-action-btn.invoice:hover { background: rgba(67,97,238,.07); }
        .proj-action-btn.danger { color: #E11D48; border-color: rgba(244,63,94,.2); padding: 6px 10px; margin-left: auto; }
        .proj-action-btn.danger:hover { background: rgba(244,63,94,.08); }

        /* ════════════════════════════════
           GANTT CHART
        ════════════════════════════════ */
        .gantt-wrap { background: #fff; border: 1px solid #E1E8F4; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(15,23,42,.06); font-family: var(--font-family,'DM Sans',sans-serif); }

        /* Top bar */
        .gantt-top-bar { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: #F8FAFC; border-bottom: 1px solid #E8EEF8; flex-wrap: wrap; gap: 10px; }
        .gantt-legend-row { display: flex; align-items: center; gap: 16px; }
        .gl-item { display: flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 500; color: #64748B; }
        .gl-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .gantt-ctrl-row { display: flex; gap: 8px; }
        .gantt-ctrl-btn { padding: 5px 12px; border-radius: 7px; border: 1px solid #E1E8F4; background: #fff; font-size: 12px; font-weight: 600; color: #475569; cursor: pointer; transition: all .15s; font-family: inherit; }
        .gantt-ctrl-btn:hover { background: #F4F7FD; border-color: #C7D2E8; color: #0F172A; }

        /* Header row */
        .gantt-header { display: grid; grid-template-columns: 280px 1fr; background: #F8FAFC; border-bottom: 1px solid #E8EEF8; height: 38px; }
        .gantt-header-label { display: flex; align-items: center; padding: 0 16px; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #94A3B8; border-right: 1px solid #E8EEF8; }
        .gantt-month-header { position: relative; overflow: hidden; }
        .gantt-month-cell { position: absolute; top: 0; height: 100%; display: flex; flex-direction: column; align-items: flex-start; transform: translateX(-1px); pointer-events: none; }
        .gantt-month-rule { width: 1px; height: 10px; background: #CBD5E1; }
        .gantt-month-name { font-size: 10px; font-weight: 700; color: #94A3B8; letter-spacing: .04em; text-transform: uppercase; padding: 1px 4px; white-space: nowrap; }
        .gantt-today-line { position: absolute; top: 0; bottom: 0; width: 2px; background: #F43F5E; z-index: 10; transform: translateX(-1px); }
        .gantt-today-tag { position: absolute; top: 4px; left: 5px; font-size: 9px; font-weight: 800; color: #F43F5E; background: rgba(254,242,242,.95); padding: 1px 5px; border-radius: 3px; white-space: nowrap; }

        /* Body */
        .gantt-body { display: flex; flex-direction: column; }
        .gantt-label-col { border-right: 1px solid #E8EEF8; }

        /* Project row */
        .gantt-row { display: grid; grid-template-columns: 280px 1fr; border-bottom: 1px solid #F1F5F9; }
        .gantt-row:last-child { border-bottom: none; }
        .gantt-proj-row { min-height: 54px; }
        .gantt-proj-label { display: flex; align-items: center; gap: 8px; padding: 0 10px 0 12px; background: #FAFBFC; }
        .gantt-proj-row:hover .gantt-proj-label { background: #F4F7FF; }
        .gantt-toggle-btn { width: 20px; height: 20px; border-radius: 5px; border: 1px solid #E1E8F4; background: #fff; color: #64748B; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: all .15s; }
        .gantt-toggle-btn:hover { background: #EEF2F8; color: #4361EE; border-color: #C7D2E8; }
        .gantt-avatar { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; flex-shrink: 0; font-family: var(--font-display,'Outfit',sans-serif); }
        .gantt-proj-info { flex: 1; min-width: 0; }
        .gantt-proj-title { font-size: 12.5px; font-weight: 700; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: var(--font-display,'Outfit',sans-serif); }
        .gantt-proj-sub { font-size: 10.5px; color: #94A3B8; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gantt-edit-btn { width: 24px; height: 24px; border-radius: 6px; border: 1px solid #E1E8F4; background: transparent; color: #94A3B8; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: all .15s; opacity: 0; }
        .gantt-proj-row:hover .gantt-edit-btn { opacity: 1; }
        .gantt-edit-btn:hover { background: #EEF2F8; color: #4361EE; }

        /* Stage row */
        .gantt-stage-row { min-height: 40px; background: #FDFDFF; }
        .gantt-stage-row.is-active { background: #FAFAFF; }
        .gantt-stage-label-col { display: flex; align-items: center; gap: 6px; padding: 0 8px 0 6px; background: inherit; }
        .gantt-stage-row:hover .gantt-stage-label-col { background: #F4F7FF; }
        .gantt-s-indent { width: 36px; flex-shrink: 0; }
        .gantt-s-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; border: 1.5px solid #CBD5E1; background: transparent; transition: all .2s; }
        .gantt-s-dot.done { border-color: transparent; }
        .gantt-s-dot.active-dot { border-color: transparent; }
        .gantt-s-name { font-size: 11.5px; font-weight: 600; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gantt-active-pill { font-size: 9.5px; font-weight: 700; padding: 1px 6px; border-radius: 999px; border: 1px solid; white-space: nowrap; flex-shrink: 0; }
        .gantt-s-edit-btn { width: 22px; height: 22px; border-radius: 6px; border: 1px solid #E1E8F4; background: transparent; color: #94A3B8; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: all .15s; opacity: 0; }
        .gantt-stage-row:hover .gantt-s-edit-btn { opacity: 1; }
        .gantt-s-edit-btn:hover { background: #EEF2F8; color: #4361EE; border-color: #C7D2E8; }

        /* Track */
        .gantt-track { position: relative; overflow: hidden; background: #FAFBFE; }
        .gantt-grid-col { position: absolute; top: 0; bottom: 0; width: 1px; background: rgba(203,213,225,0.25); pointer-events: none; }
        .gantt-row-today { position: absolute; top: 0; bottom: 0; width: 1.5px; background: rgba(244,63,94,.25); z-index: 4; pointer-events: none; }

        /* Bars */
        .gantt-bar { position: absolute; top: 50%; transform: translateY(-50%); border-radius: 6px; display: flex; align-items: center; z-index: 2; min-width: 4px; }
        .gantt-bar-lbl { font-size: 10.5px; font-weight: 700; color: #fff; padding: 0 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: .01em; }
        .gantt-proj-bar { height: 22px; box-shadow: 0 2px 8px rgba(0,0,0,.15); }
        .gantt-stage-bar { height: 14px; border: 1.5px solid; }
        .gantt-stage-bar.done { opacity: .9; }
        .gantt-stage-bar.active-bar { opacity: 1; box-shadow: 0 2px 6px rgba(0,0,0,.12); }
        .gantt-stage-bar.pending { opacity: .4; }

        .gantt-no-date { display: flex; align-items: center; gap: 7px; height: 100%; padding: 0 16px; font-size: 11.5px; color: #CBD5E1; font-style: italic; }

        /* Inline stage editor */
        .gantt-stage-editor {
          display: grid; grid-template-columns: 280px 1fr;
          background: #F0F4FF; border-bottom: 1px solid #D5DFFB;
          border-top: 1px solid #D5DFFB;
          padding: 12px 16px; gap: 12px;
          grid-column: 1 / -1;
        }
        .gse-field { display: flex; flex-direction: column; gap: 4px; }
        .gse-field label { font-size: 10.5px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: .06em; }
        .gse-field input { padding: 6px 10px; border-radius: 8px; border: 1px solid #C7D2E8; font-size: 12.5px; background: #fff; color: #0F172A; outline: none; font-family: inherit; }
        .gse-field input:focus { border-color: #4361EE; box-shadow: 0 0 0 2px rgba(67,97,238,.12); }
        .gse-color-row { display: flex; gap: 6px; flex-wrap: wrap; }
        .gse-color-swatch { width: 22px; height: 22px; border-radius: 6px; border: 2px solid transparent; cursor: pointer; transition: all .15s; }
        .gse-color-swatch.selected { border-color: #0F172A; transform: scale(1.15); }
        .gse-actions { display: flex; align-items: flex-end; gap: 8px; }
        .gse-cancel { padding: 7px 14px; border-radius: 8px; border: 1px solid #E1E8F4; background: #fff; font-size: 12px; font-weight: 600; cursor: pointer; color: #64748B; font-family: inherit; }
        .gse-cancel:hover { background: #F4F7FD; }
        .gse-save { padding: 7px 16px; border-radius: 8px; border: none; font-size: 12px; font-weight: 700; cursor: pointer; color: #fff; font-family: inherit; box-shadow: 0 2px 8px rgba(0,0,0,.15); }
        .gse-save:hover { filter: brightness(1.1); }

        .gantt-empty { display: flex; align-items: center; justify-content: center; padding: 40px; color: #94A3B8; font-size: 13px; }

        /* ════════════════════════════════
           PROJECT MODAL
        ════════════════════════════════ */
        .proj-modal-dialog { max-width: 520px !important; }
        .proj-modal-dialog .modal-content { border: none; border-radius: 20px; box-shadow: 0 24px 64px rgba(15,23,42,.18); overflow: hidden; padding: 0; }

        .proj-modal-inner { display: flex; flex-direction: column; background: #fff; }

        /* Header */
        .proj-modal-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 22px 16px;
          border-bottom: 1px solid #EEF2F8;
        }
        .proj-modal-head-left { display: flex; align-items: center; gap: 12px; }
        .proj-modal-icon { width: 38px; height: 38px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .proj-modal-title { font-family: var(--font-display,'Outfit',sans-serif); font-size: 16px; font-weight: 800; color: #0F172A; letter-spacing: -0.02em; }
        .proj-modal-sub { font-size: 11px; color: #94A3B8; font-weight: 500; margin-top: 1px; }
        .proj-modal-close { width: 32px; height: 32px; border-radius: 9px; border: 1px solid #E1E8F4; background: #F8FAFC; color: #64748B; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .15s; }
        .proj-modal-close:hover { background: #EEF2F8; color: #0F172A; }

        /* Tabs */
        .proj-modal-tabs { display: flex; gap: 0; border-bottom: 1px solid #EEF2F8; padding: 0 22px; }
        .proj-modal-tab {
          display: flex; align-items: center; gap: 6px;
          padding: 11px 4px; margin-right: 20px;
          font-size: 12.5px; font-weight: 600;
          color: #94A3B8; background: none; border: none; border-bottom: 2px solid transparent;
          cursor: pointer; transition: all .15s; font-family: inherit;
          margin-bottom: -1px;
        }
        .proj-modal-tab:hover { color: #475569; }
        .proj-modal-tab.active { font-weight: 700; }

        /* Body */
        .proj-modal-body { padding: 22px; min-height: 200px; max-height: 480px; overflow-y: auto; }

        /* Form fields */
        .pm-field-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
        .pm-label { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: .06em; }
        .pm-input {
          padding: 10px 13px; border-radius: 10px; border: 1.5px solid #E1E8F4;
          font-size: 13.5px; font-family: var(--font-family,'DM Sans',sans-serif);
          background: #FAFBFE; color: #0F172A; outline: none;
          transition: border-color .15s, box-shadow .15s; width: 100%;
        }
        .pm-input:focus { border-color: #4361EE; box-shadow: 0 0 0 3px rgba(67,97,238,.1); background: #fff; }
        .pm-select { appearance: none; cursor: pointer; }
        .pm-date-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .pm-hint { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: #94A3B8; margin-top: 4px; font-style: italic; }

        /* Footer */
        .proj-modal-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 22px; border-top: 1px solid #EEF2F8; background: #FAFBFE; }
        .pm-btn-cancel { padding: 9px 18px; border-radius: 10px; border: 1.5px solid #E1E8F4; background: #fff; font-size: 13px; font-weight: 600; color: #475569; cursor: pointer; font-family: inherit; transition: all .15s; }
        .pm-btn-cancel:hover { background: #F4F7FD; border-color: #C7D2E8; }
        .pm-btn-save { padding: 9px 22px; border-radius: 10px; border: none; font-size: 13px; font-weight: 700; color: #fff; cursor: pointer; font-family: inherit; box-shadow: 0 4px 12px rgba(67,97,238,.25); transition: filter .15s, transform .15s; }
        .pm-btn-save:hover { filter: brightness(1.1); transform: translateY(-1px); }
      `}</style>
    </div>
  );
}
