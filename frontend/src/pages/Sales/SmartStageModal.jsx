import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
    X, DollarSign, FileText, Paperclip, History,
    Upload, Lock, Check, Calendar, ArrowRight,
    Plus, ExternalLink, ChevronRight
} from 'lucide-react'
import { incomeService } from '../../services/incomeService'
import { legalService } from '../../services/legalService'
import { useToast } from '../../components/Toast/ToastContext'
import { useNavigate } from 'react-router-dom'
import './SmartStageModal.css'

const CURRENCIES = [
    { code: 'INR', symbol: '₹' }, { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' }, { code: 'GBP', symbol: '£' },
    { code: 'AUD', symbol: 'A$' }, { code: 'CAD', symbol: 'C$' },
    { code: 'SGD', symbol: 'S$' }, { code: 'JPY', symbol: '¥' },
]

const DEFAULT_INR_RATES = {
    USD: 83.5, EUR: 91.0, GBP: 106.0, AUD: 55.0,
    CAD: 62.0, SGD: 62.5, JPY: 0.56,
}

const LEGAL_STATUS_FLOW = ['Draft', 'Under Review', 'Approved', 'Signed']
const LEGAL_STATUS_EXTRA = ['Expired', 'Terminated']

const DEPT_COLORS = {
    sales:    '#007AFF',
    delivery: '#AF52DE',
    finance:  '#34C759',
    legal:    '#FF9500',
}

const autoDetectStatus = (stageLabel) => {
    const l = (stageLabel || '').toLowerCase()
    if (l.includes('paid') || l.includes('closed') || l.includes('won') || l.includes('payment received')) return 'Paid'
    if (l.includes('raised') || l.includes('invoice') || l.includes('approval')) return 'Raised'
    return 'Pending'
}

const statusColor = (s) => {
    if (!s) return '#8E8E93'
    const l = s.toLowerCase()
    if (l === 'paid' || l === 'signed' || l === 'approved') return '#34C759'
    if (l === 'pending' || l === 'under review') return '#007AFF'
    if (l === 'raised' || l === 'draft') return '#FF9500'
    if (l === 'expired' || l === 'terminated') return '#FF3B30'
    return '#8E8E93'
}

const formatTime = (ts) => {
    const d = new Date(ts)
    const diff = Date.now() - d
    const mins = Math.floor(diff / 60000)
    const hrs  = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 60)  return `${mins}m ago`
    if (hrs < 24)   return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    if (days === 1) return 'Yesterday'
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const getEventMeta = (item) => {
    const tr  = (item.transition || '').toLowerCase()
    const dc  = (item.description || '').toLowerCase()
    if (dc.includes('approved') || dc.includes('signed') || tr.includes('won'))
        return { dot: 'dot-green', cls: 'type-green', label: 'WON / SIGNED' }
    if (item.amount > 0)
        return { dot: 'dot-blue',  cls: 'type-blue',  label: 'AMOUNT LOGGED' }
    if (tr.includes('lost') || dc.includes('lost'))
        return { dot: 'dot-orange', cls: 'type-orange', label: 'DEAL LOST' }
    const parts = (item.transition || '').split(' to ')
    return { dot: 'dot-grey', cls: 'type-grey', label: parts[1] ? parts[1].trim().toUpperCase() : 'STAGE MOVED' }
}

const STAGE_HINTS = {
    Demo:        'Present product demonstration and capabilities overview.',
    Proposal:    'Prepare and submit detailed project proposal.',
    Negotiation: 'Negotiate terms, pricing, and contract specifics.',
    Approval:    'Obtain internal and client approval for the project.',
    Won:         'Deal successfully closed — proceed with delivery.',
    Closed:      'Project completed and archived.',
    Lost:        'Deal was not converted — document learnings.',
}

export default function SmartStageModal({
    show,
    handleClose,
    handleSave,
    projectId,
    project = {},
    stages = [],
    activeStage = 0,
    targetStage,
    delay = 0,
    history = [],
    dept = 'sales',
}) {
    const toast     = useToast()
    const navigate  = useNavigate()
    const fileRef   = useRef(null)
    const sortedHistory = [...history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    const initialStage = targetStage !== undefined ? targetStage : activeStage
    const [viewedStage, setViewedStage]   = useState(initialStage)
    const [amountErr,   setAmountErr]     = useState('')

    // Sales / Delivery form
    const [form, setForm] = useState({
        targetDate: '', amount: '', currency: 'INR', inrRate: '',
        description: '', attachment: '', attachmentName: '',
        startDate: new Date().toISOString().split('T')[0], endDate: '',
    })

    // Finance panel
    const [finRecs,       setFinRecs]       = useState([])
    const [finLoading,    setFinLoading]    = useState(false)
    const [showAddEntry,  setShowAddEntry]  = useState(false)
    const [newEntry,      setNewEntry]      = useState({ amount: '', currency: 'INR', description: '', status: 'Pending' })

    // Legal panel
    const [legalRecs,  setLegalRecs]  = useState([])
    const [legalLoad,  setLegalLoad]  = useState(false)

    const deptColor       = DEPT_COLORS[dept] || '#007AFF'
    const currentLabel    = stages[viewedStage]?.label || 'Stage'
    const totalInr        = form.currency !== 'INR'
        ? (parseFloat(form.amount) || 0) * (parseFloat(form.inrRate) || 0)
        : null

    /* ── On open ── */
    useEffect(() => {
        if (!show) return
        const idx = targetStage !== undefined ? targetStage : activeStage
        setViewedStage(idx)
        const s = stages[idx] || {}
        const toD = d => !d ? '' : typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0]
        setForm({
            targetDate: '', amount: '', currency: 'INR', inrRate: '',
            description: '', attachment: '', attachmentName: '',
            startDate: toD(s.startDate) || new Date().toISOString().split('T')[0],
            endDate: toD(s.endDate) || '',
        })
        setAmountErr('')
        if (dept === 'finance') loadFinance()
        if (dept === 'legal')   loadLegal()
    }, [show, targetStage, activeStage, dept])

    /* ── INR rate auto-fill ── */
    useEffect(() => {
        if (form.currency !== 'INR') {
            setForm(p => ({ ...p, inrRate: DEFAULT_INR_RATES[form.currency] || '' }))
        } else {
            setForm(p => ({ ...p, inrRate: '' }))
        }
    }, [form.currency])

    /* ── Auto-status on stage change (Finance) ── */
    useEffect(() => {
        if (dept === 'finance' && stages[viewedStage]) {
            setNewEntry(p => ({ ...p, status: autoDetectStatus(stages[viewedStage].label) }))
        }
    }, [viewedStage, dept])

    const loadFinance = async () => {
        setFinLoading(true)
        try {
            const res   = await incomeService.getIncomes(1, 200)
            const items = Array.isArray(res) ? res : (res?.items ?? [])
            const keys  = [project.title, project.brandingName, project.clientName, project.customId]
                .filter(Boolean).map(k => k.toLowerCase())
            setFinRecs(items.filter(item => {
                const d  = (item.projectDepartment || '').toLowerCase()
                const dc = (item.description || '').toLowerCase()
                return keys.some(k => d.includes(k) || dc.includes(k))
            }))
        } catch (e) {
            console.error('SmartStageModal: finance load failed', e)
        } finally {
            setFinLoading(false)
        }
    }

    const loadLegal = async () => {
        setLegalLoad(true)
        try {
            const items = await legalService.getAll()
            const arr   = Array.isArray(items) ? items : []
            setLegalRecs(arr.filter(a =>
                String(a.projectId) === String(project.id) ||
                String(a.projectId) === String(projectId)
            ))
        } catch (e) {
            console.error('SmartStageModal: legal load failed', e)
        } finally {
            setLegalLoad(false)
        }
    }

    const handleFinStatusChange = async (rec, status) => {
        try {
            await incomeService.updateIncome(rec.id, { ...rec, status })
            setFinRecs(p => p.map(r => r.id === rec.id ? { ...r, status } : r))
            toast.success(`Status → ${status}`)
        } catch { toast.error('Failed to update') }
    }

    const handleAddEntry = async () => {
        const amt = parseFloat(newEntry.amount)
        if (!amt || isNaN(amt)) { toast.error('Enter a valid amount'); return }
        const label = `${project.clientName || ''} – ${project.title || project.brandingName || 'Project'}`
        try {
            const created = await incomeService.createIncome({
                date: new Date().toISOString(),
                category: 'sales',
                amount: amt,
                currency: newEntry.currency,
                description: newEntry.description || `${label} — ${currentLabel}`,
                employeeName: '',
                projectDepartment: project.title || project.brandingName || '',
                status: newEntry.status,
            })
            setFinRecs(p => [created, ...p])
            setNewEntry({ amount: '', currency: 'INR', description: '', status: autoDetectStatus(currentLabel) })
            setShowAddEntry(false)
            toast.success('Finance entry created')
        } catch { toast.error('Failed to create entry') }
    }

    const handleLegalStatus = async (rec, status) => {
        try {
            await legalService.update(rec.id, { ...rec, status })
            setLegalRecs(p => p.map(r => r.id === rec.id ? { ...r, status } : r))
            toast.success(`Agreement → ${status}`)
        } catch { toast.error('Failed to update agreement') }
    }

    const handleSubmit = () => {
        if (dept === 'finance' || dept === 'legal') {
            // For finance/legal: just advance stage and close
            handleSave({ stageIndex: viewedStage, savedStageIndex: viewedStage })
            return
        }
        if (form.amount !== '' && form.amount !== null) {
            const p = parseFloat(form.amount)
            if (!isFinite(p) || p < 0) { setAmountErr('Enter a valid positive amount'); return }
        }
        setAmountErr('')
        let idx = viewedStage
        if (viewedStage === activeStage && viewedStage < stages.length - 1) idx = activeStage + 1
        handleSave({
            stageIndex: idx, savedStageIndex: viewedStage,
            ...form,
            actualDate: new Date().toISOString().split('T')[0],
            ...(totalInr ? { totalInr } : {}),
        })
    }

    if (!show) return null

    return createPortal(
        <div className="ssm-backdrop" onClick={e => { if (e.target === e.currentTarget) handleClose() }}>
            <div className="ssm-sheet" style={{ '--dept-c': deptColor }}>

                {/* ── Nav Bar ── */}
                <div className="ssm-nav">
                    <div className="ssm-nav-left">
                        <span className="ssm-dept-pip" style={{ background: deptColor }} />
                        <span className="ssm-nav-title">
                            {dept.charAt(0).toUpperCase() + dept.slice(1)} Pipeline
                        </span>
                        <span className={`ssm-track-pill ${delay > 0 ? 'delayed' : 'ok'}`}>
                            {delay > 0 ? `⚠ ${delay}d delay` : '● On Track'}
                        </span>
                    </div>
                    <div className="ssm-nav-right">
                        <span className="ssm-proj-id">#{String(projectId).slice(-8).toUpperCase()}</span>
                        <button className="ssm-x" onClick={handleClose}><X size={15} /></button>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="ssm-body">

                    {/* Sidebar — Stage List */}
                    <div className="ssm-sidebar">
                        <div className="ssm-sidebar-label">Stages</div>
                        {stages.map((stage, i) => {
                            const isDone   = i < activeStage
                            const isActive = i === activeStage
                            const isViewed = i === viewedStage
                            return (
                                <button
                                    key={i}
                                    className={`ssm-sBtn${isViewed ? ' viewed' : ''}${isDone ? ' done' : ''}${isActive && !isViewed ? ' current' : ''}`}
                                    onClick={() => setViewedStage(i)}
                                >
                                    <span className={`ssm-dot ${isDone ? 'done' : isActive ? 'active' : 'future'}`}>
                                        {isDone && <Check size={8} strokeWidth={3} />}
                                    </span>
                                    <span className="ssm-sLabel">{stage.label}</span>
                                    {isActive && <span className="ssm-aBadge">Active</span>}
                                </button>
                            )
                        })}
                    </div>

                    {/* Main Panel */}
                    <div className="ssm-main">

                        {/* ── Sales / Delivery ── */}
                        {(dept === 'sales' || dept === 'delivery') && (
                            <>
                                <h2 className="ssm-h2">{currentLabel}</h2>
                                <p className="ssm-sub">{STAGE_HINTS[currentLabel] || `Log activity and set targets for the ${currentLabel} stage.`}</p>

                                <div className="ssm-fg">
                                    <div className="ssm-row2">
                                        <div>
                                            <label className="ssm-lbl"><Calendar size={11} /> Start Date</label>
                                            <input type="date" className="ssm-inp" value={form.startDate}
                                                onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
                                        </div>
                                        <div>
                                            <label className="ssm-lbl"><Calendar size={11} /> End Date</label>
                                            <input type="date" className="ssm-inp" value={form.endDate}
                                                onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>

                                <div className="ssm-fg">
                                    <label className="ssm-lbl"><DollarSign size={11} /> Budget Allocation</label>
                                    <div className="ssm-amtRow">
                                        <select className="ssm-selSm" value={form.currency}
                                            onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}>
                                            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} {c.symbol}</option>)}
                                        </select>
                                        <input type="number" className="ssm-inp" placeholder="0.00" min="0"
                                            value={form.amount}
                                            onChange={e => { setAmountErr(''); setForm(p => ({ ...p, amount: e.target.value })) }} />
                                    </div>
                                    {amountErr && <div className="ssm-err">{amountErr}</div>}
                                    {form.currency !== 'INR' && (
                                        <div className="ssm-inrBox">
                                            <div className="ssm-inrF">
                                                <span className="ssm-inrLbl">INR Rate</span>
                                                <input type="number" className="ssm-inrInp" value={form.inrRate}
                                                    onChange={e => setForm(p => ({ ...p, inrRate: e.target.value }))} />
                                            </div>
                                            <span className="ssm-eq">=</span>
                                            <div className="ssm-inrF">
                                                <span className="ssm-inrLbl">Total INR</span>
                                                <span className="ssm-inrVal">₹{totalInr ? totalInr.toLocaleString('en-IN') : '0'}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="ssm-fg">
                                    <label className="ssm-lbl"><FileText size={11} /> Notes</label>
                                    <textarea className="ssm-ta" rows={4} value={form.description}
                                        placeholder="Add notes, exceptions, or third-party review requirements…"
                                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                                </div>

                                <div className="ssm-fg">
                                    <label className="ssm-lbl"><Paperclip size={11} /> Attachment</label>
                                    <div className="ssm-dropzone" onClick={() => fileRef.current?.click()}>
                                        <Upload size={18} color="#8E8E93" />
                                        <span className="ssm-dropTxt">
                                            {form.attachmentName || 'Click to upload · PDF, DOCX, PNG'}
                                        </span>
                                    </div>
                                    <input ref={fileRef} type="file" style={{ display: 'none' }}
                                        accept=".pdf,.docx,.doc,.png,.jpg"
                                        onChange={e => {
                                            const f = e.target.files?.[0]
                                            if (f) setForm(p => ({ ...p, attachmentName: f.name, attachment: f.name }))
                                        }} />
                                </div>
                            </>
                        )}

                        {/* ── Finance Panel ── */}
                        {dept === 'finance' && (
                            <>
                                <h2 className="ssm-h2">Finance Records</h2>
                                <p className="ssm-sub">
                                    Income entries linked to <strong>{project.clientName || 'this project'}</strong>
                                </p>

                                {finLoading ? (
                                    <div className="ssm-loading">
                                        <div className="ssm-spinner" />
                                        Loading records…
                                    </div>
                                ) : finRecs.length === 0 ? (
                                    <div className="ssm-empty">
                                        <DollarSign size={30} color="#C7C7CC" />
                                        <p>No finance records yet</p>
                                        <span>Records created from stage transitions will appear here</span>
                                    </div>
                                ) : (
                                    <div className="ssm-recList">
                                        {finRecs.map(rec => (
                                            <div key={rec.id} className="ssm-recRow">
                                                <div className="ssm-recInfo">
                                                    <span className="ssm-recAmt">
                                                        {rec.currency || 'INR'} {Number(rec.amount || 0).toLocaleString('en-IN')}
                                                    </span>
                                                    <span className="ssm-recDesc">{rec.description}</span>
                                                    <span className="ssm-recDate">{rec.date ? new Date(rec.date).toLocaleDateString() : '—'}</span>
                                                </div>
                                                <select
                                                    className="ssm-statusSel"
                                                    value={rec.status || 'Pending'}
                                                    style={{ color: statusColor(rec.status), borderColor: statusColor(rec.status) + '40', background: statusColor(rec.status) + '12' }}
                                                    onChange={e => handleFinStatusChange(rec, e.target.value)}
                                                >
                                                    {['Pending', 'Raised', 'Paid'].map(s => <option key={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {showAddEntry ? (
                                    <div className="ssm-addForm">
                                        <div className="ssm-addTitle">New Finance Entry</div>
                                        <div className="ssm-row2">
                                            <div>
                                                <label className="ssm-lbl">Amount</label>
                                                <div className="ssm-amtRow">
                                                    <select className="ssm-selSm" value={newEntry.currency}
                                                        onChange={e => setNewEntry(p => ({ ...p, currency: e.target.value }))}>
                                                        {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                                    </select>
                                                    <input type="number" className="ssm-inp" placeholder="0.00"
                                                        value={newEntry.amount}
                                                        onChange={e => setNewEntry(p => ({ ...p, amount: e.target.value }))} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="ssm-lbl">Status</label>
                                                <select className="ssm-inp" value={newEntry.status}
                                                    onChange={e => setNewEntry(p => ({ ...p, status: e.target.value }))}>
                                                    {['Pending', 'Raised', 'Paid'].map(s => <option key={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="ssm-lbl">Description</label>
                                            <input type="text" className="ssm-inp"
                                                placeholder={`${project.clientName || 'Client'} — ${currentLabel}`}
                                                value={newEntry.description}
                                                onChange={e => setNewEntry(p => ({ ...p, description: e.target.value }))} />
                                        </div>
                                        <div className="ssm-addActions">
                                            <button className="ssm-btn-ghost" onClick={() => setShowAddEntry(false)}>Cancel</button>
                                            <button className="ssm-btn-primary" onClick={handleAddEntry}>Save Entry</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button className="ssm-addBtn" onClick={() => setShowAddEntry(true)}>
                                        <Plus size={14} /> Add Finance Entry
                                    </button>
                                )}

                                <button className="ssm-openPage" onClick={() => { handleClose(); navigate('/finance') }}>
                                    Open Finance Page <ExternalLink size={12} />
                                </button>
                            </>
                        )}

                        {/* ── Legal Panel ── */}
                        {dept === 'legal' && (
                            <>
                                <h2 className="ssm-h2">Legal Agreements</h2>
                                <p className="ssm-sub">
                                    Agreements linked to <strong>{project.clientName || 'this project'}</strong>
                                </p>

                                {legalLoad ? (
                                    <div className="ssm-loading">
                                        <div className="ssm-spinner" />
                                        Loading agreements…
                                    </div>
                                ) : legalRecs.length === 0 ? (
                                    <div className="ssm-empty">
                                        <FileText size={30} color="#C7C7CC" />
                                        <p>No agreements linked to this project</p>
                                        <span>Create agreements on the Legal page and assign this project</span>
                                    </div>
                                ) : (
                                    <div className="ssm-recList">
                                        {legalRecs.map(rec => (
                                            <div key={rec.id} className="ssm-legalRow">
                                                <div className="ssm-legalTop">
                                                    <span className="ssm-legalType">{rec.type || 'Agreement'}</span>
                                                    <span className="ssm-legalTitle">{rec.title}</span>
                                                </div>
                                                <div className="ssm-statusFlow">
                                                    {LEGAL_STATUS_FLOW.map((s, si) => {
                                                        const cur = LEGAL_STATUS_FLOW.indexOf(rec.status)
                                                        const isPast   = cur > si
                                                        const isActive = cur === si
                                                        return (
                                                            <button
                                                                key={s}
                                                                className={`ssm-flowBtn${isActive ? ' active' : ''}${isPast ? ' past' : ''}`}
                                                                onClick={() => handleLegalStatus(rec, s)}
                                                            >
                                                                {isPast && <Check size={9} strokeWidth={3} />}
                                                                {s}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                                {rec.expiryDate && (
                                                    <div className="ssm-legalExpiry">
                                                        Expires {new Date(rec.expiryDate).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button className="ssm-openPage" onClick={() => { handleClose(); navigate('/legal') }}>
                                    Open Legal Page <ExternalLink size={12} />
                                </button>
                            </>
                        )}

                    </div>

                    {/* History Panel */}
                    <div className="ssm-hist">
                        <div className="ssm-histTitle">
                            <History size={13} /> Audit Trail
                        </div>
                        {sortedHistory.length === 0 ? (
                            <div className="ssm-histEmpty">
                                <History size={22} color="#C7C7CC" />
                                <p>No history yet</p>
                            </div>
                        ) : (
                            <div className="ssm-tl">
                                {sortedHistory.map((item, idx) => {
                                    const ev = getEventMeta(item)
                                    return (
                                        <div key={idx} className="ssm-tlItem">
                                            <div className={`ssm-tlDot ${ev.dot}`}>
                                                {ev.dot === 'dot-green'  && <Check size={8} strokeWidth={3} />}
                                                {ev.dot === 'dot-blue'   && <DollarSign size={8} />}
                                                {ev.dot === 'dot-grey'   && <ArrowRight size={8} />}
                                            </div>
                                            <div className="ssm-tlCard">
                                                <div className={`ssm-tlType ${ev.cls}`}>{ev.label}</div>
                                                <div className="ssm-tlDesc">{item.description || item.transition}</div>
                                                {item.amount > 0 && (
                                                    <div className="ssm-tlAmt">
                                                        {item.currency || 'INR'} {Number(item.amount).toLocaleString()}
                                                    </div>
                                                )}
                                                <div className="ssm-tlTime">{formatTime(item.timestamp)}</div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                </div>

                {/* ── Footer ── */}
                <div className="ssm-footer">
                    <div className="ssm-footerLeft">
                        <Lock size={11} color="#C7C7CC" />
                        <span>{dept.charAt(0).toUpperCase() + dept.slice(1)} Pipeline · Encrypted</span>
                    </div>
                    <div className="ssm-footerRight">
                        <button className="ssm-btn-ghost" onClick={handleClose}>Cancel</button>
                        <button className="ssm-btn-save" onClick={handleSubmit}>
                            {dept === 'finance' || dept === 'legal' ? 'Done' : 'Save Changes'}
                        </button>
                    </div>
                </div>

            </div>
        </div>,
        document.body
    )
}
