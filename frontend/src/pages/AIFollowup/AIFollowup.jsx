import React, { useState, useEffect } from 'react';
import { projectService, taskService } from '../../services/api';
import { projectFinanceService } from '../../services/projectFinanceService';
import { FaRobot, FaBriefcase, FaListCheck, FaTriangleExclamation, FaWandMagicSparkles, FaArrowRight, FaClock, FaFileInvoiceDollar } from 'react-icons/fa6';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './AIFollowup.css';

const AIFollowup = () => {
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'projects', 'tasks', 'invoices'
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch projects and tasks
                const [projectsData, tasksData, financesData] = await Promise.all([
                    projectService.getAll(),
                    taskService.getAll(),
                    projectFinanceService.getAll()
                ]);

                // Filter delayed projects
                // A project is delayed if custom delay > 0
                const delayedProjects = projectsData.filter(p => p.delay > 0);

                // Filter delayed tasks
                // A task is delayed if dueDate is past today AND status is not Completed
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Normalize to start of day

                const delayedTasks = tasksData.filter(t => {
                    if (t.values?.status === 'Completed' || t.values?.status === 'On Hold') return false;
                    if (!t.values?.dueDate) return false;

                    const dueDate = new Date(t.values.dueDate);
                    dueDate.setHours(0, 0, 0, 0);
                    return dueDate < today;
                });

                // Filter delayed invoices (milestones in project_finances)
                const delayedInvoices = [];
                (financesData || []).forEach(financeData => {
                    if (financeData.milestones && Array.isArray(financeData.milestones)) {
                        financeData.milestones.forEach(milestone => {
                            if (milestone.status === 'Overdue' || (milestone.status === 'Raised' && milestone.invoiceDate)) {
                                const invDate = new Date(milestone.invoiceDate);
                                invDate.setHours(0, 0, 0, 0);
                                const diffTime = Math.abs(today - invDate);
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                // Raised and older than 15 days is considered delayed
                                if (milestone.status === 'Overdue' || diffDays > 15) {
                                    delayedInvoices.push({
                                        ...milestone,
                                        projectDetails: financeData,
                                        ageing: diffDays
                                    });
                                }
                            }
                        });
                    }
                });

                setProjects(delayedProjects);
                setTasks(delayedTasks);
                setInvoices(delayedInvoices);
            } catch (error) {
                console.error("Failed to fetch data for AI Followup", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const generateAIMessage = (item, type) => {
        if (type === 'project') {
            const delay = item.delay || 0;
            if (delay > 5) return "Critical delay. Suggesting immediate client meeting and resource reallocation to unblock stage.";
            if (delay > 2) return "Moderate delay detected. Consider sending an automated update to the client asking for required inputs.";
            return "Slight delay. Automated ping sent to the lead owner to check status.";
        } else if (type === 'task') {
            const dueDate = new Date(item.values?.dueDate);
            const today = new Date();
            const diffTime = Math.abs(today - dueDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 3) return "Task is significantly overdue. Suggesting escalation to manager or reassignment if blocker is persistent.";
            return "Task missed deadline. Suggesting a quick check-in with the assignee.";
        } else if (type === 'invoice') {
            if (item.status === 'Overdue' || item.ageing > 30) return "Invoice is severely overdue. Suggesting an immediate payment follow-up call with the client.";
            return "Payment is delayed. Suggesting sending a polite automated email reminder appending the invoice PDF.";
        }
    };

    const handleActionClick = (type, item) => {
        if (type === 'project') {
            navigate('/sales');
        } else if (type === 'task') {
            navigate('/todolist');
        } else if (type === 'invoice') {
            // Re-route to Invoice page and pass the project as state
            navigate('/invoice', { state: { project: item.projectDetails } });
        }
    };

    const renderProjectAlert = (project) => {
        return (
            <div key={project.id} className="alert-card project-alert">
                <div className="alert-header">
                    <div className="alert-title-row">
                        <div className="alert-icon-wrapper">
                            <FaBriefcase size={20} />
                        </div>
                        <div>
                            <h4 className="alert-title">{project.title || project.clientName || `Project #${project.customId || project.id.slice(0, 6)}`}</h4>
                            <p className="alert-meta">Client: {project.clientName} • Stage: {project.activeStage}</p>
                        </div>
                    </div>
                    <div className="delay-badge">
                        <FaClock className="me-1" /> {project.delay} Days Delayed
                    </div>
                </div>

                <div className="ai-suggestion-box">
                    <FaWandMagicSparkles className="ai-icon" size={18} />
                    <div>
                        <p className="ai-suggestion-text">
                            <strong>AI Insight:</strong> {generateAIMessage(project, 'project')}
                        </p>
                    </div>
                </div>

                <div className="alert-actions">
                    <Button variant="outline-secondary" size="sm" onClick={() => handleActionClick('project', project)}>
                        View Details
                    </Button>
                    <Button variant="primary" size="sm" className="d-flex align-items-center gap-2">
                        Draft Client Email <FaArrowRight size={12} />
                    </Button>
                </div>
            </div>
        );
    };

    const renderTaskAlert = (task) => {
        const title = task.values?.title || 'Unknown Task';
        const priority = task.values?.priority || 'Normal';
        const dueDate = new Date(task.values?.dueDate).toLocaleDateString();

        return (
            <div key={task.firebaseId || task.id} className="alert-card task-alert">
                <div className="alert-header">
                    <div className="alert-title-row">
                        <div className="alert-icon-wrapper">
                            <FaListCheck size={20} />
                        </div>
                        <div>
                            <h4 className="alert-title">{title}</h4>
                            <p className="alert-meta">Priority: {priority} • Due: {dueDate}</p>
                        </div>
                    </div>
                    <div className="delay-badge">
                        <FaTriangleExclamation className="me-1" /> Overdue
                    </div>
                </div>

                <div className="ai-suggestion-box">
                    <FaWandMagicSparkles className="ai-icon" size={18} />
                    <div>
                        <p className="ai-suggestion-text">
                            <strong>AI Insight:</strong> {generateAIMessage(task, 'task')}
                        </p>
                    </div>
                </div>

                <div className="alert-actions">
                    <Button variant="outline-secondary" size="sm" onClick={() => handleActionClick('task', task)}>
                        View Task
                    </Button>
                    <Button variant="warning" size="sm" className="text-white d-flex align-items-center gap-2">
                        Ping Assignee <FaArrowRight size={12} />
                    </Button>
                </div>
            </div>
        );
    };

    const renderInvoiceAlert = (invoice) => {
        const clientName = invoice.projectDetails?.clientName || 'Unknown Client';
        const projectTitle = invoice.projectDetails?.clientName || 'Project';
        const dealValue = invoice.projectDetails?.dealValue || 0;
        const raisedAmount = (dealValue * (invoice.percentage || 0)) / 100;

        return (
            <div key={invoice.id} className="alert-card invoice-alert">
                <div className="alert-header">
                    <div className="alert-title-row">
                        <div className="alert-icon-wrapper">
                            <FaFileInvoiceDollar size={20} />
                        </div>
                        <div>
                            <h4 className="alert-title">Payment: {invoice.name}</h4>
                            <p className="alert-meta">{clientName} • Value: {raisedAmount.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="delay-badge">
                        <FaClock className="me-1" /> {invoice.ageing} Days Open
                    </div>
                </div>

                <div className="ai-suggestion-box">
                    <FaWandMagicSparkles className="ai-icon" size={18} />
                    <div>
                        <p className="ai-suggestion-text">
                            <strong>AI Insight:</strong> {generateAIMessage(invoice, 'invoice')}
                        </p>
                    </div>
                </div>

                <div className="alert-actions">
                    <Button variant="outline-secondary" size="sm" onClick={() => handleActionClick('invoice', invoice)}>
                        View Tracker
                    </Button>
                    <Button variant="danger" size="sm" className="d-flex align-items-center gap-2">
                        Send Payment Reminder <FaArrowRight size={12} />
                    </Button>
                </div>
            </div>
        );
    };

    const getDisplayedItems = () => {
        let items = [];
        if (activeTab === 'all' || activeTab === 'projects') {
            items = [...items, ...projects.map(p => ({ type: 'project', data: p }))];
        }
        if (activeTab === 'all' || activeTab === 'tasks') {
            items = [...items, ...tasks.map(t => ({ type: 'task', data: t }))];
        }
        if (activeTab === 'all' || activeTab === 'invoices') {
            items = [...items, ...invoices.map(i => ({ type: 'invoice', data: i }))];
        }
        return items;
    };

    const displayedItems = getDisplayedItems();

    return (
        <div className="ai-followup-page">
            <div className="ai-header-section">
                <div>
                    <h2 className="ai-header-title">
                        <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', padding: '10px', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center' }}>
                            <FaRobot size={24} />
                        </div>
                        AI Followup & Alerts
                    </h2>
                    <p className="ai-header-subtitle">Intelligent monitoring of your projects and tasks to keep everything on track.</p>
                </div>

                <div className="d-flex gap-2">
                    <Button variant="outline-primary" size="sm" onClick={() => window.location.reload()}>
                        <FaClock className="me-2" /> Refresh Scan
                    </Button>
                </div>
            </div>

            <div className="ai-tabs">
                <button className={`ai-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
                    All Alerts ({projects.length + tasks.length + invoices.length})
                </button>
                <button className={`ai-tab ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>
                    Projects ({projects.length})
                </button>
                <button className={`ai-tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
                    Tasks ({tasks.length})
                </button>
                <button className={`ai-tab ${activeTab === 'invoices' ? 'active' : ''}`} onClick={() => setActiveTab('invoices')}>
                    Invoices ({invoices.length})
                </button>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted mt-3">AI is analyzing your workspace...</p>
                </div>
            ) : displayedItems.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <FaRobot size={32} />
                    </div>
                    <h3>You're All Caught Up!</h3>
                    <p>Great job! There are no delayed projects or overdue tasks requiring your attention right now.</p>
                </div>
            ) : (
                <div className="alerts-container">
                    {displayedItems.map((item, index) => {
                        if (item.type === 'project') return renderProjectAlert(item.data);
                        if (item.type === 'invoice') return renderInvoiceAlert(item.data);
                        return renderTaskAlert(item.data);
                    })}
                </div>
            )}
        </div>
    );
};

export default AIFollowup;
