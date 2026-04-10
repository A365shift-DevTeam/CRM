import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, Plus, ArrowUp, ArrowDown, X, Settings2 } from 'lucide-react'
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

const StageSettingsModal = ({ show, handleClose, currentStages, onSave, productLabel, serviceLabel }) => {
  const [stages, setStages] = useState([])
  const [localProductLabel, setLocalProductLabel] = useState(productLabel || 'Product')
  const [localServiceLabel, setLocalServiceLabel] = useState(serviceLabel || 'Service')

  useEffect(() => {
    if (show) {
      setStages(currentStages.map(s => ({ ...s, ageing: s.ageing || 30 })))
      setLocalProductLabel(productLabel || 'Product')
      setLocalServiceLabel(serviceLabel || 'Service')
    }
  }, [show, currentStages, productLabel, serviceLabel])

  const handleLabelChange  = (i, v) => { const s = [...stages]; s[i].label  = v;                  setStages(s) }
  const handleColorChange  = (i, v) => { const s = [...stages]; s[i].color  = v;                  setStages(s) }
  const handleAgeingChange = (i, v) => { const s = [...stages]; s[i].ageing = parseInt(v) || 0;   setStages(s) }

  const handleAddStage = () => {
    const newId = Math.max(...stages.map(s => s.id), 0) + 1
    const colors = ['blue', 'cyan', 'green', 'orange', 'purple', 'red', 'gray']
    setStages([...stages, { id: newId, label: 'New Stage', color: colors[stages.length % colors.length], ageing: 30 }])
  }

  const handleDelete = (i) => {
    if (stages.length <= 1) return
    setStages(stages.filter((_, idx) => idx !== i))
  }

  const moveStage = (i, dir) => {
    if (dir === 'up'   && i === 0)                 return
    if (dir === 'down' && i === stages.length - 1) return
    const s = [...stages]
    const ti = dir === 'up' ? i - 1 : i + 1;
    [s[i], s[ti]] = [s[ti], s[i]]
    setStages(s)
  }

  if (!show) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="ssm-backdrop" onClick={handleClose} />

      {/* Modal */}
      <div className="ssm-modal" role="dialog" aria-modal="true">

        {/* ── Header ── */}
        <div className="ssm-header">
          <div className="ssm-header-left">
            <div className="ssm-header-icon"><Settings2 size={16} /></div>
            <div>
              <h2 className="ssm-title">Configure Stages</h2>
              <p className="ssm-subtitle">Manage pipeline stages and tab labels</p>
            </div>
          </div>
          <button className="ssm-close" onClick={handleClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="ssm-body">

          {/* Tab labels */}
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

          {/* Stage table */}
          <div className="ssm-section-label" style={{ marginTop: 20 }}>Pipeline Stages</div>

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
        <div className="ssm-footer">
          <button className="ssm-btn-cancel" onClick={handleClose}>Cancel</button>
          <button
            className="ssm-btn-save"
            onClick={() => onSave(stages, { productLabel: localProductLabel, serviceLabel: localServiceLabel })}
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
