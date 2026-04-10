import React, { useState, useEffect, useRef } from 'react';
import { projectService } from '../../services/api';
import { useToast } from '../../components/Toast/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { FaPlus, FaTrash, FaPenToSquare } from 'react-icons/fa6';
import { Clock, FileText, AlertCircle, CheckCircle2, Layers, Search, X, LayoutGrid, GanttChart as GanttIcon, CalendarDays } from 'lucide-react';
import { Modal, Form, Button, FloatingLabel } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const STAGE_LABELS = ['Demo', 'Proposal', 'Negotiation', 'Approval', 'Won', 'Closed', 'Lost'];
const STAGE_COLORS = ['#06B6D4', '#F59E0B', '#F97316', '#8B5CF6', '#10B981', '#64748B', '#F43F5E'];

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

// ─────────────────────────────────────────────
// PROJECT CARD
// ─────────────────────────────────────────────
function ProjectCard({ project, onEdit, onDelete, onInvoice, index }) {
  const navigate = useNavigate();
  const stage = project.activeStage ?? 0;
  const stageLabel = STAGE_LABELS[stage] || `Stage ${stage}`;
  const stageColor = STAGE_COLORS[stage] || '#64748B';
  const progress = Math.round((stage / Math.max(STAGE_LABELS.length - 1, 1)) * 100);
  const isDelayed = (project.delay || 0) > 0;
  const isWon = stage === 4;
  const typeMeta = TYPE_META[project.type] || TYPE_META.Standard;
  const clientColor = hashColor(project.clientName);
  const initials = (project.clientName || 'NA').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <motion.div
      className="proj-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      style={{ '--proj-accent': stageColor }}
    >
      <div className="proj-card-strip" style={{ background: stageColor }} />
      <div className="proj-card-header">
        <div className="proj-client-avatar" style={{ background: `${clientColor}18`, color: clientColor }}>
          {initials}
        </div>
        <div className="proj-card-meta">
          <div className="proj-card-title">{project.title || 'Untitled Project'}</div>
          <div className="proj-card-client">{project.clientName || 'No Client'}</div>
        </div>
        {isDelayed && (
          <div className="proj-delay-badge"><AlertCircle size={11} />{project.delay}d delay</div>
        )}
        {isWon && !isDelayed && (
          <div className="proj-won-badge"><CheckCircle2 size={11} />Won</div>
        )}
      </div>
      <div className="proj-card-stage-row">
        <span className="proj-stage-pill" style={{ color: stageColor, background: `${stageColor}12`, border: `1px solid ${stageColor}24` }}>
          {stageLabel}
        </span>
        <span className="proj-progress-pct" style={{ color: stageColor }}>{progress}%</span>
      </div>
      <div className="proj-progress-track">
        <motion.div
          className="proj-progress-fill"
          style={{ background: stageColor }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.7, delay: index * 0.05 + 0.2, ease: 'easeOut' }}
        />
      </div>
      <div className="proj-card-info-row">
        <span className="proj-type-tag" style={{ color: typeMeta.color, background: typeMeta.bg }}>
          <Layers size={10} />{project.type || 'Standard'}
        </span>
        {project.customId && <span className="proj-id-tag">#{project.customId}</span>}
        {project.startDate && (
          <span className="proj-date-tag">
            <CalendarDays size={10} />
            {new Date(project.startDate).toLocaleDateString('default', { day: 'numeric', month: 'short' })}
            {project.endDate && ` → ${new Date(project.endDate).toLocaleDateString('default', { day: 'numeric', month: 'short' })}`}
          </span>
        )}
      </div>
      <div className="proj-card-actions">
        <button className="proj-action-btn" onClick={() => onEdit(project)} title="Edit"><FaPenToSquare size={13} />Edit</button>
        <button className="proj-action-btn invoice" onClick={() => onInvoice(project.id)} title="Invoices"><FileText size={13} />Invoice</button>
        <button className="proj-action-btn danger" onClick={() => onDelete(project.id)} title="Delete"><FaTrash size={12} /></button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// GANTT VIEW
// ─────────────────────────────────────────────
function GanttView({ projects, themeColor, onEdit }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  // Collect all dates from projects that have them
  const datedProjects = projects.filter(p => p.startDate);
  const allDates = datedProjects.flatMap(p => [
    p.startDate ? new Date(p.startDate) : null,
    p.endDate   ? new Date(p.endDate)   : null,
  ]).filter(Boolean);

  const hasAnyDate = allDates.length > 0;

  // Timeline bounds
  const minRaw = hasAnyDate ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date();
  const maxRaw = hasAnyDate ? new Date(Math.max(...allDates.map(d => d.getTime()), today.getTime())) : new Date(today.getFullYear(), today.getMonth() + 3, 0);
  const minDate = new Date(minRaw); minDate.setDate(minDate.getDate() - 5);
  const maxDate = new Date(maxRaw); maxDate.setDate(maxDate.getDate() + 10);
  const span = maxDate - minDate;

  const pct = (d) => ((new Date(d) - minDate) / span) * 100;
  const barWidth = (start, end) => {
    const s = new Date(start);
    const e = end ? new Date(end) : new Date(new Date(start).setMonth(new Date(start).getMonth() + 1));
    if (e <= s) return 3;
    return Math.max(3, ((e - s) / span) * 100);
  };
  const todayPct = pct(today);

  // Generate month ticks
  const months = [];
  const cur = new Date(minDate); cur.setDate(1);
  while (cur <= maxDate) {
    const p = pct(cur);
    if (p >= -5 && p <= 105) months.push({ label: cur.toLocaleString('default', { month: 'short', year: '2-digit' }), pos: p });
    cur.setMonth(cur.getMonth() + 1);
  }

  const stageColor = (p) => STAGE_COLORS[p.activeStage ?? 0] || '#64748B';

  return (
    <div className="gantt-wrap">
      {/* ── Timeline header ── */}
      <div className="gantt-header">
        <div className="gantt-label-col gantt-header-label">Project</div>
        <div className="gantt-track-col gantt-timeline-bar">
          {months.map((m, i) => (
            <div key={i} className="gantt-month-tick" style={{ left: `${m.pos}%` }}>
              <div className="gantt-month-line" />
              <span>{m.label}</span>
            </div>
          ))}
          {todayPct >= 0 && todayPct <= 100 && (
            <div className="gantt-today-marker" style={{ left: `${todayPct}%` }}>
              <span className="gantt-today-tag">Today</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Rows ── */}
      <div className="gantt-body">
        {projects.map((project, idx) => {
          const sc       = stageColor(project);
          const stage    = project.activeStage ?? 0;
          const progress = Math.round((stage / Math.max(STAGE_LABELS.length - 1, 1)) * 100);
          const clientColor = hashColor(project.clientName);
          const initials = (project.clientName || 'NA').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
          const hasDate  = !!project.startDate;
          const left     = hasDate ? pct(project.startDate)                       : null;
          const width    = hasDate ? barWidth(project.startDate, project.endDate) : null;
          const isOngoing = hasDate && !project.endDate;

          return (
            <motion.div
              key={project.id}
              className="gantt-row"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
            >
              {/* Left label */}
              <div className="gantt-label-col gantt-row-label">
                <div className="gantt-avatar" style={{ background: `${clientColor}18`, color: clientColor }}>
                  {initials}
                </div>
                <div className="gantt-row-info">
                  <div className="gantt-row-title">{project.title || 'Untitled'}</div>
                  <div className="gantt-row-sub">{project.clientName || '—'}</div>
                </div>
                <span className="gantt-stage-dot" style={{ background: sc }} title={STAGE_LABELS[stage]} />
                <button className="gantt-edit-btn" onClick={() => onEdit(project)} title="Edit dates">
                  <FaPenToSquare size={11} />
                </button>
              </div>

              {/* Track */}
              <div className="gantt-track-col gantt-track">
                {/* Today line per row */}
                {todayPct >= 0 && todayPct <= 100 && (
                  <div className="gantt-row-today" style={{ left: `${todayPct}%` }} />
                )}

                {hasDate ? (
                  <>
                    {/* Background bar (full span) */}
                    <div
                      className="gantt-bar-bg"
                      style={{ left: `${left}%`, width: `${width}%`, borderColor: sc }}
                    />
                    {/* Progress fill */}
                    <motion.div
                      className={`gantt-bar${isOngoing ? ' ongoing' : ''}`}
                      style={{ left: `${left}%`, width: `${width * progress / 100}%`, background: sc }}
                      initial={{ width: 0 }}
                      animate={{ width: `${width * progress / 100}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.04 + 0.2, ease: 'easeOut' }}
                    />
                    {/* Label on bar */}
                    {width > 10 && (
                      <div
                        className="gantt-bar-label"
                        style={{ left: `${left}%`, width: `${width}%` }}
                      >
                        {project.title}
                        <span style={{ opacity: 0.75, marginLeft: 6 }}>{progress}%</span>
                      </div>
                    )}
                    {/* End pin */}
                    {project.endDate && (
                      <div className="gantt-end-pin" style={{ left: `${left + width}%`, background: sc }} />
                    )}
                  </>
                ) : (
                  <div className="gantt-no-date">
                    <CalendarDays size={12} /> No dates set — click edit to add
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {projects.length === 0 && (
          <div className="gantt-empty">No projects to display.</div>
        )}
      </div>

      {/* Legend */}
      <div className="gantt-legend">
        <div className="gantt-legend-item">
          <span className="gantt-legend-bg" /> Full duration
        </div>
        <div className="gantt-legend-item">
          <span className="gantt-legend-fill" style={{ background: themeColor }} /> Progress
        </div>
        {STAGE_LABELS.slice(0, 5).map((label, i) => (
          <div key={label} className="gantt-legend-item">
            <span className="gantt-legend-dot" style={{ background: STAGE_COLORS[i] }} /> {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────
export default function Projects() {
  const { themeColor } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterType, setFilterType] = useState('All');
  const [viewMode, setViewMode]   = useState('cards'); // 'cards' | 'gantt'

  const [showModal, setShowModal]       = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    title: '', clientName: '', type: 'Standard', startDate: '', endDate: ''
  });

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setProjects((await projectService.getAll()) || []);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await projectService.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const handleOpenModal = (project = null) => {
    setEditingProject(project);
    setFormData(project
      ? { title: project.title, clientName: project.clientName, type: project.type || 'Standard', startDate: project.startDate || '', endDate: project.endDate || '' }
      : { title: '', clientName: '', type: 'Standard', startDate: '', endDate: '' }
    );
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await projectService.update(editingProject.id, { ...editingProject, ...formData });
        toast.success('Project updated');
      } else {
        await projectService.create({ ...formData, activeStage: 0, delay: 0 });
        toast.success('Project created');
      }
      setShowModal(false);
      loadProjects();
    } catch {
      toast.error('Failed to save project');
    }
  };

  const types    = ['All', ...new Set(projects.map(p => p.type || 'Standard'))];
  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    return (!search || p.title?.toLowerCase().includes(q) || p.clientName?.toLowerCase().includes(q))
      && (filterType === 'All' || p.type === filterType);
  });

  const stats = [
    { label: 'Total',   value: projects.length,                                         color: '#4361EE' },
    { label: 'Active',  value: projects.filter(p => p.activeStage < 4 && p.activeStage !== 6).length, color: '#10B981' },
    { label: 'Won',     value: projects.filter(p => p.activeStage === 4).length,        color: '#8B5CF6' },
    { label: 'Delayed', value: projects.filter(p => (p.delay || 0) > 0).length,        color: '#F43F5E' },
  ];

  return (
    <div className="projects-page">

      {/* ── Page header ── */}
      <div className="projects-header">
        <div className="projects-title-block">
          <h2 className="projects-title">Projects</h2>
          <p className="projects-subtitle">{filtered.length} of {projects.length} projects</p>
        </div>
        <div className="projects-stats-row">
          {stats.map(s => (
            <div key={s.label} className="projects-stat-pill" style={{ '--ps-color': s.color }}>
              <span className="ps-value" style={{ color: s.color }}>{s.value}</span>
              <span className="ps-label">{s.label}</span>
            </div>
          ))}
        </div>
        <button
          className="projects-add-btn"
          style={{ background: themeColor, borderColor: themeColor }}
          onClick={() => handleOpenModal()}
        >
          <FaPlus size={13} /> New Project
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className="projects-toolbar">
        <div className="projects-search-wrap">
          <Search size={15} className="projects-search-icon" />
          <input
            className="projects-search"
            type="text"
            placeholder="Search projects or clients…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="projects-search-clear" onClick={() => setSearch('')}><X size={14} /></button>
          )}
        </div>
        <div className="projects-type-filters">
          {types.map(t => (
            <button
              key={t}
              className={`projects-type-btn ${filterType === t ? 'active' : ''}`}
              style={filterType === t ? { color: themeColor, borderColor: themeColor, background: `${themeColor}10` } : {}}
              onClick={() => setFilterType(t)}
            >{t}</button>
          ))}
        </div>

        {/* View toggle */}
        <div className="projects-view-toggle">
          <button
            className={`pvt-btn${viewMode === 'cards' ? ' active' : ''}`}
            style={viewMode === 'cards' ? { color: themeColor } : {}}
            onClick={() => setViewMode('cards')}
            title="Card view"
          >
            <LayoutGrid size={14} /> Cards
          </button>
          <button
            className={`pvt-btn${viewMode === 'gantt' ? ' active' : ''}`}
            style={viewMode === 'gantt' ? { color: themeColor } : {}}
            onClick={() => setViewMode('gantt')}
            title="Gantt chart"
          >
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
        <GanttView projects={filtered} themeColor={themeColor} onEdit={handleOpenModal} />
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
            <ProjectCard key={p.id} project={p} index={i} onEdit={handleOpenModal} onDelete={handleDelete} onInvoice={(id) => navigate(`/invoice?projectId=${id}`)} />
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingProject ? 'Edit Project' : 'New Project'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body className="px-4 py-3">
            <FloatingLabel label="Project Title" className="mb-3">
              <Form.Control required type="text" value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Website Redesign" />
            </FloatingLabel>
            <FloatingLabel label="Client Name" className="mb-3">
              <Form.Control required type="text" value={formData.clientName}
                onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="e.g. Acme Corp" />
            </FloatingLabel>
            <FloatingLabel label="Project Type" className="mb-3">
              <Form.Select value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}>
                <option value="Standard">Standard</option>
                <option value="Product">Product</option>
                <option value="Service">Service</option>
                <option value="Internal">Internal</option>
              </Form.Select>
            </FloatingLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FloatingLabel label="Start Date">
                <Form.Control type="date" value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
              </FloatingLabel>
              <FloatingLabel label="End Date">
                <Form.Control type="date" value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
              </FloatingLabel>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" style={{ background: themeColor, borderColor: themeColor }}>
              {editingProject ? 'Save Changes' : 'Create Project'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style>{`
        .projects-page {
          padding: 24px 28px 40px;
          max-width: 1600px; margin: 0 auto;
          font-family: var(--font-family, 'DM Sans', sans-serif);
        }
        .projects-header {
          display: flex; align-items: center; gap: 20px;
          flex-wrap: wrap; margin-bottom: 20px;
        }
        .projects-title-block { flex: 0 0 auto; }
        .projects-title {
          font-family: var(--font-display, 'Outfit', sans-serif);
          font-size: 22px; font-weight: 800; color: #0F172A;
          margin: 0; letter-spacing: -0.03em;
        }
        .projects-subtitle { font-size: 12px; color: #94A3B8; margin: 2px 0 0; }
        .projects-stats-row { display: flex; gap: 10px; flex-wrap: wrap; flex: 1; }
        .projects-stat-pill {
          display: flex; align-items: center; gap: 8px;
          background: #FFFFFF; border: 1px solid #E1E8F4;
          border-radius: 999px; padding: 6px 14px;
          box-shadow: 0 1px 4px rgba(15,23,42,0.05);
        }
        .ps-value { font-family: var(--font-display,'Outfit',sans-serif); font-size: 16px; font-weight: 800; letter-spacing: -0.03em; }
        .ps-label { font-size: 11.5px; font-weight: 500; color: #94A3B8; }
        .projects-add-btn {
          display: flex; align-items: center; gap: 7px;
          color: #fff; border: none; padding: 9px 18px;
          border-radius: 10px; font-size: 13px; font-weight: 700;
          cursor: pointer; white-space: nowrap;
          font-family: var(--font-family,'DM Sans',sans-serif);
          transition: filter 0.15s, transform 0.15s;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .projects-add-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .projects-add-btn.small { margin-top: 12px; }
        .projects-toolbar {
          display: flex; align-items: center; gap: 14px;
          flex-wrap: wrap; margin-bottom: 22px;
        }
        .projects-search-wrap { position: relative; flex: 1; min-width: 220px; max-width: 360px; }
        .projects-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94A3B8; }
        .projects-search {
          width: 100%; padding: 9px 36px;
          border: 1px solid #E1E8F4; border-radius: 10px;
          font-size: 13px; font-family: var(--font-family,'DM Sans',sans-serif);
          background: #fff; color: #0F172A; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .projects-search:focus { border-color: var(--accent-primary,#4361EE); box-shadow: 0 0 0 3px rgba(67,97,238,0.1); }
        .projects-search-clear { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94A3B8; padding: 2px; }
        .projects-type-filters { display: flex; gap: 6px; flex-wrap: wrap; }
        .projects-type-btn {
          padding: 7px 14px; border-radius: 9px; border: 1px solid #E1E8F4;
          background: #fff; font-size: 12px; font-weight: 600; cursor: pointer;
          color: #64748B; transition: all 0.15s; font-family: var(--font-family,'DM Sans',sans-serif);
        }
        .projects-type-btn:hover { background: #F4F7FD; color: #334155; }
        .projects-type-btn.active { font-weight: 700; }

        /* View toggle */
        .projects-view-toggle {
          display: flex; background: #F1F5F9; border-radius: 10px; padding: 3px; gap: 2px; margin-left: auto;
        }
        .pvt-btn {
          display: flex; align-items: center; gap: 6px;
          height: 30px; padding: 0 14px; border: none; border-radius: 8px;
          background: transparent; font-size: 12.5px; font-weight: 500;
          color: #64748B; cursor: pointer; transition: all 0.16s;
          font-family: var(--font-family,'DM Sans',sans-serif);
        }
        .pvt-btn:hover:not(.active) { background: rgba(0,0,0,0.04); color: #0F172A; }
        .pvt-btn.active { background: #FFFFFF; font-weight: 700; box-shadow: 0 1px 4px rgba(15,23,42,0.1); }

        .projects-loading, .projects-empty {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          min-height: 260px; gap: 8px;
          color: #94A3B8; font-size: 14px; font-weight: 500;
        }
        .projects-spinner {
          width: 32px; height: 32px; border: 3px solid #E1E8F4;
          border-radius: 50%; animation: pspin 0.75s linear infinite;
        }
        @keyframes pspin { to { transform: rotate(360deg); } }

        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 18px;
        }

        /* ── Project Card ── */
        .proj-card {
          background: #FFFFFF; border: 1px solid #E1E8F4; border-radius: 16px;
          overflow: hidden; box-shadow: 0 2px 12px rgba(15,23,42,0.06);
          transition: box-shadow 0.25s, transform 0.25s;
          position: relative; display: flex; flex-direction: column;
        }
        .proj-card:hover { box-shadow: 0 8px 28px rgba(67,97,238,0.1); transform: translateY(-3px); }
        .proj-card-strip { height: 3px; width: 100%; border-radius: 16px 16px 0 0; flex-shrink: 0; }
        .proj-card-header { display: flex; align-items: flex-start; gap: 12px; padding: 16px 18px 10px; }
        .proj-client-avatar {
          width: 38px; height: 38px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800; flex-shrink: 0;
          font-family: var(--font-display,'Outfit',sans-serif); letter-spacing: 0.02em;
        }
        .proj-card-meta { flex: 1; min-width: 0; }
        .proj-card-title { font-size: 14px; font-weight: 700; color: #0F172A; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: var(--font-display,'Outfit',sans-serif); letter-spacing: -0.02em; }
        .proj-card-client { font-size: 11.5px; color: #94A3B8; margin-top: 2px; font-weight: 500; }
        .proj-delay-badge { display: flex; align-items: center; gap: 4px; font-size: 10.5px; font-weight: 700; background: rgba(244,63,94,0.1); color: #E11D48; border: 1px solid rgba(244,63,94,0.2); padding: 3px 9px; border-radius: 999px; white-space: nowrap; flex-shrink: 0; }
        .proj-won-badge { display: flex; align-items: center; gap: 4px; font-size: 10.5px; font-weight: 700; background: rgba(16,185,129,0.1); color: #059669; border: 1px solid rgba(16,185,129,0.2); padding: 3px 9px; border-radius: 999px; white-space: nowrap; flex-shrink: 0; }
        .proj-card-stage-row { display: flex; align-items: center; justify-content: space-between; padding: 0 18px 8px; }
        .proj-stage-pill { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; letter-spacing: 0.02em; }
        .proj-progress-pct { font-size: 12px; font-weight: 800; font-family: var(--font-display,'Outfit',sans-serif); letter-spacing: -0.02em; }
        .proj-progress-track { height: 4px; background: #EEF2F8; margin: 0 18px 14px; border-radius: 999px; overflow: hidden; }
        .proj-progress-fill { height: 100%; border-radius: 999px; }
        .proj-card-info-row { display: flex; align-items: center; gap: 8px; padding: 0 18px 14px; flex-wrap: wrap; }
        .proj-type-tag { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 7px; letter-spacing: 0.02em; }
        .proj-id-tag { font-size: 10.5px; font-weight: 600; color: #94A3B8; letter-spacing: 0.04em; }
        .proj-date-tag { display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; color: #64748B; font-weight: 500; }
        .proj-card-actions { display: flex; align-items: center; gap: 6px; padding: 12px 18px; border-top: 1px solid #EEF2F8; background: #F8FAFC; margin-top: auto; }
        .proj-action-btn { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 8px; border: 1px solid #E1E8F4; background: #fff; color: #475569; cursor: pointer; font-family: var(--font-family,'DM Sans',sans-serif); transition: all 0.15s; }
        .proj-action-btn:hover { background: #F4F7FD; color: #0F172A; border-color: #C7D2E8; }
        .proj-action-btn.invoice { color: #4361EE; border-color: rgba(67,97,238,0.25); }
        .proj-action-btn.invoice:hover { background: rgba(67,97,238,0.07); }
        .proj-action-btn.danger { color: #E11D48; border-color: rgba(244,63,94,0.2); padding: 6px 10px; margin-left: auto; }
        .proj-action-btn.danger:hover { background: rgba(244,63,94,0.08); }

        /* ═══════════════════════════════
           GANTT CHART
        ═══════════════════════════════ */
        .gantt-wrap {
          background: #FFFFFF; border: 1px solid #E1E8F4;
          border-radius: 16px; overflow: hidden;
          box-shadow: 0 2px 12px rgba(15,23,42,0.06);
          font-family: var(--font-family,'DM Sans',sans-serif);
        }

        /* Header row */
        .gantt-header {
          display: grid; grid-template-columns: 260px 1fr;
          background: #F8FAFC; border-bottom: 1px solid #E8EEF8;
          height: 36px;
        }
        .gantt-header-label {
          display: flex; align-items: center;
          padding: 0 16px;
          font-size: 10.5px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; color: #94A3B8;
          border-right: 1px solid #E8EEF8;
        }
        .gantt-timeline-bar {
          position: relative; overflow: hidden;
        }

        /* Month ticks */
        .gantt-month-tick {
          position: absolute; top: 0; height: 100%;
          display: flex; flex-direction: column; align-items: flex-start;
          transform: translateX(-1px);
          pointer-events: none;
        }
        .gantt-month-line {
          width: 1px; height: 10px; background: #CBD5E1;
        }
        .gantt-month-tick span {
          font-size: 10px; font-weight: 700; color: #94A3B8;
          letter-spacing: 0.04em; text-transform: uppercase;
          padding: 1px 4px; white-space: nowrap;
        }

        /* Today vertical marker (header) */
        .gantt-today-marker {
          position: absolute; top: 0; bottom: 0; width: 2px;
          background: #F43F5E; z-index: 10; transform: translateX(-1px);
        }
        .gantt-today-tag {
          position: absolute; top: 4px; left: 5px;
          font-size: 9px; font-weight: 800; color: #F43F5E;
          text-transform: uppercase; letter-spacing: 0.06em;
          background: rgba(254,242,242,0.95); padding: 1px 5px;
          border-radius: 3px; white-space: nowrap;
        }

        /* Body rows */
        .gantt-body { display: flex; flex-direction: column; }
        .gantt-row {
          display: grid; grid-template-columns: 260px 1fr;
          min-height: 52px; border-bottom: 1px solid #F1F5F9;
        }
        .gantt-row:last-child { border-bottom: none; }
        .gantt-row:hover { background: #FAFBFF; }

        /* Left label column */
        .gantt-label-col {
          border-right: 1px solid #E8EEF8;
        }
        .gantt-row-label {
          display: flex; align-items: center; gap: 10px;
          padding: 0 12px 0 16px; background: #FAFBFC;
        }
        .gantt-row:hover .gantt-row-label { background: #F4F7FF; }
        .gantt-avatar {
          width: 30px; height: 30px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; flex-shrink: 0;
          font-family: var(--font-display,'Outfit',sans-serif);
        }
        .gantt-row-info { flex: 1; min-width: 0; }
        .gantt-row-title {
          font-size: 12.5px; font-weight: 700; color: #0F172A;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          font-family: var(--font-display,'Outfit',sans-serif);
        }
        .gantt-row-sub { font-size: 11px; color: #94A3B8; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gantt-stage-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .gantt-edit-btn {
          width: 24px; height: 24px; border-radius: 6px; border: 1px solid #E1E8F4;
          background: transparent; color: #94A3B8; display: flex; align-items: center;
          justify-content: center; cursor: pointer; transition: all 0.15s; flex-shrink: 0;
          opacity: 0;
        }
        .gantt-row:hover .gantt-edit-btn { opacity: 1; }
        .gantt-edit-btn:hover { background: #EEF2F8; color: #4361EE; border-color: #C7D2E8; }

        /* Track column */
        .gantt-track-col { }
        .gantt-track {
          position: relative; overflow: hidden;
          background: repeating-linear-gradient(
            90deg, transparent, transparent calc(100%/12 - 1px),
            rgba(203,213,225,0.25) calc(100%/12 - 1px), rgba(203,213,225,0.25) calc(100%/12)
          );
        }

        /* Today line per row */
        .gantt-row-today {
          position: absolute; top: 0; bottom: 0; width: 1.5px;
          background: rgba(244,63,94,0.3); z-index: 4; pointer-events: none;
        }

        /* Background full-duration bar */
        .gantt-bar-bg {
          position: absolute; top: 50%; transform: translateY(-50%);
          height: 20px; border-radius: 6px;
          background: transparent; border: 1.5px solid currentColor;
          opacity: 0.25; z-index: 1;
        }

        /* Filled progress bar */
        .gantt-bar {
          position: absolute; top: 50%; transform: translateY(-50%);
          height: 20px; border-radius: 6px;
          z-index: 2; box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          transition: box-shadow 0.2s;
        }
        .gantt-bar.ongoing {
          background-image: repeating-linear-gradient(
            45deg, rgba(255,255,255,0.12), rgba(255,255,255,0.12) 5px,
            transparent 5px, transparent 10px
          );
          background-blend-mode: overlay;
        }
        .gantt-bar:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.18); }

        /* Text label overlaid on bar */
        .gantt-bar-label {
          position: absolute; top: 50%; transform: translateY(-50%);
          z-index: 3; padding: 0 10px;
          font-size: 11px; font-weight: 700; color: #FFFFFF;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          pointer-events: none; text-shadow: 0 1px 2px rgba(0,0,0,0.25);
        }

        /* End date pin */
        .gantt-end-pin {
          position: absolute; top: 50%; transform: translate(-50%, -50%);
          width: 10px; height: 10px; border-radius: 50%;
          border: 2px solid #FFFFFF;
          box-shadow: 0 0 0 1.5px currentColor, 0 2px 6px rgba(0,0,0,0.15);
          z-index: 5;
        }

        .gantt-no-date {
          display: flex; align-items: center; gap: 7px; height: 100%;
          padding: 0 16px; font-size: 11.5px; color: #CBD5E1; font-style: italic;
        }

        /* Legend */
        .gantt-legend {
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
          padding: 10px 16px;
          background: #F8FAFC; border-top: 1px solid #E8EEF8;
        }
        .gantt-legend-item { display: flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 500; color: #64748B; }
        .gantt-legend-dot { width: 10px; height: 10px; border-radius: 50%; }
        .gantt-legend-bg { width: 24px; height: 8px; border-radius: 4px; border: 1.5px solid #64748B; opacity: 0.35; }
        .gantt-legend-fill { width: 24px; height: 8px; border-radius: 4px; }
        .gantt-empty { display: flex; align-items: center; justify-content: center; padding: 40px; color: #94A3B8; font-size: 13px; }
      `}</style>
    </div>
  );
}
