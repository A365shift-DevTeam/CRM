import { useState, useEffect, useMemo } from 'react'
import { Row, Col, Card, Button, Form, Badge, Modal, Dropdown } from 'react-bootstrap'
import { Plus, TrendingUp, DollarSign, Calendar, TrendingDown, Search, Edit, Trash2, Eye, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Settings } from 'lucide-react'
import { expenseService } from '../../services/expenseService'
import { incomeService } from '../../services/incomeService'
import { ExpenseModal } from './ExpenseModal'
import { IncomeModal } from './IncomeModal'
import FinanceSettingsModal, { DEFAULT_EXPENSE_FIELDS, DEFAULT_INCOME_FIELDS } from './FinanceSettingsModal'
import { formatGlobalCurrency } from '../../utils/currencyUtils'
import { useToast } from '../../components/Toast/ToastContext'
import './Finance.css'

const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Food', color: '#f59e0b' },
  { id: 'accommodation', label: 'Accommodation', color: '#8b5cf6' },
  { id: 'allowances', label: 'Allowances', color: '#10b981' },
  { id: 'silicon_server', label: 'Silicon - Server', color: '#6366f1' },
  { id: 'travel', label: 'Travel', color: '#3b82f6' },
  { id: 'salary', label: 'Salary', color: '#14b8a6' },
  { id: 'bank_charges', label: 'Bank Charges', color: '#f43f5e' },
  { id: 'printing_stationery', label: 'Printing & Stationery', color: '#d946ef' },
  { id: 'rent', label: 'Rent', color: '#0ea5e9' },
  { id: 'professional_fees', label: 'Professional Fees', color: '#84cc16' },
  { id: 'consultancy_charges', label: 'Consultancy Charges', color: '#eab308' },
  { id: 'telephone_internet', label: 'Telephone Internet', color: '#06b6d4' },
  { id: 'software_expenses', label: 'Software Expenses', color: '#a855f7' },
  { id: 'project_tax', label: 'Project Tax & Charges', color: '#ea580c' },
  { id: 'general_expenses', label: 'General Expenses', color: '#64748b' }
]

const INCOME_CATEGORIES = [
  { id: 'sales', label: 'Sales', color: '#10b981' },
  { id: 'services', label: 'Services', color: '#3b82f6' },
  { id: 'investments', label: 'Investments', color: '#8b5cf6' },
  { id: 'other', label: 'Other', color: '#f59e0b' }
]

const Finance = () => {
  const toast = useToast()
  const [expenses, setExpenses] = useState([])
  const [incomes, setIncomes] = useState([])
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [financeConfig, setFinanceConfig] = useState(() => {
    const saved = localStorage.getItem('finance_config')
    return saved ? JSON.parse(saved) : { expenseFields: DEFAULT_EXPENSE_FIELDS, incomeFields: DEFAULT_INCOME_FIELDS }
  })
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [editingIncome, setEditingIncome] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Detail view states
  const [viewingItem, setViewingItem] = useState(null)
  const [viewingType, setViewingType] = useState(null) // 'expense' or 'income'
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBy, setFilterBy] = useState('all') // 'all', 'type', 'category'
  const [filterValue, setFilterValue] = useState('')
  const [sortBy, setSortBy] = useState('date') // 'date', 'amount'
  const [sortOrder, setSortOrder] = useState('desc')
  const [viewMode, setViewMode] = useState('all') // 'all', 'year', 'month'

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // ... (loadData etc remain same)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [expensesData, incomesData] = await Promise.all([
        expenseService.getExpenses(),
        incomeService.getIncomes()
      ])
      setExpenses(expensesData || [])
      setIncomes(incomesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadExpenses = async () => {

    try {
      const data = await expenseService.getExpenses()
      setExpenses(data || [])
    } catch (error) {
      console.error('Error loading expenses:', error)
    }
  }

  const loadIncomes = async () => {
    try {
      const data = await incomeService.getIncomes()
      setIncomes(data || [])
    } catch (error) {
      console.error('Error loading incomes:', error)
    }
  }

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const expenseTotal = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
    const incomeTotal = incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0)
    const netProfit = incomeTotal - expenseTotal

    const expenseAverage = expenses.length > 0 ? expenseTotal / expenses.length : 0
    const incomeAverage = incomes.length > 0 ? incomeTotal / incomes.length : 0

    const now = new Date()
    const expenseThisMonth = expenses.filter(exp => {
      const expDate = new Date(exp.date)
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear()
    }).reduce((sum, exp) => sum + (exp.amount || 0), 0)

    const incomeThisMonth = incomes.filter(inc => {
      const incDate = new Date(inc.date)
      return incDate.getMonth() === now.getMonth() && incDate.getFullYear() === now.getFullYear()
    }).reduce((sum, inc) => sum + (inc.amount || 0), 0)

    const netThisMonth = incomeThisMonth - expenseThisMonth

    return {
      expenseTotal,
      incomeTotal,
      netProfit,
      expenseAverage,
      incomeAverage,
      expenseThisMonth,
      incomeThisMonth,
      netThisMonth,
      expenseCount: expenses.length,
      incomeCount: incomes.length
    }
  }, [expenses, incomes])

  // Helper to check time period
  const checkTimePeriod = (dateStr) => {
    if (viewMode === 'all') return true;
    const date = new Date(dateStr);
    const now = new Date();
    if (viewMode === 'year') return date.getFullYear() === now.getFullYear();
    if (viewMode === 'month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    return true;
  };

  // Combined and sorted transactions with all filters applied
  const combinedTransactions = useMemo(() => {
    // 1. Combine raw data first
    let allItems = [
      ...expenses.map(e => ({ ...e, type: 'expense', uniqueId: `expense-${e.id}` })),
      ...incomes.map(i => ({ ...i, type: 'income', uniqueId: `income-${i.id}` }))
    ];

    // 2. Filter
    allItems = allItems.filter(item => {
      // Time Period
      if (!checkTimePeriod(item.date)) return false;

      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (item.description || '').toLowerCase().includes(query) ||
          (item.amount || 0).toString().includes(query);
        if (!matchesSearch) return false;
      }

      // Column Filter
      if (filterBy === 'type' && filterValue) {
        if (item.type !== filterValue) return false;
      }
      if (filterBy === 'category' && filterValue) {
        if (item.category !== filterValue) return false;
      }

      return true;
    });

    // 3. Sort
    allItems.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'date') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else if (sortBy === 'amount') {
        // Numeric comparison already fine
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return allItems;
  }, [expenses, incomes, viewMode, searchQuery, filterBy, filterValue, sortBy, sortOrder]);


  // Pagination calculations
  const totalEntries = combinedTransactions.length
  const totalPages = Math.ceil(totalEntries / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = Math.min(startIndex + rowsPerPage, totalEntries)
  const paginatedTransactions = combinedTransactions.slice(startIndex, endIndex)

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [viewMode, searchQuery, filterBy, filterValue])

  // ... (handlers remain mostly same)
  const formatCurrency = (amount) => {
    return formatGlobalCurrency(amount, 'INR')
  }

  // Expense handlers
  const handleCreateExpense = () => {
    setEditingExpense(null)
    setShowExpenseModal(true)
  }

  const handleEditExpense = (expense) => {
    setEditingExpense(expense)
    setShowExpenseModal(true)
  }

  const handleSaveExpense = async (expenseData) => {
    try {
      if (editingExpense) {
        await expenseService.updateExpense(editingExpense.id, expenseData)
      } else {
        await expenseService.createExpense(expenseData)
      }
      await loadExpenses()
      setShowExpenseModal(false)
      toast.success(editingExpense ? 'Expense updated' : 'Expense created')
      setEditingExpense(null)
    } catch (error) {
      console.error('Error saving expense:', error)
      toast.error('Failed to save expense')
    }
  }

  const handleDeleteExpense = async (expenseId) => {
    try {
      await expenseService.deleteExpense(expenseId)
      await loadExpenses()
      setShowExpenseModal(false)
      setEditingExpense(null)
      setShowDetailModal(false)
      setViewingItem(null)
      setViewingType(null)
      toast.success('Expense deleted')
    } catch (error) {
      console.error('Error deleting expense:', error)
      toast.error('Failed to delete expense')
    }
  }

  // Income handlers
  const handleCreateIncome = () => {
    setEditingIncome(null)
    setShowIncomeModal(true)
  }

  const handleEditIncome = (income) => {
    setEditingIncome(income)
    setShowIncomeModal(true)
  }

  const handleSaveIncome = async (incomeData) => {
    try {
      if (editingIncome) {
        await incomeService.updateIncome(editingIncome.id, incomeData)
      } else {
        await incomeService.createIncome(incomeData)
      }
      await loadIncomes()
      setShowIncomeModal(false)
      toast.success(editingIncome ? 'Income updated' : 'Income recorded')
      setEditingIncome(null)
    } catch (error) {
      console.error('Error saving income:', error)
      toast.error('Failed to save income')
    }
  }

  const handleDeleteIncome = async (incomeId) => {
    try {
      await incomeService.deleteIncome(incomeId)
      await loadIncomes()
      setShowIncomeModal(false)
      setEditingIncome(null)
      setShowDetailModal(false)
      setViewingItem(null)
      setViewingType(null)
      toast.success('Income deleted')
    } catch (error) {
      console.error('Error deleting income:', error)
      toast.error('Failed to delete income')
    }
  }

  // Pagination handlers
  const handleRowsPerPageChange = (count) => {
    setRowsPerPage(count)
    setCurrentPage(1)
  }

  const goToFirstPage = () => setCurrentPage(1)
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1))
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1))
  const goToLastPage = () => setCurrentPage(totalPages)

  if (isLoading) {
    return (
      <div className="finance-container">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  const getFilterOptions = (type) => {
    if (type === 'type') return ['income', 'expense'];
    if (type === 'category') {
      // Combine all unique category IDs
      const s = new Set([...EXPENSE_CATEGORIES.map(c => c.id), ...INCOME_CATEGORIES.map(c => c.id)]);
      return Array.from(s).sort();
    }
    return [];
  };

  return (
    <div className="finance-container">
      {/* Header Section */}
      <div className="finance-header">
        {/* Removed old period filters */}

        {/* Summary Statistics - Grid View */}
        <div className="stats-grid mt-4">
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper red">
                <TrendingDown size={24} color="#ef4444" />
              </div>
              <div className="stat-content">
                <div className="stat-title">Total Expenses</div>
                <div className="stat-value text-danger">{formatCurrency(overallStats.expenseTotal)}</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper green">
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-title">Total Income</div>
                <div className="stat-value text-success">{formatCurrency(overallStats.incomeTotal)}</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper blue">
                <DollarSign size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-title">Net Profit</div>
                <div className="stat-value" style={{ color: overallStats.netProfit >= 0 ? '#10b981' : '#ef4444' }}>
                  {formatCurrency(overallStats.netProfit)}
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper purple">
                <Calendar size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-title">This Month Net</div>
                <div className="stat-value" style={{ color: overallStats.netThisMonth >= 0 ? '#10b981' : '#ef4444' }}>
                  {formatCurrency(overallStats.netThisMonth)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Filter Toolbar */}
      <div className="finance-toolbar mb-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 p-3 bg-white rounded-3 shadow-sm border">
          {/* Search - Left */}
          <div className="search-wrapper" style={{ minWidth: '300px' }}>
            <div className="position-relative">
              <div className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted">
                <Search size={18} />
              </div>
              <Form.Control
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-5 shadow-none border-secondary-subtle"
              />
            </div>
          </div>

          {/* Controls - Right */}
          <div className="d-flex align-items-center gap-2">
            {/* Filter Button */}
            <Dropdown align="end">
              <Dropdown.Toggle as="button" className="icon-btn" id="filter-dropdown">
                <div className={`icon-wrapper ${filterBy !== 'all' ? 'active' : ''}`}>
                  <div className="filter-icon">
                    {/* Using svg filter icon directly or Lucide Component if simpler, sticking to SVG for consistency with Timesheet snippet if needed, but we have Lucide imported */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                    </svg>
                  </div>
                </div>
              </Dropdown.Toggle>
              <Dropdown.Menu className="timesheet-dropdown-menu p-3" style={{ minWidth: '260px' }}>
                <div className="mb-3">
                  <Form.Label className="small text-muted fw-bold mb-2">FILTER BY</Form.Label>
                  <Form.Select
                    value={filterBy}
                    onChange={(e) => {
                      setFilterBy(e.target.value);
                      setFilterValue('');
                    }}
                    size="sm"
                    className="form-select-sm"
                  >
                    <option value="all">None</option>
                    <option value="type">Type</option>
                    <option value="category">Category</option>
                  </Form.Select>
                </div>
                {filterBy !== 'all' && (
                  <div>
                    <Form.Label className="small text-muted fw-bold mb-2">VALUE</Form.Label>
                    <Form.Select
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      size="sm"
                      className="form-select-sm"
                    >
                      <option value="">Select...</option>
                      {getFilterOptions(filterBy).map(val => (
                        <option key={val} value={val}>{
                          val.charAt(0).toUpperCase() + val.slice(1)
                        }</option>
                      ))}
                    </Form.Select>
                  </div>
                )}
                {filterBy !== 'all' && (
                  <div className="mt-3 pt-2 border-top text-end">
                    <button
                      className="btn btn-link btn-sm text-danger text-decoration-none p-0"
                      onClick={() => {
                        setFilterBy('all')
                        setFilterValue('')
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </Dropdown.Menu>
            </Dropdown>

            {/* Sort Button */}
            <Dropdown align="end">
              <Dropdown.Toggle as="button" className="icon-btn" id="sort-dropdown">
                <div className="icon-wrapper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <polyline points="19 12 12 19 5 12"></polyline>
                  </svg>
                </div>
              </Dropdown.Toggle>
              <Dropdown.Menu className="timesheet-dropdown-menu p-3" style={{ minWidth: '240px' }}>
                <div className="mb-3">
                  <Form.Label className="small text-muted fw-bold mb-2">SORT BY</Form.Label>
                  <Form.Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    size="sm"
                    className="form-select-sm"
                  >
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                  </Form.Select>
                </div>
                <div>
                  <Form.Label className="small text-muted fw-bold mb-2">ORDER</Form.Label>
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

            {/* Settings Button */}
            <button className="icon-btn" onClick={() => setShowSettingsModal(true)} title="Configure Fields">
              <div className="icon-wrapper">
                <Settings size={20} />
              </div>
            </button>

            <div className="vr mx-2 opacity-25"></div>

            {/* View Mode */}
            <div className="btn-group view-mode-toggle me-2">
              <Button
                variant={viewMode === 'month' ? 'primary' : 'outline-secondary'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'year' ? 'primary' : 'outline-secondary'}
                size="sm"
                onClick={() => setViewMode('year')}
              >
                Year
              </Button>
              <Button
                variant={viewMode === 'all' ? 'primary' : 'outline-secondary'}
                size="sm"
                onClick={() => setViewMode('all')}
              >
                All
              </Button>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Button
                variant="success"
                size="sm"
                onClick={handleCreateIncome}
                className="d-flex align-items-center gap-1 btn-icon-text"
              >
                <Plus size={16} /> Income
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleCreateExpense}
                className="d-flex align-items-center gap-1 btn-icon-text"
              >
                <Plus size={16} /> Expense
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Unified List View */}
      <Row>
        <Col xs={12}>
          <div className="finance-board bg-white h-100 p-0 border overflow-hidden">
            <div className="finance-board-header p-3 d-flex justify-content-between align-items-center bg-transparent border-bottom">
              <h3 className="board-title mb-0 fs-5 fw-bold">Transactions</h3>
              {/* Buttons moved to toolbar */}
            </div>

            <div className="table-responsive">
              <table className="finance-table">
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Description</th>
                    <th style={{ width: '15%' }}>Type</th>
                    <th style={{ width: '15%' }}>Date</th>
                    <th style={{ width: '15%' }}>Category</th>
                    <th style={{ width: '15%' }}>Amount</th>
                    <th style={{ width: '10%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-muted">
                        No transactions found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map(item => {
                      const isExpense = item.type === 'expense';
                      const categories = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
                      const category = categories.find(c => c.id === item.category);

                      return (
                        <tr key={item.uniqueId} className="finance-table-row">
                          <td>
                            <div className="d-flex flex-column">
                              <span className="fw-medium text-dark text-truncate" style={{ maxWidth: '250px' }} title={item.description}>
                                {item.description}
                              </span>
                              {/* Meta info like receipts/details */}
                              <div className="d-flex align-items-center gap-2 mt-1">
                                {/* Add icons or small text for receipts/details here if needed */}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`type-badge ${isExpense ? 'expense' : 'income'}`}>
                              {isExpense ? 'EXPENSE' : 'INCOME'}
                            </span>
                          </td>
                          <td className="text-secondary">
                            {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td>
                            <span
                              className="badge px-3 py-2 rounded-pill text-uppercase"
                              style={{
                                fontSize: '0.75rem',
                                backgroundColor: category?.color || '#6b7280',
                                color: 'white',
                                fontWeight: '600',
                                letterSpacing: '0.05em'
                              }}
                            >
                              {category?.label || item.category}
                            </span>
                          </td>
                          <td>
                            <span className={isExpense ? "text-danger fw-bold" : "text-success fw-bold"}>
                              {isExpense ? '-' : '+'}{formatCurrency(item.amount)}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => {
                                  setViewingItem(item)
                                  setViewingType(item.type)
                                  setShowDetailModal(true)
                                }}
                                title="View Details"
                                className="p-0 text-secondary hover-text-primary"
                              >
                                <Eye size={16} />
                              </Button>
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => isExpense ? handleEditExpense(item) : handleEditIncome(item)}
                                title="Edit"
                                className="p-0 text-secondary hover-text-primary"
                              >
                                <Edit size={16} />
                              </Button>
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete this ${item.type}?`)) {
                                    isExpense ? handleDeleteExpense(item.id) : handleDeleteIncome(item.id)
                                  }
                                }}
                                title="Delete"
                                className="p-0 text-secondary hover-text-danger"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalEntries > 0 && (
              <div className="finance-pagination d-flex align-items-center justify-content-between mt-3">
                <div className="d-flex align-items-center gap-2">
                  <Dropdown>
                    <Dropdown.Toggle
                      className="finance-dropdown-toggle"
                      id="rows-per-page-dropdown"
                      size="sm"
                      style={{ width: 'auto' }}
                    >
                      {rowsPerPage} per page
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="finance-dropdown-menu">
                      <Dropdown.Item
                        active={rowsPerPage === 10}
                        onClick={() => handleRowsPerPageChange(10)}
                      >
                        10 per page
                      </Dropdown.Item>
                      <Dropdown.Item
                        active={rowsPerPage === 25}
                        onClick={() => handleRowsPerPageChange(25)}
                      >
                        25 per page
                      </Dropdown.Item>
                      <Dropdown.Item
                        active={rowsPerPage === 50}
                        onClick={() => handleRowsPerPageChange(50)}
                      >
                        50 per page
                      </Dropdown.Item>
                      <Dropdown.Item
                        active={rowsPerPage === 100}
                        onClick={() => handleRowsPerPageChange(100)}
                      >
                        100 per page
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                  <span className="text-muted small">
                    Showing {startIndex + 1} to {endIndex} of {totalEntries} entries
                  </span>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                    title="First page"
                  >
                    <ChevronsLeft size={16} />
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    title="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <span className="mx-2 small">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    title="Next page"
                  >
                    <ChevronRight size={16} />
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                    title="Last page"
                  >
                    <ChevronsRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </div>

        </Col>
      </Row>

      {/* Expense Modal */}
      <ExpenseModal
        show={showExpenseModal}
        onHide={() => {
          setShowExpenseModal(false)
          setEditingExpense(null)
        }}
        expense={editingExpense}
        onSave={handleSaveExpense}
        onDelete={handleDeleteExpense}
        fields={financeConfig.expenseFields}
      />

      {/* Income Modal */}
      <IncomeModal
        show={showIncomeModal}
        onHide={() => {
          setShowIncomeModal(false)
          setEditingIncome(null)
        }}
        income={editingIncome}
        onSave={handleSaveIncome}
        onDelete={handleDeleteIncome}
        fields={financeConfig.incomeFields}
      />

      {/* Settings Modal */}
      <FinanceSettingsModal
        show={showSettingsModal}
        onHide={() => setShowSettingsModal(false)}
        currentConfig={financeConfig}
        onSaveConfig={(newConfig) => {
          setFinanceConfig(newConfig)
          localStorage.setItem('finance_config', JSON.stringify(newConfig))
        }}
      />

      {/* Detail View Modal */}
      <Modal
        show={showDetailModal}
        onHide={() => {
          setShowDetailModal(false)
          setViewingItem(null)
          setViewingType(null)
        }}
        centered
        size="lg"
      >
        <Modal.Header className="border-bottom">
          <Modal.Title>
            {viewingType === 'expense' ? 'Expense Details' : 'Income Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewingItem && (
            <div className="detail-view-content">
              <div className="row mb-3">
                <div className="col-md-6 mb-3">
                  <div className="detail-label text-muted small mb-1">Amount</div>
                  <div className={`detail-value fw-bold fs-4 ${viewingType === 'expense' ? 'text-danger' : 'text-success'}`}>
                    {viewingType === 'expense' ? '-' : '+'}{formatCurrency(viewingItem.amount)}
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="detail-label text-muted small mb-1">Date</div>
                  <div className="detail-value fw-semibold">
                    {new Date(viewingItem.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-12 mb-3">
                  <div className="detail-label text-muted small mb-1">Description</div>
                  <div className="detail-value fw-semibold fs-6">
                    {viewingItem.description || 'No description'}
                  </div>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6 mb-3">
                  <div className="detail-label text-muted small mb-1">Category</div>
                  <div className="detail-value">
                    {(() => {
                      const category = viewingType === 'expense'
                        ? EXPENSE_CATEGORIES.find(c => c.id === viewingItem.category)
                        : INCOME_CATEGORIES.find(c => c.id === viewingItem.category)
                      return (
                        <span
                          className="badge px-3 py-2 rounded-pill text-uppercase"
                          style={{
                            fontSize: '0.75rem',
                            backgroundColor: category?.color || '#6b7280',
                            color: 'white'
                          }}
                        >
                          {category?.label || viewingItem.category}
                        </span>
                      )
                    })()}
                  </div>
                </div>
                {viewingItem.employeeName && (
                  <div className="col-md-6 mb-3">
                    <div className="detail-label text-muted small mb-1">Created By</div>
                    <div className="detail-value fw-semibold">
                      {viewingItem.employeeName}
                    </div>
                  </div>
                )}
              </div>

              {viewingItem.projectDepartment && (
                <div className="row mb-3">
                  <div className="col-12 mb-3">
                    <div className="detail-label text-muted small mb-1">Project/Department</div>
                    <div className="detail-value fw-semibold">
                      {viewingItem.projectDepartment}
                    </div>
                  </div>
                </div>
              )}

              {viewingItem.receiptUrl && (
                <div className="row mb-3">
                  <div className="col-12">
                    <div className="detail-label text-muted small mb-2">Receipt</div>
                    <div className="detail-value">
                      {(viewingItem.receiptUrl.startsWith('data:image/') ||
                        (viewingItem.receiptUrl.startsWith('http') &&
                          /\.(jpg|jpeg|png|gif|webp)$/i.test(viewingItem.receiptUrl))) ? (
                        <div className="receipt-preview-container">
                          <img
                            src={viewingItem.receiptUrl}
                            alt="Receipt preview"
                            className="receipt-preview-image"
                          />
                          <div className="mt-2">
                            <a
                              href={viewingItem.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-decoration-none text-primary small"
                            >
                              Open in new tab
                            </a>
                          </div>
                        </div>
                      ) : viewingItem.receiptUrl.startsWith('data:application/pdf') ||
                        viewingItem.receiptUrl.includes('.pdf') ? (
                        <div className="receipt-preview-container">
                          <div className="receipt-pdf-preview border rounded p-4 bg-light text-center">
                            <div className="mb-2">
                              <svg
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-danger"
                              >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                              </svg>
                            </div>
                            <p className="mb-2 small text-muted">PDF Receipt</p>
                            <a
                              href={viewingItem.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-primary"
                            >
                              View PDF
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <a
                            href={viewingItem.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-decoration-none text-primary"
                          >
                            View Receipt
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="row">
                <div className="col-12">
                  <div className="detail-label text-muted small mb-1">ID</div>
                  <div className="detail-value small text-muted font-monospace">
                    {viewingItem.id}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top">
          <div className="d-flex gap-2 ms-auto">
            {viewingItem && (
              <>
                <Button
                  variant="outline-primary"
                  onClick={() => {
                    if (viewingType === 'expense') {
                      handleEditExpense(viewingItem)
                    } else {
                      handleEditIncome(viewingItem)
                    }
                    setShowDetailModal(false)
                    setViewingItem(null)
                    setViewingType(null)
                  }}
                >
                  <Edit size={16} className="me-1" />
                  Edit
                </Button>
                <Button
                  variant="outline-danger"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete this ${viewingType}?`)) {
                      if (viewingType === 'expense') {
                        handleDeleteExpense(viewingItem.id)
                      } else {
                        handleDeleteIncome(viewingItem.id)
                      }
                      setShowDetailModal(false)
                      setViewingItem(null)
                      setViewingType(null)
                    }
                  }}
                >
                  <Trash2 size={16} className="me-1" />
                  Delete
                </Button>
              </>
            )}
            <Button
              variant="secondary"
              onClick={() => {
                setShowDetailModal(false)
                setViewingItem(null)
                setViewingType(null)
              }}
            >
              Close
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </div >
  )
}

export default Finance
