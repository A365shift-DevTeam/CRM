import React, { useState, useMemo } from 'react'
import { Modal } from 'react-bootstrap'
import {
    Clock, DollarSign, Activity, Calendar, Target, Timer,
    Plus, Minus, CalendarDays, CheckCircle2, Settings2, Filter
} from 'lucide-react'
import { FaPenToSquare } from 'react-icons/fa6'
import StatsGrid from '../../components/StatsGrid/StatsGrid'
import './AuditHistoryModal.css'
import '../../styles/gantt.css'

/* ── Helpers ── */
const DEFAULT_STAGE_COLORS = ['#4361EE', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#F97316', '#F43F5E']
const STAGE_LABELS = ['Demo', 'Proposal', 'Negotiation', 'Approval', 'Won', 'Closed', 'Lost']

const formatDealValue = (val) => {
    if (!val || val === 0) return '0'
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)} MN`
    if (val >= 100000) return `${(val / 100000).toFixed(1)} L`
    if (val >= 1000) return `${(val / 1000).toFixed(1)} K`
    return val.toLocaleString()
}

const daysBetween = (a, b) => Math.ceil(Math.abs(new Date(b) - new Date(a)) / 86400000)

function hashColor(str) {
    const palette = ['#4361EE', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#F43F5E', '#F97316']
    let h = 0
    for (let i = 0; i < (str || '').length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
    return palette[Math.abs(h) % palette.length]
}

function fmtDate(d) {
    if (!d) return ''
    return new Date(d).toLocaleDateString('default', { day: 'numeric', month: 'short' })
}

function toInputDate(d) {
    if (!d) return ''
    return typeof d === 'string' ? d.split('T')[0] : new Date(d).toISOString().split('T')[0]
}

/* ──────────────────────────────────────────────────
   SINGLE-PROJECT GANTT VIEW
   (Same logic & styles as Projects page GanttView,
    but pre-filtered to show only the audit project)
   ────────────────────────────────────────────────── */
function SingleProjectGantt({ project }) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const [isExpanded, setIsExpanded] = useState(true)
    const [editingStage, setEditingStage] = useState(null)
    const [stageForm, setStageForm] = useState({ label: '', color: '#4361EE', startDate: '', endDate: '' })
    const [quarterFilter, setQuarterFilter] = useState('All')
    const [timeScale, setTimeScale] = useState('month')

    const currentYear = today.getFullYear()
    const QUARTERS = {
        Q1: { start: new Date(currentYear, 0, 1), end: new Date(currentYear, 2, 31) },
        Q2: { start: new Date(currentYear, 3, 1), end: new Date(currentYear, 5, 30) },
        Q3: { start: new Date(currentYear, 6, 1), end: new Date(currentYear, 8, 30) },
        Q4: { start: new Date(currentYear, 9, 1), end: new Date(currentYear, 11, 31) },
    }

    const getStages = () =>
        Array.isArray(project.stages) && project.stages.length
            ? project.stages
            : STAGE_LABELS.map((label, i) => ({ id: i, label, color: DEFAULT_STAGE_COLORS[i] }))

    const stages = getStages()
    const active = project.activeStage ?? 0

    // ── Collect dates ──
    const collectDates = () => {
        const dates = []
        if (project.startDate) dates.push(new Date(project.startDate))
        if (project.endDate) dates.push(new Date(project.endDate))
        stages.forEach(s => {
            if (s.startDate) dates.push(new Date(s.startDate))
            if (s.endDate) dates.push(new Date(s.endDate))
        })
        return dates
    }
    const allDates = collectDates()
    const hasAnyDate = allDates.length > 0

    // ── Timeline bounds ──
    let minDate, maxDate
    if (quarterFilter === 'Today') {
        minDate = new Date(today); minDate.setDate(minDate.getDate() - 3)
        maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 27)
    } else if (quarterFilter !== 'All' && QUARTERS[quarterFilter]) {
        const q = QUARTERS[quarterFilter]
        minDate = new Date(q.start)
        maxDate = new Date(q.end)
    } else if (timeScale === 'day') {
        minDate = new Date(today); minDate.setDate(minDate.getDate() - 3)
        maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 27)
    } else if (timeScale === 'year') {
        minDate = new Date(currentYear, 0, 1); minDate.setDate(minDate.getDate() - 3)
        maxDate = new Date(currentYear, 11, 31); maxDate.setDate(maxDate.getDate() + 5)
    } else {
        const minRaw = hasAnyDate ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const maxRaw = hasAnyDate ? new Date(Math.max(...allDates.map(d => d.getTime()), today.getTime())) : new Date(today.getFullYear(), today.getMonth() + 5, 0)
        minDate = new Date(minRaw); minDate.setDate(1); minDate.setDate(minDate.getDate() - 3)
        maxDate = new Date(maxRaw); maxDate.setDate(maxDate.getDate() + 15)
    }

    const span = maxDate - minDate
    const spanDays = Math.round(span / (1000 * 60 * 60 * 24))
    let minInnerWidth = 1200
    if (timeScale === 'day') minInnerWidth = Math.max(1200, 320 + spanDays * 35)
    else if (timeScale === 'month') minInnerWidth = Math.max(1200, 320 + (spanDays / 30.44) * 90)
    else minInnerWidth = Math.max(1200, 320 + (spanDays / 30.44) * 60)

    const unclampedPct = d => (((new Date(d) - minDate) / span) * 100)
    const pct = d => Math.max(0, Math.min(100, unclampedPct(d)))
    const widthPct = (start, end) => {
        const s = new Date(start), e = end ? new Date(end) : new Date(+new Date(start) + 30 * 86400000)
        return Math.max(1.5, ((Math.min(e, maxDate) - Math.max(s, minDate)) / span) * 100)
    }
    const todayPct = pct(today)

    // ── Column headers ──
    const timeColumns = []
    if (timeScale === 'day') {
        const dc = new Date(minDate)
        while (dc <= maxDate) {
            const isToday = dc.toDateString() === today.toDateString()
            const isWeekend = dc.getDay() === 0 || dc.getDay() === 6
            timeColumns.push({
                label: dc.getDate().toString(),
                sublabel: dc.getDate() === 1 || dc.toDateString() === new Date(minDate).toDateString()
                    ? dc.toLocaleString('default', { month: 'short' }) : '',
                pos: unclampedPct(dc),
                isToday, isWeekend,
            })
            dc.setDate(dc.getDate() + 1)
        }
    } else {
        const mc = new Date(minDate); mc.setDate(1)
        while (mc <= maxDate) {
            timeColumns.push({
                label: mc.toLocaleString('default', { month: 'short' }),
                sublabel: '',
                year: mc.getFullYear(),
                pos: unclampedPct(mc),
                isToday: false, isWeekend: false,
            })
            mc.setMonth(mc.getMonth() + 1)
        }
    }

    // ── Bar label ──
    const barLabel = (start, end) => {
        const fmt = d => new Date(d).toLocaleString('default', { month: 'short' })
        if (!start) return ''
        return end ? `${fmt(start)}–${fmt(end)}` : fmt(start)
    }

    const projectColor = '#4361EE'
    const hasDate = !!project.startDate
    const clientColor = hashColor(project.clientName)
    const initials = (project.clientName || 'NA').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

    return (
        <div className="gantt-wrap">
            {/* ── Top bar (legend + controls) ── */}
            <div className="gantt-top-bar">
                <div className="gantt-legend-row">
                    <span className="gl-item"><span className="gl-dot" style={{ background: projectColor }} />Project</span>
                    <span className="gl-item"><span className="gl-dot" style={{ background: '#8B5CF6' }} />Stage</span>
                    <span className="gl-item"><span className="gl-dot" style={{ background: '#06B6D4', opacity: 0.6 }} />Sub-stage</span>
                </div>
                <div className="gantt-qfilter-row">
                    <Filter size={12} className="gantt-qfilter-icon" />
                    {['Today', 'All', 'Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                        <button
                            key={q}
                            className={`gantt-qfilter-btn${quarterFilter === q ? ' active' : ''}`}
                            onClick={() => setQuarterFilter(q)}
                            title={q === 'Today' ? 'Focus on today' : q === 'All' ? 'Show full timeline' : `${q} ${currentYear}`}
                        >{q}</button>
                    ))}
                </div>
                <div className="gantt-scale-row">
                    <Calendar size={12} className="gantt-scale-icon" />
                    {[{ key: 'day', label: 'Days' }, { key: 'month', label: 'Month' }, { key: 'year', label: 'Yearly' }].map(s => (
                        <button
                            key={s.key}
                            className={`gantt-scale-btn${timeScale === s.key ? ' active' : ''}`}
                            onClick={() => setTimeScale(s.key)}
                        >{s.label}</button>
                    ))}
                </div>
                <div className="gantt-ctrl-row">
                    <button className="gantt-ctrl-btn" onClick={() => setIsExpanded(true)}>Expand All</button>
                    <button className="gantt-ctrl-btn" onClick={() => setIsExpanded(false)}>Collapse All</button>
                </div>
            </div>

            <div className="gantt-scroll-area">
                <div className="gantt-inner" style={{ minWidth: minInnerWidth }}>
                    {/* ── Header row ── */}
                    <div className={`gantt-header${timeScale === 'day' ? ' gantt-header-day' : ''}`}>
                        <div className="gantt-label-col gantt-header-label">Project / Stage</div>
                        <div className="gantt-track-col gantt-month-header">
                            {timeColumns.map((col, i) => (
                                <div key={i}
                                    className={`gantt-month-cell${col.isToday ? ' is-today-col' : ''}${col.isWeekend ? ' is-weekend-col' : ''}`}
                                    style={{ left: `${col.pos}%` }}
                                >
                                    <div className="gantt-month-rule" />
                                    {col.sublabel && <span className="gantt-col-sublabel">{col.sublabel}</span>}
                                    <span className={`gantt-month-name${timeScale === 'day' ? ' day-num' : ''}`}>{col.label}</span>
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
                        {/* Project row */}
                        <div className="gantt-row gantt-proj-row">
                            <div className="gantt-label-col gantt-proj-label">
                                <button className="gantt-toggle-btn" onClick={() => setIsExpanded(!isExpanded)}>
                                    {isExpanded ? <Minus size={11} /> : <Plus size={11} />}
                                </button>
                                <div className="gantt-avatar" style={{ background: `${clientColor}18`, color: clientColor }}>{initials}</div>
                                <div className="gantt-proj-info">
                                    <div className="gantt-proj-title">{project.title || 'Untitled'}</div>
                                    <div className="gantt-proj-sub">{project.clientName || '—'} · {project.type || 'Standard'}</div>
                                </div>
                            </div>

                            <div className="gantt-track-col gantt-track">
                                {timeColumns.map((col, i) => <div key={i} className={`gantt-grid-col${col.isWeekend ? ' weekend-col' : ''}`} style={{ left: `${col.pos}%` }} />)}
                                {todayPct >= 0 && todayPct <= 100 && <div className="gantt-row-today" style={{ left: `${todayPct}%` }} />}
                                {hasDate && (() => {
                                    const l = pct(project.startDate)
                                    const w = widthPct(project.startDate, project.endDate)
                                    const lbl = barLabel(project.startDate, project.endDate)
                                    return (
                                        <div className="gantt-bar gantt-proj-bar" style={{ left: `${l}%`, width: `${w}%`, background: projectColor }}>
                                            {w > 6 && <span className="gantt-bar-lbl">{lbl}</span>}
                                        </div>
                                    )
                                })()}
                                {!hasDate && <div className="gantt-no-date"><CalendarDays size={12} />No dates set</div>}
                            </div>
                        </div>

                        {/* Stage rows */}
                        {isExpanded && stages.map((stage, si) => {
                            const sc = stage.color || DEFAULT_STAGE_COLORS[si % DEFAULT_STAGE_COLORS.length]
                            const isDone = si < active
                            const isActive = si === active
                            const hasStageDates = !!stage.startDate

                            return (
                                <div key={`s${si}`} className={`gantt-row gantt-stage-row${isActive ? ' is-active' : ''}`}>
                                    <div className="gantt-label-col gantt-stage-label-col">
                                        <span className="gantt-s-indent" />
                                        <span className={`gantt-s-dot ${isDone ? 'done' : isActive ? 'active-dot' : ''}`}
                                            style={isDone || isActive ? { background: sc, boxShadow: isActive ? `0 0 0 3px ${sc}33` : 'none' } : {}} />
                                        <span className="gantt-s-name" style={{ color: isActive ? sc : isDone ? '#334155' : '#94A3B8' }}>
                                            {si + 1}. {stage.label}
                                        </span>
                                        {isDone && <CheckCircle2 size={11} style={{ color: '#10B981', flexShrink: 0 }} />}
                                        {isActive && <span className="gantt-active-pill" style={{ color: sc, borderColor: `${sc}44`, background: `${sc}12` }}>Active</span>}
                                    </div>

                                    <div className="gantt-track-col gantt-track">
                                        {timeColumns.map((col, i) => <div key={i} className={`gantt-grid-col${col.isWeekend ? ' weekend-col' : ''}`} style={{ left: `${col.pos}%` }} />)}
                                        {todayPct >= 0 && todayPct <= 100 && <div className="gantt-row-today" style={{ left: `${todayPct}%`, opacity: 0.35 }} />}
                                        {hasStageDates && (() => {
                                            const l = pct(stage.startDate)
                                            const w = widthPct(stage.startDate, stage.endDate)
                                            const lbl = barLabel(stage.startDate, stage.endDate)
                                            return (
                                                <div
                                                    className={`gantt-bar gantt-stage-bar${isDone ? ' done' : isActive ? ' active-bar' : ' pending'}`}
                                                    style={{ left: `${l}%`, width: `${w}%`, background: isDone ? sc : isActive ? sc : 'transparent', borderColor: sc }}
                                                >
                                                    {w > 5 && <span className="gantt-bar-lbl" style={{ color: isDone || isActive ? '#fff' : sc }}>{lbl}</span>}
                                                </div>
                                            )
                                        })()}
                                        {!hasStageDates && (
                                            <div className="gantt-no-date" style={{ paddingLeft: 16, fontSize: 11 }}>
                                                <CalendarDays size={11} />No stage dates
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ── Main Audit History Modal ── */
export default function AuditHistoryModal({ show, onHide, project, deliveryStages = [], financeStages = [], legalStages = [] }) {
    if (!project) return null

    const history = project.history || []
    const stages = project.stages || []

    // ── Split history by department ──
    const salesHistory = history.filter(h => !h.dept || h.dept === 'sales')
    const deliveryHistory = history.filter(h => h.dept === 'delivery')
    const financeHistory = history.filter(h => h.dept === 'finance')
    const legalHistory = history.filter(h => h.dept === 'legal')

    // ── Compute Summary Stats ──
    const currentStageLabel = stages[project.activeStage]?.label || 'N/A'
    const stageProgress = stages.length > 0 ? `${(project.activeStage || 0) + 1} / ${stages.length}` : '—'
    const totalDealValue = history.reduce((sum, h) => sum + (parseFloat(h.amount) || 0), 0)
    const primaryCurrency = history.find(h => h.currency)?.currency || 'INR'
    const firstEventTime = history.length > 0
        ? Math.min(...history.map(h => new Date(h.timestamp).getTime()))
        : null
    const projectDays = firstEventTime ? daysBetween(firstEventTime, Date.now()) : 0
    const totalEvents = history.length
    const activeDepts = [salesHistory, deliveryHistory, financeHistory, legalHistory].filter(arr => arr.length > 0).length

    const projectTitle = project.title || project.clientName || 'Untitled Project'
    const delay = project.delay || 0

    // ── Kanban columns ──
    const columns = [
        { id: 'sales', label: 'Sales History', items: salesHistory, color: '#3b82f6' },
        { id: 'delivery', label: 'Delivery History', items: deliveryHistory, color: '#AF52DE' },
        { id: 'finance', label: 'Finance History', items: financeHistory, color: '#34C759' },
        { id: 'legal', label: 'Legal History', items: legalHistory, color: '#FF9500' }
    ]

    const renderKanbanCard = (item, idx, color) => {
        const parts = (item.transition || '').split(' to ')
        const fromStage = parts[0] || ''
        const toStage = parts[1] || item.transition || ''

        return (
            <div key={idx} className="audit-kanban-card" style={{ borderLeft: `3px solid ${color}` }}>
                <div className="audit-kanban-card-header">{fromStage ? `${fromStage} to ${toStage}` : item.description}</div>
                {item.description && <div className="audit-kanban-card-status">{toStage ? toStage.toLowerCase() : ''}</div>}
                {(item.amount > 0) && (
                    <div className="audit-amount">Amt: {item.currency || 'INR'} {parseFloat(item.amount).toLocaleString()}</div>
                )}
                <div className="audit-date">
                    <Clock size={11} />
                    {new Date(item.timestamp).toLocaleString()}
                </div>
            </div>
        )
    }

    return (
        <Modal show={show} onHide={onHide} fullscreen={true} className="audit-history-modal">
            <Modal.Header closeButton>
                <Modal.Title className="d-flex align-items-center gap-2">
                    <Clock size={18} className="text-muted" />
                    Audit History
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="audit-modal-scroll">
                    {/* ── 1. Project Header ── */}
                    <div className="audit-header-section">
                        <div className="audit-header-left">
                            <h2>Project : {project.clientName || 'Unknown'} {project.title ? `— ${project.title}` : ''}</h2>
                            <div className="audit-header-desc">
                                {delay > 0 ? (
                                    <>Project <strong>{projectTitle}</strong> is <span className="delay-text">running delayed by {delay} Days</span></>
                                ) : (
                                    <>Project <strong>{projectTitle}</strong> is <span className="ontrack-text">on track</span></>
                                )}
                            </div>
                        </div>
                        <div className="audit-project-id-badge">
                            Project ID {project.customId || String(project.id || '').slice(-6).toUpperCase()}
                        </div>
                    </div>

                    {/* ── 2. Summary Stat Cards ── */}
                    <StatsGrid stats={[
                        { label: 'Current Stage', value: `${currentStageLabel} (${stageProgress})`, icon: <Target size={22} />, color: 'blue' },
                        { label: 'Deal Value', value: `${primaryCurrency} ${formatDealValue(totalDealValue)}`, icon: <DollarSign size={22} />, color: 'green' },
                        { label: 'Duration', value: `${projectDays} Days`, icon: <Timer size={22} />, color: 'orange' },
                        { label: 'Audit Events', value: totalEvents, icon: <Activity size={22} />, color: 'purple' },
                    ]} />

                    {/* ── 3. Branding Section ── */}
                    <div className="audit-branding-section">
                        <span className="brand-name">{project.brandingName || 'A365Shift'}</span>
                        <span className="handshake-icon">🤝</span>
                        <span className="brand-name">{project.clientName || 'Client'}</span>
                    </div>

                    {/* ── 4. Gantt Chart — Same as Projects page, filtered to this project ── */}
                    <SingleProjectGantt project={project} />

                    {/* ── 5. Department Kanban Board ── */}
                    <div className="audit-kanban-board">
                        {columns.map(col => (
                            <div key={col.id} className="audit-kanban-column">
                                <div className="audit-kanban-column-header" style={{ borderTopColor: col.color }}>
                                    {col.label}
                                    <span className="col-count">{col.items.length}</span>
                                </div>
                                <div className="audit-kanban-column-body">
                                    {col.items.length === 0 ? (
                                        <div className="audit-no-history">No history</div>
                                    ) : (
                                        col.items.map((item, idx) => renderKanbanCard(item, idx, col.color))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    )
}
