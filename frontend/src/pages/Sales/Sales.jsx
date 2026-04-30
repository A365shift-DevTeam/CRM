import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Contact, Settings, Plus, CheckCircle, Trash2, Briefcase, DollarSign, Timer, Flag, AlertTriangle, ArrowUpRight, Search, Monitor, Phone, FileText, MessageSquare, Edit, Clock, ChevronLeft, ChevronRight, GripVertical, Palette, Scale, Check, MoreHorizontal, Eye } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa6'
import { Button, Modal, Form, Dropdown } from 'react-bootstrap'
import PageToolbar from '../../components/PageToolbar/PageToolbar'
import PageHeader from '../../components/PageHeader/PageHeader'
import StatsGrid from '../../components/StatsGrid/StatsGrid'
import './Sales.css'
import StageSettingsModal, {
    getDefaultDeliveryStages,
    getDefaultFinanceStages,
    getDefaultLegalStages,
    DELIVERY_STORAGE_KEY,
    FINANCE_STORAGE_KEY,
    LEGAL_STORAGE_KEY,
    loadStoredStages
} from './StageSettingsModal'

const STAGE_COLOR_MAP = {
    blue: '#4361EE', cyan: '#06B6D4', green: '#10B981',
    orange: '#F97316', purple: '#8B5CF6', red: '#F43F5E', gray: '#64748B'
}
const getStageHex = (colorName) => STAGE_COLOR_MAP[colorName] || '#10B981'
import SmartStageModal from './SmartStageModal'
import { projectService } from '../../services/api'
import { contactService } from '../../services/contactService'
import { companyService } from '../../services/companyService'
import { incomeService } from '../../services/incomeService'
import { projectFinanceService } from '../../services/projectFinanceService'
import { organizationService } from '../../services/organizationService'
import { useToast } from '../../components/Toast/ToastContext'
import { useTheme } from '../../context/ThemeContext'
import Swal from 'sweetalert2'
import LegalModal from '../Legal/LegalModal'
import { legalService } from '../../services/legalService'
import AuditHistoryModal from './AuditHistoryModal'

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

const normalizeProjectKey = (value) => String(value || '').trim().toLowerCase()

// Fix #3: validate parsed stages so corrupted localStorage data falls back gracefully
const isValidStagesSchema = (stages) =>
    Array.isArray(stages) &&
    stages.length > 0 &&
    stages.every(s => typeof s === 'object' && s !== null && typeof s.label === 'string')

const getStoredStages = (type) => {
    try {
        const stored = localStorage.getItem(STAGE_STORAGE_KEYS[type])
        if (!stored) return getDefaultStages()
        const parsed = JSON.parse(stored)
        if (!isValidStagesSchema(parsed)) {
            console.warn('Stored stages failed schema check — using defaults')
            return getDefaultStages()
        }
        return parsed
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
    // Fix #13: append a 3-char random suffix to prevent collisions on same day/client/brand
    const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
    return `${date}${brandCode}${clientCode}${year}-${suffix}`;
}

// Fix #7: deterministic color from client name — removes hardcoded mock client list
const CLIENT_COLORS = ['#10b981', '#e879f9', '#f59e0b', '#3b82f6', '#6366f1', '#ef4444', '#8b5cf6', '#0ea5e9']
const getClientColor = (name) => {
    let hash = 0
    const str = String(name || '')
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return CLIENT_COLORS[Math.abs(hash) % CLIENT_COLORS.length]
}

function buildWhatsAppText(project, stages, activeStage) {
    const stageLabel = stages[activeStage]?.label || 'Unknown';
    const progress = Math.round((activeStage / Math.max(stages.length - 1, 1)) * 100);
    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
    const pipelineLines = stages.map((s, i) => {
        if (i < activeStage) return `  ✅ ${s.label}`;
        if (i === activeStage) return `  ▶️ *${s.label}* ← Current`;
        return `  ⬜ ${s.label}`;
    });
    return [
        `🏢 *PROJECT DETAILS*`,
        `━━━━━━━━━━━━━━━━━━`,
        ``,
        `📋 *Title:* ${project.title || 'N/A'}`,
        `🆔 *ID:* #${project.customId || String(project.id || '').slice(-6).toUpperCase()}`,
        project.clientName  ? `👤 *Client:* ${project.clientName}`  : null,
        project.companyName ? `🏛️ *Company:* ${project.companyName}` : null,
        project.contactName ? `📞 *Contact:* ${project.contactName}` : null,
        project.phone       ? `📱 *Phone:* ${project.countryCode || ''}${project.phone}` : null,
        ``,
        `📊 *PIPELINE STATUS*`,
        `━━━━━━━━━━━━━━━━━━`,
        `🔄 *Type:* ${project.type || 'Standard'}`,
        `🎯 *Stage:* ${stageLabel} (${activeStage + 1} of ${stages.length})`,
        `📈 *Progress:* ${progress}%`,
        project.delay > 0 ? `⚠️ *Delay:* ${project.delay} day(s)` : `✅ *Status:* On Track`,
        ``,
        `📅 *TIMELINE*`,
        `━━━━━━━━━━━━━━━━━━`,
        `🚀 *Start:* ${fmt(project.startDate)}`,
        `🏁 *End:* ${fmt(project.endDate)}`,
        ``,
        `🎯 *STAGE PIPELINE*`,
        `━━━━━━━━━━━━━━━━━━`,
        ...pipelineLines,
        ``,
        `_Shared via Ambot365 CRM_ 🚀`,
    ].filter(l => l !== null).join('\n');
}

const SalesCard = ({ projectId, project, stages, deliveryStages, financeStages, legalStages, activeStage, onStageChange, onDelete, onEdit, onInvoice, onTimesheet, onLegal, onViewHistory, delay, clientName, brandingName, title, history = [] }) => {
    const accentColor = getStageHex(stages[activeStage]?.color)
    const toast = useToast()
    const { themeColor } = useTheme()
    const [showNotification, setShowNotification] = useState(false)
    const [stageTransition, setStageTransition] = useState({ from: '', to: '' })
    const [iconsExpanded, setIconsExpanded] = useState(false)
    const [selectedDept, setSelectedDept] = useState('sales')

    const client = { name: clientName || 'Unknown Client', color: getClientColor(clientName || projectId) }

    // Resolve which stages and active index to show
    const displayStages = selectedDept === 'sales' ? stages : (selectedDept === 'delivery' ? deliveryStages : (selectedDept === 'finance' ? financeStages : legalStages))
    const displayActiveStage = selectedDept === 'sales' ? activeStage : (selectedDept === 'delivery' ? (project.deliveryStage || 0) : (selectedDept === 'finance' ? (project.financeStage || 0) : (project.legalStage || 0)))

    // Calculate Progress Percentage
    const maxStageIndex = displayStages.length > 0 ? displayStages.length - 1 : 1;
    const rawPercentage = (displayActiveStage / maxStageIndex) * 100;
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
        if (index !== displayActiveStage) {
            setStageTransition({
                from: displayStages[displayActiveStage]?.label || 'Unknown',
                to: displayStages[index]?.label || 'Unknown',
                dept: selectedDept
            })
            // Do NOT update stage yet - wait for modal save
            setShowNotification(true)
        }
    }

    const handleStageClick = (index) => {
        // Open modal for confirmation/history regardless of whether it's the active stage
        setStageTransition({
            from: displayStages[displayActiveStage]?.label || 'Unknown',
            to: displayStages[index]?.label || 'Unknown',
            dept: selectedDept
        })
        setShowNotification(true)
    }

    return (
        <div className="sales-card" style={{ padding: 0 }}>
            {/* Left accent */}
            <div className="sales-card-left-accent" style={{ background: accentColor }} />

            <div className="d-flex w-100 position-relative p-4">
                {/* Left Column: Details */}
                <div className="d-flex flex-column pe-4" style={{ minWidth: '240px', maxWidth: '300px', flexShrink: 0, paddingLeft: '8px' }}>
                    <div className="text-muted fw-bold" style={{ fontSize: '13px', color: '#475569' }}>Project ID: #{project.customId || String(projectId).slice(-6).toUpperCase()}</div>

                    <div className="d-flex align-items-center gap-2 mt-2">
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: delay > 0 ? '3px solid #F43F5E' : '3px solid #10B981' }} />
                        <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 500 }}>{delay > 0 ? `${delay}d delay` : 'On Track'}</span>
                    </div>

                    <h3 className="fw-bolder mb-0" style={{ color: '#0F172A', fontSize: '22px', letterSpacing: '-0.02em', marginTop: '16px' }}>{client.name}</h3>

                    <div style={{ color: '#94A3B8', fontSize: '13px', lineHeight: '1.4', fontWeight: '500', marginTop: '4px' }}>
                        {title || 'Untitled Project'}
                    </div>
                </div>

                {/* Right Column: Pipeline & Actions */}
                <div className="flex-grow-1 d-flex flex-column justify-content-end pb-2 position-relative" style={{ minWidth: 0 }}>

                    {/* Top Center: Segmented Control */}
                    <div className="position-absolute w-100 d-flex justify-content-center" style={{ top: '-10px', left: 0, paddingRight: '30px', zIndex: 5, pointerEvents: 'none' }}>
                        <div className="ios-segmented dept-segmented" onClick={e => e.stopPropagation()} style={{ pointerEvents: 'auto' }}>
                            {[
                                { id: 'sales', label: 'Sales', dot: null },
                                { id: 'delivery', label: 'Delivery', dot: null },
                                { id: 'finance', label: 'Finance', dot: project.financeStage > 0 ? '#34C759' : null },
                                { id: 'legal', label: 'Legal', dot: project.legalStage > 0 ? '#FF9500' : null },
                            ].map(({ id, label, dot }) => (
                                <button
                                    key={id}
                                    type="button"
                                    className={`ios-segment${selectedDept === id ? ' active' : ''}`}
                                    onClick={() => setSelectedDept(id)}
                                >
                                    {dot && <span className="ios-segment-dot" style={{ background: dot }} />}
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Top Right: Icons */}
                    <div className="position-absolute d-flex align-items-center" style={{ top: '-10px', right: '0', zIndex: 10 }}>

                        <div className="d-flex align-items-center" style={{ gap: '6px' }}>
                            <div className="icon-outline icon-whatsapp" onClick={(e) => {
                                e.stopPropagation();
                                const msg = buildWhatsAppText(project, stages, activeStage);
                                const encoded = encodeURIComponent(msg);
                                const rawPhone = project.phone ? `${project.countryCode || '+91'}${project.phone}`.replace(/\D/g, '') : '';
                                const url = rawPhone
                                    ? `https://wa.me/${rawPhone}?text=${encoded}`
                                    : `https://wa.me/?text=${encoded}`;
                                window.open(url, '_blank');
                            }} title="Share project on WhatsApp">
                                <FaWhatsapp size={16} />
                            </div>
                            <div className="icon-outline" onClick={(e) => { e.stopPropagation(); onViewHistory(); }} title="Audit History">
                                <Eye size={16} />
                            </div>
                            <div className="icon-outline" onClick={(e) => { e.stopPropagation(); onTimesheet(); }} title="Timesheet">
                                <FileText size={16} />
                            </div>
                            <div className="icon-outline icon-edit" onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Edit">
                                <Edit size={16} />
                            </div>
                        </div>

                        {/* Expandable Icons Container */}
                        <div
                            className="d-flex align-items-center"
                            style={{
                                overflow: 'hidden',
                                transition: 'max-width 0.3s ease, opacity 0.2s ease',
                                maxWidth: iconsExpanded ? '150px' : '0px',
                                opacity: iconsExpanded ? 1 : 0,
                            }}
                        >
                            <div className="d-flex align-items-center" style={{ gap: '6px', paddingLeft: '6px' }}>
                                <div className="icon-outline" onClick={(e) => { e.stopPropagation(); onInvoice(); }} title="Invoice">
                                    <DollarSign size={16} />
                                </div>
                                <div className="icon-outline" onClick={(e) => { e.stopPropagation(); onLegal(); }} title="Legal Agreement">
                                    <Scale size={16} />
                                </div>
                                <div className="icon-outline icon-delete text-danger" onClick={async (e) => {
                                    e.stopPropagation();
                                    const result = await Swal.fire({
                                        title: 'Delete project?',
                                        text: "This action cannot be undone.",
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonColor: '#ef4444',
                                        cancelButtonColor: '#64748b',
                                        confirmButtonText: 'Yes, delete it!'
                                    });
                                    if (result.isConfirmed) onDelete();
                                }} title="Delete Project">
                                    <Trash2 size={16} />
                                </div>
                            </div>
                        </div>

                        <div
                            className="icon-outline"
                            onClick={(e) => { e.stopPropagation(); setIconsExpanded(!iconsExpanded); }}
                            title={iconsExpanded ? "Close" : "More Actions"}
                            style={{
                                marginLeft: '6px',
                                transition: 'transform 0.3s ease, background-color 0.15s, color 0.15s',
                                transform: iconsExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                background: iconsExpanded ? '#F1F5F9' : 'transparent',
                                color: iconsExpanded ? '#0F172A' : '#64748B'
                            }}
                        >
                            <MoreHorizontal size={16} />
                        </div>
                    </div>

                    {/* Pipeline */}
                    <div className="d-flex align-items-center justify-content-center w-100" style={{ overflowX: 'auto', padding: '42px 4px 4px', scrollbarWidth: 'none' }}>
                        <div className="pipeline-wrapper">
                            {displayStages.map((stage, index) => {
                                const isLast = index === displayStages.length - 1;
                                const isActive = index === displayActiveStage;
                                const isPast = index < displayActiveStage;

                                let isOverdue = false;
                                let remainingDaysText = `${stage.ageing || 0}d left`;

                                if (stage.endDate) {
                                    const todayStr = new Date().toISOString().split('T')[0];
                                    if (todayStr > stage.endDate) {
                                        if (!stage.actualDate || stage.actualDate > stage.endDate) {
                                            isOverdue = true;
                                        }
                                    }
                                } else if (isActive) {
                                    let daysInStage = 0;
                                    if (history && history.length > 0) {
                                        const sorted = [...history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                                        const lastUpdate = new Date(sorted[0].timestamp);
                                        daysInStage = Math.ceil(Math.abs(new Date() - lastUpdate) / 86400000);
                                    }
                                    isOverdue = daysInStage > (stage.ageing || 0);
                                    const remaining = (stage.ageing || 0) - daysInStage;
                                    remainingDaysText = remaining >= 0 ? `${remaining}d left` : `${Math.abs(remaining)}d overdue`;
                                }

                                const stageClass = isPast ? 'past' : isActive ? 'active' : 'future';
                                const overdueClass = isOverdue ? ' stage-overdue' : '';

                                return (
                                    <div key={index} className="d-flex align-items-center">
                                        <div className="position-relative">
                                            {isActive && (
                                                <div className="running-man-container" draggable onDragStart={handleDragStart}>
                                                    <div className="current-stage-tooltip">{remainingDaysText}</div>
                                                    <i className="fa-solid fa-person-running running-man-icon" style={{ color: '#10B981', fontSize: '20px' }} />
                                                </div>
                                            )}
                                            <div
                                                className={`stage-card d-flex align-items-center justify-content-center ${stageClass}${overdueClass}`}
                                                onClick={() => handleStageClick(index)}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, index)}
                                            >
                                                {stage.label}
                                            </div>
                                        </div>

                                        {!isLast && (
                                            <div className="stage-connector">
                                                <div className={`connector-line${isPast ? ' filled' : ''}`} />
                                                {isPast && (
                                                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#2F9E75', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 2 }}>
                                                        <Check size={8} strokeWidth={4} />
                                                    </div>
                                                )}
                                                {isPast && (
                                                    <div className="connector-line filled" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Smart Stage Modal — context-aware for Sales / Delivery / Finance / Legal */}
            <SmartStageModal
                show={showNotification}
                handleClose={() => setShowNotification(false)}
                handleSave={(data) => {
                    if (data.stageIndex !== undefined) {
                        onStageChange(data.stageIndex, { ...data, dept: stageTransition.dept })
                    }
                    setShowNotification(false)
                }}
                projectId={projectId}
                project={project}
                dept={selectedDept}
                stages={displayStages}
                activeStage={displayActiveStage}
                targetStage={displayStages.findIndex(s => s.label === stageTransition.to)}
                delay={delay}
                history={history}
            />
        </div>
    )
}

function Sales() {
    const navigate = useNavigate();
    const toast = useToast();
    const { themeColor } = useTheme();
    const [showSettings, setShowSettings] = useState(false)
    const [activeTab, setActiveTab] = useState('Product') // 'Product' or 'Service'

    // Filter & Sort State
    const [searchQuery, setSearchQuery] = useState('')
    const [filterBy, setFilterBy] = useState('all') // 'all', 'stage'
    const [filterValue, setFilterValue] = useState('')
    const [statusFilter, setStatusFilter] = useState('all') // 'all', 'Won', 'Lost'
    const [sortBy, setSortBy] = useState('id') // 'id', 'rating', 'delay'
    const [sortOrder, setSortOrder] = useState('desc')

    // Distinct stages for each menu type — seeded from localStorage until API loads
    const [productStages, setProductStages] = useState(() => getStoredStages('Product'))
    const [serviceStages, setServiceStages] = useState(() => getStoredStages('Service'))
    const [deliveryStages, setDeliveryStages] = useState(() => loadStoredStages(DELIVERY_STORAGE_KEY, getDefaultDeliveryStages))
    const [financeStages, setFinanceStages] = useState(() => loadStoredStages(FINANCE_STORAGE_KEY, getDefaultFinanceStages))
    const [legalStages, setLegalStages] = useState(() => loadStoredStages(LEGAL_STORAGE_KEY, getDefaultLegalStages))

    // Global Labels
    const [productLabel, setProductLabel] = useState(() => localStorage.getItem('app_product_label') || 'Products')
    const [serviceLabel, setServiceLabel] = useState(() => localStorage.getItem('app_service_label') || 'Services')

    // Org state for settings persistence
    const [orgId, setOrgId] = useState(null)

    // Projects state
    const [projects, setProjects] = useState([])
    const [, setLoading] = useState(true)

    // Dropdown data for contact/company selects
    const [contactsList, setContactsList] = useState([])
    const [companiesList, setCompaniesList] = useState([])

    // Won → Invoice dialog
    const [showWonDialog, setShowWonDialog] = useState(false)
    const [wonProject, setWonProject] = useState(null)

    // Legal agreement entry from Sales card
    const [showLegalModal, setShowLegalModal] = useState(false)
    const [legalProject, setLegalProject] = useState(null)

    // Audit History Modal
    const [showAuditModal, setShowAuditModal] = useState(false)
    const [auditProject, setAuditProject] = useState(null)

    const handleOpenAuditHistory = (project) => {
        setAuditProject(project)
        setShowAuditModal(true)
    }

    const handleOpenLegal = (project) => {
        setLegalProject(project)
        setShowLegalModal(true)
    }

    const handleLegalSaved = async (payload) => {
        try {
            await legalService.create({
                ...payload,
                projectId: legalProject?.id ?? null,
            })
            toast.success('Legal agreement created')
            setShowLegalModal(false)
            setLegalProject(null)
        } catch (e) {
            toast.error(e.message || 'Failed to create legal agreement')
        }
    }

    // Helper to get correct stages based on type
    const getStagesByType = (type) => type === 'Product' ? productStages : serviceStages

    // Helper to get correct set function
    const setStagesByType = (type, newStages) => {
        if (type === 'Product') setProductStages(newStages)
        else setServiceStages(newStages)
    }

    // Fix #5: lock set to prevent duplicate finance entries from rapid double-clicks
    const stageLockRef = useRef(new Set())

    // Fetch data on mount
    useEffect(() => {
        loadProjects();
        loadOrgSettings();
        loadDropdownData();
    }, [])

    const loadDropdownData = async () => {
        try {
            const [contactsData, companiesData] = await Promise.all([
                contactService.getContacts(1, 200).catch(() => []),
                companyService.getCompanies(1, 200).catch(() => []),
            ]);
            const contacts  = contactsData?.data  || contactsData?.items  || (Array.isArray(contactsData)  ? contactsData  : []);
            const companies = companiesData?.data || companiesData?.items || (Array.isArray(companiesData) ? companiesData : []);
            setContactsList(contacts);
            setCompaniesList(companies);
        } catch (e) {
            console.error('Failed to load dropdown data:', e);
        }
    }

    const loadOrgSettings = async () => {
        try {
            const org = await organizationService.getProfile()
            if (!org) return
            setOrgId(org.id)
            const settings = await organizationService.getSalesSettings()
            if (settings.productStages?.length) {
                setProductStages(settings.productStages)
                localStorage.setItem(STAGE_STORAGE_KEYS.Product, JSON.stringify(settings.productStages))
            }
            if (settings.serviceStages?.length) {
                setServiceStages(settings.serviceStages)
                localStorage.setItem(STAGE_STORAGE_KEYS.Service, JSON.stringify(settings.serviceStages))
            }
            if (settings.deliveryStages?.length) {
                setDeliveryStages(settings.deliveryStages)
                localStorage.setItem(DELIVERY_STORAGE_KEY, JSON.stringify(settings.deliveryStages))
            }
            if (settings.financeStages?.length) {
                setFinanceStages(settings.financeStages)
                localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(settings.financeStages))
            }
            if (settings.legalStages?.length) {
                setLegalStages(settings.legalStages)
                localStorage.setItem(LEGAL_STORAGE_KEY, JSON.stringify(settings.legalStages))
            }
            if (settings.productLabel) {
                setProductLabel(settings.productLabel)
                localStorage.setItem('app_product_label', settings.productLabel)
            }
            if (settings.serviceLabel) {
                setServiceLabel(settings.serviceLabel)
                localStorage.setItem('app_service_label', settings.serviceLabel)
            }
        } catch (e) {
            // fall back to localStorage — already loaded in state initializers
            console.warn('Could not load org settings, using local defaults', e)
        }
    }

    const loadProjects = async () => {
        try {
            setLoading(true);
            const data = await projectService.getAll();
            setProjects(Array.isArray(data) ? data : (data?.items ?? []));
        } catch (error) {
            console.error("Failed to load projects", error);
        } finally {
            setLoading(false);
        }
    }

    // Helper: get stages for a specific project (per-project first, fallback to type)
    const getProjectStages = (project) => {
        if (project.stages && Array.isArray(project.stages) && project.stages.length > 0) {
            return project.stages
        }
        return getStagesByType(project.type)
    }

    const updateProjectStage = async (projectId, newStageIndex, logData) => {
        // Fix #5: prevent duplicate finance entries from rapid double-clicks or network lag
        const lockKey = `${projectId}-${newStageIndex}`
        if (stageLockRef.current.has(lockKey)) return
        stageLockRef.current.add(lockKey)

        // Find current project
        const p = projects.find(proj => proj.id === projectId);
        if (!p) { stageLockRef.current.delete(lockKey); return; }

        const currentStages = [...getProjectStages(p)];
        const savedStageIndex = logData?.savedStageIndex !== undefined ? logData.savedStageIndex : (logData?.dept === 'delivery' ? p.deliveryStage || 0 : logData?.dept === 'finance' ? p.financeStage || 0 : logData?.dept === 'legal' ? p.legalStage || 0 : p.activeStage);

        // If it's sales, update the stages object, else just update the project pointer
        if (logData?.dept === 'sales' || !logData?.dept) {
            currentStages[savedStageIndex] = {
                ...currentStages[savedStageIndex],
                startDate: logData?.startDate || currentStages[savedStageIndex].startDate,
                endDate: logData?.endDate || currentStages[savedStageIndex].endDate,
                actualDate: logData?.actualDate || currentStages[savedStageIndex].actualDate
            };
        }

        let oldStageLabel = 'Unknown';
        let newStageLabel = 'Unknown';

        if (logData?.dept === 'delivery') {
            oldStageLabel = deliveryStages[p.deliveryStage || 0]?.label || 'Unknown';
            newStageLabel = deliveryStages[newStageIndex]?.label || 'Unknown';
        } else if (logData?.dept === 'finance') {
            oldStageLabel = financeStages[p.financeStage || 0]?.label || 'Unknown';
            newStageLabel = financeStages[newStageIndex]?.label || 'Unknown';
        } else if (logData?.dept === 'legal') {
            oldStageLabel = legalStages[p.legalStage || 0]?.label || 'Unknown';
            newStageLabel = legalStages[newStageIndex]?.label || 'Unknown';
        } else {
            oldStageLabel = currentStages[p.activeStage]?.label || 'Unknown';
            newStageLabel = currentStages[newStageIndex]?.label || 'Unknown';
        }

        const transitionStr = `${oldStageLabel} to ${newStageLabel}`;

        const newEntry = {
            timestamp: new Date().toISOString(),
            transition: transitionStr,
            amount: logData?.amount || 0,
            currency: logData?.currency || 'USD',
            totalInr: logData?.totalInr,
            description: logData?.description || `Moved to ${newStageLabel}`,
            targetDate: logData?.targetDate,
            startDate: logData?.startDate,
            endDate: logData?.endDate,
            actualDate: logData?.actualDate,
            dept: logData?.dept || 'sales'
        }

        const updatedHistory = [newEntry, ...(p.history || [])];

        let uiUpdates = { history: updatedHistory };
        let apiUpdates = {
            customId: p.customId || '',
            title: p.title || '',
            clientName: p.clientName || '',
            delay: p.delay || 0,
            type: p.type || 'Product',
            history: updatedHistory,
            stages: currentStages,
            startDate: p.startDate || null,
            endDate: p.endDate || null,
            deliveryStage: logData?.dept === 'delivery' ? newStageIndex : (p.deliveryStage || 0),
            financeStage:  logData?.dept === 'finance'  ? newStageIndex : (p.financeStage  || 0),
            legalStage:    logData?.dept === 'legal'    ? newStageIndex : (p.legalStage    || 0),
            activeStage:   logData?.dept === 'sales' || !logData?.dept ? newStageIndex : (p.activeStage || 0),
        };

        if (logData?.dept === 'delivery') {
            uiUpdates.deliveryStage = newStageIndex;
        } else if (logData?.dept === 'finance') {
            uiUpdates.financeStage = newStageIndex;
        } else if (logData?.dept === 'legal') {
            uiUpdates.legalStage = newStageIndex;
        } else {
            uiUpdates.activeStage = newStageIndex;
            uiUpdates.stages = currentStages;
        }

        // Optimistic UI update
        setProjects(prev => prev.map(proj =>
            proj.id === projectId ? { ...proj, ...uiUpdates } : proj
        ));

        try {
            // Call API
            await projectService.update(projectId, apiUpdates);
            // Notify Projects page to re-fetch if it's mounted
            window.dispatchEvent(new CustomEvent('crm:projects-updated'));
            toast.success(`Stage updated: ${transitionStr}`);
            // Prompt to create invoice when deal is Won
            if (newStageLabel === 'Won') {
                setWonProject({ ...p, activeStage: newStageIndex });
                setShowWonDialog(true);
            }
        } catch (error) {
            console.error('Failed to update project stage:', error);
            toast.error('Failed to update project stage');
            // Revert on error
            loadProjects();
            return; // Don't proceed with finance calls if stage update failed
        }

        // --- Enterprise Flow: Auto-create finance & invoice entries on key stages ---
        // These are fire-and-forget: errors here must NOT affect the main flow
        const amount = parseFloat(logData?.amount) || 0;
        const projectLabel = `${p.clientName} - ${p.title || p.brandingName || 'Project'}`;
        const currency = logData?.currency || 'INR';

        // Stage: "Approval" (Stage 3) — Invoice Raised
        // Creates a ProjectFinance record (Invoice) and a Finance Income entry with "Raised" status
        if (newStageLabel === 'Approval' && amount > 0) {
            // Upsert Invoice (ProjectFinance) entry to avoid duplicate/empty rows
            const projectFinancePayload = {
                projectId: p.customId || `PROJ-${p.id}`,
                clientName: p.clientName || 'Unknown Client',
                clientAddress: p.clientAddress || '',
                clientGstin: p.clientGstin || '',
                dealValue: amount,
                currency: currency,
                location: p.location || '',
                status: 'Active',
                type: p.type || 'Product'
            };

            projectFinanceService.getAll()
                .then((financeProjects) => {
                    const existing = (financeProjects || []).find(fp =>
                        normalizeProjectKey(fp?.projectId) === normalizeProjectKey(projectFinancePayload.projectId)
                    );

                    if (existing?.id) {
                        const mergedPayload = {
                            projectId: projectFinancePayload.projectId,
                            clientName: projectFinancePayload.clientName || existing.clientName || 'Unknown Client',
                            clientAddress: projectFinancePayload.clientAddress || existing.clientAddress || '',
                            clientGstin: projectFinancePayload.clientGstin || existing.clientGstin || '',
                            dealValue: projectFinancePayload.dealValue || existing.dealValue || 0,
                            currency: projectFinancePayload.currency || existing.currency || 'INR',
                            location: projectFinancePayload.location || existing.location || '',
                            status: projectFinancePayload.status || existing.status || 'Active',
                            type: projectFinancePayload.type || existing.type || 'Product',
                            delivery: existing.delivery || ''
                        };

                        return projectFinanceService.update(existing.id, {
                            ...mergedPayload,
                            milestones: existing.milestones || [],
                            stakeholders: existing.stakeholders || [],
                            charges: existing.charges || []
                        }).then(() => {
                            toast.info('Invoice updated for approval stage');
                        });
                    }

                    return projectFinanceService.create({
                        ...projectFinancePayload,
                        milestones: [],
                        stakeholders: [],
                        charges: []
                    }).then(() => {
                        toast.info('Invoice created for approval stage');
                    });
                })
                .catch(err => {
                    console.error('Failed to upsert project finance:', err);
                });

            // Create Finance Income entry with "Raised" status
            incomeService.createIncome({
                date: new Date().toISOString(),
                category: 'sales',
                amount: amount,
                description: `${projectLabel} — Invoice Raised`,
                employeeName: '',
                projectDepartment: p.title || p.brandingName || '',
                status: 'Raised'
            }).then(() => {
                toast.success(`Invoice of ${currency} ${amount.toLocaleString()} raised in Finance`);
            }).catch(err => {
                console.error('Failed to create raised income:', err);
                toast.warning('Stage updated but failed to record raised invoice in Finance');
            });
        }

        // Stage: "Won" — Deal Won, Payment Pending
        // Creates Finance Income entry with "Pending" status (awaiting payment)
        if (newStageLabel === 'Won' && amount > 0) {
            incomeService.createIncome({
                date: new Date().toISOString(),
                category: 'sales',
                amount: amount,
                description: `${projectLabel} — Deal Won (Payment Pending)`,
                employeeName: '',
                projectDepartment: p.title || p.brandingName || '',
                status: 'Pending'
            }).then(() => {
                toast.success(`Income of ${currency} ${amount.toLocaleString()} recorded as Pending`);
            }).catch(err => {
                console.error('Failed to create income entry:', err);
                toast.warning('Stage updated but failed to record income in Finance');
            });
        }

        // Stage: "Closed" — Payment Received
        // Creates Finance Income entry with "Paid" status
        if (newStageLabel === 'Closed' && amount > 0) {
            incomeService.createIncome({
                date: new Date().toISOString(),
                category: 'sales',
                amount: amount,
                description: `${projectLabel} — Payment Received`,
                employeeName: '',
                projectDepartment: p.title || p.brandingName || '',
                status: 'Paid'
            }).then(() => {
                toast.success(`Payment of ${currency} ${amount.toLocaleString()} marked as Paid`);
            }).catch(err => {
                console.error('Failed to create paid income:', err);
                toast.warning('Stage updated but failed to record payment in Finance');
            });
        }

        // Other stages with amounts (e.g., partial payments, milestones) — record as Pending
        if (amount > 0 && newStageLabel !== 'Approval' && newStageLabel !== 'Won' && newStageLabel !== 'Closed' && newStageLabel !== 'Lost') {
            incomeService.createIncome({
                date: new Date().toISOString(),
                category: 'sales',
                amount: amount,
                description: `${projectLabel} — ${transitionStr}`,
                employeeName: '',
                projectDepartment: p.title || p.brandingName || '',
                status: 'Pending'
            }).then(() => {
                toast.info(`Payment of ${currency} ${amount.toLocaleString()} recorded`);
            }).catch(err => {
                console.error('Failed to create stage income:', err);
            });
        }

        // Fix #5: release lock after all fire-and-forget calls are initiated
        stageLockRef.current.delete(lockKey)
    }

    const [showAddModal, setShowAddModal] = useState(false)
    const [newProjectData, setNewProjectData] = useState({ title: '', clientName: '', companyName: '', contactName: '', brandingName: 'Ambot365', type: 'Product', phone: '', startDate: '', endDate: '' })

    // Edit Project State
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingProject, setEditingProject] = useState(null)
    const [editProjectData, setEditProjectData] = useState({ title: '', clientName: '', companyName: '', contactName: '', brandingName: '', type: 'Product', status: '', phone: '', startDate: '', endDate: '', stages: [] })

    const handleAddProject = () => {
        setNewProjectData({ title: '', clientName: '', companyName: '', contactName: '', brandingName: 'Ambot365', type: activeTab, phone: '', startDate: '', endDate: '' })
        setShowAddModal(true)
    }

    const handleCreateProject = async () => {
        // Initialize per-project stages from the current type defaults
        const initialStages = getStagesByType(newProjectData.type).map((s, i) => ({ ...s, id: i }))

        const newProject = {
            // ID generated by service
            activeStage: 0,
            history: [],
            type: newProjectData.type,
            rating: 4.0,
            delay: 0,
            title: newProjectData.title || '',
            clientName: newProjectData.clientName || 'New Client',
            companyName: newProjectData.companyName || '',
            contactName: newProjectData.contactName || '',
            brandingName: newProjectData.brandingName || 'Ambot365',
            phone: newProjectData.phone || '',
            startDate: newProjectData.startDate || null,
            endDate: newProjectData.endDate || null,
            customId: GenerateCustomId(newProjectData.brandingName, newProjectData.clientName),
            stages: initialStages
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
        // Load per-project stages, fall back to type defaults
        const projectStages = (project.stages && Array.isArray(project.stages) && project.stages.length > 0)
            ? project.stages
            : getStagesByType(project.type || 'Product')
        setEditProjectData({
            title:       project.title       || '',
            clientName:  project.clientName  || '',
            companyName: project.companyName || '',
            contactName: project.contactName || '',
            brandingName: project.brandingName || '',
            type:        project.type        || 'Product',
            status:      project.status      || '',
            phone:       project.phone       || '',
            countryCode: project.countryCode || '+91',
            startDate:   project.startDate ? project.startDate.split('T')[0] : '',
            endDate:     project.endDate   ? project.endDate.split('T')[0]   : '',
            stages: projectStages.map((s, i) => ({ ...s, id: s.id ?? i }))
        })
        setShowEditModal(true)
    }

    const handleSaveEditProject = async () => {
        if (!editingProject) return

        // Use the per-project custom stages from the edit form
        const customStages = editProjectData.stages || []

        // Fix #16: prevent saving with zero stages — breaks pipeline progress calculation
        if (customStages.length === 0) {
            toast.error('At least one pipeline stage is required');
            return;
        }

        // Determine activeStage: may change if status is set to Won/Lost
        let newActiveStage = editingProject.activeStage || 0;
        if (editProjectData.status === 'Won') {
            const wonIndex = customStages.findIndex(s => s.label === 'Won');
            if (wonIndex !== -1) newActiveStage = wonIndex;
        } else if (editProjectData.status === 'Lost') {
            const lostIndex = customStages.findIndex(s => s.label === 'Lost');
            if (lostIndex !== -1) newActiveStage = lostIndex;
        }

        // Clamp activeStage to valid range if stages were removed
        if (newActiveStage >= customStages.length) {
            newActiveStage = Math.max(0, customStages.length - 1);
        }

        // UI-level updates (includes extra fields for local state)
        const uiUpdates = {
            title:        editProjectData.title,
            clientName:   editProjectData.clientName,
            companyName:  editProjectData.companyName,
            contactName:  editProjectData.contactName,
            brandingName: editProjectData.brandingName,
            type:         editProjectData.type,
            status:       editProjectData.status,
            phone:        editProjectData.phone,
            countryCode:  editProjectData.countryCode || '+91',
            startDate:    editProjectData.startDate || null,
            endDate:      editProjectData.endDate   || null,
            activeStage:  newActiveStage,
            stages:       customStages
        }

        // Send ALL fields the backend expects to avoid nulling out data
        const apiUpdates = {
            customId:     editingProject.customId  || '',
            title:        editProjectData.title     || '',
            clientName:   editProjectData.clientName  || '',
            companyName:  editProjectData.companyName  || '',
            contactName:  editProjectData.contactName  || '',
            brandingName: editProjectData.brandingName || '',
            phone:        editProjectData.phone       || '',
            countryCode:  editProjectData.countryCode || '+91',
            startDate:    editProjectData.startDate   || null,
            endDate:      editProjectData.endDate     || null,
            activeStage:  newActiveStage,
            delay:        editingProject.delay || 0,
            type:         editProjectData.type || 'Product',
            history:      editingProject.history || [],
            stages:       customStages
        }

        // Optimistic update
        setProjects(prev => prev.map(p =>
            p.id === editingProject.id ? { ...p, ...uiUpdates } : p
        ))
        setShowEditModal(false)
        try {
            await projectService.update(editingProject.id, apiUpdates)
            window.dispatchEvent(new CustomEvent('crm:projects-updated'));
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

    const handleSaveSettings = async (newStages, labels) => {
        setStagesByType(activeTab, newStages)
        localStorage.setItem(STAGE_STORAGE_KEYS[activeTab], JSON.stringify(newStages))

        let nextDelivery = deliveryStages
        let nextFinance = financeStages
        let nextLegal = legalStages
        let nextProductLabel = productLabel
        let nextServiceLabel = serviceLabel

        if (labels) {
            setProductLabel(labels.productLabel)
            setServiceLabel(labels.serviceLabel)
            localStorage.setItem('app_product_label', labels.productLabel)
            localStorage.setItem('app_service_label', labels.serviceLabel)
            nextProductLabel = labels.productLabel
            nextServiceLabel = labels.serviceLabel

            if (labels.deliveryStages) { setDeliveryStages(labels.deliveryStages); nextDelivery = labels.deliveryStages }
            if (labels.financeStages)  { setFinanceStages(labels.financeStages);  nextFinance  = labels.financeStages  }
            if (labels.legalStages)    { setLegalStages(labels.legalStages);      nextLegal    = labels.legalStages    }

            window.dispatchEvent(new Event('storage'))
        }

        // Persist to backend if org is linked
        if (orgId) {
            const payload = {
                productStages:  activeTab === 'Product' ? newStages : getStagesByType('Product'),
                serviceStages:  activeTab === 'Service' ? newStages : getStagesByType('Service'),
                deliveryStages: nextDelivery,
                financeStages:  nextFinance,
                legalStages:    nextLegal,
                productLabel:   nextProductLabel,
                serviceLabel:   nextServiceLabel,
            }
            organizationService.upsertSalesSettings(payload).catch(e =>
                console.warn('Failed to persist settings to backend', e)
            )
        }

        setShowSettings(false)
    }

    // Filter projects
    const activeStages = getStagesByType(activeTab)

    const filteredProjects = projects.filter(p => {
        // 1. Type Filter
        if (p.type !== activeTab) return false;

        // 2. Search Filter — Fix #6: search across ID, client name, and title
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const matchesId = p.id.toString().toLowerCase().includes(query);
            const matchesClient = (p.clientName || '').toLowerCase().includes(query);
            const matchesTitle = (p.title || '').toLowerCase().includes(query);
            if (!matchesId && !matchesClient && !matchesTitle) return false;
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
        <div className="sales-page" style={{ '--dynamic-theme-color': themeColor || '#2563EB' }}>
            <PageHeader 
                title="Sales Pipeline" 
                description="Manage deals, track sales progress, and forecast revenue" 
                icon={Briefcase} 
                iconColor="#2563eb"
            />
            <StatsGrid stats={[
                { label: 'Total Project', value: totalProjects, icon: <Briefcase size={22} />, color: 'purple' },
                { label: 'Total Stages', value: totalStages, icon: <Flag size={22} />, color: 'blue' },
                { label: 'Avg. Percentage', value: (
                    <div className="d-flex align-items-baseline gap-2 m-0 p-0">
                        <span>{totalProgress}%</span>
                        <div className="text-success small d-flex align-items-center" style={{ fontSize: '11px' }}>
                            <ArrowUpRight size={12} className="me-1" />3%
                        </div>
                    </div>
                ), icon: <CheckCircle size={22} />, color: 'green' },
                { label: 'Delays', value: (
                    <div className="d-flex align-items-baseline gap-2 m-0 p-0">
                        <span>{totalDelays}</span>
                        <div className="text-muted small" style={{ fontSize: '10px' }}>
                            ({notOnTrack} Not on Track)
                        </div>
                    </div>
                ), icon: <AlertTriangle size={22} />, color: 'orange' },
            ]} />

            {/* New Unified Toolbar */}
            <div className="mb-4">
                <PageToolbar
                    title="Sales Pipeline"
                    itemCount={totalProjects}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Search by ID, client, or title..."
                    filters={[
                        { id: 'stage', name: 'Stage' },
                        { id: 'status', name: 'Status' }
                    ]}
                    filterBy={filterBy === 'all' && statusFilter !== 'all' ? 'status' : filterBy}
                    filterValue={filterBy === 'stage' ? filterValue : (statusFilter !== 'all' ? statusFilter : '')}
                    onFilterChange={(fBy, fValue) => {
                        if (fBy === 'all') {
                            setFilterBy('all');
                            setFilterValue('');
                            setStatusFilter('all');
                        } else if (fBy === 'status') {
                            setFilterBy('all');
                            setFilterValue('');
                            setStatusFilter(fValue || 'all');
                        } else if (fBy === 'stage') {
                            setFilterBy('stage');
                            setFilterValue(fValue);
                            setStatusFilter('all');
                        }
                    }}
                    getFilterOptions={(fBy) => {
                        if (fBy === 'stage') return activeStages.map(s => s.label);
                        if (fBy === 'status') return ['Won', 'Lost'];
                        return [];
                    }}
                    sortOptions={[
                        { id: 'id', name: 'Project ID' },
                        { id: 'rating', name: 'Rating' },
                        { id: 'delay', name: 'Delay' }
                    ]}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSortChange={(sBy, sOrd) => {
                        setSortBy(sBy);
                        setSortOrder(sOrd);
                    }}
                    onManageColumns={handleConfigure}
                    actions={[
                        { label: 'Add Project', icon: <Plus size={16} />, variant: 'primary', onClick: handleAddProject }
                    ]}
                    extraControls={
                        <div className="btn-group view-mode-toggle me-2 d-none d-sm-flex">
                            <Button
                                variant={activeTab === 'Product' ? 'primary' : 'outline-secondary'}
                                size="sm"
                                onClick={() => setActiveTab('Product')}
                                className="px-3"
                            >
                                {productLabel}
                            </Button>
                            <Button
                                variant={activeTab === 'Service' ? 'primary' : 'outline-secondary'}
                                size="sm"
                                onClick={() => setActiveTab('Service')}
                                className="px-3"
                            >
                                {serviceLabel}
                            </Button>
                        </div>
                    }
                />
            </div>

            <div className="sales-list">
                {filteredProjects.map((project) => (
                    <SalesCard
                        key={project.id}
                        projectId={project.id}
                        project={project}
                        stages={getProjectStages(project)}
                        deliveryStages={deliveryStages}
                        financeStages={financeStages}
                        legalStages={legalStages}
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
                        onLegal={() => handleOpenLegal(project)}
                        onViewHistory={() => handleOpenAuditHistory(project)}
                    />
                ))}
            </div>

            {/* Add Project Modal */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <Plus size={18} className="text-muted" />
                        Add New Project
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold small text-muted">Project Title</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter project title"
                                value={newProjectData.title}
                                onChange={(e) => setNewProjectData({ ...newProjectData, title: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold small text-muted">Branding Name (Left)</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="e.g. Ambot365"
                                value={newProjectData.brandingName}
                                onChange={(e) => setNewProjectData({ ...newProjectData, brandingName: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold small text-muted">Company Name</Form.Label>
                            <Form.Select
                                value={newProjectData.companyName}
                                onChange={(e) => setNewProjectData({ ...newProjectData, companyName: e.target.value })}
                            >
                                <option value="">Select a company…</option>
                                {companiesList.map((c, i) => {
                                    const name = c.name || c.companyName || 'Unnamed';
                                    return <option key={c.id || c._id || i} value={name}>{name}</option>;
                                })}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold small text-muted">Client Name</Form.Label>
                            <Form.Select
                                value={newProjectData.clientName}
                                onChange={(e) => setNewProjectData({ ...newProjectData, clientName: e.target.value })}
                            >
                                <option value="">Select a client…</option>
                                {contactsList.map((c, i) => {
                                    const name = c.name || c.contactName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || 'Unnamed';
                                    return <option key={c.id || c._id || i} value={name}>{name}</option>;
                                })}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold small text-muted">Phone Number</Form.Label>
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #dee2e6', borderRadius: '0.375rem', overflow: 'hidden', background: '#fff' }}>
                                <Form.Select
                                    value={newProjectData.countryCode || '+91'}
                                    onChange={(e) => setNewProjectData({ ...newProjectData, countryCode: e.target.value })}
                                    style={{ width: '80px', flexShrink: 0, border: 'none', borderRight: '1px solid #dee2e6', borderRadius: 0, fontSize: '0.875rem', background: 'transparent', boxShadow: 'none', paddingRight: '24px' }}
                                >
                                    <option value="+91">+91</option>
                                    <option value="+1">+1</option>
                                    <option value="+44">+44</option>
                                    <option value="+61">+61</option>
                                    <option value="+971">+971</option>
                                    <option value="+65">+65</option>
                                    <option value="+81">+81</option>
                                    <option value="+49">+49</option>
                                    <option value="+33">+33</option>
                                    <option value="+86">+86</option>
                                </Form.Select>
                                <Form.Control
                                    type="tel"
                                    placeholder="Enter phone number"
                                    value={newProjectData.phone}
                                    onChange={(e) => setNewProjectData({ ...newProjectData, phone: e.target.value })}
                                    style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}
                                />
                            </div>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold small text-muted">Project Type</Form.Label>
                            <Form.Select
                                value={newProjectData.type}
                                onChange={(e) => setNewProjectData({ ...newProjectData, type: e.target.value })}
                            >
                                <option value="Product">{productLabel}</option>
                                <option value="Service">{serviceLabel}</option>
                            </Form.Select>
                        </Form.Group>
                        <div className="row">
                            <div className="col-6">
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold small text-muted">Start Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={newProjectData.startDate}
                                        onChange={(e) => setNewProjectData({ ...newProjectData, startDate: e.target.value })}
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-6">
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold small text-muted">End Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={newProjectData.endDate}
                                        onChange={(e) => setNewProjectData({ ...newProjectData, endDate: e.target.value })}
                                    />
                                </Form.Group>
                            </div>
                        </div>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreateProject} style={{ background: 'var(--button-brand, #5286A5)', borderColor: 'var(--button-brand, #5286A5)', fontWeight: 600 }}>
                        Create Project
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Project Modal — with per-project stage editor */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg" className="edit-project-modal">
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <Edit size={18} className="text-muted" />
                        Edit Project
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <Form>
                        {/* Project Details Section */}
                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold small text-muted">Project Title</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter project title"
                                        value={editProjectData.title}
                                        onChange={(e) => setEditProjectData(prev => ({ ...prev, title: e.target.value }))}
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold small text-muted">Branding Name (Left)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g. Ambot365"
                                        value={editProjectData.brandingName}
                                        onChange={(e) => setEditProjectData(prev => ({ ...prev, brandingName: e.target.value }))}
                                    />
                                </Form.Group>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold small text-muted">Company Name</Form.Label>
                                    <Form.Select
                                        value={editProjectData.companyName}
                                        onChange={(e) => setEditProjectData(prev => ({ ...prev, companyName: e.target.value }))}
                                    >
                                        <option value="">Select a company…</option>
                                        {companiesList.map((c, i) => {
                                            const name = c.name || c.companyName || 'Unnamed';
                                            return <option key={c.id || c._id || i} value={name}>{name}</option>;
                                        })}
                                    </Form.Select>
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold small text-muted">Client Name</Form.Label>
                                    <Form.Select
                                        value={editProjectData.clientName}
                                        onChange={(e) => setEditProjectData(prev => ({ ...prev, clientName: e.target.value }))}
                                    >
                                        <option value="">Select a client…</option>
                                        {contactsList.map((c, i) => {
                                            const name = c.name || c.contactName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email || 'Unnamed';
                                            return <option key={c.id || c._id || i} value={name}>{name}</option>;
                                        })}
                                    </Form.Select>
                                </Form.Group>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold small text-muted">Phone Number</Form.Label>
                                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #dee2e6', borderRadius: '0.375rem', overflow: 'hidden', background: '#fff' }}>
                                        <Form.Select
                                            value={editProjectData.countryCode || '+91'}
                                            onChange={(e) => setEditProjectData(prev => ({ ...prev, countryCode: e.target.value }))}
                                            style={{ width: '80px', flexShrink: 0, border: 'none', borderRight: '1px solid #dee2e6', borderRadius: 0, fontSize: '0.875rem', background: 'transparent', boxShadow: 'none', paddingRight: '24px' }}
                                        >
                                            <option value="+91">+91</option>
                                            <option value="+1">+1</option>
                                            <option value="+44">+44</option>
                                            <option value="+61">+61</option>
                                            <option value="+971">+971</option>
                                            <option value="+65">+65</option>
                                            <option value="+81">+81</option>
                                            <option value="+49">+49</option>
                                            <option value="+33">+33</option>
                                            <option value="+86">+86</option>
                                        </Form.Select>
                                        <Form.Control
                                            type="tel"
                                            placeholder="Enter phone number"
                                            value={editProjectData.phone}
                                            onChange={(e) => setEditProjectData(prev => ({ ...prev, phone: e.target.value }))}
                                            style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}
                                        />
                                    </div>
                                </Form.Group>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold small text-muted">Project Type</Form.Label>
                                    <Form.Select
                                        value={editProjectData.type}
                                        onChange={(e) => setEditProjectData(prev => ({ ...prev, type: e.target.value }))}
                                    >
                                        <option value="Product">{productLabel}</option>
                                        <option value="Service">{serviceLabel}</option>
                                    </Form.Select>
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold small text-muted">Status</Form.Label>
                                    <Form.Select
                                        value={editProjectData.status}
                                        onChange={(e) => setEditProjectData(prev => ({ ...prev, status: e.target.value }))}
                                    >
                                        <option value="">Select Status</option>
                                        <option value="Won">Won</option>
                                        <option value="Lost">Lost</option>
                                    </Form.Select>
                                </Form.Group>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold small text-muted">Start Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={editProjectData.startDate}
                                        onChange={(e) => setEditProjectData(prev => ({ ...prev, startDate: e.target.value }))}
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold small text-muted">End Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={editProjectData.endDate}
                                        onChange={(e) => setEditProjectData(prev => ({ ...prev, endDate: e.target.value }))}
                                    />
                                </Form.Group>
                            </div>
                        </div>

                        {/* ─── Per-Project Stage Editor ─── */}
                        <div className="stage-editor-section mt-2">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="mb-0 fw-semibold d-flex align-items-center gap-2">
                                    <Flag size={16} className="text-muted" />
                                    Pipeline Stages
                                    <span className="badge rounded-pill bg-primary" style={{ fontSize: '0.7rem' }}>
                                        {editProjectData.stages?.length || 0}
                                    </span>
                                </h6>
                                <div className="d-flex gap-2">
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => {
                                            setEditProjectData(prev => ({
                                                ...prev,
                                                stages: getStagesByType(prev.type).map((s, i) => ({ ...s, id: i }))
                                            }))
                                        }}
                                        title="Reset stages to type defaults"
                                        style={{ fontSize: '0.8rem' }}
                                    >
                                        Reset to Defaults
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setEditProjectData(prev => {
                                                const newStage = {
                                                    id: (prev.stages?.length || 0),
                                                    label: '',
                                                    color: 'gray',
                                                    ageing: 7
                                                }
                                                return { ...prev, stages: [...(prev.stages || []), newStage] }
                                            })
                                        }}
                                        style={{ background: 'var(--button-brand, #5286A5)', borderColor: 'var(--button-brand, #5286A5)', fontSize: '0.8rem', fontWeight: 600 }}
                                    >
                                        <Plus size={14} className="me-1" />
                                        Add Stage
                                    </Button>
                                </div>
                            </div>

                            <div className="stage-editor-list">
                                {(editProjectData.stages || []).map((stage, idx) => (
                                    <div
                                        key={idx}
                                        className="stage-editor-item d-flex align-items-center gap-2 p-2 border rounded mb-2 bg-white"
                                    >
                                        <div className="text-muted d-flex align-items-center" style={{ minWidth: '24px' }}>
                                            <GripVertical size={16} />
                                        </div>

                                        {/* Stage Number */}
                                        <span className="badge rounded-pill bg-light text-dark border" style={{ fontSize: '0.75rem', minWidth: '28px' }}>
                                            {idx + 1}
                                        </span>

                                        {/* Stage Name */}
                                        <Form.Control
                                            type="text"
                                            size="sm"
                                            placeholder="Stage name"
                                            value={stage.label}
                                            onChange={(e) => {
                                                const val = e.target.value
                                                setEditProjectData(prev => {
                                                    const updated = [...prev.stages]
                                                    updated[idx] = { ...updated[idx], label: val }
                                                    return { ...prev, stages: updated }
                                                })
                                            }}
                                            style={{ maxWidth: '200px', fontSize: '0.85rem' }}
                                        />

                                        {/* Aging Days */}
                                        <div className="d-flex align-items-center gap-1">
                                            <Timer size={14} className="text-muted" />
                                            <Form.Control
                                                type="number"
                                                size="sm"
                                                min={1}
                                                value={stage.ageing}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 1
                                                    setEditProjectData(prev => {
                                                        const updated = [...prev.stages]
                                                        updated[idx] = { ...updated[idx], ageing: val }
                                                        return { ...prev, stages: updated }
                                                    })
                                                }}
                                                style={{ width: '70px', fontSize: '0.85rem' }}
                                                title="Aging days"
                                            />
                                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>days</span>
                                        </div>

                                        {/* Color Picker */}
                                        <div className="d-flex align-items-center gap-1">
                                            <Palette size={14} className="text-muted" />
                                            <Form.Select
                                                size="sm"
                                                value={stage.color || 'gray'}
                                                onChange={(e) => {
                                                    const val = e.target.value
                                                    setEditProjectData(prev => {
                                                        const updated = [...prev.stages]
                                                        updated[idx] = { ...updated[idx], color: val }
                                                        return { ...prev, stages: updated }
                                                    })
                                                }}
                                                style={{ width: '110px', fontSize: '0.8rem' }}
                                            >
                                                <option value="cyan">Cyan</option>
                                                <option value="gray">Gray</option>
                                                <option value="green">Green</option>
                                                <option value="orange">Orange</option>
                                                <option value="red">Red</option>
                                                <option value="blue">Blue</option>
                                                <option value="purple">Purple</option>
                                            </Form.Select>
                                        </div>

                                        {/* Move Up / Down */}
                                        <div className="d-flex flex-column" style={{ gap: '2px' }}>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-0 text-muted"
                                                disabled={idx === 0}
                                                onClick={() => {
                                                    setEditProjectData(prev => {
                                                        const updated = [...prev.stages]
                                                            ;[updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]]
                                                        return { ...prev, stages: updated }
                                                    })
                                                }}
                                                title="Move up"
                                                style={{ lineHeight: 1 }}
                                            >
                                                ▲
                                            </Button>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-0 text-muted"
                                                disabled={idx === (editProjectData.stages?.length || 0) - 1}
                                                onClick={() => {
                                                    setEditProjectData(prev => {
                                                        const updated = [...prev.stages]
                                                            ;[updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]]
                                                        return { ...prev, stages: updated }
                                                    })
                                                }}
                                                title="Move down"
                                                style={{ lineHeight: 1 }}
                                            >
                                                ▼
                                            </Button>
                                        </div>

                                        {/* Delete */}
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="p-0 text-danger ms-auto"
                                            onClick={() => {
                                                setEditProjectData(prev => ({
                                                    ...prev,
                                                    stages: prev.stages.filter((_, i) => i !== idx)
                                                }))
                                            }}
                                            title="Remove stage"
                                        >
                                            <Trash2 size={15} />
                                        </Button>
                                    </div>
                                ))}

                                {(!editProjectData.stages || editProjectData.stages.length === 0) && (
                                    <div className="text-center text-muted py-3 border rounded" style={{ fontSize: '0.85rem' }}>
                                        No stages configured. Click "Add Stage" or "Reset to Defaults" to get started.
                                    </div>
                                )}
                            </div>
                        </div>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveEditProject} style={{ background: 'var(--button-brand, #5286A5)', borderColor: 'var(--button-brand, #5286A5)', fontWeight: 600 }}>
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

            {/* Legal Agreement — opened from Sales card */}
            <LegalModal
                show={showLegalModal}
                onHide={() => { setShowLegalModal(false); setLegalProject(null); }}
                editing={null}
                onSaved={handleLegalSaved}
                initialValues={{
                    projectId: legalProject?.id ?? '',
                    title: legalProject
                        ? `${[legalProject.clientName, legalProject.title].filter(Boolean).join(' – ')} Agreement`
                        : '',
                }}
            />

            <AuditHistoryModal
                show={showAuditModal}
                onHide={() => { setShowAuditModal(false); setAuditProject(null); }}
                project={auditProject}
                deliveryStages={deliveryStages}
                financeStages={financeStages}
                legalStages={legalStages}
            />

            {/* Won → Invoice Dialog */}
            <Modal show={showWonDialog} onHide={() => setShowWonDialog(false)} centered size="sm">
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="h6 fw-bold">🎉 Deal Won!</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-2">
                    {wonProject && (
                        <p className="text-muted small mb-0">
                            <strong>{wonProject.title}</strong> is marked as Won.<br />
                            Create an Invoice for this deal now?
                        </p>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="secondary" size="sm" onClick={() => setShowWonDialog(false)}>Later</Button>
                    <Button variant="success" size="sm" onClick={() => {
                        setShowWonDialog(false);
                        if (wonProject) navigate('/invoice', { state: { project: wonProject } });
                    }}>Create Invoice</Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

export default Sales
