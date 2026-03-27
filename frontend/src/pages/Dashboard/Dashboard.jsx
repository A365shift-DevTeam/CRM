import React, { useEffect, useState, useMemo } from 'react';
import { projectService } from '../../services/api';
import { contactService } from '../../services/contactService';
import { timesheetService } from '../../services/timesheetService';
import { expenseService } from '../../services/expenseService';
import { incomeService } from '../../services/incomeService';
import { useAuth } from '../../context/AuthContext';
import {
  FaBriefcase, FaUserGroup, FaClock, FaChartLine,
  FaCircle, FaCalendarDay, FaFire, FaBolt,
  FaMoneyBillWave, FaFileInvoiceDollar, FaDollarSign, FaFileInvoice
} from 'react-icons/fa6';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { formatGlobalCurrency } from '../../utils/currencyUtils';
import './Dashboard.css';

// Clean SaaS Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '12px 16px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        fontFamily: "'Inter', sans-serif"
      }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#0f172a', fontSize: '0.9rem' }}>{label}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color }} />
            <span style={{ color: '#475569', fontSize: '0.8125rem', fontWeight: '500' }}>{entry.name}:</span>
            <span style={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: '600' }}>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { currentUser } = useAuth();

  // Data states
  const [projects, setProjects] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [timesheetEntries, setTimesheetEntries] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);

  // Loading states
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingTimesheet, setLoadingTimesheet] = useState(true);
  const [loadingFinance, setLoadingFinance] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchProjects();
      fetchContacts();
      fetchTimesheet();
      fetchFinance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const data = await projectService.getAll();
      setProjects(data || []);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);
      const data = await contactService.getContacts();
      setContacts(data || []);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchTimesheet = async () => {
    try {
      setLoadingTimesheet(true);
      const data = await timesheetService.getEntries();
      setTimesheetEntries(data || []);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoadingTimesheet(false);
    }
  };

  const fetchFinance = async () => {
    try {
      setLoadingFinance(true);
      const [expData, incData] = await Promise.all([
        expenseService.getExpenses(),
        incomeService.getIncomes()
      ]);
      setExpenses(expData || []);
      setIncomes(incData || []);
    } catch (err) {
      console.error('Dashboard finance error:', err);
    } finally {
      setLoadingFinance(false);
    }
  };

  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status !== 'Closed' && p.status !== 'Lost').length;
    const wonProjects = projects.filter(p => p.status === 'Won' || p.activeStage === 4).length;

    const totalContacts = contacts.length;
    const leads = contacts.filter(c => c.status === 'Lead').length;
    const customers = contacts.filter(c => c.status === 'Customer').length;
    const activeContacts = contacts.filter(c => c.status === 'Active').length;

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    let totalMinutesWeek = 0;
    let totalMinutesAll = 0;
    timesheetEntries.forEach(entry => {
      if (!entry.endTime) return;
      const entryDate = entry.startTime?.toDate ? entry.startTime.toDate() : new Date(entry.startTime);
      const endDate = entry.endTime?.toDate ? entry.endTime.toDate() : new Date(entry.endTime);
      const mins = Math.max(0, Math.floor((endDate - entryDate) / 60000));
      totalMinutesAll += mins;
      if (entryDate >= startOfWeek) totalMinutesWeek += mins;
    });

    const hoursThisWeek = Math.floor(totalMinutesWeek / 60);
    const totalHoursAll = Math.floor(totalMinutesAll / 60);

    const activeProjectProgress = totalProjects > 0 ? Math.round((activeProjects / totalProjects) * 100) : 0;
    const wonProjectProgress = totalProjects > 0 ? Math.round((wonProjects / totalProjects) * 100) : 0;
    const leadsProgress = totalContacts > 0 ? Math.round((leads / totalContacts) * 100) : 0;
    const hoursProgress = totalHoursAll > 0 ? Math.round((hoursThisWeek / totalHoursAll) * 100) : 0;

    return {
      totalProjects, activeProjects, wonProjects,
      totalContacts, leads, customers, activeContacts,
      hoursThisWeek,
      minutesRemainder: totalMinutesWeek % 60,
      totalHoursAll,
      totalSessions: timesheetEntries.length,
      progress: {
        activeProjects: activeProjectProgress,
        wonProjects: wonProjectProgress,
        leads: leadsProgress,
        hours: hoursProgress
      }
    };
  }, [projects, contacts, timesheetEntries]);

  // Calculate Finance Summary
  const financeStats = useMemo(() => {
    const totalExpense = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    const totalIncome = incomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
    const netProfit = totalIncome - totalExpense;

    // Profit margin percentage
    const profitMargin = totalIncome > 0 ? parseFloat(((netProfit / totalIncome) * 100).toFixed(1)) : 0;
    const expenseRatio = totalIncome > 0 ? parseFloat(((totalExpense / totalIncome) * 100).toFixed(1)) : 0;

    return { totalExpense, totalIncome, netProfit, profitMargin, expenseRatio };
  }, [expenses, incomes]);

  // Extract Recent Invoices (Milestones) from Projects
  const recentInvoices = useMemo(() => {
    let allMilestones = [];
    projects.forEach(project => {
      if (project.milestones && Array.isArray(project.milestones)) {
        project.milestones.forEach(m => {
          allMilestones.push({
            ...m,
            projectName: project.title || project.name || 'Untitled Project',
            projectId: project.id,
            clientName: project.clientName || 'Unknown Client',
            currency: project.currency || 'INR',
            dealValue: project.dealValue || 0
          });
        });
      }
    });

    // Sort by date descending
    return allMilestones.sort((a, b) => {
      const dateA = a.invoiceDate ? new Date(a.invoiceDate) : new Date(0);
      const dateB = b.invoiceDate ? new Date(b.invoiceDate) : new Date(0);
      return dateB - dateA;
    }).slice(0, 5);
  }, [projects]);

  const recentContacts = useMemo(() => {
    return [...contacts]
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [contacts]);

  const pipelineSummary = useMemo(() => {
    const defaultStages = [
      { label: 'Demo', color: '#06b6d4' },
      { label: 'Proposal', color: '#f59e0b' },
      { label: 'Negotiation', color: '#f97316' },
      { label: 'Approval', color: '#8b5cf6' },
      { label: 'Won', color: '#10b981' },
      { label: 'Closed', color: '#10b981' },
      { label: 'Lost', color: '#ef4444' }
    ];
    const stageMap = {};
    let totalPipelineValue = 0;
    projects.forEach(p => {
      const stageIndex = p.activeStage ?? 0;
      const stageLabel = defaultStages[stageIndex]?.label || p.status || 'Unknown';
      if (!stageMap[stageLabel]) stageMap[stageLabel] = { count: 0, value: 0, color: defaultStages[stageIndex]?.color || '#94a3b8' };
      stageMap[stageLabel].count += 1;
      // Amount is stored in history entries from stage transitions, or as dealValue/amount on the project
      let dv = parseFloat(p.dealValue || p.amount || 0);
      if (dv === 0 && p.history && p.history.length > 0) {
        // Get the latest non-zero amount from history
        for (const h of p.history) {
          const histAmt = parseFloat(h.amount || 0);
          if (histAmt > 0) { dv = histAmt; break; }
        }
      }
      stageMap[stageLabel].value += dv;
      totalPipelineValue += dv;
    });
    const entries = Object.entries(stageMap).map(([name, data]) => ({
      name, count: data.count, value: data.value, color: data.color
    }));
    return { stages: entries, totalPipelineValue };
  }, [projects]);

  const chartData = useMemo(() => {
    return [
      { category: 'Projects', Active: stats.activeProjects, Won: stats.wonProjects, Total: stats.totalProjects },
      { category: 'Contacts', Leads: stats.leads, Customers: stats.customers, Active: stats.activeContacts },
      { category: 'Activity', 'Hours (w)': stats.hoursThisWeek, Sessions: stats.totalSessions }
    ];
  }, [stats]);

  const isLoading = loadingProjects || loadingContacts || loadingTimesheet || loadingFinance;

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // SaaS avatar solid colors
  const getAvatarColor = (name) => {
    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f43f5e', '#06b6d4', '#f59e0b'];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Overview<span className="accent-dot">.</span>
          </h1>
          <p className="dashboard-subtitle">Here&apos;s what&apos;s happening in your workspace</p>
        </div>
        <div className="header-date">
          <FaCalendarDay />
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      <div className="stats-row">
        <StatCard icon={<FaBriefcase />} label="Active Deals" value={stats.activeProjects} subtitle={`${stats.totalProjects} total`} color="blue" loading={loadingProjects} progress={stats.progress?.activeProjects} progressLabel="of total" />
        <StatCard icon={<FaUserGroup />} label="Total Contacts" value={stats.totalContacts} subtitle={`${stats.activeContacts} Active · ${stats.leads} Leads · ${stats.customers} Customers · ${contacts.filter(c => c.status === 'Inactive').length} Inactive`} color="purple" loading={loadingContacts} progress={stats.progress?.leads} progressLabel="leads" />
        <StatCard icon={<FaClock />} label="Hours This Week" value={`${stats.hoursThisWeek}h ${stats.minutesRemainder}m`} subtitle={`${stats.totalHoursAll}h logged`} color="cyan" loading={loadingTimesheet} progress={stats.progress?.hours} progressLabel="of week" />
        <StatCard icon={<FaFire />} label="Won Deals" value={stats.wonProjects} subtitle={`of ${stats.totalProjects} total`} color="green" loading={loadingProjects} progress={stats.progress?.wonProjects} progressLabel="win rate" />
      </div>

      <div className="stats-row" style={{ marginTop: '1.5rem' }}>
        <StatCard icon={<FaMoneyBillWave />} label="Total Income" value={formatGlobalCurrency(financeStats.totalIncome, 'INR', { maximumFractionDigits: 0 })} color="green" loading={loadingFinance} progress={100} progressLabel="income" progressType="positive" />
        <StatCard icon={<FaFileInvoiceDollar />} label="Total Expenses" value={formatGlobalCurrency(financeStats.totalExpense, 'INR', { maximumFractionDigits: 0 })} color="red" loading={loadingFinance} progress={financeStats.expenseRatio} progressLabel="of income" progressType="negative" />
        <StatCard icon={<FaDollarSign />} label="Net Profit" value={formatGlobalCurrency(financeStats.netProfit, 'INR', { maximumFractionDigits: 0 })} color={financeStats.netProfit >= 0 ? 'green' : 'red'} loading={loadingFinance} progress={financeStats.profitMargin} progressLabel="margin" progressType="positive" />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card chart-card-full">
          <div className="card-header">
            <h3><FaChartLine className="card-header-icon" /> Activity Metrics</h3>
            <div className="chart-legend-custom">
              <span className="legend-item"><span className="dot blue" style={{ background: '#3b82f6' }}></span> Projects</span>
              <span className="legend-item"><span className="dot green" style={{ background: '#10b981' }}></span> Contacts</span>
              <span className="legend-item"><span className="dot purple" style={{ background: '#8b5cf6' }}></span> Performance</span>
            </div>
          </div>
          <div className="card-body-content chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                {/* Clean SaaS Solid Colors instead of Gradients */}
                <Bar dataKey="Active" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="Won" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="Leads" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="Customers" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="Hours (w)" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>



        <div className="dashboard-card">
          <div className="card-header">
            <h3><FaChartLine className="card-header-icon" /> Sales Pipeline</h3>
            <span className="badge-count">{projects.length} deals</span>
          </div>
          <div className="card-body-content">
            {loadingProjects ? (
              <div className="card-loading"><div className="loading-spinner small" /></div>
            ) : pipelineSummary.stages.length === 0 ? (
              <div className="empty-state"><FaBriefcase className="empty-icon" /><p>No deals in pipeline</p></div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>
                    {formatGlobalCurrency(pipelineSummary.totalPipelineValue, 'INR', { maximumFractionDigits: 0 })}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>total pipeline</span>
                </div>
                <div className="pipeline-list">
                  {pipelineSummary.stages.map(stage => (
                    <div key={stage.name} className="pipeline-row">
                      <div className="pipeline-info">
                        <FaCircle className="pipeline-dot" style={{ color: stage.color }} />
                        <span className="pipeline-name">{stage.name}</span>
                      </div>
                      <div className="pipeline-bar-wrapper">
                        <div className="pipeline-bar" style={{ width: `${Math.min(100, (stage.count / Math.max(projects.length, 1)) * 100)}%`, background: stage.color }} />
                      </div>
                      <div style={{ textAlign: 'right', minWidth: '90px' }}>
                        <span className="pipeline-count">{stage.count}</span>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {formatGlobalCurrency(stage.value, 'INR', { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>


        <div className="dashboard-card">
          <div className="card-header">
            <h3><FaBriefcase className="card-header-icon" /> Recent Deals</h3>
          </div>
          <div className="card-body-content">
            {loadingProjects ? (
              <div className="card-loading"><div className="loading-spinner small" /></div>
            ) : projects.length === 0 ? (
              <div className="empty-state"><FaBriefcase className="empty-icon" /><p>No deals yet</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[...projects].slice(0, 5).map((p, i) => {
                  const defaultStages = [
                    { label: 'Demo', color: '#06b6d4' },
                    { label: 'Proposal', color: '#f59e0b' },
                    { label: 'Negotiation', color: '#f97316' },
                    { label: 'Approval', color: '#8b5cf6' },
                    { label: 'Won', color: '#10b981' },
                    { label: 'Closed', color: '#10b981' },
                    { label: 'Lost', color: '#ef4444' }
                  ];
                  const stageInfo = defaultStages[p.activeStage ?? 0] || { label: 'Unknown', color: '#94a3b8' };
                  let dv = parseFloat(p.dealValue || p.amount || 0);
                  if (dv === 0 && p.history && p.history.length > 0) {
                    for (const h of p.history) {
                      const histAmt = parseFloat(h.amount || 0);
                      if (histAmt > 0) { dv = histAmt; break; }
                    }
                  }
                  return (
                    <div key={p.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.clientName || 'Unknown Client'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          {p.customId || p.brandingName || 'No ID'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', minWidth: '80px' }}>
                        <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '600', background: `${stageInfo.color}18`, color: stageInfo.color }}>
                          {stageInfo.label}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: '90px' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem', color: '#0f172a' }}>
                          {dv > 0 ? formatGlobalCurrency(dv, p.currency || 'INR', { maximumFractionDigits: 0 }) : '—'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{p.type || 'Service'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtitle, color, loading, progress, progressLabel, progressType }) {
  // Determine pill style based on explicit type, or infer from progress value
  let pillClass = "neutral";
  let displayProgress = progress;
  if (progressType === 'positive') pillClass = "positive";
  else if (progressType === 'negative') pillClass = "negative";
  else if (progress !== undefined) {
    pillClass = progress > 50 ? "positive" : (progress > 20 ? "neutral" : "negative");
  }

  return (
    <div className={`stat-card-dash stat-${color}`}>
      {loading ? (
        <div className="stat-loading"><div className="loading-spinner small" /></div>
      ) : (
        <>
          <div className="stat-header-flex">
            <div className="stat-icon-dash">{icon}</div>
            {progress !== undefined && (
              <div className={`stat-progress-pill ${pillClass}`}>
                {displayProgress}% {progressLabel}
              </div>
            )}
          </div>
          <div className="stat-value-dash">{value}</div>
          <div className="stat-label-dash">{label}</div>
          {subtitle && <div className="stat-subtitle-dash">{subtitle}</div>}
        </>
      )}
    </div>
  );
}

function BreakdownItem({ label, value, color }) {
  return (
    <div className="breakdown-item">
      <div className="breakdown-dot" style={{ background: color }} />
      <div className="breakdown-value" style={{ color: 'var(--text-main)' }}>{value}</div>
      <div className="breakdown-label">{label}</div>
    </div>
  );
}
