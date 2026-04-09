import React, { useState, useEffect } from 'react';
import { projectService } from '../../services/api';
import { useToast } from '../../components/Toast/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { FaPlus, FaTrash, FaPenToSquare } from 'react-icons/fa6';
import { Clock, FileText, AlertCircle, CheckCircle2, Layers, ChevronRight, Search, X } from 'lucide-react';
import { Modal, Form, Button, FloatingLabel } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import PageToolbar from '../../components/PageToolbar/PageToolbar';
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

function ProjectCard({ project, onEdit, onDelete, onInvoice, index }) {
  const navigate = useNavigate();
  const stage = project.activeStage ?? 0;
  const stageLabel = STAGE_LABELS[stage] || `Stage ${stage}`;
  const stageColor = STAGE_COLORS[stage] || '#64748B';
  const progress = Math.round((stage / Math.max(STAGE_LABELS.length - 1, 1)) * 100);
  const isDelayed = (project.delay || 0) > 0;
  const isWon = stage === 4;
  const isLost = stage === 6;
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
      {/* Top accent strip */}
      <div className="proj-card-strip" style={{ background: stageColor }} />

      {/* Header */}
      <div className="proj-card-header">
        <div className="proj-client-avatar" style={{ background: `${clientColor}18`, color: clientColor }}>
          {initials}
        </div>
        <div className="proj-card-meta">
          <div className="proj-card-title">{project.title || 'Untitled Project'}</div>
          <div className="proj-card-client">{project.clientName || 'No Client'}</div>
        </div>
        {isDelayed && (
          <div className="proj-delay-badge">
            <AlertCircle size={11} />
            {project.delay}d delay
          </div>
        )}
        {isWon && !isDelayed && (
          <div className="proj-won-badge">
            <CheckCircle2 size={11} />
            Won
          </div>
        )}
      </div>

      {/* Stage + Progress */}
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

      {/* Type + Info */}
      <div className="proj-card-info-row">
        <span className="proj-type-tag" style={{ color: typeMeta.color, background: typeMeta.bg }}>
          <Layers size={10} />
          {project.type || 'Standard'}
        </span>
        {project.customId && (
          <span className="proj-id-tag">#{project.customId}</span>
        )}
      </div>

      {/* Actions */}
      <div className="proj-card-actions">
        <button className="proj-action-btn" onClick={() => onEdit(project)} title="Edit">
          <FaPenToSquare size={13} />
          Edit
        </button>
        <button className="proj-action-btn invoice" onClick={() => onInvoice(project.id)} title="Invoices">
          <FileText size={13} />
          Invoice
        </button>
        <button className="proj-action-btn danger" onClick={() => onDelete(project.id)} title="Delete">
          <FaTrash size={12} />
        </button>
      </div>
    </motion.div>
  );
}

export default function Projects() {
  const { themeColor } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');

  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({ title: '', clientName: '', type: 'Standard' });

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setProjects((await projectService.getAll()) || []);
    } catch (e) {
      console.error('Failed to load projects', e);
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
    } catch (e) {
      toast.error('Failed to delete project');
    }
  };

  const handleOpenModal = (project = null) => {
    setEditingProject(project);
    setFormData(project
      ? { title: project.title, clientName: project.clientName, type: project.type }
      : { title: '', clientName: '', type: 'Standard' }
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
    } catch (e) {
      toast.error('Failed to save project');
    }
  };

  const types = ['All', ...new Set(projects.map(p => p.type || 'Standard'))];

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search || p.title?.toLowerCase().includes(q) || p.clientName?.toLowerCase().includes(q);
    const matchType = filterType === 'All' || p.type === filterType;
    return matchSearch && matchType;
  });

  const stats = [
    { label: 'Total', value: projects.length, color: '#4361EE' },
    { label: 'Active', value: projects.filter(p => p.activeStage < 4 && p.activeStage !== 6).length, color: '#10B981' },
    { label: 'Won', value: projects.filter(p => p.activeStage === 4).length, color: '#8B5CF6' },
    { label: 'Delayed', value: projects.filter(p => (p.delay || 0) > 0).length, color: '#F43F5E' },
  ];

  return (
    <div className="projects-page">
      {/* Page header */}
      <div className="projects-header">
        <div className="projects-title-block">
          <h2 className="projects-title">Projects</h2>
          <p className="projects-subtitle">{filtered.length} of {projects.length} projects</p>
        </div>

        {/* Stats pills */}
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
          <FaPlus size={13} />
          New Project
        </button>
      </div>

      {/* Toolbar */}
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
            <button className="projects-search-clear" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>
        <div className="projects-type-filters">
          {types.map(t => (
            <button
              key={t}
              className={`projects-type-btn ${filterType === t ? 'active' : ''}`}
              style={filterType === t ? { color: themeColor, borderColor: themeColor, background: `${themeColor}10` } : {}}
              onClick={() => setFilterType(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="projects-loading">
          <div className="projects-spinner" style={{ borderTopColor: themeColor }} />
          <p>Loading projects…</p>
        </div>
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
            <ProjectCard
              key={p.id}
              project={p}
              index={i}
              onEdit={handleOpenModal}
              onDelete={handleDelete}
              onInvoice={(id) => navigate(`/invoice?projectId=${id}`)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
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
          max-width: 1600px;
          margin: 0 auto;
          font-family: var(--font-family, 'DM Sans', sans-serif);
        }
        .projects-header {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .projects-title-block { flex: 0 0 auto; }
        .projects-title {
          font-family: var(--font-display, 'Outfit', sans-serif);
          font-size: 22px; font-weight: 800;
          color: #0F172A; margin: 0; letter-spacing: -0.03em;
        }
        .projects-subtitle { font-size: 12px; color: #94A3B8; margin: 2px 0 0; }
        .projects-stats-row { display: flex; gap: 10px; flex-wrap: wrap; flex: 1; }
        .projects-stat-pill {
          display: flex; align-items: center; gap: 8px;
          background: #FFFFFF; border: 1px solid #E1E8F4;
          border-radius: 999px; padding: 6px 14px;
          box-shadow: 0 1px 4px rgba(15,23,42,0.05);
        }
        .ps-value {
          font-family: var(--font-display, 'Outfit', sans-serif);
          font-size: 16px; font-weight: 800; letter-spacing: -0.03em;
        }
        .ps-label { font-size: 11.5px; font-weight: 500; color: #94A3B8; }
        .projects-add-btn {
          display: flex; align-items: center; gap: 7px;
          color: #fff; border: none; padding: 9px 18px;
          border-radius: 10px; font-size: 13px; font-weight: 700;
          cursor: pointer; white-space: nowrap;
          font-family: var(--font-family, 'DM Sans', sans-serif);
          transition: filter 0.15s, transform 0.15s;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .projects-add-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .projects-add-btn.small { margin-top: 12px; }
        .projects-toolbar {
          display: flex; align-items: center; gap: 14px;
          flex-wrap: wrap; margin-bottom: 22px;
        }
        .projects-search-wrap {
          position: relative; flex: 1; min-width: 220px; max-width: 360px;
        }
        .projects-search-icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%); color: #94A3B8;
        }
        .projects-search {
          width: 100%; padding: 9px 36px 9px 36px;
          border: 1px solid #E1E8F4; border-radius: 10px;
          font-size: 13px; font-family: var(--font-family, 'DM Sans', sans-serif);
          background: #fff; color: #0F172A;
          transition: border-color 0.15s, box-shadow 0.15s;
          outline: none;
        }
        .projects-search:focus {
          border-color: var(--accent-primary, #4361EE);
          box-shadow: 0 0 0 3px rgba(67,97,238,0.1);
        }
        .projects-search-clear {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%); background: none;
          border: none; cursor: pointer; color: #94A3B8; padding: 2px;
        }
        .projects-type-filters { display: flex; gap: 6px; flex-wrap: wrap; }
        .projects-type-btn {
          padding: 7px 14px; border-radius: 9px;
          border: 1px solid #E1E8F4; background: #fff;
          font-size: 12px; font-weight: 600; cursor: pointer;
          color: #64748B; transition: all 0.15s;
          font-family: var(--font-family, 'DM Sans', sans-serif);
        }
        .projects-type-btn:hover { background: #F4F7FD; color: #334155; }
        .projects-type-btn.active { font-weight: 700; }

        .projects-loading, .projects-empty {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          min-height: 260px; gap: 8px;
          color: #94A3B8; font-size: 14px; font-weight: 500;
        }
        .projects-spinner {
          width: 32px; height: 32px;
          border: 3px solid #E1E8F4;
          border-top-color: #4361EE;
          border-radius: 50%;
          animation: pspin 0.75s linear infinite;
        }
        @keyframes pspin { to { transform: rotate(360deg); } }

        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 18px;
        }

        /* ── Project Card ── */
        .proj-card {
          background: #FFFFFF;
          border: 1px solid #E1E8F4;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(15,23,42,0.06);
          transition: box-shadow 0.25s, transform 0.25s;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .proj-card:hover {
          box-shadow: 0 8px 28px rgba(67,97,238,0.1);
          transform: translateY(-3px);
        }
        .proj-card-strip {
          height: 3px; width: 100%;
          border-radius: 16px 16px 0 0;
          flex-shrink: 0;
        }
        .proj-card-header {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 16px 18px 10px;
        }
        .proj-client-avatar {
          width: 38px; height: 38px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800; flex-shrink: 0;
          font-family: var(--font-display, 'Outfit', sans-serif);
          letter-spacing: 0.02em;
        }
        .proj-card-meta { flex: 1; min-width: 0; }
        .proj-card-title {
          font-size: 14px; font-weight: 700;
          color: #0F172A; line-height: 1.3;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          font-family: var(--font-display, 'Outfit', sans-serif);
          letter-spacing: -0.02em;
        }
        .proj-card-client { font-size: 11.5px; color: #94A3B8; margin-top: 2px; font-weight: 500; }
        .proj-delay-badge {
          display: flex; align-items: center; gap: 4px;
          font-size: 10.5px; font-weight: 700;
          background: rgba(244,63,94,0.1); color: #E11D48;
          border: 1px solid rgba(244,63,94,0.2);
          padding: 3px 9px; border-radius: 999px; white-space: nowrap;
          flex-shrink: 0;
        }
        .proj-won-badge {
          display: flex; align-items: center; gap: 4px;
          font-size: 10.5px; font-weight: 700;
          background: rgba(16,185,129,0.1); color: #059669;
          border: 1px solid rgba(16,185,129,0.2);
          padding: 3px 9px; border-radius: 999px; white-space: nowrap;
          flex-shrink: 0;
        }
        .proj-card-stage-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 18px 8px;
        }
        .proj-stage-pill {
          font-size: 11px; font-weight: 700;
          padding: 3px 10px; border-radius: 999px;
          letter-spacing: 0.02em;
        }
        .proj-progress-pct {
          font-size: 12px; font-weight: 800;
          font-family: var(--font-display, 'Outfit', sans-serif);
          letter-spacing: -0.02em;
        }
        .proj-progress-track {
          height: 4px; background: #EEF2F8;
          margin: 0 18px 14px; border-radius: 999px; overflow: hidden;
        }
        .proj-progress-fill { height: 100%; border-radius: 999px; }
        .proj-card-info-row {
          display: flex; align-items: center; gap: 8px;
          padding: 0 18px 14px; flex-wrap: wrap;
        }
        .proj-type-tag {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 700; padding: 3px 9px;
          border-radius: 7px; letter-spacing: 0.02em;
        }
        .proj-id-tag {
          font-size: 10.5px; font-weight: 600;
          color: #94A3B8; letter-spacing: 0.04em;
        }
        .proj-card-actions {
          display: flex; align-items: center; gap: 6px;
          padding: 12px 18px;
          border-top: 1px solid #EEF2F8;
          background: #F8FAFC;
          margin-top: auto;
        }
        .proj-action-btn {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 600;
          padding: 6px 12px; border-radius: 8px;
          border: 1px solid #E1E8F4; background: #fff;
          color: #475569; cursor: pointer;
          font-family: var(--font-family, 'DM Sans', sans-serif);
          transition: all 0.15s;
        }
        .proj-action-btn:hover { background: #F4F7FD; color: #0F172A; border-color: #C7D2E8; }
        .proj-action-btn.invoice { color: #4361EE; border-color: rgba(67,97,238,0.25); }
        .proj-action-btn.invoice:hover { background: rgba(67,97,238,0.07); }
        .proj-action-btn.danger {
          color: #E11D48; border-color: rgba(244,63,94,0.2);
          padding: 6px 10px; margin-left: auto;
        }
        .proj-action-btn.danger:hover { background: rgba(244,63,94,0.08); }
      `}</style>
    </div>
  );
}
