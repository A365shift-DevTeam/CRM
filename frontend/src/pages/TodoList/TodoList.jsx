import { useState, useEffect } from 'react'
import { Plus, Calendar, ClipboardList, AlertCircle, Clock } from 'lucide-react'
import { ListView } from './ListView'
import { KanbanView } from './KanbanView'
import { TaskModal } from './TaskModal'
import { ColumnManager } from './ColumnManager'
import { taskService } from '../../services/api'
import { useToast } from '../../components/Toast/ToastContext'
import PageToolbar from '../../components/PageToolbar/PageToolbar'
import PageHeader from '../../components/PageHeader/PageHeader'
import StatsGrid from '../../components/StatsGrid/StatsGrid'
import './TodoList.css'

const TodoList = () => {
    const toast = useToast()

    // Initial State
    const [view, setView] = useState('list') // 'list', 'board'
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)

    const loadColumns = async () => {
        try {
            const data = await taskService.getColumns()
            if (data && Array.isArray(data)) {
                setColumns(data.map(col => ({ ...col, id: col.colId || col.id })))
            }
        } catch (error) {
            console.error("Error fetching columns:", error)
        }
    }

    // Fetch Tasks and Columns
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
        loadColumns()
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
    const [searchQuery, setSearchQuery] = useState('')

    // Filtering and Sorting
    const [filterBy, setFilterBy] = useState('all')
    const [filterValue, setFilterValue] = useState('')
    const [sortBy, setSortBy] = useState('id')
    const [sortOrder, setSortOrder] = useState('desc')

    // Computed Stats
    const totalTasks = tasks.length
    const highPriorityTasks = tasks.filter(t => t.values?.priority === 'High').length
    const pendingTasks = tasks.filter(t => t.values?.status === 'Pending').length
    const dueSoonTasks = tasks.filter(t => {
        if (!t.values?.dueDate) return false
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
            toast.success('Task created successfully')
        } catch (error) {
            console.error("Error creating task:", error)
            toast.error('Failed to create task')
        }
    }

    const handleUpdateTask = async (updatedValues, notify) => {
        if (!editingTask || !editingTask.id) return

        try {
            await taskService.update(editingTask.id, {
                values: updatedValues,
                notify
            })

            setTasks(tasks.map(t =>
                t.id === editingTask.id
                    ? { ...t, values: updatedValues, notify }
                    : t
            ))
            setEditingTask(null)
            toast.success('Task updated successfully')
        } catch (error) {
            console.error("Error updating task:", error)
            toast.error('Failed to update task')
        }
    }

    const handleDeleteTask = async (taskId) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await taskService.delete(taskId)
                setTasks(tasks.filter(t => t.id !== taskId))
                toast.success('Task deleted')
            } catch (error) {
                console.error("Error deleting task:", error)
                toast.error('Failed to delete task')
            }
        }
    }

    const handleKanbanUpdate = async (taskId, updates) => {
        try {
            await taskService.update(taskId, updates)
            setTasks(tasks.map(t =>
                t.id === taskId ? { ...t, ...updates } : t
            ))
        } catch (error) {
            console.error("Error updating task status:", error)
        }
    }

    const handleColumnsChange = async () => {
        await loadColumns()
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
            <PageHeader 
              title="My Tasks" 
              description="Manage your daily to-do list and assignments" 
              icon={ClipboardList} 
              iconColor="#10b981"
            />
            <StatsGrid stats={[
                { label: 'Total Tasks', value: totalTasks, icon: <ClipboardList size={20} />, color: 'blue' },
                { label: 'High Priority', value: highPriorityTasks, icon: <Clock size={20} />, color: 'orange' },
                { label: 'Pending Tasks', value: pendingTasks, icon: <AlertCircle size={20} />, color: 'green' },
                { label: 'Due Soon', value: dueSoonTasks, icon: <Calendar size={20} />, color: 'purple' },
            ]} />

            <PageToolbar
                title="My Tasks"
                itemCount={filteredTasks.length}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search tasks..."
                filters={columns.filter(c => c.type === 'choice' || c.type === 'dropdown' || c.type === 'text').map(c => ({ id: c.id, name: c.name }))}
                filterBy={filterBy}
                filterValue={filterValue}
                onFilterChange={(fb, fv) => { setFilterBy(fb); setFilterValue(fv) }}
                getFilterOptions={getFilterOptions}
                sortOptions={[
                    { id: 'id', name: 'Task ID' },
                    ...columns.map(c => ({ id: c.id, name: c.name }))
                ]}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={(sb, so) => { setSortBy(sb); setSortOrder(so) }}
                viewModes={[
                    { id: 'list', label: 'List' },
                    { id: 'board', label: 'Kanban' }
                ]}
                activeView={view}
                onViewChange={setView}
                onManageColumns={() => setShowColumnManager(true)}
                actions={[
                    { label: 'New Task', icon: <Plus size={16} />, variant: 'primary', onClick: () => { setEditingTask(null); setShowTaskModal(true) } }
                ]}
            />

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
                onAddColumn={() => setShowColumnManager(true)}
                onEditColumn={() => setShowColumnManager(true)}
                onDeleteColumn={() => setShowColumnManager(true)}
            />

            <ColumnManager
                show={showColumnManager}
                onHide={() => setShowColumnManager(false)}
                columns={columns}
                onColumnsChange={handleColumnsChange}
            />
        </div>
    )
}

export default TodoList
