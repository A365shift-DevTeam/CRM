import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { numberToWords } from './currencyUtils'; // We'll move this here or to its own file

export const addPDFHeader = (doc, title, details) => {
    const pageWidth = doc.internal.pageSize.width;

    // Header Background
    doc.setFillColor(0, 84, 166);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setFillColor(140, 198, 63);
    doc.rect(0, 40, pageWidth, 3, 'F');

    // Company Name & Logo area
    doc.setTextColor(255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text("AMBOT365", 14, 20);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text("RPA & IT SOLUTIONS", 14, 26);
    doc.setFontSize(8);
    doc.text("Automating the Future, Today.", 14, 32);

    // Document Title
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text(title, pageWidth - 14, 25, { align: 'right' });

    // Company Contact Info (Right aligned, under title)
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text("info@officeaibots.in", pageWidth - 14, 32, { align: 'right' });
    doc.text("+91 90035 56170", pageWidth - 14, 37, { align: 'right' });

    // Header bottom line
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(14, 48, pageWidth - 14, 48);
};

export const generateInvoicePDF = (milestone, details, taxes) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const currency = details.currency || 'INR';
    const baseAmount = (details.dealValue * (parseFloat(milestone.percentage) || 0)) / 100;

    // Tax Calculation
    const chargesList = Array.isArray(taxes) && taxes.length > 0 ? taxes : [{ name: 'GST', percentage: 18, taxType: 'Standard' }];
    const isIntraState = chargesList.some(t => t.taxType === 'Intra-State (CGST + SGST)');
    const totalTaxRate = chargesList.reduce((sum, c) => sum + (parseFloat(c.percentage) || 0), 0);
    const totalTaxAmount = (baseAmount * totalTaxRate) / 100;
    const finalAmount = baseAmount + totalTaxAmount;

    // Check if it's an Export invoice
    const isExport = chargesList.some(t => t.taxType === 'Export (Nil Rate)' || t.taxType === 'Export (Nil)');

    // ═══ HEADER ═══
    addPDFHeader(doc, "PROFORMA INVOICE", details);

    let y = 72;

    // ═══ BILL TO & INVOICE INFO ═══
    doc.setFontSize(9); doc.setTextColor(0); doc.setFont(undefined, 'bold');
    doc.text("BILL TO:", 14, y);
    doc.setFont(undefined, 'normal');
    doc.text(details.clientName || "Client Name", 14, y + 5);
    const billAddress = details.clientAddress;
    if (billAddress) doc.text(billAddress, 14, y + 9);

    let currentY = y + (billAddress ? 13 : 9);
    if (details.clientGstin) {
        doc.setFont(undefined, 'bold');
        doc.text(`GSTIN: ${details.clientGstin}`, 14, currentY);
        doc.setFont(undefined, 'normal');
        currentY += 4;
    }
    if (details.clientPan) {
        doc.setFont(undefined, 'bold');
        doc.text(`PAN: ${details.clientPan}`, 14, currentY);
        doc.setFont(undefined, 'normal');
        currentY += 4;
    }
    if (details.clientCin) {
        doc.setFont(undefined, 'bold');
        doc.text(`CIN: ${details.clientCin}`, 14, currentY);
        doc.setFont(undefined, 'normal');
        currentY += 4;
    }

    const placeY = currentY;
    doc.setFont(undefined, 'bold');
    doc.text("Place of Supply:", 14, placeY);
    doc.setFont(undefined, 'normal');
    doc.text(details.location || 'Tamil Nadu', 50, placeY);

    // Right Side
    doc.setFont(undefined, 'bold');
    doc.text("Invoice No:", 130, y);
    doc.text("Invoice Date:", 130, y + 6);
    doc.setFont(undefined, 'normal');
    doc.text(`INV-${milestone.id}-${Date.now().toString().slice(-4)}`, 160, y);
    doc.text(milestone.invoiceDate ? new Date(milestone.invoiceDate).toLocaleDateString() : new Date().toLocaleDateString(), 160, y + 6);

    y = placeY + 5;
    doc.setDrawColor(200); doc.line(14, y, pageWidth - 14, y);
    y += 3;

    // ═══ ITEMS TABLE ═══
    autoTable(doc, {
        startY: y,
        head: [['Sno', 'Item & Description', 'HSN/SAC', 'Qty', `Rate (${currency})`, `Amount (${currency})`]],
        body: [[
            1,
            milestone.name || 'IT Consulting & Support Services',
            '998313',
            '1',
            baseAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            baseAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })
        ]],
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 8, halign: 'center' },
        styles: { halign: 'center', cellPadding: 3, fontSize: 8, lineColor: [200, 200, 200], lineWidth: 0.2 },
        columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            1: { halign: 'left', cellWidth: 65 },
            2: { halign: 'center', cellWidth: 22 },
            3: { halign: 'center', cellWidth: 15 },
            4: { halign: 'right', cellWidth: 35 },
            5: { halign: 'right', cellWidth: 35 }
        }
    });

    let finalY = doc.lastAutoTable.finalY + 5;
    const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });

    // ═══ TOTALS ═══
    let rightX = pageWidth - 75;
    doc.setFontSize(9); doc.setTextColor(0);
    doc.setFont(undefined, 'normal');
    doc.text("SubTotal:", rightX, finalY);
    doc.text(`${currency} ${fmt(baseAmount)}`, pageWidth - 14, finalY, { align: 'right' });

    if (isIntraState) {
        const halfRate = totalTaxRate / 2;
        const halfTax = totalTaxAmount / 2;
        finalY += 6;
        doc.text(`CGST @ ${halfRate}%:`, rightX, finalY);
        doc.text(`${currency} ${fmt(halfTax)}`, pageWidth - 14, finalY, { align: 'right' });
        finalY += 6;
        doc.text(`SGST @ ${halfRate}%:`, rightX, finalY);
        doc.text(`${currency} ${fmt(halfTax)}`, pageWidth - 14, finalY, { align: 'right' });
    } else if (isExport) {
        finalY += 6;
        doc.setFont(undefined, 'bold');
        doc.text(`EXPORT UNDER LUT - ZERO RATED TAX:`, rightX, finalY);
        doc.setFont(undefined, 'normal');
        doc.text(`${currency} ${fmt(0)}`, pageWidth - 14, finalY, { align: 'right' });
    } else {
        finalY += 6;
        doc.text(`IGST @ ${totalTaxRate}%:`, rightX, finalY);
        doc.text(`${currency} ${fmt(totalTaxAmount)}`, pageWidth - 14, finalY, { align: 'right' });
    }

    finalY += 4;
    doc.setDrawColor(41, 128, 185); doc.setLineWidth(0.5);
    doc.line(rightX - 2, finalY, pageWidth - 14, finalY);
    finalY += 7;

    // Grand Total Box
    doc.setFillColor(39, 174, 96);
    doc.rect(rightX - 4, finalY - 5, pageWidth - rightX + 4 - 10, 11, 'F');
    doc.setTextColor(255); doc.setFont(undefined, 'bold'); doc.setFontSize(10);
    doc.text("TOTAL:", rightX, finalY + 2);
    doc.text(`${currency} ${fmt(finalAmount)}`, pageWidth - 14, finalY + 2, { align: 'right' });

    // Total in Words
    finalY += 12;
    doc.setTextColor(0); doc.setFontSize(8); doc.setFont(undefined, 'bold');
    doc.text("Total in Words:", 14, finalY);
    doc.setFont(undefined, 'normal');
    const currLabel = currency === 'INR' ? 'Rupees' : currency === 'AED' ? 'Dirhams' : currency === 'USD' ? 'Dollars' : currency;
    doc.text(`${currLabel} ${numberToWords(finalAmount)}`, 14, finalY + 5);

    // ═══ COMPANY DETAILS FOOTER ═══
    finalY += 15;
    doc.setDrawColor(0, 84, 166); doc.setLineWidth(0.5);
    doc.line(14, finalY, pageWidth - 14, finalY);

    finalY += 6;
    doc.setFontSize(8); doc.setTextColor(0); doc.setFont(undefined, 'bold');
    doc.text("Ambot PAN:", 14, finalY);
    doc.setFont(undefined, 'normal');
    doc.text("AAYCA8731D", 42, finalY);

    finalY += 5;
    doc.setFont(undefined, 'bold');
    doc.text("CIN:", 14, finalY);
    doc.setFont(undefined, 'normal');
    doc.text("U72900TZ2021OPC038831", 27, finalY);

    // Bank Details
    finalY += 7;
    doc.setFont(undefined, 'bold'); doc.setFontSize(9);
    doc.text("Bank Details:", 14, finalY);
    doc.setFont(undefined, 'normal'); doc.setFontSize(8);
    finalY += 5;
    doc.text("Bank Name: HDFC BANK LTD", 14, finalY);
    doc.text("IFSC Code: HDFC0000031", 120, finalY);
    finalY += 4;
    doc.text("Account Name: AMBOT365 RPA AND IT SOLUTIONS OPC P LTD", 14, finalY);
    doc.text("Branch code: 000031", 120, finalY);
    finalY += 4;
    doc.text("Account Number: 50200084112410", 14, finalY);
    doc.text("MICR: 641240002", 120, finalY);

    // Authorized Signatory
    finalY += 10;
    doc.setFont(undefined, 'normal'); doc.setFontSize(8);
    doc.text("For AMBOT365 RPA & IT SOLUTIONS", pageWidth - 14, finalY, { align: 'right' });
    finalY += 10;
    doc.text("(Authorized Signatory)", pageWidth - 14, finalY, { align: 'right' });

    // ═══ BOTTOM FOOTER ═══
    let bottomY = pageHeight - 10;
    doc.setDrawColor(0, 84, 166); doc.setLineWidth(0.5);
    doc.line(14, bottomY - 6, pageWidth - 14, bottomY - 6);
    doc.setDrawColor(140, 198, 63); doc.setLineWidth(0.5);
    doc.line(14, bottomY - 5, pageWidth - 14, bottomY - 5);

    doc.save(`Invoice_${milestone.id}_${(milestone.name || 'milestone').replace(/[^a-z0-9]/gi, '_')}.pdf`);
};

export const generatePaymentVoucherPDF = (stakeholder, details, milestone) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const currency = details.currency || 'INR';

    addPDFHeader(doc, "PAYMENT VOUCHER", details);

    let y = 72;

    const baseAmount = (details.dealValue * (parseFloat(milestone.percentage) || 0)) / 100;
    const netShareAmt = (baseAmount * (parseFloat(stakeholder.share) || 0)) / 100;

    let tdsDeduction = 0;
    if (stakeholder.tdsRate && stakeholder.tdsRate > 0) {
        tdsDeduction = (netShareAmt * stakeholder.tdsRate) / 100;
    }
    const netPay = netShareAmt - tdsDeduction;

    // Bill To
    doc.setFontSize(9); doc.setTextColor(0); doc.setFont(undefined, 'bold');
    doc.text("PAY TO:", 14, y);
    doc.setFont(undefined, 'normal');
    doc.text(stakeholder.name || "Stakeholder Name", 14, y + 5);
    doc.text(`Role: ${stakeholder.role}`, 14, y + 9);
    if (stakeholder.email) doc.text(`Email: ${stakeholder.email}`, 14, y + 13);
    if (stakeholder.phone) doc.text(`Phone: ${stakeholder.phone}`, 14, y + 17);

    // Right Side
    doc.setFont(undefined, 'bold');
    doc.text("Voucher No:", 130, y);
    doc.text("Date:", 130, y + 6);
    doc.setFont(undefined, 'normal');
    doc.text(`PV-${stakeholder.id}-${Date.now().toString().slice(-4)}`, 160, y);
    doc.text(new Date().toLocaleDateString(), 160, y + 6);

    y += 24;
    doc.setDrawColor(200); doc.line(14, y, pageWidth - 14, y);
    y += 3;

    autoTable(doc, {
        startY: y,
        head: [['Sno', 'Description', 'Rev Share %', `Gross Amt (${currency})`, `TDS Deducted`, `Net Payable`]],
        body: [[
            1,
            `Commission/Share for: ${details.clientName} - ${milestone.name}`,
            `${stakeholder.share}%`,
            netShareAmt.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            tdsDeduction > 0 ? `${stakeholder.tdsRate}% (${tdsDeduction.toFixed(2)})` : '-',
            netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })
        ]],
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 8, halign: 'center' },
        styles: { halign: 'center', cellPadding: 3, fontSize: 8, lineColor: [200, 200, 200], lineWidth: 0.2 },
        columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            1: { halign: 'left', cellWidth: 65 },
            2: { halign: 'center', cellWidth: 20 },
            3: { halign: 'right', cellWidth: 30 },
            4: { halign: 'right', cellWidth: 25 },
            5: { halign: 'right', cellWidth: 30 }
        }
    });

    let finalY = doc.lastAutoTable.finalY + 10;

    // Green Background for Net Amount
    doc.setFillColor(39, 174, 96);
    doc.rect(135, finalY - 6, 65, 10, 'F');
    doc.setTextColor(255); doc.setFont(undefined, 'bold');
    doc.text(`Net Pay:`, 140, finalY);
    doc.text(`${currency} ${netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 195, finalY, { align: 'right' });

    // Footer Signatures
    doc.setTextColor(0); doc.setFont(undefined, 'normal');
    finalY += 30;
    doc.text("For AMBOT365 RPA & IT SOLUTIONS", 195, finalY, { align: 'right' });
    doc.text("(Authorized Signatory)", 195, finalY + 15, { align: 'right' });

    doc.save(`Payment_Voucher_${(stakeholder.name || 'stakeholder').replace(/[^a-z0-9]/gi, '_')}.pdf`);
};

export const generateTaxInvoicePDF = (milestone, details, taxes) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const currency = details.currency || 'INR';
    const baseAmount = (details.dealValue * (parseFloat(milestone.percentage) || 0)) / 100;

    const chargesList = Array.isArray(taxes) && taxes.length > 0 ? taxes : [{ name: 'GST', percentage: 18, taxType: 'Standard' }];
    const isIntraState = chargesList.some(t => t.taxType === 'Intra-State (CGST + SGST)');
    const totalTaxRate = chargesList.reduce((sum, c) => sum + (parseFloat(c.percentage) || 0), 0);
    const totalTaxAmount = (baseAmount * totalTaxRate) / 100;
    const finalAmount = baseAmount + totalTaxAmount;

    // Check if it's an Export invoice
    const isExport = chargesList.some(t => t.taxType === 'Export (Nil Rate)' || t.taxType === 'Export (Nil)');

    // ═══ HEADER: Company Details ═══
    addPDFHeader(doc, "TAX INVOICE", details);

    let y = 72;

    // Bill To
    doc.setFontSize(9); doc.setTextColor(0); doc.setFont(undefined, 'bold');
    doc.text("BILL TO:", 14, y);
    doc.setFont(undefined, 'normal'); doc.setFontSize(9);
    doc.text(details.clientName || "Client Name", 14, y + 5);
    const billAddress = details.clientAddress;
    if (billAddress) doc.text(billAddress, 14, y + 9);

    let currentY = y + (billAddress ? 13 : 9);
    if (details.clientGstin) {
        doc.setFont(undefined, 'bold');
        doc.text(`GSTIN: ${details.clientGstin}`, 14, currentY);
        doc.setFont(undefined, 'normal');
        currentY += 4;
    }
    if (details.clientPan) {
        doc.setFont(undefined, 'bold');
        doc.text(`PAN: ${details.clientPan}`, 14, currentY);
        doc.setFont(undefined, 'normal');
        currentY += 4;
    }
    if (details.clientCin) {
        doc.setFont(undefined, 'bold');
        doc.text(`CIN: ${details.clientCin}`, 14, currentY);
        doc.setFont(undefined, 'normal');
        currentY += 4;
    }

    const placeY = currentY;
    doc.setFont(undefined, 'bold');
    doc.text("Place of Supply:", 14, placeY);
    doc.setFont(undefined, 'normal');
    doc.text(details.location || 'Tamil Nadu', 50, placeY);

    // Right Side: Details
    doc.setFont(undefined, 'bold');
    doc.text("Invoice No:", 130, y);
    doc.text("Invoice Date:", 130, y + 6);
    doc.text("Reverse Charge:", 130, y + 12);
    doc.setFont(undefined, 'normal');
    doc.text(`INV-${milestone.id}-${Date.now().toString().slice(-4)}`, 160, y);
    doc.text(milestone.invoiceDate ? new Date(milestone.invoiceDate).toLocaleDateString() : new Date().toLocaleDateString(), 160, y + 6);
    doc.text("No", 160, y + 12);

    y = placeY + 5;
    doc.setDrawColor(200); doc.line(14, y, pageWidth - 14, y);
    y += 3;

    // ═══ MULTI-ROW ITEMS TABLE ═══
    autoTable(doc, {
        startY: y,
        head: [['Sno', 'Description of Services', 'HSN/SAC', 'Qty', `Rate (${currency})`, `Amount (${currency})`]],
        body: [[
            1,
            milestone.name || 'Software Development & IT Services',
            '998313',
            '1',
            baseAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            baseAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })
        ]],
        theme: 'grid',
        headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8,
            halign: 'center'
        },
        styles: {
            halign: 'center',
            cellPadding: 3,
            fontSize: 8,
            lineColor: [200, 200, 200],
            lineWidth: 0.2
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            1: { halign: 'left', cellWidth: 65 },
            2: { halign: 'center', cellWidth: 22 },
            3: { halign: 'center', cellWidth: 15 },
            4: { halign: 'right', cellWidth: 35 },
            5: { halign: 'right', cellWidth: 35 }
        }
    });

    let finalY = doc.lastAutoTable.finalY + 5;

    // ═══ TOTALS SECTION (Right Side) ═══
    let rightX = pageWidth - 75;
    const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });

    doc.setFontSize(9); doc.setTextColor(0);

    // SubTotal
    doc.setFont(undefined, 'normal');
    doc.text("SubTotal:", rightX, finalY);
    doc.text(`${currency} ${fmt(baseAmount)}`, pageWidth - 14, finalY, { align: 'right' });

    // Tax breakdown
    if (isIntraState) {
        const halfRate = totalTaxRate / 2;
        const halfTax = totalTaxAmount / 2;

        finalY += 6;
        doc.text(`CGST @ ${halfRate}%:`, rightX, finalY);
        doc.text(`${currency} ${fmt(halfTax)}`, pageWidth - 14, finalY, { align: 'right' });

        finalY += 6;
        doc.text(`SGST @ ${halfRate}%:`, rightX, finalY);
        doc.text(`${currency} ${fmt(halfTax)}`, pageWidth - 14, finalY, { align: 'right' });
    } else if (isExport) {
        finalY += 6;
        doc.setFont(undefined, 'bold');
        doc.text(`EXPORT UNDER LUT - ZERO RATED TAX:`, rightX, finalY);
        doc.setFont(undefined, 'normal');
        doc.text(`${currency} ${fmt(0)}`, pageWidth - 14, finalY, { align: 'right' });
    } else {
        finalY += 6;
        doc.text(`IGST @ ${totalTaxRate}%:`, rightX, finalY);
        doc.text(`${currency} ${fmt(totalTaxAmount)}`, pageWidth - 14, finalY, { align: 'right' });
    }

    // Divider
    finalY += 4;
    doc.setDrawColor(41, 128, 185); doc.setLineWidth(0.5);
    doc.line(rightX - 2, finalY, pageWidth - 14, finalY);
    finalY += 7;

    // TOTAL RS (Grand Total Box)
    doc.setFillColor(39, 174, 96);
    doc.rect(rightX - 4, finalY - 5, pageWidth - rightX + 4 - 10, 11, 'F');
    doc.setTextColor(255); doc.setFont(undefined, 'bold'); doc.setFontSize(10);
    doc.text("TOTAL:", rightX, finalY + 2);
    doc.text(`${currency} ${fmt(finalAmount)}`, pageWidth - 14, finalY + 2, { align: 'right' });

    // TOTAL IN WORDS
    finalY += 12;
    doc.setTextColor(0); doc.setFontSize(8); doc.setFont(undefined, 'bold');
    doc.text("Total in Words:", 14, finalY);
    doc.setFont(undefined, 'normal');
    const currLabel = currency === 'INR' ? 'Rupees' : currency === 'AED' ? 'Dirhams' : currency === 'USD' ? 'Dollars' : currency;
    doc.text(`${currLabel} ${numberToWords(finalAmount)}`, 14, finalY + 5);

    // ═══ COMPANY DETAILS FOOTER ═══
    finalY += 15;
    doc.setDrawColor(0, 84, 166); doc.setLineWidth(0.5);
    doc.line(14, finalY, pageWidth - 14, finalY);

    finalY += 6;
    doc.setFontSize(8); doc.setTextColor(0); doc.setFont(undefined, 'bold');
    doc.text("Ambot PAN:", 14, finalY);
    doc.setFont(undefined, 'normal');
    doc.text("AAYCA8731D", 42, finalY);

    finalY += 5;
    doc.setFont(undefined, 'bold');
    doc.text("CIN:", 14, finalY);
    doc.setFont(undefined, 'normal');
    doc.text("U72900TZ2021OPC038831", 27, finalY);

    // Bank Details
    finalY += 7;
    doc.setFont(undefined, 'bold'); doc.setFontSize(9);
    doc.text("Bank Details:", 14, finalY);
    doc.setFont(undefined, 'normal'); doc.setFontSize(8);
    finalY += 5;
    doc.text("Bank Name: HDFC BANK LTD", 14, finalY);
    doc.text("IFSC Code: HDFC0000031", 120, finalY);
    finalY += 4;
    doc.text("Account Name: AMBOT365 RPA AND IT SOLUTIONS OPC P LTD", 14, finalY);
    doc.text("Branch code: 000031", 120, finalY);
    finalY += 4;
    doc.text("Account Number: 50200084112410", 14, finalY);
    doc.text("MICR: 641240002", 120, finalY);

    // MSME Info & Terms (Tax Invoice Specific)
    finalY += 12;
    doc.setFont(undefined, 'bold'); doc.setFontSize(8);
    doc.text('Terms & Conditions:', 14, finalY);
    doc.setFont(undefined, 'normal');
    doc.text("1. Subject to Coimbatore Jurisdiction.", 14, finalY + 4);
    doc.text("2. Late payment may attract interest @ 18% p.a.", 14, finalY + 8);

    // Authorized Signatory
    finalY += 5;
    doc.setFont(undefined, 'normal'); doc.setFontSize(8);
    doc.text("For AMBOT365 RPA & IT SOLUTIONS", pageWidth - 14, finalY, { align: 'right' });
    finalY += 10;
    doc.text("_________________________", pageWidth - 14, finalY, { align: 'right' });
    finalY += 4;
    doc.text("(Authorized Signatory)", pageWidth - 14, finalY, { align: 'right' });

    // ═══ BOTTOM FOOTER ═══
    let bottomY = pageHeight - 10;
    doc.setDrawColor(0, 84, 166); doc.setLineWidth(0.5);
    doc.line(14, bottomY - 6, pageWidth - 14, bottomY - 6);
    doc.setDrawColor(140, 198, 63); doc.setLineWidth(0.5);
    doc.line(14, bottomY - 5, pageWidth - 14, bottomY - 5);

    doc.save(`Tax_Invoice_${milestone.id}_${(milestone.name || 'milestone').replace(/[^a-z0-9]/gi, '_')}.pdf`);
};

export const generateInvestorPaymentPDF = (milestone, details) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const currency = details.currency || 'INR';

    addPDFHeader(doc, "PAYMENT VOUCHER", details);

    let y = 72;

    const baseAmount = (details.dealValue * (parseFloat(milestone.percentage) || 0)) / 100;
    const gstRate = parseFloat(details.leadGst) || 0; // Default GST on Investor payments
    const gstAmount = (baseAmount * gstRate) / 100;
    const netPay = baseAmount + gstAmount;

    // Bill To
    doc.setFontSize(9); doc.setTextColor(0); doc.setFont(undefined, 'bold');
    doc.text("PAY TO:", 14, y);
    doc.setFont(undefined, 'normal');
    doc.text(details.clientName || "Investor / Lead", 14, y + 5);
    if (details.clientAddress) doc.text(details.clientAddress, 14, y + 9);
    if (details.clientGstin) {
        doc.setFont(undefined, 'bold');
        doc.text(`PAN/GSTIN: ${details.clientGstin}`, 14, y + (details.clientAddress ? 13 : 9));
        doc.setFont(undefined, 'normal');
    }

    const placeY = y + (details.clientAddress ? 17 : 13);
    doc.setFont(undefined, 'bold');
    doc.text("Place of Supply:", 14, placeY);
    doc.setFont(undefined, 'normal');
    doc.text(details.location || 'Tamil Nadu', 50, placeY);

    // Right Side: Voucher Info
    doc.setFont(undefined, 'bold');
    doc.text("Voucher No:", 130, y);
    doc.text("Date:", 130, y + 6);
    doc.text("Payment For:", 130, y + 12);
    doc.setFont(undefined, 'normal');
    doc.text(`PV-${milestone.id}-${Date.now().toString().slice(-4)}`, 160, y);
    doc.text(milestone.invoiceDate ? new Date(milestone.invoiceDate).toLocaleDateString() : new Date().toLocaleDateString(), 160, y + 6);
    doc.text(milestone.name || 'Milestone', 160, y + 12);

    y = placeY + 5;
    doc.setDrawColor(200); doc.line(14, y, pageWidth - 14, y);
    y += 3;

    // ═══ ITEMS TABLE ═══
    autoTable(doc, {
        startY: y,
        head: [['Sno', 'Description', 'Share %', `Base Amt (${currency})`, `GST @ ${gstRate}%`, `Total Pay (${currency})`]],
        body: [[
            1,
            `${milestone.name || 'Investor Payout'} — Revenue Share Disbursement`,
            `${milestone.percentage}%`,
            baseAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            gstAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })
        ]],
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 8, halign: 'center' },
        styles: { halign: 'center', cellPadding: 3, fontSize: 8, lineColor: [200, 200, 200], lineWidth: 0.2 },
        columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            1: { halign: 'left', cellWidth: 65 },
            2: { halign: 'center', cellWidth: 18 },
            3: { halign: 'right', cellWidth: 30 },
            4: { halign: 'right', cellWidth: 28 },
            5: { halign: 'right', cellWidth: 30 }
        }
    });

    let finalY = doc.lastAutoTable.finalY + 5;
    const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });

    // ═══ TOTALS ═══
    let rightX = pageWidth - 75;
    doc.setFontSize(9); doc.setTextColor(0);
    doc.setFont(undefined, 'normal');
    doc.text("Base Payout:", rightX, finalY);
    doc.text(`${currency} ${fmt(baseAmount)}`, pageWidth - 14, finalY, { align: 'right' });

    finalY += 6;
    doc.text(`Add: GST @ ${gstRate}%:`, rightX, finalY);
    doc.text(`+ ${currency} ${fmt(gstAmount)}`, pageWidth - 14, finalY, { align: 'right' });

    finalY += 4;
    doc.setDrawColor(41, 128, 185); doc.setLineWidth(0.5);
    doc.line(rightX - 2, finalY, pageWidth - 14, finalY);
    finalY += 7;

    // Net Pay Box (Green)
    doc.setFillColor(39, 174, 96);
    doc.rect(rightX - 4, finalY - 5, pageWidth - rightX + 4 - 10, 11, 'F');
    doc.setTextColor(255); doc.setFont(undefined, 'bold'); doc.setFontSize(10);
    doc.text("NET PAY:", rightX, finalY + 2);
    doc.text(`${currency} ${fmt(netPay)}`, pageWidth - 14, finalY + 2, { align: 'right' });

    // Total in Words
    finalY += 12;
    doc.setTextColor(0); doc.setFontSize(8); doc.setFont(undefined, 'bold');
    doc.text("Net Pay in Words:", 14, finalY);
    doc.setFont(undefined, 'normal');
    const currLabel = currency === 'INR' ? 'Rupees' : currency === 'AED' ? 'Dirhams' : currency === 'USD' ? 'Dollars' : currency;
    doc.text(`${currLabel} ${numberToWords(netPay)}`, 14, finalY + 5);

    // ═══ COMPANY DETAILS FOOTER ═══
    finalY += 15;
    doc.setDrawColor(0, 84, 166); doc.setLineWidth(0.5);
    doc.line(14, finalY, pageWidth - 14, finalY);

    finalY += 6;
    doc.setFontSize(8); doc.setTextColor(0); doc.setFont(undefined, 'bold');
    doc.text("Ambot PAN:", 14, finalY);
    doc.setFont(undefined, 'normal');
    doc.text("AAYCA8731D", 42, finalY);

    finalY += 5;
    doc.setFont(undefined, 'bold');
    doc.text("CIN:", 14, finalY);
    doc.setFont(undefined, 'normal');
    doc.text("U72900TZ2021OPC038831", 27, finalY);

    // Bank Details
    finalY += 7;
    doc.setFont(undefined, 'bold'); doc.setFontSize(9);
    doc.text("Bank Details:", 14, finalY);
    doc.setFont(undefined, 'normal'); doc.setFontSize(8);
    finalY += 5;
    doc.text("Bank Name: HDFC BANK LTD", 14, finalY);
    doc.text("IFSC Code: HDFC0000031", 120, finalY);
    finalY += 4;
    doc.text("Account Name: AMBOT365 RPA AND IT SOLUTIONS OPC P LTD", 14, finalY);
    doc.text("Branch code: 000031", 120, finalY);
    finalY += 4;
    doc.text("Account Number: 50200084112410", 14, finalY);
    doc.text("MICR: 641240002", 120, finalY);

    // Authorized Signatory
    finalY += 10;
    doc.setFont(undefined, 'normal'); doc.setFontSize(8);
    doc.text("For AMBOT365 RPA & IT SOLUTIONS", pageWidth - 14, finalY, { align: 'right' });
    finalY += 10;
    doc.text("(Authorized Signatory)", pageWidth - 14, finalY, { align: 'right' });

    // ═══ BOTTOM FOOTER ═══
    let bottomY = pageHeight - 10;
    doc.setDrawColor(0, 84, 166); doc.setLineWidth(0.5);
    doc.line(14, bottomY - 6, pageWidth - 14, bottomY - 6);
    doc.setDrawColor(140, 198, 63); doc.setLineWidth(0.5);
    doc.line(14, bottomY - 5, pageWidth - 14, bottomY - 5);

    doc.save(`Investor_Payment_${milestone.id}_${(milestone.name || 'milestone').replace(/[^a-z0-9]/gi, '_')}.pdf`);
};

export const generatePaymentInvoicePDF = (stakeholder, details, dealValue) => {
    const doc = new jsPDF();
    const currency = details.currency || 'AED';
    const payAmt = (dealValue * (parseFloat(stakeholder.percentage) || 0)) / 100;
    const taxRate = parseFloat(details.leadGst) || 0;
    const taxAmt = (payAmt * taxRate) / 100;
    const netPay = payAmt + taxAmt;

    // Use Helper
    addPDFHeader(doc, "PAYMENT VOUCHER", details);

    // Invoice Details
    doc.setFontSize(10); doc.setTextColor(0); doc.setFont(undefined, 'bold');
    doc.text("To:", 14, 85);
    doc.setFont(undefined, 'normal');
    doc.text(stakeholder.name || "Stakeholder", 14, 90);
    doc.text(`Project: ${details.projectId}`, 14, 95);

    doc.setFont(undefined, 'bold');
    doc.text("Voucher No:", 140, 85);
    doc.text("Date:", 140, 90);

    doc.setFont(undefined, 'normal');
    doc.text(`PAY-${stakeholder.id}-${Date.now().toString().slice(-4)}`, 170, 85);
    doc.text(new Date().toLocaleDateString(), 170, 90);

    autoTable(doc, {
        startY: 105,
        head: [['#', 'Item & Description', 'Share %', `Amount (${currency})`]],
        body: [[1, `Payment Disbursement - ${stakeholder.name}`, `${stakeholder.percentage}%`, `${currency} ${payAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`]],
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] }, // Blue Header
        styles: { halign: 'left' },
        columnStyles: { 0: { halign: 'center', width: 10 }, 3: { halign: 'right' } }
    });

    let finalY = doc.lastAutoTable.finalY + 10;

    // Summary
    doc.setFontSize(10);
    doc.text(`Subtotal:`, 140, finalY);
    doc.text(`${currency} ${payAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 195, finalY, { align: 'right' });

    if (taxRate > 0) {
        finalY += 6;
        doc.text(`Add GST (${taxRate}%):`, 140, finalY);
        doc.text(`+ ${currency} ${taxAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 195, finalY, { align: 'right' });
    }

    doc.setDrawColor(200); doc.line(140, finalY + 4, 200, finalY + 4);
    finalY += 10;

    // Green Background for Net Amount (mimicking the Excel/Image style)
    doc.setFillColor(39, 174, 96);
    doc.rect(135, finalY - 6, 65, 10, 'F');
    doc.setTextColor(255); doc.setFont(undefined, 'bold');
    doc.text(`Net Pay:`, 140, finalY);
    doc.text(`${currency} ${netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 195, finalY, { align: 'right' });

    // Footer Signatures
    doc.setTextColor(0); doc.setFont(undefined, 'normal');
    finalY += 30;
    doc.text("For AMBOT365 RPA & IT SOLUTIONS", 195, finalY, { align: 'right' });
    doc.text("(Authorized Signatory)", 195, finalY + 15, { align: 'right' });

    doc.save(`Payment_Voucher_${(stakeholder.name || 'stakeholder').replace(/[^a-z0-9]/gi, '_')}.pdf`);
};
