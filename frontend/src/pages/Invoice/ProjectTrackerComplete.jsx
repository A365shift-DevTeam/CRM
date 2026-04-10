import React, { useState, useEffect, useRef } from 'react';
import { FaFilePdf } from "react-icons/fa6";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";
import { useLocation, useSearchParams } from 'react-router-dom';
import {
    Eye, LayoutDashboard, FileDown, Briefcase, CreditCard, Building, Users,
    Plus, Trash2, ArrowLeft, DollarSign, FileText, Filter, Wallet, X, Save
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { projectService } from '../../services/api';
import { projectFinanceService } from '../../services/projectFinanceService';
import { contactService } from '../../services/contactService';
import { incomeService } from '../../services/incomeService';
import { expenseService } from '../../services/expenseService';
import { addPDFHeader, generateInvoicePDF, generateTaxInvoicePDF, generateInvestorPaymentPDF, generatePaymentInvoicePDF } from '../../utils/pdfGenerator';
import { numberToWords } from '../../utils/currencyUtils';
import { useToast } from '../../components/Toast/ToastContext';
import './Invoice.css';

// ==========================================
// 1. PDF & EXCEL UTILITIES
// ==========================================

const generateProjectReportPDF = (details, stakeholders, milestones, taxes) => {
    const doc = new jsPDF();
    const currency = details.currency || 'AED';
    const totalDistributed = stakeholders.reduce((sum, s) => sum + (details.dealValue * s.percentage) / 100, 0);
    const netProfit = details.dealValue - totalDistributed;
    const chargesList = Array.isArray(taxes) ? taxes : (taxes.gst ? [{ name: 'GST', percentage: taxes.gst }] : []);

    const totalChargesString = chargesList.map(c => {
        if (c.taxType === 'Intra-State (CGST + SGST)') return `CGST ${(c.percentage / 2)}% + SGST ${(c.percentage / 2)}%`;
        return `${c.name || c.taxType}: ${c.percentage}%`;
    }).join(', ');

    addPDFHeader(doc, "PROJECT FINANCIAL REPORT", details);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 85);
    doc.text(`Project ID: ${details.projectId}`, 14, 90);
    doc.setFontSize(14); doc.setTextColor(0); doc.text("Executive Summary", 14, 105);

    const summaryData = [
        ["Deal Value", `${currency} ${details.dealValue.toLocaleString()}`],
        ["Total Distributed", `${currency} ${totalDistributed.toLocaleString()}`],
        ["Net Profit (Projected)", `${currency} ${netProfit.toLocaleString()}`],
        ["Tax Configuration", totalChargesString || "None"]
    ];

    autoTable(doc, { startY: 110, body: summaryData, theme: 'plain', styles: { fontSize: 11, cellPadding: 2 }, columnStyles: { 0: { fontStyle: 'bold', width: 80 } } });

    let finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14); doc.text("Stakeholder Distribution", 14, finalY);
    const stakeholderBody = stakeholders.map(s => [s.name, `${s.percentage}%`, `${currency} ${(details.dealValue * s.percentage / 100).toLocaleString()}`]);
    autoTable(doc, { startY: finalY + 5, head: [['Name / Role', 'Share %', 'Amount']], body: stakeholderBody, theme: 'striped', headStyles: { fillColor: [67, 97, 238] } });

    finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14); doc.text("Invoicing Schedule", 14, finalY);
    const totalTaxRate = chargesList.reduce((sum, c) => sum + (parseFloat(c.percentage) || 0), 0);
    const invoiceBody = milestones.map(m => {
        const base = (details.dealValue * m.percentage) / 100;
        const tax = (base * totalTaxRate) / 100;
        return [m.name, `${m.percentage}%`, m.status, `${currency} ${base.toLocaleString()}`, `${currency} ${tax.toLocaleString()}`, `${currency} ${(base + tax).toLocaleString()}`];
    });
    autoTable(doc, { startY: finalY + 5, head: [['Milestone', '%', 'Status', 'Base', 'Tax', 'Total']], body: invoiceBody, theme: 'grid', headStyles: { fillColor: [16, 185, 129] }, styles: { fontSize: 9 } });

    const footerY = doc.internal.pageSize.height - 30;
    doc.setFontSize(10);
    doc.text("For AMBOT365 RPA & IT SOLUTIONS", 195, footerY, { align: 'right' });
    doc.text("(Authorized Signatory)", 195, footerY + 20, { align: 'right' });
    doc.save(`${details.projectId}_Full_Report.pdf`);
};

const generateDashboardPDF = (projects, filter) => {
    const doc = new jsPDF();
    const totalRevenue = projects.reduce((sum, p) => sum + (parseFloat(p.dealValue) || 0), 0);
    const activeProjects = projects.filter(p => !p.isArchived).length;
    const totalCollected = projects.reduce((sum, p) => sum + p.milestones.reduce((mSum, m) => m.status === 'Paid' ? mSum + ((p.dealValue * m.percentage) / 100) : mSum, 0), 0);
    const currency = projects.length > 0 ? projects[0].currency : 'AED';

    doc.setFontSize(24); doc.setTextColor(40); doc.text("EXECUTIVE DASHBOARD", 14, 22);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Filter View: ${filter}`, 14, 35);
    doc.setDrawColor(200); doc.setFillColor(245, 245, 245); doc.rect(14, 45, 182, 30, 'F');
    doc.setFontSize(12); doc.setTextColor(0);
    doc.text("Total Revenue", 30, 55); doc.text("Active Projects", 90, 55); doc.text("Total Collected", 150, 55);
    doc.setFontSize(16); doc.setFont(undefined, 'bold');
    doc.text(`${currency} ${totalRevenue.toLocaleString()}`, 30, 65); doc.text(`${activeProjects}`, 90, 65); doc.text(`${currency} ${totalCollected.toLocaleString()}`, 150, 65);
    doc.setFontSize(14); doc.setFont(undefined, 'normal'); doc.text("Project Performance Details", 14, 90);
    const tableBody = projects.map(p => {
        const collected = p.milestones.reduce((mSum, m) => m.status === 'Paid' ? mSum + ((p.dealValue * m.percentage) / 100) : mSum, 0);
        return [p.projectId, p.clientName, `${p.currency} ${p.dealValue.toLocaleString()}`, `${p.currency} ${collected.toLocaleString()}`, p.isArchived ? "Archived" : "Active"];
    });
    autoTable(doc, { startY: 95, head: [['ID', 'Client', 'Value', 'Collected', 'Status']], body: tableBody, theme: 'striped', headStyles: { fillColor: [67, 97, 238] } });
    doc.save(`Dashboard_Report_${filter}.pdf`);
};

const exportProjectReport = (details, stakeholders, milestones, taxes) => {
    const wb = XLSX.utils.book_new();
    const currency = details.currency;
    const totalDistributed = stakeholders.reduce((sum, s) => sum + (details.dealValue * s.percentage) / 100, 0);
    const totalInvoiced = milestones.reduce((sum, m) => sum + (details.dealValue * m.percentage) / 100, 0);
    const netProfit = details.dealValue - totalDistributed;
    const chargesList = Array.isArray(taxes) ? taxes : (taxes.gst ? [{ name: 'GST', percentage: taxes.gst }] : []);
    const totalChargePct = chargesList.reduce((sum, c) => sum + (parseFloat(c.percentage) || 0), 0);
    const chargesBreakdown = chargesList.map(c => `${c.name}: ${c.percentage}%`).join(', ');

    const dashboardData = [
        ["PROJECT FINANCIAL DASHBOARD"], ["Generated On", new Date().toLocaleString()], [],
        ["KEY METRICS"], ["Total Deal Value", details.dealValue], ["Currency", currency],
        ["Total Distributed", totalDistributed], ["Net Profit (Projected)", netProfit],
        ["Profit Margin", `${((netProfit / details.dealValue) * 100).toFixed(2)}%`],
        ["Total Invoiced", totalInvoiced], [], ["FINANCIAL CONFIGURATION"],
        ["Charges Applied", chargesBreakdown || "None"], ["Total Charge %", `${totalChargePct}%`], [],
        ["PROJECT DETAILS"], ["Project ID", details.projectId], ["Client", details.clientName],
        ["Delivery", details.delivery], ["Location", details.location]
    ];
    const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardData);
    wsDashboard['!cols'] = [{ wch: 25 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsDashboard, "Dashboard");

    const stakeholderHeader = ["Role / Name", "Share %", `Amount (${currency})`, "Payout Tax %"];
    const stakeholderData = stakeholders.map(s => [s.name, `${s.percentage}%`, (details.dealValue * s.percentage) / 100, `${s.payoutTax || 0}%`]);
    const wsStakeholders = XLSX.utils.aoa_to_sheet([stakeholderHeader, ...stakeholderData]);
    wsStakeholders['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsStakeholders, "Stakeholders");

    const milestoneHeader = ["Milestone", "Percentage", "Status", `Base (${currency})`, `Tax/Charges (${currency})`, `Total (${currency})`];
    const milestoneData = milestones.map(m => {
        const base = (details.dealValue * m.percentage) / 100;
        const tax = (base * totalChargePct) / 100;
        return [m.name, `${m.percentage}%`, m.status, base, tax, base + tax];
    });
    const wsMilestones = XLSX.utils.aoa_to_sheet([milestoneHeader, ...milestoneData]);
    wsMilestones['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsMilestones, "Invoicing Schedule");

    const safeName = (details.projectId || 'Project').replace(/[^a-z0-9]/gi, '_');
    XLSX.writeFile(wb, `${safeName}_Full_Report.xlsx`);
};

const exportDashboardExcel = (projects, filter) => {
    const wb = XLSX.utils.book_new();
    const totalRevenue = projects.reduce((sum, p) => sum + (parseFloat(p.dealValue) || 0), 0);
    const summaryData = [
        ["EXECUTIVE DASHBOARD REPORT"], ["Filter Applied", filter], [],
        ["Total Revenue", totalRevenue], [], ["DISTRIBUTION BY PROJECT"], ["Project", "Value"]
    ];
    projects.forEach(p => summaryData.push([p.projectId, p.dealValue]));
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Executive Summary");
    XLSX.writeFile(wb, `Dashboard_Report_${filter}.xlsx`);
};

// ==========================================
// 2. CUSTOM TOOLTIP
// ==========================================
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

// ==========================================
// 3. DASHBOARD COMPONENT
// ==========================================
const Dashboard = ({ projects, onOpenProject, onCreateProject, onStatusChange, onDeleteProject }) => {
    const [filter, setFilter] = useState('All');
    const [chartMetric, setChartMetric] = useState('Revenue');
    const [dashboardCurrency, setDashboardCurrency] = useState('AED');
    const [exchangeRates, setExchangeRates] = useState({ 'AED': 1, 'USD': 0.2722, 'INR': 22.6 });

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const response = await fetch('https://api.exchangerate-api.com/v4/latest/AED');
                if (!response.ok) throw new Error('Failed');
                const data = await response.json();
                setExchangeRates(prev => ({ ...prev, ...data.rates }));
            } catch { /* use fallback rates */ }
        };
        fetchRates();
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

    const statusBadgeClass = (s) => {
        if (!s || s === 'Active')    return 'inv-badge inv-badge-active';
        if (s === 'Archived')        return 'inv-badge inv-badge-archived';
        if (s === 'On Hold')         return 'inv-badge inv-badge-hold';
        return 'inv-badge inv-badge-paid';
    };

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
};

// ==========================================
// 4. TAX / STAKEHOLDER CONSTANTS
// ==========================================
const STAKEHOLDERS_CONSTANTS = {
    COUNTRIES: ['India', 'Other'],
    INDIAN_STATES: [
        'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
        'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
        'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
        'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands',
        'Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh',
        'Lakshadweep','Puducherry'
    ]
};

// ==========================================
// 5. BUSINESS DETAILS (STAGE 1)
// ==========================================
const BusinessDetails = ({ details, updateDetails, charges, addCharge, removeCharge, updateCharge }) => {
    const currency = details.currency || 'AED';
    const dealValue = parseFloat(details.dealValue) || 0;
    const totalChargePct = charges ? charges.reduce((s, c) => s + (parseFloat(c.percentage)||0), 0) : 0;
    const totalChargeAmt = charges ? charges.reduce((s, c) => s + ((dealValue * (parseFloat(c.percentage)||0))/100), 0) : 0;

    // ── Contact Picker ──
    const [contacts, setContacts] = useState([]);
    const [contactSearch, setContactSearch] = useState('');
    const [showDrop, setShowDrop] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const dropRef = useRef(null);

    useEffect(() => {
        contactService.getContacts()
            .then(data => setContacts(Array.isArray(data) ? data : []))
            .catch(() => setContacts([]));
    }, []);

    useEffect(() => {
        const handleClick = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false); };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const filteredContacts = contacts.filter(c => {
        const q = contactSearch.toLowerCase();
        return !q || (c.name||'').toLowerCase().includes(q) || (c.company||'').toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q);
    }).slice(0, 8);

    const handleContactSelect = (contact) => {
        setSelectedContact(contact);
        setContactSearch('');
        setShowDrop(false);
        updateDetails('clientName', contact.name || contact.company || '');
        updateDetails('clientAddress', contact.clientAddress || contact.address || '');
        updateDetails('clientGstin', contact.gstin || '');
        updateDetails('location', contact.location || contact.clientCountry || '');
    };

    const handleTaxChange = (id, field, value, currentCharge) => {
        let updates = { [field]: value };
        let currentCountry = field === 'country' ? value : (currentCharge.country || 'India');
        let currentState   = field === 'state'   ? value : (currentCharge.state   || '');

        if (field === 'country') {
            if (value === 'Other') {
                updates.country = '';
                updates.state = '';
                if (currency !== 'INR') { updates.taxType = 'Export (Nil Rate)'; updates.percentage = 0; updates.name = 'Export (Nil)'; }
                else { updates.taxType = 'Inter-State (IGST)'; updates.percentage = 18; updates.name = 'IGST'; }
            } else if (value === 'India') {
                updates.country = 'India';
            } else {
                updates.state = '';
                if (currency !== 'INR') { updates.taxType = 'Export (Nil Rate)'; updates.percentage = 0; updates.name = 'Export (Nil)'; }
                else { updates.taxType = 'Inter-State (IGST)'; updates.percentage = 18; updates.name = 'IGST'; }
            }
        }

        if (field === 'state' && (currentCountry === 'India' || !currentCountry)) {
            if (value === 'Tamil Nadu') { updates.taxType = 'Intra-State (CGST + SGST)'; updates.percentage = 18; updates.name = 'GST (Intra)'; }
            else if (value) { updates.taxType = 'Inter-State (IGST)'; updates.percentage = 18; updates.name = 'IGST'; }
        }

        if (field === 'taxType') {
            if (value === '') {
                if (currentCountry === 'Other' || (currentCountry && currentCountry !== 'India')) {
                    if (currency !== 'INR') { updates.taxType = 'Export (Nil Rate)'; updates.percentage = 0; updates.name = 'Export (Nil)'; }
                    else { updates.taxType = 'Inter-State (IGST)'; updates.percentage = 18; updates.name = 'IGST'; }
                } else if (currentCountry === 'India') {
                    if (currentState === 'Tamil Nadu') { updates.taxType = 'Intra-State (CGST + SGST)'; updates.percentage = 18; updates.name = 'GST (Intra)'; }
                    else if (currentState) { updates.taxType = 'Inter-State (IGST)'; updates.percentage = 18; updates.name = 'IGST'; }
                    else { updates.taxType = ''; updates.percentage = 0; updates.name = 'Tax'; }
                }
            } else if (value === 'Export (Nil Rate)') { updates.percentage = 0; updates.country = 'International'; updates.state = ''; updates.name = 'Export (Nil)'; }
            else if (value === 'Intra-State (CGST + SGST)') { updates.percentage = 18; updates.country = 'India'; updates.state = 'Tamil Nadu'; updates.name = 'GST (Intra)'; }
            else if (value === 'Inter-State (IGST)') { updates.percentage = 18; updates.country = 'India'; updates.name = 'IGST'; }
            else if (value === 'Other') { updates.name = 'Tax'; }
        }

        updateCharge(id, updates);
    };

    return (
        <div className="inv-stage-card" style={{ '--stage-accent': 'linear-gradient(180deg,#4361EE 0%,#06B6D4 100%)' }}>
            <div className="inv-stage-header">
                <div className="inv-stage-header-left">
                    <div className="inv-stage-num">1</div>
                    <div>
                        <div className="inv-stage-title">Business Details & Finance Charges</div>
                        <div className="inv-stage-sub">Project info, deal value, and tax configuration</div>
                    </div>
                </div>
            </div>
            <div className="inv-stage-body">

                {/* ── Contact Auto-fill Picker ── */}
                <div className="inv-contact-picker" ref={dropRef}>
                    <div className="inv-contact-picker-label">
                        <Users size={13} style={{ color: '#4361EE' }} />
                        Import from Contact
                    </div>
                    <div className="inv-contact-search-wrap">
                        <input
                            className="inv-contact-search-input"
                            placeholder={selectedContact ? `${selectedContact.name || selectedContact.company}` : 'Search by name, company or email…'}
                            value={contactSearch}
                            onFocus={() => setShowDrop(true)}
                            onChange={e => { setContactSearch(e.target.value); setShowDrop(true); }}
                        />
                        {selectedContact && (
                            <button
                                className="inv-contact-clear"
                                title="Clear selection"
                                onClick={() => { setSelectedContact(null); setContactSearch(''); }}
                            ><X size={12} /></button>
                        )}
                        {showDrop && (
                            <div className="inv-contact-drop">
                                {filteredContacts.length === 0 ? (
                                    <div className="inv-contact-empty">No contacts found</div>
                                ) : filteredContacts.map(c => (
                                    <div
                                        key={c._id || c.id}
                                        className="inv-contact-item"
                                        onMouseDown={() => handleContactSelect(c)}
                                    >
                                        <div className="inv-contact-avatar">
                                            {(c.name || c.company || '?').substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="inv-contact-info">
                                            <div className="inv-contact-name">{c.name || c.company || '—'}</div>
                                            <div className="inv-contact-meta">{[c.company, c.email].filter(Boolean).join(' · ')}</div>
                                        </div>
                                        {(c.gstin || c.clientAddress) && (
                                            <div className="inv-contact-tags">
                                                {c.gstin && <span className="inv-contact-tag">GSTIN</span>}
                                                {c.clientAddress && <span className="inv-contact-tag">Address</span>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {selectedContact && (
                        <div className="inv-contact-selected-info">
                            {selectedContact.phone && <span><strong>Phone:</strong> {selectedContact.phone}</span>}
                            {selectedContact.gstin && <span><strong>GSTIN:</strong> {selectedContact.gstin}</span>}
                            {selectedContact.clientAddress && <span><strong>Address:</strong> {selectedContact.clientAddress}</span>}
                        </div>
                    )}
                </div>

                <div className="inv-form-grid">
                    <label className="inv-form-label">Project ID</label>
                    <input className="inv-input" value={details.projectId} onChange={e => updateDetails('projectId', e.target.value)} />
                    <label className="inv-form-label">Client Name</label>
                    <input className="inv-input" value={details.clientName} onChange={e => updateDetails('clientName', e.target.value)} />

                    <label className="inv-form-label">Client Address</label>
                    <input className="inv-input" value={details.clientAddress||''} onChange={e => updateDetails('clientAddress', e.target.value)} placeholder="Client billing address" />
                    <label className="inv-form-label">Client GSTIN</label>
                    <input className="inv-input" value={details.clientGstin||''} onChange={e => updateDetails('clientGstin', e.target.value)} placeholder="e.g. 29ABCDE1234F1Z5" />

                    <label className="inv-form-label">Delivery</label>
                    <input className="inv-input" value={details.delivery||''} onChange={e => updateDetails('delivery', e.target.value)} placeholder="Ambot365" />
                    <label className="inv-form-label">Billing Location</label>
                    <input className="inv-input" value={details.location} onChange={e => updateDetails('location', e.target.value)} />

                    <label className="inv-form-label">Deal Value</label>
                    <input type="number" className="inv-input" value={details.dealValue} onChange={e => updateDetails('dealValue', e.target.value)} />
                    <label className="inv-form-label">Currency</label>
                    <select className="inv-select" value={details.currency} onChange={e => updateDetails('currency', e.target.value)}>
                        <option value="AED">AED</option><option value="USD">USD</option><option value="INR">INR</option>
                    </select>

                    <label className="inv-form-label">Lead GST (%)</label>
                    <input type="number" className="inv-input" value={details.leadGst||''} onChange={e => updateDetails('leadGst', e.target.value)} placeholder="e.g. 18" />
                    <label className="inv-form-label">Currency Value</label>
                    <input type="number" className="inv-input" value={details.currencyValue||''} onChange={e => updateDetails('currencyValue', e.target.value)} placeholder="e.g. 83.50" />
                </div>

                <div className="inv-section-divider">
                    <span className="inv-section-label">Finance Charges (GST / Tax)</span>
                    <button className="inv-btn-outline" style={{ height: 30, fontSize: 12 }} onClick={addCharge}>
                        <Plus size={13} /> Add Tax
                    </button>
                </div>

                <div className="inv-table-wrap">
                    <table className="inv-stage-table">
                        <thead>
                            <tr>
                                <th style={{ width: 200 }}>Tax Type</th>
                                <th>Country</th>
                                <th>State</th>
                                <th style={{ width: 90 }}>%</th>
                                <th>Amount ({currency})</th>
                                <th style={{ width: 44 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {charges && charges.map(c => (
                                <tr key={c.id}>
                                    <td>
                                        {c.taxType === 'Other' ? (
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                <input className="inv-table-input" value={c.name} onChange={e => updateCharge(c.id, 'name', e.target.value)} placeholder="Tax Name" autoFocus />
                                                <button className="inv-btn-icon" onClick={() => handleTaxChange(c.id, 'taxType', '', c)} title="Reset" style={{ flexShrink: 0 }}>
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <select className="inv-table-select" value={c.taxType||''} onChange={e => handleTaxChange(c.id, 'taxType', e.target.value, c)}>
                                                <option value="">Select Type</option>
                                                <option value="Intra-State (CGST + SGST)">Intra-State (CGST + SGST)</option>
                                                <option value="Inter-State (IGST)">Inter-State (IGST)</option>
                                                <option value="Export (Nil Rate)">Export (Nil Rate)</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        )}
                                    </td>
                                    <td>
                                        {c.country !== 'India' && c.country !== undefined ? (
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                <input className="inv-table-input" value={c.country} onChange={e => handleTaxChange(c.id, 'country', e.target.value, c)} placeholder="Country Name" autoFocus />
                                                <button className="inv-btn-icon" onClick={() => handleTaxChange(c.id, 'country', 'India', c)} title="Reset to India" style={{ flexShrink: 0 }}>
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <select
                                                className="inv-table-select"
                                                value={c.country || 'India'}
                                                disabled={c.taxType === 'Other'}
                                                onChange={e => handleTaxChange(c.id, 'country', e.target.value, c)}
                                            >
                                                {STAKEHOLDERS_CONSTANTS.COUNTRIES.map(country => (
                                                    <option key={country} value={country}>{country}</option>
                                                ))}
                                            </select>
                                        )}
                                    </td>
                                    <td>
                                        <select
                                            className="inv-table-select"
                                            value={c.state||''}
                                            disabled={(c.country||'India') !== 'India' || c.taxType === 'Other'}
                                            onChange={e => handleTaxChange(c.id, 'state', e.target.value, c)}
                                        >
                                            <option value="">Select State</option>
                                            {STAKEHOLDERS_CONSTANTS.INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            className="inv-table-input"
                                            value={c.percentage}
                                            disabled={c.taxType !== 'Other'}
                                            onChange={e => handleTaxChange(c.id, 'percentage', e.target.value, c)}
                                            style={{ textAlign: 'center' }}
                                        />
                                    </td>
                                    <td>
                                        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', fontFamily: 'Consolas, monospace' }}>
                                            {currency} {(dealValue * c.percentage / 100).toLocaleString()}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="inv-btn-icon" onClick={() => removeCharge(c.id)}>
                                            <Trash2 size={13} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="3">Total Tax Liability</td>
                                <td>{totalChargePct.toFixed(2)}%</td>
                                <td>{currency} {totalChargeAmt.toLocaleString()}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 6. PROJECT SPLITS (STAGE 2)
// ==========================================
const StageTwoCombined = ({ stakeholders, addStakeholder, removeStakeholder, updateStakeholder, dealValue, currency }) => {
    const totalPct = stakeholders.reduce((s, sh) => s + (parseFloat(sh.percentage)||0), 0);
    const totalAmt = stakeholders.reduce((s, sh) => s + ((dealValue * (parseFloat(sh.percentage)||0))/100), 0);

    return (
        <div className="inv-stage-card" style={{ '--stage-accent': 'linear-gradient(180deg,#8B5CF6 0%,#4361EE 100%)' }}>
            <div className="inv-stage-header">
                <div className="inv-stage-header-left">
                    <div className="inv-stage-num" style={{ background: '#8B5CF6' }}>2</div>
                    <div>
                        <div className="inv-stage-title">Project Splits</div>
                        <div className="inv-stage-sub">Define revenue sharing among stakeholders</div>
                    </div>
                </div>
                <div className="inv-stage-header-right">
                    <button className="inv-btn-outline" style={{ height: 30, fontSize: 12 }} onClick={addStakeholder}>
                        <Plus size={13} /> Add Split
                    </button>
                </div>
            </div>
            <div className="inv-stage-body">
                <table className="inv-stage-table">
                    <thead>
                        <tr>
                            <th>Party / Role</th>
                            <th style={{ width: 130 }}>Share %</th>
                            <th style={{ textAlign: 'right' }}>Amount ({currency})</th>
                            <th style={{ width: 44 }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {stakeholders.map(s => {
                            const val = (dealValue * s.percentage) / 100;
                            return (
                                <tr key={s.id}>
                                    <td>
                                        <input className="inv-table-input" value={s.name} onChange={e => updateStakeholder(s.id, 'name', e.target.value)} placeholder="e.g. Lead / Investor" />
                                    </td>
                                    <td>
                                        <input type="number" className="inv-table-input" value={s.percentage} onChange={e => updateStakeholder(s.id, 'percentage', e.target.value)} style={{ textAlign: 'right' }} />
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span className="inv-cell-mono">{currency} {val.toLocaleString()}</span>
                                    </td>
                                    <td>
                                        <button className="inv-btn-icon" onClick={() => removeStakeholder(s.id)}>
                                            <Trash2 size={13} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {stakeholders.length === 0 && (
                            <tr><td colSpan="4"><div className="inv-empty">No parties added. Click "Add Split" to begin.</div></td></tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td>Total</td>
                            <td>{totalPct.toFixed(2)}%</td>
                            <td style={{ textAlign: 'right' }}>{currency} {totalAmt.toLocaleString()}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};



// ==========================================
// 7. INVOICE CYCLE (STAGE 3)
// ==========================================
const PaymentMilestones = ({ milestones, addMilestone, removeMilestone, updateMilestone, dealValue, details, taxes, projectType }) => {
    const paidMilestones = milestones.filter(m => m.status === 'Paid');
    const totalPaid = paidMilestones.reduce((s, m) => s + ((dealValue * m.percentage)/100), 0);
    const paidPct   = dealValue ? ((totalPaid / dealValue) * 100) : 0;

    const getDefaultStages = () => [
        { id: 0, label: 'Demo' }, { id: 1, label: 'Proposal' }, { id: 2, label: 'Negotiation' },
        { id: 3, label: 'Approval' }, { id: 4, label: 'Won' }, { id: 5, label: 'Closed' }, { id: 6, label: 'Lost' }
    ];
    const getStagesForType = (type) => {
        try {
            const key = type === 'Service' ? 'sales_stages_service' : 'sales_stages_product';
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : getDefaultStages();
        } catch { return getDefaultStages(); }
    };
    const [salesStages, setSalesStages] = useState(() => getStagesForType(projectType));

    useEffect(() => { setSalesStages(getStagesForType(projectType)); }, [projectType]);
    useEffect(() => {
        const handler = () => setSalesStages(getStagesForType(projectType));
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, [projectType]);

    const calculateAgeing = (invoiceDate, paidDate) => {
        if (!invoiceDate) return null;
        const start = new Date(invoiceDate);
        const end   = paidDate ? new Date(paidDate) : new Date();
        return Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
    };

    const isIntraState  = taxes && taxes.some(t => t.taxType === 'Intra-State (CGST + SGST)');
    const totalTaxRate  = taxes && taxes.length > 0 ? taxes.reduce((s, t) => s + (parseFloat(t.percentage)||0), 0) : 18;

    const statusClass = (s) => {
        if (s === 'Paid')    return 'paid';
        if (s === 'Overdue') return 'overdue';
        return '';
    };

    return (
        <div className="inv-stage-card" style={{ '--stage-accent': 'linear-gradient(180deg,#10B981 0%,#06B6D4 100%)' }}>
            <div className="inv-stage-header">
                <div className="inv-stage-header-left">
                    <div className="inv-stage-num" style={{ background: '#10B981' }}>3</div>
                    <div>
                        <div className="inv-stage-title">Invoice Cycle</div>
                        <div className="inv-stage-sub">Payment milestones, dates, and status tracking</div>
                    </div>
                </div>
                <div className="inv-stage-header-right">
                    <button className="inv-btn-outline" style={{ height: 30, fontSize: 12 }} onClick={addMilestone}>
                        <Plus size={13} /> Add Payment
                    </button>
                </div>
            </div>
            <div className="inv-stage-body">
                {/* KPI Strip — always visible */}
                <div className="inv-kpi-strip">
                    <div className="inv-kpi-strip-card" style={{ '--kpi-accent': '#10B981' }}>
                        <div className="inv-kpi-strip-label">Total Paid</div>
                        <div className="inv-kpi-strip-value">{details.currency} {totalPaid.toLocaleString()}</div>
                    </div>
                    <div className="inv-kpi-strip-card" style={{ '--kpi-accent': '#4361EE' }}>
                        <div className="inv-kpi-strip-label">Collection Rate</div>
                        <div className="inv-kpi-strip-value">{paidPct.toFixed(1)}%</div>
                    </div>
                </div>

                <div className="inv-table-wrap">
                    <table className="inv-stage-table" style={{ minWidth: 1100 }}>
                        <thead>
                            <tr>
                                <th style={{ width: 160 }}>Payment Stage</th>
                                <th style={{ width: 80, textAlign: 'center' }}>Value %</th>
                                <th style={{ width: 130 }}>Invoice Date</th>
                                <th style={{ textAlign: 'right', width: 120 }}>Base ({details.currency})</th>
                                {isIntraState ? (
                                    <>
                                        <th style={{ textAlign: 'right', width: 90 }}>CGST</th>
                                        <th style={{ textAlign: 'right', width: 90 }}>SGST</th>
                                    </>
                                ) : (
                                    <th style={{ textAlign: 'right', width: 100 }}>GST</th>
                                )}
                                <th style={{ textAlign: 'right', width: 120 }}>Total ({details.currency})</th>
                                <th style={{ width: 130 }}>Paid Date</th>
                                <th style={{ textAlign: 'right', width: 110 }}>Paid ({details.currency})</th>
                                <th style={{ textAlign: 'center', width: 80 }}>Ageing</th>
                                <th style={{ width: 110 }}>Status</th>
                                <th style={{ width: 170 }}>Download</th>
                            </tr>
                        </thead>
                        <tbody>
                            {milestones.map((milestone) => {
                                const raised  = (dealValue * milestone.percentage) / 100;
                                const taxAmt  = (raised * totalTaxRate) / 100;
                                const total   = raised + taxAmt;
                                const ageing  = calculateAgeing(milestone.invoiceDate, milestone.paidDate);

                                return (
                                    <tr key={milestone.id}>
                                        <td>
                                            {milestone.isCustomName ? (
                                                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                                                    <input className="inv-table-input" value={milestone.name} onChange={e => updateMilestone(milestone.id, 'name', e.target.value)} placeholder="Custom name" autoFocus />
                                                    <button className="inv-btn-icon" onClick={() => updateMilestone(milestone.id, { isCustomName: false, name: salesStages[0]?.label || 'New Stage' })} style={{ flexShrink: 0 }}>
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <select
                                                    className="inv-table-select"
                                                    value={salesStages.some(s => s.label === milestone.name) ? milestone.name : ''}
                                                    onChange={e => {
                                                        if (e.target.value === '__custom__') updateMilestone(milestone.id, { isCustomName: true, name: '' });
                                                        else updateMilestone(milestone.id, 'name', e.target.value);
                                                    }}
                                                >
                                                    <option value="" disabled>Select Stage</option>
                                                    {salesStages.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
                                                    <option value="__custom__">✏️ Custom</option>
                                                </select>
                                            )}
                                        </td>
                                        <td>
                                            <input type="number" className="inv-table-input" value={milestone.percentage} onChange={e => updateMilestone(milestone.id, 'percentage', e.target.value)} style={{ textAlign: 'right' }} />
                                        </td>
                                        <td>
                                            <input type="date" className="inv-table-input" value={milestone.invoiceDate||''} onChange={e => updateMilestone(milestone.id, 'invoiceDate', e.target.value)} />
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'Consolas, monospace', fontSize: 12.5, fontWeight: 600 }}>
                                            {raised.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        {isIntraState ? (
                                            <>
                                                <td style={{ textAlign: 'right', fontFamily: 'Consolas, monospace', fontSize: 12.5 }}>{(taxAmt/2).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td style={{ textAlign: 'right', fontFamily: 'Consolas, monospace', fontSize: 12.5 }}>{(taxAmt/2).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            </>
                                        ) : (
                                            <td style={{ textAlign: 'right', fontFamily: 'Consolas, monospace', fontSize: 12.5 }}>{taxAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        )}
                                        <td style={{ textAlign: 'right', fontFamily: 'Consolas, monospace', fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                                            {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td>
                                            <input type="date" className="inv-table-input" value={milestone.paidDate||''} onChange={e => updateMilestone(milestone.id, 'paidDate', e.target.value)} />
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'Consolas, monospace', fontSize: 12.5, color: '#059669', fontWeight: 600 }}>
                                            {raised.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {ageing !== null ? (
                                                <span className={`inv-ageing ${ageing > 30 ? 'high' : ''}`}>{ageing}d</span>
                                            ) : <span style={{ color: '#CBD5E1' }}>—</span>}
                                        </td>
                                        <td>
                                            <select
                                                className={`inv-table-select ${statusClass(milestone.status)}`}
                                                value={milestone.status || 'Pending'}
                                                onChange={e => updateMilestone(milestone.id, 'status', e.target.value)}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Raised">Raised</option>
                                                <option value="Paid">Paid</option>
                                                <option value="Overdue">Overdue</option>
                                            </select>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                <select
                                                    className="inv-dl-select"
                                                    value=""
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        if (val === 'investor') generateInvestorPaymentPDF(milestone, details, taxes);
                                                        else if (val === 'client') generateInvoicePDF(milestone, details, taxes);
                                                        else if (val === 'tax') generateTaxInvoicePDF(milestone, details, taxes);
                                                        e.target.value = '';
                                                    }}
                                                >
                                                    <option value="">Download PDF</option>
                                                    <option value="investor">Payment to Investor</option>
                                                    <option value="client">Proforma Invoice</option>
                                                    <option value="tax">Tax Invoice</option>
                                                </select>
                                                <button className="inv-btn-icon" onClick={() => removeMilestone(milestone.id)} title="Delete">
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {milestones.length === 0 && (
                                <tr><td colSpan={isIntraState ? 12 : 11}>
                                    <div className="inv-empty">No payment milestones yet. Click "Add Payment" to create one.</div>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 8. PAYMENT PROCESS (STAGE 4)
// ==========================================
const PaymentProcess = ({ stakeholders, updateStakeholder, details, dealValue }) => {
    const dVal = dealValue;

    return (
        <div className="inv-stage-card" style={{ '--stage-accent': 'linear-gradient(180deg,#F59E0B 0%,#F43F5E 100%)' }}>
            <div className="inv-stage-header">
                <div className="inv-stage-header-left">
                    <div className="inv-stage-num" style={{ background: '#F59E0B' }}>4</div>
                    <div>
                        <div className="inv-stage-title">Payment Process</div>
                        <div className="inv-stage-sub">Stakeholder payouts, GST deductions, and status</div>
                    </div>
                </div>
            </div>
            <div className="inv-stage-body">
                <div className="inv-table-wrap">
                    <table className="inv-stage-table" style={{ minWidth: 1100 }}>
                        <thead>
                            <tr>
                                <th style={{ width: 180 }}>Party</th>
                                <th style={{ width: 90, textAlign: 'center' }}>Value %</th>
                                <th style={{ textAlign: 'right', width: 140 }}>Pay ({details.currency})</th>
                                <th style={{ width: 90, textAlign: 'center' }}>GST %</th>
                                <th style={{ textAlign: 'right', width: 120 }}>GST Amt</th>
                                <th style={{ textAlign: 'right', width: 140 }}>Total Pay</th>
                                <th style={{ width: 150 }}>Paid Date</th>
                                <th style={{ width: 120 }}>Status</th>
                                <th style={{ textAlign: 'center', width: 80 }}>Voucher</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stakeholders && stakeholders.map(s => {
                                const payAmt = (dVal * s.percentage) / 100;
                                const taxRate = parseFloat(details.leadGst) || 0;
                                const taxAmt  = (payAmt * taxRate) / 100;
                                const netPay  = payAmt + taxAmt;
                                const status  = s.status || s.payoutStatus || 'Pending';

                                return (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 600, color: '#0F172A' }}>{s.name}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <input
                                                type="number"
                                                className="inv-table-input"
                                                value={s.percentage}
                                                onChange={e => updateStakeholder(s.id, 'percentage', e.target.value)}
                                                style={{ textAlign: 'center', width: 70 }}
                                            />
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'Consolas, monospace', fontSize: 12.5, fontWeight: 600 }}>
                                            {details.currency} {payAmt.toLocaleString()}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#94A3B8' }}>{taxRate}%</span>
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'Consolas, monospace', fontSize: 12.5, color: '#D97706' }}>
                                            {details.currency} {taxAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'Consolas, monospace', fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                                            {details.currency} {netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td>
                                            <input type="date" className="inv-table-input" value={s.paidDate||''} onChange={e => updateStakeholder(s.id, 'paidDate', e.target.value)} />
                                        </td>
                                        <td>
                                            <select
                                                className={`inv-table-select ${status === 'Paid' ? 'paid' : ''}`}
                                                value={status}
                                                onChange={e => updateStakeholder(s.id, { status: e.target.value, payoutStatus: e.target.value })}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Processed">Processed</option>
                                                <option value="Paid">Paid</option>
                                            </select>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button className="inv-btn-icon blue" onClick={() => generatePaymentInvoicePDF(s, details, dVal)} title="Download Voucher">
                                                <FileDown size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {(!stakeholders || stakeholders.length === 0) && (
                                <tr><td colSpan="9">
                                    <div className="inv-empty">No stakeholders defined. Add splits in Stage 2 first.</div>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 9. INVOICE MAIN (DETAIL VIEW)
// ==========================================
const InvoiceMain = ({ details, updateDetails, stakeholders, addStakeholder, removeStakeholder, updateStakeholder, milestones, addMilestone, removeMilestone, updateMilestone, charges, addCharge, removeCharge, updateCharge, onSave, onBack }) => {
    const dVal = parseFloat(details.dealValue) || 0;

    return (
        <div className="inv-content">
            {/* Topbar: Back + Actions */}
            <div className="inv-detail-topbar">
                <button className="inv-btn-back" onClick={onBack}>
                    <ArrowLeft size={14} /> Back to Dashboard
                </button>
                <div className="inv-detail-actions">
                    <button className="inv-btn-primary" onClick={onSave}>
                        <Save size={14} /> Save Project
                    </button>
                    <button className="inv-btn-danger" onClick={() => generateProjectReportPDF(details, stakeholders, milestones, charges)} title="Download PDF Report">
                        <FaFilePdf size={14} /> PDF
                    </button>
                    <button className="inv-btn-success" onClick={() => exportProjectReport(details, stakeholders, milestones, charges)} title="Export Excel">
                        <PiMicrosoftExcelLogoFill size={15} /> Excel
                    </button>
                </div>
            </div>

            {/* Project Header Card */}
            <div className="inv-detail-header">
                <div className="inv-detail-info">
                    <div className="inv-detail-icon">
                        <LayoutDashboard size={20} />
                    </div>
                    <div>
                        <div className="inv-detail-title">{details.projectId || 'Untitled Project'}</div>
                        <div className="inv-detail-subtitle">{details.clientName} · {details.currency} {Number(details.dealValue||0).toLocaleString()} · {details.type || 'Product'}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {[
                        { label: 'Total Charges', value: `${(charges||[]).reduce((s,c)=>s+(parseFloat(c.percentage)||0),0).toFixed(1)}%` },
                        { label: 'Milestones',    value: milestones.length },
                        { label: 'Splits',        value: stakeholders.length },
                    ].map((stat, i) => (
                        <div key={i} style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{stat.label}</div>
                            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>{stat.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Stage 1 */}
            <BusinessDetails details={details} updateDetails={updateDetails} charges={charges} addCharge={addCharge} removeCharge={removeCharge} updateCharge={updateCharge} />

            {/* Stage 2 */}
            <StageTwoCombined stakeholders={stakeholders} addStakeholder={addStakeholder} removeStakeholder={removeStakeholder} updateStakeholder={updateStakeholder} dealValue={dVal} currency={details.currency} />

            {/* Stage 3 */}
            <PaymentMilestones milestones={milestones} addMilestone={addMilestone} removeMilestone={removeMilestone} updateMilestone={updateMilestone} dealValue={dVal} details={details} taxes={charges} projectType={details.type} />

            {/* Stage 4 */}
            <PaymentProcess stakeholders={stakeholders} updateStakeholder={updateStakeholder} details={details} dealValue={dVal} />
        </div>
    );
};

// ==========================================
// 10. LOGIC UTILITIES
// ==========================================
const detectTaxFromAddress = (address) => {
    if (!address) return { taxType: 'Inter-State (IGST)', name: 'IGST', percentage: 18, country: 'India', state: '' };
    const lower = address.toLowerCase();
    if ((lower.includes('usa')||lower.includes('uk')||lower.includes('uae')||lower.includes('dubai')||lower.includes('london')||lower.includes('new york')||lower.includes('canada')||lower.includes('australia')||lower.includes('japan')||lower.includes('singapore')||lower.includes('france')||lower.includes('germany')||lower.includes('international')) && !lower.includes('india')) {
        return { taxType: 'Export (Nil Rate)', name: 'Export (Nil)', percentage: 0, country: 'Other', state: '' };
    }
    const tnKeywords = ['tamil nadu','tamilnadu','chennai','coimbatore','madurai','tiruchirappalli','trichy','salem','tirunelveli','tiruppur','vellore','erode','thoothukudi','tuticorin','dindigul','thanjavur','ranipet','karur','ooty','kanyakumari','kancheepuram','kanchipuram','tiruvallur','cuddalore','hosur','nagercoil'];
    if (tnKeywords.some(kw => lower.includes(kw))) {
        return { taxType: 'Intra-State (CGST + SGST)', name: 'GST (Intra)', percentage: 18, country: 'India', state: 'Tamil Nadu' };
    }
    return { taxType: 'Inter-State (IGST)', name: 'IGST', percentage: 18, country: 'India', state: '' };
};

const normalizeId = (v) => (v === null || v === undefined ? '' : String(v));
const idsEqual = (a, b) => normalizeId(a) === normalizeId(b);
const normalizeProjectKey = (v) => String(v || '').trim().toLowerCase();

const toDateInputValue = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value.length >= 10 ? value.slice(0, 10) : value;
    try { return new Date(value).toISOString().slice(0, 10); } catch { return ''; }
};

const inferDealValue = (p) => {
    const direct = parseFloat(p?.dealValue);
    if (Number.isFinite(direct) && direct > 0) return direct;
    for (const entry of (Array.isArray(p?.history) ? p.history : [])) {
        const amount = parseFloat(entry?.amount);
        if (Number.isFinite(amount) && amount > 0) return amount;
    }
    return 0;
};

const normalizeProjectFinance = (p) => {
    if (!p) return p;
    return {
        ...p,
        milestones: (p.milestones || []).map(m => ({ ...m, invoiceDate: toDateInputValue(m.invoiceDate), paidDate: toDateInputValue(m.paidDate), status: m.status || 'Pending' })),
        stakeholders: (p.stakeholders || []).map(s => ({ ...s, status: s.status || s.payoutStatus || 'Pending', payoutStatus: s.payoutStatus || s.status || 'Pending', paidDate: toDateInputValue(s.paidDate) }))
    };
};

const completenessScore = (p) => {
    if (!p) return 0;
    let score = 0;
    if (p.clientAddress) score += 2;
    if (p.clientGstin)   score += 1;
    if (p.location)      score += 1;
    if (p.delivery)      score += 1;
    if (parseFloat(p.dealValue) > 0) score += 2;
    if ((p.charges||[]).length > 0)  score += 2;
    score += (p.milestones||[]).reduce((s,m) => { let v=1; if(m.invoiceDate) v+=2; if(m.paidDate) v+=2; if(m.status&&m.status!=='Pending') v+=2; return s+v; }, 0);
    score += (p.stakeholders||[]).reduce((s,sh) => { let v=1; if(sh.paidDate) v+=2; const st=sh.status||sh.payoutStatus; if(st&&st!=='Pending') v+=2; return s+v; }, 0);
    return score;
};

const pickBetterProject = (left, right) => {
    const ls = completenessScore(left), rs = completenessScore(right);
    if (ls !== rs) return ls > rs ? left : right;
    const ld = parseFloat(left?.dealValue)||0, rd = parseFloat(right?.dealValue)||0;
    if (ld !== rd) return ld > rd ? left : right;
    const lm = (left?.milestones||[]).length, rm = (right?.milestones||[]).length;
    if (lm !== rm) return lm > rm ? left : right;
    const lst = (left?.stakeholders||[]).length, rst = (right?.stakeholders||[]).length;
    if (lst !== rst) return lst > rst ? left : right;
    const li = parseInt(left?.id ?? left?._id, 10)||0, ri = parseInt(right?.id ?? right?._id, 10)||0;
    return ri >= li ? right : left;
};

const dedupeProjects = (items = []) => {
    const map = new Map();
    for (const rawItem of items) {
        const item = normalizeProjectFinance(rawItem);
        const key  = normalizeProjectKey(item?.projectId) || `id:${normalizeId(item?.id ?? item?._id)}`;
        const prev = map.get(key);
        map.set(key, prev ? pickBetterProject(prev, item) : item);
    }
    return Array.from(map.values());
};

// ==========================================
// 11. ROOT COMPONENT
// ==========================================
const ProjectTrackerComplete = () => {
    const toast = useToast();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const [view, setView] = useState('dashboard');
    const [activeProjectId, setActiveProjectId] = useState(null);
    const [projects, setProjects] = useState([]);
    const savedMilestoneStatusesRef = useRef({});

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const fetched = await projectFinanceService.getAll();
                const deduped = dedupeProjects(fetched || []);
                setProjects(deduped);
                const statusMap = {};
                deduped.forEach(p => {
                    const pid = p.id || p._id;
                    statusMap[pid] = {};
                    (p.milestones || []).forEach((m, idx) => { statusMap[pid][m.name || `milestone-${idx}`] = m.status; });
                });
                savedMilestoneStatusesRef.current = statusMap;
            } catch (err) { console.error("Error fetching project finances:", err); }
        };
        fetchProjects();
    }, []);

    useEffect(() => {
        const initProject = async () => {
            let receivedProject = location.state?.project;
            const projectIdParam = searchParams.get('projectId');

            if (!receivedProject && projectIdParam) {
                try { receivedProject = await projectService.getById(projectIdParam); } catch (err) { console.error("Failed to fetch project by ID:", err); }
            }
            if (!receivedProject) return;

            let fetchedProjects = [];
            try { fetchedProjects = await projectFinanceService.getAll(); } catch (err) { console.error("Error fetching during init:", err); }
            fetchedProjects = dedupeProjects(fetchedProjects || []);

            const existingProject = fetchedProjects.find(p =>
                idsEqual(p.id, receivedProject.id) ||
                idsEqual(p._id, receivedProject.id) ||
                (normalizeProjectKey(p.projectId) && normalizeProjectKey(receivedProject.customId) && normalizeProjectKey(p.projectId) === normalizeProjectKey(receivedProject.customId))
            );

            if (existingProject) {
                setProjects(fetchedProjects);
                setActiveProjectId(existingProject.id || existingProject._id);
                setView('invoice');
                return;
            }

            let retrievedAddress = '';
            let retrievedCountry = 'India';
            try {
                const contacts = await contactService.getContacts();
                const searchName = (receivedProject.clientName || '').toLowerCase().trim();
                const matchedContact = contacts.find(c => {
                    const cName    = (c.name    || '').toLowerCase().trim();
                    const cCompany = (c.company || '').toLowerCase().trim();
                    return cName === searchName || cCompany === searchName;
                });
                if (matchedContact) {
                    retrievedAddress = matchedContact.address || matchedContact.location || '';
                    const lowerLoc = retrievedAddress.toLowerCase();
                    if (lowerLoc.includes('india')) retrievedCountry = 'India';
                    else if (lowerLoc.includes('uae') || lowerLoc.includes('dubai')) retrievedCountry = 'UAE';
                    else if (retrievedAddress) {
                        const parts = retrievedAddress.split(',');
                        const last  = parts[parts.length - 1].trim();
                        if (last.length > 2) retrievedCountry = last;
                    }
                }
            } catch (err) { console.error("Error fetching contacts for invoice init:", err); }

            const taxConfig = detectTaxFromAddress(receivedProject.clientAddress || retrievedAddress);
            const newProject = {
                type: receivedProject.type || 'Product',
                projectId: receivedProject.customId || `PROJ-${receivedProject.id}`,
                dateCreated: new Date().toISOString(),
                clientName: receivedProject.clientName || 'Unknown Client',
                delivery: receivedProject.brandingName || '',
                dealValue: inferDealValue(receivedProject),
                currency: taxConfig.country === 'Other' ? 'AED' : 'INR',
                location: retrievedAddress || 'India',
                stakeholders: [], milestones: [],
                charges: [{ id: 1, name: taxConfig.name, taxType: taxConfig.taxType, country: taxConfig.country, state: taxConfig.state, percentage: taxConfig.percentage }],
                clientEmail: receivedProject.clientEmail || '', clientPhone: receivedProject.clientPhone || '',
                clientAddress: receivedProject.clientAddress || '', clientGstin: receivedProject.clientGstin || '',
                clientPan: receivedProject.clientPan || '', clientCin: receivedProject.clientCin || '',
                msmeStatus: receivedProject.msmeStatus || 'NON MSME', tdsSection: receivedProject.tdsSection || '', tdsRate: receivedProject.tdsRate || ''
            };

            try {
                const savedProject = await projectFinanceService.create(newProject);
                const savedId = savedProject.id || savedProject._id;
                const projWithId = normalizeProjectFinance({ ...newProject, id: savedId, _id: savedId });
                setProjects(dedupeProjects([...fetchedProjects, projWithId]));
                setActiveProjectId(savedId);
                setView('invoice');
            } catch (err) {
                console.error("Error creating project finance:", err);
                const fallbackId = receivedProject.id || Date.now();
                const projWithId = normalizeProjectFinance({ ...newProject, id: fallbackId });
                setProjects(dedupeProjects([...fetchedProjects, projWithId]));
                setActiveProjectId(fallbackId);
                setView('invoice');
            }
        };
        initProject();
    }, [location.state, searchParams]);

    const activeProject = projects.find(p => idsEqual(p.id, activeProjectId) || idsEqual(p._id, activeProjectId));

    const handleCreateProject = async () => {
        const newProj = {
            projectId: `PROJ-${Math.floor(Math.random() * 999)}`, dateCreated: new Date().toISOString(),
            clientName: 'New Client', clientAddress: '', clientGstin: '', delivery: '', dealValue: 0, currency: 'AED', location: '', status: 'Active',
            type: 'Product', stakeholders: [], milestones: [],
            charges: [{ id: 1, name: 'GST', taxType: 'Inter-State (IGST)', country: 'India', state: '', percentage: 18 }]
        };
        try {
            const saved = await projectFinanceService.create(newProj);
            const savedId = saved.id || saved._id || Date.now();
            const projWithId = normalizeProjectFinance({ ...newProj, ...saved, id: savedId, _id: savedId });
            setProjects(prev => dedupeProjects([...prev, projWithId]));
            setActiveProjectId(savedId);
        } catch (err) {
            console.error('Error creating project:', err);
            const fallbackId = Date.now();
            const projWithId = normalizeProjectFinance({ ...newProj, id: fallbackId });
            setProjects(prev => dedupeProjects([...prev, projWithId]));
            setActiveProjectId(fallbackId);
        }
        setView('invoice');
    };

    const handleDeleteProject = async (id) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                await projectFinanceService.delete(id);
                setProjects(prev => prev.filter(p => !idsEqual(p.id, id) && !idsEqual(p._id, id)));
                if (idsEqual(activeProjectId, id)) { setActiveProjectId(null); setView('dashboard'); }
            } catch (err) { console.error("Error deleting project:", err); toast.error('Failed to delete project.'); }
        }
    };

    const handleSaveProject = async () => {
        if (!activeProject) return;
        try {
            const payload = {
                projectId: activeProject.projectId || '',
                clientName: activeProject.clientName || '',
                clientAddress: activeProject.clientAddress || '',
                clientGstin: activeProject.clientGstin || '',
                delivery: activeProject.delivery || '',
                dealValue: parseFloat(activeProject.dealValue) || 0,
                currency: activeProject.currency || 'INR',
                location: activeProject.location || '',
                status: activeProject.status || 'Active',
                type: activeProject.type || 'Product',
                milestones: (activeProject.milestones || []).map((m, idx) => ({
                    name: m.name || '', percentage: parseFloat(m.percentage) || 0, status: m.status || 'Pending',
                    invoiceDate: m.invoiceDate || null, paidDate: m.paidDate || null,
                    isCustomName: m.isCustomName || false, order: m.order ?? idx
                })),
                stakeholders: (activeProject.stakeholders || []).map(s => ({
                    name: s.name || '', percentage: parseFloat(s.percentage) || 0,
                    payoutTax: parseFloat(s.payoutTax) || 0,
                    payoutStatus: s.payoutStatus || s.status || 'Pending', paidDate: s.paidDate || null
                })),
                charges: (activeProject.charges || []).map(c => ({
                    name: c.name || '', taxType: c.taxType || '',
                    country: c.country || '', state: c.state || '', percentage: parseFloat(c.percentage) || 0
                }))
            };

            const id = activeProject.id || activeProject._id;
            let savedProject = null;
            try {
                const updated = await projectFinanceService.update(id, payload);
                savedProject = updated;
                setProjects(prev => dedupeProjects(prev.map(p => (idsEqual(p.id, id) || idsEqual(p._id, id)) ? normalizeProjectFinance({ ...p, ...updated, id: updated.id || p.id, _id: updated._id || p._id }) : p)));
            } catch {
                const created = await projectFinanceService.create(payload);
                savedProject = created;
                const savedId = created.id || created._id;
                setProjects(prev => dedupeProjects(prev.map(p => (idsEqual(p.id, id) || idsEqual(p._id, id)) ? normalizeProjectFinance({ ...p, ...created, id: savedId, _id: savedId }) : p)));
                setActiveProjectId(savedId);
            }

            if (savedProject) {
                const projectId = savedProject.id || savedProject._id || id;
                const prevStatuses = savedMilestoneStatusesRef.current[id] || {};
                const dealValue = parseFloat(activeProject.dealValue) || 0;
                const totalTaxRate = (activeProject.charges || []).reduce((s, c) => s + (parseFloat(c.percentage) || 0), 0);

                for (const milestone of (activeProject.milestones || [])) {
                    const mKey = milestone.name || `milestone-${milestone.order}`;
                    if (milestone.status === 'Paid' && prevStatuses[mKey] !== 'Paid') {
                        const raised = (dealValue * (parseFloat(milestone.percentage) || 0)) / 100;
                        const tax    = (raised * totalTaxRate) / 100;
                        try {
                            await incomeService.createIncome({
                                description: `${activeProject.clientName} - ${milestone.name}`,
                                amount: raised + tax, date: new Date().toISOString(),
                                category: 'sales', status: 'Paid',
                                projectDepartment: `ProjectFinance-${projectId}`
                            });
                        } catch (err) { console.error("Error creating auto-income for milestone:", err); }
                    }
                }

                const newStatuses = {};
                (activeProject.milestones || []).forEach((m, idx) => { newStatuses[m.name || `milestone-${idx}`] = m.status; });
                savedMilestoneStatusesRef.current[projectId] = newStatuses;
                if (projectId !== id) savedMilestoneStatusesRef.current[projectId] = newStatuses;
            }

            toast.success('Project finance details saved successfully!');
        } catch (error) {
            console.error("Error saving project:", error);
            toast.error('Failed to save project. Please check all fields and try again.');
        }
    };

    const updateProject = (fn) => setProjects(prev => prev.map(p =>
        (idsEqual(p.id, activeProjectId) || idsEqual(p._id, activeProjectId)) ? fn(p) : p
    ));

    const updateDetails = (f, v) => {
        updateProject(p => {
            const updated = { ...p, [f]: v };
            if (f === 'clientAddress' && updated.charges && updated.charges.length > 0) {
                const taxConfig  = detectTaxFromAddress(v);
                const newCharges = [...updated.charges];
                newCharges[0]    = { ...newCharges[0], name: taxConfig.name, taxType: taxConfig.taxType, country: taxConfig.country, state: taxConfig.state, percentage: taxConfig.percentage };
                updated.charges  = newCharges;
            }
            return updated;
        });
    };

    const addStakeholder    = () => updateProject(p => ({ ...p, stakeholders: [...p.stakeholders, { id: Date.now(), name: 'New', percentage: 0, payoutTax: 18, payoutStatus: 'Pending', paidDate: '' }] }));
    const removeStakeholder = (id) => updateProject(p => ({ ...p, stakeholders: p.stakeholders.filter(s => s.id !== id) }));
    const updateStakeholder = async (id, f, v) => {
        const stakeholderSnapshot = activeProject?.stakeholders.find(s => s.id === id);
        const prevStatus = stakeholderSnapshot?.status || stakeholderSnapshot?.payoutStatus || 'Pending';

        updateProject(p => ({ ...p, stakeholders: p.stakeholders.map(s => s.id === id ? { ...s, ...(typeof f === 'object' ? f : { [f]: v }) } : s) }));

        const changedStatus = typeof f === 'object' ? (f.status || f.payoutStatus || null) : ((f === 'status' || f === 'payoutStatus') ? v : null);

        if (changedStatus === 'Paid' && prevStatus !== 'Paid' && activeProject) {
            const stakeholder = stakeholderSnapshot;
            if (stakeholder) {
                const basePayout = ((parseFloat(activeProject.dealValue)||0) * (parseFloat(stakeholder.percentage)||0)) / 100;
                const taxRate    = parseFloat(activeProject.leadGst) || 0;
                const taxAmt     = (basePayout * taxRate) / 100;
                try {
                    await expenseService.createExpense({
                        description: `Payout: ${stakeholder.name} - ${activeProject.projectId}`,
                        amount: basePayout + taxAmt, date: new Date().toISOString(),
                        category: 'allowances',
                        notes: `Auto-generated Stakeholder Payout from Project ${activeProject.projectId}`
                    });
                } catch (err) { console.error("Error creating expense:", err); }
            }
        }
    };

    const addMilestone = () => {
        const currentTotalPct = (activeProject?.milestones || []).reduce((s, m) => s + (parseFloat(m.percentage) || 0), 0);
        if (currentTotalPct >= 100) { toast.warning('Cannot add more payment stages: Total percentage is already 100%.'); return; }
        let defaultName = 'New Stage';
        try {
            const key    = activeProject?.type === 'Service' ? 'sales_stages_service' : 'sales_stages_product';
            const stored = localStorage.getItem(key);
            const stages = stored ? JSON.parse(stored) : null;
            if (stages && stages.length > 0) defaultName = stages[0].label;
        } catch { /* fallback */ }
        updateProject(p => ({ ...p, milestones: [...p.milestones, { id: Date.now(), name: defaultName, percentage: 0, status: 'Pending', invoiceDate: '', paidDate: '' }] }));
    };
    const removeMilestone = (id) => updateProject(p => ({ ...p, milestones: p.milestones.filter(m => m.id !== id) }));
    const updateMilestone  = (id, f, v) => updateProject(p => ({ ...p, milestones: p.milestones.map(m => m.id === id ? { ...m, ...(typeof f === 'object' ? f : { [f]: v }) } : m) }));

    const addCharge    = () => updateProject(p => ({ ...p, charges: [...p.charges, { id: Date.now(), name: 'Tax', taxType: 'Other', country: 'India', state: '', percentage: 0 }] }));
    const removeCharge = (id) => updateProject(p => ({ ...p, charges: p.charges.filter(c => c.id !== id) }));
    const updateCharge = (id, field, value) => updateProject(p => ({
        ...p, charges: p.charges.map(c => c.id === id ? { ...c, ...(typeof field === 'object' ? field : { [field]: value }) } : c)
    }));

    return (
        <div className="inv-root">
            {view === 'dashboard' ? (
                <Dashboard
                    projects={projects}
                    onOpenProject={id => { setActiveProjectId(id); setView('invoice'); }}
                    onCreateProject={handleCreateProject}
                    onDeleteProject={handleDeleteProject}
                    onStatusChange={(id, status) => setProjects(prev => prev.map(p => p.id === id ? { ...p, status, isArchived: status === 'Archived' } : p))}
                />
            ) : activeProject ? (
                <InvoiceMain
                    details={activeProject} updateDetails={updateDetails}
                    stakeholders={activeProject.stakeholders} addStakeholder={addStakeholder} removeStakeholder={removeStakeholder} updateStakeholder={updateStakeholder}
                    milestones={activeProject.milestones} addMilestone={addMilestone} removeMilestone={removeMilestone} updateMilestone={updateMilestone}
                    charges={activeProject.charges} addCharge={addCharge} removeCharge={removeCharge} updateCharge={updateCharge}
                    onSave={handleSaveProject}
                    onBack={() => { setView('dashboard'); setActiveProjectId(null); }}
                />
            ) : (
                <div className="inv-content">
                    <div className="inv-empty" style={{ padding: '60px 20px' }}>Project not found. <button className="inv-btn-back" style={{ marginTop: 12 }} onClick={() => setView('dashboard')}>← Back to Dashboard</button></div>
                </div>
            )}
        </div>
    );
};

export default ProjectTrackerComplete;
