import React, { useState, useEffect } from 'react';
import { projectService } from '../../services/api';
import { useToast } from '../../components/Toast/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { FaChartColumn, FaPlus, FaTrash, FaPenToSquare } from 'react-icons/fa6';
import { Clock, FileText } from 'lucide-react';
import { Modal, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function Projects() {
    const { themeColor } = useTheme();
    const toast = useToast();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [formData, setFormData] = useState({ title: '', clientName: '', type: 'Standard' });

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const data = await projectService.getAll();
            setProjects(data || []);
        } catch (error) {
            console.error('Failed to load projects', error);
            toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this project?")) return;
        try {
            await projectService.delete(id);
            setProjects(projects.filter(p => p.id !== id));
            toast.success('Project deleted');
        } catch (error) {
            console.error('Failed to delete project', error);
            toast.error('Failed to delete project');
        }
    };

    const filteredProjects = projects.filter(p => 
        p.title?.toLowerCase().includes(search.toLowerCase()) || 
        p.clientName?.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpenModal = (project = null) => {
        if (project) {
            setEditingProject(project);
            setFormData({ title: project.title, clientName: project.clientName, type: project.type });
        } else {
            setEditingProject(null);
            setFormData({ title: '', clientName: '', type: 'Standard' });
        }
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
        } catch (error) {
            console.error('Failed to save project', error);
            toast.error('Failed to save project');
        }
    };

    return (
        <div className="p-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold mb-0 text-slate-800 d-flex align-items-center gap-2">
                    <FaChartColumn style={{ color: themeColor }} /> Active Projects Directory
                </h4>
                <div className="d-flex gap-3">
                    <input 
                        type="text" 
                        placeholder="Search projects by name..." 
                        className="form-control"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ width: '250px', borderRadius: '8px' }}
                    />
                    <button onClick={() => handleOpenModal()} className="btn text-white fw-bold d-flex align-items-center gap-2" style={{ backgroundColor: themeColor, borderRadius: '8px' }}>
                        <FaPlus /> New Project
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="d-flex justify-content-center p-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <div className="row g-4">
                    {filteredProjects.length === 0 ? (
                        <div className="col-12 text-center p-5 text-slate-500 bg-white rounded-4 border border-slate-200">
                            No projects found. Create one to get started!
                        </div>
                    ) : (
                        filteredProjects.map((p) => (
                            <div className="col-12 col-md-6 col-lg-4" key={p.id}>
                                <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                                    <div className="card-header border-0 bg-white d-flex justify-content-between align-items-center pt-4 pb-2 px-4">
                                        <div className="d-flex align-items-center gap-2">
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: p.delay > 0 ? '#ef4444' : '#10b981' }}></div>
                                            <span className="fw-bold text-slate-800 fs-5">{p.title || 'Untitled'}</span>
                                        </div>
                                    </div>
                                    <div className="card-body px-4 py-3">
                                        <div className="d-flex justify-content-between mb-3">
                                            <div>
                                                <small className="text-slate-400 d-block uppercase fw-bold" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Client</small>
                                                <span className="text-slate-700 fw-medium">{p.clientName || 'N/A'}</span>
                                            </div>
                                            <div className="text-end">
                                                <small className="text-slate-400 d-block uppercase fw-bold" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>Status</small>
                                                <span className="text-slate-700 fw-medium">Stage {p.activeStage || 0}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="d-flex align-items-center justify-content-between">
                                            <span className="badge rounded-pill text-dark" style={{ backgroundColor: 'rgba(0,0,0,0.05)', fontWeight: '500' }}>
                                                {p.type || 'Standard'}
                                            </span>
                                            {p.delay > 0 && <span className="text-danger fw-bold fs-6 d-flex align-items-center gap-1"><Clock size={14}/> Delay: {p.delay}d</span>}
                                        </div>
                                    </div>
                                    <div className="card-footer bg-slate-50 border-0 p-3 d-flex gap-2 justify-content-end">
                                        <button onClick={() => handleOpenModal(p)} className="btn btn-sm btn-light border-slate-200 text-slate-600 rounded-lg" title="Edit">
                                            <FaPenToSquare />
                                        </button>
                                        <button onClick={() => navigate(`/invoice?projectId=${p.id}`)} className="btn btn-sm btn-light border-slate-200 text-slate-600 rounded-lg" title="Invoices">
                                            <FileText size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(p.id)} className="btn btn-sm text-danger border border-danger bg-danger bg-opacity-10 rounded-lg" title="Delete">
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{editingProject ? 'Edit Project' : 'New Project'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSave}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Project Title</Form.Label>
                            <Form.Control required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Website Redesign" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Client Name</Form.Label>
                            <Form.Control required type="text" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} placeholder="e.g. Acme Corp" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Project Type</Form.Label>
                            <Form.Select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                <option value="Standard">Standard</option>
                                <option value="Product">Product</option>
                                <option value="Service">Service</option>
                                <option value="Internal">Internal</option>
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" style={{ backgroundColor: themeColor, borderColor: themeColor }}>Save Project</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
}
