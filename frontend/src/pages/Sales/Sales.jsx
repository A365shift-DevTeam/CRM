import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Contact, Settings, Plus, CheckCircle, Trash2, Briefcase, DollarSign, Timer, Flag, AlertTriangle, ArrowUpRight, Search, Monitor, Phone, FileText, MessageSquare, Edit, Clock } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa6'
import { Button, Modal, Form, Dropdown } from 'react-bootstrap'
import './Sales.css'
import StageSettingsModal from './StageSettingsModal'
import BusinessProcessModal from './BusinessProcessModal'
import { projectService } from '../../services/api'
import { incomeService } from '../../services/incomeService'
import { projectFinanceService } from '../../services/projectFinanceService'
import { useToast } from '../../components/Toast/ToastContext'

const getDefaultStages = () => [
    { id: 0, label: 'Demo', color: 'cyan', ageing: 7 },
    { id: 1, label: 'Proposal', color: 'gray', ageing: 15 },
    { id: 2, label: 'Negotiation', color: 'gray', ageing: 30 },
    { id: 3, label: 'Approval', color: 'gray', ageing: 15 },
    { id: 4, label: 'Won', color: 'green', ageing: 30 },
    { id: 5, label: 'Closed', color: 'green', ageing: 90 },
    { id: 6, label: 'Lost', color: 'orange', ageing: 60 },
]

const STAGE_STORAGE_KEYS = {
    Product: 'sales_stages_product',
    Service: 'sales_stages_service'
}

const getStoredStages = (type) => {
    try {
        const stored = localStorage.getItem(STAGE_STORAGE_KEYS[type])
        return stored ? JSON.parse(stored) : getDefaultStages()
    } catch (e) {
        console.error('Failed to load stages', e)
        return getDefaultStages()
    }
}

const GenerateCustomId = (brandingName, clientName) => {
    const today = new Date();
    const date = String(today.getDate()).padStart(2, '0');
    const year = String(today.getFullYear()).slice(-2);
    const brandCode = (brandingName || 'A3').substring(0, 2).toUpperCase();
    const clientCode = (clientName || 'C').slice(-1).toUpperCase();
    return `${date}${brandCode}${clientCode}${year}`;
}

const SalesCard = ({ projectId, project, stages, activeStage, onStageChange, onDelete, onEdit, onInvoice, onTimesheet, delay, clientName, brandingName, title, history = [] }) => {
    const toast = useToast()
    const [showNotification, setShowNotification] = useState(false)
    const [stageTransition, setStageTransition] = useState({ from: '', to: '' })

    const getClientData = (id) => {
        const clients = [
            { name: 'Lucs TVS', color: '#10b981' },
            { name: 'Action Board', color: '#e879f9' },
            { name: 'Ask Invest', color: '#f59e0b' },
            { name: 'Tech Corp', color: '#3b82f6' },
            { name: 'Global Systems', color: '#6366f1' }
        ];
        // Handle numeric or string ID
        let hash = 0;
        const strId = String(id);
        for (let i = 0; i < strId.length; i++) {
            hash = strId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return clients[Math.abs(hash) % clients.length];
    }

    // Use prop if available, else mock
    // If clientName is passed as prop, we try to match a color or generate one?
    // For now, if passed, we just use a default color or hash it.
    const mockClient = getClientData(projectId);

    // Determine display Client
    const displayClient = clientName ? { name: clientName, color: mockClient.color } : mockClient;
    const client = displayClient;

    // Calculate Progress Percentage
    const maxStageIndex = stages.length > 0 ? stages.length - 1 : 1;
    const rawPercentage = (activeStage / maxStageIndex) * 100;
    const progressPercentage = Math.min(100, Math.round(rawPercentage));

    const handleDragStart = (e) => {
        e.dataTransfer.setData('text/plain', activeStage)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        e.currentTarget.classList.add('drag-over')
    }

    const handleDrop = (e, index) => {
        e.preventDefault()
        e.currentTarget.classList.remove('drag-over')

        // Open modal for confirmation and data entry
        if (index !== activeStage) {
            setStageTransition({
                from: stages[activeStage]?.label || 'Unknown',
                to: stages[index]?.label || 'Unknown'
            })
            // Do NOT update stage yet - wait for modal save
            setShowNotification(true)
        }
    }

    const handleStageClick = (index) => {
        // Open modal for confirmation/history regardless of whether it's the active stage
        setStageTransition({
            from: stages[activeStage]?.label || 'Unknown',
            to: stages[index]?.label || 'Unknown'
        })
        setShowNotification(true)
    }

    return (
        <div className="sales-card d-block">
            {/* Title Row - Top */}
            <div className="text-dark fw-semibold mb-1 text-center" style={{ fontSize: '13px' }}>
                {title || 'Untitled Project'}
            </div>

            {/* Header Row: ID and Icons */}
            <div className="d-flex justify-content-between align-items-start mb-0">
                <div>
                    <div className="project-id">Project ID: #{project.customId || String(projectId).slice(-6).toUpperCase()}</div>
                    <div className="d-flex flex-column">
                        <span className="text-secondary" style={{ fontSize: '13px', fontWeight: '500' }}>
                            {delay > 0 ? `Delay ${delay} Days` : 'On Track'}
                        </span>
                        <span className="fw-bold fs-6">{progressPercentage}%</span>
                    </div>
                </div>

                <div className="card-icons-row">
                    <Edit
                        size={16}
                        className="icon-outline icon-edit"
                        strokeWidth={1.5}
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                        title="Edit Project"
                    />
                    <Clock
                        size={16}
                        className="icon-outline icon-edit"
                        strokeWidth={1.5}
                        onClick={(e) => {
                            e.stopPropagation();
                            onTimesheet();
                        }}
                        title="Add Timesheet Entry"
                        style={{ cursor: 'pointer' }}
                    />
                    <FileText
                        size={18}
                        className="icon-outline"
                        strokeWidth={1.5}
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onInvoice();
                        }}
                        title="Create Invoice"
                    />
                    <FaWhatsapp
                        size={17}
                        className="icon-outline icon-whatsapp"
                        style={{ cursor: 'pointer', color: "rgb(35, 144, 154)" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            const phone = project.phone || '';
                            if (phone) {
                                window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank');
                            } else {
                                toast.warning('No phone number available for this client.');
                            }
                        }}
                        title="WhatsApp Client"
                    />
                    <Trash2
                        size={16}
                        className="icon-outline icon-delete"
                        strokeWidth={1.5}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this project?')) {
                                onDelete()
                            }
                        }}
                    />
                </div>
            </div>

            {/* Main Row: Branding - Pipeline - Client */}
            <div className="d-flex align-items-center justify-content-center position-relative" style={{ minHeight: '50px' }}>

                {/* Left: Branding */}
                <div className="branding-section d-flex align-items-center" style={{ zIndex: 2 }}>
                    <h4 className="fw-bold mb-0">
                        {brandingName && brandingName !== 'A365Shift' ? (
                            <span style={{ color: '#003366' }}>{brandingName}</span>
                        ) : (
                            <>
                                <span style={{ color: '#003366' }}>A365</span>
                                <span style={{ color: '#ef4444' }}>Shift</span>
                            </>
                        )}
                    </h4>
                    {/* Connecting Line to start of pipeline */}
                    <div style={{ width: '20px', height: '2px', background: '#e5e7eb', marginLeft: '5px' }}></div>
                </div>

                {/* Center: Pipeline Container */}
                <div className="px-3 d-flex flex-column align-items-center" style={{ minWidth: 0 }}>

                    {/* Stages Row */}
                    <div className="pipeline-wrapper w-100 d-flex align-items-center justify-content-center">
                        {stages.map((stage, index) => {
                            const isLast = index === stages.length - 1;
                            const isActive = index === activeStage;
                            const isPast = index < activeStage;

                            // Colors based on status
                            // Past = Greenish circle
                            // Active = Gold/Yellowish border & circle
                            // Future = Gray
                            const activeColor = '#eab308'; // Gold/Yellow
                            const pastColor = '#86efac'; // Light Green
                            const futureColor = '#e5e7eb'; // Light Gray

                            // Calculate days in current stage for Ageing color
                            let isOverdue = false;
                            if (isActive) {
                                // Find the latest entry in history that matches this stage start
                                // Since we use arrayUnion, history might not be strictly newest-first. Find by timestamp.
                                const sortedHistory = history && history.length > 0 ? [...history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) : [];
                                const lastUpdate = sortedHistory.length > 0 ? new Date(sortedHistory[0].timestamp) : new Date(); // Fallback to now if no history
                                const diffTime = Math.abs(new Date() - lastUpdate);
                                const daysInStage = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                if (daysInStage > (stage.ageing || 0)) {
                                    isOverdue = true;
                                }
                            }
                            const ageingColor = isOverdue ? '#ef4444' : '#0f172a'; // Red if overdue, else dark blue

                            return (
                                <div key={index} className="d-flex align-items-center">
                                    {/* Stage Card */}
                                    <div className="position-relative">
                                        {/* Running Man Icon (Absolute above active) */}
                                        {isActive && (
                                            <div
                                                className="position-absolute start-50 translate-middle-x"
                                                style={{ top: '-28px', zIndex: 10, cursor: 'grab' }}
                                                draggable="true"
                                                onDragStart={handleDragStart}
                                            >
                                                <i className="fa-solid fa-person-running" style={{ color: '#116454', fontSize: '22px' }}></i>
                                            </div>
                                        )}

                                        {/* The Card Itself */}
                                        <div
                                            className={`stage-card d-flex align-items-center justify-content-center px-3 py-2`}
                                            onClick={() => handleStageClick(index)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, index)}
                                            style={{
                                                background: isPast ? '#10b981' : 'white',
                                                border: isActive ? `2px solid ${activeColor}` : (isPast ? '1px solid #10b981' : '1px solid #e5e7eb'),
                                                borderRadius: '12px',
                                                minWidth: '90px',
                                                height: '30px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                                cursor: 'pointer',
                                                color: isPast ? '#ffffff' : (index > activeStage ? '#9ca3af' : '#1f2937'),
                                                fontWeight: isActive ? '600' : '400',
                                                fontSize: '12px',
                                                zIndex: 2,
                                                position: 'relative'
                                            }}
                                        >
                                            {stage.label}
                                        </div>
                                    </div>

                                    {/* Connector (if not last) */}
                                    {!isLast && (
                                        <div className="d-flex align-items-center" style={{ width: '40px', position: 'relative' }}>
                                            {/* Line Part 1 */}
                                            <div style={{ flex: 1, height: '2px', background: '#e5e7eb' }}></div>

                                            {/* Ageing Circle */}
                                            <div
                                                className="rounded-circle d-flex align-items-center justify-content-center"
                                                style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    background: isPast ? pastColor : (isActive ? activeColor : futureColor),
                                                    color: isActive ? ageingColor : '#0f172a',
                                                    fontSize: '11px',
                                                    fontWeight: '800',
                                                    zIndex: 3,
                                                    flexShrink: 0
                                                }}
                                            >
                                                {stage.ageing || 0}
                                            </div>

                                            {/* Line Part 2 */}
                                            <div style={{ flex: 1, height: '2px', background: '#e5e7eb' }}></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Client */}
                <div className="client-section d-flex align-items-center text-end" style={{ zIndex: 2 }}>
                    {/* Connecting Line from pipeline end */}
                    <div style={{ width: '20px', height: '2px', background: '#e5e7eb', marginRight: '5px' }}></div>
                    <h5 className="fw-bold mb-0" style={{ color: client.color }}>
                        {client.name}
                    </h5>
                </div>
            </div>



            {/* Business Process Modal */}
            <BusinessProcessModal
                show={showNotification}
                handleClose={() => setShowNotification(false)}
                handleSave={(data) => {
                    console.log('Form data saved:', data)
                    if (data.stageIndex !== undefined) {
                        onStageChange(data.stageIndex, data)
                    }
                    setShowNotification(false)
                }}
                projectId={projectId}
                stages={stages}
                activeStage={activeStage}
                targetStage={stages.findIndex(s => s.label === stageTransition.to)}
                delay={delay}
                history={history}
            />
        </div>
    )
}

function Sales() {
    const navigate = useNavigate();
    const toast = useToast();
    const [showSettings, setShowSettings] = useState(false)
    const [activeTab, setActiveTab] = useState('Product') // 'Product' or 'Service'

    // Filter & Sort State
    const [searchQuery, setSearchQuery] = useState('')
    const [filterBy, setFilterBy] = useState('all') // 'all', 'stage'
    const [filterValue, setFilterValue] = useState('')
    const [statusFilter, setStatusFilter] = useState('all') // 'all', 'Won', 'Lost'
    const [sortBy, setSortBy] = useState('id') // 'id', 'rating', 'delay'
    const [sortOrder, setSortOrder] = useState('desc')

    // Distinct stages for each menu type
    const [productStages, setProductStages] = useState(() => getStoredStages('Product'))
    const [serviceStages, setServiceStages] = useState(() => getStoredStages('Service'))

    // Global Labels
    const [productLabel, setProductLabel] = useState(() => localStorage.getItem('app_product_label') || 'Products')
    const [serviceLabel, setServiceLabel] = useState(() => localStorage.getItem('app_service_label') || 'Services')

    // Projects state
    const [projects, setProjects] = useState([])
    const [, setLoading] = useState(true)

    // Helper to get correct stages based on type
    const getStagesByType = (type) => type === 'Product' ? productStages : serviceStages

    // Helper to get correct set function
    const setStagesByType = (type, newStages) => {
        if (type === 'Product') setProductStages(newStages)
        else setServiceStages(newStages)
    }

    // Fetch data on mount
    useEffect(() => {
        loadProjects();
    }, [])

    const loadProjects = async () => {
        try {
            setLoading(true);
            const data = await projectService.getAll();
            setProjects(data);
        } catch (error) {
            console.error("Failed to load projects", error);
        } finally {
            setLoading(false);
        }
    }

    const updateProjectStage = async (projectId, newStageIndex, logData) => {
        // Find current project
        const p = projects.find(proj => proj.id === projectId);
        if (!p) return;

        const currentStages = getStagesByType(p.type)
        const oldStageLabel = currentStages[p.activeStage]?.label || 'Unknown'
        const newStageLabel = currentStages[newStageIndex]?.label || 'Unknown'
        const transitionStr = `${oldStageLabel} to ${newStageLabel}`

        const newEntry = {
            timestamp: new Date().toISOString(),
            transition: transitionStr,
            amount: logData?.amount || 0,
            currency: logData?.currency || 'USD',
            description: logData?.description || `Moved to ${newStageLabel}`,
            targetDate: logData?.targetDate
        }

        const updatedHistory = [newEntry, ...(p.history || [])];

        const uiUpdates = {
            activeStage: newStageIndex,
            history: updatedHistory
        };

        // Send ALL fields the backend expects (UpdateProjectRequest extends CreateProjectRequest)
        // so missing fields don't get overwritten with nulls/defaults
        const apiUpdates = {
            customId: p.customId || '',
            title: p.title || '',
            clientName: p.clientName || '',
            activeStage: newStageIndex,
            delay: p.delay || 0,
            type: p.type || 'Product',
            history: updatedHistory
        };

        // Optimistic UI update
        setProjects(prev => prev.map(proj =>
            proj.id === projectId ? { ...proj, ...uiUpdates } : proj
        ));

        try {
            // Call API
            await projectService.update(projectId, apiUpdates);
            toast.success(`Stage updated: ${transitionStr}`);
        } catch (error) {
            console.error('Failed to update project stage:', error);
            toast.error('Failed to update project stage');
            // Revert on error
            loadProjects();
            return; // Don't proceed with finance calls if stage update failed
        }

        // --- Auto-create finance & invoice entries on key stages ---
        // These are fire-and-forget: errors here must NOT affect the main flow
        const amount = parseFloat(logData?.amount) || 0;

        // When stage is "Won" or "Closed" and has an amount, create income in Finance
        if ((newStageLabel === 'Won' || newStageLabel === 'Closed') && amount > 0) {
            incomeService.createIncome({
                date: new Date().toISOString(),
                category: 'sales',
                amount: amount,
                description: `${p.clientName} - ${p.title || p.brandingName || 'Project'} (${newStageLabel})`,
                employeeName: '',
                projectDepartment: p.title || p.brandingName || ''
            }).then(() => {
                toast.success(`Income of ${logData?.currency || 'USD'} ${amount.toLocaleString()} recorded in Finance`);
            }).catch(err => {
                console.error('Failed to create income entry:', err);
                toast.warning('Stage updated but failed to record income in Finance');
            });
        }

        // When stage reaches "Won", auto-create a project finance entry for Invoice tracking
        if (newStageLabel === 'Won') {
            projectFinanceService.create({
                projectId: p.customId || `PROJ-${p.id}`,
                clientName: p.clientName || 'Unknown Client',
                clientAddress: p.clientAddress || '',
                clientGstin: p.clientGstin || '',
                dealValue: amount || 0,
                currency: logData?.currency || 'INR',
                location: p.location || '',
                status: 'Active',
                type: p.type || 'Product'
            }).then(() => {
                toast.info('Project finance record created for Invoice tracking');
            }).catch(err => {
                // May fail if already exists - that's fine
                console.error('Failed to create project finance:', err);
            });
        }

        // Record any stage transition with amount as income (for non-Won/Closed stages like milestones)
        if (amount > 0 && newStageLabel !== 'Won' && newStageLabel !== 'Closed' && newStageLabel !== 'Lost') {
            incomeService.createIncome({
                date: new Date().toISOString(),
                category: 'sales',
                amount: amount,
                description: `${p.clientName} - ${transitionStr}`,
                employeeName: '',
                projectDepartment: p.title || p.brandingName || ''
            }).then(() => {
                toast.info(`Payment of ${logData?.currency || 'USD'} ${amount.toLocaleString()} recorded`);
            }).catch(err => {
                console.error('Failed to create stage income:', err);
            });
        }
    }

    const [showAddModal, setShowAddModal] = useState(false)
    const [newProjectData, setNewProjectData] = useState({ clientName: '', brandingName: 'A365Shift', type: 'Product', phone: '' })

    // Edit Project State
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingProject, setEditingProject] = useState(null)
    const [editProjectData, setEditProjectData] = useState({ title: '', clientName: '', brandingName: '', type: 'Product', status: '', phone: '' })

    const handleAddProject = () => {
        setNewProjectData({ clientName: '', brandingName: 'A365Shift', type: activeTab })
        setShowAddModal(true)
    }

    const handleCreateProject = async () => {
        const newProject = {
            // ID generated by service
            activeStage: 0,
            history: [],
            type: newProjectData.type,
            rating: 4.0, // Default rating
            delay: 0,
            clientName: newProjectData.clientName || 'New Client',
            brandingName: newProjectData.brandingName || 'A365Shift',
            phone: newProjectData.phone || '',
            customId: GenerateCustomId(newProjectData.brandingName, newProjectData.clientName)
        }

        try {
            const created = await projectService.create(newProject);
            setProjects([...projects, created]);
            setShowAddModal(false);
            toast.success('Project created successfully');
        } catch (error) {
            console.error("Failed to create project", error)
            toast.error('Failed to create project');
        }
    }



    const handleTimesheet = (project) => {
        navigate('/timesheet', {
            state: {
                createNewEntry: true,
                project: {
                    clientName: project.clientName,
                    title: project.title,
                    name: project.brandingName, // Fallback or additional info
                    customId: project.customId
                }
            }
        })
    }

    const handleDeleteProject = async (projectId) => {
        try {
            await projectService.delete(projectId);
            setProjects(projects.filter(p => p.id !== projectId));
            toast.success('Project deleted');
        } catch (error) {
            console.error('Failed to delete project:', error);
            toast.error('Failed to delete project');
        }
    }

    const handleEditProject = (project) => {
        setEditingProject(project)
        setEditProjectData({
            title: project.title || '',
            clientName: project.clientName || '',
            brandingName: project.brandingName || '',
            type: project.type || 'Product',
            status: project.status || '',
            phone: project.phone || ''
        })
        setShowEditModal(true)
    }

    const handleSaveEditProject = async () => {
        if (!editingProject) return

        // Determine activeStage: may change if status is set to Won/Lost
        let newActiveStage = editingProject.activeStage || 0;
        const currentStages = getStagesByType(editProjectData.type);
        if (editProjectData.status === 'Won') {
            const wonIndex = currentStages.findIndex(s => s.label === 'Won');
            if (wonIndex !== -1) newActiveStage = wonIndex;
        } else if (editProjectData.status === 'Lost') {
            const lostIndex = currentStages.findIndex(s => s.label === 'Lost');
            if (lostIndex !== -1) newActiveStage = lostIndex;
        }

        // UI-level updates (includes extra fields for local state)
        const uiUpdates = {
            title: editProjectData.title,
            clientName: editProjectData.clientName,
            brandingName: editProjectData.brandingName,
            type: editProjectData.type,
            status: editProjectData.status,
            phone: editProjectData.phone,
            activeStage: newActiveStage
        }

        // Send ALL fields the backend expects to avoid nulling out data
        const apiUpdates = {
            customId: editingProject.customId || '',
            title: editProjectData.title || '',
            clientName: editProjectData.clientName || '',
            activeStage: newActiveStage,
            delay: editingProject.delay || 0,
            type: editProjectData.type || 'Product',
            history: editingProject.history || []
        }

        // Optimistic update
        setProjects(prev => prev.map(p =>
            p.id === editingProject.id ? { ...p, ...uiUpdates } : p
        ))
        setShowEditModal(false)
        try {
            await projectService.update(editingProject.id, apiUpdates)
            toast.success('Project updated successfully');
        } catch (error) {
            console.error('Failed to update project:', error)
            toast.error('Failed to update project');
            loadProjects()
        }
    }

    const handleInvoice = (project) => {
        navigate(`/invoice?projectId=${project.id}`, { state: { project } });
    };

    // Configure Global Stages for the ACTIVE TAB
    const handleConfigure = () => {
        setShowSettings(true)
    }

    const handleSaveSettings = (newStages, labels) => {
        setStagesByType(activeTab, newStages)
        localStorage.setItem(STAGE_STORAGE_KEYS[activeTab], JSON.stringify(newStages))

        // Save Labels if provided
        if (labels) {
            setProductLabel(labels.productLabel)
            setServiceLabel(labels.serviceLabel)
            localStorage.setItem('app_product_label', labels.productLabel)
            localStorage.setItem('app_service_label', labels.serviceLabel)

            // Dispatch storage event to sync other tabs/components
            window.dispatchEvent(new Event('storage'))
        }

        setShowSettings(false)
    }

    // Filter projects
    const activeStages = getStagesByType(activeTab)

    const filteredProjects = projects.filter(p => {
        // 1. Type Filter
        if (p.type !== activeTab) return false;

        // 2. Search Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const matchesId = p.id.toString().toLowerCase().includes(query);
            // Only ID search for now as that's visible, can expand later
            if (!matchesId) return false;
        }

        // 3. Custom Filter (Stage)
        if (filterBy === 'stage' && filterValue) {
            const stageLabel = activeStages[p.activeStage]?.label;
            if (stageLabel !== filterValue) return false;
        }

        // 4. Status Filter
        if (statusFilter !== 'all') {
            if (p.status !== statusFilter) return false;
        }

        return true;
    }).sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];

        if (sortOrder === 'asc') {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
    });

    // Calculate Total Projects
    const totalProjects = filteredProjects.length;

    // Calculate Dashboard Metrics
    const totalStages = activeStages.length;

    // Calculate Total Progress (Completed %)
    const totalProgress = filteredProjects.length > 0
        ? Math.round(filteredProjects.reduce((acc, curr) => {
            const maxStageIndex = activeStages.length - 1;
            const rawProgress = maxStageIndex > 0 ? (curr.activeStage / maxStageIndex) * 100 : 0;
            const progress = Math.min(100, rawProgress);
            return acc + progress;
        }, 0) / filteredProjects.length)
        : 0;

    // Calculate Delays
    const totalDelays = filteredProjects.filter(p => p.delay > 0).length;
    const notOnTrack = filteredProjects.filter(p => p.delay > 0).length; // Simplify for now, assuming all delays are "not on track"

    return (
        <div className="sales-page">

            <div className="sales-stats-grid">
                {/* Card 0: Total Projects */}
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper purple">
                            <Briefcase size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-title">Total Project</div>
                            <div className="stat-value">{totalProjects}</div>
                        </div>
                    </div>
                </div>
                {/* Card 1: Stages */}
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper blue">
                            <Flag size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-title">Total Stages</div>
                            <div className="stat-value">{totalStages}</div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Progress */}
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper green">
                            <CheckCircle size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-title">Avg. Percentage</div>
                            <div className="d-flex align-items-baseline gap-2">
                                <div className="stat-value">{totalProgress}%</div>
                                <div className="text-success small d-flex align-items-center">
                                    <ArrowUpRight size={14} className="me-1" />3%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 3: Delays */}
                <div className="stat-card">
                    <div className="stat-header">
                        <div className="stat-icon-wrapper orange">
                            <AlertTriangle size={24} />
                        </div>
                        <div className="stat-content">
                            <div className="stat-title">Delays</div>
                            <div className="stat-value">{totalDelays}</div>
                            <small className="text-muted" style={{ fontSize: '11px' }}>{notOnTrack} Not on Track</small>
                        </div>
                    </div>
                </div>


            </div>

            {/* New Unified Toolbar */}
            <div className="sales-toolbar mb-4">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 p-3 bg-white rounded-3 shadow-sm border">
                    {/* Search - Left */}
                    <div className="search-wrapper" style={{ minWidth: '300px' }}>
                        <div className="position-relative">
                            <div className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted">
                                <Search size={18} />
                            </div>
                            <input
                                type="text"
                                className="form-control ps-5 shadow-none border-secondary-subtle"
                                placeholder="Search Project ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Controls - Right */}
                    <div className="d-flex align-items-center gap-2">

                        {/* Filter Button */}
                        <Dropdown>
                            <Dropdown.Toggle as="button" className="icon-btn" bsPrefix="p-0 border-0 bg-transparent">
                                <div className={`icon-wrapper ${filterBy !== 'all' ? 'active' : ''}`}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                                    </svg>
                                </div>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="timesheet-dropdown-menu p-3 shadow-sm border-0" style={{ minWidth: '260px', borderRadius: '12px' }}>
                                <div className="mb-3">
                                    <label className="small text-muted fw-bold mb-2">FILTER BY</label>
                                    <Form.Select
                                        size="sm"
                                        value={filterBy}
                                        onChange={(e) => {
                                            setFilterBy(e.target.value);
                                            setFilterValue('');
                                        }}
                                    >
                                        <option value="all">None</option>
                                        <option value="stage">Stage</option>
                                    </Form.Select>
                                </div>
                                {filterBy === 'stage' && (
                                    <div>
                                        <label className="small text-muted fw-bold mb-2">SELECT STAGE</label>
                                        <Form.Select
                                            size="sm"
                                            value={filterValue}
                                            onChange={(e) => setFilterValue(e.target.value)}
                                        >
                                            <option value="">Select...</option>
                                            {activeStages.map(s => (
                                                <option key={s.id} value={s.label}>{s.label}</option>
                                            ))}
                                        </Form.Select>
                                    </div>
                                )}
                                {filterBy !== 'all' && (
                                    <div className="mt-3 pt-2 border-top text-end">
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="text-danger text-decoration-none p-0"
                                            onClick={() => {
                                                setFilterBy('all');
                                                setFilterValue('');
                                                setStatusFilter('all');
                                            }}
                                        >
                                            Clear Filters
                                        </Button>
                                    </div>
                                )}
                            </Dropdown.Menu>
                        </Dropdown>

                        {/* Status Filter Button */}
                        <Dropdown>
                            <Dropdown.Toggle as="button" className="icon-btn" bsPrefix="p-0 border-0 bg-transparent">
                                <div className={`icon-wrapper ${statusFilter !== 'all' ? 'active' : ''}`}>
                                    <CheckCircle size={20} />
                                </div>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="timesheet-dropdown-menu p-3 shadow-sm border-0" style={{ minWidth: '200px', borderRadius: '12px' }}>
                                <div>
                                    <label className="small text-muted fw-bold mb-2">FILTER BY STATUS</label>
                                    <div className="d-grid gap-2">
                                        <Button
                                            variant={statusFilter === 'all' ? 'primary' : 'light'}
                                            size="sm"
                                            onClick={() => setStatusFilter('all')}
                                        >
                                            All Projects
                                        </Button>
                                        <Button
                                            variant={statusFilter === 'Won' ? 'success' : 'light'}
                                            size="sm"
                                            onClick={() => setStatusFilter('Won')}
                                        >
                                            Won
                                        </Button>
                                        <Button
                                            variant={statusFilter === 'Lost' ? 'danger' : 'light'}
                                            size="sm"
                                            onClick={() => setStatusFilter('Lost')}
                                        >
                                            Lost
                                        </Button>
                                    </div>
                                </div>
                                {statusFilter !== 'all' && (
                                    <div className="mt-3 pt-2 border-top text-end">
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="text-danger text-decoration-none p-0"
                                            onClick={() => setStatusFilter('all')}
                                        >
                                            Clear Filter
                                        </Button>
                                    </div>
                                )}
                            </Dropdown.Menu>
                        </Dropdown>

                        {/* Sort Button */}
                        <Dropdown>
                            <Dropdown.Toggle as="button" className="icon-btn" bsPrefix="p-0 border-0 bg-transparent">
                                <div className="icon-wrapper">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <polyline points="19 12 12 19 5 12"></polyline>
                                    </svg>
                                </div>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="timesheet-dropdown-menu p-3 shadow-sm border-0" style={{ minWidth: '240px', borderRadius: '12px' }}>
                                <div className="mb-3">
                                    <label className="small text-muted fw-bold mb-2">SORT BY</label>
                                    <Form.Select
                                        size="sm"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        <option value="id">Project ID</option>
                                        <option value="rating">Rating</option>
                                        <option value="delay">Delay</option>
                                    </Form.Select>
                                </div>
                                <div>
                                    <label className="small text-muted fw-bold mb-2">ORDER</label>
                                    <div className="d-flex gap-2">
                                        <Button
                                            variant={sortOrder === 'asc' ? 'primary' : 'light'}
                                            size="sm"
                                            className="flex-grow-1"
                                            onClick={() => setSortOrder('asc')}
                                        >
                                            Asc
                                        </Button>
                                        <Button
                                            variant={sortOrder === 'desc' ? 'primary' : 'light'}
                                            size="sm"
                                            className="flex-grow-1"
                                            onClick={() => setSortOrder('desc')}
                                        >
                                            Desc
                                        </Button>
                                    </div>
                                </div>
                            </Dropdown.Menu>
                        </Dropdown>

                        <div className="vr mx-2 opacity-25"></div>

                        {/* Toggle Product/Service - Mapped to View Mode */}
                        <div className="btn-group view-mode-toggle me-2">
                            <Button
                                variant={activeTab === 'Product' ? 'primary' : 'outline-secondary'}
                                size="sm"
                                onClick={() => setActiveTab('Product')}
                            >
                                {productLabel}
                            </Button>
                            <Button
                                variant={activeTab === 'Service' ? 'primary' : 'outline-secondary'}
                                size="sm"
                                onClick={() => setActiveTab('Service')}
                            >
                                {serviceLabel}
                            </Button>
                        </div>

                        {/* Actions */}
                        <button className="icon-btn" onClick={handleConfigure} title="Settings">
                            <div className="icon-wrapper">
                                <Settings size={20} />
                            </div>
                        </button>

                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleAddProject}
                            className="d-flex align-items-center gap-2 btn-icon-text ms-2"
                        >
                            <Plus size={16} /> Add Project
                        </Button>
                    </div>
                </div>
            </div>

            <div className="sales-list">
                {filteredProjects.map((project) => (
                    <SalesCard
                        key={project.id}
                        projectId={project.id}
                        project={project}
                        stages={activeStages}
                        activeStage={project.activeStage}
                        history={project.history}
                        rating={project.rating}
                        delay={project.delay}
                        clientName={project.clientName}
                        brandingName={project.brandingName}
                        title={project.title}
                        onStageChange={(newStage, data) => updateProjectStage(project.id, newStage, data)}
                        onDelete={() => handleDeleteProject(project.id)}
                        onEdit={() => handleEditProject(project)}
                        onInvoice={() => handleInvoice(project)}
                        onTimesheet={() => handleTimesheet(project)}
                    />
                ))}
            </div>

            {/* Add Project Modal */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Add New Project</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Branding Name (Left)</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g. A365Shift"
                                value={newProjectData.brandingName}
                                onChange={(e) => setNewProjectData({ ...newProjectData, brandingName: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Client Name (Right)</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter client name"
                                value={newProjectData.clientName}
                                onChange={(e) => setNewProjectData({ ...newProjectData, clientName: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Phone Number</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter client phone"
                                value={newProjectData.phone}
                                onChange={(e) => setNewProjectData({ ...newProjectData, phone: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Project Type</Form.Label>
                            <Form.Select
                                value={newProjectData.type}
                                onChange={(e) => setNewProjectData({ ...newProjectData, type: e.target.value })}
                            >
                                <option value="Product">{productLabel}</option>
                                <option value="Service">{serviceLabel}</option>
                            </Form.Select>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleCreateProject}>
                        Create Project
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Project Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Project</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Project Title</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter project title"
                                value={editProjectData.title}
                                onChange={(e) => setEditProjectData({ ...editProjectData, title: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Branding Name (Left)</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g. A365Shift"
                                value={editProjectData.brandingName}
                                onChange={(e) => setEditProjectData({ ...editProjectData, brandingName: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Client Name (Right)</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter client name"
                                value={editProjectData.clientName}
                                onChange={(e) => setEditProjectData({ ...editProjectData, clientName: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Phone Number</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter client phone"
                                value={editProjectData.phone}
                                onChange={(e) => setEditProjectData({ ...editProjectData, phone: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Project Type</Form.Label>
                            <Form.Select
                                value={editProjectData.type}
                                onChange={(e) => setEditProjectData({ ...editProjectData, type: e.target.value })}
                            >
                                <option value="Product">{productLabel}</option>
                                <option value="Service">{serviceLabel}</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Status</Form.Label>
                            <Form.Select
                                value={editProjectData.status}
                                onChange={(e) => setEditProjectData({ ...editProjectData, status: e.target.value })}
                            >
                                <option value="">Select Status</option>
                                <option value="Won">Won</option>
                                <option value="Lost">Lost</option>
                            </Form.Select>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSaveEditProject}>
                        <Edit size={14} className="me-1" /> Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Stage Settings Modal - Pass dynamic labels */}
            {showSettings && (
                <StageSettingsModal
                    show={showSettings}
                    handleClose={() => setShowSettings(false)}
                    currentStages={getStagesByType(activeTab)}
                    onSave={handleSaveSettings}
                    productLabel={productLabel}
                    serviceLabel={serviceLabel}
                />
            )}
        </div>
    )
}

export default Sales
