import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Clock, DollarSign, FileText, Paperclip, History, Upload, Lock, Check, Calendar, ArrowRight } from 'lucide-react'
import './BusinessProcessModal.css'

const CURRENCIES = [
    { code: 'INR', symbol: '₹' },
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
    { code: 'AUD', symbol: 'A$' },
    { code: 'CAD', symbol: 'C$' },
    { code: 'SGD', symbol: 'S$' },
    { code: 'JPY', symbol: '¥' },
    { code: 'CNY', symbol: '¥' }
]

/* ── Default approximate INR rates (editable by user) ── */
const DEFAULT_INR_RATES = {
    USD: 83.5,
    EUR: 91.0,
    GBP: 106.0,
    AUD: 55.0,
    CAD: 62.0,
    SGD: 62.5,
    JPY: 0.56,
    CNY: 11.5
}

const BusinessProcessModal = ({
    show,
    handleClose,
    handleSave,
    projectId,
    stages = [],
    activeStage,
    targetStage,
    delay = 0,
    history = []
}) => {
    const sortedHistory = [...history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    const fileInputRef = useRef(null)

    const initialStage = targetStage !== undefined ? targetStage : activeStage
    const [viewedStage, setViewedStage] = useState(initialStage)
    const [formData, setFormData] = useState({
        targetDate: '',
        amount: '',
        currency: 'INR',
        inrRate: '',
        description: '',
        attachment: '',
        attachmentName: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
    })

    useEffect(() => {
        if (show) {
            setViewedStage(targetStage !== undefined ? targetStage : activeStage)
            // Fix #10: Full reset on every open so stale data from a previous session is cleared
            setFormData({
                targetDate: '',
                amount: '',
                currency: 'INR',
                inrRate: '',
                description: '',
                attachment: '',
                attachmentName: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: ''
            })
        }
    }, [show, targetStage, activeStage])

    /* ── Currency change → auto-populate INR rate ── */
    useEffect(() => {
        if (formData.currency !== 'INR') {
            const defaultRate = DEFAULT_INR_RATES[formData.currency] || ''
            setFormData(prev => ({ ...prev, inrRate: defaultRate }))
        } else {
            setFormData(prev => ({ ...prev, inrRate: '' }))
        }
    }, [formData.currency])

    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    /* ── Calculate Total INR ── */
    const totalInr = formData.currency !== 'INR'
        ? (parseFloat(formData.amount) || 0) * (parseFloat(formData.inrRate) || 0)
        : null

    /* ── File attachment ── */
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            handleFormChange('attachmentName', file.name)
            handleFormChange('attachment', file.name)
        }
    }

    const [amountError, setAmountError] = useState('')

    const handleSubmit = () => {
        // Fix #4: Validate amount before submitting
        if (formData.amount !== '' && formData.amount !== null) {
            const parsed = parseFloat(formData.amount)
            if (!isFinite(parsed) || parsed < 0) {
                setAmountError('Enter a valid positive amount')
                return
            }
        }
        setAmountError('')

        /* If the user is viewing the CURRENT active stage, auto-advance to next.
           If they clicked a specific future/past stage, save to that stage as-is. */
        let targetIndex = viewedStage
        if (viewedStage === activeStage && viewedStage < stages.length - 1) {
            targetIndex = activeStage + 1
        }

        const submitData = {
            stageIndex: targetIndex,
            savedStageIndex: viewedStage,
            ...formData,
            actualDate: new Date().toISOString().split('T')[0]
        }
        // Include totalInr for non-INR currencies
        if (formData.currency !== 'INR' && totalInr) {
            submitData.totalInr = totalInr
        }
        handleSave(submitData)
        setFormData({
            targetDate: '',
            amount: '',
            currency: 'INR',
            inrRate: '',
            description: '',
            attachment: '',
            attachmentName: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: ''
        })
        setAmountError('')
    }

    if (!show) return null

    const currentStageLabel = stages[viewedStage]?.label || 'Stage'

    /* ── Derive stage status description ── */
    const getStageDescription = (label) => {
        const descriptions = {
            'Demo': 'Present product demonstration and capabilities overview.',
            'Discovery': 'Finalize discovery documentation and initial assessment.',
            'POC': 'Execute proof of concept and validate technical requirements.',
            'Proposal': 'Prepare and submit detailed project proposal.',
            'Negotiation': 'Negotiate terms, pricing, and contract specifics.',
            'Compliance': 'Finalize compliance documentation and risk assessment.',
            'Approval': 'Obtain internal and client approval for the project.',
            'Finance': 'Complete financial planning and budget allocation.',
            'Development': 'Begin active development and project execution.',
            'Go Live': 'Deploy to production and complete handover.',
            'Won': 'Deal successfully closed — proceed with delivery.',
            'Closed': 'Project completed and archived.',
            'Lost': 'Deal was not converted — document learnings.'
        }
        return descriptions[label] || `Log activity and set targets for ${label} stage.`
    }

    /* ── Derive event type for timeline ── */
    const getEventType = (item) => {
        const transition = (item.transition || '').toLowerCase()
        const desc = (item.description || '').toLowerCase()
        if (desc.includes('approved') || desc.includes('signed') || transition.includes('won')) {
            return { type: 'green', label: 'PROPOSAL SIGNED', dotClass: 'dot-green', typeClass: 'type-green' }
        }
        if (desc.includes('amount') || desc.includes('budget') || desc.includes('payment') || (item.amount && item.amount > 0)) {
            return { type: 'blue', label: 'AMOUNT UPDATED', dotClass: 'dot-blue', typeClass: 'type-blue' }
        }
        if (desc.includes('lost') || transition.includes('lost')) {
            return { type: 'orange', label: 'DEAL LOST', dotClass: 'dot-orange', typeClass: 'type-orange' }
        }
        let defaultLabel = 'STAGE TRANSITION'
        if (item.transition && item.transition.includes(' to ')) {
            const parts = item.transition.split(' to ')
            if (parts.length === 2 && parts[1]) {
                defaultLabel = parts[1].trim().toUpperCase()
            }
        }
        return { type: 'grey', label: defaultLabel, dotClass: 'dot-grey', typeClass: 'type-grey' }
    }

    /* ── Time display helper ── */
    const formatTime = (timestamp) => {
        const d = new Date(timestamp)
        const now = new Date()
        const diffMs = now - d
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        if (diffDays === 1) return 'Yesterday'
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }

    return createPortal(
        <div className="business-process-overlay">

            {/* ── Header ── */}
            <div className="bp-modal-header">
                <div className="bp-header-left">
                    <span className="bp-header-title">
                        Business Process
                        <span className="bp-header-id"> – Project ID {String(projectId).slice(-12).toUpperCase()}</span>
                    </span>
                    <span className={`bp-header-badge ${delay > 0 ? 'delayed' : 'on-track'}`}>
                        {delay > 0 ? `⚠ ${delay}d delay` : '● On Track'}
                    </span>
                    {sortedHistory.length > 0 && (
                        <span className="bp-header-updated">
                            Updated {formatTime(sortedHistory[0].timestamp)}
                        </span>
                    )}
                </div>
                <button className="bp-close-btn" onClick={handleClose} title="Close">
                    <X size={18} />
                </button>
            </div>

            {/* ── Body ── */}
            <div className="bp-content-body">

                {/* LEFT: Stage Sidebar */}
                <div className="bp-sidebar">
                    <div className="bp-sidebar-label">Process Stages</div>
                    {stages.map((stage, index) => {
                        const isDone = index < activeStage
                        const isActive = index === activeStage
                        const isFuture = index > activeStage
                        const isViewed = index === viewedStage

                        let btnClass = ''
                        if (isViewed && isActive) btnClass = 'active'
                        else if (isViewed) btnClass = 'active'
                        else if (isDone) btnClass = 'done'

                        return (
                            <button
                                key={index}
                                type="button"
                                className={`bp-stage-btn ${btnClass}`}
                                onClick={() => setViewedStage(index)}
                            >
                                <span className={`bp-stage-icon ${isDone ? 'done' : isActive || isViewed === index ? (isViewed ? 'active' : 'future') : 'future'}`}>
                                    {isDone ? <Check size={12} strokeWidth={3} /> : <span style={{ fontSize: 10 }}>○</span>}
                                </span>
                                {stage.label}
                                {isDone && <span className="bp-stage-badge done-badge">DONE</span>}
                                {isActive && <span className="bp-stage-badge active-badge">ACTIVE</span>}
                            </button>
                        )
                    })}
                </div>

                {/* CENTER: Stage Configuration Form */}
                <div className="bp-form-section">
                    <div className="bp-form-stage-title">Stage Configuration</div>
                    <div className="bp-form-stage-sub">{getStageDescription(currentStageLabel)}</div>

                    {/* ── Start Date & End Date ── */}
                    <div className="mb-3">
                        <div className="bp-date-row">
                            <div className="bp-date-field">
                                <label className="form-label d-flex align-items-center gap-2">
                                    <Calendar size={11} />
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={formData.startDate}
                                    onChange={e => handleFormChange('startDate', e.target.value)}
                                />
                            </div>
                            <div className="bp-date-field">
                                <label className="form-label d-flex align-items-center gap-2">
                                    <Calendar size={11} />
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    value={formData.endDate}
                                    onChange={e => handleFormChange('endDate', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Budget Allocation / Amount ── */}
                    <div className="mb-3">
                        <label className="form-label d-flex align-items-center gap-2">
                            <DollarSign size={12} />
                            Budget Allocation
                        </label>
                        <div className="bp-amount-group">
                            <select
                                className="form-select"
                                value={formData.currency}
                                onChange={e => handleFormChange('currency', e.target.value)}
                            >
                                {CURRENCIES.map(curr => (
                                    <option key={curr.code} value={curr.code}>
                                        {curr.code} {curr.symbol}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                className="form-control"
                                placeholder="0.00"
                                min="0"
                                value={formData.amount}
                                onChange={e => { setAmountError(''); handleFormChange('amount', e.target.value) }}
                            />
                        </div>
                        {amountError && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{amountError}</div>}

                        {/* ── INR Conversion (only for non-INR currencies) ── */}
                        {formData.currency !== 'INR' && (
                            <div className="bp-inr-conversion">
                                <div className="bp-inr-rate-field">
                                    <span className="bp-inr-rate-label">Fixed INR Rate</span>
                                    <input
                                        type="number"
                                        className="bp-inr-rate-input"
                                        placeholder="0"
                                        value={formData.inrRate}
                                        onChange={e => handleFormChange('inrRate', e.target.value)}
                                    />
                                </div>
                                <div className="bp-inr-equals">=</div>
                                <div className="bp-inr-total-field">
                                    <span className="bp-inr-total-label">Total INR</span>
                                    <span className="bp-inr-total-value">
                                        ₹{totalInr ? totalInr.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '0'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Stage Description & Notes ── */}
                    <div className="mb-3">
                        <label className="form-label d-flex align-items-center gap-2">
                            <FileText size={12} />
                            Stage Description & Notes
                        </label>
                        <textarea
                            className="form-control"
                            rows={4}
                            value={formData.description}
                            placeholder={`Detail any notes, exceptions, or necessary third-party reviews...`}
                            onChange={e => handleFormChange('description', e.target.value)}
                        />
                    </div>

                    {/* ── Attachment Upload ── */}
                    <div className="mb-3">
                        <label className="form-label d-flex align-items-center gap-2">
                            <Paperclip size={12} />
                            Attachment Upload
                        </label>
                        <div
                            className="bp-attachment-zone"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="bp-attachment-zone-icon">
                                <Upload size={20} />
                            </div>
                            <div className="bp-attachment-zone-text">
                                Click to upload or drag and drop
                            </div>
                            <div className="bp-attachment-zone-hint">
                                PDF, DOCX, or PNG (Max 10MB)
                            </div>
                            {formData.attachmentName && (
                                <div className="bp-attachment-filename">
                                    📎 {formData.attachmentName}
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            style={{ display: 'none' }}
                            accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
                            onChange={handleFileSelect}
                        />
                    </div>
                </div>

                {/* RIGHT: Audit History */}
                <div className="bp-status-section">
                    <div className="bp-history-header">
                        <span>Audit History</span>
                        <div className="bp-history-header-icon">
                            <History size={14} />
                        </div>
                    </div>

                    {sortedHistory.length === 0 ? (
                        <div className="bp-history-empty">
                            <div className="bp-history-empty-icon">
                                <History size={20} />
                            </div>
                            <p>No history yet.<br />Stage transitions will appear here.</p>
                        </div>
                    ) : (
                        <div className="bp-timeline">
                            {sortedHistory.map((item, idx) => {
                                const eventType = getEventType(item)
                                return (
                                    <div key={idx} className="bp-timeline-item">
                                        <div className={`bp-timeline-dot ${eventType.dotClass}`}>
                                            {eventType.type === 'green' && <Check size={10} strokeWidth={3} />}
                                            {eventType.type === 'blue' && <DollarSign size={10} strokeWidth={2} />}
                                            {eventType.type === 'grey' && <ArrowRight size={10} strokeWidth={2} />}
                                            {eventType.type === 'orange' && <X size={10} strokeWidth={2} />}
                                        </div>
                                        <span className="bp-timeline-time">
                                            {formatTime(item.timestamp)}
                                        </span>
                                        <div className="bp-timeline-card">
                                            <div className={`bp-timeline-type ${eventType.typeClass}`}>
                                                {eventType.label}
                                            </div>
                                            <div className="bp-timeline-transition">
                                                {item.description || item.transition}
                                            </div>
                                            {item.amount > 0 && (
                                                <div className="bp-timeline-amount">
                                                    {item.currency || 'INR'} {Number(item.amount).toLocaleString()}
                                                    {item.totalInr && (
                                                        <span style={{ color: '#10b981', fontWeight: 500, fontSize: 11 }}>
                                                            {' '}(₹{Number(item.totalInr).toLocaleString('en-IN')})
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {item.targetDate && (
                                                <div className="bp-timeline-target">
                                                    Target: {item.targetDate}
                                                </div>
                                            )}
                                            {item.startDate && (
                                                <div className="bp-timeline-target">
                                                    📅 {item.startDate} → {item.endDate || 'ongoing'}
                                                    {item.actualDate && <span style={{ color: '#10b981' }}> ✓ Completed {item.actualDate}</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

            </div>

            {/* ── Footer ── */}
            <div className="bp-footer">
                <div className="bp-footer-left">
                    <Lock size={12} className="bp-footer-lock-icon" />
                    <span>Encrypted Enterprise Connection</span>
                </div>
                <div className="bp-footer-right">
                    <button className="bp-cancel-btn" onClick={handleClose}>
                        Cancel
                    </button>
                    <button className="bp-save-btn" onClick={handleSubmit}>
                        Save Changes
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}

export default BusinessProcessModal
