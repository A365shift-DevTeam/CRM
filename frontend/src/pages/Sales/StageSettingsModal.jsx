import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, Plus, ArrowUp, ArrowDown, X, Settings2, TrendingUp, Truck, Wallet, Scale } from 'lucide-react'
import './StageSettingsModal.css'

const COLOR_OPTIONS = [
  { value: 'blue',   label: 'Blue',   hex: '#4361EE' },
  { value: 'cyan',   label: 'Cyan',   hex: '#06B6D4' },
  { value: 'green',  label: 'Green',  hex: '#10B981' },
  { value: 'orange', label: 'Orange', hex: '#F97316' },
  { value: 'purple', label: 'Purple', hex: '#8B5CF6' },
  { value: 'red',    label: 'Red',    hex: '#F43F5E' },
  { value: 'gray',   label: 'Gray',   hex: '#64748B' },
]

const getHex = (colorName) =>
  COLOR_OPTIONS.find(c => c.value === colorName)?.hex || '#64748B'

/* ── Default stages for each department ── */
export const getDefaultDeliveryStages = () => [
  { id: 0, label: 'Requirement Gathering', color: 'cyan',   ageing: 7  },
  { id: 1, label: 'Planning',              color: 'blue',   ageing: 10 },
  { id: 2, label: 'In Development',        color: 'purple', ageing: 30 },
  { id: 3, label: 'QA / Testing',          color: 'orange', ageing: 15 },
  { id: 4, label: 'UAT',                   color: 'gray',   ageing: 10 },
  { id: 5, label: 'Deployment',            color: 'green',  ageing: 7  },
  { id: 6, label: 'Delivered',             color: 'green',  ageing: 90 },
]

export const getDefaultFinanceStages = () => [
  { id: 0, label: 'Invoice Raised',     color: 'cyan',   ageing: 7  },
  { id: 1, label: 'Payment Pending',    color: 'orange', ageing: 30 },
  { id: 2, label: 'Partial Payment',    color: 'purple', ageing: 15 },
  { id: 3, label: 'Payment Received',   color: 'green',  ageing: 7  },
  { id: 4, label: 'Reconciled',         color: 'green',  ageing: 14 },
  { id: 5, label: 'Closed',             color: 'gray',   ageing: 90 },
]

export const getDefaultLegalStages = () => [
  { id: 0, label: 'Draft Contract',     color: 'blue',   ageing: 7  },
  { id: 1, label: 'Under Review',       color: 'orange', ageing: 10 },
  { id: 2, label: 'Negotiation',        color: 'purple', ageing: 15 },
  { id: 3, label: 'Awaiting Sign',      color: 'cyan',   ageing: 5  },
  { id: 4, label: 'Signed/Active',      color: 'green',  ageing: 90 },
]

export const DELIVERY_STORAGE_KEY = 'sales_stages_delivery'
export const FINANCE_STORAGE_KEY  = 'sales_stages_finance'
export const LEGAL_STORAGE_KEY    = 'sales_stages_legal'

export const loadStoredStages = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return fallback()
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(s => typeof s === 'object' && s !== null && typeof s.label === 'string')) {
      return parsed
    }
    return fallback()
  } catch {
    return fallback()
  }
}

/* ── Tab config ── */
const DEPARTMENT_TABS = [
  { key: 'sales',    label: 'Sales',    icon: TrendingUp, accent: '#4361EE' },
  { key: 'delivery', label: 'Delivery', icon: Truck,      accent: '#8B5CF6' },
  { key: 'finance',  label: 'Finance',  icon: Wallet,     accent: '#10B981' },
  { key: 'legal',    label: 'Legal',    icon: Scale,      accent: '#F43F5E' },
]

const StageSettingsModal = ({ show, handleClose, currentStages, onSave, productLabel, serviceLabel }) => {
  const [activeTab, setActiveTab] = useState('sales')

  // Sales stages (existing — passed in via props)
  const [salesStages, setSalesStages] = useState([])

  // Delivery & Finance & Legal stages (independent, from localStorage)
  const [deliveryStages, setDeliveryStages] = useState([])
  const [financeStages, setFinanceStages]   = useState([])
  const [legalStages, setLegalStages]       = useState([])

  // Tab labels (existing)
  const [localProductLabel, setLocalProductLabel] = useState(productLabel || 'Product')
  const [localServiceLabel, setLocalServiceLabel] = useState(serviceLabel || 'Service')

  useEffect(() => {
    if (show) {
      setSalesStages(currentStages.map(s => ({ ...s, ageing: s.ageing || 30 })))
      setDeliveryStages(loadStoredStages(DELIVERY_STORAGE_KEY, getDefaultDeliveryStages))
      setFinanceStages(loadStoredStages(FINANCE_STORAGE_KEY, getDefaultFinanceStages))
      setLegalStages(loadStoredStages(LEGAL_STORAGE_KEY, getDefaultLegalStages))
      setLocalProductLabel(productLabel || 'Product')
      setLocalServiceLabel(serviceLabel || 'Service')
      setActiveTab('sales')
    }
  }, [show, currentStages, productLabel, serviceLabel])

  /* ── Helpers to get/set the active department's stages ── */
  const getActiveStages = () => {
    if (activeTab === 'delivery') return deliveryStages
    if (activeTab === 'finance')  return financeStages
    if (activeTab === 'legal')    return legalStages
    return salesStages
  }

  const setActiveStages = (newStages) => {
    if (activeTab === 'delivery') setDeliveryStages(newStages)
    else if (activeTab === 'finance') setFinanceStages(newStages)
    else if (activeTab === 'legal') setLegalStages(newStages)
    else setSalesStages(newStages)
  }

  const stages = getActiveStages()

  /* ── Stage manipulation ── */
  const handleLabelChange  = (i, v) => { const s = [...stages]; s[i].label  = v;                  setActiveStages(s) }
  const handleColorChange  = (i, v) => { const s = [...stages]; s[i].color  = v;                  setActiveStages(s) }
  const handleAgeingChange = (i, v) => { const s = [...stages]; s[i].ageing = parseInt(v) || 0;   setActiveStages(s) }

  const handleAddStage = () => {
    const newId = Math.max(...stages.map(s => s.id), 0) + 1
    const colors = ['blue', 'cyan', 'green', 'orange', 'purple', 'red', 'gray']
    setActiveStages([...stages, { id: newId, label: 'New Stage', color: colors[stages.length % colors.length], ageing: 30 }])
  }

  const handleDelete = (i) => {
    if (stages.length <= 1) return
    setActiveStages(stages.filter((_, idx) => idx !== i))
  }

  const moveStage = (i, dir) => {
    if (dir === 'up'   && i === 0)                 return
    if (dir === 'down' && i === stages.length - 1) return
    const s = [...stages]
    const ti = dir === 'up' ? i - 1 : i + 1;
    [s[i], s[ti]] = [s[ti], s[i]]
    setActiveStages(s)
  }

  /* ── Save all departments ── */
  const handleSaveAll = () => {
    // Persist Delivery & Finance to localStorage
    localStorage.setItem(DELIVERY_STORAGE_KEY, JSON.stringify(deliveryStages))
    localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(financeStages))
    localStorage.setItem(LEGAL_STORAGE_KEY, JSON.stringify(legalStages))

    onSave(salesStages, {
      productLabel: localProductLabel,
      serviceLabel: localServiceLabel,
      deliveryStages,
      financeStages,
      legalStages
    })
    handleClose()
  }

  if (!show) return null

  const currentTabConfig = DEPARTMENT_TABS.find(t => t.key === activeTab)
  const activeAccent = currentTabConfig?.accent
  const ActiveIcon = currentTabConfig?.icon
  const activeLabel = currentTabConfig?.label

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="ssm-settings-backdrop" onClick={handleClose} />

      {/* Modal */}
      <div className="ssm-settings-modal" role="dialog" aria-modal="true">

        {/* ── Header ── */}
        <div className="ssm-header">
          <div className="ssm-header-left">
            <div className="ssm-header-icon">
              <Settings2 size={16} />
            </div>
            <div>
              <h2 className="ssm-title">Configure Stages</h2>
              <p className="ssm-subtitle">Manage pipeline stages across departments</p>
            </div>
          </div>
          <button className="ssm-close" onClick={handleClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>

        {/* ── Department Tabs ── */}
        <div className="ssm-dept-tabs">
          {DEPARTMENT_TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                className={`ssm-dept-tab${isActive ? ' ssm-dept-tab--active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                style={isActive ? { '--tab-accent': tab.accent } : undefined}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {isActive && <span className="ssm-dept-tab-count">{stages.length}</span>}
              </button>
            )
          })}
        </div>

        {/* ── Body ── */}
        <div className="ssm-settings-body">

          {/* Tab labels — only show for Sales tab */}
          {activeTab === 'sales' && (
            <>
              <div className="ssm-section-label">Tab Labels</div>
              <div className="ssm-labels-row">
                <div className="ssm-field-group">
                  <label className="ssm-field-label">Product Tab</label>
                  <input
                    type="text"
                    className="ssm-input"
                    value={localProductLabel}
                    onChange={e => setLocalProductLabel(e.target.value)}
                    placeholder="Products"
                  />
                </div>
                <div className="ssm-field-group">
                  <label className="ssm-field-label">Service Tab</label>
                  <input
                    type="text"
                    className="ssm-input"
                    value={localServiceLabel}
                    onChange={e => setLocalServiceLabel(e.target.value)}
                    placeholder="Services"
                  />
                </div>
              </div>
            </>
          )}

          {/* Contextual Description Banner for Delivery/Finance/Legal */}
          {activeTab !== 'sales' && (
            <div className="ssm-dept-description">
              <div className="ssm-dept-icon" style={{ background: `${activeAccent}1A`, color: activeAccent }}>
                 <ActiveIcon size={18} strokeWidth={2} />
              </div>
              <div className="ssm-dept-text">
                <strong>{activeLabel} Stages</strong>
                <p>
                  These stages apply universally to all {activeLabel.toLowerCase()} workflows.
                  Customize the step-by-step process below.
                </p>
              </div>
            </div>
          )}

          {/* Stage table */}
          <div className="ssm-section-label" style={{ marginTop: activeTab === 'sales' ? 20 : 0 }}>
            {currentTabConfig?.label} Stages
          </div>

          <div className="ssm-table-head">
            <span>Order</span>
            <span>Stage Name</span>
            <span>Ageing (Days)</span>
            <span>Color</span>
            <span></span>
          </div>

          <div className="ssm-stage-list">
            {stages.map((stage, index) => (
              <div key={stage.id} className="ssm-stage-row">

                {/* Sort */}
                <div className="ssm-sort-wrap">
                  <button
                    className="ssm-sort-btn"
                    onClick={() => moveStage(index, 'up')}
                    disabled={index === 0}
                    title="Move up"
                  >
                    <ArrowUp size={11} />
                  </button>
                  <span className="ssm-sort-idx">{index + 1}</span>
                  <button
                    className="ssm-sort-btn"
                    onClick={() => moveStage(index, 'down')}
                    disabled={index === stages.length - 1}
                    title="Move down"
                  >
                    <ArrowDown size={11} />
                  </button>
                </div>

                {/* Stage Name */}
                <div className="ssm-name-wrap">
                  <span className="ssm-color-dot" style={{ background: getHex(stage.color) }} />
                  <input
                    type="text"
                    className="ssm-name-input"
                    value={stage.label}
                    onChange={e => handleLabelChange(index, e.target.value)}
                    placeholder="Stage name"
                  />
                </div>

                {/* Ageing */}
                <div className="ssm-age-wrap">
                  <input
                    type="number"
                    className="ssm-input ssm-age-input"
                    min="1"
                    value={stage.ageing || 30}
                    onChange={e => handleAgeingChange(index, e.target.value)}
                    placeholder="30"
                  />
                  <span className="ssm-age-unit">d</span>
                </div>

                {/* Color */}
                <select
                  className="ssm-select"
                  value={stage.color}
                  onChange={e => handleColorChange(index, e.target.value)}
                  style={{ borderLeftColor: getHex(stage.color) }}
                >
                  {COLOR_OPTIONS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>

                {/* Delete */}
                <button
                  className="ssm-delete-btn"
                  onClick={() => handleDelete(index)}
                  disabled={stages.length <= 1}
                  title="Remove stage"
                >
                  <Trash2 size={13} />
                </button>

              </div>
            ))}
          </div>

          {/* Add stage */}
          <button className="ssm-add-btn" onClick={handleAddStage}>
            <Plus size={14} />
            Add Stage
          </button>
        </div>

        {/* ── Footer ── */}
        <div className="ssm-settings-footer">
          <button className="ssm-btn-cancel" onClick={handleClose}>Cancel</button>
          <button
            className="ssm-settings-btn-save"
            onClick={handleSaveAll}
          >
            Save Changes
          </button>
        </div>

      </div>
    </>,
    document.body
  )
}

export default StageSettingsModal
