import { useState, useEffect, useMemo } from 'react'
import { Row, Col, Card, Button, Form, Badge, Modal, Dropdown } from 'react-bootstrap'
import { Plus, TrendingUp, DollarSign, Calendar, TrendingDown, Edit, Trash2, Eye, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Users } from 'lucide-react'
import { expenseService } from '../../services/expenseService'
import { incomeService } from '../../services/incomeService'
import { projectFinanceService } from '../../services/projectFinanceService'
import { ExpenseModal } from './ExpenseModal'
import { IncomeModal } from './IncomeModal'
import FinanceSettingsModal, { DEFAULT_EXPENSE_FIELDS, DEFAULT_INCOME_FIELDS } from './FinanceSettingsModal'
import { formatGlobalCurrency } from '../../utils/currencyUtils'
import { useToast } from '../../components/Toast/ToastContext'
import PageToolbar from '../../components/PageToolbar/PageToolbar'
import StatsGrid from '../../components/StatsGrid/StatsGrid'
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
const STATUS_OPTIONS = ['Pending', 'Raised', 'Paid']

const Finance = () => {
  const toast = useToast()
  const [expenses, setExpenses] = useState([])
  const [incomes, setIncomes] = useState([])
  const [projectFinances, setProjectFinances] = useState([])
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
      const [expensesData, incomesData, financesData] = await Promise.all([
        expenseService.getExpenses(),
        incomeService.getIncomes(),
        projectFinanceService.getAll()
      ])
      setExpenses(expensesData || [])
      setIncomes(incomesData || [])
      setProjectFinances(financesData || [])
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

  // Calculate total stakeholder splits from Deal Value (excluding GST)
  const totalSplits = useMemo(() => {
    return projectFinances.reduce((total, pf) => {
      const dealValue = Number(pf.dealValue) || 0
      const projectSplits = (pf.stakeholders || []).reduce((sum, s) => {
        const splitAmount = (dealValue * (Number(s.percentage) || 0)) / 100
        return sum + splitAmount
      }, 0)
      return total + projectSplits
    }, 0)
  }, [projectFinances])

  // Group income by client for P&L breakdown
  const revenueByClient = useMemo(() => {
    const map = {};
    incomes.forEach(inc => {
      const key = inc.description?.split('—')[0]?.trim() || inc.description?.split('-')[0]?.trim() || 'Unknown';
      map[key] = (map[key] || 0) + (parseFloat(inc.amount) || 0);
    });
    return Object.entries(map)
      .map(([client, total]) => ({ client, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [incomes]);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const isPaid = (item) => (item?.status || '').toString().trim().toLowerCase() === 'paid'
    const toAmount = (value) => {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : 0
    }

    const expenseTotal = expenses.reduce((sum, exp) => sum + toAmount(exp.amount), 0)
    const incomeTotal = incomes.reduce((sum, inc) => sum + toAmount(inc.amount), 0)
    const paidIncomeTotal = incomes
      .filter(isPaid)
      .reduce((sum, inc) => sum + toAmount(inc.amount), 0)
    // Profit = Income - Expenses - Splits (splits are based on Deal Value, excluding GST)
    const netProfit = incomeTotal - expenseTotal - totalSplits

    const expenseAverage = expenses.length > 0 ? expenseTotal / expenses.length : 0
    const incomeAverage = incomes.length > 0 ? incomeTotal / incomes.length : 0

    const now = new Date()
    const expenseThisMonth = expenses.filter(exp => {
      const expDate = new Date(exp.date)
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear()
    }).reduce((sum, exp) => sum + toAmount(exp.amount), 0)

    const incomeThisMonth = incomes
      .filter(inc => {
        const incDate = new Date(inc.date)
        return incDate.getMonth() === now.getMonth() && incDate.getFullYear() === now.getFullYear()
      })
      .reduce((sum, inc) => sum + toAmount(inc.amount), 0)

    const netThisMonth = incomeThisMonth - expenseThisMonth

    return {
      expenseTotal,
      incomeTotal,
      paidIncomeTotal,
      netProfit,
      totalSplits,
      expenseAverage,
      incomeAverage,
      expenseThisMonth,
      incomeThisMonth,
      netThisMonth,
      expenseCount: expenses.length,
      incomeCount: incomes.length
    }
  }, [expenses, incomes, totalSplits])

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

  const handleQuickStatusChange = async (item, newStatus) => {
    if (!newStatus || (item.status || 'Pending') === newStatus) return
    const { type, uniqueId, ...basePayload } = item
    try {
      if (item.type === 'expense') {
        await expenseService.updateExpense(item.id, { ...basePayload, status: newStatus })
        setExpenses(prev => prev.map(exp => exp.id === item.id ? { ...exp, status: newStatus } : exp))
      } else {
        await incomeService.updateIncome(item.id, { ...basePayload, status: newStatus })
        setIncomes(prev => prev.map(inc => inc.id === item.id ? { ...inc, status: newStatus } : inc))
      }
      toast.success(`Status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
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
      <StatsGrid stats={[
        { label: 'Total Expenses', value: formatCurrency(overallStats.expenseTotal), icon: <TrendingDown size={24} />, color: 'red', valueColor: '#ef4444' },
        { label: 'Total Income', value: formatCurrency(overallStats.incomeTotal), icon: <TrendingUp size={24} />, color: 'green', valueColor: '#10b981' },
        { label: 'Total Splits', value: formatCurrency(overallStats.totalSplits), icon: <Users size={24} />, color: '#f59e0b', valueColor: '#f59e0b' },
        { label: 'Net Profit', value: formatCurrency(overallStats.netProfit), icon: <DollarSign size={24} />, color: 'blue', valueColor: overallStats.netProfit >= 0 ? '#10b981' : '#ef4444' },
        { label: 'This Month Net', value: formatCurrency(overallStats.netThisMonth), icon: <Calendar size={24} />, color: 'purple', valueColor: overallStats.netThisMonth >= 0 ? '#10b981' : '#ef4444' },
      ]} />

      {revenueByClient.length > 0 && (
        <div className="card border-0 shadow-sm mx-0 mb-3" style={{ borderRadius: 12 }}>
          <div className="card-body p-3">
            <div className="fw-semibold mb-2" style={{ fontSize: 13 }}>Top Clients by Revenue</div>
            <table className="table table-sm mb-0">
              <tbody>
                {revenueByClient.map(({ client, total }) => (
                  <tr key={client}>
                    <td className="text-muted small">{client}</td>
                    <td className="fw-semibold text-end small">{formatGlobalCurrency(total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PageToolbar
        title="Finance"
        itemCount={combinedTransactions.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search transactions..."
        filters={[
          { id: 'type', name: 'Type' },
          { id: 'category', name: 'Category' }
        ]}
        filterBy={filterBy}
        filterValue={filterValue}
        onFilterChange={(fb, fv) => { setFilterBy(fb); setFilterValue(fv) }}
        getFilterOptions={getFilterOptions}
        sortOptions={[
          { id: 'date', name: 'Date' },
          { id: 'amount', name: 'Amount' }
        ]}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(sb, so) => { setSortBy(sb); setSortOrder(so) }}
        onManageColumns={() => setShowSettingsModal(true)}
        extraControls={
          <div className="btn-group">
            <button className={`btn btn-sm ${viewMode === 'month' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setViewMode('month')}>Month</button>
            <button className={`btn btn-sm ${viewMode === 'year' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setViewMode('year')}>Year</button>
            <button className={`btn btn-sm ${viewMode === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setViewMode('all')}>All</button>
          </div>
        }
        actions={[
          { label: 'Income', icon: <Plus size={16} />, variant: 'success', onClick: handleCreateIncome },
          { label: 'Expense', icon: <Plus size={16} />, variant: 'primary', onClick: handleCreateExpense }
        ]}
      />

      {/* Unified List View */}
      <Row>
        <Col xs={12}>
          <div className="finance-board">
            <div className="finance-board-header d-flex justify-content-between align-items-center">
              <span className="board-title">Transactions</span>
            </div>

            <div className="table-responsive">
              <table className="finance-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Description</th>
                    <th style={{ width: '12%' }}>Type</th>
                    <th style={{ width: '12%' }}>Date</th>
                    <th style={{ width: '13%' }}>Category</th>
                    <th style={{ width: '10%' }}>Status</th>
                    <th style={{ width: '13%' }}>Amount</th>
                    <th style={{ width: '10%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
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
                            <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '13.5px', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.description}>
                              {item.description}
                            </div>
                          </td>
                          <td>
                            <span className={`type-badge ${isExpense ? 'expense' : 'income'}`}>
                              {isExpense ? 'Expense' : 'Income'}
                            </span>
                          </td>
                          <td style={{ color: '#64748B', fontSize: '13px' }}>
                            {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td>
                            <span
                              className="badge-enterprise"
                              style={{
                                display: 'inline-flex', alignItems: 'center',
                                padding: '3px 10px', borderRadius: '999px',
                                fontSize: '11px', fontWeight: 700,
                                letterSpacing: '0.02em',
                                background: (category?.color || '#6b7280') + '22',
                                color: category?.color || '#6b7280',
                                border: `1px solid ${(category?.color || '#6b7280')}44`,
                              }}
                            >
                              {category?.label || item.category}
                            </span>
                          </td>
                          <td>
                            <Form.Select
                              size="sm"
                              value={item.status || 'Pending'}
                              onChange={(e) => handleQuickStatusChange(item, e.target.value)}
                              style={{ minWidth: 110 }}
                            >
                              {STATUS_OPTIONS.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </Form.Select>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, fontSize: '14px', color: isExpense ? '#F43F5E' : '#10B981', fontFamily: 'var(--font-display, Outfit)' }}>
                              {isExpense ? '−' : '+'}{formatCurrency(item.amount)}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-1">
                              <button
                                className="fin-action-btn view"
                                onClick={() => { setViewingItem(item); setViewingType(item.type); setShowDetailModal(true); }}
                                title="View Details"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                className="fin-action-btn edit"
                                onClick={() => isExpense ? handleEditExpense(item) : handleEditIncome(item)}
                                title="Edit"
                              >
                                <Edit size={15} />
                              </button>
                              <button
                                className="fin-action-btn del"
                                onClick={() => {
                                  if (window.confirm(`Delete this ${item.type}?`)) {
                                    isExpense ? handleDeleteExpense(item.id) : handleDeleteIncome(item.id)
                                  }
                                }}
                                title="Delete"
                              >
                                <Trash2 size={15} />
                              </button>
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
              <div className="finance-pagination d-flex align-items-center justify-content-between">
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
                <div className="col-md-6 mb-3">
                  <div className="detail-label text-muted small mb-1">Status</div>
                  <div className="detail-value">
                    {(() => {
                      const status = viewingItem.status || 'Pending';
                      const statusColors = {
                        Pending: { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
                        Raised: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
                        Paid: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' }
                      };
                      const colors = statusColors[status] || statusColors.Pending;
                      return (
                        <span
                          className="badge px-3 py-2 rounded-pill text-uppercase"
                          style={{
                            fontSize: '0.75rem',
                            backgroundColor: colors.bg,
                            color: colors.color,
                            border: `1px solid ${colors.border}`,
                            fontWeight: '700'
                          }}
                        >
                          {status}
                        </span>
                      );
                    })()}
                  </div>
                </div>
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
