import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { projectService, taskService } from '../../services/api';
import { companyService } from '../../services/companyService';
import { contactService } from '../../services/contactService';
import { documentService } from '../../services/documentService';
import { leadService } from '../../services/leadService';
import { legalService } from '../../services/legalService';
import { timesheetService } from '../../services/timesheetService';
import { expenseService } from '../../services/expenseService';
import { incomeService } from '../../services/incomeService';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { formatGlobalCurrency } from '../../utils/currencyUtils';
import {
  AlertTriangle, Lightbulb,
  CheckCircle2, Clock, X,
  Activity, Users, ChevronRight,
  Diamond, TrendingUp, Truck,
  Receipt, Scale, BarChart3,
  UserCog, Shield, Bot, Plus,
} from 'lucide-react';
import './Dashboard.css';

const DASHBOARD_MENU_CARDS = [
  {
    title: 'Acquisition',
    accent: '#5B61F6',
    healthKey: 'acquisition',
    icon: Diamond,
    items: [
      { label: 'Company', to: '/company' },
      { label: 'Contacts', to: '/contact' },
      { label: 'Leads', to: '/leads' },
    ],
  },
  {
    title: 'Sales',
    accent: '#22C55E',
    healthKey: 'sales',
    icon: TrendingUp,
    items: [
      { label: 'Connect', to: '/sales' },
      { label: 'Demo', to: '/sales' },
      { label: 'Proposal', to: '/sales' },
      { label: 'Negotiation', to: '/sales' },
      { label: 'Closure', to: '/sales' },
    ],
  },
  {
    title: 'Delivery',
    accent: '#F59E0B',
    healthKey: 'delivery',
    icon: Truck,
    items: [
      { label: 'Projects', to: '/projects' },
      { label: 'Tasks', to: '/todolist' },
      { label: 'Timesheet', to: '/timesheet' },
      { label: 'Resources', to: '/documents' },
    ],
  },
  {
    title: 'FinOps',
    accent: '#EF4444',
    healthKey: 'finops',
    icon: Receipt,
    items: [
      { label: 'Invoices', to: '/invoice' },
      { label: 'Payments', to: '/finance' },
      { label: 'Revenue', to: '/finance' },
      { label: 'Expenses', to: '/finance' },
      { label: 'Profit', to: '/finance' },
    ],
  },
  {
    title: 'Legal',
    accent: '#8B5CF6',
    healthKey: 'legal',
    icon: Scale,
    items: [
      { label: 'NDA', to: '/legal' },
      { label: 'MSA', to: '/legal' },
      { label: 'SOW', to: '/legal' },
      { label: 'Contracts', to: '/legal' },
    ],
  },
  {
    title: 'Intelligence',
    accent: '#0EA5E9',
    healthKey: 'intelligence',
    icon: BarChart3,
    specialClass: 'card-intelligence',
    items: [
      { label: 'Reports', to: '/reports' },
      { label: 'Analytics', to: '/reports' },
      { label: 'Forecast', to: '/reports' },
    ],
  },
  {
    title: 'People',
    accent: '#14B8A6',
    healthKey: 'people',
    icon: UserCog,
    items: [
      { label: 'Employees', to: '/hr' },
      { label: 'Attendance', to: '/hr' },
      { label: 'Performance', to: '/hr' },
    ],
  },
  {
    title: 'Admin',
    accent: '#6B7280',
    healthKey: 'admin',
    icon: Shield,
    items: [
      { label: 'Settings', to: '/settings' },
      { label: 'Access', to: '/admin' },
      { label: 'Audit Logs', to: '/admin' },
    ],
  },
  {
    title: 'AI Hub',
    accent: '#0A2463', // Deep Navy
    healthKey: 'ai',
    icon: Bot,
    specialClass: 'card-ai-hub',
    items: [
      { label: 'Prompts', to: '/ai-agents' },
      { label: 'Models', to: '/ai-agents/ai-followup' },
      { label: 'Agents', to: '/ai-agents' },
    ],
  },
];

/* ─────────────────────────────────────────
   Health Insight Labels
───────────────────────────────────────── */
function getHealthLabel(pct) {
  if (pct >= 80) return 'Excellent';
  if (pct >= 60) return 'Good';
  if (pct >= 40) return 'Fair';
  if (pct >= 20) return 'Needs Attention';
  return 'Critical';
}

function getHealthColor(pct, accent) {
  if (pct >= 70) return accent;
  if (pct >= 40) return '#F59E0B';
  return '#EF4444';
}

/* ─────────────────────────────────────────
   Animated Counter
───────────────────────────────────────── */
function AnimatedCounter({ to = 0, from = 0, duration = 1100, decimals = 0, prefix = '', suffix = '', formatFn = null }) {
  const [value, setValue] = useState(from);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(from + (to - from) * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [to, from, duration]);

  if (formatFn) return <>{formatFn(value)}</>;
  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value);
  return <>{prefix}{display}{suffix}</>;
}

/* ─────────────────────────────────────────
   SVG Sparkline
───────────────────────────────────────── */
let _sparkId = 0;
function SparkLine({ data = [], color = '#4361EE', height = 42 }) {
  const id = useRef(`sk${++_sparkId}`).current;

  if (!data || data.length < 2) {
    return (
      <svg viewBox="0 0 100 42" preserveAspectRatio="none" style={{ width: '100%', height: `${height}px`, display: 'block' }}>
        <line x1="0" y1="21" x2="100" y2="21" stroke={color} strokeWidth="1.5" strokeOpacity="0.35" strokeDasharray="4 3" />
      </svg>
    );
  }

  const max = Math.max(...data, 0.001);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const W = 100; const H = height; const pad = 5;

  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - pad - ((v - min) / range) * (H - 2 * pad),
  }));

  const path = pts.reduce((acc, p, i) => {
    if (i === 0) return `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return `${acc} C${cpx.toFixed(1)},${prev.y.toFixed(1)} ${cpx.toFixed(1)},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }, '');

  const last = pts[pts.length - 1];
  const first = pts[0];
  const area = `${path} L${last.x},${H} L${first.x},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: `${height}px`, display: 'block' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={path} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r="2.5" fill={color} />
    </svg>
  );
}



function DashboardMenuCards({ cards = [], healthData = {} }) {
  return (
    <motion.div
      className="dash-menu-grid"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.24 }}
    >
      {cards.map((menuCard, cardIndex) => {
        const health = healthData[menuCard.healthKey];
        const pct = health?.percent ?? 0;
        const label = health?.label ?? getHealthLabel(pct);
        const barColor = getHealthColor(pct, menuCard.accent);
        const IconComp = menuCard.icon;

        return (
          <motion.article
            key={menuCard.title}
            className={`dash-menu-card ${menuCard.specialClass || ''}`}
            style={{ '--menu-accent': menuCard.accent }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.28 + (cardIndex * 0.04) }}
          >
            {/* Special gradient backgrounds */}
            {menuCard.specialClass === 'card-intelligence' && (
              <div className="card-gradient-intelligence" />
            )}
            {menuCard.specialClass === 'card-ai-hub' && (
              <div className="card-gradient-ai-hub" />
            )}

            <div className="dash-menu-title-row">
              <div className="dash-menu-title-left">
                <span className="dash-menu-icon" style={{ color: menuCard.accent }}>
                  <IconComp size={16} />
                </span>
                <div>
                  <h3 className="dash-menu-title">{menuCard.title}</h3>
                  <p className="dash-menu-subtitle">{menuCard.subtitle}</p>
                </div>
              </div>
              <Link
                to={menuCard.items[0]?.to || '#'}
                className="dash-menu-add-btn"
                title={`Add ${menuCard.title}`}
              >
                <Plus size={14} />
              </Link>
            </div>
            <div className="dash-menu-chip-wrap">
              {menuCard.items.map((item) => (
                <Link key={`${menuCard.title}-${item.label}`} to={item.to} className="dash-menu-chip">
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="dash-menu-health">
              <span className="dash-menu-metric-label">{menuCard.metricLabel}</span>
              <div className="dash-menu-health-main">
                <div className="dash-menu-health-value">
                  <AnimatedCounter to={pct} suffix="%" duration={1000 + (cardIndex * 40)} />
                </div>
                <div className="dash-menu-health-side">
                  <span className="dash-menu-health-chip" style={{ color: menuCard.accent }}>
                    {menuCard.statText}
                  </span>
                  <span className="dash-menu-health-meta">{menuCard.statMeta}</span>
                </div>
              </div>
              <div className="dash-menu-health-header">
                <span className="dash-menu-health-label">{label}</span>
                <span className="dash-menu-health-pct">{pct}%</span>
              </div>
              <div className="dash-menu-health-track">
                <motion.div
                  className="dash-menu-health-fill"
                  style={{ background: barColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(pct, 2)}%` }}
                  transition={{ duration: 0.8, delay: 0.4 + (cardIndex * 0.06), ease: [0.25, 0.1, 0.25, 1] }}
                />
              </div>
            </div>
          </motion.article>
        );
      })}
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Alert Sidebar
───────────────────────────────────────── */
function AlertSidebar({ alerts, onClose, getAlertCategory }) {
  return (
    <AnimatePresence>
      <>
        <motion.div
          className="dash-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.aside
          className="dash-alert-sidebar"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        >
          <div className="dash-sidebar-header">
            <div>
              <h3>AI Alerts</h3>
              <p>{alerts.length} total alert{alerts.length !== 1 ? 's' : ''}</p>
            </div>
            <button className="dash-sidebar-close" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
          <div className="dash-sidebar-content no-scrollbar">
            {alerts.length === 0 && (
              <div className="activity-empty">
                <CheckCircle2 size={24} style={{ color: '#10B981' }} />
                <p>No alerts — all systems nominal.</p>
              </div>
            )}
            {alerts.map((alert, i) => {
              const isCritical = alert.severity === 'critical';
              const isWarning = alert.severity === 'warning';
              const level = isCritical ? 'critical' : isWarning ? 'warning' : 'info';
              const category = getAlertCategory(alert);
              return (
                <div key={alert.id || `${alert.title}-${i}`} className={`dash-alert-card ${level}`}>
                  <div className="dash-alert-card-head">
                    <span className={`dash-alert-badge ${level}`}>
                      {isCritical ? 'Critical' : isWarning ? 'Warning' : 'Info'}
                    </span>
                    <span className={`dash-alert-card-cat ${category.className}`}>{category.label}</span>
                    {alert.daysOverdue > 0 && (
                      <span className="dash-alert-overdue">{alert.daysOverdue}d overdue</span>
                    )}
                  </div>
                  <p className="dash-alert-card-title">{alert.title || alert.message || 'AI alert'}</p>
                  {alert.clientName && <p className="dash-alert-card-client">{alert.clientName}</p>}
                </div>
              );
            })}
          </div>
        </motion.aside>
      </>
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────
   Main Dashboard
───────────────────────────────────────── */
export default function Dashboard() {
  const { currentUser } = useAuth();

  const [projects, setProjects] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [legalAgreements, setLegalAgreements] = useState([]);
  const [timesheetEntries, setTimesheetEntries] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isAlertSidebarOpen, setIsAlertSidebarOpen] = useState(false);
  const [activeAlertIndex, setActiveAlertIndex] = useState(0);

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [loadingLegal, setLoadingLegal] = useState(true);
  const [loadingTimesheet, setLoadingTimesheet] = useState(true);
  const [loadingFinance, setLoadingFinance] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const controller = new AbortController();
    const { signal } = controller;

    const toArray = (data) => (Array.isArray(data) ? data : (data?.items ?? data?.tasks ?? []));

    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const d = await projectService.getAll(1, 100);
        if (signal.aborted) return;
        setProjects(toArray(d));
      } catch (e) {
        if (signal.aborted) return;
        console.error('Dashboard projects:', e);
      } finally {
        if (!signal.aborted) setLoadingProjects(false);
      }
    };
    const fetchCompanies = async () => {
      try {
        setLoadingCompanies(true);
        const d = await companyService.getCompanies(1, 100);
        if (signal.aborted) return;
        setCompanies(toArray(d));
      } catch (e) {
        if (signal.aborted) return;
        console.error('Dashboard companies:', e);
      } finally {
        if (!signal.aborted) setLoadingCompanies(false);
      }
    };
    const fetchContacts = async () => {
      try {
        setLoadingContacts(true);
        const d = await contactService.getContacts(1, 100);
        if (signal.aborted) return;
        setContacts(toArray(d));
      } catch (e) {
        if (signal.aborted) return;
        console.error('Dashboard contacts:', e);
      } finally {
        if (!signal.aborted) setLoadingContacts(false);
      }
    };
    const fetchLeads = async () => {
      try {
        setLoadingLeads(true);
        const d = await leadService.getLeads(1, 100);
        if (signal.aborted) return;
        setLeads(toArray(d));
      } catch (e) {
        if (signal.aborted) return;
        console.error('Dashboard leads:', e);
      } finally {
        if (!signal.aborted) setLoadingLeads(false);
      }
    };
    const fetchDocuments = async () => {
      try {
        setLoadingDocuments(true);
        const d = await documentService.getAll();
        if (signal.aborted) return;
        setDocuments(toArray(d));
      } catch (e) {
        if (signal.aborted) return;
        console.error('Dashboard documents:', e);
      } finally {
        if (!signal.aborted) setLoadingDocuments(false);
      }
    };
    const fetchLegal = async () => {
      try {
        setLoadingLegal(true);
        const d = await legalService.getAll();
        if (signal.aborted) return;
        setLegalAgreements(toArray(d));
      } catch (e) {
        if (signal.aborted) return;
        console.error('Dashboard legal:', e);
      } finally {
        if (!signal.aborted) setLoadingLegal(false);
      }
    };
    const fetchTimesheet = async () => {
      try {
        setLoadingTimesheet(true);
        const d = await timesheetService.getEntries(1, 100);
        if (signal.aborted) return;
        setTimesheetEntries((d?.items ?? d) || []);
      } catch (e) {
        if (signal.aborted) return;
        console.error('Dashboard timesheet:', e);
      } finally {
        if (!signal.aborted) setLoadingTimesheet(false);
      }
    };
    const fetchFinance = async () => {
      try {
        setLoadingFinance(true);
        const [exp, inc] = await Promise.all([
          expenseService.getExpenses(1, 1000),
          incomeService.getIncomes(1, 1000)
        ]);
        if (signal.aborted) return;
        setExpenses((exp?.items ?? exp) || []);
        setIncomes((inc?.items ?? inc) || []);
      } catch (e) {
        if (signal.aborted) return;
        console.error('Dashboard finance:', e);
      } finally {
        if (!signal.aborted) setLoadingFinance(false);
      }
    };
    const fetchTasks = async () => {
      try {
        setLoadingTasks(true);
        const d = await taskService.getAll();
        if (signal.aborted) return;
        setTasks(Array.isArray(d) ? d : (d?.items ?? d?.tasks ?? []));
      } catch (e) {
        if (signal.aborted) return;
        console.error('Dashboard tasks:', e);
      } finally {
        if (!signal.aborted) setLoadingTasks(false);
      }
    };
    const fetchAlerts = async () => {
      try {
        const a = await notificationService.getAlerts();
        if (signal.aborted) return;
        setAlerts(a || []);
      } catch (e) {
        if (signal.aborted) return;
        console.error('Dashboard alerts:', e);
      }
    };

    fetchProjects();
    fetchCompanies();
    fetchContacts();
    fetchLeads();
    fetchDocuments();
    fetchLegal();
    fetchTimesheet();
    fetchFinance();
    fetchTasks();
    fetchAlerts();

    return () => controller.abort();
  }, [currentUser]);

  /* ── Monthly Chart Data ── */
  const monthlyData = useMemo(() => {
    const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { label: names[d.getMonth()], key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`, income: 0, expense: 0 };
    });
    incomes.forEach((inc) => {
      if (!inc.date) return;
      const d = new Date(inc.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`;
      const m = months.find((x) => x.key === key);
      if (m) m.income += Number(inc.amount) || 0;
    });
    expenses.forEach((exp) => {
      if (!exp.date) return;
      const d = new Date(exp.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`;
      const m = months.find((x) => x.key === key);
      if (m) m.expense += Number(exp.amount) || 0;
    });
    return months;
  }, [incomes, expenses]);

  /* ── Recent Invoices ── */
  const recentInvoices = useMemo(() => {
    const ms = [];
    projects.forEach((p) => {
      if (!Array.isArray(p.milestones)) return;
      p.milestones.forEach((m) => ms.push({
        ...m,
        projectName: p.title || p.name || 'Untitled',
        clientName: p.clientName || 'Unknown Client',
        currency: p.currency || 'INR',
        dealValue: p.dealValue || 0,
      }));
    });
    return ms.sort((a, b) => {
      const dA = a.invoiceDate ? new Date(a.invoiceDate).getTime() : 0;
      const dB = b.invoiceDate ? new Date(b.invoiceDate).getTime() : 0;
      return dB - dA;
    }).slice(0, 10);
  }, [projects]);

  /* ── Pending Tasks ── */
  const pendingTasks = useMemo(() =>
    tasks.filter((t) => (t.values?.status || t.status || '') !== 'Completed')
      .sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 5),
  [tasks]);

  /* ── Module Health Insights ── */
  const moduleHealth = useMemo(() => {
    const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));

    // Acquisition: based on contacts pipeline fullness (target: 50 contacts = 100%)
    const acqBase = companies.length + contacts.length + leads.length;
    const acqPct = clamp(acqBase > 0 ? Math.min((acqBase / 90) * 100, 100) : 0);

    // Sales: based on won deals vs total deals ratio
    const wonDeals = projects.filter(p => p.status === 'Won').length;
    const lostDeals = projects.filter(p => p.status === 'Lost').length;
    const activeDeals = projects.filter(p => !p.status || p.status === 'Active' || p.status === 'In Progress').length;
    const totalDeals = projects.length;
    const salesPct = clamp(totalDeals > 0
      ? ((wonDeals * 2 + activeDeals) / (totalDeals * 2)) * 100
      : 0);

    // Delivery: task completion rate
    const completedTasks = tasks.filter(t => (t.values?.status || t.status) === 'Completed').length;
    const totalTasks = tasks.length;
    const deliveryPct = clamp(totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0);

    // FinOps: income vs expense health (positive margin = healthy)
    const totalIncome = incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const totalExpense = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const finopsPct = clamp(
      totalIncome > 0
        ? Math.min(((totalIncome - totalExpense) / totalIncome) * 100 + 50, 100)
        : totalExpense > 0 ? 15 : 0
    );

    // Legal: projects with milestones/contracts (coverage)
    const projectsWithMilestones = projects.filter(p => Array.isArray(p.milestones) && p.milestones.length > 0).length;
    const legalCoverageBase = Math.max(totalDeals, legalAgreements.length, 1);
    const legalPct = clamp(
      ((projectsWithMilestones + legalAgreements.length) / (legalCoverageBase * 2)) * 100
    );

    // Intelligence: data sufficiency across modules
    const dataPoints = [
      companies.length > 0 ? 1 : 0,
      contacts.length > 0 ? 1 : 0,
      leads.length > 0 ? 1 : 0,
      projects.length > 0 ? 1 : 0,
      tasks.length > 0 ? 1 : 0,
      incomes.length > 0 ? 1 : 0,
      expenses.length > 0 ? 1 : 0,
      timesheetEntries.length > 0 ? 1 : 0,
      documents.length > 0 ? 1 : 0,
      legalAgreements.length > 0 ? 1 : 0,
    ];
    const intelPct = clamp((dataPoints.reduce((a, b) => a + b, 0) / dataPoints.length) * 100);

    // People: timesheet activity (target: at least 1 entry per project)
    const peoplePct = clamp(
      projects.length > 0
        ? Math.min((timesheetEntries.length / (projects.length * 2)) * 100, 100)
        : timesheetEntries.length > 0 ? 60 : 0
    );

    // Admin: system health (always stable if user is authenticated and data loads)
    const adminPct = clamp(85 + Math.min(totalDeals * 2, 15));

    // AI: alert monitoring health (fewer critical = healthier)
    const critCount = alerts.filter(a => a.severity === 'critical').length;
    const aiPct = clamp(alerts.length > 0
      ? Math.max(100 - (critCount * 25), 20)
      : 70);

    const make = (pct) => ({ percent: pct, label: getHealthLabel(pct) });

    return {
      acquisition: make(acqPct),
      sales: make(salesPct),
      delivery: make(deliveryPct),
      finops: make(finopsPct),
      legal: make(legalPct),
      intelligence: make(intelPct),
      people: make(peoplePct),
      admin: make(adminPct),
      ai: make(aiPct),
    };
  }, [projects, companies, contacts, leads, tasks, incomes, expenses, legalAgreements, documents, timesheetEntries, alerts]);

  const menuCards = useMemo(() => {
    const totalDeals = projects.length;
    const wonDeals = projects.filter((p) => p.status === 'Won').length;
    const openDeals = projects.filter((p) => !p.status || p.status === 'Active' || p.status === 'In Progress').length;
    const lostDeals = projects.filter((p) => p.status === 'Lost').length;
    const completedTasks = tasks.filter((t) => (t.values?.status || t.status) === 'Completed').length;
    const openTasks = Math.max(tasks.length - completedTasks, 0);
    const totalIncome = incomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalExpense = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const netBalance = totalIncome - totalExpense;
    const expiringSoon = legalAgreements.filter((agreement) => {
      if (!agreement?.endDate) return false;
      const endDate = new Date(agreement.endDate);
      if (Number.isNaN(endDate.getTime())) return false;
      const diffDays = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    }).length;
    const criticalAlertCount = alerts.filter((alert) => alert.severity === 'critical').length;
    const dataSources = [
      companies,
      contacts,
      leads,
      projects,
      tasks,
      documents,
      legalAgreements,
      incomes,
      expenses,
      timesheetEntries,
    ].filter((items) => items.length > 0).length;

    const cardDetails = {
      acquisition: {
        subtitle: `${companies.length} companies · ${contacts.length} contacts · ${leads.length} leads`,
        metricLabel: 'CRM coverage',
        statText: `${companies.length + contacts.length + leads.length} live`,
        statMeta: 'records tracked',
        items: [
          { label: `Companies ${companies.length}`, to: '/company' },
          { label: `Contacts ${contacts.length}`, to: '/contact' },
          { label: `Leads ${leads.length}`, to: '/leads' },
        ],
      },
      sales: {
        subtitle: `${totalDeals} deals · ${wonDeals} won · ${openDeals} active`,
        metricLabel: 'Pipeline health',
        statText: `${wonDeals}/${Math.max(totalDeals, 1)}`,
        statMeta: 'won deals',
        items: [
          { label: `Active ${openDeals}`, to: '/sales' },
          { label: `Won ${wonDeals}`, to: '/sales' },
          { label: `Lost ${lostDeals}`, to: '/sales' },
        ],
      },
      delivery: {
        subtitle: `${documents.length} docs · ${tasks.length} tasks · ${timesheetEntries.length} timesheets`,
        metricLabel: 'Execution health',
        statText: `${completedTasks}/${Math.max(tasks.length, 1)}`,
        statMeta: 'tasks complete',
        items: [
          { label: `Projects ${projects.length}`, to: '/projects' },
          { label: `Open ${openTasks}`, to: '/todolist' },
          { label: `Docs ${documents.length}`, to: '/documents' },
        ],
      },
      finops: {
        subtitle: `${incomes.length} income items · ${expenses.length} expense items`,
        metricLabel: 'Financial health',
        statText: formatGlobalCurrency(netBalance, 'INR', { maximumFractionDigits: 0 }),
        statMeta: 'net balance',
        items: [
          { label: `Income ${incomes.length}`, to: '/finance' },
          { label: `Expense ${expenses.length}`, to: '/finance' },
          { label: `Invoices ${projects.filter((p) => Array.isArray(p.milestones) && p.milestones.length > 0).length}`, to: '/invoice' },
        ],
      },
      legal: {
        subtitle: `${legalAgreements.length} agreements · ${expiringSoon} expiring soon`,
        metricLabel: 'Compliance health',
        statText: `${expiringSoon}`,
        statMeta: 'due in 30 days',
        items: [
          { label: `Agreements ${legalAgreements.length}`, to: '/legal' },
          { label: `Expiring ${expiringSoon}`, to: '/legal' },
          { label: `Contracts ${projects.filter((p) => Array.isArray(p.milestones) && p.milestones.length > 0).length}`, to: '/legal' },
        ],
      },
      intelligence: {
        subtitle: `${dataSources} data sources online · ${alerts.length} alerts in feed`,
        metricLabel: 'Data coverage',
        statText: `${dataSources}/10`,
        statMeta: 'sources reporting',
        items: [
          { label: `Reports ${dataSources}`, to: '/reports' },
          { label: `Alerts ${alerts.length}`, to: '/reports' },
          { label: `Docs ${documents.length}`, to: '/reports' },
        ],
      },
      people: {
        subtitle: `${timesheetEntries.length} timesheets · ${openTasks} open tasks`,
        metricLabel: 'Team throughput',
        statText: `${timesheetEntries.length}`,
        statMeta: 'time entries',
        items: [
          { label: `Timesheets ${timesheetEntries.length}`, to: '/timesheet' },
          { label: `Tasks ${openTasks}`, to: '/todolist' },
          { label: `Projects ${projects.length}`, to: '/projects' },
        ],
      },
      admin: {
        subtitle: `${alerts.length} alerts · ${criticalAlertCount} critical · ${documents.length} docs`,
        metricLabel: 'System health',
        statText: `${alerts.length}`,
        statMeta: 'system notices',
        items: [
          { label: 'Settings', to: '/settings' },
          { label: `Alerts ${alerts.length}`, to: '/admin' },
          { label: `Audit ${documents.length}`, to: '/admin' },
        ],
      },
      ai: {
        subtitle: `${alerts.length} AI alerts · ${criticalAlertCount} critical signals`,
        metricLabel: 'Model coverage',
        statText: `${criticalAlertCount}`,
        statMeta: 'critical alerts',
        items: [
          { label: `Prompts ${alerts.length}`, to: '/ai-agents' },
          { label: `Models ${dataSources}`, to: '/ai-agents/ai-followup' },
          { label: `Agents ${criticalAlertCount}`, to: '/ai-agents' },
        ],
      },
    };

    return DASHBOARD_MENU_CARDS.map((card) => ({
      ...card,
      ...cardDetails[card.healthKey],
    }));
  }, [projects, companies, contacts, leads, tasks, documents, legalAgreements, incomes, expenses, timesheetEntries, alerts]);

  /* ── Alert rotation ── */
  useEffect(() => {
    if (alerts.length <= 1) return undefined;
    const interval = setInterval(() => setActiveAlertIndex((p) => (p + 1) % alerts.length), 3500);
    return () => clearInterval(interval);
  }, [alerts]);

  /* ── Alert category helper ── */
  const getAlertCategory = (alert) => {
    if (!alert) return { label: 'General', className: 'bg-slate-100 text-slate-700' };
    const raw = String(alert.category || '').toLowerCase();
    const txt = `${alert.title || ''} ${alert.message || ''}`.toLowerCase();
    if (raw.includes('sale') || txt.includes('sale') || txt.includes('deal'))
      return { label: 'Sales', className: 'bg-blue-50 text-blue-700' };
    if (raw.includes('finance') || txt.includes('payment') || txt.includes('invoice'))
      return { label: 'Finance', className: 'bg-emerald-50 text-emerald-700' };
    if (raw.includes('task') || txt.includes('task'))
      return { label: 'Execution', className: 'bg-amber-50 text-amber-700' };
    if (raw.includes('contact') || txt.includes('lead'))
      return { label: 'CRM', className: 'bg-violet-50 text-violet-700' };
    return { label: 'General', className: 'bg-slate-100 text-slate-700' };
  };

  const isLoading =
    loadingProjects ||
    loadingCompanies ||
    loadingContacts ||
    loadingLeads ||
    loadingDocuments ||
    loadingLegal ||
    loadingTimesheet ||
    loadingFinance ||
    loadingTasks;

  if (isLoading) {
    return (
      <div className="dash-loading">
        <div className="dash-loading-ring" />
        <p>Loading workspace...</p>
      </div>
    );
  }

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;
  const activeAlert = alerts[activeAlertIndex];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const firstName = (currentUser?.displayName || '').split(' ')[0] || 'there';

  return (
    <div className="dash-root">
      <div className="dash-content">

        {/* ── Header ── */}
        <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 className="dash-title">
              {greeting}, {firstName}
              <span className="dash-title-wave">👋</span>
            </h1>
            <p className="dash-subtitle">
              {projects.length} projects · {contacts.length} contacts · {timesheetEntries.length} timesheet entries tracked
            </p>
          </div>
          <div className="dash-header-nav" style={{ display: 'flex', gap: '10px' }}>
            <button className="dash-nav-pill active">Home</button>
            <button className="dash-nav-pill" onClick={() => setIsAlertSidebarOpen(true)}>
              Notifications
              {criticalAlerts > 0 && <span className="dash-nav-badge">{criticalAlerts}</span>}
            </button>
          </div>
        </div>

        {/* ── AI Alert Banner ── */}
        {activeAlert && (
          <motion.div
            key={activeAlertIndex}
            className="dash-alert-banner"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="dash-alert-icon">
              <Lightbulb size={14} />
            </div>
            <div className="dash-alert-content">
              <span className="dash-alert-label">AI Insight</span>
              <span className="dash-alert-message">
                {activeAlert.title || activeAlert.message || 'Pipeline and operations are stable.'}
              </span>
            </div>
            <button className="dash-alert-viewall" onClick={() => setIsAlertSidebarOpen(true)}>
              View All <ChevronRight size={12} />
            </button>
          </motion.div>
        )}

        {/* ── Menu Cards ── */}
        <DashboardMenuCards cards={menuCards} healthData={moduleHealth} />



        {/* ── Footer ── */}
        <div className="dash-footer">
          <div className="dash-footer-item"><Clock size={12} /> Live Operations Dashboard</div>
          <div className="dash-footer-item"><CheckCircle2 size={12} /> Enterprise Secured</div>
        </div>
      </div>

      {/* ── Alert Sidebar ── */}
      {isAlertSidebarOpen && (
        <AlertSidebar
          alerts={alerts}
          onClose={() => setIsAlertSidebarOpen(false)}
          getAlertCategory={getAlertCategory}
        />
      )}
    </div>
  );
}


