import React, { useState, useEffect } from 'react';
import { FaFilePdf } from 'react-icons/fa6';
import { PiMicrosoftExcelLogoFill } from 'react-icons/pi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
    Eye, Filter, DollarSign, Building, Users, Wallet, Plus, Trash2
} from 'lucide-react';
import { generateDashboardPDF, exportDashboardExcel } from '../utils/reportGenerators';

const FX_CACHE_KEY = 'fx_rates_cache';
const FX_TIMESTAMP_KEY = 'fx_rates_timestamp';
const FX_TTL_MS = 60 * 60 * 1000; // 1 hour

const ChartTooltip = ({ active, payload, label, currency }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'rgba(15,23,42,0.9)', border: 'none', borderRadius: 10, padding: '10px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#E2E8F0', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                    {currency} {Number(p.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
            ))}
        </div>
    );
};

export default function DealDashboard({ projects, onOpenProject, onCreateProject, onStatusChange, onDeleteProject }) {
    const [filter, setFilter] = useState('All');
    const [chartMetric, setChartMetric] = useState('Revenue');
    const [dashboardCurrency, setDashboardCurrency] = useState('AED');
    const [exchangeRates, setExchangeRates] = useState({ AED: 1, USD: 0.2722, INR: 22.6 });

    // Bug Fix #2: cache exchange rates in localStorage for 1 hour
    useEffect(() => {
        const cached = localStorage.getItem(FX_CACHE_KEY);
        const timestamp = parseInt(localStorage.getItem(FX_TIMESTAMP_KEY) || '0', 10);
        if (cached && Date.now() - timestamp < FX_TTL_MS) {
            setExchangeRates(JSON.parse(cached));
            return;
        }
        fetch('https://api.exchangerate-api.com/v4/latest/AED')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.rates) {
                    const rates = { AED: 1, ...data.rates };
                    setExchangeRates(rates);
                    localStorage.setItem(FX_CACHE_KEY, JSON.stringify(rates));
                    localStorage.setItem(FX_TIMESTAMP_KEY, String(Date.now()));
                }
            })
            .catch(() => { /* use fallback rates */ });
    }, []);

    const convertCurrency = (amount, from, to) => {
        if (!amount || from === to) return amount || 0;
        const inAED = from === 'AED' ? amount : amount / (exchangeRates[from] || 1);
        return to === 'AED' ? inAED : inAED * (exchangeRates[to] || 1);
    };

    const filteredProjects = projects.filter(p => {
        if (filter === 'All') return true;
        const pDate = new Date(p.dateCreated);
        const now = new Date();
        if (filter === 'Yearly')  return pDate.getFullYear() === now.getFullYear();
        if (filter === 'Monthly') return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
        if (filter === 'Weekly')  { const d = new Date(now); d.setDate(now.getDate() - 7); return pDate >= d && pDate <= now; }
        return true;
    });

    const fmt = (n) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });

    const totalRevenue   = filteredProjects.reduce((s, p) => s + convertCurrency(parseFloat(p.dealValue) || 0, p.currency, dashboardCurrency), 0);
    const activeProjects = filteredProjects.filter(p => !p.isArchived).length;
    const totalSplits    = filteredProjects.reduce((s, p) => s + convertCurrency(p.stakeholders.reduce((ss, sh) => ss + ((parseFloat(p.dealValue)||0) * sh.percentage)/100, 0), p.currency, dashboardCurrency), 0);
    const totalCollected = filteredProjects.reduce((s, p) => s + convertCurrency(p.milestones.reduce((ms, m) => m.status === 'Paid' ? ms + ((p.dealValue * m.percentage)/100) : ms, 0), p.currency, dashboardCurrency), 0);
    const totalTax       = filteredProjects.reduce((s, p) => {
        const tRate = (p.charges||[]).reduce((cs, c) => cs + (parseFloat(c.percentage)||0), 0);
        return s + convertCurrency((parseFloat(p.dealValue)||0) * tRate / 100, p.currency, dashboardCurrency);
    }, 0);

    const chartData = filteredProjects.map(p => {
        const dVal = convertCurrency(parseFloat(p.dealValue) || 0, p.currency, dashboardCurrency);
        const tRate = (p.charges||[]).reduce((s,c) => s + (parseFloat(c.percentage)||0), 0);
        let val = 0;
        if (chartMetric === 'Revenue')   val = dVal;
        if (chartMetric === 'Splits')    val = p.stakeholders.reduce((s,sh) => s + (dVal * sh.percentage)/100, 0);
        if (chartMetric === 'Collected') val = p.milestones.reduce((s,m) => m.status === 'Paid' ? s + (dVal * m.percentage)/100 : s, 0);
        if (chartMetric === 'Tax')       val = (dVal * tRate) / 100;
        return { name: p.projectId, value: val };
    });

    const statusData = [
        { name: 'Active',    value: activeProjects },
        { name: 'Completed', value: filteredProjects.length - activeProjects }
    ];
    const PIE_COLORS = ['#4361EE', '#10B981', '#F59E0B', '#F43F5E'];

    return (
        <div className="inv-content">
            {/* Header */}
            <div className="inv-dash-header">
                <div>
                    <h2 className="inv-dash-title">Deal Finance Tracker</h2>
                    <p className="inv-dash-subtitle">Overview of all financial projects and invoicing</p>
                </div>
                <div className="inv-dash-actions">
                    <div className="inv-filter-select">
                        <Filter size={13} style={{ color: '#94A3B8', flexShrink: 0 }} />
                        <select value={filter} onChange={e => setFilter(e.target.value)}>
                            <option value="All">All Time</option>
                            <option value="Yearly">This Year</option>
                            <option value="Monthly">This Month</option>
                            <option value="Weekly">This Week</option>
                        </select>
                    </div>
                    <div className="inv-filter-select">
                        <select value={dashboardCurrency} onChange={e => setDashboardCurrency(e.target.value)}>
                            <option value="AED">AED</option>
                            <option value="USD">USD</option>
                            <option value="INR">INR</option>
                        </select>
                    </div>
                    <button className="inv-btn-primary" onClick={onCreateProject}>
                        <Plus size={14} /> New Project
                    </button>
                    <button className="inv-btn-success" onClick={() => exportDashboardExcel(filteredProjects, filter)}>
                        <PiMicrosoftExcelLogoFill size={15} /> Export
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="inv-kpi-grid">
                {[
                    { label: 'Total Revenue',   value: `${dashboardCurrency} ${fmt(totalRevenue)}`,   icon: <DollarSign size={16} />, accent: '#4361EE', iconBg: 'rgba(67,97,238,0.1)',   iconColor: '#4361EE',  kpiBg: 'rgba(67,97,238,0.08)' },
                    { label: 'Project Tax',     value: `${dashboardCurrency} ${fmt(totalTax)}`,       icon: <Building size={16} />,   accent: '#F59E0B', iconBg: 'rgba(245,158,11,0.1)', iconColor: '#D97706',  kpiBg: 'rgba(245,158,11,0.08)' },
                    { label: 'Total Splits',    value: `${dashboardCurrency} ${fmt(totalSplits)}`,    icon: <Users size={16} />,      accent: '#F43F5E', iconBg: 'rgba(244,63,94,0.1)',  iconColor: '#E11D48',  kpiBg: 'rgba(244,63,94,0.08)' },
                    { label: 'Total Collected', value: `${dashboardCurrency} ${fmt(totalCollected)}`, icon: <Wallet size={16} />,     accent: '#10B981', iconBg: 'rgba(16,185,129,0.1)', iconColor: '#059669',  kpiBg: 'rgba(16,185,129,0.08)' },
                ].map((k, i) => (
                    <div key={i} className="inv-kpi-card" style={{ '--kpi-accent': k.accent, '--kpi-bg': k.kpiBg }}>
                        <div className="inv-kpi-top">
                            <div>
                                <div className="inv-kpi-label">{k.label}</div>
                                <div className="inv-kpi-value">{k.value}</div>
                            </div>
                            <div className="inv-kpi-icon" style={{ background: k.iconBg }}>
                                {React.cloneElement(k.icon, { style: { color: k.iconColor } })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="inv-charts-row">
                <div className="inv-chart-card">
                    <div className="inv-chart-header">
                        <div className="inv-chart-title">{chartMetric} by Project</div>
                        <select
                            className="inv-table-select"
                            style={{ width: 'auto', minWidth: 140 }}
                            value={chartMetric}
                            onChange={e => setChartMetric(e.target.value)}
                        >
                            <option value="Revenue">Deal Value</option>
                            <option value="Tax">Tax</option>
                            <option value="Splits">Splits</option>
                            <option value="Collected">Collected</option>
                        </select>
                    </div>
                    <div className="inv-chart-body" style={{ height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} barSize={28}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#EDF2FB" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'DM Sans' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ChartTooltip currency={dashboardCurrency} />} />
                                <Bar dataKey="value" fill="#4361EE" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="inv-chart-card">
                    <div className="inv-chart-header">
                        <div className="inv-chart-title">Status Distribution</div>
                        <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>{filteredProjects.length} projects</span>
                    </div>
                    <div className="inv-chart-body" style={{ height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={4} dataKey="value">
                                    {statusData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip content={({ active, payload }) => active && payload?.length ? (
                                    <div style={{ background: 'rgba(15,23,42,0.9)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#E2E8F0', fontFamily: 'DM Sans' }}>
                                        <span style={{ fontWeight: 700 }}>{payload[0].name}:</span> {payload[0].value}
                                    </div>
                                ) : null} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Project Table */}
            <div className="inv-table-card">
                <div className="inv-table-header">
                    <div className="inv-table-title">All Projects</div>
                    <button className="inv-btn-danger" style={{ height: 30 }} onClick={() => generateDashboardPDF(filteredProjects, filter)}>
                        <FaFilePdf size={13} /> PDF
                    </button>
                </div>
                <div className="inv-table-wrap">
                    <table className="inv-table">
                        <thead>
                            <tr>
                                <th>Project ID</th>
                                <th>Client</th>
                                <th style={{ textAlign: 'right' }}>Deal Value</th>
                                <th style={{ textAlign: 'right' }}>Tax</th>
                                <th style={{ textAlign: 'right' }}>Collected</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProjects.map(project => {
                                const collected = project.milestones.reduce((s, m) => m.status === 'Paid' ? s + ((project.dealValue * m.percentage)/100) : s, 0);
                                const tRate = (project.charges||[]).reduce((s, c) => s + (parseFloat(c.percentage)||0), 0);
                                const tax = (parseFloat(project.dealValue)||0) * tRate / 100;
                                return (
                                    <tr key={project.id} onClick={() => onOpenProject(project.id)}>
                                        <td>
                                            <div className="inv-cell-primary">{project.projectId}</div>
                                            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{project.type || 'Product'}</div>
                                        </td>
                                        <td style={{ color: '#475569', fontWeight: 500 }}>{project.clientName}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span className="inv-cell-mono">{project.currency} {parseFloat(project.dealValue).toLocaleString()}</span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#D97706', fontFamily: 'Consolas, monospace' }}>
                                                {project.currency} {tax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#059669', fontFamily: 'Consolas, monospace' }}>
                                                {project.currency} {collected.toLocaleString()}
                                            </span>
                                        </td>
                                        <td>
                                            <select
                                                className="inv-table-select"
                                                style={{ width: 'auto', minWidth: 110 }}
                                                value={project.status || 'Active'}
                                                onClick={e => e.stopPropagation()}
                                                onChange={e => { e.stopPropagation(); onStatusChange(project.id, e.target.value); }}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Completed">Completed</option>
                                                <option value="On Hold">Hold</option>
                                                <option value="Archived">Archived</option>
                                            </select>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                                <button className="inv-btn-icon blue" onClick={e => { e.stopPropagation(); onOpenProject(project.id); }} title="View Project">
                                                    <Eye size={14} />
                                                </button>
                                                <button className="inv-btn-icon" onClick={e => { e.stopPropagation(); onDeleteProject(project.id); }} title="Delete Project">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredProjects.length === 0 && (
                                <tr><td colSpan="7">
                                    <div className="inv-empty">No projects found. Create one to get started.</div>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
