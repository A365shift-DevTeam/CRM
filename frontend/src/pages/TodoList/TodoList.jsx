import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, InputGroup, Form, Dropdown } from 'react-bootstrap'
import { Plus, LayoutGrid, List as ListIcon, Search, SlidersHorizontal, Settings, Calendar, ClipboardList, AlertCircle, Clock, ChevronDown, Filter, BarChart2, ArrowUpDown, X } from 'lucide-react'
import { ListView } from './ListView'
import { KanbanView } from './KanbanView'
import { TaskModal } from './TaskModal'
import { ColumnManager, ColumnConfigModal } from './ColumnManager'
import { taskService } from '../../services/api'
import './TodoList.css'

const TodoList = () => {
    // Initial State
    const [view, setView] = useState('list') // 'list', 'board'
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)

    // Fetch Tasks
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const data = await taskService.getAll()
                // Sort by ID desc (assuming numeric IDs)
                setTasks(data.sort((a, b) => (b.id || 0) - (a.id || 0)))
            } catch (error) {
                console.error("Error fetching tasks:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchTasks()
    }, [])

    const [columns, setColumns] = useState([
        { id: 'id', name: 'ID', type: 'number', visible: true, config: { readOnly: true, autoIncrement: true } },
        { id: 'title', name: 'TITLE', type: 'text', visible: true, required: true },
        {
            id: 'status',
            name: 'STATUS',
            type: 'choice',
            visible: true,
            config: {
                options: [
                    { label: 'Pending', color: '#0ea5e9' }, // Blue
                    { label: 'In Progress', color: '#22c55e' }, // Green
                    { label: 'Completed', color: '#10b981' },
                    { label: 'On Hold', color: '#64748b' }
                ]
            }
        },
        {
            id: 'priority',
            name: 'PRIORITY',
            type: 'choice',
            visible: true,
            config: {
                options: [
                    { label: 'High', color: '#f97316' }, // Orange
                    { label: 'Medium', color: '#16a34a' }, // Green
                    { label: 'Low', color: '#10b981' }
                ]
            }
        },
        { id: 'dueDate', name: 'DUE DATE', type: 'datetime', visible: true, config: { dateOnly: true } }
    ])

    const [showTaskModal, setShowTaskModal] = useState(false)
    const [editingTask, setEditingTask] = useState(null)
    const [showColumnManager, setShowColumnManager] = useState(false)
    const [showColumnConfigModal, setShowColumnConfigModal] = useState(false)
    const [editingColumnConfig, setEditingColumnConfig] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')

    // Filtering and Sorting
    const [filterBy, setFilterBy] = useState('all')
    const [filterValue, setFilterValue] = useState('')
    const [sortBy, setSortBy] = useState('id')
    const [sortOrder, setSortOrder] = useState('desc')

    // Computed Stats
    const totalTasks = tasks.length
    const highPriorityTasks = tasks.filter(t => t.values.priority === 'High').length
    const pendingTasks = tasks.filter(t => t.values.status === 'Pending').length
    const dueSoonTasks = tasks.filter(t => {
        if (!t.values.dueDate) return false
        const wDate = new Date(t.values.dueDate)
        const today = new Date()
        const diff = wDate - today
        // Due within 3 days
        return diff > 0 && diff < (3 * 24 * 60 * 60 * 1000)
    }).length

    // Handlers
    const handleAddTask = async (values, notify) => {
        try {
            // Generate simple numeric ID based on max existing ID
            // This is not concurrency-safe but sufficient for single-user/simple demo
            const maxId = tasks.length > 0 ? Math.max(...tasks.map(t => typeof t.id === 'number' ? t.id : 0)) : 0
            const newId = maxId + 1

            const newTaskData = {
                id: newId,
                notify,
                values: { ...values },
                createdAt: new Date().toISOString()
            }

            const createdTask = await taskService.create(newTaskData)
            setTasks([createdTask, ...tasks])
        } catch (error) {
            console.error("Error creating task:", error)
            alert("Failed to create task. Please try again.")
        }
    }

    const handleUpdateTask = async (updatedValues, notify) => {
        if (!editingTask || !editingTask.firebaseId) return

        try {
            await taskService.update(editingTask.firebaseId, {
                values: updatedValues,
                notify
            })

            setTasks(tasks.map(t =>
                t.id === editingTask.id
                    ? { ...t, values: updatedValues, notify }
                    : t
            ))
            setEditingTask(null)
        } catch (error) {
            console.error("Error updating task:", error)
            alert("Failed to update task. Please try again.")
        }
    }

    const handleDeleteTask = async (taskId) => {
        const taskToDelete = tasks.find(t => t.id === taskId)
        if (!taskToDelete || !taskToDelete.firebaseId) return

        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await taskService.delete(taskToDelete.firebaseId)
                setTasks(tasks.filter(t => t.id !== taskId))
            } catch (error) {
                console.error("Error deleting task:", error)
                alert("Failed to delete task. Please try again.")
            }
        }
    }

    const handleKanbanUpdate = async (taskId, updates) => {
        const taskToUpdate = tasks.find(t => t.id === taskId)
        if (!taskToUpdate || !taskToUpdate.firebaseId) return

        try {
            await taskService.update(taskToUpdate.firebaseId, updates)
            setTasks(tasks.map(t =>
                t.id === taskId ? { ...t, ...updates } : t
            ))
        } catch (error) {
            console.error("Error updating task status:", error)
        }
    }

    const handleSaveColumnFromModal = (columnData) => {
        try {
            if (editingColumnConfig) {
                setColumns(columns.map(col =>
                    col.id === editingColumnConfig.id ? { ...col, ...columnData } : col
                ))
            } else {
                const newColumn = {
                    ...columnData,
                    id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                }
                setColumns([...columns, newColumn])
            }
            setEditingColumnConfig(null)
            setShowColumnConfigModal(false)
        } catch (error) {
            console.error('Error saving column:', error)
            alert('Failed to save column. Please try again.')
        }
    }

    const handleDeleteColumnFromModal = (columnId) => {
        if (window.confirm('Are you sure you want to delete this field? All data in this field will be lost.')) {
            setColumns(columns.filter(col => col.id !== columnId))
            setEditingColumnConfig(null)
            setShowColumnConfigModal(false)
        }
    }

    // Filtered Tasks
    const filteredTasks = tasks.map(t => t).filter(task => {
        // 1. Search Query
        if (searchQuery && !Object.values(task.values || {}).some(val =>
            String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )) {
            return false
        }

        // 2. Specific Column Filter
        if (filterBy !== 'all' && filterValue) {
            const value = task.values?.[filterBy]
            if (String(value || '').toLowerCase() !== filterValue.toLowerCase()) {
                return false
            }
        }
        return true
    }).sort((a, b) => {
        let aVal = a.values?.[sortBy] || a[sortBy]
        let bVal = b.values?.[sortBy] || b[sortBy]

        if (typeof aVal === 'string') aVal = aVal.toLowerCase()
        if (typeof bVal === 'string') bVal = bVal.toLowerCase()

        if (sortOrder === 'asc') {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
        } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
        }
    })

    const getFilterOptions = (colId) => {
        const vals = new Set()
        tasks.forEach(t => {
            if (t.values?.[colId]) vals.add(t.values[colId])
        })
        return Array.from(vals).sort()
    }

    return (
        <div className="todo-list-container">
            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon-wrapper blue">
                        <ClipboardList size={20} strokeWidth={1.5} />
                    </div>
                    <div className="stat-value">{totalTasks}</div>
                    <div className="stat-label">TOTAL TASKS</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper orange">
                        <Clock size={20} strokeWidth={1.5} />
                    </div>
                    <div className="stat-value">{highPriorityTasks}</div>
                    <div className="stat-label">HIGH PRIORITY</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper green">
                        <AlertCircle size={20} strokeWidth={1.5} />
                    </div>
                    <div className="stat-value">{pendingTasks}</div>
                    <div className="stat-label">PENDING TASKS</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper purple">
                        <Calendar size={20} strokeWidth={1.5} />
                    </div>
                    <div className="stat-value">{dueSoonTasks}</div>
                    <div className="stat-label">DUE SOON</div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="todo-toolbar">
                <div className="d-flex align-items-center gap-3">
                    <div className="my-tasks-trigger">
                        <span>My Tasks</span>
                        <ChevronDown size={14} className="text-muted" />
                    </div>
                </div>

                <div className="toolbar-actions">
                    <Dropdown align="end">
                        <Dropdown.Toggle as="button" bsPrefix="custom-toggle" className="btn-toolbar" style={filterBy !== 'all' ? { background: '#e0e7ff', color: '#4f46e5', borderColor: '#c7d2fe' } : {}}>
                            <Filter size={16} /> Filters <ChevronDown size={12} className="ms-1" />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="p-3 shadow-sm border-0" style={{ minWidth: '240px', borderRadius: '12px' }}>
                            <div className="mb-3">
                                <label className="small text-muted fw-bold mb-2">FILTER BY</label>
                                <Form.Select size="sm" value={filterBy} onChange={(e) => { setFilterBy(e.target.value); setFilterValue(''); }}>
                                    <option value="all">None</option>
                                    {columns.filter(c => c.type === 'choice' || c.type === 'dropdown' || c.type === 'text').map(col => (
                                        <option key={col.id} value={col.id}>{col.name}</option>
                                    ))}
                                </Form.Select>
                            </div>
                            {filterBy !== 'all' && (
                                <div>
                                    <label className="small text-muted fw-bold mb-2">SELECT VALUE</label>
                                    <Form.Select size="sm" value={filterValue} onChange={(e) => setFilterValue(e.target.value)}>
                                        <option value="">Select...</option>
                                        {getFilterOptions(filterBy).map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </Form.Select>
                                </div>
                            )}
                            {filterBy !== 'all' && (
                                <div className="mt-3 pt-2 border-top text-end">
                                    <Button variant="link" size="sm" className="text-danger text-decoration-none p-0" onClick={() => { setFilterBy('all'); setFilterValue(''); }}>
                                        Clear Filters
                                    </Button>
                                </div>
                            )}
                        </Dropdown.Menu>
                    </Dropdown>

                    <Dropdown align="end">
                        <Dropdown.Toggle as="button" bsPrefix="custom-toggle" className="btn-toolbar">
                            <ArrowUpDown size={16} /> Sort <ChevronDown size={12} className="ms-1" />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="p-3 shadow-sm border-0" style={{ minWidth: '220px', borderRadius: '12px' }}>
                            <div className="mb-3">
                                <label className="small text-muted fw-bold mb-2">SORT BY</label>
                                <Form.Select size="sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                    <option value="id">Task ID</option>
                                    {columns.map(col => (
                                        <option key={col.id} value={col.id}>{col.name}</option>
                                    ))}
                                </Form.Select>
                            </div>
                            <div>
                                <label className="small text-muted fw-bold mb-2">ORDER</label>
                                <div className="d-flex gap-2">
                                    <Button variant={sortOrder === 'asc' ? 'primary' : 'light'} size="sm" className="flex-grow-1" onClick={() => setSortOrder('asc')}>Asc</Button>
                                    <Button variant={sortOrder === 'desc' ? 'primary' : 'light'} size="sm" className="flex-grow-1" onClick={() => setSortOrder('desc')}>Desc</Button>
                                </div>
                            </div>
                        </Dropdown.Menu>
                    </Dropdown>

                    <button className="btn-toolbar" onClick={() => setShowColumnManager(true)}>
                        <Settings size={16} /> View Settings
                    </button>

                    <div className="view-icons-group">
                        <button
                            className={`btn-view-icon ${view === 'list' ? 'active' : ''}`}
                            onClick={() => setView('list')}
                            title="List View"
                        >
                            <ListIcon size={18} />
                        </button>
                        <button
                            className={`btn-view-icon ${view === 'board' ? 'active' : ''}`}
                            onClick={() => setView('board')}
                            title="Board View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button className="btn-view-icon" title="Graph View">
                            <BarChart2 size={18} />
                        </button>
                    </div>

                    <button
                        className="btn-new-task"
                        onClick={() => {
                            setEditingTask(null)
                            setShowTaskModal(true)
                        }}
                    >
                        <Plus size={16} /> New Task
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="todo-content">
                {loading ? (
                    <div className="p-5 text-center text-muted">Loading tasks...</div>
                ) : (
                    view === 'list' ? (
                        <ListView
                            tasks={filteredTasks}
                            columns={columns}
                            sortBy={sortBy}
                            sortOrder={sortOrder}
                            onSort={(col) => {
                                if (sortBy === col) { setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc') }
                                else { setSortBy(col); setSortOrder('asc'); }
                            }}
                            onEdit={(task) => {
                                setEditingTask(task)
                                setShowTaskModal(true)
                            }}
                            onDelete={handleDeleteTask}
                        />
                    ) : (
                        <KanbanView
                            tasks={filteredTasks}
                            columns={columns}
                            onTaskUpdate={handleKanbanUpdate}
                            onEdit={(task) => {
                                setEditingTask(task)
                                setShowTaskModal(true)
                            }}
                            onDelete={handleDeleteTask}
                        />
                    )
                )}
            </div>

            {/* Modals */}
            <TaskModal
                show={showTaskModal}
                onHide={() => setShowTaskModal(false)}
                task={editingTask}
                columns={columns}
                onSave={editingTask ? handleUpdateTask : handleAddTask}
                onDelete={handleDeleteTask}
                onAddColumn={() => {
                    setEditingColumnConfig(null)
                    setShowColumnConfigModal(true)
                }}
                onEditColumn={(col) => {
                    setEditingColumnConfig(col)
                    setShowColumnConfigModal(true)
                }}
                onDeleteColumn={handleDeleteColumnFromModal}
            />

            <ColumnConfigModal
                show={showColumnConfigModal}
                onHide={() => {
                    setShowColumnConfigModal(false)
                    setEditingColumnConfig(null)
                }}
                column={editingColumnConfig}
                onSave={handleSaveColumnFromModal}
                onDelete={handleDeleteColumnFromModal}
            />

            {showColumnManager && (
                <div className="column-manager-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowColumnManager(false); }}>
                    <div className="column-manager-modal">
                        <div className="column-manager-modal-header">
                            <div>
                                <h4 className="column-manager-modal-title">Customize Columns</h4>
                                <p className="column-manager-modal-subtitle">Drag to reorder, toggle visibility, or add new columns</p>
                            </div>
                            <button className="column-manager-close-btn" onClick={() => setShowColumnManager(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="column-manager-modal-body">
                            <ColumnManager
                                columns={columns}
                                onColumnsChange={setColumns}
                                onReorder={(newOrder) => {
                                    const newColumns = [...columns].sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id))
                                    setColumns(newColumns)
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TodoList
