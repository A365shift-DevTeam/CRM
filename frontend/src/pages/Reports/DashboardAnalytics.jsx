import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';
import { projectService, taskService } from '../../services/api';
import { contactService } from '../../services/contactService';
import { timesheetService } from '../../services/timesheetService';
import { expenseService } from '../../services/expenseService';
import { incomeService } from '../../services/incomeService';
import { notificationService } from '../../services/notificationService';
import { formatGlobalCurrency } from '../../utils/currencyUtils';
import {
  AlertTriangle, Lightbulb,
  CheckCircle2, Clock, Activity, Users,
} from 'lucide-react';
import '../Dashboard/Dashboard.css';

/* ─────────────────────────────────────────
   Custom Chart Tooltip
───────────────────────────────────────── */
function ChartTooltip({ active, payload, label, currency = 'INR' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-chart-tooltip">
      <div className="tooltip-label">{label}</div>
      {payload.map((entry, i) => (
        <div key={i} className="tooltip-row">
          <span className="tooltip-dot" style={{ background: entry.color }} />
          <span>{entry.name}: {formatGlobalCurrency(entry.value, currency, { maximumFractionDigits: 0 })}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   Revenue Analytics Chart
───────────────────────────────────────── */
function RevenueChart({ data }) {
  return (
    <motion.div
      className="chart-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.28 }}
    >
      <div className="chart-card-header">
        <div>
          <h3 className="chart-card-title">Revenue Analytics</h3>
          <p className="chart-card-sub">6-month income vs. expense comparison</p>
        </div>
        <div className="chart-legend">
          <span className="legend-item"><span className="legend-dot" style={{ background: '#4361EE' }} /> Income</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: '#F43F5E' }} /> Expense</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 6, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4361EE" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#4361EE" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.7)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}
            axisLine={false} tickLine={false}
            tickFormatter={(v) => v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="income" name="Income" stroke="#4361EE" strokeWidth={2.5}
            fill="url(#incomeGrad)" dot={false} activeDot={{ r: 5, fill: '#4361EE', strokeWidth: 2, stroke: '#fff' }} />
          <Area type="monotone" dataKey="expense" name="Expense" stroke="#F43F5E" strokeWidth={2.5}
            fill="url(#expenseGrad)" dot={false} activeDot={{ r: 5, fill: '#F43F5E', strokeWidth: 2, stroke: '#fff' }} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Pipeline Stages Bar Chart
───────────────────────────────────────── */
const PIPELINE_STAGES = [
  { name: 'Demo',        color: '#06B6D4', index: 0 },
  { name: 'Proposal',   color: '#F59E0B', index: 1 },
  { name: 'Negotiation',color: '#F97316', index: 2 },
  { name: 'Approval',   color: '#8B5CF6', index: 3 },
  { name: 'Won',        color: '#10B981', index: 4 },
  { name: 'Lost',       color: '#F43F5E', index: 6 },
];

function PipelineChart({ projects }) {
  const data = useMemo(() => PIPELINE_STAGES.map((stage) => ({
    name: stage.name,
    count: projects.filter((p) =>
      p.status === stage.name || p.activeStage === stage.index
    ).length,
    color: stage.color,
  })), [projects]);

  const CustomBarTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="dash-chart-tooltip">
        <div className="tooltip-row">
          <span className="tooltip-dot" style={{ background: payload[0]?.payload?.color }} />
          <span>{payload[0]?.payload?.name}: <b>{payload[0]?.value} deals</b></span>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      className="chart-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.36 }}
    >
      <div className="chart-card-header">
        <div>
          <h3 className="chart-card-title">Sales Pipeline</h3>
          <p className="chart-card-sub">Deal distribution by stage</p>
        </div>
        <div className="chart-total-badge">{projects.length} Total</div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 2, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.7)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'DM Sans, sans-serif' }}
            axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="name"
            tick={{ fontSize: 11, fill: '#64748B', fontWeight: 500, fontFamily: 'DM Sans, sans-serif' }}
            axisLine={false} tickLine={false} width={78} />
          <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(67,97,238,0.04)' }} />
          <Bar dataKey="count" name="Deals" radius={[0, 6, 6, 0]} maxBarSize={22}>
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Deal Breakdown — Donut Pie
───────────────────────────────────────── */
const PIE_SLICES = [
  { label: 'Active',      color: '#4361EE', key: 'active'  },
  { label: 'Won',         color: '#10B981', key: 'won'     },
  { label: 'In Progress', color: '#F59E0B', key: 'progress'},
  { label: 'Lost',        color: '#F43F5E', key: 'lost'    },
  { label: 'Closed',      color: '#64748B', key: 'closed'  },
];

function DealPieChart({ projects }) {
  const data = useMemo(() => {
    const counts = {
      active:   projects.filter(p => !p.status || p.status === 'Active').length,
      won:      projects.filter(p => p.status === 'Won').length,
      progress: projects.filter(p => p.status === 'In Progress').length,
      lost:     projects.filter(p => p.status === 'Lost').length,
      closed:   projects.filter(p => p.status === 'Closed').length,
    };
    const result = PIE_SLICES
      .map(s => ({ name: s.label, value: counts[s.key], color: s.color }))
      .filter(d => d.value > 0);
    if (result.length === 0) return [{ name: 'No Data', value: 1, color: '#E1E8F4' }];
    return result;
  }, [projects]);

  const total = projects.length;

  const PieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
      <div className="dash-chart-tooltip">
        <div className="tooltip-row">
          <span className="tooltip-dot" style={{ background: d.payload.color }} />
          <span>{d.name}: <b>{d.value} deals</b></span>
        </div>
      </div>
    );
  };

  return (
    <motion.div className="chart-card"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.32 }}
    >
      <div className="chart-card-header">
        <div>
          <h3 className="chart-card-title">Deal Breakdown</h3>
          <p className="chart-card-sub">Project status distribution</p>
        </div>
        <div className="chart-total-badge">{total} Total</div>
      </div>
      <div className="pie-chart-body">
        <div className="pie-donut-wrap">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%"
                innerRadius={56} outerRadius={86}
                paddingAngle={3} dataKey="value" strokeWidth={0}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                  if (percent < 0.07) return null;
                  const RADIAN = Math.PI / 180;
                  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + r * Math.cos(-midAngle * RADIAN);
                  const y = cy + r * Math.sin(-midAngle * RADIAN);
                  return (
                    <text x={x} y={y} fill="#fff" textAnchor="middle"
                      dominantBaseline="central" fontSize={11} fontWeight={700}
                      fontFamily="DM Sans, sans-serif">
                      {(percent * 100).toFixed(0)}%
                    </text>
                  );
                }}
                labelLine={false}
              >
                {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-center">
            <span className="pie-center-num">{total}</span>
            <span className="pie-center-lbl">Deals</span>
          </div>
        </div>
        <div className="pie-legend-col">
          {data.map(d => (
            <div key={d.name} className="pie-legend-row">
              <span className="pie-legend-dot" style={{ background: d.color }} />
              <span className="pie-legend-name">{d.name}</span>
              <span className="pie-legend-val">{d.value}</span>
              <div className="pie-legend-bar-track">
                <motion.div className="pie-legend-bar-fill"
                  style={{ background: d.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${total > 0 ? (d.value / total) * 100 : 0}%` }}
                  transition={{ duration: 0.7, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Sales Funnel Chart (Enterprise SVG)
───────────────────────────────────────── */
const FUNNEL_STAGES = [
  { name: 'Demo',        color: '#4361EE' },
  { name: 'Proposal',   color: '#06B6D4' },
  { name: 'Negotiation',color: '#F59E0B' },
  { name: 'Approval',   color: '#8B5CF6' },
  { name: 'Won',        color: '#10B981' },
];

function SalesFunnelChart({ projects }) {
  const raw = useMemo(() => FUNNEL_STAGES.map((stage, idx) => ({
    ...stage,
    count: projects.filter((p) => p.activeStage === idx || p.status === stage.name).length,
  })), [projects]);

  const total = raw.reduce((sum, d) => sum + d.count, 0);
  const trackedStages = raw.filter((s) => s.count > 0).length;

  const SVG_W = 460;
  const SVG_H = 280;
  const CENTER_X = SVG_W / 2;
  const SEGMENT_H = 50;
  const TOP_GAP = 12;
  const START_HALF_W = 200;
  const MIN_HALF_W = 6;

  const scaledHalfWidth = (idx, total) => {
    const ratio = Math.max(0, (total - idx) / total);
    return Math.max(MIN_HALF_W, Math.round(MIN_HALF_W + ratio * (START_HALF_W - MIN_HALF_W)));
  };

  return (
    <motion.div className="chart-card"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.44 }}
    >
      <div className="chart-card-header">
        <div>
          <h3 className="chart-card-title">Sales Funnel</h3>
          <p className="chart-card-sub">Pipeline conversion by stage</p>
        </div>
        <div className="chart-total-badge">{trackedStages} Tracked</div>
      </div>

      <div className="funnel-enterprise-layout">
        <div className="funnel-canvas-wrap">
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="funnel-canvas" role="img" aria-label="Sales funnel by stage">
            {raw.map((stage, i) => {
              const topWidth = scaledHalfWidth(i, raw.length);
              const bottomWidth = scaledHalfWidth(i + 1, raw.length);
              const yTop = TOP_GAP + i * SEGMENT_H;
              const yBottom = yTop + SEGMENT_H - 2;
              const points = `${CENTER_X - topWidth},${yTop} ${CENTER_X + topWidth},${yTop} ${CENTER_X + bottomWidth},${yBottom} ${CENTER_X - bottomWidth},${yBottom}`;
              const showLabel = topWidth > 38 || bottomWidth > 38;

              return (
                <g key={stage.name}>
                  <polygon points={points} fill={stage.color} opacity="0.97" />
                  {showLabel && (
                    <text
                      x={CENTER_X}
                      y={(yTop + yBottom) / 2 + 5}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize="11"
                      fontWeight="700"
                      fontFamily="DM Sans, sans-serif"
                    >
                      {stage.name}
                    </text>
                  )}
                </g>
              );
            })}
            <line
              x1={CENTER_X}
              y1={TOP_GAP + raw.length * SEGMENT_H - 2}
              x2={CENTER_X}
              y2={SVG_H - 8}
              stroke={raw[raw.length - 1]?.color || '#10B981'}
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.8"
            />
          </svg>
        </div>

        <div className="funnel-metric-list">
          {raw.map((s, i) => {
            const maxStageIndex = FUNNEL_STAGES.length - 1;
            const stagePct = maxStageIndex > 0 ? Math.round((i / maxStageIndex) * 100) : 0;
            return (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.4 + i * 0.07 }}
                className="funnel-metric-row"
              >
                <span className="funnel-metric-dot" style={{ background: s.color }} />
                <span className="funnel-metric-name">{s.name}</span>
                <span className="funnel-metric-count">{s.count}</span>
                <div className="funnel-metric-track">
                  <motion.div
                    style={{ height: '100%', borderRadius: 999, background: s.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(stagePct, 4)}%` }}
                    transition={{ duration: 0.6, delay: 0.5 + i * 0.07 }}
                  />
                </div>
                <span className="funnel-metric-pct">{stagePct}%</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="funnel-footer">
        <span>Total in pipeline</span>
        <span style={{ fontWeight: 700, color: '#0F172A' }}>{total} deals</span>
      </div>
    </motion.div>
  );
}

/* -----------------------------------------------
   Intelligence Feed (Activity)
----------------------------------------------- */
const FEED_STYLES = {
  danger: { bg: '#FFF1F2', color: '#F43F5E', border: '#FECDD3' },
  warning:{ bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  info:   { bg: '#EFF6FF', color: '#4361EE', border: '#BFDBFE' },
  task:   { bg: '#F0FDF4', color: '#10B981', border: '#A7F3D0' },
};

function IntelligenceFeed({ alerts, tasks }) {
  const items = useMemo(() => {
    const alertItems = (alerts || []).slice(0, 3).map((alert) => ({
      id: `a-${alert.id || alert.title}`,
      type: alert.severity === 'critical' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'info',
      icon: alert.severity === 'critical' ? AlertTriangle : Lightbulb,
      title: alert.title || alert.message || 'AI alert',
      desc: alert.clientName || 'AI monitoring system',
      time: alert.daysOverdue > 0 ? `${alert.daysOverdue}d overdue` : 'Live',
    }));
    const taskItems = (tasks || []).slice(0, 2).map((task) => ({
      id: `t-${task.id}`,
      type: 'task',
      icon: CheckCircle2,
      title: task.values?.title || task.title || 'Task update',
      desc: (task.values?.status || task.status || 'Pending'),
      time: task.values?.dueDate
        ? new Date(task.values.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Queued',
    }));
    return [...alertItems, ...taskItems].slice(0, 5);
  }, [alerts, tasks]);

  return (
    <motion.div
      className="chart-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.42 }}
    >
      <div className="chart-card-header">
        <div>
          <h3 className="chart-card-title">Intelligence Feed</h3>
          <p className="chart-card-sub">Alerts & task updates</p>
        </div>
        <div className="chart-total-badge live-badge">
          <span className="live-dot" /> Live
        </div>
      </div>
      <div className="activity-list">
        {items.length === 0 && (
          <div className="activity-empty">
            <CheckCircle2 size={22} style={{ color: '#10B981' }} />
            <p>All systems nominal</p>
          </div>
        )}
        {items.map((item, i) => {
          const style = FEED_STYLES[item.type] || FEED_STYLES.info;
          const Icon = item.icon;
          return (
            <motion.div
              key={item.id}
              className="activity-item"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.48 + i * 0.06 }}
            >
              <div className="activity-icon" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                <Icon size={14} style={{ color: style.color }} />
              </div>
              <div className="activity-content">
                <p className="activity-title">{item.title}</p>
                <p className="activity-desc">{item.desc}</p>
              </div>
              <span className="activity-time">{item.time}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Pending Invoices
───────────────────────────────────────── */
function PendingInvoices({ invoices, currency }) {
  const pendingInvoices = useMemo(() => (invoices || []).filter((inv) => {
    const status = inv.status || (inv.paidDate ? 'Paid' : 'Pending');
    return status === 'Pending' || status === 'Raised' || status === 'Overdue';
  }).slice(0, 5), [invoices]);

  return (
    <motion.div
      className="chart-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.48 }}
    >
      <div className="chart-card-header">
        <div>
          <h3 className="chart-card-title">Pending Invoices</h3>
          <p className="chart-card-sub">{pendingInvoices.length} awaiting payment</p>
        </div>
        <button className="chart-action-link">Manage Billing</button>
      </div>
      <div className="invoice-list">
        {pendingInvoices.length === 0 && (
          <div className="activity-empty">
            <CheckCircle2 size={22} style={{ color: '#10B981' }} />
            <p>No pending invoices</p>
          </div>
        )}
        {pendingInvoices.map((inv, idx) => {
          const amount = inv.amount || inv.dealValue || 0;
          const status = inv.status || (inv.paidDate ? 'Paid' : 'Pending');
          const isOverdue = status === 'Overdue';
          const client = inv.clientName || inv.projectName || 'Unknown Client';
          const initials = client.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
          const dueDate = inv.invoiceDate
            ? new Date(inv.invoiceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'N/A';

          return (
            <div key={inv.id || `${client}-${idx}`} className="invoice-row">
              <div className="invoice-client">
                <div className={`invoice-avatar ${isOverdue ? 'overdue' : ''}`}>{initials}</div>
                <div>
                  <p className="invoice-name">{client}</p>
                  <p className="invoice-date">{dueDate}</p>
                </div>
              </div>
              <div className="invoice-amount">
                {formatGlobalCurrency(amount, inv.currency || currency, { maximumFractionDigits: 0 })}
              </div>
              {isOverdue
                ? <span className="invoice-status overdue">Overdue</span>
                : <button className="invoice-remind-btn">Remind</button>}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Quick Stats
───────────────────────────────────────── */
function QuickStats({ contacts, tasks, timesheetEntries }) {
  const completedTasks = (tasks || []).filter((t) => (t.values?.status || t.status) === 'Completed').length;
  const totalTasks = (tasks || []).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalHours = (timesheetEntries || []).reduce((s, e) => s + (Number(e.hours) || Number(e.duration) || 0), 0);

  const stats = [
    { label: 'Total Contacts', value: contacts.length, icon: Users, color: '#4361EE' },
    { label: 'Hours Tracked', value: `${Math.round(totalHours)}h`, icon: Clock, color: '#F59E0B' },
    { label: 'Task Completion', value: `${completionRate}%`, icon: CheckCircle2, color: '#10B981' },
    { label: 'Pending Tasks', value: totalTasks - completedTasks, icon: Activity, color: '#F43F5E' },
  ];

  return (
    <motion.div
      className="chart-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.54 }}
    >
      <div className="chart-card-header">
        <div>
          <h3 className="chart-card-title">Performance Snapshot</h3>
          <p className="chart-card-sub">Team activity at a glance</p>
        </div>
      </div>
      <div className="quick-stats-grid">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className="quick-stat-item"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.06 }}
            >
              <div className="qs-icon" style={{ background: `${stat.color}14` }}>
                <Icon size={16} style={{ color: stat.color }} />
              </div>
              <div className="qs-value" style={{ color: stat.color }}>{stat.value}</div>
              <div className="qs-label">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Main Analytics Component
───────────────────────────────────────── */
export default function DashboardAnalytics() {
  const [projects, setProjects] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [timesheetEntries, setTimesheetEntries] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const toArray = (data) => (Array.isArray(data) ? data : (data?.items ?? data?.tasks ?? []));

    const fetchData = async () => {
      try {
        setLoading(true);
        const [projRes, contRes, timeRes, expRes, incRes, taskRes, alertRes] = await Promise.all([
          projectService.getAll(1, 100).catch(() => []),
          contactService.getContacts(1, 100).catch(() => []),
          timesheetService.getEntries(1, 100).catch(() => []),
          expenseService.getExpenses(1, 1000).catch(() => []),
          incomeService.getIncomes(1, 1000).catch(() => []),
          taskService.getAll().catch(() => []),
          notificationService.getAlerts().catch(() => [])
        ]);

        setProjects(toArray(projRes));
        setContacts(toArray(contRes));
        setTimesheetEntries(toArray(timeRes));
        setExpenses(toArray(expRes));
        setIncomes(toArray(incRes));
        setTasks(toArray(taskRes));
        setAlerts(alertRes || []);
      } catch (e) {
        console.error('Error fetching analytics data', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const pendingTasks = useMemo(() =>
    tasks.filter((t) => (t.values?.status || t.status || '') !== 'Completed')
      .sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 5),
  [tasks]);

  if (loading) return null;

  return (
    <div className="dash-content pt-0">
      <RevenueChart data={monthlyData} />
      <div className="dash-two-col">
        <PipelineChart projects={projects} />
        <DealPieChart projects={projects} />
      </div>
      <div className="dash-two-col">
        <SalesFunnelChart projects={projects} />
        <IntelligenceFeed alerts={alerts} tasks={pendingTasks} />
      </div>
      <div className="dash-two-col">
        <PendingInvoices invoices={recentInvoices} currency="INR" />
        <QuickStats contacts={contacts} tasks={tasks} timesheetEntries={timesheetEntries} />
      </div>
    </div>
  );
}
