import { useState } from 'react'
import { Dropdown, Form } from 'react-bootstrap'
import { Filter, ArrowUpDown, Layers, SlidersHorizontal, Settings, Plus, Search } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import ColumnFilterPanel from '../ColumnFilterPanel/ColumnFilterPanel'
import './PageToolbar.css'

const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" />
    <line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" />
  </svg>
)

const KanbanIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 5v11" /><path d="M12 5v6" /><path d="M18 5v14" />
  </svg>
)

const ChartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
  </svg>
)

const VIEW_ICONS = { list: ListIcon, kanban: KanbanIcon, board: KanbanIcon, chart: ChartIcon }

export default function PageToolbar({
  title,
  itemCount,

  // Search
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search...',

  // Legacy filter (dropdown inside toolbar — kept for backwards compat)
  filters = [],
  filterBy = 'all',
  filterValue = '',
  onFilterChange,
  getFilterOptions,

  // Sort
  sortOptions = [],
  sortBy = '',
  sortOrder = 'asc',
  onSortChange,

  // Group By (optional)
  groupOptions = null,
  groupBy = '',
  onGroupChange,
  groupDisabled = false,

  // View Toggle
  viewModes = [],
  activeView = 'list',
  onViewChange,

  // ── ColumnFilterPanel props ──────────────────────
  // columns for the panel
  columns = [],
  onColumnToggle,
  onResetColumns,

  // panel-based filters (richer than legacy dropdown filters)
  panelFilters = [],
  panelFilterValues = {},
  onPanelFilterChange,
  onClearPanelFilters,

  // legacy column manager callback (used if no columns[] provided)
  onManageColumns,

  // Primary Actions
  actions = [],

  // Extra controls (e.g. Finance Month/Year/All toggle)
  extraControls = null,
}) {
  const { themeColor } = useTheme()
  const [panelOpen, setPanelOpen] = useState(false)

  // Count active panel filters
  const activePanelFilterCount = Object.values(panelFilterValues).filter(v => v !== '' && v != null).length

  // Determine whether to show the combined Filter+Columns button
  const showPanelBtn = columns.length > 0 || panelFilters.length > 0

  return (
    <>
      <div className="page-toolbar" style={{ '--dynamic-theme-color': themeColor || '#007AFF' }}>
        {/* Left: Title + Count */}
        <div className="page-toolbar-left">
          <h3 className="page-toolbar-title">{title}</h3>
          {itemCount != null && (
            <span className="page-toolbar-count">{itemCount}</span>
          )}

          {/* Search */}
          {onSearchChange && (
            <div className="page-toolbar-search">
              <Search size={15} className="page-toolbar-search-icon" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                className="page-toolbar-search-input"
              />
            </div>
          )}
        </div>

        {/* Right: Controls */}
        <div className="page-toolbar-right">
          <div className="page-toolbar-icons">

            {/* Legacy Filter dropdown */}
            {onFilterChange && filters.length > 0 && (
              <Dropdown align="end">
                <Dropdown.Toggle as="button" bsPrefix="p-0 border-0 bg-transparent"
                  className={`pt-icon-btn ${filterBy !== 'all' ? 'active' : ''}`} title="Filter">
                  <Filter size={18} />
                </Dropdown.Toggle>
                <Dropdown.Menu className="pt-dropdown-menu p-3">
                  <div className="mb-3">
                    <label className="small text-muted fw-bold mb-2 d-block">FILTER BY</label>
                    <Form.Select size="sm" value={filterBy}
                      onChange={(e) => onFilterChange(e.target.value, '')}>
                      <option value="all">None</option>
                      {filters.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </Form.Select>
                  </div>
                  {filterBy !== 'all' && getFilterOptions && (
                    <div>
                      <label className="small text-muted fw-bold mb-2 d-block">SELECT VALUE</label>
                      <Form.Select size="sm" value={filterValue}
                        onChange={(e) => onFilterChange(filterBy, e.target.value)}>
                        <option value="">Select...</option>
                        {getFilterOptions(filterBy).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </Form.Select>
                    </div>
                  )}
                  {filterBy !== 'all' && (
                    <div className="mt-3 pt-2 border-top text-end">
                      <button className="btn btn-link btn-sm text-danger text-decoration-none p-0"
                        onClick={() => onFilterChange('all', '')}>
                        Clear Filters
                      </button>
                    </div>
                  )}
                </Dropdown.Menu>
              </Dropdown>
            )}

            {/* Group By */}
            {onGroupChange && groupOptions && groupOptions.length > 0 && (
              <Dropdown align="end">
                <Dropdown.Toggle as="button" bsPrefix="p-0 border-0 bg-transparent"
                  className={`pt-icon-btn ${groupBy && groupBy !== 'none' && groupBy !== groupOptions[0]?.id ? 'active' : ''}`}
                  title="Group By" disabled={groupDisabled}>
                  <Layers size={18} />
                </Dropdown.Toggle>
                <Dropdown.Menu className="pt-dropdown-menu p-3">
                  <label className="small text-muted fw-bold mb-2 d-block">GROUP BY</label>
                  <Form.Select size="sm" value={groupBy}
                    onChange={(e) => onGroupChange(e.target.value)}>
                    {groupOptions.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </Form.Select>
                </Dropdown.Menu>
              </Dropdown>
            )}

            {/* Sort */}
            {onSortChange && sortOptions.length > 0 && (
              <Dropdown align="end">
                <Dropdown.Toggle as="button" bsPrefix="p-0 border-0 bg-transparent"
                  className="pt-icon-btn" title="Sort">
                  <ArrowUpDown size={18} />
                </Dropdown.Toggle>
                <Dropdown.Menu className="pt-dropdown-menu p-3">
                  <div className="mb-3">
                    <label className="small text-muted fw-bold mb-2 d-block">SORT BY</label>
                    <Form.Select size="sm" value={sortBy}
                      onChange={(e) => onSortChange(e.target.value, sortOrder)}>
                      {sortOptions.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </Form.Select>
                  </div>
                  <div>
                    <label className="small text-muted fw-bold mb-2 d-block">ORDER</label>
                    <div className="d-flex gap-2">
                      <button className={`btn btn-sm flex-grow-1 ${sortOrder === 'asc' ? 'btn-primary' : 'btn-light'}`}
                        onClick={() => onSortChange(sortBy, 'asc')}>Asc</button>
                      <button className={`btn btn-sm flex-grow-1 ${sortOrder === 'desc' ? 'btn-primary' : 'btn-light'}`}
                        onClick={() => onSortChange(sortBy, 'desc')}>Desc</button>
                    </div>
                  </div>
                </Dropdown.Menu>
              </Dropdown>
            )}

            {/* Combined Filter + Columns panel button */}
            {showPanelBtn && (
              <button
                className={`pt-filter-pill ${panelOpen || activePanelFilterCount > 0 ? 'pt-filter-pill--active' : ''}`}
                title="Filter & Columns"
                onClick={() => setPanelOpen(v => !v)}
              >
                <SlidersHorizontal size={16} strokeWidth={2.2} />
                {activePanelFilterCount > 0 && (
                  <span className="pt-filter-pill-badge">{activePanelFilterCount}</span>
                )}
              </button>
            )}

            {/* Legacy column manager button — shown only if no columns[] */}
            {!showPanelBtn && onManageColumns && (
              <button className="pt-icon-btn" title="Manage Columns" onClick={onManageColumns}>
                <Settings size={18} />
              </button>
            )}
          </div>

          {/* Extra controls slot */}
          {extraControls}

          {/* Divider before view toggles */}
          {viewModes.length > 0 && <div className="page-toolbar-divider" />}

          {/* View Toggles */}
          {viewModes.length > 0 && (
            <div className="page-toolbar-views">
              {viewModes.map(vm => {
                const IconComp = VIEW_ICONS[vm.id]
                return (
                  <button
                    key={vm.id}
                    className={`pt-view-btn ${activeView === vm.id ? 'active' : ''}`}
                    onClick={() => onViewChange(vm.id)}
                    title={vm.label || vm.id}
                  >
                    {vm.icon || (IconComp ? <IconComp /> : vm.label)}
                  </button>
                )
              })}
            </div>
          )}

          {/* Divider before action buttons */}
          {actions.length > 0 && <div className="page-toolbar-divider" />}

          {/* Action Buttons */}
          {actions.map((action, i) => (
            <button
              key={i}
              className={`btn pt-action-btn pt-action-${action.variant || 'primary'}`}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.icon || <Plus size={16} />}
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slide-in Filter & Columns panel */}
      <ColumnFilterPanel
        show={panelOpen}
        onClose={() => setPanelOpen(false)}
        columns={columns}
        onColumnToggle={onColumnToggle}
        onResetColumns={onResetColumns}
        filters={panelFilters}
        filterValues={panelFilterValues}
        onFilterChange={onPanelFilterChange}
        onClearFilters={onClearPanelFilters}
        activeFilterCount={activePanelFilterCount}
      />
    </>
  )
}
