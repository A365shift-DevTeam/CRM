import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Clock, DollarSign, FileText, Paperclip, History } from 'lucide-react'
import './BusinessProcessModal.css'

const CURRENCIES = [
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
    { code: 'INR', symbol: '₹' },
    { code: 'AUD', symbol: 'A$' },
    { code: 'CAD', symbol: 'C$' },
    { code: 'SGD', symbol: 'S$' },
    { code: 'JPY', symbol: '¥' },
    { code: 'CNY', symbol: '¥' }
]

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

    const initialStage = targetStage !== undefined ? targetStage : activeStage
    const [viewedStage, setViewedStage] = useState(initialStage)
    const [formData, setFormData] = useState({
        targetDate: '',
        amount: '',
        currency: 'INR',
        description: '',
        attachment: ''
    })

    useEffect(() => {
        if (show) {
            setViewedStage(targetStage !== undefined ? targetStage : activeStage)
        }
    }, [show, targetStage, activeStage])

    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = () => {
        handleSave({ stageIndex: viewedStage, ...formData })
        setFormData({ targetDate: '', amount: '', currency: 'INR', description: '', attachment: '' })
    }

    if (!show) return null

    const currentStageLabel = stages[viewedStage]?.label || 'Stage'

    return createPortal(
        <div className="business-process-overlay">

            {/* ── Header ── */}
            <div className="bp-modal-header">
                <div className="bp-header-left">
                    <span className="bp-header-title">
                        Business Process
                        <span className="bp-header-id"> · #{String(projectId).slice(-8).toUpperCase()}</span>
                    </span>
                    <span className={`bp-header-badge ${delay > 0 ? 'delayed' : 'on-track'}`}>
                        {delay > 0 ? `⚠ ${delay}d delay` : '● On Track'}
                    </span>
                </div>
                <button className="bp-close-btn" onClick={handleClose} title="Close">
                    <X size={16} />
                </button>
            </div>

            {/* ── Body ── */}
            <div className="bp-content-body">

                {/* LEFT: Stage Sidebar */}
                <div className="bp-sidebar">
                    <div className="bp-sidebar-label">Pipeline Stages</div>
                    {stages.map((stage, index) => (
                        <button
                            key={index}
                            type="button"
                            className={`bp-stage-btn ${index === viewedStage ? 'active' : ''}`}
                            onClick={() => setViewedStage(index)}
                        >
                            <span className="bp-stage-num">{index + 1}</span>
                            {stage.label}
                        </button>
                    ))}
                </div>

                {/* CENTER: Form */}
                <div className="bp-form-section">
                    <div className="bp-form-stage-title">{currentStageLabel}</div>
                    <div className="bp-form-stage-sub">Log activity and set targets for this stage</div>

                    {/* Target Date */}
                    <div className="mb-3">
                        <label className="form-label d-flex align-items-center gap-2">
                            <Clock size={12} />
                            Target Date
                        </label>
                        <input
                            type="date"
                            className="form-control"
                            value={formData.targetDate}
                            onChange={e => handleFormChange('targetDate', e.target.value)}
                        />
                    </div>

                    {/* Amount */}
                    <div className="mb-3">
                        <label className="form-label d-flex align-items-center gap-2">
                            <DollarSign size={12} />
                            Amount
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
                                value={formData.amount}
                                onChange={e => handleFormChange('amount', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-3">
                        <label className="form-label d-flex align-items-center gap-2">
                            <FileText size={12} />
                            Description
                        </label>
                        <textarea
                            className="form-control"
                            rows={5}
                            value={formData.description}
                            placeholder={`Notes for ${currentStageLabel}...`}
                            onChange={e => handleFormChange('description', e.target.value)}
                        />
                    </div>

                    {/* Attachment */}
                    <div className="mb-4">
                        <label className="form-label d-flex align-items-center gap-2">
                            <Paperclip size={12} />
                            Attachment
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="File path or URL"
                            value={formData.attachment}
                            onChange={e => handleFormChange('attachment', e.target.value)}
                        />
                    </div>

                    <div className="bp-action-row">
                        <button className="bp-save-btn" onClick={handleSubmit}>
                            Save Stage
                        </button>
                        <button className="bp-cancel-btn" onClick={handleClose}>
                            Cancel
                        </button>
                    </div>
                </div>

                {/* RIGHT: History Timeline */}
                <div className="bp-status-section">
                    <div className="bp-history-header d-flex align-items-center gap-2">
                        <History size={12} />
                        Stage History
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
                            {sortedHistory.map((item, idx) => (
                                <div key={idx} className="bp-timeline-item">
                                    <div className="bp-timeline-dot" />
                                    <div className="bp-timeline-card">
                                        <div className="bp-timeline-transition">{item.transition}</div>
                                        <div className="bp-timeline-time">
                                            {new Date(item.timestamp).toLocaleString(undefined, {
                                                month: 'short', day: 'numeric', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </div>
                                        {item.amount > 0 && (
                                            <div className="bp-timeline-amount">
                                                {item.currency || 'USD'} {Number(item.amount).toLocaleString()}
                                            </div>
                                        )}
                                        {item.description && (
                                            <div className="bp-timeline-desc">{item.description}</div>
                                        )}
                                        {item.targetDate && (
                                            <div className="bp-timeline-target">
                                                Target: {item.targetDate}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>,
        document.body
    )
}

export default BusinessProcessModal
