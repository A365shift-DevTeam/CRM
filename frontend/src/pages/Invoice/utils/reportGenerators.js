import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { addPDFHeader } from '../../../utils/pdfGenerator';

export const generateProjectReportPDF = (details, stakeholders, milestones, taxes) => {
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

export const generateDashboardPDF = (projects, filter) => {
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

export const exportProjectReport = (details, stakeholders, milestones, taxes) => {
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

export const exportDashboardExcel = (projects, filter) => {
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
