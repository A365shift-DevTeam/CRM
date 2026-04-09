import React, { useState, useEffect, useRef } from 'react';
import { FaFilePdf } from "react-icons/fa6";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";
import { useLocation, useSearchParams } from 'react-router-dom';
import {
    Eye, LayoutDashboard, FileDown, Briefcase, MapPin, Globe, CreditCard, Building, Users,
    Plus, Trash2, ArrowLeft, DollarSign, FileText, ArrowRight, Filter, Wallet, CheckCircle, X, Save
} from 'lucide-react';
import ambotLogo from '../../assets/images/ambot logo.png';
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

// ==========================================
// 1. STYLES (Injected CSS)
// ==========================================
const TrackerStyles = () => (
    <style>{`
        /* ═══ Premium Invoice Theme (Apple Style) ═══ */
        .tracker-wrapper {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: #0F172A;
            min-height: 100vh;
            background: #F5F7FA;
            padding: 24px;
        }

        /* --- Global Utils --- */
        .text-dark { color: #1a1d21 !important; }
        .text-muted { color: #7b8794 !important; }
        .text-primary { color: #2980b9 !important; }
        .text-success { color: #27ae60 !important; }
        .text-danger { color: #e74c3c !important; }
        .text-warning { color: #f39c12 !important; }
        
        .fw-bold { font-weight: 700 !important; }
        .small { font-size: 0.875rem; }
        .font-monospace { font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace; }

        /* --- Buttons --- */
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.45rem 1rem;
            border-radius: 12px;
            font-weight: 600;
            font-size: 0.875rem;
            transition: all 0.25s ease;
            cursor: pointer;
            border: 1px solid transparent;
            letter-spacing: 0.01em;
        }
        .btn-sm { padding: 0.3rem 0.65rem; font-size: 0.8rem; }
        
        .btn-primary { background: linear-gradient(135deg, #2980b9, #3498db); color: white; border: none; box-shadow: 0 2px 8px rgba(41,128,185,0.3); }
        .btn-primary:hover { background: linear-gradient(135deg, #2471a3, #2e86c1); box-shadow: 0 4px 14px rgba(41,128,185,0.4); transform: translateY(-1px); }
        
        .btn-outline-primary { color: #2980b9; border-color: #2980b9; background: transparent; }
        .btn-outline-primary:hover { color: #fff; background: #2980b9; box-shadow: 0 2px 8px rgba(41,128,185,0.3); }

        .btn-outline-secondary { color: #7b8794; border-color: #cfd8dc; background: transparent; }
        .btn-outline-secondary:hover { color: #fff; background-color: #7b8794; }

        .btn-outline-success { color: #27ae60; border-color: #27ae60; background: transparent; }
        .btn-outline-success:hover { color: #fff; background-color: #27ae60; box-shadow: 0 2px 8px rgba(39,174,96,0.3); }

        .btn-outline-danger { color: #e74c3c; border-color: #e74c3c; background: transparent; }
        .btn-outline-danger:hover { color: #fff; background-color: #e74c3c; }

        .btn-dark { background: linear-gradient(135deg, #2c3e50, #34495e); color: white; border: none; }
        .btn-dark:hover { background: linear-gradient(135deg, #1a252f, #2c3e50); }

        .btn-white { background-color: rgba(255,255,255,0.95); color: #2c3e50; border: 1px solid rgba(255,255,255,0.3); backdrop-filter: blur(4px); font-weight: 600; }
        .btn-white:hover { background-color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

        .btn-link { background: none; border: none; padding: 0; text-decoration: none; }
        .btn-link:hover { text-decoration: underline; }

        /* --- Invoice Stage Cards --- */
        .invoice-view {
            max-width: 100%;
            margin: 0 auto;
        }

        .stage {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 20px;
            margin: 20px 0;
            overflow: hidden;
            color: #0F172A;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
            transition: 0.25s ease;
            position: relative;
        }
        .stage::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 5px;
            height: 100%;
            background: linear-gradient(180deg, #2980b9, #27ae60);
            border-radius: 16px 0 0 16px;
            z-index: 1;
        }
        .stage:hover {
            box-shadow: 0 12px 28px rgba(15, 23, 42, 0.1);
        }

        .bar {
            background: #000;
            padding: 14px 20px;
            font-weight: 700;
            font-size: 0.95rem;
            letter-spacing: 0.02em;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #fff;
            border: none;
            position: relative;
            z-index: 2;
        }

        .stage-p { padding: 20px 24px; }

        .grid-stage {
            display: grid;
            grid-template-columns: 180px 1fr 180px 1fr;
            gap: 14px 16px;
            align-items: center;
        }
        @media (max-width: 900px) { .grid-stage { grid-template-columns: 1fr; } }

        .stage-input, .stage-select {
            width: 100%;
            padding: 9px 12px;
            border: 1.5px solid #e2e8f0;
            border-radius: 10px;
            background: #f8fafc;
            color: #1a1d21;
            font-size: 0.875rem;
            transition: all 0.25s ease;
        }
        .stage-input:focus, .stage-select:focus {
            outline: none;
            border-color: #2980b9;
            background: #fff;
            box-shadow: 0 0 0 3px rgba(41,128,185,0.12);
        }
        .stage-input::placeholder { color: #a0aec0; }

        .stage-label { 
            font-weight: 600; 
            color: #4a5568; 
            font-size: 0.85rem;
            letter-spacing: 0.01em;
        }

        .stage-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 0.75rem; }
        .stage-table th { 
            background: linear-gradient(180deg, #f7f9fc 0%, #eef2f7 100%);
            color: #4a5568; 
            font-weight: 700; 
            font-size: 0.78rem; 
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 12px 14px;
            border-bottom: 2px solid #e2e8f0;
            border-top: none;
            border-left: none;
            border-right: none;
            white-space: nowrap;
        }
        .stage-table td { 
            border: none;
            border-bottom: 1px solid #f1f5f9; 
            padding: 12px 14px; 
            text-align: left; 
            vertical-align: middle; 
            font-size: 0.875rem;
            color: #334155;
        }
        .stage-table tbody tr { transition: background 0.15s ease; }
        .stage-table tbody tr:hover { background: #f8fafc; }
        .stage-table tbody tr:nth-child(even) { background: #fafbfd; }
        .stage-table tbody tr:nth-child(even):hover { background: #f0f4f8; }
        
        /* KPIs */
        .stage-kpi { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 1.25rem; }
        .stage-card { 
            background: linear-gradient(135deg, #ffffff, #f8fafc);
            border: 1.5px solid #e2e8f0; 
            border-radius: 14px; 
            padding: 16px 20px; 
            min-width: 200px; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.03);
            transition: all 0.25s ease;
            position: relative;
            overflow: hidden;
        }
        .stage-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: linear-gradient(180deg, #2980b9, #27ae60);
            border-radius: 4px 0 0 4px;
        }
        .stage-card:hover { 
            box-shadow: 0 4px 16px rgba(0,0,0,0.06);
            transform: translateY(-2px);
        }
        .stage-muted { color: #7b8794; font-size: 0.8rem; margin-bottom: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }
        .kpi-value { font-weight: 800; font-size: 1.2rem; color: #1a1d21; }

        /* --- Dashboard Cards (Apple Theme) --- */
        .dashboard-card {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 20px;
            overflow: hidden;
            height: 100%;
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
            transition: 0.25s ease;
        }
        .dashboard-card:hover { box-shadow: 0 12px 28px rgba(15, 23, 42, 0.1); transform: translateY(-2px); }
        .dashboard-card-body { padding: 1.5rem; }
        .dashboard-card-header {
            padding: 1rem 1.5rem;
            background: #fff;
            border-bottom: 1px solid #f1f5f9;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
         /* --- Tables (Light) --- */
        .table-custom {
            width: 100%;
            color: #1a1d21;
            border-collapse: separate;
            border-spacing: 0;
        }
        .table-custom th, .table-custom td {
            padding: 0.85rem 1rem;
            border-bottom: 1px solid #eef2f7;
        }
        .table-custom th {
            font-size: 0.72rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #7b8794;
            font-weight: 700;
            background-color: #f7f9fc;
        }
        .table-custom tr:hover { background-color: #f8fafc; cursor: pointer; }

        /* Utilities */
        .d-flex { display: flex; }
        .align-items-center { align-items: center; }
        .justify-content-center { justify-content: center; }
        .justify-content-between { justify-content: space-between; }
        .text-center { text-align: center; }
        .text-end { text-align: right; }
        .gap-1 { gap: 0.25rem; }
        .gap-2 { gap: 0.5rem; }
        .gap-3 { gap: 1rem; }
        .mb-1 { margin-bottom: 0.25rem; }
        .mb-3 { margin-bottom: 1rem; }
        .mb-4 { margin-bottom: 1.5rem; }
        .mb-5 { margin-bottom: 3rem; }
        .p-1 { padding: 0.25rem; }
        .p-2 { padding: 0.5rem; }
        .p-3 { padding: 1rem; }
        .rounded { border-radius: 0.5rem !important; }
        .rounded-circle { border-radius: 50% !important; }
        .bg-opacity-10 { --bs-bg-opacity: 0.1; }
        .bg-primary { background-color: rgba(41, 128, 185, var(--bs-bg-opacity, 1)) !important; }
        .bg-success { background-color: rgba(39, 174, 96, var(--bs-bg-opacity, 1)) !important; }
        .bg-danger { background-color: rgba(231, 76, 60, var(--bs-bg-opacity, 1)) !important; }
        .bg-warning { background-color: rgba(243, 156, 18, var(--bs-bg-opacity, 1)) !important; }
        
        .row { display: flex; flex-wrap: wrap; margin-right: -0.75rem; margin-left: -0.75rem; }
        .col-md-3, .col-md-4, .col-md-6, .col-md-8 { padding-right: 0.75rem; padding-left: 0.75rem; width: 100%; }
        @media (min-width: 768px) {
            .col-md-3 { flex: 0 0 25%; max-width: 25%; }
            .col-md-4 { flex: 0 0 33.333333%; max-width: 33.333333%; }
            .col-md-6 { flex: 0 0 50%; max-width: 50%; }
            .col-md-8 { flex: 0 0 66.666667%; max-width: 66.666667%; }
        }
        
        .btn-icon { 
            background: none; border: none; cursor: pointer; padding: 6px; 
            display: inline-flex; align-items: center; justify-content: center; 
            color: inherit; border-radius: 8px; transition: all 0.2s ease;
        }
        .btn-icon:hover { background: #f1f5f9; opacity: 0.9; }
    `}</style>
);

// ==========================================
// 2. UTILITY SERVICES (PDF & Excel)
// ==========================================

// PDF generation logic extracted to src/utils/pdfGenerator.js

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

    // Use Helper
    addPDFHeader(doc, "PROJECT FINANCIAL REPORT", details);

    // Context Info
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

    autoTable(doc, {
        startY: 110,
        body: summaryData,
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', width: 80 } }
    });

    let finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14); doc.text("Stakeholder Distribution", 14, finalY);

    const stakeholderBody = stakeholders.map(s => [
        s.name, `${s.percentage}%`, `${currency} ${(details.dealValue * s.percentage / 100).toLocaleString()}`
    ]);

    autoTable(doc, {
        startY: finalY + 5,
        head: [['Name / Role', 'Share %', 'Amount']],
        body: stakeholderBody,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] }
    });

    finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text("Invoicing Schedule", 14, finalY);

    const totalTaxRate = chargesList.reduce((sum, c) => sum + (parseFloat(c.percentage) || 0), 0);
    const invoiceBody = milestones.map(m => {
        const base = (details.dealValue * m.percentage) / 100;
        const tax = (base * totalTaxRate) / 100;
        const total = base + tax;
        return [
            m.name,
            `${m.percentage}%`,
            m.status,
            `${currency} ${base.toLocaleString()}`,
            `${currency} ${tax.toLocaleString()}`,
            `${currency} ${total.toLocaleString()}`
        ];
    });

    autoTable(doc, {
        startY: finalY + 5,
        head: [['Milestone', '%', 'Status', 'Base', 'Tax', 'Total']],
        body: invoiceBody,
        theme: 'grid',
        headStyles: { fillColor: [39, 174, 96] },
        styles: { fontSize: 9 }
    });

    // Footer Signatures
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

    autoTable(doc, {
        startY: 95, head: [['ID', 'Client', 'Value', 'Collected', 'Status']], body: tableBody, theme: 'striped', headStyles: { fillColor: [52, 73, 94] }
    });

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
        ["PROJECT FINANCIAL DASHBOARD"],
        ["Generated On", new Date().toLocaleString()],
        [],
        ["KEY METRICS"],
        ["Total Deal Value", details.dealValue],
        ["Currency", currency],
        ["Total Distributed", totalDistributed],
        ["Net Profit (Projected)", netProfit],
        ["Profit Margin", `${((netProfit / details.dealValue) * 100).toFixed(2)}%`],
        ["Total Invoiced", totalInvoiced],
        [],
        ["FINANCIAL CONFIGURATION"],
        ["Charges Applied", chargesBreakdown || "None"],
        ["Total Charge %", `${totalChargePct}%`],
        [],
        ["PROJECT DETAILS"],
        ["Project ID", details.projectId],
        ["Client", details.clientName],
        ["Delivery", details.delivery],
        ["Location", details.location]
    ];
    const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardData);
    wsDashboard['!cols'] = [{ wch: 25 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsDashboard, "Dashboard");

    const stakeholderHeader = ["Role / Name", "Share %", `Amount (${currency})`, "Payout Tax %"];
    const stakeholderData = stakeholders.map(s => [
        s.name, `${s.percentage}%`, (details.dealValue * s.percentage) / 100, `${s.payoutTax || 0}%`
    ]);
    const wsStakeholders = XLSX.utils.aoa_to_sheet([stakeholderHeader, ...stakeholderData]);
    wsStakeholders['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsStakeholders, "Stakeholders");

    const milestoneHeader = ["Milestone", "Percentage", "Status", `Base (${currency})`, `Tax/Charges (${currency})`, `Total (${currency})`];
    const milestoneData = milestones.map(m => {
        const base = (details.dealValue * m.percentage) / 100;
        const tax = (base * totalChargePct) / 100;
        const total = base + tax;
        return [m.name, `${m.percentage}%`, m.status, base, tax, total];
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
// 3. SUB COMPONENTS (Dashboard & Invoice)
// ==========================================

const Dashboard = ({ projects, onOpenProject, onCreateProject, onStatusChange, onDeleteProject }) => {
    const [filter, setFilter] = useState('All');
    const [chartMetric, setChartMetric] = useState('Revenue');
    const [displayCurrency, setDisplayCurrency] = useState('AED');

    // Global Labels (Sync with Sales Settings)
    const [projectTypes, setProjectTypes] = useState([
        localStorage.getItem('app_product_label') || 'Products',
        localStorage.getItem('app_service_label') || 'Services'
    ]);
    const [activeTypeIndex, setActiveTypeIndex] = useState(0);

    // Listen for storage changes to update labels dynamically
    useEffect(() => {
        const handleStorageChange = () => {
            setProjectTypes([
                localStorage.getItem('app_product_label') || 'Products',
                localStorage.getItem('app_service_label') || 'Services'
            ]);
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Currency Conversion
    const [dashboardCurrency, setDashboardCurrency] = useState('AED');
    const [exchangeRates, setExchangeRates] = useState({
        'AED': 1,
        'USD': 0.2722, // Fallback
        'INR': 22.6    // Fallback
    });

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const response = await fetch('https://api.exchangerate-api.com/v4/latest/AED');
                if (!response.ok) throw new Error('Failed to fetch rates');
                const data = await response.json();
                setExchangeRates(prev => ({ ...prev, ...data.rates }));
            } catch (error) {
                console.error('Error fetching exchange rates:', error);
            }
        };
        fetchRates();
    }, []);

    const convertToAED = (amount, currency) => {
        const rate = exchangeRates[currency];
        if (!rate) return amount;
        return amount / rate;
    };

    const convertFromAED = (amountInAED, targetCurrency) => {
        const rate = exchangeRates[targetCurrency] || 1;
        return amountInAED * rate;
    };

    const convertCurrency = (amount, fromCurrency, toCurrency) => {
        if (!amount) return 0;
        if (fromCurrency === toCurrency) return amount;

        // 1. Normalize to Base (AED)
        const inAED = fromCurrency === 'AED' ? amount : convertToAED(amount, fromCurrency);

        // 2. Convert to Target
        return toCurrency === 'AED' ? inAED : convertFromAED(inAED, toCurrency);
    };

    // Filter Logic
    const filteredProjects = projects.filter(p => {
        if (filter === 'All') return true;
        const pDate = new Date(p.dateCreated);
        const now = new Date();
        if (filter === 'Yearly') return pDate.getFullYear() === now.getFullYear();
        if (filter === 'Monthly') return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
        if (filter === 'Weekly') {
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(now.getDate() - 7);
            return pDate >= sevenDaysAgo && pDate <= now;
        }
        return true;
    });

    // KPI Calcs (Converted)
    const totalRevenue = filteredProjects.reduce((sum, p) => sum + convertCurrency((parseFloat(p.dealValue) || 0), p.currency, dashboardCurrency), 0);
    const activeProjects = filteredProjects.filter(p => !p.isArchived).length;

    // Splits (Calculated per stakeholder and converted)
    const totalSplits = filteredProjects.reduce((sum, p) => {
        const projectSplits = p.stakeholders.reduce((sSum, s) => sSum + ((parseFloat(p.dealValue) || 0) * s.percentage) / 100, 0);
        return sum + convertCurrency(projectSplits, p.currency, dashboardCurrency);
    }, 0);

    // Collected (Calculated per milestone and converted)
    const totalCollected = filteredProjects.reduce((sum, p) => {
        const projectCollected = p.milestones.reduce((mSum, m) => m.status === 'Paid' ? mSum + ((p.dealValue * m.percentage) / 100) : mSum, 0);
        return sum + convertCurrency(projectCollected, p.currency, dashboardCurrency);
    }, 0);

    // Tax (Calculated per project and converted)
    const totalTax = filteredProjects.reduce((sum, p) => {
        const tRate = p.charges ? p.charges.reduce((cSum, c) => cSum + (parseFloat(c.percentage) || 0), 0) : 0;
        const projectTax = (parseFloat(p.dealValue) || 0) * tRate / 100;
        return sum + convertCurrency(projectTax, p.currency, dashboardCurrency);
    }, 0);

    const chartData = filteredProjects.map(p => {
        // Safe helpers
        const dVal = parseFloat(p.dealValue) || 0;
        const convertedDVal = convertCurrency(dVal, p.currency, dashboardCurrency);
        const totalTaxRate = p.charges ? p.charges.reduce((sum, c) => sum + (parseFloat(c.percentage) || 0), 0) : 0;

        let val = 0;
        if (chartMetric === 'Revenue') val = convertedDVal;
        else if (chartMetric === 'Splits') val = p.stakeholders.reduce((sSum, s) => sSum + ((convertedDVal * s.percentage) / 100), 0);
        else if (chartMetric === 'Collected') val = p.milestones.reduce((mSum, m) => m.status === 'Paid' ? mSum + ((convertedDVal * m.percentage) / 100) : mSum, 0);
        else if (chartMetric === 'Tax') val = (convertedDVal * totalTaxRate) / 100;

        return {
            name: p.projectId,
            value: val
        };
    });

    const statusData = [{ name: 'Active', value: activeProjects }, { name: 'Completed', value: filteredProjects.length - activeProjects }];
    const COLORS = ['#0d6efd', '#198754', '#ffc107', '#dc3545'];

    return (
        <div className="container-fluid px-5 py-4">
            {/* Header */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-5 gap-3">
                <div>
                    <h2 className="fw-bold text-dark mb-1">Project Dashboard</h2>
                    <p className="text-muted m-0">Overview of all financial projects</p>
                </div>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                    {/* Date Filter Dropdown */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #dee2e6', borderRadius: '8px', padding: '6px 14px', height: '38px', whiteSpace: 'nowrap' }}>
                        <Filter size={16} style={{ color: '#6c757d', flexShrink: 0 }} />
                        <select
                            style={{ border: 'none', background: 'transparent', fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer', outline: 'none', appearance: 'auto', color: '#212529', paddingRight: '4px' }}
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        >
                            <option value="All">All Time</option>
                            <option value="Yearly">This Year</option>
                            <option value="Monthly">This Month</option>
                            <option value="Weekly">This Week</option>
                        </select>
                    </div>

                    {/* Currency Dropdown */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', background: '#fff', border: '1px solid #dee2e6', borderRadius: '8px', padding: '6px 14px', height: '38px', whiteSpace: 'nowrap' }}>
                        <select
                            style={{ border: 'none', background: 'transparent', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', outline: 'none', appearance: 'auto', color: '#212529', paddingRight: '4px' }}
                            value={dashboardCurrency}
                            onChange={(e) => setDashboardCurrency(e.target.value)}
                        >
                            <option value="AED">AED</option>
                            <option value="USD">USD</option>
                            <option value="INR">INR</option>
                        </select>
                    </div>

                    <button className="btn btn-primary" onClick={onCreateProject} style={{ whiteSpace: 'nowrap' }}><Plus size={18} /> New Project</button>
                    <button className="btn btn-outline-success" onClick={() => exportDashboardExcel(filteredProjects, filter)} style={{ whiteSpace: 'nowrap' }}><FileDown size={16} /> Export</button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="row mb-5">
                <div className="dashboard-card col-md-3">
                    <div className="dashboard-card-body">
                        <div className="d-flex justify-content-between mb-3">
                            <div><p className="text-muted small mb-1">Total Revenue</p><h3 className="text-dark fw-bold m-0">{dashboardCurrency} {totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3></div>
                            <div className="p-2 bg-success bg-opacity-10 rounded"><DollarSign className="text-success" size={24} /></div>
                        </div>
                    </div>
                </div>
                {/* Total Tax Card */}
                <div className="dashboard-card col-md-3">
                    <div className="dashboard-card-body">
                        <div className="d-flex justify-content-between mb-3">
                            <div><p className="text-muted small mb-1">Project Tax</p><h3 className="text-dark fw-bold m-0">{dashboardCurrency} {totalTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3></div>
                            <div className="p-2 bg-warning bg-opacity-10 rounded"><Building className="text-warning" size={24} /></div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-card col-md-3">
                    <div className="dashboard-card-body">
                        <div className="d-flex justify-content-between mb-3">
                            <div><p className="text-muted small mb-1">Total Splits</p><h3 className="text-dark fw-bold m-0">{dashboardCurrency} {totalSplits.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3></div>
                            <div className="p-2 bg-danger bg-opacity-10 rounded"><Users className="text-danger" size={24} /></div>
                        </div>
                    </div>
                </div>
                <div className="dashboard-card col-md-3">
                    <div className="dashboard-card-body">
                        <div className="d-flex justify-content-between mb-3">
                            <div><p className="text-muted small mb-1">Total Collected</p><h3 className="text-dark fw-bold m-0">{dashboardCurrency} {totalCollected.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3></div>
                            <div className="p-2 bg-primary bg-opacity-10 rounded"><Wallet className="text-primary" size={24} /></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="row mb-5">
                <div className="col-md-8 mb-4">
                    <div className="dashboard-card">
                        <div className="dashboard-card-header d-flex justify-content-between align-items-center">
                            <h5 className="text-dark m-0">{chartMetric} by Project</h5>
                            <select
                                className="form-select form-select-sm"
                                style={{ width: 'auto', border: '1px solid #ced4da' }}
                                value={chartMetric}
                                onChange={(e) => setChartMetric(e.target.value)}
                            >
                                <option value="Revenue">Deal Value</option>
                                <option value="Tax">Tax</option>
                                <option value="Splits">Split</option>
                                <option value="Collected">Collected</option>
                            </select>
                        </div>
                        <div className="dashboard-card-body" style={{ height: 300, position: 'relative' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis dataKey="name" stroke="#6c757d" />
                                    <YAxis stroke="#6c757d" />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#dee2e6', color: '#212529' }} />
                                    <Bar dataKey="value" fill="#0d6efd" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 mb-4">
                    <div className="dashboard-card">
                        <div className="dashboard-card-header"><h5 className="text-dark m-0">Status Distribution</h5></div>
                        <div className="dashboard-card-body" style={{ height: 300, position: 'relative' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#dee2e6', color: '#212529' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Project List */}
            <div className="dashboard-card">
                <div className="dashboard-card-header"><h5 className="text-dark m-0">Recent Projects</h5></div>
                <div className="table-responsive">
                    <table className="table-custom">
                        <thead>
                            <tr>
                                <th>Project Name</th><th>Client</th><th>Deal Value</th><th>Project Tax</th><th>Collected</th><th>Status</th><th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProjects.map(project => {
                                const collected = project.milestones.reduce((sum, m) => m.status === 'Paid' ? sum + ((project.dealValue * m.percentage) / 100) : sum, 0);
                                const totalTaxRate = project.charges ? project.charges.reduce((cSum, c) => cSum + (parseFloat(c.percentage) || 0), 0) : 0;
                                const totalProjectTax = (parseFloat(project.dealValue) || 0) * totalTaxRate / 100;

                                return (
                                    <tr key={project.id} onClick={() => onOpenProject(project.id)}>
                                        <td><div className="fw-bold text-dark">{project.projectId}</div></td>
                                        <td>{project.clientName}</td>
                                        <td className="font-monospace text-dark fw-bold">{project.currency} {parseFloat(project.dealValue).toLocaleString()}</td>
                                        <td className="font-monospace text-muted">{project.currency} {totalProjectTax.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                        <td className="font-monospace text-warning">{project.currency} {collected.toLocaleString()}</td>
                                        <td>
                                            <select
                                                className="form-select form-select-sm"
                                                style={{ width: 'auto', minWidth: '110px', cursor: 'pointer', border: '1px solid #ced4da', borderRadius: '4px', fontSize: '0.85rem' }}
                                                value={project.status || 'Active'}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    onStatusChange(project.id, e.target.value);
                                                }}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Completed">Completed</option>
                                                <option value="On Hold">Hold</option>
                                                <option value="Archived">Archived</option>
                                            </select>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-1 justify-content-center">
                                                <button className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', padding: 0, borderRadius: '6px' }} onClick={(e) => { e.stopPropagation(); onOpenProject(project.id); }} title="View Project">
                                                    <Eye size={16} />
                                                </button>
                                                <button className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', padding: 0, borderRadius: '6px' }} onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }} title="Delete Project">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>

                                    </tr>
                                );
                            })}
                            {filteredProjects.length === 0 && <tr><td colSpan="7" className="text-center py-4 text-muted">No projects found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const STAKEHOLDERS_CONSTANTS = {
    COUNTRIES: ['India', 'Other'],
    INDIAN_STATES: [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
        'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
        'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
        'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
        'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
        'Lakshadweep', 'Puducherry'
    ]
};

const BusinessDetails = ({ details, updateDetails, charges, addCharge, removeCharge, updateCharge }) => {
    const currency = details.currency || 'AED';
    const dealValue = parseFloat(details.dealValue) || 0;
    const totalChargePct = charges ? charges.reduce((sum, c) => sum + (parseFloat(c.percentage) || 0), 0) : 0;
    const totalChargeAmt = charges ? charges.reduce((sum, c) => sum + ((dealValue * (parseFloat(c.percentage) || 0)) / 100), 0) : 0;

    // Tax Calculation Logic
    const handleTaxChange = (id, field, value, currentCharge) => {
        let updates = { [field]: value };

        let currentCountry = field === 'country' ? value : (currentCharge.country || 'India');
        let currentState = field === 'state' ? value : (currentCharge.state || '');

        // 1. Handle Country Change
        if (field === 'country') {
            if (value === 'Other') {
                updates.country = ''; // Clear country to trigger input mode based on UI logic
                updates.state = '';

                // Export Nil Rate only if received in convertible foreign exchange (i.e., NOT INR)
                if (currency !== 'INR') {
                    updates.taxType = 'Export (Nil Rate)';
                    updates.percentage = 0;
                    updates.name = 'Export (Nil)';
                } else {
                    // Fallback for INR Export (likely treated as Inter-State/IGST or effective tax)
                    updates.taxType = 'Inter-State (IGST)';
                    updates.percentage = 18;
                    updates.name = 'IGST';
                }
            } else if (value === 'India') {
                updates.country = 'India';
            } else {
                // Manual input case
                if (value !== 'India') {
                    updates.state = '';
                    if (currency !== 'INR') {
                        updates.taxType = 'Export (Nil Rate)';
                        updates.percentage = 0;
                        updates.name = 'Export (Nil)';
                    } else {
                        updates.taxType = 'Inter-State (IGST)';
                        updates.percentage = 18;
                        updates.name = 'IGST';
                    }
                }
            }
        }

        // 2. Handle State Change (Only if Country is India)
        if (field === 'state' && (currentCountry === 'India' || !currentCountry)) { // Default to India logic if undefined
            if (value === 'Tamil Nadu') {
                updates.taxType = 'Intra-State (CGST + SGST)';
                updates.percentage = 18;
                updates.name = 'GST (Intra)';
            } else if (value) {
                updates.taxType = 'Inter-State (IGST)';
                updates.percentage = 18;
                updates.name = 'IGST';
            }
        }

        // 3. Handle Tax Type Change (Manual Override or Reset)
        if (field === 'taxType') {
            if (value === '') {
                // Reset logic: Recalculate based on existing Country/State
                if (currentCountry === 'Other' || (currentCountry && currentCountry !== 'India')) {
                    if (currency !== 'INR') {
                        updates.taxType = 'Export (Nil Rate)';
                        updates.percentage = 0;
                        updates.name = 'Export (Nil)';
                    } else {
                        updates.taxType = 'Inter-State (IGST)';
                        updates.percentage = 18;
                        updates.name = 'IGST';
                    }
                } else if (currentCountry === 'India') {
                    if (currentState === 'Tamil Nadu') { // Use currentState which is grounded in currentCharge
                        updates.taxType = 'Intra-State (CGST + SGST)';
                        updates.percentage = 18;
                        updates.name = 'GST (Intra)';
                    } else if (currentState) {
                        updates.taxType = 'Inter-State (IGST)';
                        updates.percentage = 18;
                        updates.name = 'IGST';
                    } else {
                        updates.taxType = ''; // No state selected? Reset.
                        updates.percentage = 0;
                        updates.name = 'Tax';
                    }
                }
            } else if (value === 'Export (Nil Rate)') {
                updates.percentage = 0;
                updates.country = 'International';
                updates.state = '';
                updates.name = 'Export (Nil)';
            } else if (value === 'Intra-State (CGST + SGST)') {
                updates.percentage = 18;
                updates.country = 'India';
                updates.state = 'Tamil Nadu';
                updates.name = 'GST (Intra)';
            } else if (value === 'Inter-State (IGST)') {
                updates.percentage = 18;
                updates.country = 'India';
                updates.name = 'IGST';
            } else if (value === 'Other') {
                updates.name = 'Tax';
            }
        }

        // Apply all updates
        updateCharge(id, updates);
    };

    return (
        <div className="stage">
            <div className="bar">Stage 1 — Business Details & Finance Charges</div>
            <div className="stage-p">
                <div className="grid-stage mb-4">
                    <label className="stage-label">Project ID</label>
                    <input className="stage-input" value={details.projectId} onChange={(e) => updateDetails('projectId', e.target.value)} />
                    <label className="stage-label">Client Name</label>
                    <input className="stage-input" value={details.clientName} onChange={(e) => updateDetails('clientName', e.target.value)} />
                    <label className="stage-label">Client Address</label>
                    <input className="stage-input" value={details.clientAddress || ''} onChange={(e) => updateDetails('clientAddress', e.target.value)} placeholder="Client billing address" />
                    <label className="stage-label">Client GSTIN</label>
                    <input className="stage-input" value={details.clientGstin || ''} onChange={(e) => updateDetails('clientGstin', e.target.value)} placeholder="e.g. 29ABCDE1234F1Z5" />
                    <label className="stage-label">Delivery</label>
                    <input className="stage-input" value={details.delivery || ''} onChange={(e) => updateDetails('delivery', e.target.value)} placeholder="Ambot365" />
                    <label className="stage-label">Billing Location</label>
                    <input className="stage-input" value={details.location} onChange={(e) => updateDetails('location', e.target.value)} />
                    <label className="stage-label">Deal Value</label>
                    <input type="number" className="stage-input" value={details.dealValue} onChange={(e) => updateDetails('dealValue', e.target.value)} />
                    <label className="stage-label">Currency</label>
                    <select className="stage-select" value={details.currency} onChange={(e) => updateDetails('currency', e.target.value)}>
                        <option value="AED">AED</option><option value="USD">USD</option><option value="INR">INR</option>
                    </select>
                    <label className="stage-label">Lead GST (%)</label>
                    <input type="number" className="stage-input" value={details.leadGst || ''} onChange={(e) => updateDetails('leadGst', e.target.value)} placeholder="e.g. 18" />
                    <label className="stage-label">Currency Value</label>
                    <input type="number" className="stage-input" value={details.currencyValue || ''} onChange={(e) => updateDetails('currencyValue', e.target.value)} placeholder="e.g. 83.50" />
                </div>

                {/* Finance Charges Section */}
                <div className="d-flex justify-content-between align-items-center mb-3 border-top pt-4">
                    <h6 className="fw-bold m-0 text-muted">Finance Charges (GST / Tax)</h6>
                    <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onClick={addCharge}>
                        <Plus size={14} /> Add Tax
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="stage-table">
                        <thead>
                            <tr>
                                <th style={{ width: '200px' }}>Tax Type</th>
                                <th>Country</th>
                                <th>State</th>
                                <th style={{ width: '100px' }}>%</th>
                                <th>Amount ({currency})</th>
                                <th style={{ width: '50px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {charges && charges.map(c => (
                                <tr key={c.id}>
                                    <td>
                                        {c.taxType === 'Other' ? (
                                            <div className="d-flex gap-1 align-items-center">
                                                <input
                                                    className="stage-input"
                                                    value={c.name}
                                                    onChange={(e) => updateCharge(c.id, 'name', e.target.value)}
                                                    placeholder="Tax Name"
                                                    autoFocus
                                                />
                                                <button
                                                    className="btn btn-sm btn-light border d-flex align-items-center justify-content-center"
                                                    onClick={() => handleTaxChange(c.id, 'taxType', '', c)}
                                                    title="Reset"
                                                    style={{ width: '30px', height: '30px', padding: 0 }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <select
                                                className="stage-select"
                                                value={c.taxType || ''}
                                                onChange={(e) => handleTaxChange(c.id, 'taxType', e.target.value, c)}
                                            >
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
                                            <div className="d-flex gap-1 align-items-center">
                                                <input
                                                    className="stage-input"
                                                    value={c.country}
                                                    onChange={(e) => handleTaxChange(c.id, 'country', e.target.value, c)}
                                                    placeholder="Country Name"
                                                    autoFocus
                                                />
                                                <button
                                                    className="btn btn-sm btn-light border d-flex align-items-center justify-content-center"
                                                    onClick={() => handleTaxChange(c.id, 'country', 'India', c)}
                                                    title="Reset to India"
                                                    style={{ width: '30px', height: '30px', padding: 0 }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <select
                                                className="stage-select"
                                                value={c.country || 'India'}
                                                onChange={(e) => {
                                                    if (e.target.value === 'Other') {
                                                        handleTaxChange(c.id, 'country', 'Other', c);
                                                    } else {
                                                        handleTaxChange(c.id, 'country', e.target.value, c);
                                                    }
                                                }}
                                                disabled={c.taxType === 'Other'}
                                            >
                                                {STAKEHOLDERS_CONSTANTS.COUNTRIES.map(country => (
                                                    <option key={country} value={country}>{country}</option>
                                                ))}
                                            </select>
                                        )}
                                    </td>
                                    <td>
                                        <select
                                            className="stage-select"
                                            value={c.state || ''}
                                            onChange={(e) => handleTaxChange(c.id, 'state', e.target.value, c)}
                                            disabled={(c.country || 'India') !== 'India' || c.taxType === 'Other'}
                                        >
                                            <option value="">Select State</option>
                                            {STAKEHOLDERS_CONSTANTS.INDIAN_STATES.map(state => (
                                                <option key={state} value={state}>{state}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            className="stage-input"
                                            value={c.percentage}
                                            onChange={(e) => handleTaxChange(c.id, 'percentage', e.target.value, c)}
                                            disabled={c.taxType !== 'Other'}
                                        />
                                    </td>
                                    <td className="font-monospace">{currency} {(dealValue * c.percentage / 100).toLocaleString()}</td>
                                    <td><button className="btn-link text-danger" onClick={() => removeCharge(c.id)}><Trash2 size={16} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th colSpan="3">Total Tax Liability</th>
                                <th>{totalChargePct.toFixed(2)}%</th>
                                <th>{currency} {totalChargeAmt.toLocaleString()}</th>
                                <th></th>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StageTwoCombined = ({ stakeholders, addStakeholder, removeStakeholder, updateStakeholder, dealValue, currency }) => {
    const totalPct = stakeholders.reduce((sum, s) => sum + (parseFloat(s.percentage) || 0), 0);
    const totalAmt = stakeholders.reduce((sum, s) => sum + ((dealValue * (parseFloat(s.percentage) || 0)) / 100), 0);

    return (
        <div className="stage">
            <div className="bar">
                <span>Stage 2 — Project Splits</span>
                <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-white d-flex align-items-center gap-1" onClick={addStakeholder}>
                        <Plus size={14} />Splits
                    </button>
                </div>
            </div>
            <div className="stage-p">
                <table className="stage-table">
                    <thead>
                        <tr>
                            <th>Party</th><th style={{ width: '150px' }}>%</th><th>Amount ({currency})</th><th style={{ width: '50px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {stakeholders.map((stakeholder) => {
                            const value = (dealValue * stakeholder.percentage) / 100;
                            return (
                                <tr key={stakeholder.id}>
                                    <td>
                                        <input className="stage-input" value={stakeholder.name} onChange={(e) => updateStakeholder(stakeholder.id, 'name', e.target.value)} placeholder="e.g. Lead / Investor" />
                                    </td>
                                    <td>
                                        <input type="number" className="stage-input" value={stakeholder.percentage} onChange={(e) => updateStakeholder(stakeholder.id, 'percentage', e.target.value)} />
                                    </td>
                                    <td className="font-monospace">{currency} {value.toLocaleString()}</td>
                                    <td className="text-center">
                                        <button className="btn-icon text-danger" onClick={() => removeStakeholder(stakeholder.id)}><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            );
                        })}
                        {stakeholders.length === 0 && <tr><td colSpan="4" className="text-center text-muted p-3">No parties added.</td></tr>}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th>Total</th><th>{totalPct.toFixed(2)}%</th><th>{currency} {totalAmt.toLocaleString()}</th><th></th>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

const PaymentMilestones = ({ milestones, addMilestone, removeMilestone, updateMilestone, dealValue, details, taxes, projectType }) => {
    const paidMilestones = milestones.filter(m => m.status === 'Paid');
    const totalPaid = paidMilestones.reduce((sum, m) => sum + ((dealValue * m.percentage) / 100), 0);
    const paidPct = dealValue ? ((totalPaid / dealValue) * 100) : 0;

    const [projectTypes, setProjectTypes] = useState([
        localStorage.getItem('app_product_label') || 'Products',
        localStorage.getItem('app_service_label') || 'Services'
    ]);
    const [activeTypeIndex, setActiveTypeIndex] = useState(0);
    const [openInvoiceMenu, setOpenInvoiceMenu] = useState(null);

    // Load sales pipeline stages from localStorage based on project type
    const getDefaultStages = () => [
        { id: 0, label: 'Demo' }, { id: 1, label: 'Proposal' }, { id: 2, label: 'Negotiation' },
        { id: 3, label: 'Approval' }, { id: 4, label: 'Won' }, { id: 5, label: 'Closed' }, { id: 6, label: 'Lost' }
    ];
    const getStagesForType = (type) => {
        try {
            const storageKey = type === 'Service' ? 'sales_stages_service' : 'sales_stages_product';
            const stored = localStorage.getItem(storageKey);
            return stored ? JSON.parse(stored) : getDefaultStages();
        } catch { return getDefaultStages(); }
    };
    const [salesStages, setSalesStages] = useState(() => getStagesForType(projectType));

    // Re-load stages when projectType changes
    useEffect(() => {
        setSalesStages(getStagesForType(projectType));
    }, [projectType]);

    useEffect(() => {
        const handleStorageChange = () => {
            setProjectTypes([
                localStorage.getItem('app_product_label') || 'Products',
                localStorage.getItem('app_service_label') || 'Services'
            ]);
            // Refresh sales stages for current project type
            setSalesStages(getStagesForType(projectType));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [projectType]);

    const calculateAgeing = (invoiceDate, paidDate) => {
        if (!invoiceDate) return '-';
        const start = new Date(invoiceDate);
        const end = paidDate ? new Date(paidDate) : new Date();
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Determine Tax Type (Intra vs Inter)
    const isIntraState = taxes && taxes.some(t => t.taxType === 'Intra-State (CGST + SGST)');
    const totalTaxRate = taxes && taxes.length > 0 ? taxes.reduce((sum, t) => sum + (parseFloat(t.percentage) || 0), 0) : 18;

    return (
        <div className="stage">
            <div className="bar">
                <span>Stage 3 — Invoice Cycle</span>
                <button className="btn btn-sm btn-white d-flex align-items-center gap-1" onClick={addMilestone}>
                    <Plus size={14} />Payment
                </button>
            </div>
            <div className="stage-p">
                <div className="stage-kpi">
                    <div className="stage-card">
                        <div className="stage-muted">Total Paid</div>
                        <div className="kpi-value">{details.currency} {totalPaid.toLocaleString()}</div>
                    </div>
                    <div className="stage-card">
                        <div className="stage-muted">Status (Paid %)</div>
                        <div className="kpi-value">{paidPct.toFixed(2)}%</div>
                    </div>
                </div>

                <div className="table-responsive" style={{ overflowX: 'auto' }}>
                    <table className="stage-table" style={{ minWidth: '1100px', width: '100%' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '160px' }}>Payment</th>
                                <th style={{ width: '80px', textAlign: 'center' }}>Value %</th>
                                <th style={{ width: '130px' }}>Inv Date</th>
                                <th style={{ width: '110px', textAlign: 'right' }}>Base ({details.currency})</th>

                                {isIntraState ? (
                                    <>
                                        <th style={{ width: '90px', textAlign: 'right' }}>CGST</th>
                                        <th style={{ width: '90px', textAlign: 'right' }}>SGST</th>
                                    </>
                                ) : (
                                    <th style={{ width: '90px', textAlign: 'right' }}>GST</th>
                                )}

                                <th style={{ width: '120px', textAlign: 'right' }}>Total ({details.currency})</th>
                                <th style={{ width: '130px' }}>Paid Date</th>
                                <th style={{ width: '110px', textAlign: 'right' }}>Paid ({details.currency})</th>
                                <th style={{ width: '70px', textAlign: 'center' }}>Ageing</th>
                                <th style={{ width: '110px' }}>Status</th>
                                <th style={{ width: '160px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {milestones.map((milestone, index) => {
                                const raisedAmount = (dealValue * milestone.percentage) / 100;
                                const taxAmount = (raisedAmount * totalTaxRate) / 100;
                                const totalAmount = raisedAmount + taxAmount;

                                return (
                                    <tr key={milestone.id}>
                                        <td>
                                            {milestone.isCustomName ? (
                                                <div className="d-flex gap-1 align-items-center">
                                                    <input className="stage-input" value={milestone.name} onChange={(e) => updateMilestone(milestone.id, 'name', e.target.value)} placeholder="Custom name" autoFocus />
                                                    <button
                                                        className="btn btn-sm btn-light border d-flex align-items-center justify-content-center"
                                                        onClick={() => updateMilestone(milestone.id, { isCustomName: false, name: salesStages[0]?.label || 'New Stage' })}
                                                        title="Switch to dropdown"
                                                        style={{ width: '28px', height: '28px', padding: 0, flexShrink: 0 }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <select
                                                    className="stage-select"
                                                    value={salesStages.some(s => s.label === milestone.name) ? milestone.name : ''}
                                                    onChange={(e) => {
                                                        if (e.target.value === '__custom__') {
                                                            updateMilestone(milestone.id, { isCustomName: true, name: '' });
                                                        } else {
                                                            updateMilestone(milestone.id, 'name', e.target.value);
                                                        }
                                                    }}
                                                >
                                                    <option value="" disabled>Select Stage</option>
                                                    {salesStages.map(s => (
                                                        <option key={s.id} value={s.label}>{s.label}</option>
                                                    ))}
                                                    <option value="__custom__">✏️ Custom</option>
                                                </select>
                                            )}
                                        </td>
                                        <td>
                                            <input type="number" className="stage-input text-end" value={milestone.percentage} onChange={(e) => updateMilestone(milestone.id, 'percentage', e.target.value)} />
                                        </td>
                                        <td>
                                            <input type="date" className="stage-input p-1" value={milestone.invoiceDate || ''} onChange={(e) => updateMilestone(milestone.id, 'invoiceDate', e.target.value)} />
                                        </td>
                                        <td className="text-end">{raisedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>

                                        {isIntraState ? (
                                            <>
                                                <td className="text-end">{(taxAmount / 2).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="text-end">{(taxAmount / 2).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            </>
                                        ) : (
                                            <td className="text-end">{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        )}

                                        <td className="text-end">{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>

                                        <td>
                                            <input type="date" className="stage-input p-1" value={milestone.paidDate || ''} onChange={(e) => updateMilestone(milestone.id, 'paidDate', e.target.value)} />
                                        </td>
                                        <td className="text-end">{raisedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="text-center">
                                            {calculateAgeing(milestone.invoiceDate, milestone.paidDate)}
                                        </td>

                                        <td>
                                            <select
                                                className="stage-select p-1"
                                                value={milestone.status || 'Pending'}
                                                onChange={(e) => updateMilestone(milestone.id, 'status', e.target.value)}
                                                style={{
                                                    borderColor: milestone.status === 'Paid' ? '#198754' : '#ccc',
                                                    color: milestone.status === 'Paid' ? '#198754' : '#000'
                                                }}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Raised">Raised</option>
                                                <option value="Paid">Paid</option>
                                                <option value="Overdue">Overdue</option>
                                            </select>
                                        </td>
                                        <td className="text-center">
                                            <div className="d-flex justify-content-center gap-1">
                                                <select
                                                    className="stage-select p-1"
                                                    style={{ fontSize: '12px', width: 'auto', minWidth: '130px', cursor: 'pointer' }}
                                                    value=""
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === 'investor') generateInvestorPaymentPDF(milestone, details, taxes);
                                                        else if (val === 'client') generateInvoicePDF(milestone, details, taxes);
                                                        else if (val === 'tax') generateTaxInvoicePDF(milestone, details, taxes);
                                                        e.target.value = '';
                                                    }}
                                                >
                                                    <option value="">Download</option>
                                                    <option value="investor">Payment to Investor</option>
                                                    <option value="client">Proforma Invoice</option>
                                                    <option value="tax">Tax Invoice</option>
                                                </select>
                                                <button className="btn-icon text-danger" onClick={() => removeMilestone(milestone.id)} title="Delete Item">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {milestones.length === 0 && <tr><td colSpan={isIntraState ? "10" : "9"} className="text-center text-muted p-3">No payments added.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};



const InvoiceMain = ({ details, updateDetails, stakeholders, addStakeholder, removeStakeholder, updateStakeholder, milestones, addMilestone, removeMilestone, updateMilestone, charges, addCharge, removeCharge, updateCharge, onSave }) => {
    const dVal = parseFloat(details.dealValue) || 0;
    const totalChargePct = charges ? charges.reduce((sum, c) => sum + (parseFloat(c.percentage) || 0), 0) : 0;
    const totalChargeAmt = charges ? charges.reduce((sum, c) => sum + ((dVal * (parseFloat(c.percentage) || 0)) / 100), 0) : 0;

    return (
        <div className="invoice-view">
            <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-white rounded shadow-sm border">
                <div className="d-flex align-items-center gap-3">
                    <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '44px', height: '44px', minWidth: '44px' }}><LayoutDashboard size={22} className="text-primary" /></div>
                    <div><h4 className="m-0 fw-bold">Deal Finance Tracker</h4><span className="text-muted small">Professional Financial Management</span></div>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-primary d-flex align-items-center gap-2" onClick={onSave} title="Save Project">
                        <Save size={18} /> Save
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => generateProjectReportPDF(details, stakeholders, milestones, charges)} title="Download PDF Report"><FaFilePdf size={20} /></button>
                    <button className="btn btn-sm btn-outline-success" onClick={() => exportProjectReport(details, stakeholders, milestones, charges)} title="Export to Excel"><PiMicrosoftExcelLogoFill size={20} /></button>
                </div>
            </div>

            {/* Stage 1 */}
            <BusinessDetails
                details={details}
                updateDetails={updateDetails}
                charges={charges}
                addCharge={addCharge}
                removeCharge={removeCharge}
                updateCharge={updateCharge}
            />

            {/* Stage 2: Project Splits */}
            <StageTwoCombined
                stakeholders={stakeholders}
                addStakeholder={addStakeholder}
                removeStakeholder={removeStakeholder}
                updateStakeholder={updateStakeholder}
                dealValue={dVal}
                currency={details.currency}
            />

            {/* Stage 3: Invoice Cycle */}
            <PaymentMilestones milestones={milestones} addMilestone={addMilestone} removeMilestone={removeMilestone} updateMilestone={updateMilestone} dealValue={dVal} details={details} taxes={charges} projectType={details.type} />

            {/* Stage 4: Payment Process */}
            <div className="stage">
                <div className="bar">Stage 4 — Payment Process</div>
                <div className="stage-p">
                    <div className="table-responsive" style={{ overflowX: 'auto' }}>
                        <table className="stage-table" style={{ minWidth: '1200px', width: '100%' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '180px' }}>Party</th>
                                    <th style={{ width: '90px' }}>Value %</th>
                                    <th style={{ width: '140px' }}>Pay ({details.currency})</th>
                                    <th style={{ width: '100px' }}>GST %</th>
                                    <th style={{ width: '120px' }}>GST Amt</th>
                                    <th style={{ width: '140px' }}>Total Pay</th>
                                    <th style={{ width: '150px' }}>Paid Date</th>
                                    <th style={{ width: '140px' }}>Status</th>
                                    <th style={{ width: '100px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stakeholders && stakeholders.map((s, idx) => {
                                    const payAmt = (dVal * s.percentage) / 100;
                                    const taxRate = parseFloat(details.leadGst) || 0;
                                    const taxAmt = (payAmt * taxRate) / 100;
                                    const netPay = payAmt + taxAmt;

                                    return (
                                        <tr key={s.id}>
                                            <td>{s.name}</td>
                                            <td>
                                                <input type="number" className="stage-input text-center p-1" style={{ width: '80px' }} value={s.percentage} onChange={(e) => updateStakeholder(s.id, 'percentage', e.target.value)} />
                                            </td>
                                            <td>{details.currency} {payAmt.toLocaleString()}</td>
                                            <td>
                                                <input type="number" className="stage-input p-1 text-center" style={{ width: '60px' }} value={parseFloat(details.leadGst) || 0} disabled />
                                            </td>
                                            <td>{details.currency} {taxAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td>{details.currency} {netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td>
                                                <input type="date" className="stage-input p-1" value={s.paidDate || ''} onChange={(e) => updateStakeholder(s.id, 'paidDate', e.target.value)} />
                                            </td>
                                            <td>
                                                <select
                                                    className="stage-select p-1"
                                                    value={s.status || s.payoutStatus || 'Pending'}
                                                    onChange={(e) => updateStakeholder(s.id, { status: e.target.value, payoutStatus: e.target.value })}
                                                    style={{
                                                        borderColor: (s.status || s.payoutStatus) === 'Paid' ? '#198754' : '#ccc',
                                                        color: (s.status || s.payoutStatus) === 'Paid' ? '#198754' : '#000'
                                                    }}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Processed">Processed</option>
                                                    <option value="Paid">Paid</option>
                                                </select>
                                            </td>
                                            <td className="text-center">
                                                <button className="btn btn-sm btn-outline-primary" style={{ padding: '4px 10px', borderRadius: '6px' }} onClick={() => generatePaymentInvoicePDF(s, details, dVal)} title="Download Voucher">
                                                    <FileDown size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {(!stakeholders || stakeholders.length === 0) && <tr><td colSpan="9" className="text-center text-muted p-3">No stakeholders added.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 4. MAIN COMPONENT (App Logic)
// ==========================================

const detectTaxFromAddress = (address) => {
    if (!address) return { taxType: 'Inter-State (IGST)', name: 'IGST', percentage: 18, country: 'India', state: '' };

    const lowerAddr = address.toLowerCase();

    // Export Tax (Outside India)
    if (
        (lowerAddr.includes('usa') || lowerAddr.includes('uk') || lowerAddr.includes('uae') || lowerAddr.includes('dubai') || lowerAddr.includes('london') || lowerAddr.includes('new york') || lowerAddr.includes('canada') || lowerAddr.includes('australia') || lowerAddr.includes('japan') || lowerAddr.includes('singapore') || lowerAddr.includes('france') || lowerAddr.includes('germany') || lowerAddr.includes('international')) && !lowerAddr.includes('india')
    ) {
        return { taxType: 'Export (Nil Rate)', name: 'Export (Nil)', percentage: 0, country: 'Other', state: '' };
    }

    // Tamil Nadu Districts (Intra-State)
    const tnKeywords = ['tamil nadu', 'tamilnadu', 'chennai', 'coimbatore', 'madurai', 'tiruchirappalli', 'trichy', 'salem', 'tirunelveli', 'tiruppur', 'vellore', 'erode', 'thoothukudi', 'tuticorin', 'dindigul', 'thanjavur', 'ranipet', 'karur', 'ooty', 'kanyakumari', 'kancheepuram', 'kanchipuram', 'tiruvallur', 'cuddalore', 'hosur', 'nagercoil'];

    const isTN = tnKeywords.some(kw => lowerAddr.includes(kw));

    if (isTN) {
        return { taxType: 'Intra-State (CGST + SGST)', name: 'GST (Intra)', percentage: 18, country: 'India', state: 'Tamil Nadu' };
    }

    // Other cases in India (Inter-State)
    return { taxType: 'Inter-State (IGST)', name: 'IGST', percentage: 18, country: 'India', state: '' };
};

const normalizeId = (value) => (value === null || value === undefined ? '' : String(value));
const idsEqual = (a, b) => normalizeId(a) === normalizeId(b);
const normalizeProjectKey = (value) => String(value || '').trim().toLowerCase();
const toDateInputValue = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value.length >= 10 ? value.slice(0, 10) : value;
    try {
        return new Date(value).toISOString().slice(0, 10);
    } catch {
        return '';
    }
};

const inferDealValue = (projectLike) => {
    const direct = parseFloat(projectLike?.dealValue);
    if (Number.isFinite(direct) && direct > 0) return direct;

    const history = Array.isArray(projectLike?.history) ? projectLike.history : [];
    for (const entry of history) {
        const amount = parseFloat(entry?.amount);
        if (Number.isFinite(amount) && amount > 0) return amount;
    }

    return 0;
};

const normalizeProjectFinance = (projectLike) => {
    if (!projectLike) return projectLike;

    return {
        ...projectLike,
        milestones: (projectLike.milestones || []).map((m) => ({
            ...m,
            invoiceDate: toDateInputValue(m.invoiceDate),
            paidDate: toDateInputValue(m.paidDate),
            status: m.status || 'Pending'
        })),
        stakeholders: (projectLike.stakeholders || []).map((s) => ({
            ...s,
            status: s.status || s.payoutStatus || 'Pending',
            payoutStatus: s.payoutStatus || s.status || 'Pending',
            paidDate: toDateInputValue(s.paidDate)
        }))
    };
};

const completenessScore = (projectLike) => {
    if (!projectLike) return 0;

    let score = 0;
    if (projectLike.clientAddress) score += 2;
    if (projectLike.clientGstin) score += 1;
    if (projectLike.location) score += 1;
    if (projectLike.delivery) score += 1;
    if (parseFloat(projectLike.dealValue) > 0) score += 2;
    if ((projectLike.charges || []).length > 0) score += 2;

    score += (projectLike.milestones || []).reduce((sum, m) => {
        let s = 1;
        if (m.invoiceDate) s += 2;
        if (m.paidDate) s += 2;
        if (m.status && m.status !== 'Pending') s += 2;
        return sum + s;
    }, 0);

    score += (projectLike.stakeholders || []).reduce((sum, s) => {
        let v = 1;
        const status = s.status || s.payoutStatus;
        if (s.paidDate) v += 2;
        if (status && status !== 'Pending') v += 2;
        return sum + v;
    }, 0);

    return score;
};

const pickBetterProject = (left, right) => {
    const leftScore = completenessScore(left);
    const rightScore = completenessScore(right);
    if (leftScore !== rightScore) return leftScore > rightScore ? left : right;

    const leftDeal = parseFloat(left?.dealValue) || 0;
    const rightDeal = parseFloat(right?.dealValue) || 0;
    if (leftDeal !== rightDeal) return leftDeal > rightDeal ? left : right;

    const leftMs = Array.isArray(left?.milestones) ? left.milestones.length : 0;
    const rightMs = Array.isArray(right?.milestones) ? right.milestones.length : 0;
    if (leftMs !== rightMs) return leftMs > rightMs ? left : right;

    const leftSt = Array.isArray(left?.stakeholders) ? left.stakeholders.length : 0;
    const rightSt = Array.isArray(right?.stakeholders) ? right.stakeholders.length : 0;
    if (leftSt !== rightSt) return leftSt > rightSt ? left : right;

    const leftId = parseInt(left?.id ?? left?._id, 10) || 0;
    const rightId = parseInt(right?.id ?? right?._id, 10) || 0;
    return rightId >= leftId ? right : left;
};

const dedupeProjects = (items = []) => {
    const map = new Map();

    for (const rawItem of items) {
        const item = normalizeProjectFinance(rawItem);
        const key = normalizeProjectKey(item?.projectId) || `id:${normalizeId(item?.id ?? item?._id)}`;
        const prev = map.get(key);
        map.set(key, prev ? pickBetterProject(prev, item) : item);
    }

    return Array.from(map.values());
};

const ProjectTrackerComplete = () => {
    const toast = useToast();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const [view, setView] = useState('dashboard');
    const [activeProjectId, setActiveProjectId] = useState(null);
    const [projects, setProjects] = useState([]);
    // Track last-saved milestone statuses to detect new "Paid" transitions on save
    const savedMilestoneStatusesRef = useRef({});

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const fetchedProjects = await projectFinanceService.getAll();
                const deduped = dedupeProjects(fetchedProjects || []);
                setProjects(deduped);
                // Snapshot saved milestone statuses for each project
                const statusMap = {};
                deduped.forEach(p => {
                    const pid = p.id || p._id;
                    statusMap[pid] = {};
                    (p.milestones || []).forEach((m, idx) => {
                        statusMap[pid][m.name || `milestone-${idx}`] = m.status;
                    });
                });
                savedMilestoneStatusesRef.current = statusMap;
            } catch (err) {
                console.error("Error fetching project finances:", err);
            }
        };
        fetchProjects();
    }, []);

    useEffect(() => {
        const initProject = async () => {
            let receivedProject = location.state?.project;
            const projectIdParam = searchParams.get('projectId');

            if (!receivedProject && projectIdParam) {
                try {
                    receivedProject = await projectService.getById(projectIdParam);
                } catch (err) {
                    console.error("Failed to fetch project by ID:", err);
                }
            }

            if (receivedProject) {
                // Fetch the latest projects from backend to avoid race conditions
                let fetchedProjects = [];
                try {
                    fetchedProjects = await projectFinanceService.getAll();
                } catch (err) {
                    console.error("Error fetching project finances during init:", err);
                }
                fetchedProjects = dedupeProjects(fetchedProjects || []);

                // Check if a project finance already exists for this project (by id or by matching projectId/clientName)
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

                // Fetch contacts to find address/country
                let retrievedAddress = '';
                let retrievedCountry = 'India'; // Default fallback

                try {
                    const contacts = await contactService.getContacts();
                    const searchName = (receivedProject.clientName || '').toLowerCase().trim();

                    console.log('Searching for contact:', searchName);

                    // Try to match by Exact Name or Company
                    const matchedContact = contacts.find(c => {
                        const cName = (c.name || '').toLowerCase().trim();
                        const cCompany = (c.company || '').toLowerCase().trim();
                        return cName === searchName || cCompany === searchName;
                    });

                    if (matchedContact) {
                        console.log('Matched Contact:', matchedContact);
                        retrievedAddress = matchedContact.address || matchedContact.location || '';

                        const lowerLoc = retrievedAddress.toLowerCase();

                        if (lowerLoc.includes('india')) {
                            retrievedCountry = 'India';
                        } else if (lowerLoc.includes('uae') || lowerLoc.includes('united arab emirates') || lowerLoc.includes('dubai')) {
                            retrievedCountry = 'UAE';
                        } else if (retrievedAddress) {
                            // If address is present but doesn't match India/UAE, try to extract the country
                            const parts = retrievedAddress.split(',');
                            const lastPart = parts[parts.length - 1].trim();
                            // If we have a valid last part, use it. Otherwise use India (or maybe 'Other'?)
                            // Let's use the last part if it looks like a word, effectively treating it as the country.
                            if (lastPart.length > 2) {
                                retrievedCountry = lastPart;
                            }
                        }
                    } else {
                        console.log('No contact matched for client:', receivedProject.clientName);
                    }
                } catch (err) {
                    console.error("Error fetching contacts for invoice init:", err);
                }

                // Map Sales data to Invoice structure with fetched Location
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
                    stakeholders: [],
                    milestones: [],
                    charges: [{
                        id: 1,
                        name: taxConfig.name,
                        taxType: taxConfig.taxType,
                        country: taxConfig.country,
                        state: taxConfig.state,
                        percentage: taxConfig.percentage
                    }],
                    clientEmail: receivedProject.clientEmail || '',
                    clientPhone: receivedProject.clientPhone || '',
                    clientAddress: receivedProject.clientAddress || '',
                    clientGstin: receivedProject.clientGstin || '',
                    clientPan: receivedProject.clientPan || '',
                    clientCin: receivedProject.clientCin || '',
                    msmeStatus: receivedProject.msmeStatus || 'NON MSME',
                    tdsSection: receivedProject.tdsSection || '',
                    tdsRate: receivedProject.tdsRate || ''
                };

                try {
                    // Persist to backend and use the returned ID (which may differ from receivedProject.id)
                    const savedProject = await projectFinanceService.create(newProject);
                    const savedId = savedProject.id || savedProject._id;
                    const projectWithId = normalizeProjectFinance({ ...newProject, id: savedId, _id: savedId });
                    setProjects(dedupeProjects([...fetchedProjects, projectWithId]));
                    setActiveProjectId(savedId);
                    setView('invoice');
                } catch (err) {
                    console.error("Error creating project finance:", err);
                    // Fallback: add to local state with a generated ID so the page still works
                    const fallbackId = receivedProject.id || Date.now();
                    const projectWithId = normalizeProjectFinance({ ...newProject, id: fallbackId });
                    setProjects(dedupeProjects([...fetchedProjects, projectWithId]));
                    setActiveProjectId(fallbackId);
                    setView('invoice');
                }
            }
        };

        initProject();
    }, [location.state, searchParams]);

    const activeProject = projects.find(p => idsEqual(p.id, activeProjectId) || idsEqual(p._id, activeProjectId));

    const handleCreateProject = () => {
        const newProj = {
            id: Date.now(), projectId: `PROJ-${Math.floor(Math.random() * 999)}`, dateCreated: new Date().toISOString(),
            clientName: 'New Client', clientAddress: '', clientGstin: '', delivery: '', dealValue: 0, currency: 'AED', location: '', status: 'Active',
            type: 'Product',
            stakeholders: [], milestones: [], charges: [{ id: 1, name: 'GST', taxType: 'Inter-State (IGST)', country: 'India', state: '', percentage: 18 }]
        };
        setProjects([...projects, newProj]);
        setActiveProjectId(newProj.id);
        setView('invoice');
    };

    const handleDeleteProject = async (id) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                await projectFinanceService.delete(id);

                // Update state
                setProjects(prev => prev.filter(p => !idsEqual(p.id, id) && !idsEqual(p._id, id)));
                if (idsEqual(activeProjectId, id)) {
                    setActiveProjectId(null);
                    setView('dashboard');
                }
            } catch (err) {
                console.error("Error deleting project:", err);
                toast.error('Failed to delete project.');
            }
        }
    };

    const handleSaveProject = async () => {
        if (!activeProject) return;
        try {
            // Format data to match backend DTO structure
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
                    name: m.name || '',
                    percentage: parseFloat(m.percentage) || 0,
                    status: m.status || 'Pending',
                    invoiceDate: m.invoiceDate || null,
                    paidDate: m.paidDate || null,
                    isCustomName: m.isCustomName || false,
                    order: m.order ?? idx
                })),
                stakeholders: (activeProject.stakeholders || []).map(s => ({
                    name: s.name || '',
                    percentage: parseFloat(s.percentage) || 0,
                    payoutTax: parseFloat(s.payoutTax) || 0,
                    payoutStatus: s.payoutStatus || s.status || 'Pending',
                    paidDate: s.paidDate || null
                })),
                charges: (activeProject.charges || []).map(c => ({
                    name: c.name || '',
                    taxType: c.taxType || '',
                    country: c.country || '',
                    state: c.state || '',
                    percentage: parseFloat(c.percentage) || 0
                }))
            };

            const id = activeProject.id;
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

            // Auto-create income for milestones that just became "Paid" (compared to last saved state)
            if (savedProject) {
                const projectId = savedProject.id || savedProject._id || id;
                const prevStatuses = savedMilestoneStatusesRef.current[id] || {};
                const dealValue = parseFloat(activeProject.dealValue) || 0;
                const totalTaxRate = (activeProject.charges || []).reduce((sum, c) => sum + (parseFloat(c.percentage) || 0), 0);

                for (const milestone of (activeProject.milestones || [])) {
                    const mKey = milestone.name || `milestone-${milestone.order}`;
                    const wasStatus = prevStatuses[mKey];
                    if (milestone.status === 'Paid' && wasStatus !== 'Paid') {
                        const raisedAmount = (dealValue * (parseFloat(milestone.percentage) || 0)) / 100;
                        const taxAmount = (raisedAmount * totalTaxRate) / 100;
                        const totalAmount = raisedAmount + taxAmount;
                        try {
                            await incomeService.createIncome({
                                description: `${activeProject.clientName} - ${milestone.name}`,
                                amount: totalAmount,
                                date: new Date().toISOString(),
                                category: 'sales',
                                status: 'Paid',
                                projectDepartment: `ProjectFinance-${projectId}`
                            });
                        } catch (err) {
                            console.error("Error creating auto-income for milestone:", err);
                        }
                    }
                }

                // Update saved statuses ref so next save won't create duplicates
                const newStatuses = {};
                (activeProject.milestones || []).forEach((m, idx) => {
                    newStatuses[m.name || `milestone-${idx}`] = m.status;
                });
                savedMilestoneStatusesRef.current[projectId] = newStatuses;
                // Also update for old id in case it changed (create vs update)
                if (projectId !== id) savedMilestoneStatusesRef.current[projectId] = newStatuses;
            }

            toast.success('Project finance details saved successfully!');
        } catch (error) {
            console.error("Error saving project:", error);
            toast.error('Failed to save project. Please check all fields and try again.');
        }
    };

    const updateProject = (fn) => setProjects(projects.map(p => p.id === activeProjectId ? fn(p) : p));
    const updateDetails = (f, v) => {
        updateProject(p => {
            const updated = { ...p, [f]: v };

            // Auto tax calculation when clientAddress changes
            if (f === 'clientAddress' && updated.charges && updated.charges.length > 0) {
                const taxConfig = detectTaxFromAddress(v);
                const newCharges = [...updated.charges];
                newCharges[0] = {
                    ...newCharges[0],
                    name: taxConfig.name,
                    taxType: taxConfig.taxType,
                    country: taxConfig.country,
                    state: taxConfig.state,
                    percentage: taxConfig.percentage
                };
                updated.charges = newCharges;
            }

            return updated;
        });
    };

    // Stakeholders logic
    const addStakeholder = () => updateProject(p => ({ ...p, stakeholders: [...p.stakeholders, { id: Date.now(), name: 'New', percentage: 0, payoutTax: 18, payoutStatus: 'Pending', paidDate: '' }] }));
    const removeStakeholder = (id) => updateProject(p => ({ ...p, stakeholders: p.stakeholders.filter(s => s.id !== id) }));
    const updateStakeholder = async (id, f, v) => {
        updateProject(p => ({ ...p, stakeholders: p.stakeholders.map(s => s.id === id ? { ...s, ...(typeof f === 'object' ? f : { [f]: v }) } : s) }));

        const changedStatus = typeof f === 'object'
            ? (f.status || f.payoutStatus || null)
            : ((f === 'status' || f === 'payoutStatus') ? v : null);

        // Auto-log Expense when status becomes 'Paid'
        if (changedStatus === 'Paid' && activeProject) {
            const stakeholder = activeProject.stakeholders.find(s => s.id === id);
            if (stakeholder) {
                // Calculate Payout Amount safely converting strings to floats
                const basePayout = ((parseFloat(activeProject.dealValue) || 0) * (parseFloat(stakeholder.percentage) || 0)) / 100;
                // Tax deduction uses the leadGst applied to the project as seen in Stage 4 UI
                const taxRate = parseFloat(activeProject.leadGst) || 0;
                const taxAmt = (basePayout * taxRate) / 100;
                const netPayout = basePayout + taxAmt; // From UI: "Total Pay" equals Pay (INR) + GST Amt

                const expenseData = {
                    description: `Payout: ${stakeholder.name} - ${activeProject.projectId}`,
                    amount: netPayout,
                    date: new Date().toISOString(),
                    category: 'allowances', // Map to a default category in Finance
                    notes: `Auto-generated Stakeholder Payout from Project ${activeProject.projectId}`
                };

                try {
                    await expenseService.createExpense(expenseData);
                } catch (err) {
                    console.error("Error creating expense:", err);
                }
            }
        }
    };

    // Milestones logic
    const addMilestone = () => {
        const currentTotalPct = (activeProject?.milestones || []).reduce((sum, m) => sum + (parseFloat(m.percentage) || 0), 0);
        if (currentTotalPct >= 100) {
            toast.warning('Cannot add more payment stages: Total percentage is already 100%.');
            return;
        }

        let defaultName = 'New Stage';
        try {
            const storageKey = activeProject?.type === 'Service' ? 'sales_stages_service' : 'sales_stages_product';
            const stored = localStorage.getItem(storageKey);
            const stages = stored ? JSON.parse(stored) : null;
            if (stages && stages.length > 0) defaultName = stages[0].label;
        } catch { /* fallback */ }
        updateProject(p => ({ ...p, milestones: [...p.milestones, { id: Date.now(), name: defaultName, percentage: 0, status: 'Pending', invoiceDate: '', paidDate: '' }] }));
    };
    const removeMilestone = (id) => updateProject(p => ({ ...p, milestones: p.milestones.filter(m => m.id !== id) }));
    const updateMilestone = (id, f, v) => {
        updateProject(p => ({ ...p, milestones: p.milestones.map(m => m.id === id ? { ...m, ...(typeof f === 'object' ? f : { [f]: v }) } : m) }));
    };

    // Charges logic
    const addCharge = () => updateProject(p => ({ ...p, charges: [...p.charges, { id: Date.now(), name: 'Tax', taxType: 'Other', country: 'India', state: '', percentage: 0 }] }));
    const removeCharge = (id) => updateProject(p => ({ ...p, charges: p.charges.filter(c => c.id !== id) }));
    const updateCharge = (id, field, value) => updateProject(p => ({
        ...p,
        charges: p.charges.map(c => c.id === id ? { ...c, ...(typeof field === 'object' ? field : { [field]: value }) } : c)
    }));

    return (
        <div className="tracker-wrapper" style={{ fontFamily: "'Inter', sans-serif" }}>
            <TrackerStyles />
            {view === 'invoice' && activeProject && (
                <div className="mb-4" style={{ paddingLeft: '0.5rem' }}>
                    <button className="btn btn-outline-dark" onClick={() => { setView('dashboard'); setActiveProjectId(null); }}>
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                </div>
            )}

            {view === 'dashboard' ? (
                <Dashboard
                    projects={projects}
                    onOpenProject={(id) => { setActiveProjectId(id); setView('invoice'); }}
                    onCreateProject={handleCreateProject}
                    onDeleteProject={handleDeleteProject}
                    onStatusChange={(id, status) => {
                        setProjects(prev => prev.map(p => p.id === id ? { ...p, status: status, isArchived: status === 'Archived' } : p));
                    }}
                />
            ) : activeProject ? (
                <InvoiceMain
                    details={activeProject} updateDetails={updateDetails}
                    stakeholders={activeProject.stakeholders} addStakeholder={addStakeholder} removeStakeholder={removeStakeholder} updateStakeholder={updateStakeholder}
                    milestones={activeProject.milestones} addMilestone={addMilestone} removeMilestone={removeMilestone} updateMilestone={updateMilestone}
                    charges={activeProject.charges} addCharge={addCharge} removeCharge={removeCharge} updateCharge={updateCharge}
                    onSave={handleSaveProject}
                />
            ) : (
                <div className="text-white text-center">Project not found.</div>
            )}
        </div>
    );
};

export default ProjectTrackerComplete;
