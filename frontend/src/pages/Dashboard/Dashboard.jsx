import React, { useEffect, useMemo, useState } from 'react';
import { projectService, taskService } from '../../services/api';
import { contactService } from '../../services/contactService';
import { timesheetService } from '../../services/timesheetService';
import { expenseService } from '../../services/expenseService';
import { incomeService } from '../../services/incomeService';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { formatGlobalCurrency } from '../../utils/currencyUtils';
import {
  BarChart2,
  TrendingUp,
  Banknote,
  Hourglass,
  TrendingDown,
  Landmark,
  Filter,
  FileText,
  UserPlus,
  AlertTriangle,
  Lightbulb,
  Search,
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  X
} from 'lucide-react';
import './Dashboard.css';

function KPISection({
  activeProjects,
  totalBilling,
  pendingPayments,
  conversionRate,
  currency,
  revenueTrend,
  pendingTrend
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm relative overflow-hidden border border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-emerald-50 rounded-xl">
            <BarChart2 className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-xs font-bold text-emerald-600 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> Live
          </span>
        </div>
        <p className="text-sm text-slate-500 font-medium">Total Projects</p>
        <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{activeProjects} Active</h3>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm relative overflow-hidden border border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-emerald-50 rounded-xl">
            <Banknote className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-xs font-bold text-emerald-600 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> {revenueTrend >= 0 ? '+' : ''}{revenueTrend.toFixed(1)}%
          </span>
        </div>
        <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
        <h3 className="text-3xl font-extrabold text-slate-900 mt-1">
          {formatGlobalCurrency(totalBilling, currency, { maximumFractionDigits: 0 })}
        </h3>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm relative overflow-hidden border border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-rose-50 rounded-xl">
            <Hourglass className="w-5 h-5 text-rose-600" />
          </div>
          <span className="text-xs font-bold text-rose-600 flex items-center">
            <TrendingDown className="w-3 h-3 mr-1" /> {pendingTrend >= 0 ? '+' : ''}{pendingTrend.toFixed(1)}%
          </span>
        </div>
        <p className="text-sm text-slate-500 font-medium">Pending Payments</p>
        <h3 className="text-3xl font-extrabold text-slate-900 mt-1">
          {formatGlobalCurrency(pendingPayments, currency, { maximumFractionDigits: 0 })}
        </h3>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm relative overflow-hidden border border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-emerald-50 rounded-xl">
            <Landmark className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-xs font-bold text-slate-500">WIN RATE</span>
        </div>
        <p className="text-sm text-slate-500 font-medium">Conversion Rate</p>
        <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{conversionRate}%</h3>
      </div>
    </div>
  );
}

function TimelineSection({ projects }) {
  const [timelineView, setTimelineView] = useState('week');

  const STAGES = [
    { label: 'Demo', color: 'text-emerald-600', barClass: 'bg-emerald-500', status: 'On Track' },
    { label: 'Proposal', color: 'text-amber-600', barClass: 'bg-amber-500', status: 'On Track' },
    { label: 'Negotiation', color: 'text-orange-600', barClass: 'bg-orange-500', status: 'At Risk' },
    { label: 'Approval', color: 'text-violet-600', barClass: 'bg-violet-500', status: 'On Track' },
    { label: 'Won', color: 'text-emerald-600', barClass: 'bg-emerald-600', status: 'Completed' },
    { label: 'Closed', color: 'text-slate-600', barClass: 'bg-slate-500', status: 'Completed' },
    { label: 'Lost', color: 'text-rose-600', barClass: 'bg-rose-500', status: 'Delayed' }
  ];

  const timelineProjects = projects.slice(0, 5).map((project, index) => {
    const stage = STAGES[project.activeStage ?? 0] || STAGES[0];
    const progress = Math.min(100, Math.max(15, Math.round(((project.activeStage ?? 0) + 1) / STAGES.length * 100)));

    return {
      ...project,
      stage,
      progress,
      title: project.title || project.clientName || `Project ${index + 1}`
    };
  });

  const dayLabels = useMemo(() => {
    const now = new Date();
    if (timelineView === 'week') {
      return Array.from({ length: 10 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() + i);
        return d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit' }).toUpperCase();
      });
    }

    if (timelineView === 'month') {
      return Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
        return d.toLocaleDateString('en-US', { day: '2-digit' });
      });
    }

    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), i, 1);
      return d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    });
  }, [timelineView]);

  const unitWidth = timelineView === 'year' ? 88 : 80;
  const timelineMinWidth = Math.max(800, dayLabels.length * unitWidth);
  const markerIndex = timelineView === 'year' ? new Date().getMonth() : Math.floor(dayLabels.length / 2);
  const markerLeft = (markerIndex * unitWidth) + (unitWidth / 2);

  const getBarLayout = (project, index) => {
    const labelCount = dayLabels.length;
    const maxStart = Math.max(0, labelCount - 2);
    const startStep = timelineView === 'week' ? 1.5 : timelineView === 'month' ? 3 : 1;
    const startUnit = Math.min(maxStart, Math.round(index * startStep));

    const durationUnits = timelineView === 'week'
      ? Math.max(2, Math.round(project.progress / 14))
      : timelineView === 'month'
        ? Math.max(3, Math.round(project.progress / 8))
        : Math.max(2, Math.round(project.progress / 10));

    const widthPx = Math.max(120, (durationUnits * unitWidth) - 12);
    const marginLeftPx = (startUnit * unitWidth) + 8;

    return { widthPx, marginLeftPx };
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
        <h2 className="text-lg font-bold text-slate-900">Execution Timeline</h2>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
            <button
              type="button"
              onClick={() => setTimelineView('week')}
              className={`px-4 py-1.5 text-xs rounded-md transition-colors ${
                timelineView === 'week'
                  ? 'font-semibold bg-white shadow-sm text-slate-800'
                  : 'font-medium text-slate-500 hover:text-slate-700'
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setTimelineView('month')}
              className={`px-4 py-1.5 text-xs rounded-md transition-colors ${
                timelineView === 'month'
                  ? 'font-semibold bg-white shadow-sm text-slate-800'
                  : 'font-medium text-slate-500 hover:text-slate-700'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setTimelineView('year')}
              className={`px-4 py-1.5 text-xs rounded-md transition-colors ${
                timelineView === 'year'
                  ? 'font-semibold bg-white shadow-sm text-slate-800'
                  : 'font-medium text-slate-500 hover:text-slate-700'
              }`}
            >
              Year
            </button>
          </div>
          <button className="flex items-center gap-2 text-xs font-bold text-emerald-600 px-3 py-2 hover:bg-emerald-50 rounded-lg transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto no-scrollbar">
        <div className="w-72 flex-shrink-0 border-r border-slate-100">
          <div className="h-12 flex items-center px-6 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Project Name
          </div>
          <div className="divide-y divide-slate-100">
            {timelineProjects.length === 0 && (
              <div className="h-16 flex items-center px-6 text-sm text-slate-400">No projects found</div>
            )}
            {timelineProjects.map((project, index) => (
              <div key={project.id || index} className="h-16 flex flex-col justify-center px-6">
                <span className="text-sm font-bold text-slate-900 truncate">{project.title}</span>
                <span className={`text-[10px] font-bold uppercase ${project.stage.color}`}>
                  {project.stage.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 relative" style={{ minWidth: `${timelineMinWidth}px` }}>
          <div className="h-12 flex bg-white border-b border-slate-100">
            {dayLabels.map((label) => (
              <div
                key={label}
                className="flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-slate-500"
                style={{ width: `${unitWidth}px` }}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="divide-y divide-slate-100 relative">
            <div className="absolute top-0 bottom-0 w-px bg-emerald-500 z-10" style={{ left: `${markerLeft}px` }}>
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>

            {timelineProjects.map((project, index) => {
              const { widthPx, marginLeftPx } = getBarLayout(project, index);
              return (
                <div key={project.id || index} className="h-16 flex items-center px-2">
                  <div
                    className={`h-8 ${project.stage.barClass} rounded-full flex items-center px-4 min-w-[120px]`}
                    style={{ width: `${widthPx}px`, marginLeft: `${marginLeftPx}px` }}
                  >
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider truncate">
                      {project.stage.label} {project.progress}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentIntelligence({ alerts, tasks }) {
  const items = useMemo(() => {
    const alertItems = (alerts || []).slice(0, 2).map((alert) => ({
      id: `a-${alert.id || alert.title}`,
      icon: alert.severity === 'critical' ? AlertTriangle : FileText,
      bg: alert.severity === 'critical' ? 'bg-rose-50' : 'bg-emerald-50',
      color: alert.severity === 'critical' ? 'text-rose-600' : 'text-emerald-600',
      title: alert.title || alert.message || 'Alert generated',
      description: alert.clientName || 'AI monitoring update',
      time: alert.daysOverdue > 0 ? `${alert.daysOverdue}d overdue` : 'Live'
    }));

    const taskItems = (tasks || []).slice(0, 1).map((task) => ({
      id: `t-${task.id}`,
      icon: UserPlus,
      bg: 'bg-blue-50',
      color: 'text-blue-600',
      title: task.values?.title || task.title || 'Task update',
      description: (task.values?.status || task.status || 'Pending') + ' task in queue',
      time: task.values?.dueDate
        ? new Date(task.values.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Queued'
    }));

    return [...alertItems, ...taskItems].slice(0, 3);
  }, [alerts, tasks]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-slate-900">Recent Intelligence</h2>
        <button className="text-xs font-bold text-emerald-600 hover:underline">View All</button>
      </div>

      <div className="space-y-6">
        {items.length === 0 && <p className="text-sm text-slate-400">No intelligence events yet.</p>}
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{item.title}</p>
                <p className="text-xs text-slate-500 truncate">{item.description}</p>
              </div>
              <span className="text-[10px] font-medium text-slate-400">{item.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PendingInvoices({ invoices, currency }) {
  const pendingInvoices = useMemo(() => {
    const rows = (invoices || []).filter((invoice) => {
      const status = invoice.status || (invoice.paidDate ? 'Paid' : 'Pending');
      return status === 'Pending' || status === 'Raised' || status === 'Overdue';
    });
    return rows.slice(0, 5);
  }, [invoices]);

  const getStatusChip = (invoice) => {
    const status = invoice.status || (invoice.paidDate ? 'Paid' : 'Pending');
    if (status === 'Overdue') return <span className="text-[10px] font-bold text-rose-600 px-3 py-1 bg-rose-50 rounded-full">Overdue</span>;
    return (
      <button className="text-xs font-bold text-emerald-600 px-3 py-1 bg-emerald-50 rounded-full hover:bg-emerald-100">
        Remind
      </button>
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-slate-900">Pending Invoices</h2>
        <button className="text-xs font-bold text-emerald-600 hover:underline">Manage Billing</button>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Client</th>
              <th className="pb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount</th>
              <th className="pb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Due Date</th>
              <th className="pb-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {pendingInvoices.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-sm text-slate-400 text-center">No pending invoices found</td>
              </tr>
            )}
            {pendingInvoices.map((invoice, index) => {
              const amount = invoice.amount || invoice.dealValue || 0;
              const dueDate = invoice.invoiceDate
                ? new Date(invoice.invoiceDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
                : 'N/A';

              const client = invoice.clientName || invoice.projectName || 'Unknown Client';
              const initials = client
                .split(' ')
                .map((word) => word[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <tr key={invoice.id || `${client}-${index}`}>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {initials}
                      </div>
                      <span className="text-sm font-medium text-slate-900">{client}</span>
                    </div>
                  </td>
                  <td className="py-4 text-sm font-bold text-slate-900">
                    {formatGlobalCurrency(amount, invoice.currency || currency, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 text-xs text-slate-500">{dueDate}</td>
                  <td className="py-4 text-right">{getStatusChip(invoice)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { currentUser } = useAuth();

  const [projects, setProjects] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [timesheetEntries, setTimesheetEntries] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isAlertSidebarOpen, setIsAlertSidebarOpen] = useState(false);
  const [activeAlertIndex, setActiveAlertIndex] = useState(0);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingTimesheet, setLoadingTimesheet] = useState(true);
  const [loadingFinance, setLoadingFinance] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const data = await projectService.getAll();
        setProjects(data || []);
      } catch (error) {
        console.error('Dashboard projects error:', error);
      } finally {
        setLoadingProjects(false);
      }
    };

    const fetchContacts = async () => {
      try {
        setLoadingContacts(true);
        const data = await contactService.getContacts();
        setContacts(data || []);
      } catch (error) {
        console.error('Dashboard contacts error:', error);
      } finally {
        setLoadingContacts(false);
      }
    };

    const fetchTimesheet = async () => {
      try {
        setLoadingTimesheet(true);
        const data = await timesheetService.getEntries();
        setTimesheetEntries(data || []);
      } catch (error) {
        console.error('Dashboard timesheet error:', error);
      } finally {
        setLoadingTimesheet(false);
      }
    };

    const fetchFinance = async () => {
      try {
        setLoadingFinance(true);
        const [expenseData, incomeData] = await Promise.all([
          expenseService.getExpenses(),
          incomeService.getIncomes()
        ]);
        setExpenses(expenseData || []);
        setIncomes(incomeData || []);
      } catch (error) {
        console.error('Dashboard finance error:', error);
      } finally {
        setLoadingFinance(false);
      }
    };

    const fetchTasks = async () => {
      try {
        setLoadingTasks(true);
        const data = await taskService.getAll();
        setTasks(data || []);
      } catch (error) {
        console.error('Dashboard tasks error:', error);
      } finally {
        setLoadingTasks(false);
      }
    };

    const fetchAlerts = async () => {
      try {
        const data = await notificationService.getAlerts();
        setAlerts(data || []);
      } catch (error) {
        console.error('Dashboard alerts error:', error);
      }
    };

    fetchProjects();
    fetchContacts();
    fetchTimesheet();
    fetchFinance();
    fetchTasks();
    fetchAlerts();
  }, [currentUser]);

  const kpiStats = useMemo(() => {
    const activeProjects = projects.filter((project) => project.status !== 'Closed' && project.status !== 'Lost').length;
    const wonProjects = projects.filter((project) => project.status === 'Won' || project.activeStage === 4).length;

    const totalBilling = incomes.reduce((sum, income) => sum + (Number(income.amount) || 0), 0);
    const pendingIncomes = incomes.filter((income) => income.status === 'Pending' || income.status === 'Raised');
    const pendingPayments = pendingIncomes.reduce((sum, income) => sum + (Number(income.amount) || 0), 0);

    const conversionRate = projects.length > 0
      ? Number(((wonProjects / projects.length) * 100).toFixed(1))
      : 0;

    return {
      activeProjects,
      totalBilling,
      pendingPayments,
      conversionRate,
      pendingCount: pendingIncomes.length
    };
  }, [projects, incomes]);

  const monthlyData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push({ label: monthNames[date.getMonth()], key, income: 0, expense: 0 });
    }

    incomes.forEach((income) => {
      if (!income.date) return;
      const date = new Date(income.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const month = months.find((row) => row.key === key);
      if (month) month.income += Number(income.amount) || 0;
    });

    expenses.forEach((expense) => {
      if (!expense.date) return;
      const date = new Date(expense.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const month = months.find((row) => row.key === key);
      if (month) month.expense += Number(expense.amount) || 0;
    });

    return months;
  }, [incomes, expenses]);

  const trends = useMemo(() => {
    const current = monthlyData[monthlyData.length - 1] || { income: 0, expense: 0 };
    const previous = monthlyData[monthlyData.length - 2] || { income: 0, expense: 0 };

    const revenueTrend = previous.income > 0
      ? ((current.income - previous.income) / previous.income) * 100
      : 0;

    const pendingTrend = previous.expense > 0
      ? ((current.expense - previous.expense) / previous.expense) * 100
      : 0;

    return { revenueTrend, pendingTrend };
  }, [monthlyData]);

  const recentInvoices = useMemo(() => {
    const milestones = [];

    projects.forEach((project) => {
      if (!Array.isArray(project.milestones)) return;
      project.milestones.forEach((milestone) => {
        milestones.push({
          ...milestone,
          projectName: project.title || project.name || 'Untitled Project',
          projectId: project.id,
          clientName: project.clientName || 'Unknown Client',
          currency: project.currency || 'INR',
          dealValue: project.dealValue || 0
        });
      });
    });

    return milestones
      .sort((a, b) => {
        const dateA = a.invoiceDate ? new Date(a.invoiceDate).getTime() : 0;
        const dateB = b.invoiceDate ? new Date(b.invoiceDate).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10);
  }, [projects]);

  const pendingTasks = useMemo(() => {
    return tasks
      .filter((task) => (task.values?.status || task.status || '') !== 'Completed')
      .sort((a, b) => (b.id || 0) - (a.id || 0))
      .slice(0, 5);
  }, [tasks]);

  useEffect(() => {
    if (alerts.length <= 1) return undefined;

    const interval = setInterval(() => {
      setActiveAlertIndex((prev) => (prev + 1) % alerts.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [alerts]);

  const isLoading = loadingProjects || loadingContacts || loadingTimesheet || loadingFinance || loadingTasks;

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const criticalAlerts = alerts.filter((alert) => alert.severity === 'critical').length;
  const activeAlert = alerts[activeAlertIndex];

  const getAlertCategory = (alert) => {
    if (!alert) return { label: 'General', className: 'bg-slate-100 text-slate-700' };

    const rawCategory = String(alert.category || '').toLowerCase();
    const combinedText = `${alert.title || ''} ${alert.message || ''}`.toLowerCase();

    if (rawCategory.includes('sale') || combinedText.includes('sale') || combinedText.includes('deal') || combinedText.includes('pipeline')) {
      return { label: 'Sales', className: 'bg-blue-50 text-blue-700' };
    }

    if (
      rawCategory.includes('finance') ||
      rawCategory.includes('payment') ||
      rawCategory.includes('income') ||
      rawCategory.includes('expense') ||
      combinedText.includes('payment') ||
      combinedText.includes('income') ||
      combinedText.includes('expense') ||
      combinedText.includes('invoice')
    ) {
      return { label: 'Finance', className: 'bg-emerald-50 text-emerald-700' };
    }

    if (rawCategory.includes('task') || combinedText.includes('task') || combinedText.includes('todo')) {
      return { label: 'Execution', className: 'bg-amber-50 text-amber-700' };
    }

    if (rawCategory.includes('contact') || combinedText.includes('contact') || combinedText.includes('lead')) {
      return { label: 'CRM', className: 'bg-violet-50 text-violet-700' };
    }

    return { label: 'General', className: 'bg-slate-100 text-slate-700' };
  };

  const activeAlertCategory = getAlertCategory(activeAlert);

  return (
    <div className="bg-slate-50 text-slate-900 min-h-full p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Intelligence Layer Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">
              {projects.length} projects, {contacts.length} contacts, and {timesheetEntries.length} timesheet entries tracked in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-72 pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Ask AI anything..."
                type="text"
              />
            </div>

            <button className="relative p-2.5 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-slate-700">
              <Bell className="w-4 h-4" />
              {criticalAlerts > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white" />}
            </button>

            <div className="flex items-center gap-2 text-xs font-medium bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-emerald-700">System Status: Optimal</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 px-4 py-3.5 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                AI Alerts
              </p>
              <div key={activeAlertIndex} className="flex items-center gap-2 mt-0.5 min-w-0 ai-insight-message">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${activeAlertCategory.className}`}>
                  {activeAlertCategory.label}
                </span>
                <p className="text-[15px] text-slate-600 truncate">
                  {activeAlert?.title || activeAlert?.message || 'No critical intelligence right now. Pipeline and operations are stable.'}
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAlertSidebarOpen(true)}
            className="text-xs font-bold text-emerald-600 px-2.5 py-1 bg-emerald-50 rounded-full hover:bg-emerald-100 shrink-0"
          >
            View All
          </button>
        </div>

        <KPISection
          activeProjects={kpiStats.activeProjects}
          totalBilling={kpiStats.totalBilling}
          pendingPayments={kpiStats.pendingPayments}
          conversionRate={kpiStats.conversionRate}
          currency="INR"
          revenueTrend={trends.revenueTrend}
          pendingTrend={trends.pendingTrend}
        />

        <TimelineSection projects={projects} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <RecentIntelligence alerts={alerts} tasks={pendingTasks} />
          <PendingInvoices invoices={recentInvoices} currency="INR" />
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-slate-400 pt-2">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" /> Live Operations Dashboard
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> Enterprise Secured
          </div>
        </div>
      </div>

      {isAlertSidebarOpen && (
        <button
          type="button"
          aria-label="Close alerts drawer overlay"
          onClick={() => setIsAlertSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] z-40"
        />
      )}

      <aside
        className={`fixed top-0 right-0 h-screen w-[360px] bg-white border-l border-slate-200 shadow-2xl z-50 transform transition-transform duration-300 ${
          isAlertSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">AI Alerts</h3>
              <p className="text-xs text-slate-500">{alerts.length} total alerts</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAlertSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {alerts.length === 0 && (
              <div className="text-sm text-slate-400 p-4">No AI alerts available.</div>
            )}
            {alerts.map((alert, index) => {
              const isCritical = alert.severity === 'critical';
              const isWarning = alert.severity === 'warning';
              const severityLabel = isCritical ? 'Critical' : isWarning ? 'Warning' : 'Info';
              const category = getAlertCategory(alert);

              return (
                <div
                  key={alert.id || `${alert.title}-${index}`}
                  className={`rounded-xl border p-4 ${
                    isCritical
                      ? 'border-rose-200 bg-rose-50/40'
                      : isWarning
                        ? 'border-amber-200 bg-amber-50/40'
                        : 'border-slate-200 bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isCritical
                            ? 'text-rose-700 bg-rose-100'
                            : isWarning
                              ? 'text-amber-700 bg-amber-100'
                              : 'text-slate-700 bg-slate-200'
                        }`}
                      >
                        {severityLabel}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${category.className}`}>
                        {category.label}
                      </span>
                    </div>
                    {alert.daysOverdue > 0 && (
                      <span className="text-[10px] font-bold text-rose-600">
                        {alert.daysOverdue}d overdue
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {alert.title || alert.message || 'AI alert'}
                  </p>
                  {alert.clientName && (
                    <p className="text-xs text-slate-500 mt-1">{alert.clientName}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
