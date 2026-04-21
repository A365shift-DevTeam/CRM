import { useEffect, useRef } from 'react'
import { X, SlidersHorizontal, Columns3 } from 'lucide-react'
import './ColumnFilterPanel.css'

/**
 * ColumnFilterPanel — Reusable slide-in right panel
 *
 * Props:
 *  show           boolean  — open/close
 *  onClose        fn       — close callback
 *
 *  // Column visibility
 *  columns        Array<{ id, label, visible }>
 *  onColumnToggle fn(id)   — toggle a single column
 *  onResetColumns fn()     — restore all columns to visible
 *
 *  // Filters
 *  filters        Array<{ id, label, type: 'select'|'date'|'range'|'search', options?: string[] }>
 *  filterValues   object   — { [filterId]: value }
 *  onFilterChange fn(id, value)
 *  onClearFilters fn()
 *
 *  activeFilterCount  number — badge count shown on trigger button
 */
export default function ColumnFilterPanel({
  show,
  onClose,
  columns = [],
  onColumnToggle,
  onResetColumns,
  filters = [],
  filterValues = {},
  onFilterChange,
  onClearFilters,
  activeFilterCount = 0,
}) {
  const panelRef = useRef(null)

  // Close on Escape key
  useEffect(() => {
    if (!show) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [show, onClose])

  // Trap focus / close on outside click
  useEffect(() => {
    if (!show) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    // small delay so the open-click doesn't immediately close
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 80)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
  }, [show, onClose])

  const visibleCount  = columns.filter(c => c.visible !== false).length
  const hasFilters    = Object.values(filterValues).some(v => v !== '' && v != null)

  return (
    <>
      {/* Backdrop */}
      <div className={`cfp-backdrop ${show ? 'cfp-backdrop--visible' : ''}`} onClick={onClose} />

      {/* Panel */}
      <aside className={`cfp-panel ${show ? 'cfp-panel--open' : ''}`} ref={panelRef} aria-label="Filter & Columns panel">

        {/* Header */}
        <div className="cfp-header">
          <div className="cfp-header-left">
            <SlidersHorizontal size={16} strokeWidth={2.2} />
            <span className="cfp-header-title">Filter &amp; Columns</span>
          </div>
          <button className="cfp-close-btn" onClick={onClose} title="Close panel">
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="cfp-body">

          {/* ── Filters section ── */}
          {filters.length > 0 && (
            <section className="cfp-section">
              <div className="cfp-section-hd">
                <span className="cfp-section-label">Filters</span>
                {hasFilters && (
                  <button className="cfp-clear-btn" onClick={onClearFilters}>
                    Clear all
                  </button>
                )}
              </div>

              <div className="cfp-filters-list">
                {filters.map(f => (
                  <div key={f.id} className="cfp-filter-row">
                    <label className="cfp-filter-label">{f.label}</label>

                    {f.type === 'select' && (
                      <select
                        className="cfp-filter-select"
                        value={filterValues[f.id] || ''}
                        onChange={e => onFilterChange(f.id, e.target.value)}
                      >
                        <option value="">All</option>
                        {(f.options || []).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {f.type === 'search' && (
                      <input
                        type="text"
                        className="cfp-filter-input"
                        placeholder={`Search ${f.label.toLowerCase()}…`}
                        value={filterValues[f.id] || ''}
                        onChange={e => onFilterChange(f.id, e.target.value)}
                      />
                    )}

                    {f.type === 'date' && (
                      <input
                        type="date"
                        className="cfp-filter-input"
                        value={filterValues[f.id] || ''}
                        onChange={e => onFilterChange(f.id, e.target.value)}
                      />
                    )}

                    {f.type === 'daterange' && (
                      <div className="cfp-date-range">
                        <input
                          type="date"
                          className="cfp-filter-input"
                          placeholder="From"
                          value={filterValues[`${f.id}_from`] || ''}
                          onChange={e => onFilterChange(`${f.id}_from`, e.target.value)}
                        />
                        <span className="cfp-date-sep">—</span>
                        <input
                          type="date"
                          className="cfp-filter-input"
                          placeholder="To"
                          value={filterValues[`${f.id}_to`] || ''}
                          onChange={e => onFilterChange(`${f.id}_to`, e.target.value)}
                        />
                      </div>
                    )}

                    {/* Active indicator dot */}
                    {(filterValues[f.id] || filterValues[`${f.id}_from`] || filterValues[`${f.id}_to`]) ? (
                      <span className="cfp-filter-dot" />
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Divider between sections ── */}
          {filters.length > 0 && columns.length > 0 && (
            <div className="cfp-divider" />
          )}

          {/* ── Columns section ── */}
          {columns.length > 0 && (
            <section className="cfp-section">
              <div className="cfp-section-hd">
                <div className="cfp-section-hd-left">
                  <Columns3 size={13} strokeWidth={2.2} />
                  <span className="cfp-section-label">Columns</span>
                  <span className="cfp-col-count">{visibleCount}/{columns.length}</span>
                </div>
                {onResetColumns && (
                  <button className="cfp-clear-btn" onClick={onResetColumns}>
                    Reset
                  </button>
                )}
              </div>

              <div className="cfp-columns-list">
                {columns.map(col => (
                  <label key={col.id} className="cfp-col-row">
                    <span className="cfp-col-label">{col.label}</span>
                    <div
                      className={`cfp-toggle ${col.visible !== false ? 'cfp-toggle--on' : ''}`}
                      onClick={() => onColumnToggle && onColumnToggle(col.id)}
                      role="switch"
                      aria-checked={col.visible !== false}
                      tabIndex={0}
                      onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') onColumnToggle && onColumnToggle(col.id) }}
                    >
                      <div className="cfp-toggle-thumb" />
                    </div>
                  </label>
                ))}
              </div>
            </section>
          )}
        </div>
      </aside>
    </>
  )
}
